import type { Minutes } from "./clock";

/**
 * 危機イベントの土台（指示書17〜19章）。
 *
 * **このバージョンでは一件も発火しない。** 型とカタログだけを先に置く。
 * 理由は二つある。
 *
 * 一つは、四十種類の事件を「起こす仕組み」より先に「どう繋がっているか」を
 * 決めておきたいこと。地震から津波が来ることがあり、来ないこともある。
 * 親子と関連を先に張っておけば、あとから発火の仕組みを載せられる。
 *
 * もう一つは予兆の扱い。**予兆は起きる予告ではない。** 兆候が出て、何も
 * 起きないまま終わることの方が多い、という形にしておかないと、予兆が
 * 出た瞬間にプレイヤーが「来るぞ」と読んでしまう。確率はそのために持つ。
 */

export type Season = "spring" | "summer" | "autumn" | "winter";

/** 発生したとき、その日の予定がどうなるか。 */
export type ScheduleImpact =
  | "none" // 予定は動かない。報告が一本増えるだけ
  | "delay" // 後ろがずれる
  | "clear-afternoon" // 午後が飛ぶ
  | "clear-day"; // その日が丸ごと危機対応になる

/**
 * 報告に上がる手前で見えるもの。「これが出たから起きる」ではなく、
 * 「起きたときに、あれがそうだったと分かる」ためのもの。
 */
export interface Omen {
  text: string;
  /** どこから上がってくるか。安保局か、省庁か、報道か、SNSか。 */
  from: string;
}

export interface CrisisTemplate {
  id: string;
  label: string;
  /** 主管する府省庁。複数にまたがるものほど、決めるのに時間がかかる。 */
  ministries: string[];
  /** これが起きたあとに起こりうるもの。確率は子の側の probability が持つ。 */
  children: string[];
  /** これが先に起きていると起こりやすくなるもの。 */
  parents: string[];
  /** 同時期に並びやすい、因果ではないもの。 */
  related: string[];
  note?: string;
  omens: Omen[];
  /** 一日あたりの目安。合計しても1にはならない — 何も起きない日の方が多い。 */
  probability: number;
  /** 季節が限られるもの。省略すれば通年。 */
  seasons?: Season[];
  /** これらのフラグが立っていないと起きない。 */
  requires?: string[];
  /** 対応に取られる時間の幅。 */
  durationMinutes?: { min: Minutes; max: Minutes };
  scheduleImpact: ScheduleImpact;
}
