/**
 * 経済まわりのデータ（Phase 3指示書1〜10章）。経済を一つの数字にせず、
 * GDP・成長率・税収・歳出・財政収支・債務・インフレ率・失業率を、それぞれ
 * 独立したデータとして持つ。
 */
export interface EconomyStats {
  gdpTrillionYen: number;
  /** 実質GDP成長率、年率% */
  gdpGrowthRate: number;
  /** 税収、兆円/年 */
  taxRevenueTrillionYen: number;
  /** 税外収入、兆円/年（予算配分の外側にある小さな収入） */
  otherRevenueTrillionYen: number;
  govDebtTrillionYen: number;
  /** インフレ率、% */
  inflationRate: number;
  /** 失業率、% */
  unemploymentRate: number;
  /** 消費・民間投資は指数（ゲーム上の設定、5.0を基準値とする）。 */
  consumption: number;
  privateInvestment: number;
}

/** 国家予算の分野（指示書3章）。省庁別ではなく、この粒度でまず持つ。 */
export type BudgetCategory =
  | "socialSecurity"
  | "defense"
  | "publicWorks"
  | "educationResearch"
  | "diplomacy"
  | "industry"
  | "other";

/** 分野ごとの年間予算額、兆円。 */
export type Budget = Record<BudgetCategory, number>;

export type EconomyStatKey = keyof EconomyStats;

export type EconomyEffect =
  | { type: "modify_stat"; stat: EconomyStatKey; amount: number }
  | { type: "modify_budget"; category: BudgetCategory; amount: number }
  | { type: "trigger_event"; eventId: string };

/** 政策の効果は段階を持つ——即時・中期・長期に分けて時間差で効かせる（指示書8章）。 */
export interface EconomyPolicyStage {
  /** 決定してから何日後に適用されるか。0は即時。 */
  afterDays: number;
  effects: EconomyEffect[];
}

export interface EconomyPolicyTemplate {
  id: string;
  name: string;
  description: string;
  politicalPowerCost: number;
  stages: EconomyPolicyStage[];
}

/** 決定した政策の効果が、実際に適用されるのを待っている状態。 */
export interface ScheduledEconomyEffect {
  id: string;
  /** `EconomyState.elapsedMinutes`と同じ基準での絶対値。 */
  atMinute: number;
  effects: EconomyEffect[];
}
