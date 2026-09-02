import type { Minutes } from "./clock";
import type { PlaceId } from "./place";
import type { Segment } from "./action";

/** 電話は場所を選ばない。対面は、その人がいる部屋でしか掴まらない。 */
export type TalkChannel = "phone" | "in-person";

export type TalkChoice =
  /** 「指示を出す」「相談する」など。枝を移るだけで、時間は使わない。 */
  | { kind: "goto"; id: string; label: string; to: string }
  /** 話題。返事は一区切りぶんで、時間を使う。 */
  | {
      kind: "topic";
      id: string;
      label: string;
      reply: Segment;
      /** 一度きり。同じ話を二度は聞けない。 */
      once?: boolean;
      /** このフラグが立っていて初めて出る話題（設計書27章の情報の連鎖）。 */
      requiresFlag?: string;
      /** 選んだことで積む性格フラグ（設計書28章）。 */
      flags?: string[];
    }
  /** 切る。 */
  | { kind: "end"; id: string; label: string };

export interface TalkNode {
  id: string;
  /** 選択肢の上に出す一行。 */
  prompt?: string;
  choices: TalkChoice[];
}

export interface TalkTree {
  id: string;
  /** 一覧に出す呼び方。「沢渡に電話する」 */
  label: string;
  /** ログや見出しに使う短い名前。「沢渡」 */
  short: string;
  emoji: string;
  hint: string;
  channel: TalkChannel;
  /** 対面のときだけ指定する。電話は省略で、どこからでも掛かる。 */
  places?: PlaceId[];
  /** この時刻より前は掴まらない。 */
  from?: Minutes;
  rootId: string;
  nodes: TalkNode[];
}

export function nodeOf(tree: TalkTree, nodeId: string): TalkNode | undefined {
  return tree.nodes.find((node) => node.id === nodeId);
}

export function choiceOf(tree: TalkTree, choiceId: string): TalkChoice | undefined {
  for (const node of tree.nodes) {
    const choice = node.choices.find((candidate) => candidate.id === choiceId);
    if (choice) return choice;
  }
  return undefined;
}
