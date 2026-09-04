import { DAY_LENGTH, type Minutes } from "../types/clock";
import type { Action, Segment } from "../types/action";
import type { SegmentRun } from "../types/mode";
import type { GameState } from "../types/game";
import { nextVisibleAppointment } from "./schedule";

/**
 * The next moment the player's time stops being their own. HARD な予定だけを
 * 見る — 柔らかい割り込みは時間を切らず、セグメントの切れ目で鳴るだけなので、
 * ここには入れない（設計書26章）。Null when the rest of the morning is theirs.
 */
export function nextInterruption(state: GameState): Minutes | null {
  const times = state.appointments
    .filter((appointment) => !appointment.resolved)
    .map((appointment) => appointment.at);
  return times.length > 0 ? Math.min(...times) : null;
}

/** No stretch of free time may run past the next interruption, or past 08:00. */
export function interruptionGuard(state: GameState): Minutes {
  const next = nextInterruption(state);
  return next === null ? DAY_LENGTH : Math.min(next, DAY_LENGTH);
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
  const limit = appointment ? Math.min(appointment.at, DAY_LENGTH) : DAY_LENGTH;
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
