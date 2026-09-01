import type { PolicyArea } from "../../types/policy";

export const diplomacyPolicy: PolicyArea = {
  id: "diplomacy",
  name: "外交",
  description: "基本的な外交方針・同盟関係のスタンスを定める。",
  cooldownDays: 30,
  options: [
    {
      id: "us_alignment",
      label: "対米重視路線を強化する",
      description: "日米同盟を基軸とした外交方針を鮮明にする。",
      effect: {
        deltas: [{ stat: "approvalRating", delta: 2 }],
        relationDeltas: [
          { kind: "country", id: "us", delta: 10 },
          { kind: "country", id: "china", delta: -6 },
        ],
        description: "政府が対米関係強化の方針を表明した。",
      },
      factionReactions: { fiscal_hawks: 3, reform: 1 },
    },
    {
      id: "china_engagement",
      label: "対中関係の改善を図る",
      description: "経済関係を重視し、対中対話路線を進める。",
      effect: {
        deltas: [{ stat: "gdpGrowth", delta: 0.3 }],
        relationDeltas: [
          { kind: "country", id: "china", delta: 10 },
          { kind: "country", id: "us", delta: -4 },
        ],
        description: "政府が対中対話路線への転換を表明した。",
      },
      factionReactions: { mainstream: -3, moderates: 4 },
    },
    {
      id: "omnidirectional",
      label: "全方位外交を維持する",
      description: "特定の国に偏らないバランス重視の外交を続ける。",
      effect: {
        deltas: [],
        relationDeltas: [
          { kind: "country", id: "us", delta: 2 },
          { kind: "country", id: "china", delta: 2 },
          { kind: "country", id: "korea", delta: 2 },
        ],
        description: "政府は全方位外交の継続を確認した。",
      },
      factionReactions: {},
    },
  ],
};
