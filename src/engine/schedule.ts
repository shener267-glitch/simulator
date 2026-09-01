import type { Minutes } from "../types/clock";
import type { Appointment, GameState, TimedEvent } from "../types/game";

/** The soonest appointment the player still has to attend. */
export function nextAppointment(state: GameState): Appointment | null {
  const pending = state.appointments.filter((appointment) => !appointment.resolved);
  if (pending.length === 0) return null;
  return pending.reduce((soonest, candidate) => (candidate.at < soonest.at ? candidate : soonest));
}

/** Pull an appointment to a new time — how an event brings the briefing forward. */
export function moveAppointment(
  appointments: Appointment[],
  appointmentId: string,
  to: Minutes,
): Appointment[] {
  return appointments.map((appointment) =>
    appointment.id === appointmentId && !appointment.resolved ? { ...appointment, at: to } : appointment,
  );
}

export function dueEvent(state: GameState, clock: Minutes): TimedEvent | null {
  return state.events.find((event) => !event.fired && event.at <= clock) ?? null;
}

export function dueAppointment(state: GameState, clock: Minutes): Appointment | null {
  const appointment = nextAppointment(state);
  return appointment && appointment.at <= clock ? appointment : null;
}
