import type { Appointment } from "../types/game";
import { SAWATARI, SHINOZUKA } from "./characters";

/** 05:00 起床。時間は消費せず、目覚めた状態を提示するだけの区切り。 */
export const WAKE_APPOINTMENT: Appointment = {
  id: "wake",
  label: "起床",
  at: 0,
  minutes: 0,
  resolved: false,
};

/** 通常は07:00。突発イベントが入ると前倒しされる（設計書10章）。 */
export const BRIEFING_APPOINTMENT: Appointment = {
  id: "briefing",
  label: "秘書官による朝のブリーフィング",
  at: 120,
  minutes: 30,
  resolved: false,
  highlight: "沢渡と篠塚から本日の日程の説明を受けた。",
};

export const MORNING_DATE_LABEL = "6月6日(土)";

/** 起床シーンで一度だけ出す、映画のタイトルカード風の日付。 */
export const MORNING_DATE_STAMP = "2026.06.06 SAT";

/**
 * 起床シーンは一画面ずつ送る短いカットの連なりにする（本セッションでの決定）。
 * 一文字ずつの文字送りはこの場面だけで使い、ニュース・会話・メニューでは使わない。
 *
 * 情報を与えるカットは置かない。通知は「溜まっている」ことだけを見せ、中身は
 * 見せない — 情報は時間を使って取りにいくもの、という設計を崩さないため。
 */
export type WakeBeat =
  | { kind: "clock" }
  | { kind: "line"; lines: string[] }
  | { kind: "condition" }
  | { kind: "notification"; lines: string[]; apps: string[] };

export const WAKE_BEATS: WakeBeat[] = [
  { kind: "clock" },
  { kind: "line", lines: ["2026年6月6日、土曜日。"] },
  {
    kind: "line",
    lines: ["総理大臣官邸に隣接する公邸。", "慣れない天井が視界に入る。"],
  },
  {
    kind: "line",
    lines: ["目が覚めた。", "寝室のカーテンの隙間から、もう明るい光が差している。"],
  },
  {
    kind: "line",
    lines: [
      "昨日、首班指名を受けた。",
      "皇居での親任式、内閣発足、記者会見、初閣議。すべてが終わったのは日付が変わる頃だった。",
    ],
  },
  { kind: "condition" },
  {
    kind: "notification",
    lines: ["枕元のスマートフォンに、通知が溜まっている。", "まだ、見ない。"],
    apps: ["ニュース", "メッセージ", "メール"],
  },
];

/** 沢渡が読み上げる本日の予定。v0.1では提示のみで、中身は実行しない。 */
export const TODAY_SCHEDULE: { time: string; label: string }[] = [
  { time: "09:00", label: "官邸入り・幹部打ち合わせ" },
  { time: "10:00", label: "官房長官と協議" },
  { time: "11:00", label: "与党幹事長との面会" },
  { time: "12:30", label: "昼食（党三役）" },
  { time: "14:00", label: "各省事務次官への訓示" },
  { time: "15:30", label: "外国首脳との電話会談（数件）" },
  { time: "17:00", label: "記者団ぶら下がり" },
  { time: "19:00", label: "公邸へ戻る" },
];

export const BRIEFING_SCENE = {
  opening: [
    {
      speaker: SAWATARI.shortName,
      text: "おはようございます。お休みのところ、時間を早めていただいて恐縮です。",
    },
    {
      speaker: SAWATARI.shortName,
      text: "土曜ではありますが、就任直後ですので本日も通常どおり官邸に入っていただきます。まず本日の日程から。",
    },
  ],
  closing: [
    {
      speaker: SAWATARI.shortName,
      text: "以上です。組み替えのご希望があれば伺いますが、先方のあることばかりですので、動かせるのは昼食と夕方の時間くらいかと。",
    },
    {
      speaker: SHINOZUKA.shortName,
      text: "資料は官邸に着かれてからでも間に合うようにまとめてあります。移動の車内でお読みいただける分量にしてあります。",
    },
  ],
};
