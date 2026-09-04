import type { Minutes } from "./clock";
import type { PlaceId } from "./place";

export type ActionCategory = "info" | "work" | "rest" | "life";

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
  /** 読んだことで積む性格フラグ、あるいは知ってしまった事実（設計書27章・28章）。 */
  flags?: string[];
}

export interface ConditionDelta {
  fatigue?: number;
  hunger?: number;
}

export interface Action {
  id: string;
  label: string;
  category: ActionCategory;
  /** Stands in for the action in the menu, ahead of the label (設計書31章). */
  emoji: string;
  /**
   * Where the action can be taken at all. Anything the current place does not
   * offer is simply left out of the menu rather than shown greyed (設計書16章).
   */
  places: PlaceId[];
  /** One line shown under the label in the action list. */
  hint: string;
  segments: Segment[];
  /** Applied once per consumed segment. */
  perSegment?: ConditionDelta;
  /** Segments reset when the action is picked again instead of being used up. */
  repeatable?: boolean;
  /**
   * 時間帯。夕食は夜にしかなく、朝刊は朝にしかない。場所と同じで、外れて
   * いるものは灰色にせず、そもそも一覧に出さない（設計書16章）。
   */
  from?: Minutes;
  until?: Minutes;
}
