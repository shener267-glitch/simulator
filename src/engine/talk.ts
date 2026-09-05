import type { GameState } from "../types/game";
import type { TalkChoice, TalkNode, TalkTree } from "../types/talk";
import { nodeOf } from "../types/talk";
import { TALK_TREES } from "../data/talk";
import { peopleAt, personById, whereIs } from "../data/people";
import { SUMMON_MINUTES, type Reach } from "../types/person";

export interface Reachable {
  tree: TalkTree;
  reach: Reach;
  /** その部屋にいる人の一行。いない相手には付かない。 */
  note?: string;
}

/**
 * いま話せる相手と、どうやって届くか（設計書9章）。
 *
 * 同じ部屋にいれば、そのまま話しかけられる。執務室にいて相手が官邸の中に
 * いるなら呼べるが、来るまでに三分かかる。それ以外は電話になる —
 * 掛かる相手にだけ。
 */
export function reachableFrom(state: GameState): Reachable[] {
  const here = new Set(peopleAt(state).map((entry) => entry.person.id));

  return TALK_TREES.flatMap((tree) => {
    const person = personById(tree.id);
    if (!person) return [];

    if (here.has(person.id)) {
      const note = peopleAt(state).find((entry) => entry.person.id === person.id)?.note;
      return [{ tree, reach: "here" as Reach, note }];
    }
    // 呼べるのは執務室にいるときだけ。廊下から呼びつける総理はいない。
    if (person.summonable && state.place === "office" && whereIs(person, state.clock) !== null) {
      return [{ tree, reach: "summon" as Reach }];
    }
    if (person.phone) return [{ tree, reach: "phone" as Reach }];
    return [];
  });
}

/** いま話せる相手だけ。届き方を問わないところで使う。 */
export function talkableAt(state: GameState): TalkTree[] {
  return reachableFrom(state).map((entry) => entry.tree);
}

/** その相手に届くまでに使う分。呼べば三分、それ以外はすぐ。 */
export function reachMinutes(reach: Reach): number {
  return reach === "summon" ? SUMMON_MINUTES : 0;
}

/** その相手ですでに使い切った話題。 */
export function usedTopics(state: GameState, treeId: string): string[] {
  return state.talkProgress[treeId] ?? [];
}

/** いま選べる選択肢。一度きりの話題と、条件を満たしていない話題は落とす。 */
export function choicesAt(state: GameState, tree: TalkTree, node: TalkNode): TalkChoice[] {
  const used = usedTopics(state, tree.id);
  return node.choices.filter((choice) => {
    if (choice.kind !== "topic") return true;
    if (choice.once && used.includes(choice.id)) return false;
    if (choice.requiresFlag && !state.flags.includes(choice.requiresFlag)) return false;
    return true;
  });
}

/** その枝に、まだ聞けることが残っているか。空の枝は入口ごと畳む。 */
export function hasSomethingLeft(state: GameState, tree: TalkTree, nodeId: string): boolean {
  const node = nodeOf(tree, nodeId);
  if (!node) return false;
  return choicesAt(state, tree, node).some((choice) => choice.kind === "topic");
}
