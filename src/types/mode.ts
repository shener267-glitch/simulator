import type { Minutes } from "./clock";

/**
 * 何のセグメントを消化しているか。いまは行動だけだが、会話の返事も電話の
 * ニュースも同じ機構に乗せるつもりで union にしてある — 中断のルールが
 * 一箇所にしかない状態を保つため（設計書13章・19章）。
 */
export type SegmentSource = { kind: "action"; actionId: string };

/** セグメントを一つずつ消化している最中の状態。 */
export interface SegmentRun {
  source: SegmentSource;
  /** 次に消化するセグメントの位置。中断されたセグメントは進めない。 */
  segmentIndex: number;
  minutesSpent: Minutes;
  startedAt: Minutes;
  /**
   * 「どのくらい？」で選んだ目安（設計書6章）。到達しても勝手には止まらず、
   * ボタンの文字が変わるだけ。時間の計算には一切効かない。
   */
  targetMinutes: Minutes | null;
  /** 予定に切られた。 */
  interrupted: boolean;
  /** 最後まで読み切った。 */
  exhausted: boolean;
}

/**
 * 割り込みが「戻ってこられる」画面。割り込み自身は入らない — 入れ子の
 * 割り込みは作らない。
 */
export type RestingMode =
  | { kind: "wake" }
  | { kind: "place" }
  /** 「どのくらい？」を聞いている最中。まだ時間は動いていない（設計書6章）。 */
  | { kind: "duration"; actionId: string }
  | { kind: "action"; run: SegmentRun }
  | { kind: "appointment"; appointmentId: string };

/**
 * いまどの画面にいるか。v0.1 は activeAction / activeAppointmentId /
 * activeEventId の三つの nullable フィールドで表していて、「同時にひとつ
 * だけ」という決まりを二箇所の場当たりなガードで支えていた。判別可能
 * ユニオンにすると、ありえない組み合わせがそもそも書けなくなる。
 */
export type Mode = RestingMode | { kind: "event"; eventId: string; resume: RestingMode };

/** いま走っている run。走っていなければ null。 */
export function runOf(mode: Mode): SegmentRun | null {
  if (mode.kind === "action") return mode.run;
  if (mode.kind === "event" && mode.resume.kind === "action") return mode.resume.run;
  return null;
}
