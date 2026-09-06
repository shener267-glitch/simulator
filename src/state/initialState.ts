import type { GameState } from "../types/game";
import { DEFAULT_START } from "../types/gameTime";
import { COUNTRIES, DEFAULT_COUNTRY_ID } from "../data/countries";

export const SAVE_VERSION = 6;

export function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    phase: "title",
    selectedCountryId: DEFAULT_COUNTRY_ID,
    playerCountryId: null,
    gameTime: { ...DEFAULT_START, speed: 0 },
    countries: COUNTRIES.map((country) => ({ ...country })),
    inspectingCountryId: null,
    activeCategory: null,
  };
}
