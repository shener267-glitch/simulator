import type { ScheduledEventInstance } from "./events";

export interface DateCursor {
  year: number;
  month: number;
  day: number;
  dayIndex: number;
}

export interface TermInfo {
  termLengthDays: number;
  dissolutionThresholdApproval: number;
  scandalCollapseThreshold: number;
}

export interface GlobalStats {
  approvalRating: number;
  treasuryBalance: number;
  gdpGrowth: number;
  partyUnity: number;
  dietSeats: number;
  health: number;
  stress: number;
  scandalRisk: number;
}

export interface CountryRelationState {
  countryId: string;
  name: string;
  relationScore: number;
  lastMetDayIndex: number | null;
}

export interface FamilyMemberState {
  id: string;
  name: string;
  relation: string;
  relationship: number;
}

export interface FactionState {
  id: string;
  name: string;
  leaderName: string;
  personality: "hawkish" | "dovish" | "pragmatic" | "reformist";
  seatShare: number;
  loyalty: number;
  reshufflePressure: number;
}

export interface HistoryLogEntry {
  dayIndex: number;
  text: string;
  kind: "news" | "scandal" | "achievement" | "system";
}

export type GameStatus =
  | "playing"
  | "gameover_resignation"
  | "gameover_dissolution"
  | "gameover_scandal"
  | "termend";

export interface PolicyCooldowns {
  [policyAreaId: string]: number; // dayIndex when area becomes available again
}

export interface GameState {
  saveVersion: number;
  date: DateCursor;
  term: TermInfo;
  stats: GlobalStats;
  factions: Record<string, FactionState>;
  countryRelations: Record<string, CountryRelationState>;
  family: FamilyMemberState[];
  flags: Record<string, boolean>;
  history: HistoryLogEntry[];
  policyCooldowns: PolicyCooldowns;
  eventCooldowns: Record<string, number>; // eventId -> dayIndex when re-eligible
  activeEvent: ScheduledEventInstance | null;
  status: GameStatus;
  gameOverReason?: string;
}
