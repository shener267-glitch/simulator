import type { PolicyArea } from "../../types/policy";

export const fiscalPolicy: PolicyArea = {
  id: "fiscal",
  name: "財政",
  description: "財政赤字・国債発行に関する基本方針を決定する。",
  cooldownDays: 30,
  options: [
    {
      id: "fiscal_reconstruction",
      label: "増税による財政再建を進める",
      description: "財政健全化のため増税に踏み切る。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: -8 },
          { stat: "treasuryBalance", delta: 15 },
        ],
        description: "増税方針の発表に国民から反発の声が上がった。",
      },
      factionReactions: { fiscal_hawks: 8, mainstream: -2, reform: -3 },
    },
    {
      id: "deficit_spending",
      label: "国債増発による財政出動を行う",
      description: "国債発行で財源を確保し、大胆な財政出動を行う。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: 4 },
          { stat: "treasuryBalance", delta: -18 },
          { stat: "gdpGrowth", delta: 0.8 },
        ],
        description: "大規模な財政出動策が決定された。",
      },
      factionReactions: { fiscal_hawks: -10, mainstream: 3 },
    },
    {
      id: "spending_cuts",
      label: "歳出削減に取り組む",
      description: "行政の無駄を削減し、歳出を抑制する。",
      effect: {
        deltas: [
          { stat: "approvalRating", delta: -2 },
          { stat: "treasuryBalance", delta: 8 },
        ],
        description: "歳出削減策が発表され、一部業界から反発があった。",
      },
      factionReactions: { fiscal_hawks: 6, moderates: -3 },
    },
  ],
};
