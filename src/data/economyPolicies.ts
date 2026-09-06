import type { EconomyPolicyTemplate } from "../types/economy";

/**
 * 経済政策（指示書7・8章）。即時効果だけにせず、短期・中期・長期に分けて
 * 段階的に効かせる——「今は苦しいけど将来のためにやる」という判断を
 * 作るため。内容（数値・効果）はこのゲームのための創作【ゲーム上の設定】。
 * 予算に触れる政策は、その分野の年間予算そのものを動かす——一度決めると
 * 予算配分画面（指示書4章）に恒久的に反映され、単発の一時金ではない。
 */
export const ECONOMY_POLICIES: EconomyPolicyTemplate[] = [
  {
    id: "tax-cut",
    name: "減税",
    description: "所得税・消費税などの負担を軽くする。税収は下がるが、消費と成長を下支えする狙い。",
    politicalPowerCost: 15,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_stat", stat: "taxRevenueTrillionYen", amount: -3 }] },
      { afterDays: 90, effects: [{ type: "modify_stat", stat: "consumption", amount: 0.3 }] },
      { afterDays: 180, effects: [{ type: "modify_stat", stat: "gdpGrowthRate", amount: 0.2 }] },
    ],
  },
  {
    id: "tax-increase",
    name: "増税",
    description: "税収を増やして財政を支える。短期的には消費と成長を冷やす。",
    politicalPowerCost: 20,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_stat", stat: "taxRevenueTrillionYen", amount: 3 }] },
      { afterDays: 90, effects: [{ type: "modify_stat", stat: "consumption", amount: -0.3 }] },
      { afterDays: 180, effects: [{ type: "modify_stat", stat: "gdpGrowthRate", amount: -0.2 }] },
    ],
  },
  {
    id: "public-investment",
    name: "公共投資",
    description: "公共事業の予算を積み増す。短期は財政負担、中期は雇用、長期は生産性へ効いてくる。",
    politicalPowerCost: 15,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_budget", category: "publicWorks", amount: 2 }] },
      {
        afterDays: 120,
        effects: [
          { type: "modify_stat", stat: "unemploymentRate", amount: -0.2 },
          { type: "modify_stat", stat: "privateInvestment", amount: 0.3 },
        ],
      },
      {
        afterDays: 365,
        effects: [
          { type: "modify_stat", stat: "gdpGrowthRate", amount: 0.2 },
          { type: "trigger_event", eventId: "private-investment-up" },
        ],
      },
    ],
  },
  {
    id: "social-security-expansion",
    name: "社会保障拡充",
    description: "社会保障の予算を増やす。財政負担は増えるが、暮らし向きの下支えになる。",
    politicalPowerCost: 15,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_budget", category: "socialSecurity", amount: 2 }] },
      { afterDays: 180, effects: [{ type: "modify_stat", stat: "consumption", amount: 0.2 }] },
    ],
  },
  {
    id: "spending-cuts",
    name: "歳出削減",
    description: "公共事業・社会保障の予算を切り詰める。財政は改善するが、短期的には景気の重荷になる。",
    politicalPowerCost: 20,
    stages: [
      {
        afterDays: 0,
        effects: [
          { type: "modify_budget", category: "publicWorks", amount: -1 },
          { type: "modify_budget", category: "socialSecurity", amount: -1 },
        ],
      },
      {
        afterDays: 180,
        effects: [
          { type: "modify_stat", stat: "consumption", amount: -0.2 },
          { type: "modify_stat", stat: "unemploymentRate", amount: 0.1 },
        ],
      },
    ],
  },
  {
    id: "subsidies",
    name: "補助金",
    description: "産業向けの補助金を積む。民間投資を刺激するが、行き過ぎれば物価を押し上げる。",
    politicalPowerCost: 10,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_budget", category: "industry", amount: 1.5 }] },
      { afterDays: 150, effects: [{ type: "modify_stat", stat: "privateInvestment", amount: 0.3 }] },
      {
        afterDays: 300,
        effects: [
          { type: "modify_stat", stat: "inflationRate", amount: 0.1 },
          { type: "trigger_event", eventId: "consumer-prices-up" },
        ],
      },
    ],
  },
  {
    id: "industry-support",
    name: "産業支援",
    description: "産業政策の予算を厚くし、成長分野への投資を後押しする。効果が出るまで時間がかかる。",
    politicalPowerCost: 15,
    stages: [
      { afterDays: 0, effects: [{ type: "modify_budget", category: "industry", amount: 2 }] },
      { afterDays: 200, effects: [{ type: "modify_stat", stat: "gdpGrowthRate", amount: 0.15 }] },
      { afterDays: 400, effects: [{ type: "modify_stat", stat: "privateInvestment", amount: 0.4 }] },
    ],
  },
  {
    id: "deregulation",
    name: "規制緩和",
    description: "予算を伴わずに参入障壁を下げる。民間投資と成長にじわりと効く。",
    politicalPowerCost: 10,
    stages: [
      { afterDays: 120, effects: [{ type: "modify_stat", stat: "privateInvestment", amount: 0.3 }] },
      { afterDays: 300, effects: [{ type: "modify_stat", stat: "gdpGrowthRate", amount: 0.15 }] },
    ],
  },
];

export function findEconomyPolicy(id: string): EconomyPolicyTemplate | undefined {
  return ECONOMY_POLICIES.find((policy) => policy.id === id);
}
