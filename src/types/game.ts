import type { Country } from "./country";
import type { Budget, EconomyStats, ScheduledEconomyEffect } from "./economy";
import type { DiplomacyState } from "./diplomacy";
import type { FocusProgress } from "./focus";
import type { GameTime } from "./gameTime";
import type { MilitaryState } from "./military";
import type { Leader, NationalModifier, Party, PoliticalStats } from "./politics";
import type { ResearchProgress } from "./research";

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
 * 国家方針・研究が完了したとき／それが引いた簡易イベントを、画面中央に
 * 確認させるための通知（指示書15・16章、Phase 3で研究完了を追加）。
 * 複数積むこともあるので配列で持つ——完了の確認のあとにイベントが続く、
 * という順番をそのまま表現できる。
 */
export type FocusNotice =
  | { kind: "focus_complete"; focusId: string }
  | { kind: "tech_complete"; techId: string }
  | { kind: "event"; eventId: string };

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

/** プレイヤーの国の経済状況（Phase 3指示書1〜10章）。 */
export interface EconomyState {
  stats: EconomyStats;
  budget: Budget;
  /** 一度決めた経済政策は再度決められない。 */
  decidedPolicyIds: string[];
  scheduledEffects: ScheduledEconomyEffect[];
  /** ゲーム開始からの経過分。gameTimeと同じ歩調で進む、政策の時間差効果の基準。 */
  elapsedMinutes: number;
}

/** プレイヤーの国の研究状況（指示書11〜19章）。 */
export interface ResearchState {
  /** 同時に進められる研究の数。 */
  slots: number;
  active: ResearchProgress[];
  completedTechIds: string[];
  unlockedTechIds: string[];
  /** 国家方針・予算などから積み上がる、研究速度への加算ボーナス(%)。 */
  speedBonusPercent: number;
  modifiers: NationalModifier[];
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
  economy: EconomyState;
  research: ResearchState;
  diplomacy: DiplomacyState;
  military: MilitaryState;
  /** メイン画面で地図をクリックして覗いている国。何も開いていなければnull。 */
  inspectingCountryId: string | null;
  /** 下部メニューでいま開いているカテゴリ。閉じていればnull。 */
  activeCategory: CategoryId | null;
}
