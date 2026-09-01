import type { Effect } from "./stats";
import type { GameState } from "./game";

export type EventCategory = "cabinet" | "diet" | "diplomacy" | "private" | "scandal";

export interface EventChoice {
  id: string;
  label: string;
  effect: Effect;
  followUpNodeId?: string;
}

export interface DialogueNode {
  id: string;
  speakerLabel: string;
  prompt: string;
  choices: EventChoice[];
}

export interface DialogueTree {
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface EventDef {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  blocking: boolean; // true = requires player input & pauses fast-forward; false = auto-resolves as flavor
  choices?: EventChoice[];
  dialogue?: DialogueTree;
  autoEffect?: Effect; // applied automatically when blocking === false
}

export type EventTrigger =
  | { type: "fixed"; eventId: string; everyNDays: number; offset?: number; minDayIndex?: number }
  | { type: "conditional"; eventId: string; check: (state: GameState) => boolean; cooldownDays?: number }
  | {
      type: "random";
      eventId: string;
      weight: number | ((state: GameState) => number);
      minDayIndex?: number;
      cooldownDays?: number;
    };

export interface ScheduledEventInstance {
  eventId: string;
  dayIndex: number;
  currentDialogueNodeId?: string;
}
