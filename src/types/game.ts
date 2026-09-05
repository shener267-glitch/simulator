import type { Minutes } from "./clock";
import type { PlaceId } from "./place";
import type { Mode } from "./mode";

/**
 * Tracked internally but never rendered as a number — the UI shows the prose
 * from engine/condition.ts and a five-cell meter, and neither ever prints a
 * digit（設計書24章・30章）.
 */
export interface Condition {
  /** 0 = 万全, 100 = 限界. */
  fatigue: number;
  /** 0 = 満腹, 100 = 空腹. */
  hunger: number;
}

/**
 * A fixed point in the morning the player does not control — HARD. Crossing
 * one cuts a segment short and charges only the minutes that were really left.
 */
export interface Appointment {
  id: string;
  label: string;
  /** Offset from 05:00. Events may pull this earlier. */
  at: Minutes;
  minutes: Minutes;
  resolved: boolean;
  /** Where attending it leaves the player — 07:30の官邸入りがこれ。 */
  movesTo?: PlaceId;
  /**
   * 予定表に載っているか。false のものは visibleFreeMinutes から隠れ、
   * 不意打ちとして届く。省略時は true — 黙っていればプレイヤーは知っている。
   */
  announced?: boolean;
  /** Recorded in the morning's highlights once attended. */
  highlight?: string;
}

/**
 * 割り込みへの答え方（本セッションでの決定）。
 *
 * すべて聞かなければならない仕様にはしない。忙しい総理として合理的な
 * 判断になる場合があるように、断る手が最初から並んでいる。断ったから
 * といって、すぐに悪いことが起きるわけでもない。
 */
export type InterruptChoice = "answer" | "brief" | "defer" | "ignore" | "delegate";

/** 割り込みの選択肢。件ごとに、出す手を選べる。 */
export interface InterruptOption {
  id: InterruptChoice;
  label: string;
  /** ラベルの下の一行。 */
  note: string;
  minutes: Minutes;
  /** 選んだあとに読む段。省略すると、そのまま元の画面に戻る。 */
  body?: string[];
  flags?: string[];
  /** 電話に残す。あとから時間を使って読める。 */
  leavesMessage?: boolean;
}

/**
 * Something that arrives on its own — SOFT（設計書17章・26章）。予定と違って
 * セグメントを途中で切らない。切れ目で鳴り、出るか、後回しにするか、無視する
 * かをプレイヤーが選ぶ。
 */
export interface SoftInterrupt {
  id: string;
  at: Minutes;
  title: string;
  /** Who got in touch. */
  from: string;
  /** 中身を明かさない予告。三択の上に出す。 */
  teaser: string[];
  /** 「中断して確認する」で初めて読める本編。 */
  body: string[];
  /** 「中断して確認する」に使う分。option を書かないときの既定値。 */
  minutes: Minutes;
  /**
   * 出す手。省略すると 出る／後回し／無視 の三択になる。相手や場面に
   * よって「三分だけ聞く」「秘書官に任せる」を足す。
   */
  options?: InterruptOption[];
  /** 後回しにしたときに電話へ残る中身。あとから、時間を使って読める。 */
  message: { from: string; body: string[]; minutes: Minutes; flags?: string[] };
  /**
   * どう答えても起きる予定変更。世界の側の動きであって、プレイヤーの
   * 選択で止まるものではない。
   */
  movesAppointment?: {
    appointmentId: string;
    to: Minutes;
    note: string;
  };
  /** 選び方によって積む性格フラグ（設計書28章）。options 側にも書ける。 */
  flags?: Partial<Record<InterruptChoice, string[]>>;
  highlight: string;
  fired: boolean;
  answeredWith: InterruptChoice | null;
}

/**
 * 電話に残っているもの。後回しにした連絡はここに落ちる。読むにも時間は
 * かかる — 後回しは時間を先送りする手であって、ただにする手ではない。
 */
export interface PhoneMessage {
  id: string;
  from: string;
  at: Minutes;
  body: string[];
  minutes: Minutes;
  read: boolean;
  /** 読んで初めて知ることになる（設計書27章）。 */
  flags?: string[];
}

/** What the player did and how long it took — the morning review reads this. */
export interface LogEntry {
  label: string;
  minutes: Minutes;
  startedAt: Minutes;
  /** 移動の一分。続けて歩いた分は一行にまとめる。 */
  move?: boolean;
}

export type Phase = "day" | "review";

export interface GameState {
  saveVersion: number;
  clock: Minutes;
  phase: Phase;
  player: {
    familyName: string;
    givenName: string;
  };
  /** いまいる場所。画面（mode）とは独立 — 風呂にいるまま電話は見られる。 */
  place: PlaceId;
  condition: Condition;
  /** HARD。跨ぐセグメントを切る。interruptionGuard が見るのはこれだけ。 */
  appointments: Appointment[];
  /** SOFT。ガードには入らず、セグメントの切れ目で鳴る。 */
  interrupts: SoftInterrupt[];
  /** いまどの画面にいるか。 */
  mode: Mode;
  phone: { messages: PhoneMessage[] };
  log: LogEntry[];
  /** Notable moments, in the order they happened. */
  highlights: string[];
  /** 性格フラグ（設計書28章）。v0.2では貯めるだけで、誰の反応にも使わない。 */
  flags: string[];
  /** Actions whose segments have all been used up. */
  spentActions: string[];
  /** How far into each action the player has read, so returning to it resumes. */
  actionProgress: Record<string, number>;
  /** 相手ごとに、もう聞いてしまった話題。会話を抜けても朝の終わりまで残る。 */
  talkProgress: Record<string, string[]>;
  /**
   * どう一日を閉じたか。自分で寝たのか、24:00に閉じられたのか、そのとき
   * 何を翌朝へ持ち越すのか。翌日はまだ作らないが、引き継げる形にしておく。
   */
  sleep: { at: Minutes; forced: boolean; carriedFatigue: number } | null;
}
