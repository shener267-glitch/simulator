import type { Duty } from "../types/task";
import type { GameState } from "../types/game";
import { DUTIES } from "../data/duties";

/** 一度に出す上限。長い一覧はチェックリストに見える。 */
export const MAX_DUTIES = 4;

/**
 * いま抱えている仕事。内心と同じく、状態には持たず時刻とフラグから導く。
 * 済んだものは一度だけ残して見せ、次に何かが片付いたところで押し出される。
 */
export function activeDuties(state: GameState): Duty[] {
  const live = DUTIES.filter(
    (duty) =>
      (duty.from_ === undefined || state.clock >= duty.from_) &&
      (duty.until === undefined || state.clock < duty.until) &&
      (duty.requiresFlags ?? []).every((flag) => state.flags.includes(flag)) &&
      !(duty.unlessFlags ?? []).some((flag) => state.flags.includes(flag)),
  ).map((duty) => ({
    ...duty,
    done: duty.doneFlags.some((flag) => state.flags.includes(flag)),
  }));

  // 済んでいないものを先に。片付いたものは後ろに一件だけ残す。
  const open = live.filter((duty) => !duty.done);
  const done = live.filter((duty) => duty.done).slice(-1);
  return [...open, ...done].slice(0, MAX_DUTIES);
}

/** まだ手をつけていない仕事の数。ヘッダーの小さな印に使う。 */
export function openDutyCount(state: GameState): number {
  return activeDuties(state).filter((duty) => !duty.done).length;
}
