import type { Minutes } from "./clock";
import type { PlaceId } from "./place";

/**
 * 部屋にいる人（本セッションでの決定）。
 *
 * 場所が「そこで何ができるか」を決めるのと同じように、人も「そこで誰と
 * 話せるか」を決める。画面に出すのは名前と一行だけで、居場所そのものが
 * 情報になる — 秘書官室に二人ともいれば呼ばずに済み、いなければ電話になる。
 */
export interface Presence {
  place: PlaceId;
  from?: Minutes;
  until?: Minutes;
  /** その部屋にいるときの一行。「机で紙を捌いている」 */
  note?: string;
}

export interface Person {
  /** 会話の木のidと揃える。揃っていないものは「いるが話せない」人になる。 */
  id: string;
  name: string;
  short: string;
  emoji: string;
  role: string;
  presence: Presence[];
  /**
   * 執務室に呼べる相手。呼ぶと来るまでに数分かかる — 総理の時間を使わずに
   * 人を動かせるわけではない。
   */
  summonable?: boolean;
  /** 電話でも掴まる相手。 */
  phone?: boolean;
}

/** 呼んでから来るまで。 */
export const SUMMON_MINUTES: Minutes = 3;

/** どうやってその人に届くか。 */
export type Reach = "here" | "summon" | "phone";
