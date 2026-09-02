import { MORNING_LENGTH, type Minutes } from "../types/clock";
import type { Action as FreeAction, ConditionDelta, Segment } from "../types/action";
import type { GameState, LogEntry } from "../types/game";
import type { RestingMode, SegmentRun, SegmentSource } from "../types/mode";
import type { PlaceId } from "../types/place";
import { interruptionGuard } from "../engine/actions";
import { isMorningOver } from "../engine/clock";
import { applyElapsed, clampCondition } from "../engine/condition";
import { travelMinutes } from "../engine/places";
import { dueAppointment, dueEvent, moveAppointment } from "../engine/schedule";
import { placeById } from "../data/places";
import { findAction } from "../data/actions";
import { createInitialState } from "./initialState";

export type GameAction =
  /** 起床シーンを閉じる。時間は使わない。 */
  | { type: "FINISH_WAKE" }
  /** 隣の部屋へ。一分を払い、ログに残す。 */
  | { type: "MOVE_TO"; place: PlaceId }
  | { type: "RESOLVE_APPOINTMENT" }
  | { type: "DISMISS_EVENT" }
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

/**
 * 手が空いたときに呼ぶ。自分から届くものが予定より先に立つのは、それが
 * 予定そのものを動かすことがあるから。何も待っていないときだけ朝が終わる。
 */
function settle(state: GameState): GameState {
  if (state.phase !== "morning") return state;
  // 割り込みの入れ子は作らない。
  if (state.mode.kind === "event") return state;
  const resume: RestingMode = state.mode;

  const event = dueEvent(state, state.clock);
  if (event) {
    const move = event.movesAppointment;
    return {
      ...state,
      appointments: move
        ? moveAppointment(state.appointments, move.appointmentId, move.to, state.clock)
        : state.appointments,
      events: state.events.map((candidate) =>
        candidate.id === event.id ? { ...candidate, fired: true } : candidate,
      ),
      highlights: [...state.highlights, event.highlight],
      mode: { kind: "event", eventId: event.id, resume },
    };
  }

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

  return {
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
}

/** Close out the running action: record the time, then see what is waiting. */
function finishRun(state: GameState): GameState {
  if (state.mode.kind !== "action") return state;
  const run = state.mode.run;
  const script = scriptFor(run.source);
  if (!script) return { ...state, mode: { kind: "place" } };

  const actionId = run.source.actionId;
  const spent = run.minutesSpent;
  const usedUp = run.segmentIndex >= script.segments.length;

  return settle({
    ...state,
    mode: { kind: "place" },
    log:
      spent > 0
        ? [...state.log, { label: script.label, minutes: spent, startedAt: run.startedAt }]
        : state.log,
    spentActions:
      usedUp && !script.repeatable && !state.spentActions.includes(actionId)
        ? [...state.spentActions, actionId]
        : state.spentActions,
    actionProgress: { ...state.actionProgress, [actionId]: run.segmentIndex },
  });
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

    case "DISMISS_EVENT": {
      if (state.mode.kind !== "event") return state;
      return settle({ ...state, mode: state.mode.resume });
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

    case "START_ACTION": {
      if (state.mode.kind !== "place") return state;
      const action = findAction(gameAction.actionId);
      if (!action) return state;
      // 現在地でできないことは、そもそも起こらない（設計書16章）。
      if (!action.places.includes(state.place)) return state;
      if (state.spentActions.includes(action.id)) return state;

      const resumeAt = action.repeatable ? 0 : (state.actionProgress[action.id] ?? 0);
      if (resumeAt >= action.segments.length) return state;

      return consumeSegment(state, scriptOf(action), {
        source: { kind: "action", actionId: action.id },
        segmentIndex: resumeAt,
        minutesSpent: 0,
        startedAt: state.clock,
        targetMinutes: gameAction.targetMinutes ?? null,
        interrupted: false,
        exhausted: false,
      });
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
