import type { PolicyArea } from "../../types/policy";

export const socialPolicy: PolicyArea = {
  id: "social",
  name: "社会保障",
  description: "年金・医療・子育て支援など社会保障制度の方向性を決める。",
  cooldownDays: 21,
  options: [
    {
      id: "expand_welfare",
      label: "社会保障を拡充する",
      description: "子育て支援・医療・介護の給付を手厚くする。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: 7 },
          { stat: "treasuryBalance", delta: -10 },
        ],
        description: "社会保障拡充策が発表され、子育て世帯や高齢者から歓迎された。",
      },
      factionReactions: { fiscal_hawks: -7, moderates: 5, reform: 2 },
    },
    {
      id: "working_generation",
      label: "現役世代への給付を重視する",
      description: "現役世代の可処分所得を増やす給付設計に転換する。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: 3 },
          { stat: "treasuryBalance", delta: -5 },
        ],
        description: "現役世代重視の給付改革が発表された。",
      },
      factionReactions: { reform: 5, mainstream: 1 },
    },
    {
      id: "status_quo_social",
      label: "現行制度を維持する",
      description: "制度改正を見送り、現状の給付水準を維持する。",
      effect: {
        deltas: [{ stat: "treasuryBalance", delta: 2 }],
        description: "政府は社会保障制度の現状維持を発表した。",
      },
      factionReactions: { fiscal_hawks: 4 },
    },
  ],
};
