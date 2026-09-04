import type { Concern } from "../types/concern";
import type { GameState } from "../types/game";
import { CONCERNS } from "../data/concerns";

/** 一度に出す上限。並べすぎるとToDoリストに見える。 */
export const MAX_CONCERNS = 2;

/**
 * いま気になっていること。状態には持たず、時刻とフラグから毎回導く —
 * 保存するものが増えないし、「消し忘れた内心」が残ることもない。
 */
export function activeConcerns(state: GameState): Concern[] {
  return CONCERNS.filter(
    (concern) =>
      (concern.from === undefined || state.clock >= concern.from) &&
      (concern.until === undefined || state.clock < concern.until) &&
      (concern.requiresFlags ?? []).every((flag) => state.flags.includes(flag)) &&
      !(concern.unlessFlags ?? []).some((flag) => state.flags.includes(flag)),
  ).slice(0, MAX_CONCERNS);
}
