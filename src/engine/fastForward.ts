import type { GameState } from "../types/game";
import { advanceOneDay, type DayStepDeps } from "./dayStep";

export const FAST_FORWARD_SAFETY_CAP_DAYS = 90;

export interface FastForwardResult {
  state: GameState;
  daysAdvanced: number;
  stoppedReason: "event" | "gameover" | "cap";
}

/**
 * Repeatedly advances one day at a time until a blocking event appears, the
 * game ends, or the safety cap is hit (guards against runaway loops if
 * content data never produces a blocking event).
 */
export function fastForwardToNextEvent(state: GameState, deps: DayStepDeps): FastForwardResult {
  let current = state;
  let days = 0;

  while (days < FAST_FORWARD_SAFETY_CAP_DAYS) {
    current = advanceOneDay(current, deps);
    days += 1;

    if (current.status !== "playing") {
      return { state: current, daysAdvanced: days, stoppedReason: "gameover" };
    }
    if (current.activeEvent) {
      return { state: current, daysAdvanced: days, stoppedReason: "event" };
    }
  }

  return { state: current, daysAdvanced: days, stoppedReason: "cap" };
}
