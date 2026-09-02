import { MORNING_LENGTH, type Minutes } from "../types/clock";
import type { Action as FreeAction, ConditionDelta, Segment } from "../types/action";
import type { GameState, InterruptChoice, LogEntry } from "../types/game";
import type { RestingMode, SegmentRun, SegmentSource } from "../types/mode";
import type { PlaceId } from "../types/place";
import { durationOptions, interruptionGuard, isSpent, resumeIndex } from "../engine/actions";
import { isMorningOver } from "../engine/clock";
import { applyElapsed, clampCondition } from "../engine/condition";
import { travelMinutes } from "../engine/places";
import { dueAppointment, dueInterrupt, moveAppointment } from "../engine/schedule";
import { placeById } from "../data/places";
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
  | { type: "RESTART_MORNING" }
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
}

function scriptOf(action: FreeAction): Script {
  return {
    label: action.label,
    segments: action.segments,
    perSegment: action.perSegment,
    repeatable: action.repeatable,
  };
}

function scriptFor(source: SegmentSource): Script | null {
  const action = findAction(source.actionId);
  return action ? scriptOf(action) : null;
}

/** 続けて歩いた一分は一行にまとめる。廊下を抜けた記録が並ぶと読みにくい。 */
function pushMove(log: LogEntry[], label: string, minutes: Minutes, startedAt: Minutes): LogEntry[] {
  const last = log[log.length - 1];
  if (last?.move && last.startedAt + last.minutes === startedAt) {
    return [...log.slice(0, -1), { ...last, label, minutes: last.minutes + minutes }];
  }
  return [...log, { label, minutes, startedAt, move: true }];
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
  if (state.phase !== "morning") return state;

  const appointment = dueAppointment(state, state.clock);
  if (appointment) {
    return { ...state, mode: { kind: "appointment", appointmentId: appointment.id } };
  }

  if (isMorningOver(state.clock)) {
    return { ...state, phase: "review" };
  }

  return state;
}

/**
 * 自分から届くもの。セグメントの切れ目ごとに呼ぶ（設計書26章）。
 * 予定変更はプレイヤーが答える前、鳴った瞬間に当てる — どう答えても
 * 起きることなので、選択の結果に見えてはいけない。
 */
function settleSoft(state: GameState): GameState {
  if (state.phase !== "morning") return state;
  // 起床中は鳴らさない。割り込みの入れ子も作らない。
  if (state.mode.kind === "wake" || state.mode.kind === "interrupt") return state;
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

  const afterElapsed = applyElapsed(state.condition, spent);
  const condition = fits
    ? clampCondition({
        fatigue: afterElapsed.fatigue + (script.perSegment?.fatigue ?? 0),
        hunger: afterElapsed.hunger + (script.perSegment?.hunger ?? 0),
      })
    : afterElapsed;

  const segmentIndex = fits ? run.segmentIndex + 1 : run.segmentIndex;

  const next: GameState = {
    ...state,
    clock: state.clock + spent,
    condition,
    highlights: fits && segment.highlight ? [...state.highlights, segment.highlight] : state.highlights,
    mode: {
      kind: "action",
      run: {
        ...run,
        segmentIndex,
        minutesSpent: run.minutesSpent + spent,
        interrupted: !fits,
        exhausted: fits && segmentIndex >= script.segments.length,
      },
    },
  };

  // 切れ目に着いたときだけ連絡が鳴る。予定に切られた回は鳴らさない —
  // 「そこで時間になった」を読ませてから、手が空いたところで届ける。
  return fits ? settleSoft(next) : next;
}

/** 走り終えた run の記録だけを残す。画面はここでは動かさない。 */
function recordRun(state: GameState, run: SegmentRun): GameState {
  const script = scriptFor(run.source);
  if (!script) return state;

  const actionId = run.source.actionId;
  const spent = run.minutesSpent;
  const usedUp = run.segmentIndex >= script.segments.length;

  return {
    ...state,
    log:
      spent > 0
        ? [...state.log, { label: script.label, minutes: spent, startedAt: run.startedAt }]
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
        condition: applyElapsed(state.condition, minutes),
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
        const closed =
          mode.resume.kind === "action"
            ? recordRun({ ...marked, mode: mode.resume }, mode.resume.run)
            : marked;

        const room = interruptionGuard(closed) - closed.clock;
        const spent = Math.max(0, Math.min(interrupt.minutes, room));

        return {
          ...closed,
          clock: closed.clock + spent,
          condition: applyElapsed(closed.condition, spent),
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

    case "RESOLVE_APPOINTMENT": {
      if (state.mode.kind !== "appointment") return state;
      const appointmentId = state.mode.appointmentId;
      const appointment = state.appointments.find((candidate) => candidate.id === appointmentId);
      if (!appointment) return state;

      const clock = Math.min(MORNING_LENGTH, state.clock + appointment.minutes);
      const spent = clock - state.clock;

      return settle({
        ...state,
        clock,
        place: appointment.movesTo ?? state.place,
        condition: applyElapsed(state.condition, spent),
        appointments: state.appointments.map((candidate) =>
          candidate.id === appointment.id ? { ...candidate, resolved: true } : candidate,
        ),
        mode: { kind: "place" },
        log:
          spent > 0
            ? [...state.log, { label: appointment.label, minutes: spent, startedAt: state.clock }]
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
      // 次の予定に入らない長さは選べない。押せてしまう経路も塞いでおく。
      if (target !== null && !durationOptions(state, action).some((o) => o.minutes === target && o.available)) {
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

    case "RESTART_MORNING":
      return createInitialState(state.player);

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
}
