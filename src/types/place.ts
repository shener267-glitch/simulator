import type { Minutes } from "./clock";

/**
 * 現在地はこのゲームの中核（設計書15章）。場所は背景ではなく、そこで何が
 * できるかを決める仕組みそのもの。行動は自分の置かれる場所を宣言し、現在地に
 * ない行動はメニューに出さない（設計書16章）。
 */
export type PlaceId =
  // 議員宿舎。就任直後で、公邸にはまだ入居していない。
  | "bedroom"
  | "corridor"
  | "bath"
  | "living"
  | "study"
  // 官邸。閣議室や応接室は「立ち寄る部屋」ではなく予定の中の出来事として扱う。
  | "entrance"
  | "office"
  | "secretariat";

/**
 * 公邸に移るのは今後のイベント。建物を型で持っておけば、部屋を足すだけで
 * 引っ越しを作れる。
 */
export type Building = "dormitory" | "kantei";

export interface Place {
  id: PlaceId;
  /** 画面に出す正式な呼び方。「議員宿舎・寝室」 */
  label: string;
  /** 移動メニューなどで使う短い呼び方。「寝室」 */
  short: string;
  emoji: string;
  building: Building;
  /** 一続きになっている隣の部屋。移動はここに出ている先にしかできない。 */
  neighbours: PlaceId[];
}

/**
 * 隣の部屋まで一分。十分単位の行動の中では小さいが、次の予定まで八分という
 * ときには効いてくる（設計書25章）。
 */
export const MOVE_MINUTES: Minutes = 1;
