import type { EventDef, EventTrigger } from "../types/events";

export const privateEvents: EventDef[] = [
  {
    id: "private_spouse_neglected",
    category: "private",
    title: "配偶者との関係",
    description: "公務に追われる中、配偶者から時間を作ってほしいと相談された。",
    blocking: true,
    choices: [
      {
        id: "make_time",
        label: "スケジュールを調整して時間を作る",
        effect: {
          deltas: [{ stat: "stress", delta: -3 }],
          relationDeltas: [{ kind: "family", id: "spouse", delta: 10 }],
          description: "総理が公務の合間を縫って配偶者との時間を作った。",
        },
      },
      {
        id: "cannot_make_time",
        label: "公務優先で時間を作れないと伝える",
        effect: {
          deltas: [],
          relationDeltas: [{ kind: "family", id: "spouse", delta: -8 }],
          description: "多忙を理由に配偶者との時間は先送りとなった。",
        },
      },
    ],
  },
  {
    id: "private_child_recital",
    category: "private",
    title: "子供の発表会",
    description: "子供の学校で発表会が開かれ、招待状が届いた。",
    blocking: true,
    choices: [
      {
        id: "attend_recital",
        label: "公務を調整して出席する",
        effect: {
          deltas: [{ stat: "approvalRating", delta: 1 }],
          relationDeltas: [
            { kind: "family", id: "daughter", delta: 10 },
            { kind: "family", id: "son", delta: 5 },
          ],
          description: "総理が子供の発表会に出席し、微笑ましいと話題になった。",
        },
      },
      {
        id: "skip_recital",
        label: "公務を優先し欠席する",
        effect: {
          deltas: [],
          relationDeltas: [
            { kind: "family", id: "daughter", delta: -8 },
            { kind: "family", id: "son", delta: -4 },
          ],
          description: "総理は発表会を欠席し公務にあたった。",
        },
      },
    ],
  },
  {
    id: "private_health_checkup",
    category: "private",
    title: "健康診断の勧め",
    description: "秘書官から定期健康診断を受けるよう強く勧められた。",
    blocking: true,
    choices: [
      {
        id: "take_checkup",
        label: "時間を作って受診する",
        effect: {
          deltas: [
            { stat: "health", delta: 6 },
            { stat: "stress", delta: -2 },
          ],
          description: "総理が健康診断を受け、体調管理への意識の高さが評価された。",
        },
      },
      {
        id: "skip_checkup",
        label: "多忙を理由に先送りする",
        effect: {
          deltas: [{ stat: "health", delta: -4 }],
          description: "総理は健康診断を先送りした。",
        },
      },
    ],
  },
];

export const ambientFlavorEvents: EventDef[] = [
  {
    id: "flavor_quiet_morning",
    category: "private",
    title: "静かな朝",
    description: "特に大きな出来事のない、穏やかな一日だった。",
    blocking: false,
    autoEffect: {
      deltas: [{ stat: "stress", delta: -1 }],
      description: "官邸では特に大きな動きのない、穏やかな一日となった。",
    },
  },
  {
    id: "flavor_media_coverage",
    category: "private",
    title: "メディア報道",
    description: "総理の日常が週刊誌で軽く取り上げられた。",
    blocking: false,
    autoEffect: {
      deltas: [{ stat: "scandalRisk", delta: 1 }],
      description: "総理の普段の様子が週刊誌で紹介された。",
    },
  },
  {
    id: "flavor_public_appearance",
    category: "private",
    title: "街頭での声かけ",
    description: "視察先で市民から声をかけられた。",
    blocking: false,
    autoEffect: {
      deltas: [{ stat: "approvalRating", delta: 0.5 }],
      description: "視察先で市民から励ましの声をかけられた。",
    },
  },
];

export const privateTriggers: EventTrigger[] = [
  { type: "random", eventId: "private_spouse_neglected", weight: 2, minDayIndex: 10, cooldownDays: 25 },
  { type: "random", eventId: "private_child_recital", weight: 2, minDayIndex: 10, cooldownDays: 30 },
  { type: "random", eventId: "private_health_checkup", weight: 2, minDayIndex: 5, cooldownDays: 35 },
  { type: "random", eventId: "flavor_quiet_morning", weight: 6, minDayIndex: 0 },
  { type: "random", eventId: "flavor_media_coverage", weight: 4, minDayIndex: 0 },
  { type: "random", eventId: "flavor_public_appearance", weight: 4, minDayIndex: 0 },
];
