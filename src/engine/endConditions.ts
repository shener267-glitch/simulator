import type { GameState, GameStatus } from "../types/game";

export interface EndCheckResult {
  status: GameStatus;
  reason: string;
}

/**
 * Health collapse and scandal collapse are checked as immediate single-stat
 * thresholds. Dissolution requires both low approval AND low party unity so a
 * single bad day of approval alone can't end the game (mirrors needing the
 * party to actually abandon the PM, not just public opinion dipping).
 */
export function checkEndConditions(state: GameState): EndCheckResult | null {
  if (state.stats.health <= 0) {
    return { status: "gameover_resignation", reason: "体調が限界に達し、療養のため辞任しました。" };
  }

  if (
    state.stats.scandalRisk >= state.term.scandalCollapseThreshold &&
    state.stats.approvalRating <= 25
  ) {
    return {
      status: "gameover_scandal",
      reason: "スキャンダルへの批判が高まり、内閣は総辞職に追い込まれました。",
    };
  }

  if (state.stats.approvalRating <= state.term.dissolutionThresholdApproval && state.stats.partyUnity <= 30) {
    return {
      status: "gameover_dissolution",
      reason: "支持率低迷と党内の求心力低下により、衆議院が解散され総選挙で政権を失いました。",
    };
  }

  if (state.date.dayIndex >= state.term.termLengthDays) {
    return { status: "termend", reason: "任期満了を迎えました。" };
  }

  return null;
}
