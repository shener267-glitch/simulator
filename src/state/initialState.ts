import type { GameState } from "../types/game";
import { DEFAULT_START } from "../types/gameTime";
import { COUNTRIES, DEFAULT_COUNTRY_ID } from "../data/countries";
import { createPoliticsState } from "./politics";
import { createEconomyState } from "./economy";
import { createResearchState } from "./research";
import { createDiplomacyState } from "./diplomacy";
import { createMilitaryState } from "./military";

export const SAVE_VERSION = 10;

export function createInitialState(): GameState {
  const countries = COUNTRIES.map((country) => ({ ...country }));
  return {
    saveVersion: SAVE_VERSION,
    phase: "title",
    selectedCountryId: DEFAULT_COUNTRY_ID,
    playerCountryId: null,
    gameTime: { ...DEFAULT_START, speed: 0 },
    countries,
    // ゲーム開始前のプレースホルダー。BEGIN_GAMEで実際に選ばれた国のものへ差し替える。
    politics: createPoliticsState(DEFAULT_COUNTRY_ID),
    economy: createEconomyState(DEFAULT_COUNTRY_ID),
    research: createResearchState(),
    diplomacy: createDiplomacyState(DEFAULT_COUNTRY_ID, countries),
    military: createMilitaryState(DEFAULT_COUNTRY_ID, countries),
    inspectingCountryId: null,
    activeCategory: null,
  };
}
