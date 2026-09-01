import type { EventDef, EventTrigger } from "../types/events";

export const diplomacyEvents: EventDef[] = [
  {
    id: "diplomacy_us_summit",
    category: "diplomacy",
    title: "日米首脳会談",
    description: "アメリカ大統領との首脳会談が行われる。",
    blocking: true,
    dialogue: {
      rootNodeId: "us1",
      nodes: {
        us1: {
          id: "us1",
          speakerLabel: "アメリカ大統領",
          prompt: "同盟強化のため、防衛費のさらなる増額を期待している。",
          choices: [
            {
              id: "commit_defense",
              label: "防衛費増額に前向きな姿勢を示す",
              effect: {
                deltas: [{ stat: "treasuryBalance", delta: -4 }],
                relationDeltas: [{ kind: "country", id: "us", delta: 8 }],
              },
              followUpNodeId: "us2",
            },
            {
              id: "cautious_defense",
              label: "国内事情を説明し慎重な立場を伝える",
              effect: {
                deltas: [],
                relationDeltas: [{ kind: "country", id: "us", delta: -3 }],
              },
              followUpNodeId: "us2",
            },
          ],
        },
        us2: {
          id: "us2",
          speakerLabel: "アメリカ大統領",
          prompt: "貿易・経済分野でも協力を深めたい。",
          choices: [
            {
              id: "trade_agreement",
              label: "経済協力の拡大に合意する",
              effect: {
                deltas: [{ stat: "gdpGrowth", delta: 0.3 }],
                relationDeltas: [{ kind: "country", id: "us", delta: 6 }],
                description: "日米首脳会談で経済協力の拡大に合意した。",
              },
            },
            {
              id: "trade_deferral",
              label: "持ち帰って検討すると回答する",
              effect: {
                deltas: [],
                relationDeltas: [{ kind: "country", id: "us", delta: -2 }],
                description: "日米首脳会談は経済分野で結論を持ち越した。",
              },
            },
          ],
        },
      },
    },
  },
  {
    id: "diplomacy_china_summit",
    category: "diplomacy",
    title: "日中首脳会談",
    description: "中国国家主席との首脳会談が行われる。",
    blocking: true,
    dialogue: {
      rootNodeId: "cn1",
      nodes: {
        cn1: {
          id: "cn1",
          speakerLabel: "中国国家主席",
          prompt: "経済分野での協力拡大と、地域の安定について議論したい。",
          choices: [
            {
              id: "economic_cooperation",
              label: "経済協力の拡大に応じる",
              effect: {
                deltas: [{ stat: "gdpGrowth", delta: 0.3 }],
                relationDeltas: [
                  { kind: "country", id: "china", delta: 8 },
                  { kind: "country", id: "us", delta: -2 },
                ],
              },
              followUpNodeId: "cn2",
            },
            {
              id: "firm_stance",
              label: "地域の安定に関する懸念を率直に伝える",
              effect: {
                deltas: [],
                relationDeltas: [{ kind: "country", id: "china", delta: -4 }],
              },
              followUpNodeId: "cn2",
            },
          ],
        },
        cn2: {
          id: "cn2",
          speakerLabel: "中国国家主席",
          prompt: "民間交流の拡大についても前向きに検討してほしい。",
          choices: [
            {
              id: "expand_exchange",
              label: "民間交流拡大に合意する",
              effect: {
                deltas: [{ stat: "approvalRating", delta: 1 }],
                relationDeltas: [{ kind: "country", id: "china", delta: 5 }],
                description: "日中首脳会談で民間交流拡大に合意した。",
              },
            },
            {
              id: "limited_exchange",
              label: "限定的な交流にとどめる",
              effect: {
                deltas: [],
                relationDeltas: [{ kind: "country", id: "china", delta: -2 }],
                description: "日中首脳会談は民間交流について限定的な合意にとどまった。",
              },
            },
          ],
        },
      },
    },
  },
  {
    id: "diplomacy_korea_summit",
    category: "diplomacy",
    title: "日韓首脳会談",
    description: "韓国大統領との首脳会談が行われる。",
    blocking: true,
    dialogue: {
      rootNodeId: "kr1",
      nodes: {
        kr1: {
          id: "kr1",
          speakerLabel: "韓国大統領",
          prompt: "歴史認識問題を含め、未来志向の関係構築を進めたい。",
          choices: [
            {
              id: "future_oriented",
              label: "未来志向の関係構築に前向きに応じる",
              effect: {
                deltas: [{ stat: "approvalRating", delta: 1 }],
                relationDeltas: [{ kind: "country", id: "korea", delta: 8 }],
                description: "日韓首脳会談で未来志向の関係構築に合意した。",
              },
            },
            {
              id: "cautious_response",
              label: "国内世論に配慮し慎重に対応する",
              effect: {
                deltas: [],
                relationDeltas: [{ kind: "country", id: "korea", delta: -3 }],
                description: "日韓首脳会談は慎重な対応にとどまった。",
              },
            },
          ],
        },
      },
    },
  },
];

export const diplomacyTriggers: EventTrigger[] = [
  { type: "random", eventId: "diplomacy_us_summit", weight: 3, minDayIndex: 15, cooldownDays: 40 },
  { type: "random", eventId: "diplomacy_china_summit", weight: 2, minDayIndex: 20, cooldownDays: 45 },
  { type: "random", eventId: "diplomacy_korea_summit", weight: 2, minDayIndex: 20, cooldownDays: 45 },
];
