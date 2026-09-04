import type { Minutes } from "../types/clock";
import { DAY_LENGTH } from "../types/clock";
import type { GameState } from "../types/game";

/**
 * 就寝（本セッションでの決定）。何時に寝るかはプレイヤーが決める。ただし
 * 24:00になれば、決めていなくても一日は閉じる。
 *
 * 遅く寝たことを点数で咎めることはしない。翌朝に持ち越す疲労が減らない、
 * という形でだけ返す — 明日はまだ無いので、いまは記録に残すところまで。
 */

/** 予定が全部終わって宿舎に戻ったあと。それより前に寝る総理はいない。 */
export const BEDTIME_EARLIEST: Minutes = 840; // 20:00

/**
 * 寝られるか。夜の宿舎の寝室でだけ。予定が残っているうちは布団に入れない —
 * 総理が自分の一日を途中で切り上げられないことの、いちばん素朴な形。
 */
export function canGoToBed(state: GameState): boolean {
  return (
    state.phase === "day" &&
    state.place === "bedroom" &&
    state.clock >= BEDTIME_EARLIEST &&
    state.appointments.every((appointment) => appointment.resolved)
  );
}

/** 一晩で抜ける疲労。早く寝たぶんだけ大きく、24:00に寝れば何も抜けない。 */
export function sleepRecovery(at: Minutes): number {
  const hoursEarly = Math.max(0, DAY_LENGTH - at) / 60;
  return Math.round(hoursEarly * 11);
}

/** 翌朝まで持ち越す疲労。0を下回らせない。 */
export function carriedFatigue(fatigue: number, at: Minutes): number {
  return Math.max(0, Math.round(fatigue - sleepRecovery(at)));
}

/** 何時に寝たかを一行で。数字は時刻だけで、疲労の値は出さない。 */
export function describeBedtime(at: Minutes, forced: boolean): string {
  if (forced) {
    return "日付が変わった。机に向かったまま、いつ寝たのかは自分でも分からない。明日に持ち越すものが、そのぶん増えた。";
  }
  if (at < 900) return "早めに横になった。明日の朝は、今朝よりましなはずだ。";
  if (at < 990) return "今日のところは、これでいい。寝床に入ると、すぐに意識が遠くなった。";
  if (at < 1050) return "遅くなった。眠りは浅くなるだろうが、それでも横になれるだけましだった。";
  return "日付が変わる寸前だった。目を閉じても、しばらくは今日の声が続いていた。";
}
