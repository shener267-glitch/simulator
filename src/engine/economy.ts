import type { Budget, EconomyEffect, EconomyPolicyTemplate, EconomyStats, ScheduledEconomyEffect } from "../types/economy";

/** 予算の合計、兆円/年。政府支出そのものはここから導く——別に持たない。 */
export function totalBudget(budget: Budget): number {
  return Object.values(budget).reduce((sum, amount) => sum + amount, 0);
}

/** 財政収支 = 税収 + その他収入 - 政府支出（指示書5章）。 */
export function fiscalBalance(stats: EconomyStats, budget: Budget): number {
  return stats.taxRevenueTrillionYen + stats.otherRevenueTrillionYen - totalBudget(budget);
}

/** 対GDP比、%。 */
export function debtToGdpRatio(stats: EconomyStats): number {
  return stats.gdpTrillionYen > 0 ? (stats.govDebtTrillionYen / stats.gdpTrillionYen) * 100 : 0;
}

/**
 * 時間経過そのものによる、ゆるやかな変化（指示書5・6章）。GDPは成長率に
 * 沿って複利的に動き、財政収支が赤字ならその分だけ政府債務が積み上がる。
 * 「債務が多い＝即ゲームオーバー」にはしない——ここでは数字を動かすだけ。
 */
export function advanceEconomy(stats: EconomyStats, budget: Budget, elapsedDays: number): EconomyStats {
  const yearFraction = elapsedDays / 365;
  const gdpTrillionYen = stats.gdpTrillionYen * (1 + (stats.gdpGrowthRate / 100) * yearFraction);
  const balance = fiscalBalance(stats, budget);
  const govDebtTrillionYen = Math.max(0, stats.govDebtTrillionYen - balance * yearFraction);
  return { ...stats, gdpTrillionYen, govDebtTrillionYen };
}

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

export interface EconomyEffectResult {
  stats: EconomyStats;
  budget: Budget;
  triggeredEventIds: string[];
}

/** 経済効果の適用。国家方針・研究と同じ、閉じた語彙のEffectシステム。 */
export function applyEconomyEffects(effects: EconomyEffect[], stats: EconomyStats, budget: Budget): EconomyEffectResult {
  let nextStats = stats;
  let nextBudget = budget;
  const triggeredEventIds: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case "modify_stat": {
        const raw = nextStats[effect.stat] + effect.amount;
        const clamped = effect.stat === "inflationRate" || effect.stat === "unemploymentRate" ? clampNonNegative(raw) : raw;
        nextStats = { ...nextStats, [effect.stat]: clamped };
        break;
      }
      case "modify_budget":
        nextBudget = { ...nextBudget, [effect.category]: clampNonNegative(nextBudget[effect.category] + effect.amount) };
        break;
      case "trigger_event":
        triggeredEventIds.push(effect.eventId);
        break;
    }
  }

  return { stats: nextStats, budget: nextBudget, triggeredEventIds };
}

/** 政策を決めた瞬間に、各段階を絶対時刻へ落とし込む（指示書8章）。 */
export function schedulePolicyEffects(policy: EconomyPolicyTemplate, decidedAtMinute: number): ScheduledEconomyEffect[] {
  return policy.stages.map((stage) => ({
    id: `${policy.id}-${stage.afterDays}`,
    atMinute: decidedAtMinute + stage.afterDays * 1440,
    effects: stage.effects,
  }));
}

/**
 * 経済状況が政治へじわりと効くための、1日あたりの下地（指示書9章）。
 * 単純な数式だけで政治の結果を決めないよう、値は小さく抑えてある——
 * 大きく動かしたいときは政策やイベントの役割にする。
 */
export function politicalDriftPerDay(stats: EconomyStats): { governmentSupport: number; stability: number } {
  let governmentSupport = 0;
  let stability = 0;

  if (stats.gdpGrowthRate >= 2) governmentSupport += 0.02;
  else if (stats.gdpGrowthRate < 0) governmentSupport -= 0.03;

  if (stats.unemploymentRate >= 4) governmentSupport -= 0.02;
  if (stats.inflationRate >= 3) governmentSupport -= 0.02;

  if (stats.gdpGrowthRate < 0 && stats.unemploymentRate >= 4) stability -= 0.01;

  return { governmentSupport, stability };
}
