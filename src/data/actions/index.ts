import type { Action, ActionCategory } from "../../types/action";
import { CHECK_SNS, WATCH_NEWS } from "./info";
import { CONSULT_SAWATARI, CONSULT_SHINOZUKA, TALK_WITH_WIFE } from "./people";
import { GIVE_INSTRUCTIONS, READ_DOCUMENTS } from "./work";
import { EAT_BREAKFAST, GET_READY, IDLE, NAP } from "./rest";

/** 設計書14章の分類。 */
export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  info: "情報",
  people: "人間関係",
  work: "仕事",
  rest: "休息",
  life: "私生活",
};

export const CATEGORY_ORDER: ActionCategory[] = ["info", "people", "work", "rest", "life"];

export const ACTIONS: Action[] = [
  WATCH_NEWS,
  CHECK_SNS,
  TALK_WITH_WIFE,
  CONSULT_SAWATARI,
  CONSULT_SHINOZUKA,
  READ_DOCUMENTS,
  GIVE_INSTRUCTIONS,
  EAT_BREAKFAST,
  NAP,
  IDLE,
  GET_READY,
];

export function findAction(actionId: string): Action | undefined {
  return ACTIONS.find((action) => action.id === actionId);
}
