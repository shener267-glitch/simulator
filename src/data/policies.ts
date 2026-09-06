import type { PolicyDecision } from "../types/game";

/**
 * 政策決定（設計書29章）。**正解を用意しない。** 長所と短所を文章で書くだけで、
 * 得点も内部の優劣も持たない。どれを選んでも、しばらく経ってから国家ステータスに
 * 小さく効くだけ（設計書19・20章）。
 */
export const POLICIES: PolicyDecision[] = [
  {
    id: "keizai-taisaku-kibo",
    title: "総合経済対策の規模",
    prompt:
      "内閣府から上がってきた経済対策の骨子（報告書「総合経済対策の骨子」参照）を踏まえ、規模の方向性を決める。",
    from: 480, // 08:00 以降、いつでも決められる
    requiresFlags: ["read-keizai-taisaku-shian"],
    options: [
      {
        id: "large",
        label: "大規模にする",
        summary:
          "給付・減税・投資支援を厚く積む。物価高への実感は早く出やすいが、財源の多くを国債に頼ることになり、政府債務はさらに積み上がる。",
        delayedEffect: {
          afterMinutes: 4320, // 3日後を想定した遅延反映
          delta: { approval: 3, govDebtTrillionYen: 6, growthRate: 0.3 },
          note: "大規模な経済対策の効果が、少しずつ数字に表れはじめている。",
        },
      },
      {
        id: "medium",
        label: "対象を絞って中規模にする",
        summary:
          "物価高の影響が大きい層・分野に絞って手当てする。規模を抑えたぶん、行き渡らない人からは不満も出うる。",
        delayedEffect: {
          afterMinutes: 4320,
          delta: { approval: 1, govDebtTrillionYen: 2, growthRate: 0.1 },
          note: "的を絞った経済対策の評価は、賛否がはっきり分かれている。",
        },
      },
      {
        id: "small",
        label: "小規模にとどめる",
        summary:
          "財政への負荷を優先し、規模を抑える。財政規律への評価は得やすいが、物価高の実感を和らげるには時間がかかる。",
        delayedEffect: {
          afterMinutes: 4320,
          delta: { approval: -2, govDebtTrillionYen: 0.5 },
          note: "経済対策が小粒だという受け止めが、じわりと広がっている。",
        },
      },
    ],
  },
];
