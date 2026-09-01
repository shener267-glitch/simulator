import type { GameState } from "../src/types/game";
import { createNewGame } from "../src/state/initialState";

export function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createNewGame(), ...overrides };
}
