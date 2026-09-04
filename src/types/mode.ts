import type { Minutes } from "./clock";
import type { MeetingStage } from "./meeting";

/**
 * 何のセグメントを消化しているか。いまは行動だけだが、会話の返事も電話の
 * ニュースも同じ機構に乗せるつもりで union にしてある — 中断のルールが
 * 一箇所にしかない状態を保つため（設計書13章・19章）。
 */
export type SegmentSource =
  | { kind: "action"; actionId: string }
  /** 会話の返事。行動と同じ機構で走らせて、中断のルールを一本に保つ。 */
  | { kind: "talk"; treeId: string; choiceId: string };

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
  /**
   * 人と話している最中。話題を選んでいるときは run が null、返事を読んで
   * いるときだけ入る。ログは会話ごとに一行なので、合計はここで数える。
   */
  | {
      kind: "talk";
      treeId: string;
      nodeId: string;
      startedAt: Minutes;
      minutesSpent: Minutes;
      run: SegmentRun | null;
    }
  | { kind: "appointment"; appointmentId: string }
  /**
   * 会議の最中（設計書15章）。枠は予定の側が持っているので、ここに持つのは
   * 「どの段にいるか」と「もう何を聞いたか」、それに席についた時刻だけ。
   */
  | {
      kind: "meeting";
      appointmentId: string;
      /**
       * 席についた時刻。予定の開始時刻とは限らない — 割り込みに答えたあとなど、
       * 少し遅れて座ることがある。一日の記録に会議を一行で出すために持つ。
       */
      startedAt: Minutes;
      stage: MeetingStage;
      /** 再生中の選択肢。stage が "reply" のときだけ入る。 */
      showing: string | null;
      /** この会議でもう聞いてしまった話題。 */
      taken: string[];
    };

/**
 * いまどの画面にいるか。v0.1 は activeAction / activeAppointmentId /
 * activeEventId の三つの nullable フィールドで表していて、「同時にひとつ
 * だけ」という決まりを二箇所の場当たりなガードで支えていた。判別可能
 * ユニオンにすると、ありえない組み合わせがそもそも書けなくなる。
 */
export type Mode =
  | RestingMode
  | {
      kind: "interrupt";
      interruptId: string;
      /** 三択に答えたか。まだなら選択肢、答えたあとは本編。 */
      answered: boolean;
      /** 後回し・無視で戻る先。鳴った時点の画面。 */
      resume: RestingMode;
    };

/** いま走っている run。走っていなければ null。 */
export function runOf(mode: Mode): SegmentRun | null {
  if (mode.kind === "action" || mode.kind === "talk") return mode.run;
  if (mode.kind === "interrupt") return runOf(mode.resume);
  return null;
}
