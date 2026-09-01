import type { StatKey } from "../types/stats";

export const STAT_LABELS: Record<StatKey, string> = {
  approvalRating: "支持率",
  treasuryBalance: "財政",
  gdpGrowth: "GDP成長率",
  partyUnity: "党内結束",
  dietSeats: "議席数",
  health: "健康",
  stress: "ストレス",
  scandalRisk: "スキャンダルリスク",
};

/** true = a higher value is better for the player. */
export const STAT_HIGHER_IS_GOOD: Record<StatKey, boolean> = {
  approvalRating: true,
  treasuryBalance: true,
  gdpGrowth: true,
  partyUnity: true,
  dietSeats: true,
  health: true,
  stress: false,
  scandalRisk: false,
};

export function formatDelta(stat: StatKey, delta: number): string {
  const sign = delta > 0 ? "+" : "";
  const rounded = Number.isInteger(delta) ? delta : delta.toFixed(1);
  return `${sign}${rounded} ${STAT_LABELS[stat]}`;
}

export function isGoodDelta(stat: StatKey, delta: number): boolean {
  if (delta === 0) return true;
  const higherIsGood = STAT_HIGHER_IS_GOOD[stat];
  return delta > 0 ? higherIsGood : !higherIsGood;
}

export function formatRelationDelta(label: string, delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ${label}`;
}
