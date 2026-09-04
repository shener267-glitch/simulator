import type { Minutes } from "./clock";
import type { ConditionDelta } from "./action";

/**
 * 会議の中の一行。フラグで出し分けられる（設計書15章・28章）。
 * 資料を読まずに来た総理には、別の行が読まれる。
 */
export interface MeetingBeat {
  speaker?: string;
  text: string;
  /** このフラグが立っているときだけ出す。 */
  requiresFlag?: string;
  /** このフラグが立っているときは出さない。 */
  unlessFlag?: string;
}

/**
 * 会議の中でできる小さな判断（設計書15章）。枠の中で分を使うので、
 * 全部は聞けない。何を聞かずに終えるかが、その会議の中身になる。
 */
export interface MeetingChoice {
  id: string;
  label: string;
  /** ラベルの下の一行。何を選ぼうとしているのかを一言で。 */
  note?: string;
  minutes: Minutes;
  reply: MeetingBeat[];
  /** これが立っていて初めて出る。資料を読んだ総理にだけ開く選択肢がある。 */
  requiresFlag?: string;
  /** これが立っていると出ない。読んだ人に「読んでいない人向けの逃げ道」は出さない。 */
  unlessFlag?: string;
  flags?: string[];
  highlight?: string;
  /** 昼食のように、選ぶこと自体が体調を動かすものがある。 */
  condition?: ConditionDelta;
}

export interface Meeting {
  /** 対応する予定のid。 */
  appointmentId: string;
  /** 席についてすぐ読まれる。 */
  opening: MeetingBeat[];
  /** 選択肢の上に出す一行。 */
  prompt?: string;
  choices: MeetingChoice[];
  /** 終えるときに読まれる。 */
  closing: MeetingBeat[];
}

/** 会議のどの段にいるか。 */
export type MeetingStage = "opening" | "choices" | "reply" | "closing";
