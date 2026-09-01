import type { GameState } from "../src/types/game";
import { gameReducer, type GameAction } from "../src/state/gameReducer";
import { createInitialState } from "../src/state/initialState";

export function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

/** The morning as the player actually meets it: past the 05:00 wake-up. */
export function awake(): GameState {
  return run(createInitialState(), { type: "RESOLVE_APPOINTMENT" });
}

/** Play one action from start to finish, or until something cuts it short. */
export function playThrough(state: GameState, actionId: string): GameState {
  let next = gameReducer(state, { type: "START_ACTION", actionId });
  for (let guard = 0; guard < 50; guard += 1) {
    const active = next.activeAction;
    if (!active || active.exhausted || active.interrupted) break;
    const before = next.clock;
    next = gameReducer(next, { type: "CONTINUE_SEGMENT" });
    if (next.clock === before) break;
  }
  return gameReducer(next, { type: "STOP_ACTION" });
}

export function totalLogged(state: GameState): number {
  return state.log.reduce((sum, entry) => sum + entry.minutes, 0);
}
