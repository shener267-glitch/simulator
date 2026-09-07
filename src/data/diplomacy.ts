import type {
  AiPersonality,
  DiplomaticActionTemplate,
  DiplomaticStanceId,
  RegionId,
  TradeState,
  TreatyTemplate,
  TreatyTypeId,
} from "../types/diplomacy";

/** 世界情勢パネルの4地域のラベル（指示書24章）。 */
export const REGION_LABELS: Record<RegionId, string> = {
  europe: "🇪🇺 欧州",
  east_asia: "🌏 東アジア",
  middle_east: "🛢️ 中東",
  pacific: "🌊 太平洋",
};

/**
 * 外交行動（指示書10〜12章）。使節団派遣・首脳会談提案・外相会談提案・
 * 協議要請・声明・圧力・関係改善の7種。相手国によって選べるものが
 * 変わる——`minRelation`/`maxRelation`で絞る。政策と同じ「段階を時間差で
 * 適用する」形（指示書8章と同じ発想）で、即効の行動と、時間をかけて
 * 効いてくる行動を両方持たせてある。
 *
 * `propose_summit`だけは特別扱い——選ぶと即座に効果が出るのではなく、
 * 準備期間を挟んで首脳会談そのものへつながる（reducer側で個別処理）。
 */
export const DIPLOMATIC_ACTIONS: DiplomaticActionTemplate[] = [
  {
    id: "send_envoy",
    name: "使節団を派遣する",
    description: "実務者レベルの使節団を送り、関係を少しずつ前進させる。もっとも軽い一手。",
    politicalPowerCost: 8,
    cooldownDays: 20,
    stages: [{ afterDays: 0, effects: [{ type: "modify_relation", countryId: "", amount: 3, label: "使節団派遣" }, { type: "modify_bar", countryId: "", bar: "gov", amount: 5 }] }],
  },
  {
    id: "propose_summit",
    name: "首脳会談を提案する",
    description: "首脳同士の直接会談を持ちかける。準備に時間がかかるが、効果は大きい。",
    politicalPowerCost: 15,
    minRelation: -10,
    cooldownDays: 60,
    stages: [],
  },
  {
    id: "propose_fm_talks",
    name: "外相会談を提案する",
    description: "外相同士の会談を持ちかける。首脳会談より軽く、準備もいらない。",
    politicalPowerCost: 10,
    cooldownDays: 30,
    stages: [{ afterDays: 0, effects: [{ type: "modify_relation", countryId: "", amount: 4, label: "外相会談" }, { type: "modify_bar", countryId: "", bar: "gov", amount: 8 }, { type: "modify_government_support", amount: 1 }] }],
  },
  {
    id: "request_consultation",
    name: "協議を要請する",
    description: "実務レベルの協議の場を求める。安く済むが効果も小さい。",
    politicalPowerCost: 5,
    cooldownDays: 15,
    stages: [{ afterDays: 0, effects: [{ type: "modify_relation", countryId: "", amount: 1, label: "実務協議" }, { type: "modify_bar", countryId: "", bar: "econ", amount: 3 }] }],
  },
  {
    id: "issue_statement",
    name: "声明を発表する",
    description: "友好・支持を示す声明を発表する。コストは低いが、効果も一時的。",
    politicalPowerCost: 5,
    cooldownDays: 10,
    stages: [{ afterDays: 0, effects: [{ type: "modify_relation", countryId: "", amount: 2, label: "友好声明" }] }],
  },
  {
    id: "apply_pressure",
    name: "圧力をかける",
    description: "経済・外交上の圧力をかけ、相手の譲歩を引き出そうとする。関係は悪化する。",
    politicalPowerCost: 12,
    cooldownDays: 30,
    stages: [{ afterDays: 0, effects: [{ type: "modify_relation", countryId: "", amount: -8, label: "圧力" }, { type: "modify_bar", countryId: "", bar: "mil", amount: 5 }, { type: "modify_government_support", amount: 1 }] }],
  },
  {
    id: "seek_improved_relations",
    name: "関係改善を模索する",
    description: "一定の譲歩を伴う、時間のかかる関係改善路線。当面は国内の支持を削るが、実れば大きく関係が改善する。",
    politicalPowerCost: 10,
    cooldownDays: 60,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_relation", countryId: "", amount: -1, label: "譲歩" }, { type: "modify_government_support", amount: -1 }] },
      { afterDays: 30, effects: [{ type: "modify_relation", countryId: "", amount: 10, label: "関係改善の成果" }, { type: "modify_bar", countryId: "", bar: "econ", amount: 5 }, { type: "modify_bar", countryId: "", bar: "gov", amount: 5 }, { type: "modify_government_support", amount: 2 }] },
    ],
  },
];

export function findDiplomaticAction(id: string): DiplomaticActionTemplate | undefined {
  return DIPLOMATIC_ACTIONS.find((action) => action.id === id);
}

/** 準備期間（日）。首脳会談を提案してから、会談の用意が整うまで。 */
export const SUMMIT_PREP_DAYS = 14;

/**
 * 条約6種（指示書13章）。効果は関係値・三本メーター・政府支持率までの
 * 閉じた語彙で表す——本格的な国際法・複雑な条約網は今回作らない。
 */
export const TREATIES: TreatyTemplate[] = [
  {
    id: "friendship",
    name: "友好条約",
    description: "外交関係の基礎を確認する、もっとも軽い条約。",
    durationDays: null,
    minRelationToPropose: 20,
    politicalPowerCost: 10,
    effects: [{ type: "modify_relation", countryId: "", amount: 5, label: "友好条約締結" }, { type: "modify_bar", countryId: "", bar: "gov", amount: 10 }],
    breakConditionLabel: "関係値が-30を下回ると自動的に破棄される。",
    optionalClauses: [],
  },
  {
    id: "trade_agreement",
    name: "通商協定",
    description: "関税・投資の枠組みを定める。経済関係を強く前進させる。",
    durationDays: 730,
    minRelationToPropose: 10,
    politicalPowerCost: 15,
    effects: [{ type: "modify_relation", countryId: "", amount: 3, label: "通商協定締結" }, { type: "modify_bar", countryId: "", bar: "econ", amount: 15 }],
    breakConditionLabel: "期限切れ、または関係値が-20を下回ると破棄される。",
    optionalClauses: [
      { id: "tariff_relief", label: "関税優遇条項を含める", politicalPowerCost: 8, effects: [{ type: "modify_bar", countryId: "", bar: "econ", amount: 10 }] },
      { id: "resource_priority", label: "資源優先供給条項を含める", politicalPowerCost: 12, effects: [{ type: "modify_trade", field: "oilImportNeedTrillionYen", amount: 0 }] },
    ],
  },
  {
    id: "defense_cooperation",
    name: "防衛協力協定",
    description: "共同訓練・装備協力など、軍事面での協力を制度化する。",
    durationDays: null,
    minRelationToPropose: 30,
    politicalPowerCost: 20,
    effects: [{ type: "modify_relation", countryId: "", amount: 3, label: "防衛協力協定締結" }, { type: "modify_bar", countryId: "", bar: "mil", amount: 15 }],
    breakConditionLabel: "関係値が-10を下回ると自動的に破棄される。",
    optionalClauses: [{ id: "joint_exercise", label: "共同軍事演習を含める", politicalPowerCost: 10, effects: [{ type: "modify_bar", countryId: "", bar: "mil", amount: 10 }] }],
  },
  {
    id: "mutual_defense",
    name: "相互防衛条約",
    description: "一方が攻撃を受けた際の相互支援を定める、もっとも重い条約。",
    durationDays: null,
    minRelationToPropose: 50,
    politicalPowerCost: 35,
    effects: [{ type: "modify_relation", countryId: "", amount: 8, label: "相互防衛条約締結" }, { type: "modify_bar", countryId: "", bar: "mil", amount: 25 }, { type: "modify_government_support", amount: 2 }],
    breakConditionLabel: "関係値が0を下回ると自動的に破棄される。",
    optionalClauses: [],
  },
  {
    id: "non_aggression",
    name: "不可侵条約",
    description: "互いに武力を行使しないことを取り決める。緊張の高い相手との緩和策になる。",
    durationDays: 1825,
    minRelationToPropose: -20,
    politicalPowerCost: 15,
    effects: [{ type: "modify_relation", countryId: "", amount: 10, label: "不可侵条約締結" }, { type: "modify_bar", countryId: "", bar: "gov", amount: 5 }],
    breakConditionLabel: "期限切れで自動的に失効する。",
    optionalClauses: [],
  },
  {
    id: "resource_supply",
    name: "資源供給協定",
    description: "原油・鉱物資源などの安定供給を取り決める。",
    durationDays: 1095,
    minRelationToPropose: 15,
    politicalPowerCost: 20,
    effects: [{ type: "modify_bar", countryId: "", bar: "econ", amount: 10 }, { type: "modify_relation", countryId: "", amount: 2, label: "資源供給協定締結" }],
    breakConditionLabel: "期限切れ、または関係値が-20を下回ると破棄される。",
    optionalClauses: [
      { id: "oil_priority", label: "原油の優先供給を含める", politicalPowerCost: 10, effects: [{ type: "modify_trade", field: "oilImportFilledTrillionYen", amount: 3 }] },
      { id: "iron_priority", label: "鉄鉱石の優先供給を含める", politicalPowerCost: 10, effects: [{ type: "modify_trade", field: "ironImportFilledTrillionYen", amount: 1.5 }] },
    ],
  },
];

export function findTreaty(id: TreatyTypeId): TreatyTemplate | undefined {
  return TREATIES.find((treaty) => treaty.id === id);
}

/** 外交スタンス6種、複数選択・併用可能（指示書20章）。 */
export interface StanceTemplate {
  id: DiplomaticStanceId;
  name: string;
  description: string;
  /** 1日あたりの政治力獲得量への補正。 */
  politicalPowerPerDayDelta: number;
  /** 全ての国に対して、1日あたりわずかに効く関係値の下地。 */
  relationDriftPerDay: number;
  /** 条約を結んでいる相手には、上の下地に加えてさらにこれだけ効く。 */
  treatyPartnerDriftBonus: number;
  /** 輸出余力（機械・電子機器）への%補正。 */
  exportCapacityPercent: number;
}

export const STANCES: StanceTemplate[] = [
  {
    id: "isolationism",
    name: "孤立主義",
    description: "対外関与を絞り、国内へ力を割く。関係は緩やかに冷える。",
    politicalPowerPerDayDelta: 0.3,
    relationDriftPerDay: -0.02,
    treatyPartnerDriftBonus: 0,
    exportCapacityPercent: -5,
  },
  {
    id: "internationalism",
    name: "国際協調",
    description: "国際協調を重視し、各国との関係づくりに積極的に動く。",
    politicalPowerPerDayDelta: -0.1,
    relationDriftPerDay: 0.02,
    treatyPartnerDriftBonus: 0,
    exportCapacityPercent: 0,
  },
  {
    id: "free_trade",
    name: "自由貿易推進",
    description: "貿易の自由化を進め、輸出産業の余力を広げる。",
    politicalPowerPerDayDelta: 0,
    relationDriftPerDay: 0,
    treatyPartnerDriftBonus: 0,
    exportCapacityPercent: 10,
  },
  {
    id: "protectionism",
    name: "保護主義",
    description: "国内産業を優先し、対外開放は控える。輸出余力は狭まる。",
    politicalPowerPerDayDelta: 0.2,
    relationDriftPerDay: 0,
    treatyPartnerDriftBonus: 0,
    exportCapacityPercent: -10,
  },
  {
    id: "alliance_focus",
    name: "同盟重視",
    description: "条約を結んでいる相手との関係を、特に手厚く育てる。",
    politicalPowerPerDayDelta: 0,
    relationDriftPerDay: 0,
    treatyPartnerDriftBonus: 0.05,
    exportCapacityPercent: 0,
  },
  {
    id: "status_quo",
    name: "現状維持",
    description: "いまの関係を大きく動かさず、安定を優先する。",
    politicalPowerPerDayDelta: 0.1,
    relationDriftPerDay: 0,
    treatyPartnerDriftBonus: 0,
    exportCapacityPercent: 0,
  },
];

export function findStance(id: DiplomaticStanceId): StanceTemplate | undefined {
  return STANCES.find((stance) => stance.id === id);
}

/**
 * 日本を担当したときの初期関係値（指示書1〜6章）。基準値＋内訳の形。
 *
 * 【事実】日米安保条約、北方領土問題は広く確認された事実。
 * 【参考】対中関係における領土・歴史認識をめぐる摩擦は広く報じられている
 * 一般的傾向として扱い、個別の事件・時期には踏み込まない。
 * 数値そのもの（関係値・メーター）はゲーム上の設定【ゲーム上の設定】。
 */
export const JAPAN_RELATION_SEEDS: Record<
  string,
  { baseRelation: number; personality: AiPersonality; barGov: number; barEcon: number; barMil: number; modifiers: { id: string; label: string; amount: number }[] }
> = {
  USA: {
    baseRelation: 40,
    personality: "cooperative",
    barGov: 60,
    barEcon: 55,
    barMil: 50,
    modifiers: [{ id: "nichibei-anpo", label: "日米安全保障条約", amount: 15 }],
  },
  CHN: {
    baseRelation: 5,
    personality: "assertive",
    barGov: 30,
    barEcon: 45,
    barMil: 15,
    modifiers: [{ id: "ryodo-rekishi", label: "領土・歴史認識をめぐる摩擦", amount: -10 }],
  },
  RUS: {
    baseRelation: -20,
    personality: "assertive",
    barGov: 15,
    barEcon: 10,
    barMil: 5,
    modifiers: [{ id: "hoppo-ryodo", label: "北方領土問題", amount: -15 }],
  },
  GBR: { baseRelation: 30, personality: "cooperative", barGov: 50, barEcon: 40, barMil: 25, modifiers: [] },
  FRA: { baseRelation: 28, personality: "pragmatic", barGov: 48, barEcon: 38, barMil: 20, modifiers: [] },
  DEU: { baseRelation: 32, personality: "pragmatic", barGov: 52, barEcon: 45, barMil: 15, modifiers: [] },
};

/**
 * 貿易の初期値（指示書15章）。原油・鉄鉱石の輸入需要と、機械・電子機器の
 * 輸出余力を持つ——数値は指示書の例示にならったゲーム上の設定
 * 【ゲーム上の設定】、実際の貿易統計の再現ではない。
 */
export const JAPAN_TRADE_SEED: TradeState = {
  oilImportNeedTrillionYen: 12,
  oilImportFilledTrillionYen: 10,
  ironImportNeedTrillionYen: 5,
  ironImportFilledTrillionYen: 4.5,
  machineryExportCapacityTrillionYen: 25,
  electronicsExportCapacityTrillionYen: 18,
};

export const EMPTY_TRADE_STATE: TradeState = {
  oilImportNeedTrillionYen: 0,
  oilImportFilledTrillionYen: 0,
  ironImportNeedTrillionYen: 0,
  ironImportFilledTrillionYen: 0,
  machineryExportCapacityTrillionYen: 0,
  electronicsExportCapacityTrillionYen: 0,
};

/** 定期的な国際ニュース（指示書25章）。確認するだけの簡易イベント。 */
export interface DiplomaticNewsTemplate {
  id: string;
  title: string;
  body: string;
}

export const DIPLOMATIC_NEWS: DiplomaticNewsTemplate[] = [
  { id: "news-summit-elsewhere", title: "他国首脳会談", body: "自国の関与しない首脳会談が行われ、国際社会の注目を集めている。" },
  { id: "news-trade-friction", title: "貿易摩擦の報道", body: "他地域での貿易摩擦が報じられ、世界経済への影響が懸念されている。" },
  { id: "news-regional-drill", title: "合同軍事演習", body: "ある地域で複数国による合同軍事演習が実施された。" },
  { id: "news-diplomatic-visit", title: "要人往来", body: "他国の要人往来が活発化していると報じられている。" },
];

export function findDiplomaticNews(id: string): DiplomaticNewsTemplate | undefined {
  return DIPLOMATIC_NEWS.find((news) => news.id === id);
}

/** 短い応答選択肢を持つ、簡易的な国際危機（指示書18章）。戦争・戦闘は扱わない。 */
export interface DiplomaticCrisisOption {
  id: string;
  label: string;
  effects: import("../types/diplomacy").DiplomacyEffect[];
}

export interface DiplomaticCrisisTemplate {
  id: string;
  countryId: string;
  title: string;
  body: string;
  options: DiplomaticCrisisOption[];
}

export const DIPLOMATIC_CRISES: DiplomaticCrisisTemplate[] = [
  {
    id: "border-incident",
    countryId: "CHN",
    title: "近海での接触事案",
    body: "自国の哨戒機と相手国艦艇が近海で異常接近する事案が発生した。対応が問われている。",
    options: [
      { id: "protest", label: "抗議し、説明を求める", effects: [{ type: "modify_relation", countryId: "CHN", amount: -3, label: "抗議" }, { type: "modify_government_support", amount: 1 }] },
      { id: "quiet-channel", label: "外交ルートで静かに収める", effects: [{ type: "modify_relation", countryId: "CHN", amount: 1, label: "静かな収拾" }] },
    ],
  },
  {
    id: "resource-shock",
    countryId: "RUS",
    title: "資源供給の混乱",
    body: "国際的な資源価格が急変し、供給の先行きに不透明感が出ている。",
    options: [
      { id: "diversify", label: "調達先の分散を急ぐ", effects: [{ type: "modify_trade", field: "oilImportFilledTrillionYen", amount: 1 }, { type: "modify_relation", countryId: "RUS", amount: -1, label: "調達先分散" }] },
      { id: "negotiate", label: "相手国との交渉で乗り切る", effects: [{ type: "modify_relation", countryId: "RUS", amount: 3, label: "供給交渉" }, { type: "modify_bar", countryId: "RUS", bar: "econ", amount: 5 }] },
    ],
  },
];

export function findDiplomaticCrisis(id: string): DiplomaticCrisisTemplate | undefined {
  return DIPLOMATIC_CRISES.find((crisis) => crisis.id === id);
}
