import type { PolicyArea } from "../../types/policy";

export const economyPolicy: PolicyArea = {
  id: "economy",
  name: "経済",
  description: "景気対策と成長戦略の方向性を決定する。",
  cooldownDays: 21,
  options: [
    {
      id: "tax_cut",
      label: "減税を実施する",
      description: "消費税・所得税を減税し、家計と企業の負担を軽減する。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: 6 },
          { stat: "treasuryBalance", delta: -8 },
          { stat: "gdpGrowth", delta: 0.5 },
        ],
        description: "政府が減税を発表。国民から歓迎の声が上がった。",
      },
      factionReactions: { fiscal_hawks: -8, reform: 4, mainstream: 2, moderates: 3 },
    },
    {
      id: "public_investment",
      label: "公共投資を拡大する",
      description: "インフラ整備や地方振興のため大規模な財政出動を行う。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: 3 },
          { stat: "treasuryBalance", delta: -12 },
          { stat: "gdpGrowth", delta: 1.0 },
        ],
        description: "大型の公共投資策が決定。建設業界や地方から支持の声。",
      },
      factionReactions: { fiscal_hawks: -6, mainstream: 6, reform: -2, moderates: 2 },
    },
    {
      id: "status_quo_economy",
      label: "現状の経済政策を維持する",
      description: "大きな変更を避け、様子を見る。",
      effect: {
        deltas: [{ stat: "treasuryBalance", delta: 1 }],
        description: "政府は経済政策の現状維持を表明した。",
      },
      factionReactions: { fiscal_hawks: 3 },
    },
  ],
};
