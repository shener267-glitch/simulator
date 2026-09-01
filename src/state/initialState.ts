import type { GameState } from "../types/game";
import { BRIEFING_APPOINTMENT, WAKE_APPOINTMENT } from "../data/briefing";
import { MORNING_EVENT } from "../data/morningEvent";
import { PLAYER_DEFAULT_NAME } from "../data/characters";

export const SAVE_VERSION = 2;

/**
 * 6/6 05:00。前夜は首班指名から初閣議までが日付をまたいで終わったため、
 * 睡眠は足りていない。数値は内部だけで持ち、画面には文章で出す。
 */
export function createInitialState(player?: GameState["player"]): GameState {
  return {
    saveVersion: SAVE_VERSION,
    clock: 0,
    phase: "morning",
    player: player ?? { ...PLAYER_DEFAULT_NAME },
    condition: { fatigue: 55, hunger: 45 },
    appointments: [{ ...WAKE_APPOINTMENT }, { ...BRIEFING_APPOINTMENT }],
    events: [{ ...MORNING_EVENT }],
    log: [],
    highlights: [],
    spentActions: [],
    actionProgress: {},
    activeAction: null,
    activeAppointmentId: WAKE_APPOINTMENT.id,
    activeEventId: null,
  };
}
