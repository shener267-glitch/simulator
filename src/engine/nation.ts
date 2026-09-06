import type { NationStatus, NationStatusDelta } from "../types/game";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 遅延キューが反映されるとき、国家ステータスにどう足し込むか（設計書19章）。
 * 数値項目は加算、`regionalTension` だけは三段階の置き換えになる。
 */
export function applyNationDelta(nation: NationStatus, delta: NationStatusDelta): NationStatus {
  return {
    approval: clamp(nation.approval + (delta.approval ?? 0), 0, 100),
    gdpTrillionYen: nation.gdpTrillionYen + (delta.gdpTrillionYen ?? 0),
    growthRate: round1(nation.growthRate + (delta.growthRate ?? 0)),
    cpi: round1(nation.cpi + (delta.cpi ?? 0)),
    unemployment: round1(nation.unemployment + (delta.unemployment ?? 0)),
    taxRevenueTrillionYen: nation.taxRevenueTrillionYen + (delta.taxRevenueTrillionYen ?? 0),
    expenditureTrillionYen: nation.expenditureTrillionYen + (delta.expenditureTrillionYen ?? 0),
    govDebtTrillionYen: nation.govDebtTrillionYen + (delta.govDebtTrillionYen ?? 0),
    populationTenThousand: nation.populationTenThousand + (delta.populationTenThousand ?? 0),
    regionalTension: delta.regionalTension ?? nation.regionalTension,
  };
}
