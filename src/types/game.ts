import type { Country } from "./country";
import type { GameTime } from "./gameTime";

export type Phase = "title" | "select" | "playing";

/** 下部メニューの八カテゴリ（指示書8章）。国家以外はPhase 1では仮画面。 */
export type CategoryId =
  | "politics"
  | "economy"
  | "diplomacy"
  | "military"
  | "research"
  | "production"
  | "intelligence"
  | "overview";

export interface GameState {
  saveVersion: number;
  phase: Phase;
  /** 国家選択画面でいま選ばれている（プレビュー中の）国のid。 */
  selectedCountryId: string;
  /** ゲーム開始後、プレイヤーが担う国のid。選択前はnull。 */
  playerCountryId: string | null;
  gameTime: GameTime;
  countries: Country[];
  /** メイン画面で地図をクリックして覗いている国。何も開いていなければnull。 */
  inspectingCountryId: string | null;
  /** 下部メニューでいま開いているカテゴリ。閉じていればnull。 */
  activeCategory: CategoryId | null;
}
