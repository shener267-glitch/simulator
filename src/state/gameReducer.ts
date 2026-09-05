import { DAY_LENGTH, type Minutes } from "../types/clock";
import type { Action as FreeAction, ConditionDelta, Segment } from "../types/action";
import type { GameState, InterruptChoice, LogEntry } from "../types/game";
import type { RestingMode, SegmentRun, SegmentSource } from "../types/mode";
import type { PlaceId } from "../types/place";
import { durationOptions, interruptionGuard, isSpent, resumeIndex } from "../engine/actions";
import { isDayOver } from "../engine/clock";
import { canGoToBed, carriedFatigue } from "../engine/sleep";
import { applyElapsed, clampCondition } from "../engine/condition";
import { travelMinutes } from "../engine/places";
import { dueAppointment, dueInterrupt, moveAppointment } from "../engine/schedule";
import { findMeeting, offeredChoices } from "../engine/meeting";
import { choicesAt, reachMinutes, reachableFrom } from "../engine/talk";
import { nodeOf, choiceOf } from "../types/talk";
import { placeById } from "../data/places";
import { findTree } from "../data/talk";
import { findAction } from "../data/actions";
import { createInitialState } from "./initialState";

export type GameAction =
  /** 起床シーンを閉じる。時間は使わない。 */
  | { type: "FINISH_WAKE" }
  /** 隣の部屋へ。一分を払い、ログに残す。 */
  | { type: "MOVE_TO"; place: PlaceId }
  | { type: "RESOLVE_APPOINTMENT" }
  /** 割り込みの三択（設計書26章）。 */
  | { type: "ANSWER_INTERRUPT"; choice: InterruptChoice }
  /** 出て、読み終えた連絡を閉じる。 */
  | { type: "CLOSE_INTERRUPT" }
  /** 行動を選ぶ。長さを聞く余地があれば「どのくらい？」へ、なければすぐ始める。 */
  | { type: "CHOOSE_ACTION"; actionId: string }
  /** 「どのくらい？」をやめる。時間は動かない。 */
  | { type: "CANCEL_DURATION" }
  /** targetMinutes は「どのくらい？」の答え。時間の計算には効かない。 */
  | { type: "START_ACTION"; actionId: string; targetMinutes?: Minutes }
  | { type: "CONTINUE_SEGMENT" }
  | { type: "STOP_ACTION" }
  /** 相手を選ぶ。時間は使わない。 */
  | { type: "OPEN_TALK"; treeId: string }
  /** 「指示を出す」「相談する」など、枝を移る。時間は使わない。 */
  | { type: "TALK_GOTO"; nodeId: string }
  /** 話題を選ぶ。返事の分だけ時間を使う。 */
  | { type: "TALK_CHOOSE"; choiceId: string }
  /** 返事を読み終えて話題の一覧に戻る。 */
  | { type: "TALK_BACK" }
  /** 切る。会話全体を一行にしてログに残す。 */
  | { type: "END_TALK" }
  /** 会議の開幕を読み終えて、話題を選ぶ段へ。 */
  | { type: "MEETING_BEGIN" }
  /** 会議の中で話題を一つ選ぶ。枠の中で分を使う（設計書15章）。 */
  | { type: "MEETING_CHOOSE"; choiceId: string }
  /** 返事を読み終えて話題の一覧に戻る。枠が尽きていれば締めへ。 */
  | { type: "MEETING_BACK" }
  /** 会議を終える。残った枠は締めの中で消える。 */
  | { type: "END_MEETING" }
  /** 後回しにした連絡を読む。読むにも時間はかかる。 */
  | { type: "READ_MESSAGE"; messageId: string }
  | { type: "GO_TO_BED" }
  | { type: "RESTART_DAY" }
  | { type: "NEW_GAME" };

/**
 * セグメントを持つものはすべてこの形に均される。行動も、いずれ足す会話の
 * 返事も同じ機構で走らせて、中断のルールが一箇所にしかない状態を保つ。
 */
interface Script {
  label: string;
  segments: Segment[];
  perSegment?: ConditionDelta;
  repeatable?: boolean;
  /** false のものは run ごとにはログを書かない。会話は END_TALK でまとめる。 */
  logged: boolean;
}

function scriptOf(action: FreeAction): Script {
  return {
    label: action.label,
    segments: action.segments,
    perSegment: action.perSegment,
    repeatable: action.repeatable,
    logged: true,
  };
}

function scriptFor(source: SegmentSource): Script | null {
  if (source.kind === "action") {
    const action = findAction(source.actionId);
    return action ? scriptOf(action) : null;
  }

  const tree = findTree(source.treeId);
  const choice = tree && choiceOf(tree, source.choiceId);
  if (!choice || choice.kind !== "topic") return null;
  return { label: tree.short, segments: [choice.reply], logged: false };
}

/** 続けて歩いた一分は一行にまとめる。廊下を抜けた記録が並ぶと読みにくい。 */
function pushMove(log: LogEntry[], label: string, minutes: Minutes, startedAt: Minutes): LogEntry[] {
  const last = log[log.length - 1];
  if (last?.move && last.startedAt + last.minutes === startedAt) {
    return [...log.slice(0, -1), { ...last, label, minutes: last.minutes + minutes }];
  }
  return [...log, { label, minutes, startedAt, move: true }];
}

/**
 * 続けて同じことをした分も一行にまとめる。何度でもできる行動（仮眠、一息つく、
 * ぼーっとする）を三時間続けると、同じ行が二十本並んで記録が読めなくなる。
 * 「一息つく 3時間20分」の方が、その午後がどうだったかは正確に伝わる。
 */
function pushEntry(log: LogEntry[], label: string, minutes: Minutes, startedAt: Minutes): LogEntry[] {
  const last = log[log.length - 1];
  if (last && !last.move && last.label === label && last.startedAt + last.minutes === startedAt) {
    return [...log.slice(0, -1), { ...last, minutes: last.minutes + minutes }];
  }
  return [...log, { label, minutes, startedAt }];
}

/** 予定が終わる時刻。枠は開始時刻に固定されていて、着席の早い遅いでは動かない。 */
function appointmentEnd(appointment: { at: Minutes; minutes: Minutes }): Minutes {
  return appointment.at + appointment.minutes;
}

/**
 * 一日を閉じる。自分で寝たのか、日付が変わったのかだけを分けて記録する。
 * 翌朝へ持ち越す疲労はここで確定させる — 遅く寝たことの代償はこれで全部で、
 * 点数も評価も出さない（本セッションでの決定）。
 */
function closeDay(state: GameState, forced: boolean): GameState {
  return {
    ...state,
    phase: "review",
    mode: { kind: "place" },
    sleep: {
      at: state.clock,
      forced,
      carriedFatigue: carriedFatigue(state.condition.fatigue, state.clock),
    },
  };
}

function addFlags(flags: string[], added?: string[]): string[] {
  if (!added?.length) return flags;
  const next = [...flags];
  for (const flag of added) if (!next.includes(flag)) next.push(flag);
  return next;
}

/**
 * 予定と朝の終わり。手が空いたときにだけ呼ぶ。セグメントの途中で呼ぶと、
 * 切られた瞬間に予定の画面へ飛んでしまい、「——そこで時間になった。」を
 * 読む間がなくなる。
 */
function settleHard(state: GameState): GameState {
  if (state.phase !== "day") return state;

  const appointment = dueAppointment(state, state.clock);
  if (appointment) {
    // 場面のある予定は会議として開く。移動だけの予定は読んで確認するだけ。
    return {
      ...state,
      mode: findMeeting(appointment.id)
        ? {
            kind: "meeting",
            appointmentId: appointment.id,
            startedAt: state.clock,
            stage: "opening",
            showing: null,
            taken: [],
          }
        : { kind: "appointment", appointmentId: appointment.id },
    };
  }

  // 24:00。自分で寝なかった場合は、ここで一日が閉じる。
  if (isDayOver(state.clock)) {
    return closeDay(state, true);
  }

  return state;
}

/**
 * 自分から届くもの。セグメントの切れ目ごとに呼ぶ（設計書26章）。
 * 予定変更はプレイヤーが答える前、鳴った瞬間に当てる — どう答えても
 * 起きることなので、選択の結果に見えてはいけない。
 */
function settleSoft(state: GameState): GameState {
  if (state.phase !== "day") return state;
  // 日付が変わっていたら、もう鳴らさない。一日が閉じたあとで携帯が鳴っても
  // 出る先がない — 24:00をまたいだ連絡は、そのまま届かなかったことにする。
  if (isDayOver(state.clock)) return state;
  // 起床中は鳴らさない。割り込みの入れ子も作らない。会議の最中も鳴らさない —
  // 閣議の途中で携帯に出る総理はいないし、枠の中で時間を食われても困る。
  if (state.mode.kind === "wake" || state.mode.kind === "interrupt") return state;
  if (state.mode.kind === "meeting") return state;
  const resume: RestingMode = state.mode;

  const interrupt = dueInterrupt(state, state.clock);
  if (!interrupt) return state;

  const move = interrupt.movesAppointment;
  return {
    ...state,
    // 切れ目まで遅れて鳴ると、繰り上げ先がもう過去のことがある。現在時刻で止める。
    appointments: move
      ? moveAppointment(state.appointments, move.appointmentId, move.to, state.clock)
      : state.appointments,
    interrupts: state.interrupts.map((candidate) =>
      candidate.id === interrupt.id ? { ...candidate, fired: true } : candidate,
    ),
    highlights: [...state.highlights, interrupt.highlight],
    mode: { kind: "interrupt", interruptId: interrupt.id, answered: false, resume },
  };
}

/** 手が空いた。予定が先に立ち、そのうえで連絡が鳴る。 */
function settle(state: GameState): GameState {
  return settleSoft(settleHard(state));
}

/**
 * Consume one segment. If it does not fit before the next interruption, the
 * player gets the minutes that were actually left and the run is cut short
 * (設計書13章・19章). The segment itself stays unread, so it can be picked up
 * again later.
 */
function consumeSegment(state: GameState, script: Script, run: SegmentRun): GameState {
  const segment = script.segments[run.segmentIndex];
  if (!segment) return state;

  const remaining = interruptionGuard(state) - state.clock;
  const fits = segment.minutes <= remaining;
  const spent = fits ? segment.minutes : Math.max(0, remaining);

  const clock = state.clock + spent;
  const afterElapsed = applyElapsed(state.condition, spent, clock);
  const condition = fits
    ? clampCondition(
        {
          fatigue: afterElapsed.fatigue + (script.perSegment?.fatigue ?? 0),
          hunger: afterElapsed.hunger + (script.perSegment?.hunger ?? 0),
        },
        clock,
      )
    : afterElapsed;

  const segmentIndex = fits ? run.segmentIndex + 1 : run.segmentIndex;

  const advanced: SegmentRun = {
    ...run,
    segmentIndex,
    minutesSpent: run.minutesSpent + spent,
    interrupted: !fits,
    exhausted: fits && segmentIndex >= script.segments.length,
  };

  const next: GameState = {
    ...state,
    clock,
    condition,
    highlights: fits && segment.highlight ? [...state.highlights, segment.highlight] : state.highlights,
    flags: fits ? addFlags(state.flags, segment.flags) : state.flags,
    // 会話の中で走らせているなら会話の画面のまま。それ以外は行動の画面。
    mode: state.mode.kind === "talk" ? { ...state.mode, run: advanced } : { kind: "action", run: advanced },
  };

  // 切れ目に着いたときだけ連絡が鳴る。予定に切られた回は鳴らさない —
  // 「そこで時間になった」を読ませてから、手が空いたところで届ける。
  return fits ? settleSoft(next) : next;
}

/** 走り終えた run の記録だけを残す。画面はここでは動かさない。 */
function recordRun(state: GameState, run: SegmentRun): GameState {
  const script = scriptFor(run.source);
  if (!script) return state;
  // 会話の返事は、一区切りごとではなく会話ごとに一行にする。
  if (run.source.kind !== "action") return state;

  const actionId = run.source.actionId;
  const spent = run.minutesSpent;
  const usedUp = run.segmentIndex >= script.segments.length;

  return {
    ...state,
    log:
      script.logged && spent > 0
        ? pushEntry(state.log, script.label, spent, run.startedAt)
        : state.log,
    spentActions:
      usedUp && !script.repeatable && !state.spentActions.includes(actionId)
        ? [...state.spentActions, actionId]
        : state.spentActions,
    actionProgress: { ...state.actionProgress, [actionId]: run.segmentIndex },
  };
}

/** ここで始められる行動。現在地にないもの、読み切ったものは返さない。 */
function available(state: GameState, actionId: string): FreeAction | null {
  const action = findAction(actionId);
  if (!action) return null;
  // 現在地でできないことは、そもそも起こらない（設計書16章）。
  if (!action.places.includes(state.place)) return null;
  // 時間帯も同じ。朝刊は夜には無いし、夕食は朝には出ていない。
  if (action.from !== undefined && state.clock < action.from) return null;
  if (action.until !== undefined && state.clock >= action.until) return null;
  if (isSpent(state, action)) return null;
  return action;
}

function beginAction(state: GameState, action: FreeAction, target: Minutes | null): GameState {
  return consumeSegment(state, scriptOf(action), {
    source: { kind: "action", actionId: action.id },
    segmentIndex: resumeIndex(state, action),
    minutesSpent: 0,
    startedAt: state.clock,
    targetMinutes: target,
    interrupted: false,
    exhausted: false,
  });
}

/** Close out the running action: record the time, then see what is waiting. */
function finishRun(state: GameState): GameState {
  if (state.mode.kind !== "action") return state;
  return settle({ ...recordRun(state, state.mode.run), mode: { kind: "place" } });
}

/**
 * 会話はひと続きで一行にする。話題ごとに「沢渡 10分」が並ぶより、
 * 「沢渡と話した 30分」のほうが、あとから読んで朝の形が見える。
 */
function recordTalk(state: GameState): GameState {
  if (state.mode.kind !== "talk") return state;
  const mode = state.mode;
  const tree = findTree(mode.treeId);
  const spent = mode.minutesSpent + (mode.run?.minutesSpent ?? 0);
  if (!tree || spent <= 0) return state;

  return {
    ...state,
    log: [...state.log, { label: `${tree.short}と話した`, minutes: spent, startedAt: mode.startedAt }],
  };
}

function endTalk(state: GameState): GameState {
  if (state.mode.kind !== "talk") return state;
  return settle({ ...recordTalk(state), mode: { kind: "place" } });
}

export function gameReducer(state: GameState, gameAction: GameAction): GameState {
  switch (gameAction.type) {
    case "FINISH_WAKE": {
      if (state.mode.kind !== "wake") return state;
      return settle({ ...state, mode: { kind: "place" } });
    }

    case "MOVE_TO": {
      if (state.mode.kind !== "place") return state;
      const minutes = travelMinutes(state.place, gameAction.place);
      if (minutes === null) return state;

      const place = placeById(gameAction.place);
      return settle({
        ...state,
        clock: state.clock + minutes,
        place: gameAction.place,
        condition: applyElapsed(state.condition, minutes, state.clock + minutes),
        log: pushMove(state.log, `${place.short}へ移動`, minutes, state.clock),
      });
    }

    case "ANSWER_INTERRUPT": {
      if (state.mode.kind !== "interrupt" || state.mode.answered) return state;
      const mode = state.mode;
      const interrupt = state.interrupts.find((candidate) => candidate.id === mode.interruptId);
      if (!interrupt) return state;

      const choice = gameAction.choice;
      const marked: GameState = {
        ...state,
        flags: addFlags(state.flags, interrupt.flags?.[choice]),
        interrupts: state.interrupts.map((candidate) =>
          candidate.id === interrupt.id ? { ...candidate, answeredWith: choice } : candidate,
        ),
      };

      if (choice === "answer") {
        // 手を止めて出る。走っていた行動はここで終わり、使った分が記録される。
        // 走っていたものはここで終わる。使った分は取りこぼさずに記録する。
        const closed =
          mode.resume.kind === "action"
            ? recordRun({ ...marked, mode: mode.resume }, mode.resume.run)
            : mode.resume.kind === "talk"
              ? recordTalk({ ...marked, mode: mode.resume })
              : marked;

        const room = interruptionGuard(closed) - closed.clock;
        const spent = Math.max(0, Math.min(interrupt.minutes, room));

        return {
          ...closed,
          clock: closed.clock + spent,
          condition: applyElapsed(closed.condition, spent, closed.clock + spent),
          log:
            spent > 0
              ? [
                  ...closed.log,
                  { label: `${interrupt.from}からの連絡`, minutes: spent, startedAt: closed.clock },
                ]
              : closed.log,
          mode: { kind: "interrupt", interruptId: interrupt.id, answered: true, resume: { kind: "place" } },
        };
      }

      // 後回しにするか、無視するか。どちらも時間は使わず、元の画面に戻る。
      // 違うのは、あとから読めるかどうかだけ。
      const messages =
        choice === "defer"
          ? [
              ...marked.phone.messages,
              {
                id: interrupt.id,
                from: interrupt.message.from,
                at: marked.clock,
                body: interrupt.message.body,
                minutes: interrupt.message.minutes,
                flags: interrupt.message.flags,
                read: false,
              },
            ]
          : marked.phone.messages;

      return { ...marked, phone: { messages }, mode: mode.resume };
    }

    case "CLOSE_INTERRUPT": {
      if (state.mode.kind !== "interrupt" || !state.mode.answered) return state;
      return settle({ ...state, mode: { kind: "place" } });
    }

    case "MEETING_BEGIN": {
      if (state.mode.kind !== "meeting" || state.mode.stage !== "opening") return state;
      return { ...state, mode: { ...state.mode, stage: "choices" } };
    }

    case "MEETING_CHOOSE": {
      if (state.mode.kind !== "meeting" || state.mode.stage !== "choices") return state;
      const mode = state.mode;
      const offered = offeredChoices(state).find(
        (candidate) => candidate.choice.id === gameAction.choiceId,
      );
      // 枠に入らない話題は選べない。会議は伸ばせないので、ここは警告ではなく拒否。
      if (!offered || !offered.fits) return state;
      const choice = offered.choice;

      const after = state.clock + choice.minutes;
      const elapsed = applyElapsed(state.condition, choice.minutes, after);
      return {
        ...state,
        clock: after,
        condition: clampCondition(
          {
            fatigue: elapsed.fatigue + (choice.condition?.fatigue ?? 0),
            hunger: elapsed.hunger + (choice.condition?.hunger ?? 0),
          },
          after,
        ),
        flags: addFlags(state.flags, choice.flags),
        highlights: choice.highlight ? [...state.highlights, choice.highlight] : state.highlights,
        mode: {
          ...mode,
          stage: "reply",
          showing: choice.id,
          taken: [...mode.taken, choice.id],
        },
      };
    }

    case "MEETING_BACK": {
      if (state.mode.kind !== "meeting" || state.mode.stage !== "reply") return state;
      // 枠を使い切っていたら、話題の一覧に戻さずそのまま締めへ。
      const noRoomLeft = offeredChoices({
        ...state,
        mode: { ...state.mode, stage: "choices" },
      }).every((candidate) => !candidate.fits);

      return {
        ...state,
        mode: { ...state.mode, stage: noRoomLeft ? "closing" : "choices", showing: null },
      };
    }

    case "END_MEETING": {
      if (state.mode.kind !== "meeting" || state.mode.stage === "closing") return state;
      return { ...state, mode: { ...state.mode, stage: "closing", showing: null } };
    }

    case "RESOLVE_APPOINTMENT": {
      if (state.mode.kind !== "appointment" && state.mode.kind !== "meeting") return state;
      const appointmentId = state.mode.appointmentId;
      const appointment = state.appointments.find((candidate) => candidate.id === appointmentId);
      if (!appointment) return state;

      // 移動だけの予定は開始時刻からの固定枠として終わる。着席が一分遅れた
      // ぶんだけ終わりまでずれると、八件並んだ一日では遅れが積み上がる。
      //
      // 会議は違う。プレイヤーが席を立つと決めた時刻で終わる（本セッションでの
      // 決定）— 早く切り上げれば午後が伸び、延ばせばその分どこかが削れる。
      const clock =
        state.mode.kind === "meeting"
          ? Math.min(DAY_LENGTH, state.clock)
          : Math.max(state.clock, Math.min(DAY_LENGTH, appointmentEnd(appointment)));
      const spent = clock - state.clock;
      // 会議は席についたところから一行にまとめる。中で使った分は選択肢の側で
      // すでに時計を進めているので、ここで数え直さないと記録から抜け落ちる。
      const openedAt = state.mode.kind === "meeting" ? state.mode.startedAt : state.clock;

      return settle({
        ...state,
        clock,
        place: appointment.movesTo ?? state.place,
        condition: applyElapsed(state.condition, spent, state.clock + spent),
        appointments: state.appointments.map((candidate) =>
          candidate.id === appointment.id ? { ...candidate, resolved: true } : candidate,
        ),
        mode: { kind: "place" },
        log:
          clock > openedAt
            ? [...state.log, { label: appointment.label, minutes: clock - openedAt, startedAt: openedAt }]
            : state.log,
        highlights: appointment.highlight
          ? [...state.highlights, appointment.highlight]
          : state.highlights,
      });
    }

    case "CHOOSE_ACTION": {
      if (state.mode.kind !== "place") return state;
      const action = available(state, gameAction.actionId);
      if (!action) return state;

      // 選べる長さが一つしかないなら、わざわざ聞かない。
      const options = durationOptions(state, action);
      if (options.length <= 1) return beginAction(state, action, null);

      return { ...state, mode: { kind: "duration", actionId: action.id } };
    }

    case "CANCEL_DURATION": {
      if (state.mode.kind !== "duration") return state;
      return { ...state, mode: { kind: "place" } };
    }

    case "START_ACTION": {
      if (state.mode.kind !== "place" && state.mode.kind !== "duration") return state;
      const action = available(state, gameAction.actionId);
      if (!action) return state;

      const target = gameAction.targetMinutes ?? null;
      // 差し出した長さかどうかだけを確かめる。次の予定に入るかどうかは見ない —
      // 入らない長さも警告のうえで選べる（設計書6章）。跨いだぶんは中断の
      // ルールが切って、消化した分だけを課金する。
      if (target !== null && !durationOptions(state, action).some((o) => o.minutes === target)) {
        return state;
      }

      return beginAction(state, action, target);
    }

    case "CONTINUE_SEGMENT": {
      if (state.mode.kind !== "action") return state;
      const run = state.mode.run;
      if (run.interrupted || run.exhausted) return state;
      const script = scriptFor(run.source);
      if (!script) return state;
      return consumeSegment(state, script, run);
    }

    case "STOP_ACTION":
      return finishRun(state);

    case "OPEN_TALK": {
      if (state.mode.kind !== "place") return state;
      const entry = reachableFrom(state).find((candidate) => candidate.tree.id === gameAction.treeId);
      if (!entry) return state;
      const tree = entry.tree;

      // 呼んだ相手は、来るまでの分をこちらが待つ。会話の記録はそこから始める。
      const waited = reachMinutes(entry.reach);
      const startedAt = state.clock + waited;

      return {
        ...state,
        clock: startedAt,
        condition: applyElapsed(state.condition, waited, startedAt),
        mode: {
          kind: "talk",
          treeId: tree.id,
          nodeId: tree.rootId,
          startedAt,
          minutesSpent: 0,
          run: null,
        },
      };
    }

    case "TALK_GOTO": {
      if (state.mode.kind !== "talk" || state.mode.run) return state;
      const tree = findTree(state.mode.treeId);
      if (!tree || !nodeOf(tree, gameAction.nodeId)) return state;
      return { ...state, mode: { ...state.mode, nodeId: gameAction.nodeId } };
    }

    case "TALK_CHOOSE": {
      if (state.mode.kind !== "talk" || state.mode.run) return state;
      const mode = state.mode;
      const tree = findTree(mode.treeId);
      const node = tree && nodeOf(tree, mode.nodeId);
      if (!tree || !node) return state;

      const choice = choicesAt(state, tree, node).find(
        (candidate) => candidate.id === gameAction.choiceId,
      );
      if (!choice || choice.kind !== "topic") return state;

      // 一度きりの話題は選んだ時点で使い切る。予定に切られた話題を選び直せると、
      // 時間を払わずに同じ返事を引けてしまう。
      const used = state.talkProgress[tree.id] ?? [];
      const marked: GameState = {
        ...state,
        flags: addFlags(state.flags, choice.flags),
        talkProgress: choice.once
          ? { ...state.talkProgress, [tree.id]: [...used, choice.id] }
          : state.talkProgress,
      };

      return consumeSegment(marked, { label: tree.short, segments: [choice.reply], logged: false }, {
        source: { kind: "talk", treeId: tree.id, choiceId: choice.id },
        segmentIndex: 0,
        minutesSpent: 0,
        startedAt: marked.clock,
        targetMinutes: null,
        interrupted: false,
        exhausted: false,
      });
    }

    case "TALK_BACK": {
      if (state.mode.kind !== "talk") return state;
      const mode = state.mode;
      const finished = mode.run;
      if (!finished) return state;

      const folded = { ...mode, minutesSpent: mode.minutesSpent + finished.minutesSpent, run: null };

      // 予定に切られたなら、そこで話は終わり。
      if (finished.interrupted) return endTalk({ ...state, mode: folded });
      return { ...state, mode: folded };
    }

    case "END_TALK":
      return endTalk(state);

    case "READ_MESSAGE": {
      if (state.mode.kind !== "place") return state;
      const message = state.phone.messages.find(
        (candidate) => candidate.id === gameAction.messageId,
      );
      if (!message || message.read) return state;

      const room = interruptionGuard(state) - state.clock;
      const spent = Math.max(0, Math.min(message.minutes, room));

      return settle({
        ...state,
        clock: state.clock + spent,
        condition: applyElapsed(state.condition, spent, state.clock + spent),
        flags: addFlags(state.flags, message.flags),
        phone: {
          messages: state.phone.messages.map((candidate) =>
            candidate.id === message.id ? { ...candidate, read: true } : candidate,
          ),
        },
        log:
          spent > 0
            ? [
                ...state.log,
                { label: `${message.from}からのメッセージ`, minutes: spent, startedAt: state.clock },
              ]
            : state.log,
      });
    }

    case "GO_TO_BED": {
      // 寝室でしか寝られないし、予定が残っているうちは寝かせない。
      if (state.mode.kind !== "place") return state;
      if (!canGoToBed(state)) return state;
      return closeDay(state, false);
    }

    case "RESTART_DAY":
      return createInitialState(state.player);

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
}
