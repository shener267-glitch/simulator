export type StatKey =
  | "approvalRating" // 支持率 0-100
  | "treasuryBalance" // 財政 (兆円, マイナス可)
  | "gdpGrowth" // GDP成長率 (%, マイナス可)
  | "partyUnity" // 党内結束 0-100
  | "dietSeats" // 議席数
  | "health" // 健康 0-100
  | "stress" // ストレス 0-100
  | "scandalRisk"; // スキャンダルリスク 0-100

export const CLAMPED_0_100_STATS: readonly StatKey[] = [
  "approvalRating",
  "partyUnity",
  "health",
  "stress",
  "scandalRisk",
];

export interface StatDelta {
  stat: StatKey;
  delta: number;
}

export type RelationKind = "country" | "faction" | "family";

export interface RelationDelta {
  kind: RelationKind;
  id: string;
  delta: number;
}

export interface Effect {
  deltas: StatDelta[];
  relationDeltas?: RelationDelta[];
  flagsSet?: string[];
  description?: string;
}
