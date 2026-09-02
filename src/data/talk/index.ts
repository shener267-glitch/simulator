import type { TalkTree } from "../../types/talk";
import { SAWATARI_TREE } from "./sawatari";
import { SHINOZUKA_TREE } from "./shinozuka";
import { WIFE_TREE, YOUNGER_SON_TREE } from "./family";

export const TALK_TREES: TalkTree[] = [
  SAWATARI_TREE,
  SHINOZUKA_TREE,
  WIFE_TREE,
  YOUNGER_SON_TREE,
];

export function findTree(treeId: string): TalkTree | undefined {
  return TALK_TREES.find((tree) => tree.id === treeId);
}
