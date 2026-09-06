import type { Minutes } from "../types/clock";
import type { GameState } from "../types/game";
import type { Meeting, MeetingBeat, MeetingChoice } from "../types/meeting";
import { MEETINGS } from "../data/meetings";

export function findMeeting(appointmentId: string): Meeting | undefined {
  return MEETINGS.find((meeting) => meeting.appointmentId === appointmentId);
}

/** いま出ている会議と、その予定。 */
export function currentMeeting(state: GameState) {
  if (state.mode.kind !== "meeting") return null;
  const appointmentId = state.mode.appointmentId;
  const appointment = state.appointments.find((candidate) => candidate.id === appointmentId);
  const meeting = findMeeting(appointmentId);
  if (!appointment || !meeting) return null;
  return { appointment, meeting };
}

/** 次の予定の前に空けておく分。ここを詰めると、移動も一息もできなくなる。 */
export const MEETING_GAP: Minutes = 10;

/**
 * 次に何も予定が無いとき、それでも会議を締めるための上限（設計書28章）。
 * 一日の終わりという概念自体がv0.3の時計には無いので、十分先の
 * どこか——実務上は「総理が切り上げると言うまで終わらない」のと同義になる
 * 大きな値を天井にしてある。
 */
const NO_CEILING = Number.MAX_SAFE_INTEGER;

/**
 * 会議が延ばせる限界の時刻（設計書28章）。
 *
 * 次の予定があれば、その十分前まで。無ければプレイヤーが切り上げると
 * 言うまで終わらない。
 */
export function meetingCeiling(state: GameState): Minutes {
  const current = currentMeeting(state);
  if (!current) return NO_CEILING;

  const next = state.appointments
    .filter((appointment) => !appointment.resolved && appointment.id !== current.appointment.id)
    .map((appointment) => appointment.at);

  const frame = current.appointment.at + current.appointment.minutes;
  if (next.length === 0) return NO_CEILING;
  // 予定の枠を越えて延ばせるが、次の十分前で必ず止まる。
  return Math.max(frame, Math.min(...next) - MEETING_GAP);
}

/**
 * 会議に残っている分。枠を使い切っても、次の予定まで余裕があれば続けられる。
 * そのかわり、次があるときは必ずその十分前で終わる。
 */
export function meetingBudget(state: GameState): Minutes {
  const current = currentMeeting(state);
  if (!current) return 0;
  return Math.max(0, meetingCeiling(state) - state.clock.totalMinutes);
}

/** 予定の枠をもう越えているか。画面に「延長」と出すために使う。 */
export function isRunningOver(state: GameState): boolean {
  const current = currentMeeting(state);
  if (!current) return false;
  return state.clock.totalMinutes >= current.appointment.at + current.appointment.minutes;
}

/** フラグで出し分ける行を絞る。指定のない行は常に出る。 */
export function visibleBeats(beats: MeetingBeat[], flags: string[]): MeetingBeat[] {
  return beats.filter(
    (beat) =>
      (!beat.requiresFlag || flags.includes(beat.requiresFlag)) &&
      (!beat.unlessFlag || !flags.includes(beat.unlessFlag)),
  );
}

export interface OfferedChoice {
  choice: MeetingChoice;
  /** 枠の残りに入るか。入らないものは見せるが選ばせない — 会議は伸ばせない。 */
  fits: boolean;
}

/**
 * いま選べる話題。もう聞いたものと、条件を満たしていないものは落とす。
 * 枠に入らないものは残す — 「時間が足りなくて聞けなかった」ことが見えるように。
 */
export function offeredChoices(state: GameState): OfferedChoice[] {
  const current = currentMeeting(state);
  if (!current || state.mode.kind !== "meeting") return [];
  const taken = state.mode.taken;
  const budget = meetingBudget(state);

  return current.meeting.choices
    .filter((choice) => !taken.includes(choice.id))
    .filter((choice) => !choice.requiresFlag || state.flags.includes(choice.requiresFlag))
    .filter((choice) => !choice.unlessFlag || !state.flags.includes(choice.unlessFlag))
    .map((choice) => ({ choice, fits: choice.minutes <= budget }));
}
