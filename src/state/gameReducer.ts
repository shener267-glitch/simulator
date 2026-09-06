import type { Speed } from "../types/clock";
import { minutesPerTick } from "../engine/clock";
import type { FeedEntry, GameState, PendingEffect } from "../types/game";
import { currentMeeting, findMeeting, meetingCeiling, offeredChoices } from "../engine/meeting";
import { makeFiredCrisis, rollChildren, rollStandalone } from "../engine/crisis";
import { findCrisis } from "../data/crises/catalogue";
import { applyNationDelta } from "../engine/nation";
import { createInitialState } from "./initialState";

export type GameAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_SPEED"; speed: Speed }
  /** 一分ずつ、最大speed分だけ進める。予定・危機・報告の到着はここでしか起きない。 */
  | { type: "TICK" }
  /** 会議の開幕を読み終えて、話題を選ぶ段へ。 */
  | { type: "MEETING_BEGIN" }
  /** 会議の中で話題を一つ選ぶ。枠の中で分を使う（設計書15章）。 */
  | { type: "MEETING_CHOOSE"; choiceId: string }
  /** 返事を読み終えて話題の一覧に戻る。枠が尽きていれば締めへ。 */
  | { type: "MEETING_BACK" }
  /** 会議を終える。残った枠は締めの中で消える。 */
  | { type: "END_MEETING" }
  /** 締めを読み終えて、予定を閉じる。 */
  | { type: "RESOLVE_APPOINTMENT" }
  /** 危機イベントの通知を読み終えて、本画面へ戻る。 */
  | { type: "ACK_CRISIS" }
  /** 報告書を読む。設計上、時間は消費しない。 */
  | { type: "READ_REPORT"; reportId: string }
  /** 政策を決める。正解は無い（設計書29章）。 */
  | { type: "DECIDE_POLICY"; policyId: string; optionId: string }
  | { type: "NEW_GAME" };

function addFlags(flags: string[], added?: string[]): string[] {
  if (!added?.length) return flags;
  const next = [...flags];
  for (const flag of added) if (!next.includes(flag)) next.push(flag);
  return next;
}

function pushFeed(feed: FeedEntry[], entry: FeedEntry): FeedEntry[] {
  return [...feed, entry];
}

/**
 * ちょうど一分だけ進める。到着物はすべて「その分になった瞬間」に一度だけ
 * 判定する——1分ずつ律儀に進めているからこそ、倍速でも取りこぼさない。
 */
function advanceOneMinute(state: GameState): GameState {
  const at = state.clock.totalMinutes + 1;
  let working: GameState = { ...state, clock: { ...state.clock, totalMinutes: at } };

  // 1. 遅延していた効果の反映（設計書19章）。
  const due = working.pendingEffects.filter((effect) => effect.at <= at);
  if (due.length > 0) {
    let nation = working.nation;
    let feed = working.feed;
    for (const effect of due) {
      nation = applyNationDelta(nation, effect.delta);
      if (effect.note) {
        feed = pushFeed(feed, { id: `effect-${effect.id}`, at, icon: "📈", text: effect.note, kind: "policy" });
      }
    }
    const remaining: PendingEffect[] = working.pendingEffects.filter((effect) => effect.at > at);
    working = { ...working, nation, feed, pendingEffects: remaining };
  }

  // 2. 報告書の到着。緊急のものは、その場でゲームを自動停止する（設計書16章）。
  const arriving = working.reports.filter((report) => report.at === at);
  if (arriving.length > 0) {
    let feed = working.feed;
    let running = working.clock.running;
    for (const report of arriving) {
      feed = pushFeed(feed, {
        id: `report-${report.id}`,
        at,
        icon: report.urgent ? "🚨" : "📄",
        text: `${report.from}から「${report.title}」が届いた。`,
        kind: report.urgent ? "urgent" : "report",
      });
      if (report.urgent) running = false;
    }
    working = { ...working, feed, clock: { ...working.clock, running } };
  }

  // 3. 予定の時刻が来た。場面があれば会議として開き、時計を止める。
  if (working.mode.kind === "main") {
    const dueAppointment = working.appointments.find((a) => !a.resolved && a.at === at);
    if (dueAppointment) {
      const meeting = findMeeting(dueAppointment.id);
      if (meeting) {
        working = {
          ...working,
          clock: { ...working.clock, running: false },
          mode: { kind: "meeting", appointmentId: dueAppointment.id, startedAt: at, stage: "opening", showing: null, taken: [] },
          feed: pushFeed(working.feed, {
            id: `appt-${dueAppointment.id}`,
            at,
            icon: "🗓️",
            text: `${dueAppointment.label}の時刻になった。`,
            kind: "appointment",
          }),
        };
      } else {
        // 場面の無い予定（移動・待機など）はそのまま流れて終わる。
        working = {
          ...working,
          appointments: working.appointments.map((a) => (a.id === dueAppointment.id ? { ...a, resolved: true } : a)),
          feed: pushFeed(working.feed, {
            id: `appt-${dueAppointment.id}`,
            at,
            icon: "🗓️",
            text: `${dueAppointment.label}が終わった。`,
            kind: "appointment",
          }),
        };
      }
    }
  }

  // 4. 危機の判定。他の何かがすでにこの分で時計を止めていたら重ねて判定しない。
  if (working.mode.kind === "main" && working.clock.running) {
    const fired = rollStandalone(working, at);
    if (fired) {
      const parent = makeFiredCrisis(fired, at);
      const children = rollChildren(fired.id, working, at).map((child) => makeFiredCrisis(child, at));
      const allFired = [parent, ...children];
      working = {
        ...working,
        crises: [...working.crises, ...allFired],
        clock: { ...working.clock, running: false },
        mode: { kind: "event", crisisId: parent.id },
        feed: allFired.reduce(
          (feed, crisis) =>
            pushFeed(feed, {
              id: `crisis-${crisis.id}`,
              at,
              icon: "🚨",
              text: `${findCrisis(crisis.templateId)?.label ?? crisis.templateId}が発生した。`,
              kind: "crisis",
            }),
          working.feed,
        ),
      };
    }
  }

  return working;
}

function tick(state: GameState): GameState {
  if (!state.clock.running) return state;
  const steps = minutesPerTick(state.clock.speed);
  let working = state;
  for (let i = 0; i < steps; i++) {
    if (!working.clock.running) break;
    working = advanceOneMinute(working);
  }
  return working;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLAY":
      return state.mode.kind === "main" ? { ...state, clock: { ...state.clock, running: true } } : state;

    case "PAUSE":
      return { ...state, clock: { ...state.clock, running: false } };

    case "SET_SPEED":
      return { ...state, clock: { ...state.clock, speed: action.speed } };

    case "TICK":
      return tick(state);

    case "MEETING_BEGIN": {
      if (state.mode.kind !== "meeting" || state.mode.stage !== "opening") return state;
      return { ...state, mode: { ...state.mode, stage: "choices" } };
    }

    case "MEETING_CHOOSE": {
      if (state.mode.kind !== "meeting" || state.mode.stage !== "choices") return state;
      const mode = state.mode;
      const offered = offeredChoices(state).find((candidate) => candidate.choice.id === action.choiceId);
      // 枠に入らない話題は選べない。会議は伸ばせないので、ここは拒否でよい。
      if (!offered || !offered.fits) return state;
      const choice = offered.choice;

      const after = state.clock.totalMinutes + choice.minutes;
      const pendingEffects = choice.delayedEffect
        ? [
            ...state.pendingEffects,
            {
              id: `${choice.id}-${after}`,
              at: after + choice.delayedEffect.afterMinutes,
              delta: choice.delayedEffect.delta,
              note: choice.delayedEffect.note,
            },
          ]
        : state.pendingEffects;

      return {
        ...state,
        clock: { ...state.clock, totalMinutes: after },
        pendingEffects,
        flags: addFlags(state.flags, choice.flags),
        feed: choice.highlight
          ? pushFeed(state.feed, { id: `beat-${choice.id}-${after}`, at: after, icon: "💬", text: choice.highlight, kind: "news" })
          : state.feed,
        mode: { ...mode, stage: "reply", showing: choice.id, taken: [...mode.taken, choice.id] },
      };
    }

    case "MEETING_BACK": {
      if (state.mode.kind !== "meeting" || state.mode.stage !== "reply") return state;
      // 枠を使い切っていたら、話題の一覧に戻さずそのまま締めへ。
      const noRoomLeft = offeredChoices({ ...state, mode: { ...state.mode, stage: "choices" } }).every(
        (candidate) => !candidate.fits,
      );
      return { ...state, mode: { ...state.mode, stage: noRoomLeft ? "closing" : "choices", showing: null } };
    }

    case "END_MEETING": {
      if (state.mode.kind !== "meeting" || state.mode.stage === "closing") return state;
      return { ...state, mode: { ...state.mode, stage: "closing", showing: null } };
    }

    case "RESOLVE_APPOINTMENT": {
      if (state.mode.kind !== "meeting") return state;
      const current = currentMeeting(state);
      if (!current) return state;
      // 席を立った時刻を天井で丸める——延長しても、次の予定の十分前は必ず守る。
      const clock = Math.min(meetingCeiling(state), state.clock.totalMinutes);
      return {
        ...state,
        clock: { ...state.clock, totalMinutes: clock, running: true },
        appointments: state.appointments.map((a) => (a.id === current.appointment.id ? { ...a, resolved: true } : a)),
        mode: { kind: "main" },
        feed: pushFeed(state.feed, {
          id: `resolved-${current.appointment.id}`,
          at: clock,
          icon: "✅",
          text: `${current.appointment.label}が終わった。`,
          kind: "appointment",
        }),
      };
    }

    case "ACK_CRISIS": {
      if (state.mode.kind !== "event") return state;
      const crisisId = state.mode.crisisId;
      return {
        ...state,
        crises: state.crises.map((c) => (c.id === crisisId ? { ...c, acknowledged: true } : c)),
        mode: { kind: "main" },
        clock: { ...state.clock, running: true },
      };
    }

    case "READ_REPORT": {
      const report = state.reports.find((r) => r.id === action.reportId);
      // 届く前の報告書は読めない。読むこと自体は時間を使わない（設計書17章）。
      if (!report || report.read || report.at > state.clock.totalMinutes) return state;
      return {
        ...state,
        reports: state.reports.map((r) => (r.id === report.id ? { ...r, read: true } : r)),
        flags: addFlags(state.flags, report.flags),
      };
    }

    case "DECIDE_POLICY": {
      const policy = state.policies.find((p) => p.id === action.policyId);
      if (!policy || policy.decided || policy.from > state.clock.totalMinutes) return state;
      if (policy.requiresFlags && !policy.requiresFlags.every((flag) => state.flags.includes(flag))) return state;
      const option = policy.options.find((o) => o.id === action.optionId);
      if (!option) return state;

      const pendingEffects = option.delayedEffect
        ? [
            ...state.pendingEffects,
            {
              id: `${policy.id}-${option.id}`,
              at: state.clock.totalMinutes + option.delayedEffect.afterMinutes,
              delta: option.delayedEffect.delta,
              note: option.delayedEffect.note,
            },
          ]
        : state.pendingEffects;

      return {
        ...state,
        policies: state.policies.map((p) => (p.id === policy.id ? { ...p, decided: option.id } : p)),
        pendingEffects,
        flags: addFlags(state.flags, option.flags),
        feed: pushFeed(state.feed, {
          id: `policy-${policy.id}`,
          at: state.clock.totalMinutes,
          icon: "📜",
          text: `「${policy.title}」について、${option.label}の方針を決めた。`,
          kind: "policy",
        }),
      };
    }

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
}
