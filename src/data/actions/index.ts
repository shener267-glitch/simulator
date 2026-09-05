import type { Action, ActionCategory } from "../../types/action";
import { CHECK_SNS, WATCH_NEWS } from "./info";
import { READ_DOCUMENTS, WRITE_NOTES } from "./work";
import { EAT_BREAKFAST, GET_READY, IDLE, NAP, TAKE_SHOWER } from "./rest";
import {
  EAT_DINNER,
  EVENING_NEWS,
  PREPARE_TOMORROW,
  SIT_WITH_FAMILY,
  TAKE_BATH,
} from "./evening";
import { CHECK_PRESS, KANTEI_TEA, SIGN_PAPERS, WALK_GROUNDS } from "./kantei";
import { DESK_ACTIONS } from "./desk";
import { CALL_ACTIONS } from "./calls";
import { BRIEFING_ACTIONS } from "./briefings";
import { LIFE_ACTIONS } from "./life";

/**
 * 設計書14章の分類。人と話すことは「話す」に移したので、ここに人間関係の
 * 枠はない（設計書4章・9章）。ただし電話を掛ける・指示を出すといった、
 * 相手が目の前にいなくても成立する仕事は行動として置く。
 */
export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  info: "情報",
  work: "仕事",
  rest: "休息",
  life: "私生活",
};

export const CATEGORY_ORDER: ActionCategory[] = ["work", "info", "rest", "life"];

export const ACTIONS: Action[] = [
  // 仕事
  READ_DOCUMENTS,
  ...DESK_ACTIONS,
  SIGN_PAPERS,
  ...BRIEFING_ACTIONS,
  ...CALL_ACTIONS,
  WRITE_NOTES,
  PREPARE_TOMORROW,
  // 情報
  WATCH_NEWS,
  EVENING_NEWS,
  CHECK_PRESS,
  CHECK_SNS,
  // 休息
  EAT_BREAKFAST,
  EAT_DINNER,
  NAP,
  KANTEI_TEA,
  IDLE,
  // 私生活
  ...LIFE_ACTIONS,
  SIT_WITH_FAMILY,
  TAKE_SHOWER,
  TAKE_BATH,
  WALK_GROUNDS,
  GET_READY,
];

export function findAction(actionId: string): Action | undefined {
  return ACTIONS.find((action) => action.id === actionId);
}
