/**
 * 軍事・安全保障まわりのデータ（Phase 5指示書0〜39章）。軍事力を「総兵力」の
 * 一つの数字にせず、人員・陸上・海上・航空・ミサイル・その他（衛星・
 * サイバー・電子戦・情報）を、それぞれ独立した能力指数として持つ
 * （指示書2章）。政治・経済・研究・外交と同じ、閉じた語彙のEffect
 * システムをここでも使う。
 */

/** 陸海空・ミサイル・その他の五分類（指示書2章）。能力指数は0〜100。 */
export type MilitaryForceCategory = "land" | "sea" | "air" | "missile" | "other";

export interface PersonnelStats {
  activeDuty: number;
  reserve: number;
  mobilizable: number;
  /** 定員に対する充足率、% */
  fillRatePercent: number;
}

/** 陸上戦力の内訳（指示書2章）。能力指数（0〜100）と、目安となる実数を両方持つ。 */
export interface LandForceStats {
  capability: number;
  units: number;
  tanksArmor: number;
  artillery: number;
  airDefenseUnits: number;
  longRangeFire: number;
}

export interface SeaForceStats {
  capability: number;
  destroyers: number;
  submarines: number;
  carrierAviation: number;
  supplyShips: number;
  patrolVessels: number;
}

export interface AirForceStats {
  capability: number;
  fighters: number;
  attackAircraft: number;
  transportAircraft: number;
  awacs: number;
  patrolAircraft: number;
  helicopters: number;
}

export interface MissileForceStats {
  capability: number;
  airDefenseMissiles: number;
  antiShipMissiles: number;
  longRangeMissiles: number;
}

/** 衛星・サイバー・電子戦・情報収集。指示書2章のとおりデータとしては持つが、専用の操作画面は今回作らない。 */
export interface OtherForceStats {
  capability: number;
  satellites: number;
  cyber: number;
  electronicWarfare: number;
  intelligenceGathering: number;
}

export interface ForceStats {
  land: LandForceStats;
  sea: SeaForceStats;
  air: AirForceStats;
  missile: MissileForceStats;
  other: OtherForceStats;
}

/** 防衛態勢5段階（指示書11章）。上げるほど即応能力は上がるが、経済・人員・外交への負担も増える。 */
export type ReadinessLevel = "normal" | "alert" | "high_alert" | "emergency" | "full_mobilization";

/** 動員状態4段階（指示書12章）。 */
export type MobilizationState = "peacetime" | "partial" | "large_scale" | "full";

/** 徴募制度（指示書13章）。日本の2024年開始シナリオは志願制を初期値にする。 */
export type ConscriptionPolicyId = "volunteer" | "draft" | "reserve_expansion";

export type UnitBranch = "gsdf" | "msdf" | "asdf" | "joint";
export type UnitStatus = "garrison" | "moving" | "deployed";
/** 防御命令（HOI4型改訂・指示書4章）。攻撃・待機・撤退・再配置は既存のMOVE_UNITS／不作為で表現し、これだけ状態として持つ。 */
export type UnitOrder = "defend";

/** 日本周辺の軍事的な地理区分12件（指示書5章）。プロヴィンス導入後もこの粒度の集計・前線表示に使い続ける。 */
export type MilitaryRegionId =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "nansei"
  | "sea_of_japan"
  | "east_china_sea"
  | "pacific_ocean";

export type BaseKind = "army" | "navy" | "air";

export interface Base {
  id: string;
  name: string;
  kind: BaseKind;
  regionId: MilitaryRegionId;
  /** 所在プロヴィンス（HOI4型改訂）。 */
  provinceId: string;
}

/** 地形（HOI4型改訂・指示書2章）。戦闘計算・移動速度に影響する。 */
export type TerrainType = "plains" | "mountains" | "forest" | "urban" | "coastal" | "sea";

/**
 * プロヴィンス——作戦地図をさらに細かく分割した区画（HOI4型改訂・指示書2章）。
 * `regionId`で既存の12地域区分（前線表示・集計）とも紐づける。海のプロヴィンス
 * は`kind:"sea"`、艦隊はここへ配置する。
 */
export interface Province {
  id: string;
  name: string;
  regionId: MilitaryRegionId;
  kind: "land" | "sea";
  terrain: TerrainType;
  /** 所有国。他国の実在の領有権を主張するものではなく、Phase 5改訂ではJPNのみ実データを持つ。 */
  ownerCountryId: string;
  /** 0〜10。移動速度・補給に影響する簡略化した指数。 */
  infrastructureLevel: number;
  /** 0〜100。補給の届きやすさの簡略化した指数。 */
  supplyLevel: number;
  hasCity: boolean;
  hasPort: boolean;
  baseId?: string;
  /** 0〜10。防御施設の充実度、防御側の戦闘計算に加算する。 */
  fortificationLevel: number;
  /**
   * 戦争中、前線として係争状態にあるか（指示書4・5章）。他国の実在の領有権を
   * 動かすものではなく、あくまでゲーム上の「ここが前線になっている」という
   * 一時的なフラグ——味方プロヴィンスに立つこともある。
   */
  contested: boolean;
  /** 簡略化した地図上の座標（実在の地理座標ではない、指示書4章のスケッチに沿う）。 */
  position: { x: number; y: number };
}

export interface Unit {
  id: string;
  name: string;
  branch: UnitBranch;
  personnel: { current: number; max: number };
  equipmentRatePercent: number;
  moralePercent: number;
  baseId: string;
  regionId: MilitaryRegionId;
  /** 所在プロヴィンス（HOI4型改訂）。移動・戦闘はこちらの粒度で行う。 */
  provinceId: string;
  status: UnitStatus;
  order?: UnitOrder;
  /** 移動中のみ。到着予定の絶対分。 */
  destinationProvinceId?: string;
  arrivalAtMinute?: number;
  /** 移動元。撤退・戦闘敗北時に戻る先。 */
  originProvinceId?: string;
}

export type FleetMission = "patrol" | "escort" | "transport" | "blockade" | "asw" | "attack" | "standby" | "return_to_port";

export interface Fleet {
  id: string;
  name: string;
  destroyers: number;
  submarines: number;
  supplyShips: number;
  baseId: string;
  regionId: MilitaryRegionId;
  /** 所在プロヴィンス（海のプロヴィンス、HOI4型改訂）。 */
  provinceId: string;
  mission: FleetMission;
  status: UnitStatus;
  destinationProvinceId?: string;
  arrivalAtMinute?: number;
}

export type AirWingMission = "air_defense" | "intercept" | "air_superiority" | "anti_ship" | "close_air_support" | "reconnaissance";

export interface AirWing {
  id: string;
  name: string;
  fighters: number;
  supportAircraft: number;
  baseId: string;
  /** 航続圏内としてカバーする地域（指示書9章、機体の航続距離から決まる範囲）。 */
  coverageRegionIds: MilitaryRegionId[];
  mission: AirWingMission;
  /** プレイヤーが指定する作戦地域（HOI4型改訂・指示書7章）。coverageRegionIds内のみ指定できる。 */
  targetRegionId?: MilitaryRegionId;
}

export type ProductionItemId = "fighter" | "destroyer" | "tank" | "missile";

export interface ProductionLine {
  itemId: ProductionItemId;
  factories: number;
  efficiencyPercent: number;
  /** ここまでの累積生産（能力指数への還元に使う、指示書16章の簡略化）。 */
  accumulatedOutput: number;
}

/** 各国の軍事情報スナップショット（指示書20・21章）。確度は必ず不確実——プレイヤーが世界の全てを知っている状態にはしない。 */
export interface IntelSnapshot {
  countryId: string;
  landEstimate: number;
  seaEstimate: number;
  airEstimate: number;
  confidencePercent: number;
}

export interface MilitaryLogEntry {
  id: string;
  atMinute: number;
  text: string;
  /** 情報確度のタグ（指示書21章）。イベントログの一部は情報レポートも兼ねる。 */
  confidence?: "high" | "medium" | "low" | "unconfirmed";
}

/** 軍事の閉じたEffect語彙（他システムと同じ形）。 */
export type MilitaryEffect =
  | { type: "modify_capability"; category: MilitaryForceCategory; amount: number }
  | { type: "modify_personnel"; field: keyof PersonnelStats; amount: number }
  | { type: "modify_political_power"; amount: number }
  | { type: "modify_relation"; countryId: string; amount: number; label: string }
  | { type: "modify_government_support"; amount: number }
  | { type: "trigger_event"; eventId: string };

export interface ScheduledMilitaryEffect {
  id: string;
  atMinute: number;
  effects: MilitaryEffect[];
}

export type AllianceCooperationId = "intel_sharing" | "base_access" | "joint_exercise" | "logistics_support" | "joint_defense";

/** 作戦（指示書25・26章）。プレイヤーは方針を決め、部隊の1マスずつの操作はしない。 */
export type OperationPriority = "defense" | "sea_control" | "air_superiority" | "logistics";

export interface Operation {
  id: string;
  name: string;
  objective: string;
  regionId: MilitaryRegionId;
  priority: OperationPriority;
  unitIds: string[];
  fleetIds: string[];
  airWingIds: string[];
  startedAtMinute: number;
}

export type FrontStatus = "calm" | "tense" | "active";

export interface WarState {
  enemyCountryId: string;
  startedAtMinute: number;
  frontStatus: Record<MilitaryRegionId, FrontStatus>;
}

/**
 * 軍事の通知。国家方針・外交の通知と同じキュー方式だが、緊急報告・武力攻撃は
 * 「確認するだけ」では終わらない——短い対応選択肢を持つ（指示書22・23・32章）。
 */
export type MilitaryNotice =
  | { kind: "military_event"; eventId: string }
  | { kind: "armed_attack"; enemyCountryId: string };

export interface MilitaryState {
  personnel: PersonnelStats;
  forces: ForceStats;
  readiness: ReadinessLevel;
  mobilization: MobilizationState;
  conscriptionPolicy: ConscriptionPolicyId;
  provinces: Province[];
  bases: Base[];
  units: Unit[];
  fleets: Fleet[];
  airWings: AirWing[];
  productionLines: ProductionLine[];
  intel: Record<string, IntelSnapshot>;
  operations: Operation[];
  war: WarState | null;
  scheduledEffects: ScheduledMilitaryEffect[];
  eventLog: MilitaryLogEntry[];
  pendingNotices: MilitaryNotice[];
  /** ゲーム開始からの経過分。gameTimeと同じ歩調で進む、段階的効果の基準。 */
  elapsedMinutes: number;
}
