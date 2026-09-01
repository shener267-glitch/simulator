import { MORNING_LENGTH } from "../types/clock";
import type { Action as FreeAction } from "../types/action";
import type { ActiveAction, GameState } from "../types/game";
import { interruptionGuard } from "../engine/actions";
import { isMorningOver } from "../engine/clock";
import { applyElapsed, clampCondition } from "../engine/condition";
import { dueAppointment, dueEvent, moveAppointment } from "../engine/schedule";
import { findAction } from "../data/actions";
import { createInitialState } from "./initialState";

export type GameAction =
  | { type: "RESOLVE_APPOINTMENT" }
  | { type: "DISMISS_EVENT" }
  | { type: "START_ACTION"; actionId: string }
  | { type: "CONTINUE_SEGMENT" }
  | { type: "STOP_ACTION" }
  | { type: "RESTART_MORNING" }
  | { type: "NEW_GAME" };

/**
 * Run after every clock change: something that arrives on its own takes
 * precedence over an appointment, because it may pull that appointment
 * earlier. Only when nothing is waiting does the morning get to end.
 */
function checkTriggers(state: GameState): GameState {
  const event = dueEvent(state, state.clock);
  if (event) {
    const appointments = event.movesAppointment
      ? moveAppointment(state.appointments, event.movesAppointment.appointmentId, event.movesAppointment.to)
      : state.appointments;
    return {
      ...state,
      appointments,
      events: state.events.map((candidate) =>
        candidate.id === event.id ? { ...candidate, fired: true } : candidate,
      ),
      highlights: [...state.highlights, event.highlight],
      activeEventId: event.id,
    };
  }

  const appointment = dueAppointment(state, state.clock);
  if (appointment) {
    return { ...state, activeAppointmentId: appointment.id };
  }

  if (isMorningOver(state.clock)) {
    return { ...state, phase: "review" };
  }

  return state;
}

/**
 * Consume one segment. If it does not fit before the next interruption, the
 * player gets the minutes that were actually left and the action is cut short
 * (設計書13章・19章).
 */
function runSegment(state: GameState, action: FreeAction, active: ActiveAction): GameState {
  const segment = action.segments[active.segmentIndex];
  if (!segment) return state;

  const remaining = interruptionGuard(state) - state.clock;
  const fits = segment.minutes <= remaining;
  const spent = fits ? segment.minutes : Math.max(0, remaining);

  const afterElapsed = applyElapsed(state.condition, spent);
  const condition = fits
    ? clampCondition({
        fatigue: afterElapsed.fatigue + (action.perSegment?.fatigue ?? 0),
        hunger: afterElapsed.hunger + (action.perSegment?.hunger ?? 0),
      })
    : afterElapsed;

  const segmentIndex = fits ? active.segmentIndex + 1 : active.segmentIndex;

  return {
    ...state,
    clock: state.clock + spent,
    condition,
    highlights: fits && segment.highlight ? [...state.highlights, segment.highlight] : state.highlights,
    activeAction: {
      ...active,
      segmentIndex,
      minutesSpent: active.minutesSpent + spent,
      interrupted: !fits,
      exhausted: fits && segmentIndex >= action.segments.length,
    },
  };
}

/** Close out the running action: record the time, then see what is waiting. */
function finishAction(state: GameState): GameState {
  const active = state.activeAction;
  if (!active) return state;
  const action = findAction(active.actionId);
  if (!action) return { ...state, activeAction: null };

  const spent = active.minutesSpent;
  const usedUp = active.segmentIndex >= action.segments.length;

  return checkTriggers({
    ...state,
    activeAction: null,
    log: spent > 0 ? [...state.log, { label: action.label, minutes: spent, startedAt: active.startedAt }] : state.log,
    spentActions:
      usedUp && !action.repeatable && !state.spentActions.includes(action.id)
        ? [...state.spentActions, action.id]
        : state.spentActions,
    actionProgress: { ...state.actionProgress, [action.id]: active.segmentIndex },
  });
}

export function gameReducer(state: GameState, gameAction: GameAction): GameState {
  switch (gameAction.type) {
    case "DISMISS_EVENT":
      return checkTriggers({ ...state, activeEventId: null });

    case "RESOLVE_APPOINTMENT": {
      const appointment = state.appointments.find((candidate) => candidate.id === state.activeAppointmentId);
      if (!appointment) return state;

      const clock = Math.min(MORNING_LENGTH, state.clock + appointment.minutes);
      const spent = clock - state.clock;

      return checkTriggers({
        ...state,
        clock,
        condition: applyElapsed(state.condition, spent),
        appointments: state.appointments.map((candidate) =>
          candidate.id === appointment.id ? { ...candidate, resolved: true } : candidate,
        ),
        activeAppointmentId: null,
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
      if (state.activeAction || state.activeEventId || state.activeAppointmentId) return state;
      const action = findAction(gameAction.actionId);
      if (!action || state.spentActions.includes(action.id)) return state;

      const resumeAt = action.repeatable ? 0 : (state.actionProgress[action.id] ?? 0);
      if (resumeAt >= action.segments.length) return state;

      return runSegment(state, action, {
        actionId: action.id,
        segmentIndex: resumeAt,
        minutesSpent: 0,
        startedAt: state.clock,
        interrupted: false,
        exhausted: false,
      });
    }

    case "CONTINUE_SEGMENT": {
      const active = state.activeAction;
      if (!active || active.interrupted || active.exhausted) return state;
      const action = findAction(active.actionId);
      if (!action) return state;
      return runSegment(state, action, active);
    }

    case "STOP_ACTION":
      return finishAction(state);

    case "RESTART_MORNING":
      return createInitialState(state.player);

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
}
