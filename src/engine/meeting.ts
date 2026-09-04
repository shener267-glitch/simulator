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

/**
 * 会議に残っている分。枠は予定の側に固定されているので、選択肢をいくつ選んでも
 * 次の予定を押し出すことはない。そのかわり、全部は聞けない。
 */
export function meetingBudget(state: GameState): Minutes {
  const current = currentMeeting(state);
  if (!current) return 0;
  return Math.max(0, current.appointment.at + current.appointment.minutes - state.clock);
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
