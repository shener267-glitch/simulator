import type { PolicyArea } from "../../types/policy";

/**
 * Rendered by PrivateLifeScreen (not the main PolicyScreen list), but reuses
 * the PolicyArea/PolicyOption shape since "pick one option, apply its effect,
 * spend a day" is exactly the same mechanic as a policy choice.
 */
export const privateLifeArea: PolicyArea = {
  id: "private_life",
  name: "休日の過ごし方",
  description: "限られた自由時間をどう使うか選ぶ。",
  cooldownDays: 3,
  options: [
    {
      id: "golf",
      label: "ゴルフに出かける",
      description: "支持者や財界人とのゴルフでストレスを発散する。",
      effect: {
        deltas: [
          { stat: "stress", delta: -12 },
          { stat: "scandalRisk", delta: 2 },
        ],
        description: "総理がゴルフを楽しむ姿が報じられた。",
      },
    },
    {
      id: "reading",
      label: "読書をして静かに過ごす",
      description: "官邸で読書をし、頭を整理する。",
      effect: {
        deltas: [
          { stat: "stress", delta: -8 },
          { stat: "health", delta: 2 },
        ],
      },
    },
    {
      id: "family_dinner",
      label: "家族と食事に出かける",
      description: "久しぶりに家族全員で食事に出かける。",
      effect: {
        deltas: [{ stat: "stress", delta: -6 }],
        relationDeltas: [
          { kind: "family", id: "spouse", delta: 6 },
          { kind: "family", id: "daughter", delta: 4 },
          { kind: "family", id: "son", delta: 4 },
        ],
      },
    },
    {
      id: "spouse_conversation",
      label: "配偶者とじっくり話す時間を持つ",
      description: "最近すれ違いがちな配偶者と向き合って話す。",
      effect: {
        deltas: [{ stat: "stress", delta: -4 }],
        relationDeltas: [{ kind: "family", id: "spouse", delta: 10 }],
      },
    },
    {
      id: "child_event",
      label: "子供の学校行事に参加する",
      description: "多忙な公務の合間を縫って子供の行事に顔を出す。",
      effect: {
        deltas: [
          { stat: "stress", delta: -5 },
          { stat: "approvalRating", delta: 1 },
        ],
        relationDeltas: [
          { kind: "family", id: "daughter", delta: 8 },
          { kind: "family", id: "son", delta: 8 },
        ],
      },
    },
    {
      id: "quiet_rest",
      label: "何も予定を入れず静養する",
      description: "公邸でゆっくりと体を休める。",
      effect: {
        deltas: [
          { stat: "stress", delta: -15 },
          { stat: "health", delta: 5 },
        ],
      },
    },
  ],
};
