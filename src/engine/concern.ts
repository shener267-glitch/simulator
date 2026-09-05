import type { Concern } from "../types/concern";
import type { GameState } from "../types/game";
import { CONCERNS } from "../data/concerns";

/** 一度に出す上限。並べすぎるとToDoリストに見える。 */
export const MAX_CONCERNS = 2;

/**
 * いま気になっていること。状態には持たず、時刻・体調・フラグから毎回導く —
 * 保存するものが増えないし、「消し忘れた内心」が残ることもない。
 *
 * 体の感覚は時計ではなく体調から出す。朝食を抜けば腹の話が出てくるし、
 * 取っていれば出てこない。
 */
export function activeConcerns(state: GameState): Concern[] {
  return CONCERNS.filter(
    (concern) =>
      (concern.from === undefined || state.clock >= concern.from) &&
      (concern.until === undefined || state.clock < concern.until) &&
      (concern.whenFatigueOver === undefined ||
        state.condition.fatigue > concern.whenFatigueOver) &&
      (concern.whenHungerOver === undefined || state.condition.hunger > concern.whenHungerOver) &&
      (concern.requiresFlags ?? []).every((flag) => state.flags.includes(flag)) &&
      !(concern.unlessFlags ?? []).some((flag) => state.flags.includes(flag)),
  ).slice(0, MAX_CONCERNS);
}
