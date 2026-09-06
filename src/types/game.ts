import type { Country } from "./country";
import type { FocusProgress } from "./focus";
import type { GameTime } from "./gameTime";
import type { Leader, NationalModifier, Party, PoliticalStats } from "./politics";

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

/**
 * 国家方針が完了したとき／それが引いた簡易イベントを、画面中央に確認させる
 * ための通知（指示書15・16章）。複数積むこともあるので配列で持つ——
 * 完了の確認のあとにイベントが続く、という順番をそのまま表現できる。
 */
export type FocusNotice = { kind: "focus_complete"; focusId: string } | { kind: "event"; eventId: string };

/** プレイヤーの国の政治状況（Phase 2指示書1〜17章）。 */
export interface PoliticsState {
  leader: Leader;
  stats: PoliticalStats;
  parties: Party[];
  completedFocusIds: string[];
  /** `unlock_focus`効果で明示的に解禁された方針のid。 */
  unlockedFocusIds: string[];
  activeFocus: FocusProgress | null;
  modifiers: NationalModifier[];
  pendingNotices: FocusNotice[];
}

export interface GameState {
  saveVersion: number;
  phase: Phase;
  /** 国家選択画面でいま選ばれている（プレビュー中の）国のid。 */
  selectedCountryId: string;
  /** ゲーム開始後、プレイヤーが担う国のid。選択前はnull。 */
  playerCountryId: string | null;
  gameTime: GameTime;
  countries: Country[];
  politics: PoliticsState;
  /** メイン画面で地図をクリックして覗いている国。何も開いていなければnull。 */
  inspectingCountryId: string | null;
  /** 下部メニューでいま開いているカテゴリ。閉じていればnull。 */
  activeCategory: CategoryId | null;
}
