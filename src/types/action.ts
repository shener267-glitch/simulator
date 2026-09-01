import type { Minutes } from "./clock";

export type ActionCategory = "info" | "people" | "work" | "rest" | "life";

/**
 * One stretch of an action. Actions are split into segments so the player can
 * stop partway and only pay for what they actually spent (設計書13章).
 */
export interface Segment {
  minutes: Minutes;
  /** Who is talking, for conversation-shaped segments. */
  speaker?: string;
  /** What happened during this stretch. */
  text: string;
  /** List-shaped content — SNS posts, headlines — rendered as separate blocks. */
  lines?: string[];
  /** Recorded in the morning's highlights when this segment is consumed. */
  highlight?: string;
}

export interface ConditionDelta {
  fatigue?: number;
  hunger?: number;
}

export interface Action {
  id: string;
  label: string;
  category: ActionCategory;
  /** One line shown under the label in the action list. */
  hint: string;
  segments: Segment[];
  /** Applied once per consumed segment. */
  perSegment?: ConditionDelta;
  /** Segments reset when the action is picked again instead of being used up. */
  repeatable?: boolean;
}
