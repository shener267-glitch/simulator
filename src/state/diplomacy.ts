import type { Country } from "../types/country";
import type { CountryDiplomacy, DiplomacyState } from "../types/diplomacy";
import { EMPTY_TRADE_STATE, JAPAN_RELATION_SEEDS, JAPAN_TRADE_SEED } from "../data/diplomacy";

/**
 * 世界情勢パネルの初期緊張度（指示書24章）。地域ごとの現実の緊張度を
 * 主張するものではなく、ゲーム開始時点の下地として置いた値
 * 【ゲーム上の設定】。
 */
const INITIAL_REGIONAL_TENSION = { europe: 35, east_asia: 40, middle_east: 55, pacific: 30 };

/**
 * 開始時点の外交状況（Phase 4指示書0〜29章）。
 *
 * 日本を担当したときだけ、指示書の例に出てくる日米関係・アジア外交の
 * 二本柱に沿った関係値を持たせる（`JAPAN_RELATION_SEEDS`）。日本以外は
 * Phase 2・3の政治・研究と同じく、まだ実データを用意していない
 * ——他国どうしを中立値0で置いておくだけの土台。
 */
export function createDiplomacyState(countryId: string, allCountries: Country[]): DiplomacyState {
  const others = allCountries.filter((country) => country.id !== countryId && country.playable);
  const relations: Record<string, CountryDiplomacy> = {};

  for (const other of others) {
    const seed = countryId === "JPN" ? JAPAN_RELATION_SEEDS[other.id] : undefined;
    relations[other.id] = {
      countryId: other.id,
      baseRelation: seed?.baseRelation ?? 0,
      modifiers: seed ? seed.modifiers.map((modifier) => ({ ...modifier })) : [],
      barGov: seed?.barGov ?? 0,
      barEcon: seed?.barEcon ?? 0,
      barMil: seed?.barMil ?? 0,
      personality: seed?.personality ?? "pragmatic",
      treaties: [],
      lastActionAtMinute: {},
    };
  }

  return {
    relations,
    stances: [],
    factions: [],
    trade: countryId === "JPN" ? { ...JAPAN_TRADE_SEED } : { ...EMPTY_TRADE_STATE },
    regionalTension: { ...INITIAL_REGIONAL_TENSION },
    scheduledEffects: [],
    pendingSummits: [],
    eventLog: [],
    pendingNotices: [],
    mapOverlayEnabled: false,
    elapsedMinutes: 0,
  };
}
