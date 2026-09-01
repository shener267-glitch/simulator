import type { Effect } from "./stats";

export interface PolicyOption {
  id: string;
  label: string;
  description: string;
  effect: Effect;
  requiresFlags?: string[];
  factionReactions?: Record<string, number>; // factionId -> loyalty delta
}

export interface PolicyArea {
  id: string;
  name: string;
  description: string;
  options: PolicyOption[];
  cooldownDays: number;
}
