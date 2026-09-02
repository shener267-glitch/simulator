import type { Minutes } from "./clock";

/**
 * 現在地はv0.2の中核（設計書15章）。場所は背景ではなく、そこで何ができるかを
 * 決めるゲームシステムそのもの。行動は自分が置かれる場所を宣言し、現在地に
 * ない行動はメニューに出さない（設計書16章）。
 */
export type PlaceId =
  | "bedroom"
  | "corridor"
  | "bath"
  | "living"
  | "study"
  | "office"
  | "secretariat";

/** 公邸と官邸は徒歩一分の隣同士だが、行き来するのは予定の側の都合による。 */
export type Building = "residence" | "kantei";

export interface Place {
  id: PlaceId;
  /** 画面に出す正式な呼び方。「公邸・寝室」 */
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
