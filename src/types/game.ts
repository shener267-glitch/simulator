import type { Minutes } from "./clock";
import type { PlaceId } from "./place";
import type { Mode } from "./mode";

/**
 * Tracked internally but never rendered as a number — the UI shows the prose
 * from engine/condition.ts and a five-cell meter, and neither ever prints a
 * digit（設計書24章・30章）.
 */
export interface Condition {
  /** 0 = 万全, 100 = 限界. */
  fatigue: number;
  /** 0 = 満腹, 100 = 空腹. */
  hunger: number;
}

/**
 * A fixed point in the morning the player does not control — HARD. Crossing
 * one cuts a segment short and charges only the minutes that were really left.
 */
export interface Appointment {
  id: string;
  label: string;
  /** Offset from 05:00. Events may pull this earlier. */
  at: Minutes;
  minutes: Minutes;
  resolved: boolean;
  /** Where attending it leaves the player — 07:30の官邸入りがこれ。 */
  movesTo?: PlaceId;
  /**
   * 予定表に載っているか。false のものは visibleFreeMinutes から隠れ、
   * 不意打ちとして届く。省略時は true — 黙っていればプレイヤーは知っている。
   */
  announced?: boolean;
  /** Recorded in the morning's highlights once attended. */
  highlight?: string;
}

/** Something that arrives on its own at a set time (設計書17章). */
export interface TimedEvent {
  id: string;
  at: Minutes;
  title: string;
  /** Who got in touch. */
  from: string;
  body: string[];
  /** Pulls an appointment to a new time when the event fires. */
  movesAppointment?: {
    appointmentId: string;
    to: Minutes;
    note: string;
  };
  highlight: string;
  fired: boolean;
}

/** What the player did and how long it took — the morning review reads this. */
export interface LogEntry {
  label: string;
  minutes: Minutes;
  startedAt: Minutes;
  /** 移動の一分。続けて歩いた分は一行にまとめる。 */
  move?: boolean;
}

export type Phase = "morning" | "review";

export interface GameState {
  saveVersion: number;
  clock: Minutes;
  phase: Phase;
  player: {
    familyName: string;
    givenName: string;
  };
  /** いまいる場所。画面（mode）とは独立 — 風呂にいるまま電話は見られる。 */
  place: PlaceId;
  condition: Condition;
  appointments: Appointment[];
  events: TimedEvent[];
  /** いまどの画面にいるか。 */
  mode: Mode;
  log: LogEntry[];
  /** Notable moments, in the order they happened. */
  highlights: string[];
  /** 性格フラグ（設計書28章）。v0.2では貯めるだけで、誰の反応にも使わない。 */
  flags: string[];
  /** Actions whose segments have all been used up. */
  spentActions: string[];
  /** How far into each action the player has read, so returning to it resumes. */
  actionProgress: Record<string, number>;
}
