import type {
  AllianceCooperationId,
  Base,
  AirWing,
  Fleet,
  ForceStats,
  MilitaryEffect,
  MilitaryRegionId,
  PersonnelStats,
  ProductionItemId,
  ProductionLine,
  Unit,
} from "../types/military";

/** 日本周辺の軍事的な地理区分12件のラベル（指示書5章）。 */
export const MILITARY_REGION_LABELS: Record<MilitaryRegionId, string> = {
  hokkaido: "北海道",
  tohoku: "東北",
  kanto: "関東",
  chubu: "中部",
  kinki: "近畿",
  chugoku: "中国",
  shikoku: "四国",
  kyushu: "九州",
  nansei: "南西諸島",
  sea_of_japan: "日本海",
  east_china_sea: "東シナ海",
  pacific_ocean: "太平洋",
};

/**
 * 地域どうしの隣接関係（指示書7章、部隊移動の速度に使う）。実際の地理を
 * ゆるく模した簡略化——道路・鉄道・港湾などの詳細なインフラ差は扱わない
 * 【ゲーム上の設定】。
 */
export const REGION_ADJACENCY: Record<MilitaryRegionId, MilitaryRegionId[]> = {
  hokkaido: ["tohoku", "sea_of_japan", "pacific_ocean"],
  tohoku: ["hokkaido", "kanto", "sea_of_japan", "pacific_ocean"],
  kanto: ["tohoku", "chubu", "pacific_ocean"],
  chubu: ["kanto", "kinki", "sea_of_japan", "pacific_ocean"],
  kinki: ["chubu", "chugoku", "shikoku", "sea_of_japan"],
  chugoku: ["kinki", "shikoku", "kyushu", "sea_of_japan", "east_china_sea"],
  shikoku: ["kinki", "chugoku", "kyushu", "pacific_ocean"],
  kyushu: ["chugoku", "shikoku", "nansei", "east_china_sea", "sea_of_japan"],
  nansei: ["kyushu", "east_china_sea", "pacific_ocean"],
  sea_of_japan: ["hokkaido", "tohoku", "chubu", "kinki", "chugoku", "kyushu"],
  east_china_sea: ["chugoku", "kyushu", "nansei"],
  pacific_ocean: ["hokkaido", "tohoku", "kanto", "chubu", "shikoku", "nansei"],
};

/**
 * 自衛隊の基地・部隊・艦隊・航空団（指示書33章）。
 *
 * 【事実】基地の名称・所在地・部隊名（第1〜第8師団、第15旅団、横須賀・
 * 佐世保・千歳・百里・那覇の各基地など）は実在する自衛隊の編成に基づく。
 * 【参考】自衛隊の実員はおよそ23万人台、充足率は近年7割台後半〜8割台と
 * 報じられている——正確な最新値の断定は避け、概算として扱う。
 * 【ゲーム上の設定】人員・装備・士気・生産ライン・能力指数などの具体的な
 * 数値は、指示書に明記が無いためゲーム用に見積もった推定値であり、
 * 公表されている正式な統計そのものではない。
 */
export const JAPAN_BASES: Base[] = [
  { id: "sapporo-camp", name: "札幌駐屯地（北部方面隊）", kind: "army", regionId: "hokkaido" },
  { id: "sendai-camp", name: "仙台駐屯地（東北方面隊）", kind: "army", regionId: "tohoku" },
  { id: "asaka-camp", name: "朝霞駐屯地（東部方面隊）", kind: "army", regionId: "kanto" },
  { id: "kumamoto-camp", name: "熊本駐屯地（西部方面隊）", kind: "army", regionId: "kyushu" },
  { id: "naha-camp", name: "那覇駐屯地", kind: "army", regionId: "nansei" },
  { id: "yokosuka-base", name: "横須賀基地", kind: "navy", regionId: "kanto" },
  { id: "sasebo-base", name: "佐世保基地", kind: "navy", regionId: "kyushu" },
  { id: "chitose-base", name: "千歳基地", kind: "air", regionId: "hokkaido" },
  { id: "hyakuri-base", name: "百里基地", kind: "air", regionId: "kanto" },
  { id: "naha-airbase", name: "那覇基地", kind: "air", regionId: "nansei" },
];

export const JAPAN_UNITS: Unit[] = [
  { id: "div2", name: "第2師団", branch: "gsdf", personnel: { current: 5600, max: 7000 }, equipmentRatePercent: 80, moralePercent: 88, baseId: "sapporo-camp", regionId: "hokkaido", status: "garrison" },
  { id: "div6", name: "第6師団", branch: "gsdf", personnel: { current: 5100, max: 6500 }, equipmentRatePercent: 78, moralePercent: 86, baseId: "sendai-camp", regionId: "tohoku", status: "garrison" },
  { id: "div1", name: "第1師団", branch: "gsdf", personnel: { current: 6200, max: 7500 }, equipmentRatePercent: 82, moralePercent: 87, baseId: "asaka-camp", regionId: "kanto", status: "garrison" },
  { id: "div8", name: "第8師団", branch: "gsdf", personnel: { current: 5300, max: 6800 }, equipmentRatePercent: 79, moralePercent: 85, baseId: "kumamoto-camp", regionId: "kyushu", status: "garrison" },
  { id: "brigade15", name: "第15旅団", branch: "gsdf", personnel: { current: 1900, max: 2400 }, equipmentRatePercent: 76, moralePercent: 90, baseId: "naha-camp", regionId: "nansei", status: "garrison" },
];

export const JAPAN_FLEETS: Fleet[] = [
  { id: "escort-flotilla-1", name: "第1護衛隊群", destroyers: 8, submarines: 0, supplyShips: 1, baseId: "yokosuka-base", regionId: "pacific_ocean", mission: "escort" },
  { id: "escort-flotilla-2", name: "第2護衛隊群", destroyers: 8, submarines: 0, supplyShips: 1, baseId: "sasebo-base", regionId: "east_china_sea", mission: "patrol" },
  { id: "submarine-flotilla", name: "潜水艦隊", destroyers: 0, submarines: 6, supplyShips: 0, baseId: "yokosuka-base", regionId: "sea_of_japan", mission: "asw" },
];

export const JAPAN_AIR_WINGS: AirWing[] = [
  { id: "chitose-wing", name: "第2航空団", fighters: 24, supportAircraft: 4, baseId: "chitose-base", coverageRegionIds: ["hokkaido", "sea_of_japan"], mission: "air_defense" },
  { id: "hyakuri-wing", name: "第7航空団", fighters: 20, supportAircraft: 4, baseId: "hyakuri-base", coverageRegionIds: ["kanto", "pacific_ocean"], mission: "intercept" },
  { id: "naha-wing", name: "第9航空団", fighters: 20, supportAircraft: 2, baseId: "naha-airbase", coverageRegionIds: ["nansei", "east_china_sea"], mission: "air_superiority" },
];

export const JAPAN_PERSONNEL: PersonnelStats = {
  activeDuty: 230000,
  reserve: 56000,
  mobilizable: 30000,
  fillRatePercent: 78,
};

export const JAPAN_FORCES: ForceStats = {
  land: { capability: 55, units: 5, tanksArmor: 620, artillery: 300, airDefenseUnits: 8, longRangeFire: 2 },
  sea: { capability: 62, destroyers: 26, submarines: 22, carrierAviation: 2, supplyShips: 5, patrolVessels: 6 },
  air: { capability: 60, fighters: 290, attackAircraft: 0, transportAircraft: 40, awacs: 17, patrolAircraft: 70, helicopters: 130 },
  missile: { capability: 58, airDefenseMissiles: 6, antiShipMissiles: 8, longRangeMissiles: 0 },
  other: { capability: 40, satellites: 7, cyber: 20, electronicWarfare: 10, intelligenceGathering: 30 },
};

export const JAPAN_PRODUCTION_LINES: ProductionLine[] = [
  { itemId: "fighter", factories: 3, efficiencyPercent: 70, accumulatedOutput: 0 },
  { itemId: "destroyer", factories: 2, efficiencyPercent: 65, accumulatedOutput: 0 },
  { itemId: "tank", factories: 2, efficiencyPercent: 75, accumulatedOutput: 0 },
  { itemId: "missile", factories: 4, efficiencyPercent: 80, accumulatedOutput: 0 },
];

export const PRODUCTION_ITEM_LABELS: Record<ProductionItemId, string> = {
  fighter: "✈️ 戦闘機",
  destroyer: "🚢 護衛艦",
  tank: "🪖 戦車",
  missile: "🚀 ミサイル",
};

/** 生産1単位が上がったときに与える能力指数の押し上げ幅（指示書16章の簡略化）。 */
export const PRODUCTION_CAPABILITY_PER_UNIT: Record<ProductionItemId, { category: "land" | "sea" | "air" | "missile"; amount: number }> = {
  fighter: { category: "air", amount: 0.15 },
  destroyer: { category: "sea", amount: 0.3 },
  tank: { category: "land", amount: 0.1 },
  missile: { category: "missile", amount: 0.08 },
};

/** 1隻・1機あたりに必要な累積生産量（このぶんだけ`accumulatedOutput`が溜まると1単位とみなす）。 */
export const PRODUCTION_UNIT_COST: Record<ProductionItemId, number> = {
  fighter: 4,
  destroyer: 8,
  tank: 2,
  missile: 1,
};

/**
 * 他国の軍事力の目安（指示書20・21章、情報スナップショットのドリフト先）。
 * 実在国の相対的な規模感を大まかに踏まえたゲーム上の近似値であり、実際の
 * 軍事評価・インテリジェンスを主張するものではない【ゲーム上の設定】。
 */
export const FOREIGN_MILITARY_BASELINE: Record<string, { land: number; sea: number; air: number }> = {
  JPN: { land: 55, sea: 62, air: 60 },
  USA: { land: 70, sea: 90, air: 90 },
  CHN: { land: 75, sea: 70, air: 65 },
  RUS: { land: 60, sea: 50, air: 60 },
  GBR: { land: 45, sea: 55, air: 55 },
  FRA: { land: 48, sea: 58, air: 58 },
  DEU: { land: 50, sea: 35, air: 50 },
};

export interface MilitaryEventOption {
  id: string;
  label: string;
  effects: MilitaryEffect[];
}

export interface MilitaryEventTemplate {
  id: string;
  title: string;
  body: string;
  /** 空配列なら確認するだけの平時イベント（指示書31章）。 */
  options: MilitaryEventOption[];
}

/**
 * 軍事イベント（指示書31・32章）。平時にも演習・警戒監視・スクランブルなどが
 * 起き続けるようにする——「平和だから軍事画面を開く必要がない」を避ける。
 */
export const MILITARY_EVENTS: MilitaryEventTemplate[] = [
  {
    id: "scramble",
    title: "✈️ 緊急発進（スクランブル）",
    body: "航空自衛隊が接近する外国軍機を確認し、緊急発進した。",
    options: [
      { id: "monitor", label: "監視を継続する", effects: [] },
      { id: "raise-alert", label: "警戒態勢を強化する", effects: [{ type: "modify_capability", category: "missile", amount: 1 }] },
      { id: "protest", label: "外交ルートで抗議する", effects: [{ type: "modify_relation", countryId: "CHN", amount: -2, label: "領空接近への抗議" }] },
    ],
  },
  {
    id: "foreign-vessel",
    title: "🚢 海上警戒",
    body: "周辺海域で外国艦艇の活動が確認された。",
    options: [
      { id: "monitor", label: "監視を継続する", effects: [] },
      { id: "dispatch", label: "艦艇を派遣して監視する", effects: [{ type: "modify_capability", category: "sea", amount: 1 }] },
    ],
  },
  { id: "joint-drill", title: "🤝 共同演習実施", body: "同盟国との共同演習が実施され、部隊の練度が高まった。", options: [] },
  { id: "equipment-delivery", title: "🏭 新型装備の納入", body: "調達していた新型装備の一部が部隊へ納入された。", options: [] },
  { id: "routine-patrol", title: "🛰 定期哨戒任務", body: "哨戒機・護衛艦による定期的な警戒監視任務が行われた。", options: [] },
];

export function findMilitaryEvent(id: string): MilitaryEventTemplate | undefined {
  return MILITARY_EVENTS.find((event) => event.id === id);
}

export interface AllianceCooperationTemplate {
  id: AllianceCooperationId;
  name: string;
  description: string;
  politicalPowerCost: number;
  effects: MilitaryEffect[];
}

/** 同盟国との軍事協力（指示書27章）。将来的な同盟国AIの自律行動は今回作らない。 */
export const ALLIANCE_COOPERATIONS: AllianceCooperationTemplate[] = [
  { id: "intel_sharing", name: "情報共有", description: "軍事情報を共有し、情報の確度を高める。", politicalPowerCost: 8, effects: [{ type: "modify_relation", countryId: "", amount: 3, label: "情報共有" }] },
  { id: "base_access", name: "基地使用", description: "基地の相互使用に関する取り決めを結ぶ。", politicalPowerCost: 15, effects: [{ type: "modify_relation", countryId: "", amount: 4, label: "基地使用協定" }] },
  { id: "joint_exercise", name: "共同演習", description: "合同での軍事演習を実施し、練度と関係を高める。", politicalPowerCost: 10, effects: [{ type: "modify_relation", countryId: "", amount: 5, label: "共同演習" }, { type: "modify_capability", category: "land", amount: 1 }] },
  { id: "logistics_support", name: "兵站支援", description: "補給・後方支援での協力体制を築く。", politicalPowerCost: 10, effects: [{ type: "modify_relation", countryId: "", amount: 3, label: "兵站支援協定" }] },
  { id: "joint_defense", name: "共同防衛", description: "防衛協力を一段階引き上げる、重い取り決め。", politicalPowerCost: 25, effects: [{ type: "modify_relation", countryId: "", amount: 8, label: "共同防衛協力" }, { type: "modify_government_support", amount: 1 }] },
];

export function findAllianceCooperation(id: AllianceCooperationId): AllianceCooperationTemplate | undefined {
  return ALLIANCE_COOPERATIONS.find((cooperation) => cooperation.id === id);
}
