import type { Minutes } from "../types/clock";
import type { GameState } from "../types/game";
import { placeById } from "../data/places";

/**
 * 官邸を出る（本セッションでの決定）。
 *
 * 以前は20:00に「官邸発」という予定が入っていて、そこで必ず帰らされていた。
 * それでは総理の一日を総理が終えられない。18:00を過ぎたら、自分で帰ると
 * 言えるようにしてある — 早く帰れば夜が長くなり、粘れば夜が無くなる。
 *
 * 車で五分。赤坂の議員宿舎から官邸までは五百メートルほどしかない。
 */
export const EARLIEST_DEPARTURE: Minutes = 720; // 18:00
export const RIDE_MINUTES: Minutes = 5;

/** 帰れるか。官邸にいて、18:00を過ぎていて、予定が残っていないこと。 */
export function canLeaveKantei(state: GameState): boolean {
  return (
    state.phase === "day" &&
    state.mode.kind === "place" &&
    placeById(state.place).building === "kantei" &&
    state.clock >= EARLIEST_DEPARTURE &&
    state.appointments.every((appointment) => appointment.resolved)
  );
}

/** 何時に帰ったかで、夜の長さが決まる。 */
export function describeDeparture(at: Minutes): string {
  if (at < 780) return "まだ明るいうちに官邸を出た。こんな時間に帰る総理がいることを、警護は知らないようだった。";
  if (at < 900) return "官邸の玄関を出る。夜になっても、まだ生ぬるい風だった。";
  return "遅くなった。玄関に残っていたのは、当直と警護だけだった。";
}
