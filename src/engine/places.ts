import { MOVE_MINUTES, type Place, type PlaceId } from "../types/place";
import type { Minutes } from "../types/clock";
import type { Action } from "../types/action";
import { PLACES, neighboursOf } from "../data/places";
import { ACTIONS } from "../data/actions";

/**
 * 場所は背景ではなく、そこで何ができるかを決める仕組み（設計書15章）。
 * ここにあるのは問い合わせだけで、状態は持たない。
 */

/** いまいる場所から出られる先。行けない場所はそもそも返さない（設計書16章）。 */
export function exitsFrom(place: PlaceId): Place[] {
  return neighboursOf(place);
}

/** 一分。隣り合っていなければ null を返す — 一足飛びの移動は作らない。 */
export function travelMinutes(from: PlaceId, to: PlaceId): Minutes | null {
  return PLACES[from].neighbours.includes(to) ? MOVE_MINUTES : null;
}

export function canTravel(from: PlaceId, to: PlaceId): boolean {
  return travelMinutes(from, to) !== null;
}

/** その場所で選べる行動。並び順は ACTIONS の定義順のまま。 */
export function actionsAt(place: PlaceId): Action[] {
  return ACTIONS.filter((action) => action.places.includes(place));
}
