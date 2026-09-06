import type { FocusTemplate } from "../types/focus";

/**
 * 日本の国家方針ツリー（指示書7〜14章）。「政権発足」を根に、国内政策・
 * 外交政策の二本柱へ分岐し、経済政策の下でさらに財政拡張／財政再建の
 * 二方向に分かれる——指示書8章・13章の例を一本のツリーにまとめたもの。
 *
 * 【事実】「経済再生政策」の内容（所要70日・前提条件なし・完了時の効果）は
 * 指示書9章の記載をそのまま使っている。それ以外の方針名・数値・効果は
 * このゲームのための創作【ゲーム上の設定】——実際の政策名や効果を主張する
 * ものではない。国家方針そのものの「日本化」（政策決定→党内調整→国会審議
 * →成立、という手続きへの置き換え）はPhase 3以降の課題（指示書18章）。
 */
export const JAPAN_FOCUSES: FocusTemplate[] = [
  {
    id: "seiken-hossoku",
    name: "政権発足",
    description: "内閣が発足した。ここから国内政策・外交政策の両輪が動き出す。",
    durationDays: 0,
    prerequisites: [],
    politicalPowerCost: 0,
    effects: [],
    position: { x: 480, y: 40 },
  },
  {
    id: "kokunai-seisaku",
    name: "国内政策",
    description: "内政の基本方針を固める。ここから経済・社会それぞれの政策が分岐する。",
    durationDays: 20,
    prerequisites: ["seiken-hossoku"],
    politicalPowerCost: 10,
    effects: [{ type: "add_political_power", amount: 10 }],
    position: { x: 300, y: 180 },
  },
  {
    id: "gaikou-seisaku",
    name: "外交政策",
    description: "外交の基本方針を固める。ここから日米関係・アジア外交が分岐する。",
    durationDays: 20,
    prerequisites: ["seiken-hossoku"],
    politicalPowerCost: 10,
    effects: [{ type: "add_political_power", amount: 10 }],
    position: { x: 700, y: 180 },
  },
  {
    id: "keizai-saisei",
    name: "経済再生政策",
    description: "日本経済の再生を目指し、政府による経済政策を強化する。",
    durationDays: 70,
    prerequisites: ["kokunai-seisaku"],
    politicalPowerCost: 0,
    effects: [
      { type: "add_political_power", amount: 50 },
      { type: "modify_government_support", amount: 3 },
      { type: "modify_stability", amount: 2 },
    ],
    position: { x: 220, y: 320 },
  },
  {
    id: "shakai-seisaku",
    name: "社会政策",
    description: "社会保障・教育など、暮らしに関わる政策を進める。",
    durationDays: 30,
    prerequisites: ["kokunai-seisaku"],
    politicalPowerCost: 10,
    effects: [
      { type: "modify_government_support", amount: 2 },
      { type: "modify_stability", amount: 1 },
    ],
    position: { x: 400, y: 320 },
  },
  {
    id: "nichibei-kankei",
    name: "日米関係強化",
    description: "同盟関係を軸に、日米間の協力を強化する。",
    durationDays: 45,
    prerequisites: ["gaikou-seisaku"],
    politicalPowerCost: 20,
    effects: [
      { type: "modify_stability", amount: 2 },
      { type: "add_national_modifier", id: "nichibei-doumei", label: "日米同盟強化" },
    ],
    position: { x: 620, y: 320 },
  },
  {
    id: "ajia-gaikou",
    name: "アジア外交",
    description: "近隣国・地域との経済・安全保障両面の関係を強める。",
    durationDays: 45,
    prerequisites: ["gaikou-seisaku"],
    politicalPowerCost: 20,
    effects: [
      { type: "modify_political_power_gain", amount: 0.5 },
      { type: "unlock_focus", focusId: "chiiki-anpo" },
    ],
    position: { x: 800, y: 320 },
  },
  {
    id: "zaisei-kakuchou",
    name: "財政拡張",
    description: "財政出動を厚くし、短期の景気の下支えを優先する。",
    durationDays: 40,
    prerequisites: ["keizai-saisei"],
    politicalPowerCost: 15,
    effects: [
      { type: "modify_government_support", amount: 2 },
      { type: "modify_stability", amount: -1 },
      { type: "modify_political_power_gain", amount: 0.5 },
    ],
    position: { x: 140, y: 460 },
  },
  {
    id: "zaisei-saiken",
    name: "財政再建",
    description: "財政規律を優先し、歳出の見直しから始める。",
    durationDays: 40,
    prerequisites: ["keizai-saisei"],
    politicalPowerCost: 15,
    effects: [
      { type: "modify_stability", amount: 3 },
      { type: "modify_government_support", amount: -2 },
      { type: "modify_research_speed", amount: -3 },
    ],
    position: { x: 320, y: 460 },
  },
  {
    id: "kagaku-gijutsu-rikkoku",
    name: "科学技術立国",
    description: "教育・研究への投資を国家戦略の柱に据える（指示書19章、国家方針と研究の接続）。",
    durationDays: 50,
    prerequisites: ["shakai-seisaku"],
    politicalPowerCost: 20,
    effects: [
      { type: "modify_research_speed", amount: 10 },
      { type: "add_national_modifier", id: "kagaku-gijutsu", label: "科学技術立国" },
    ],
    position: { x: 480, y: 460 },
  },
  {
    id: "chiiki-anpo",
    name: "地域安全保障協力",
    description: "アジア外交の先に見えてきた、地域の安全保障協力の枠組み。",
    durationDays: 60,
    prerequisites: ["ajia-gaikou"],
    politicalPowerCost: 25,
    requiresUnlock: true,
    effects: [{ type: "modify_stability", amount: 3 }],
    position: { x: 800, y: 460 },
  },
  {
    id: "koukyou-toushi",
    name: "公共投資拡大",
    description: "公共投資を積み増し、地域経済を下支えする。",
    durationDays: 50,
    prerequisites: ["zaisei-kakuchou"],
    politicalPowerCost: 20,
    effects: [
      { type: "modify_government_support", amount: 4 },
      { type: "modify_party_popularity", partyId: "ldp", amount: 3 },
    ],
    position: { x: 140, y: 600 },
  },
  {
    id: "saishutsu-kaikaku",
    name: "歳出改革",
    description: "歳出の中身を見直し、無駄を削る。",
    durationDays: 50,
    prerequisites: ["zaisei-saiken"],
    politicalPowerCost: 20,
    effects: [
      { type: "modify_stability", amount: 2 },
      { type: "modify_political_power_gain", amount: 1 },
    ],
    position: { x: 320, y: 600 },
  },
  {
    id: "keiki-shigeki",
    name: "景気刺激策",
    description: "公共投資の効果を、追加の刺激策でさらに押し上げる。",
    durationDays: 60,
    prerequisites: ["koukyou-toushi"],
    politicalPowerCost: 25,
    effects: [
      { type: "modify_government_support", amount: 5 },
      { type: "add_national_modifier", id: "koukei-kaifuku", label: "好景気" },
    ],
    position: { x: 140, y: 740 },
  },
  {
    id: "zaisei-kenzenka",
    name: "財政健全化",
    description: "歳出改革の成果を制度として定着させる。",
    durationDays: 70,
    prerequisites: ["saishutsu-kaikaku"],
    politicalPowerCost: 30,
    effects: [
      { type: "modify_stability", amount: 5 },
      { type: "add_national_modifier", id: "kenzen-zaisei", label: "健全財政" },
      { type: "trigger_event", eventId: "fiscal-reform-debate" },
    ],
    position: { x: 320, y: 740 },
  },
];

export function findFocus(id: string): FocusTemplate | undefined {
  return JAPAN_FOCUSES.find((focus) => focus.id === id);
}

/** 政権発足は、内閣がすでに発足していることの印として最初から完了扱いにする。 */
export const AUTO_COMPLETED_FOCUS_IDS = ["seiken-hossoku"];
