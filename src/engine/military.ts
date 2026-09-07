import type {
  ForceStats,
  IntelSnapshot,
  MilitaryEffect,
  MilitaryForceCategory,
  MilitaryRegionId,
  MobilizationState,
  PersonnelStats,
  ProductionLine,
  ReadinessLevel,
  WarState,
  FrontStatus,
} from "../types/military";
import { MILITARY_EVENTS, MILITARY_REGION_LABELS, PRODUCTION_CAPABILITY_PER_UNIT, PRODUCTION_UNIT_COST, REGION_ADJACENCY } from "../data/military";

/** 日本周辺の軍事区分12件のid一覧（`MILITARY_REGION_LABELS`のキーから導く）。 */
export const MILITARY_REGION_IDS = Object.keys(MILITARY_REGION_LABELS) as MilitaryRegionId[];

export const MINUTES_PER_DAY = 1440;

function clampCapability(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/** 防衛態勢5段階、上げるほど費用が重くなる（指示書11章）。 */
export const READINESS_ORDER: ReadinessLevel[] = ["normal", "alert", "high_alert", "emergency", "full_mobilization"];
export const READINESS_LABELS: Record<ReadinessLevel, string> = {
  normal: "通常",
  alert: "警戒",
  high_alert: "高度警戒",
  emergency: "非常警戒",
  full_mobilization: "総動員",
};
export const READINESS_POLITICAL_POWER_COST: Record<ReadinessLevel, number> = {
  normal: 0,
  alert: 8,
  high_alert: 18,
  emergency: 30,
  full_mobilization: 50,
};
/** 態勢を上げているあいだ、1日あたりじわりと効く負担（指示書11章：経済負担・外交的緊張）。 */
export const READINESS_DAILY_DRAG: Record<ReadinessLevel, { gdpGrowthDelta: number; relationDriftAll: number }> = {
  normal: { gdpGrowthDelta: 0, relationDriftAll: 0 },
  alert: { gdpGrowthDelta: -0.01, relationDriftAll: -0.005 },
  high_alert: { gdpGrowthDelta: -0.03, relationDriftAll: -0.015 },
  emergency: { gdpGrowthDelta: -0.08, relationDriftAll: -0.03 },
  full_mobilization: { gdpGrowthDelta: -0.2, relationDriftAll: -0.08 },
};

/** 動員状態4段階（指示書12章）。 */
export const MOBILIZATION_ORDER: MobilizationState[] = ["peacetime", "partial", "large_scale", "full"];
export const MOBILIZATION_LABELS: Record<MobilizationState, string> = {
  peacetime: "平時",
  partial: "部分動員",
  large_scale: "大規模動員",
  full: "総動員",
};
export const MOBILIZATION_POLITICAL_POWER_COST: Record<MobilizationState, number> = {
  peacetime: 0,
  partial: 15,
  large_scale: 30,
  full: 50,
};
/**
 * 動員には時間がかかる、という指示書12章の要求を、人員充足率が1日あたり
 * ゆるやかに上向く（動員段階が高いほど速い）形で表現する簡略化。
 */
export const MOBILIZATION_DAILY_DRAG: Record<MobilizationState, { gdpGrowthDelta: number; fillRateDrift: number }> = {
  peacetime: { gdpGrowthDelta: 0, fillRateDrift: 0 },
  partial: { gdpGrowthDelta: -0.02, fillRateDrift: 0.05 },
  large_scale: { gdpGrowthDelta: -0.06, fillRateDrift: 0.1 },
  full: { gdpGrowthDelta: -0.15, fillRateDrift: 0.2 },
};

function signed(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

const CAPABILITY_LABEL: Record<MilitaryForceCategory, string> = {
  land: "陸上戦力",
  sea: "海上戦力",
  air: "航空戦力",
  missile: "ミサイル戦力",
  other: "その他戦力",
};

export function describeMilitaryEffect(effect: MilitaryEffect): string {
  switch (effect.type) {
    case "modify_capability":
      return `${CAPABILITY_LABEL[effect.category]} ${signed(effect.amount)}`;
    case "modify_personnel":
      return `人員(${effect.field}) ${signed(effect.amount)}`;
    case "modify_political_power":
      return `政治力 ${signed(effect.amount)}`;
    case "modify_relation":
      return `関係値 ${signed(effect.amount)}`;
    case "modify_government_support":
      return `政府支持率 ${signed(effect.amount)}%`;
    case "trigger_event":
      return "イベントが発生する";
  }
}

/** テンプレートの相手国idプレースホルダ（空文字）を、実際の相手国idへ差し替える。 */
export function bindMilitaryEffectsToCountry(effects: MilitaryEffect[], countryId: string): MilitaryEffect[] {
  return effects.map((effect) => (effect.type === "modify_relation" && effect.countryId === "" ? { ...effect, countryId } : effect));
}

export interface MilitaryEffectResult {
  forces: ForceStats;
  personnel: PersonnelStats;
  politicalPowerDelta: number;
  governmentSupportDelta: number;
  relationDeltas: { countryId: string; amount: number; label: string }[];
  triggeredEventIds: string[];
}

/** 軍事効果の適用。他システムと同じ、閉じた語彙のEffectシステム。 */
export function applyMilitaryEffects(effects: MilitaryEffect[], forces: ForceStats, personnel: PersonnelStats): MilitaryEffectResult {
  let nextForces = forces;
  let nextPersonnel = personnel;
  let politicalPowerDelta = 0;
  let governmentSupportDelta = 0;
  const relationDeltas: MilitaryEffectResult["relationDeltas"] = [];
  const triggeredEventIds: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case "modify_capability":
        nextForces = { ...nextForces, [effect.category]: { ...nextForces[effect.category], capability: clampCapability(nextForces[effect.category].capability + effect.amount) } };
        break;
      case "modify_personnel":
        nextPersonnel = { ...nextPersonnel, [effect.field]: clampNonNegative(nextPersonnel[effect.field] + effect.amount) };
        break;
      case "modify_political_power":
        politicalPowerDelta += effect.amount;
        break;
      case "modify_relation":
        relationDeltas.push({ countryId: effect.countryId, amount: effect.amount, label: effect.label });
        break;
      case "modify_government_support":
        governmentSupportDelta += effect.amount;
        break;
      case "trigger_event":
        triggeredEventIds.push(effect.eventId);
        break;
    }
  }

  return { forces: nextForces, personnel: nextPersonnel, politicalPowerDelta, governmentSupportDelta, relationDeltas, triggeredEventIds };
}

/** 隣接地域をたどった最短経路の区間数。移動時間の計算に使う（指示書7章）。 */
export function regionHopDistance(from: MilitaryRegionId, to: MilitaryRegionId): number {
  if (from === to) return 0;
  const visited = new Set<MilitaryRegionId>([from]);
  let frontier: MilitaryRegionId[] = [from];
  let hops = 0;
  while (frontier.length > 0) {
    hops += 1;
    const next: MilitaryRegionId[] = [];
    for (const region of frontier) {
      for (const neighbor of REGION_ADJACENCY[region]) {
        if (neighbor === to) return hops;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }
  return hops;
}

/**
 * 部隊移動の所要日数（指示書7章）。実際の道路・鉄道・港湾を個別に
 * モデル化はせず、地域間の区間数から一律の目安を出す簡略化
 * 【ゲーム上の設定】。
 */
export function travelDays(from: MilitaryRegionId, to: MilitaryRegionId): number {
  const hops = regionHopDistance(from, to);
  return Math.max(0.5, hops * 1.5);
}

/**
 * 生産ラインを1日ぶん進める（指示書16章）。工場数×生産効率×予算比率で
 * 累積生産を積み上げ、1単位ぶん貯まるたびに部隊の能力指数へ少しずつ
 * 還元する——決定した瞬間に軍事力が増えるわけではない、という指示書14章
 * の要求どおり。
 */
export function advanceProduction(
  line: ProductionLine,
  elapsedDays: number,
  defenseBudgetTrillionYen: number,
  researchBonusPercent: number,
): { line: ProductionLine; capabilityGains: { category: "land" | "sea" | "air" | "missile"; amount: number }[] } {
  const budgetFactor = Math.max(0.3, defenseBudgetTrillionYen / 7.9); // 7.9兆円=指示書の防衛予算基準値
  const dailyOutput = line.factories * (line.efficiencyPercent / 100) * (1 / 30) * budgetFactor * (1 + researchBonusPercent / 100);
  let accumulated = line.accumulatedOutput + dailyOutput * elapsedDays;
  const unitCost = PRODUCTION_UNIT_COST[line.itemId];
  const perUnit = PRODUCTION_CAPABILITY_PER_UNIT[line.itemId];
  const capabilityGains: { category: "land" | "sea" | "air" | "missile"; amount: number }[] = [];

  let completedUnits = 0;
  while (accumulated >= unitCost) {
    accumulated -= unitCost;
    completedUnits += 1;
  }
  if (completedUnits > 0) capabilityGains.push({ category: perUnit.category, amount: perUnit.amount * completedUnits });

  return { line: { ...line, accumulatedOutput: accumulated }, capabilityGains };
}

/**
 * 各国の軍事情報スナップショットのドリフト（指示書20・21章）。確度は
 * ランダムウォークし、推定値は確度が低いほど実際の目安値から大きくぶれる
 * ——プレイヤーが世界のすべてを知っている状態にはしない。
 */
export function driftIntel(
  intel: IntelSnapshot,
  baseline: { land: number; sea: number; air: number },
  elapsedDays: number,
  random: () => number,
): IntelSnapshot {
  const confidenceDrift = (random() - 0.45) * 4 * elapsedDays; // ごくわずかに上振れしやすい下地
  const confidencePercent = Math.min(95, Math.max(20, intel.confidencePercent + confidenceDrift));
  const noiseScale = (100 - confidencePercent) / 100;

  function estimate(current: number, base: number): number {
    const pull = (base - current) * 0.1 * elapsedDays;
    const noise = (random() - 0.5) * 10 * noiseScale * elapsedDays;
    return clampCapability(current + pull + noise);
  }

  return {
    ...intel,
    confidencePercent,
    landEstimate: estimate(intel.landEstimate, baseline.land),
    seaEstimate: estimate(intel.seaEstimate, baseline.sea),
    airEstimate: estimate(intel.airEstimate, baseline.air),
  };
}

export function confidenceLabel(confidencePercent: number): "high" | "medium" | "low" | "unconfirmed" {
  if (confidencePercent >= 75) return "high";
  if (confidencePercent >= 55) return "medium";
  if (confidencePercent >= 35) return "low";
  return "unconfirmed";
}

export const CONFIDENCE_LABEL_JA: Record<"high" | "medium" | "low" | "unconfirmed", string> = {
  high: "確度：高",
  medium: "確度：中",
  low: "確度：低",
  unconfirmed: "未確認",
};

/** 平時にも起き続ける軍事イベント（指示書31・32章）。たいていは軽い出来事。 */
export function rollMilitaryEvent(elapsedDays: number, random: () => number): string | null {
  if (random() >= 0.04 * elapsedDays) return null;
  return MILITARY_EVENTS[Math.floor(random() * MILITARY_EVENTS.length)].id;
}

/**
 * 武力攻撃の発生判定（指示書23章）。関係値が著しく悪化した相手国に限り、
 * ごくわずかな確率で発生する——予兆はあっても、たいていは何も起きない。
 */
export function rollArmedAttack(relationByCountry: Record<string, number>, elapsedDays: number, random: () => number): string | null {
  const hostile = Object.entries(relationByCountry).filter(([, relation]) => relation <= -70);
  if (hostile.length === 0) return null;
  if (random() >= 0.005 * elapsedDays) return null;
  return hostile[Math.floor(random() * hostile.length)][0];
}

const FRONT_ORDER: FrontStatus[] = ["calm", "tense", "active"];

/**
 * 前線の状況ドリフト（指示書24・26章）。詳細な戦闘計算はしない——
 * 「この方面に戦力を割いているか」という国家レベルの選択が、じわりと
 * 前線の色（記号）を動かす、という程度にとどめる。
 */
export function driftFrontStatus(war: WarState, regionSupportScore: Partial<Record<MilitaryRegionId, number>>, random: () => number): WarState {
  const nextFrontStatus = { ...war.frontStatus };
  for (const region of Object.keys(nextFrontStatus) as MilitaryRegionId[]) {
    const score = regionSupportScore[region] ?? -2; // 作戦を割り当てていない方面は、じわりと悪化しやすい
    const currentIndex = FRONT_ORDER.indexOf(nextFrontStatus[region]);
    const roll = random();
    if (score > 3 && roll < 0.3 && currentIndex > 0) {
      nextFrontStatus[region] = FRONT_ORDER[currentIndex - 1];
    } else if (score < -3 && roll < 0.3 && currentIndex < FRONT_ORDER.length - 1) {
      nextFrontStatus[region] = FRONT_ORDER[currentIndex + 1];
    }
  }
  return { ...war, frontStatus: nextFrontStatus };
}
