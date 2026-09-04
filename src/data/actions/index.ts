import type { Action, ActionCategory } from "../../types/action";
import { CHECK_SNS, WATCH_NEWS } from "./info";
import { READ_DOCUMENTS, WRITE_NOTES } from "./work";
import { EAT_BREAKFAST, GET_READY, IDLE, NAP, TAKE_SHOWER } from "./rest";
import {
  EAT_DINNER,
  EVENING_NEWS,
  PREPARE_TOMORROW,
  SIGN_PAPERS,
  SIT_WITH_FAMILY,
  TAKE_BATH,
} from "./evening";

/**
 * 設計書14章の分類。人と話すことは「行動」ではなく「話す」に移したので、
 * ここに人間関係の枠はない（設計書4章・9章）。
 */
export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  info: "情報",
  work: "仕事",
  rest: "休息",
  life: "私生活",
};

export const CATEGORY_ORDER: ActionCategory[] = ["info", "work", "rest", "life"];

export const ACTIONS: Action[] = [
  WATCH_NEWS,
  EVENING_NEWS,
  CHECK_SNS,
  READ_DOCUMENTS,
  WRITE_NOTES,
  SIGN_PAPERS,
  PREPARE_TOMORROW,
  EAT_BREAKFAST,
  EAT_DINNER,
  NAP,
  IDLE,
  SIT_WITH_FAMILY,
  TAKE_SHOWER,
  TAKE_BATH,
  GET_READY,
];

export function findAction(actionId: string): Action | undefined {
  return ACTIONS.find((action) => action.id === actionId);
}
