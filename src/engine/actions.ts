import { MORNING_LENGTH, type Minutes } from "../types/clock";
import type { Action, Segment } from "../types/action";
import type { SegmentRun } from "../types/mode";
import type { GameState } from "../types/game";
import { nextVisibleAppointment } from "./schedule";

/**
 * The next moment the player's time stops being their own: an appointment they
 * have to attend, or something that arrives on its own. Null when the rest of
 * the morning is theirs.
 */
export function nextInterruption(state: GameState): Minutes | null {
  const times: Minutes[] = [];
  for (const appointment of state.appointments) {
    if (!appointment.resolved) times.push(appointment.at);
  }
  for (const event of state.events) {
    if (!event.fired) times.push(event.at);
  }
  return times.length > 0 ? Math.min(...times) : null;
}

/** No stretch of free time may run past the next interruption, or past 08:00. */
export function interruptionGuard(state: GameState): Minutes {
  const next = nextInterruption(state);
  return next === null ? MORNING_LENGTH : Math.min(next, MORNING_LENGTH);
}

/** How long the player can keep going before something takes over. */
export function freeMinutes(state: GameState): Minutes {
  return Math.max(0, interruptionGuard(state) - state.clock);
}

/**
 * What the player is allowed to know: the time to the next item on the
 * schedule, or to the end of the morning. Things that have not been announced
 * — events that have not arrived, appointments marked `announced: false` — are
 * deliberately left out; being cut off by one is supposed to be a surprise.
 */
export function visibleFreeMinutes(state: GameState): Minutes {
  const appointment = nextVisibleAppointment(state);
  const limit = appointment ? Math.min(appointment.at, MORNING_LENGTH) : MORNING_LENGTH;
  return Math.max(0, limit - state.clock);
}

export function segmentFits(state: GameState, segment: Segment): boolean {
  return state.clock + segment.minutes <= interruptionGuard(state);
}

/** 途中まで読んだものは、その続きから数える。 */
export function resumeIndex(state: GameState, action: Action): number {
  return action.repeatable ? 0 : (state.actionProgress[action.id] ?? 0);
}

/** この行動に残っている分。最後まで付き合ったときの長さ。 */
export function actionMinutesLeft(state: GameState, action: Action): Minutes {
  return action.segments
    .slice(resumeIndex(state, action))
    .reduce((total, segment) => total + segment.minutes, 0);
}

export interface DurationOption {
  minutes: Minutes;
  /** 次の予定までに入らないものは、見せるが選ばせない（設計書6章）。 */
  available: boolean;
}

/** 一度に出す選択肢の数。多いと「どのくらい？」が計算問題になってしまう。 */
const DURATION_CHOICES = 3;

/**
 * 「どのくらい？」の選択肢（設計書6章）。セグメントの区切りから作るので、
 * 選んだ長さは必ず区切りの上に乗る。データに書き足す形にすると本文と
 * ずれていくので、ここで数える。
 *
 * 判断の材料に使うのは visibleFreeMinutes — プレイヤーが知ってよい分だけ。
 */
export function durationOptions(state: GameState, action: Action): DurationOption[] {
  const room = visibleFreeMinutes(state);
  const options: DurationOption[] = [];
  let total = 0;

  for (const segment of action.segments.slice(resumeIndex(state, action))) {
    total += segment.minutes;
    options.push({ minutes: total, available: total <= room });
    if (options.length === DURATION_CHOICES) break;
  }

  return options;
}

/** 目安に届くまであと何分か。届いていれば null。 */
export function remainingToTarget(run: SegmentRun): Minutes | null {
  if (run.targetMinutes === null) return null;
  const left = run.targetMinutes - run.minutesSpent;
  return left > 0 ? left : null;
}

/** もう出せるものがない行動。 */
export function isSpent(state: GameState, action: Action): boolean {
  return state.spentActions.includes(action.id) || resumeIndex(state, action) >= action.segments.length;
}
