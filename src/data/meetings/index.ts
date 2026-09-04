import type { Meeting } from "../../types/meeting";
import { GAGGLE, MORNING_MEETING } from "./morning";
import { CABINET, LUNCH, PARTY_LEADERS } from "./midday";
import { CAO, FOREIGN, SECURITY } from "./afternoon";

/**
 * 予定8件すべてを、文章を読むだけの場面ではなく小さな判断の場にする
 * （設計書15章、本セッションでの決定）。移動だけの予定（出発・官邸発）には
 * 会議を置かず、`APPOINTMENT_SCENES` の文章で通す。
 */
export const MEETINGS: Meeting[] = [
  GAGGLE,
  MORNING_MEETING,
  CABINET,
  PARTY_LEADERS,
  LUNCH,
  SECURITY,
  FOREIGN,
  CAO,
];
