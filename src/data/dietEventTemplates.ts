import type { EventDef, EventTrigger } from "../types/events";

export const dietEvents: EventDef[] = [
  {
    id: "diet_budget_deliberation",
    category: "diet",
    title: "国会: 予算審議",
    description: "野党から予算案について厳しい質疑が予想される。",
    blocking: true,
    choices: [
      {
        id: "pass_as_proposed",
        label: "原案通りの予算成立を目指す",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: 2 },
            { stat: "treasuryBalance", delta: -5 },
          ],
          description: "予算案は原案通り審議入りした。",
        },
      },
      {
        id: "negotiate_cuts",
        label: "野党・派閥と調整し一部修正する",
        effect: {
          deltas: [{ stat: "treasuryBalance", delta: 3 }],
          relationDeltas: [
            { kind: "faction", id: "fiscal_hawks", delta: 3 },
            { kind: "faction", id: "reform", delta: -1 },
          ],
          description: "予算案は一部修正のうえ審議が進んだ。",
        },
      },
      {
        id: "delay_budget",
        label: "審議を先送りする",
        effect: {
          deltas: [{ stat: "approvalRating", delta: -4 }],
          description: "予算審議の先送りに野党やメディアから批判が上がった。",
        },
      },
    ],
  },
  {
    id: "diet_bill_vote",
    category: "diet",
    title: "国会: 法案採決",
    description: "重要法案の採決が近づき、与野党の駆け引きが激しくなっている。",
    blocking: true,
    choices: [
      {
        id: "compromise_with_opposition",
        label: "野党と妥協し修正合意する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: 1 },
            { stat: "partyUnity", delta: 2 },
          ],
          description: "与野党の修正合意により法案が成立した。",
        },
      },
      {
        id: "force_vote",
        label: "与党の数の力で押し切る",
        effect: {
          deltas: [{ stat: "approvalRating", delta: -3 }],
          relationDeltas: [
            { kind: "faction", id: "reform", delta: 2 },
            { kind: "faction", id: "mainstream", delta: -1 },
          ],
          description: "法案は与党の賛成多数で強行採決された。",
        },
      },
      {
        id: "withdraw_bill",
        label: "法案を取り下げる",
        effect: {
          deltas: [{ stat: "approvalRating", delta: -1 }],
          description: "法案は今国会での成立を断念した。",
        },
      },
    ],
  },
  {
    id: "diet_questioning_economy",
    category: "diet",
    title: "国会答弁: 経済政策への追及",
    description: "野党議員が物価高騰と家計負担について厳しく追及してくる。",
    blocking: true,
    dialogue: {
      rootNodeId: "q1",
      nodes: {
        q1: {
          id: "q1",
          speakerLabel: "野党議員",
          prompt: "物価高で国民生活は苦しい。総理の経済政策は失敗ではないか?",
          choices: [
            {
              id: "defend_policy",
              label: "政策の成果を丁寧に説明し理解を求める",
              effect: {
                deltas: [
                  { stat: "approvalRating", delta: 2 },
                  { stat: "partyUnity", delta: 1 },
                ],
              },
              followUpNodeId: "q2",
            },
            {
              id: "evade_question",
              label: "明確な回答を避ける",
              effect: { deltas: [{ stat: "approvalRating", delta: -3 }] },
              followUpNodeId: "q2",
            },
            {
              id: "counter_attack",
              label: "野党の対案のなさを逆に批判する",
              effect: {
                deltas: [{ stat: "approvalRating", delta: 1 }],
                relationDeltas: [{ kind: "faction", id: "reform", delta: -1 }],
              },
              followUpNodeId: "q2",
            },
          ],
        },
        q2: {
          id: "q2",
          speakerLabel: "野党議員",
          prompt: "では財源はどうするのか。将来世代へのツケ回しではないか?",
          choices: [
            {
              id: "pledge_reform",
              label: "財政改革を進めると明言する",
              effect: {
                deltas: [{ stat: "approvalRating", delta: 2 }],
                relationDeltas: [{ kind: "faction", id: "fiscal_hawks", delta: 3 }],
                description: "国会答弁で財政改革を明言し、一定の評価を得た。",
              },
            },
            {
              id: "deflect_finance",
              label: "具体策には触れず時間を稼ぐ",
              effect: {
                deltas: [{ stat: "approvalRating", delta: -2 }],
                description: "財源に関する曖昧な答弁がメディアで批判的に報じられた。",
              },
            },
          ],
        },
      },
    },
  },
  {
    id: "diet_questioning_ethics",
    category: "diet",
    title: "国会答弁: 政治とカネへの追及",
    description: "野党議員が政治資金の透明性について追及してくる。",
    blocking: true,
    dialogue: {
      rootNodeId: "e1",
      nodes: {
        e1: {
          id: "e1",
          speakerLabel: "野党議員",
          prompt: "政治資金パーティーの収支に不透明な点があると報じられている。説明を求める。",
          choices: [
            {
              id: "full_disclosure",
              label: "資料を全面開示すると約束する",
              effect: {
                deltas: [
                  { stat: "approvalRating", delta: 3 },
                  { stat: "scandalRisk", delta: -5 },
                ],
                description: "全面開示の姿勢が一定の評価を得た。",
              },
              followUpNodeId: "e2",
            },
            {
              id: "partial_denial",
              label: "問題はないとして詳細説明を避ける",
              effect: {
                deltas: [
                  { stat: "approvalRating", delta: -4 },
                  { stat: "scandalRisk", delta: 6 },
                ],
                description: "説明不足との批判がSNSで拡散した。",
              },
              followUpNodeId: "e2",
            },
          ],
        },
        e2: {
          id: "e2",
          speakerLabel: "野党議員",
          prompt: "関係者の処分は行うのか、明確に答えてほしい。",
          choices: [
            {
              id: "promise_action",
              label: "関係者の処分を約束する",
              effect: {
                deltas: [{ stat: "scandalRisk", delta: -4 }],
                relationDeltas: [{ kind: "faction", id: "mainstream", delta: -2 }],
                description: "関係者処分の方針が示された。",
              },
            },
            {
              id: "no_comment",
              label: "捜査中を理由にコメントを控える",
              effect: {
                deltas: [{ stat: "scandalRisk", delta: 3 }],
                description: "歯切れの悪い答弁に批判が続いた。",
              },
            },
          ],
        },
      },
    },
  },
  {
    id: "diet_no_confidence",
    category: "diet",
    title: "国会: 内閣不信任案の動き",
    description: "支持率低迷と党内不協和音を背景に、野党が内閣不信任案の提出を検討していると報じられた。",
    blocking: true,
    choices: [
      {
        id: "appeal_for_unity",
        label: "党内外に協力を呼びかけ全面的に釈明する",
        effect: {
          deltas: [
            { stat: "partyUnity", delta: 8 },
            { stat: "approvalRating", delta: 3 },
          ],
          description: "総理が党内外に協力を呼びかけ、事態は一旦沈静化した。",
        },
      },
      {
        id: "push_through",
        label: "動じず強気の姿勢を貫く",
        effect: {
          deltas: [
            { stat: "partyUnity", delta: -5 },
            { stat: "approvalRating", delta: -5 },
            { stat: "scandalRisk", delta: 5 },
          ],
          description: "強気の対応がかえって党内の不満を強めた。",
        },
      },
      {
        id: "promise_reshuffle",
        label: "内閣改造での対応を約束する",
        effect: {
          deltas: [
            { stat: "partyUnity", delta: 5 },
            { stat: "approvalRating", delta: 1 },
          ],
          description: "内閣改造の示唆により、党内の動揺は一定程度収まった。",
        },
      },
    ],
  },
];

export const dietTriggers: EventTrigger[] = [
  { type: "fixed", eventId: "diet_budget_deliberation", everyNDays: 56, offset: 14, minDayIndex: 14 },
  { type: "fixed", eventId: "diet_bill_vote", everyNDays: 56, offset: 28, minDayIndex: 28 },
  { type: "fixed", eventId: "diet_questioning_economy", everyNDays: 56, offset: 42, minDayIndex: 42 },
  { type: "fixed", eventId: "diet_questioning_ethics", everyNDays: 56, offset: 56, minDayIndex: 56 },
  {
    type: "conditional",
    eventId: "diet_no_confidence",
    cooldownDays: 60,
    check: (state) => state.stats.approvalRating <= 35 && state.stats.partyUnity <= 40,
  },
];
