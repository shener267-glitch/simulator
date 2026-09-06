import type { GameState } from "../types/game";
import { DEFAULT_START } from "../types/gameTime";
import { COUNTRIES, DEFAULT_COUNTRY_ID } from "../data/countries";
import { createPoliticsState } from "./politics";

export const SAVE_VERSION = 7;

export function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    phase: "title",
    selectedCountryId: DEFAULT_COUNTRY_ID,
    playerCountryId: null,
    gameTime: { ...DEFAULT_START, speed: 0 },
    countries: COUNTRIES.map((country) => ({ ...country })),
    // ゲーム開始前のプレースホルダー。BEGIN_GAMEで実際に選ばれた国のものへ差し替える。
    politics: createPoliticsState(DEFAULT_COUNTRY_ID),
    inspectingCountryId: null,
    activeCategory: null,
  };
}
