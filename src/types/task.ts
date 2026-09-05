import type { Minutes } from "./clock";

/**
 * 📋やること（本セッションでの決定）。
 *
 * 内心（`types/concern.ts`）とは別のもの。内心が「腹が減った」「少し眠い」
 * という体と気分なのに対して、こちらは総理として処理すべき仕事と確認事項が
 * 並ぶ。
 *
 * ただし必須クエストではない。**やらなかったことは、その場では何も起きない。**
 * 後の会議や会話で、選べる手が減るという形でだけ返ってくる。済んだ数も、
 * 達成率も出さない — 出せば、消化するゲームになってしまう。
 */
export interface DutyItem {
  id: string;
  /** 一行。「経済対策の資料を読む」 */
  text: string;
  /** どこから来た話か。「篠塚」「外務省」 */
  from?: string;
  /** これを片付ける行動や話題のid。画面には出さないが、済んだ判定に使う。 */
  doneFlags: string[];
  /** この時刻から出る。 */
  from_?: Minutes;
  /** この時刻を過ぎたら降ろす。間に合わなかったものは、静かに消える。 */
  until?: Minutes;
  /** これらが全て立っていて初めて出る。 */
  requiresFlags?: string[];
  /**
   * 期限。表示にだけ使う。過ぎても叱らない — 過ぎたことは、あとで
   * 手が足りないという形で分かる。
   */
  by?: Minutes;
}

/** 画面に出すときの一件。 */
export interface Duty extends DutyItem {
  done: boolean;
}
