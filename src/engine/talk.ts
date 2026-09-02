import type { GameState } from "../types/game";
import type { TalkChoice, TalkNode, TalkTree } from "../types/talk";
import { nodeOf } from "../types/talk";
import { TALK_TREES } from "../data/talk";

/**
 * いま話せる相手（設計書9章）。電話はどこからでも掛かるが、対面の相手は
 * その部屋にいなければ掴まらない。まだ起きていない相手も出さない。
 */
export function talkableAt(state: GameState): TalkTree[] {
  return TALK_TREES.filter((tree) => {
    if (tree.from !== undefined && state.clock < tree.from) return false;
    if (tree.channel === "phone") return true;
    return tree.places?.includes(state.place) ?? false;
  });
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
