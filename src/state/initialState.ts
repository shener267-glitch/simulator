import type { GameState } from "../types/game";
import {
  BRIEFING_APPOINTMENT,
  CHIEF_MEETING_APPOINTMENT,
  KANTEI_ARRIVAL_APPOINTMENT,
} from "../data/briefing";
import { MORNING_CALL } from "../data/morningInterrupts";
import { PLAYER_DEFAULT_NAME } from "../data/characters";
import { STARTING_PLACE } from "../data/places";

export const SAVE_VERSION = 4;

/**
 * 6/6 06:00、議員宿舎の寝室。就任直後で、公邸にはまだ入居していない。
 * 前夜は首班指名から初閣議までが日付をまたいで終わったため、睡眠は足りて
 * いない。数値は内部だけで持ち、画面には文章と目盛りでしか出さない。
 *
 * 起床は予定ではなく画面（mode: wake）にした。時間を使わない0分の予定を
 * 予定表に置いておくと、次の予定を数えるたびに跨がなければならなくなる。
 */
export function createInitialState(player?: GameState["player"]): GameState {
  return {
    saveVersion: SAVE_VERSION,
    clock: 0,
    phase: "day",
    player: player ?? { ...PLAYER_DEFAULT_NAME },
    place: STARTING_PLACE,
    condition: { fatigue: 55, hunger: 45 },
    appointments: [
      { ...BRIEFING_APPOINTMENT },
      { ...KANTEI_ARRIVAL_APPOINTMENT },
      { ...CHIEF_MEETING_APPOINTMENT },
    ],
    interrupts: [{ ...MORNING_CALL }],
    mode: { kind: "wake" },
    phone: { messages: [] },
    log: [],
    highlights: [],
    flags: [],
    spentActions: [],
    actionProgress: {},
    talkProgress: {},
  };
}
