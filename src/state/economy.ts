import type { EconomyState } from "../types/game";

/**
 * 開始時点の経済状況（指示書1〜6章）。
 *
 * 【参考】名目GDP・税収・政府債務・インフレ率・失業率は2024年前後の
 * 公表値に基づく概算（v0.3で調べた値を引き継いでいる）。予算の内訳は
 * 2024年度一般会計のおおまかな配分に寄せた概算で、指示書4章が例示する
 * 防衛費7.9兆円はそのまま使った。地方交付税・国債費など、指示書の
 * 7分野に無い項目は「その他」にまとめてある——省庁別の細分化はしない
 * という指示書3章の方針どおり。消費・民間投資は実データではなく、
 * 5.0を基準値とするゲーム上の指数【ゲーム上の設定】。
 */
export function createEconomyState(countryId: string): EconomyState {
  if (countryId === "JPN") {
    return {
      stats: {
        gdpTrillionYen: 600,
        gdpGrowthRate: 1.2,
        taxRevenueTrillionYen: 70,
        otherRevenueTrillionYen: 7,
        govDebtTrillionYen: 1105,
        inflationRate: 2.5,
        unemploymentRate: 2.5,
        consumption: 5.0,
        privateInvestment: 5.0,
      },
      budget: {
        socialSecurity: 37,
        defense: 7.9,
        publicWorks: 6,
        educationResearch: 5.4,
        diplomacy: 0.7,
        industry: 1.5,
        other: 53.5,
      },
      decidedPolicyIds: [],
      scheduledEffects: [],
      elapsedMinutes: 0,
    };
  }

  return {
    stats: {
      gdpTrillionYen: 0,
      gdpGrowthRate: 0,
      taxRevenueTrillionYen: 0,
      otherRevenueTrillionYen: 0,
      govDebtTrillionYen: 0,
      inflationRate: 0,
      unemploymentRate: 0,
      consumption: 0,
      privateInvestment: 0,
    },
    budget: {
      socialSecurity: 0,
      defense: 0,
      publicWorks: 0,
      educationResearch: 0,
      diplomacy: 0,
      industry: 0,
      other: 0,
    },
    decidedPolicyIds: [],
    scheduledEffects: [],
    elapsedMinutes: 0,
  };
}
