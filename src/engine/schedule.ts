import type { Minutes } from "../types/clock";
import type { Appointment, GameState, TimedEvent } from "../types/game";

/** 予定表に載っているか。省略されていれば載っている扱い。 */
export function isAnnounced(appointment: Appointment): boolean {
  return appointment.announced !== false;
}

/** The soonest appointment the player still has to attend. */
export function nextAppointment(state: GameState): Appointment | null {
  const pending = state.appointments.filter((appointment) => !appointment.resolved);
  if (pending.length === 0) return null;
  return pending.reduce((soonest, candidate) => (candidate.at < soonest.at ? candidate : soonest));
}

/**
 * プレイヤーに見せてよい次の予定。載っていない予定は隠す — 不意に切られる
 * のは驚きであるべきで、目に見えるタイマーであってはならない。
 */
export function nextVisibleAppointment(state: GameState): Appointment | null {
  const pending = state.appointments.filter(
    (appointment) => !appointment.resolved && isAnnounced(appointment),
  );
  if (pending.length === 0) return null;
  return pending.reduce((soonest, candidate) => (candidate.at < soonest.at ? candidate : soonest));
}

/**
 * Pull an appointment to a new time — how an event brings the briefing forward.
 * 繰り上げ先が過去になることは許さない: 割り込みがセグメントの切れ目まで
 * 遅れて鳴ると、指定の時刻をすでに過ぎていることがある。
 */
export function moveAppointment(
  appointments: Appointment[],
  appointmentId: string,
  to: Minutes,
  notBefore: Minutes = 0,
): Appointment[] {
  const at = Math.max(to, notBefore);
  return appointments.map((appointment) =>
    appointment.id === appointmentId && !appointment.resolved ? { ...appointment, at } : appointment,
  );
}

export function dueEvent(state: GameState, clock: Minutes): TimedEvent | null {
  const pending = state.events.filter((event) => !event.fired && event.at <= clock);
  if (pending.length === 0) return null;
  return pending.reduce((soonest, candidate) => (candidate.at < soonest.at ? candidate : soonest));
}

export function dueAppointment(state: GameState, clock: Minutes): Appointment | null {
  const appointment = nextAppointment(state);
  return appointment && appointment.at <= clock ? appointment : null;
}
