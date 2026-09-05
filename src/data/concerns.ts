import type { Concern } from "../types/concern";
import { DAY_LENGTH } from "../types/clock";
import { WIFE } from "./characters";

/**
 * 上から順に見て、当てはまったものを先頭から最大2件出す。
 *
 * ここにあるのは感情と体だけ。「資料を読む」「官房長官に確認する」といった
 * 仕事は📋やること（`data/duties.ts`）の側にある。分けたのは、この二つが
 * 混ざると内心がToDoリストに見えてしまうから（本セッションでの決定）。
 *
 * 体の感覚は時計ではなく体調から出す。朝食を抜けば昼前に腹の話が出てくるし、
 * 取っていれば出てこない。無視しても叱られないが、体調そのものは動く。
 */
export const CONCERNS: Concern[] = [
  {
    id: "starving",
    text: "腹が減って、他のことが頭に入ってこない。",
    whenHungerOver: 78,
  },
  {
    id: "spent",
    text: "頭の芯が重い。目の奥が、じんと痛む。",
    whenFatigueOver: 82,
  },
  {
    id: "hungry",
    text: "そろそろ何か腹に入れておきたい。",
    whenHungerOver: 58,
  },
  {
    id: "sleepy",
    text: "少し眠い。昨日は日付が変わってからだった。",
    whenFatigueOver: 62,
  },
  {
    id: "not-dressed",
    text: "まだ寝間着のままだ。",
    from: 30, // 06:30
    until: 115,
    unlessFlags: ["dressed"],
  },
  {
    id: "wife-morning",
    text: `${WIFE.name}と、昨日からまだ一言も話していない。`,
    from: 20,
    until: 115,
    unlessFlags: ["talked-to-wife"],
  },
  {
    id: "unreal",
    text: "自分が総理大臣だという実感が、まだない。",
    until: 240, // 閣議を主宰するまで
    unlessFlags: ["addressed-the-cabinet", "heard-the-ministers"],
  },
  {
    id: "heavy",
    text: "今日はなんとなく、気分が重い。",
    from: 450, // 午後、一日の折り返しあたり
    until: 720,
    whenFatigueOver: 55,
  },
  {
    id: "watched",
    text: "誰かに見られている感じが、朝からずっと抜けない。",
    from: 120,
    until: 600,
    requiresFlags: ["talked-to-press"],
  },
  {
    id: "family-tonight",
    text: "今日は家族と、ほとんど顔を合わせていない。",
    from: 840,
    unlessFlags: ["sat-with-family", "talked-to-wife-tonight"],
  },
  {
    id: "quiet",
    text: "静かだ。昨日の今ごろは、まだ人に囲まれていた。",
    from: 900,
    until: DAY_LENGTH,
  },
];
