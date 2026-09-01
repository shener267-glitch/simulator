import type { EventDef, EventTrigger } from "../types/events";

export const cabinetEvents: EventDef[] = [
  {
    id: "cabinet_budget",
    category: "cabinet",
    title: "閣議: 予算編成",
    description: "来年度予算の編成方針について閣僚から意見が上がっている。",
    blocking: true,
    choices: [
      {
        id: "prioritize_growth",
        label: "成長分野への重点配分を指示する",
        effect: {
          deltas: [
            { stat: "gdpGrowth", delta: 0.3 },
            { stat: "treasuryBalance", delta: -3 },
          ],
          description: "予算編成で成長分野への重点配分が決定した。",
        },
      },
      {
        id: "balanced_budget",
        label: "均衡予算を優先するよう指示する",
        effect: {
          deltas: [{ stat: "treasuryBalance", delta: 4 }],
          relationDeltas: [{ kind: "faction", id: "fiscal_hawks", delta: 4 }],
          description: "均衡予算路線が閣議で確認された。",
        },
      },
    ],
  },
  {
    id: "cabinet_disaster",
    category: "cabinet",
    title: "閣議: 災害対応",
    description: "各地の被災地支援について対応方針を決める必要がある。",
    blocking: true,
    choices: [
      {
        id: "immediate_relief",
        label: "予備費を投入し即座に支援する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: 5 },
            { stat: "treasuryBalance", delta: -4 },
          ],
          description: "被災地への迅速な予備費投入が決定された。",
        },
      },
      {
        id: "standard_process",
        label: "通常の手続きに沿って対応する",
        effect: {
          deltas: [{ stat: "approvalRating", delta: -2 }],
          description: "被災地対応は通常手続きで進めることになった。",
        },
      },
    ],
  },
  {
    id: "cabinet_deregulation",
    category: "cabinet",
    title: "閣議: 規制緩和案",
    description: "経済界から規制緩和の要望が寄せられている。",
    blocking: true,
    choices: [
      {
        id: "push_deregulation",
        label: "規制緩和を推進する",
        effect: {
          deltas: [{ stat: "gdpGrowth", delta: 0.4 }],
          relationDeltas: [{ kind: "faction", id: "reform", delta: 5 }],
          description: "規制緩和策が閣議決定された。",
        },
      },
      {
        id: "cautious_review",
        label: "慎重に審議を継続する",
        effect: {
          deltas: [],
          relationDeltas: [{ kind: "faction", id: "mainstream", delta: 2 }],
          description: "規制緩和案は継続審議となった。",
        },
      },
    ],
  },
  {
    id: "cabinet_personnel",
    category: "cabinet",
    title: "閣議: 人事案件",
    description: "省庁幹部人事について協議する必要がある。",
    blocking: true,
    choices: [
      {
        id: "faction_balanced_personnel",
        label: "派閥バランスに配慮した人事にする",
        effect: {
          deltas: [{ stat: "partyUnity", delta: 4 }],
          description: "派閥均衡に配慮した人事が発表された。",
        },
      },
      {
        id: "merit_based_personnel",
        label: "実力本位の人事にする",
        effect: {
          deltas: [{ stat: "approvalRating", delta: 2 }],
          relationDeltas: [{ kind: "faction", id: "reform", delta: 3 }],
          description: "実力本位の人事が発表され話題となった。",
        },
      },
    ],
  },
  {
    id: "cabinet_infrastructure",
    category: "cabinet",
    title: "閣議: インフラ老朽化対策",
    description: "老朽化した道路・橋梁の維持補修が課題となっている。",
    blocking: true,
    choices: [
      {
        id: "accelerate_repair",
        label: "維持補修を前倒しで実施する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: 3 },
            { stat: "treasuryBalance", delta: -3 },
          ],
          description: "インフラ維持補修の前倒し実施が決定した。",
        },
      },
      {
        id: "phased_repair",
        label: "計画的に段階実施する",
        effect: {
          deltas: [{ stat: "treasuryBalance", delta: 1 }],
          description: "インフラ補修は計画に沿って段階的に進めることになった。",
        },
      },
    ],
  },
  {
    id: "cabinet_regional",
    category: "cabinet",
    title: "閣議: 地方創生策",
    description: "地方の人口減少対策について協議する。",
    blocking: true,
    choices: [
      {
        id: "regional_subsidy",
        label: "地方への交付金を増額する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: 3 },
            { stat: "treasuryBalance", delta: -3 },
          ],
          relationDeltas: [{ kind: "faction", id: "mainstream", delta: 3 }],
          description: "地方創生交付金の増額が決定した。",
        },
      },
      {
        id: "regional_status_quo",
        label: "現行の支援水準を維持する",
        effect: { deltas: [], description: "地方創生策は現行水準を維持することになった。" },
      },
    ],
  },
];

const CABINET_CYCLE_DAYS = 42; // 6 templates x 7 days = one full rotation

export const cabinetTriggers: EventTrigger[] = cabinetEvents.map((def, index) => {
  const offset = (index + 1) * 7;
  return {
    type: "fixed",
    eventId: def.id,
    everyNDays: CABINET_CYCLE_DAYS,
    offset,
    minDayIndex: offset,
  };
});
