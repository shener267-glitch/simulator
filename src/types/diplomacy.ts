/**
 * 外交まわりのデータ（Phase 4指示書0〜29章）。関係を一つの数字にせず、
 * 基準値＋内訳（modifiers）として持ち、政府間・経済・軍事の三本のメーターは
 * 別に持つ——政治・経済・研究で繰り返してきた「閉じた語彙のEffect」の
 * パターンをそのまま外交にも使う。
 */

/** 世界情勢パネルの4地域（指示書24章）。 */
export type RegionId = "europe" | "east_asia" | "middle_east" | "pacific";

/** 複数選択・併用可能な外交スタンス（指示書20章）。 */
export type DiplomaticStanceId =
  | "isolationism"
  | "internationalism"
  | "free_trade"
  | "protectionism"
  | "alliance_focus"
  | "status_quo";

/** 関係値の内訳一件。恒久のものと、`expiresAtMinute`を持つ期限つきのものがある。 */
export interface RelationModifier {
  id: string;
  label: string;
  amount: number;
  expiresAtMinute?: number;
}

/**
 * 他国AIの簡易性格（指示書26章）。いまは外交行動の発火確率にだけ効く——
 * 経済・政治・軍事まで含む本格AIは今回作らない。将来ここへ差し替え可能な
 * 値として持たせてある、という指示書の要求どおり、固定の型に閉じている。
 */
export type AiPersonality = "cooperative" | "assertive" | "isolationist" | "pragmatic";

export type TreatyTypeId =
  | "friendship"
  | "trade_agreement"
  | "defense_cooperation"
  | "mutual_defense"
  | "non_aggression"
  | "resource_supply";

/** 外交の閉じたEffect語彙（指示書各章）。国家方針・経済と同じ形。 */
export type DiplomacyEffect =
  | { type: "modify_relation"; countryId: string; amount: number; label: string }
  | { type: "modify_bar"; countryId: string; bar: "gov" | "econ" | "mil"; amount: number }
  | { type: "modify_regional_tension"; region: RegionId; amount: number }
  | { type: "modify_political_power"; amount: number }
  | { type: "modify_government_support"; amount: number }
  | { type: "add_treaty"; countryId: string; treatyTypeId: TreatyTypeId }
  | { type: "modify_trade"; field: keyof TradeState; amount: number }
  | { type: "trigger_event"; eventId: string };

/** 行動の効果も、経済政策と同じ「段階を時間差で適用する」形にする（指示書8章と同じ発想）。 */
export interface DiplomaticActionStage {
  afterDays: number;
  effects: DiplomacyEffect[];
}

export interface DiplomaticActionTemplate {
  id: string;
  name: string;
  description: string;
  politicalPowerCost: number;
  /** この関係値の範囲でだけ選べる。省略した側は無制限。 */
  minRelation?: number;
  maxRelation?: number;
  /** 発動後、同じ相手には何日再選択できないか。 */
  cooldownDays: number;
  stages: DiplomaticActionStage[];
}

export interface ScheduledDiplomacyEffect {
  id: string;
  /** `DiplomacyState.elapsedMinutes`と同じ基準での絶対値。 */
  atMinute: number;
  effects: DiplomacyEffect[];
}

/** 条約交渉の追加条項（簡易チェックボックス交渉、指示書13章）。 */
export interface NegotiationClause {
  id: string;
  label: string;
  politicalPowerCost: number;
  effects: DiplomacyEffect[];
}

export interface TreatyTemplate {
  id: TreatyTypeId;
  name: string;
  description: string;
  /** nullは無期限。 */
  durationDays: number | null;
  minRelationToPropose: number;
  politicalPowerCost: number;
  effects: DiplomacyEffect[];
  breakConditionLabel: string;
  optionalClauses: NegotiationClause[];
}

export interface Treaty {
  id: string;
  treatyTypeId: TreatyTypeId;
  countryId: string;
  signedAtMinute: number;
  expiresAtMinute: number | null;
}

/** 簡易的な陣営（指示書14章）。加盟国の配列を持つだけの、ゆるい枠組み。 */
export interface Faction {
  id: string;
  name: string;
  leaderCountryId: string;
  memberCountryIds: string[];
}

/** 簡易的な二国間資源貿易（指示書15章）。例示どおり原油・鉄鉱石の輸入と、機械・電子機器の輸出。 */
export interface TradeState {
  oilImportNeedTrillionYen: number;
  oilImportFilledTrillionYen: number;
  ironImportNeedTrillionYen: number;
  ironImportFilledTrillionYen: number;
  machineryExportCapacityTrillionYen: number;
  electronicsExportCapacityTrillionYen: number;
}

export interface CountryDiplomacy {
  countryId: string;
  baseRelation: number;
  modifiers: RelationModifier[];
  /** 政府間・経済・軍事、それぞれ0〜100のメーター（指示書5章）。 */
  barGov: number;
  barEcon: number;
  barMil: number;
  personality: AiPersonality;
  treaties: Treaty[];
  /** 行動id→最後に選んだ絶対分。クールダウン判定に使う。 */
  lastActionAtMinute: Record<string, number>;
}

export interface DiplomaticLogEntry {
  id: string;
  atMinute: number;
  text: string;
}

/** 首脳会談の準備期間（指示書9章）。準備が明けると通知が立つ。 */
export interface PendingSummit {
  id: string;
  countryId: string;
  /** 開催予定の絶対分。 */
  readyAtMinute: number;
}

/**
 * 外交上の通知。国家方針・研究の完了通知（`FocusNotice`）とは違い、
 * 「確認するだけ」では終わらないものがある——首脳会談の招請には
 * 承諾／延期／辞退、国際危機には短い対応選択肢がいる（指示書18・19章）。
 */
export type DiplomaticNotice =
  | { kind: "summit_invite"; countryId: string }
  | { kind: "international_crisis"; crisisId: string }
  | { kind: "diplomatic_event"; eventId: string };

export interface DiplomacyState {
  relations: Record<string, CountryDiplomacy>;
  stances: DiplomaticStanceId[];
  factions: Faction[];
  trade: TradeState;
  regionalTension: Record<RegionId, number>;
  scheduledEffects: ScheduledDiplomacyEffect[];
  pendingSummits: PendingSummit[];
  eventLog: DiplomaticLogEntry[];
  pendingNotices: DiplomaticNotice[];
  mapOverlayEnabled: boolean;
  /** ゲーム開始からの経過分。gameTimeと同じ歩調で進む、段階的効果の基準。 */
  elapsedMinutes: number;
}
