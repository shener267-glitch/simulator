import type { EventDef, EventTrigger } from "../types/events";
import type { GameState } from "../types/game";

export const scandalEvents: EventDef[] = [
  {
    id: "scandal_money_politics",
    category: "scandal",
    title: "政治とカネの疑惑",
    description: "総理周辺の政治資金をめぐる疑惑が週刊誌にすっぱ抜かれた。",
    blocking: true,
    choices: [
      {
        id: "deny_scandal",
        label: "疑惑を全面的に否定する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -10 },
            { stat: "scandalRisk", delta: 8 },
          ],
          description: "総理は疑惑を全面否定したが、火に油を注ぐ結果となった。",
        },
      },
      {
        id: "apologize_scandal",
        label: "説明責任を果たし謝罪する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -4 },
            { stat: "scandalRisk", delta: -6 },
          ],
          description: "総理が謝罪会見を開き、事態は一定程度沈静化した。",
        },
      },
      {
        id: "replace_minister",
        label: "関係大臣を更迭する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: 2 },
            { stat: "scandalRisk", delta: -10 },
          ],
          relationDeltas: [{ kind: "faction", id: "mainstream", delta: -4 }],
          description: "関係大臣の更迭により、事態の幕引きが図られた。",
        },
      },
    ],
  },
  {
    id: "scandal_gaffe",
    category: "scandal",
    title: "総理の失言",
    description: "総理の記者会見での発言が失言として大きく報じられた。",
    blocking: true,
    choices: [
      {
        id: "immediate_apology",
        label: "直ちに撤回し謝罪する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -3 },
            { stat: "scandalRisk", delta: -4 },
          ],
          description: "総理は発言を速やかに撤回し謝罪した。",
        },
      },
      {
        id: "defend_gaffe",
        label: "発言の真意を説明し押し通す",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -8 },
            { stat: "scandalRisk", delta: 5 },
          ],
          description: "説明が火に油を注ぎ、批判がさらに広がった。",
        },
      },
    ],
  },
  {
    id: "scandal_family",
    category: "scandal",
    title: "家族をめぐる報道",
    description: "総理の家族の行動が問題視され、報道が過熱している。",
    blocking: true,
    choices: [
      {
        id: "protect_family",
        label: "家族を守りつつ丁寧に説明する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -2 },
            { stat: "scandalRisk", delta: -5 },
          ],
          relationDeltas: [{ kind: "family", id: "spouse", delta: 5 }],
          description: "総理は家族を守る姿勢を示しつつ丁寧に説明した。",
        },
      },
      {
        id: "distance_family",
        label: "家族の問題として距離を置く",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -1 },
            { stat: "scandalRisk", delta: -2 },
          ],
          relationDeltas: [{ kind: "family", id: "spouse", delta: -10 }],
          description: "総理が距離を置く姿勢を見せたことに冷淡だとの声も上がった。",
        },
      },
    ],
  },
  {
    id: "scandal_magazine_expose",
    category: "scandal",
    title: "週刊誌の暴露記事",
    description: "週刊誌が総理に関する暴露記事を掲載し、大きな話題となった。",
    blocking: true,
    choices: [
      {
        id: "press_conference",
        label: "緊急記者会見を開き説明する",
        effect: {
          deltas: [
            { stat: "approvalRating", delta: -3 },
            { stat: "scandalRisk", delta: -7 },
          ],
          description: "緊急記者会見での説明により、報道の勢いはやや収まった。",
        },
      },
      {
        id: "ignore_expose",
        label: "静観し事態の沈静化を待つ",
        effect: {
          deltas: [{ stat: "scandalRisk", delta: 4 }],
          description: "静観の姿勢に、対応の遅さを指摘する声が上がった。",
        },
      },
    ],
  },
];

export const scandalTriggers: EventTrigger[] = scandalEvents.map((def) => ({
  type: "random",
  eventId: def.id,
  // Rare when scandalRisk is low, increasingly likely as it accumulates.
  weight: (state: GameState) => Math.max(0.1, state.stats.scandalRisk / 10),
  minDayIndex: 20,
  cooldownDays: 45,
}));
