import type { Minutes } from "./clock";

/**
 * Tracked internally but never rendered as a number — the UI only ever shows
 * the prose from engine/condition.ts (設計書24章で健康システムは未決定のため、
 * v0.1では表示方法だけを確定させている).
 */
export interface Condition {
  /** 0 = 万全, 100 = 限界. */
  fatigue: number;
  /** 0 = 満腹, 100 = 空腹. */
  hunger: number;
}

/** A fixed point in the morning the player does not control. */
export interface Appointment {
  id: string;
  label: string;
  /** Offset from 05:00. Events may pull this earlier. */
  at: Minutes;
  minutes: Minutes;
  resolved: boolean;
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

export interface ActiveAction {
  actionId: string;
  /** Index of the segment that runs next. */
  segmentIndex: number;
  minutesSpent: Minutes;
  startedAt: Minutes;
  /** Set when an appointment or event cut the action short. */
  interrupted: boolean;
  /** Set when every segment has been consumed. */
  exhausted: boolean;
}

/** What the player did and how long it took — the morning review reads this. */
export interface LogEntry {
  label: string;
  minutes: Minutes;
  startedAt: Minutes;
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
  condition: Condition;
  appointments: Appointment[];
  events: TimedEvent[];
  log: LogEntry[];
  /** Notable moments, in the order they happened. */
  highlights: string[];
  /** Actions whose segments have all been used up. */
  spentActions: string[];
  /** How far into each action the player has read, so returning to it resumes. */
  actionProgress: Record<string, number>;
  activeAction: ActiveAction | null;
  /** Appointment being played out right now. */
  activeAppointmentId: string | null;
  /** Event notice currently on screen. */
  activeEventId: string | null;
}
