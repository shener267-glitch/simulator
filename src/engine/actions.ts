import { MORNING_LENGTH, type Minutes } from "../types/clock";
import type { Segment } from "../types/action";
import type { GameState } from "../types/game";
import { nextAppointment } from "./schedule";

/**
 * The next moment the player's time stops being their own: an appointment they
 * have to attend, or something that arrives on its own. Null when the rest of
 * the morning is theirs.
 */
export function nextInterruption(state: GameState): Minutes | null {
  const times: Minutes[] = [];
  for (const appointment of state.appointments) {
    if (!appointment.resolved) times.push(appointment.at);
  }
  for (const event of state.events) {
    if (!event.fired) times.push(event.at);
  }
  return times.length > 0 ? Math.min(...times) : null;
}

/** No stretch of free time may run past the next interruption, or past 08:00. */
export function interruptionGuard(state: GameState): Minutes {
  const next = nextInterruption(state);
  return next === null ? MORNING_LENGTH : Math.min(next, MORNING_LENGTH);
}

/** How long the player can keep going before something takes over. */
export function freeMinutes(state: GameState): Minutes {
  return Math.max(0, interruptionGuard(state) - state.clock);
}

/**
 * What the player is allowed to know: the time to the next appointment on the
 * schedule, or to the end of the morning. Events that have not arrived yet are
 * deliberately left out — being cut off by one is supposed to be a surprise.
 */
export function visibleFreeMinutes(state: GameState): Minutes {
  const appointment = nextAppointment(state);
  const limit = appointment ? Math.min(appointment.at, MORNING_LENGTH) : MORNING_LENGTH;
  return Math.max(0, limit - state.clock);
}

export function segmentFits(state: GameState, segment: Segment): boolean {
  return state.clock + segment.minutes <= interruptionGuard(state);
}
