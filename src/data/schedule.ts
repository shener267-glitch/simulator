import type { Appointment } from "../types/game";
import { SAWATARI } from "./characters";

/**
 * 6月6日（土）の予定。時刻はすべて06:00からの経過分で持つ。
 *
 * 秘書官が組んだものが降りてくる形で、プレイヤーが一から作ることはできない
 * （設計書13章）。動かせるのは予定と予定のあいだだけ。
 *
 * 枠は開始時刻に固定されている。着席が遅れても終わりは動かないので、遅れが
 * 後ろへ積み上がって時間割が崩れることはない。
 */
export const APPOINTMENTS: Appointment[] = [
  {
    id: "departure",
    label: "議員宿舎を出発",
    at: 115, // 07:55
    minutes: 5,
    resolved: false,
    movesTo: "entrance",
    highlight: "官邸に入った。",
  },
  {
    id: "gaggle",
    label: "ぶら下がり",
    at: 120, // 08:00
    minutes: 10,
    resolved: false,
  },
  {
    id: "morning-meeting",
    label: "秘書官・官邸幹部とのミーティング",
    at: 140, // 08:20
    minutes: 40,
    resolved: false,
    movesTo: "office",
    highlight: "秘書官・官邸幹部と本日の段取りを詰めた。",
  },
  {
    id: "cabinet",
    label: "臨時閣議",
    at: 240, // 10:00
    minutes: 40,
    resolved: false,
    highlight: "臨時閣議を主宰した。",
  },
  {
    id: "party-leaders",
    label: "党幹部との会談",
    at: 300, // 11:00
    minutes: 40,
    resolved: false,
    highlight: "党幹部と経済対策について話した。",
  },
  {
    id: "lunch",
    label: "昼食",
    at: 360, // 12:00
    minutes: 30,
    resolved: false,
  },
  {
    id: "security",
    label: "安保局長・情報局長との会談",
    at: 450, // 13:30
    minutes: 30,
    resolved: false,
  },
  {
    id: "foreign",
    label: "外務事務次官・欧州局長との会談",
    at: 540, // 15:00
    minutes: 20,
    resolved: false,
  },
  {
    id: "cao",
    label: "内閣府幹部との会談",
    at: 600, // 16:00
    minutes: 40,
    resolved: false,
  },
  {
    id: "return",
    label: "官邸発",
    at: 840, // 20:00
    minutes: 1,
    resolved: false,
    movesTo: "living",
    highlight: "議員宿舎に帰り着いた。",
  },
];

/**
 * 予定の場面。会議として開かない予定（移動だけのもの）はこちらで文章を出す。
 * フラグで出し分ける行が書ける。
 */
export interface SceneLine {
  speaker?: string;
  text: string;
  /** このフラグが立っているときだけ出す。 */
  requiresFlag?: string;
  /** このフラグが立っているときは出さない。 */
  unlessFlag?: string;
}

export const APPOINTMENT_SCENES: Record<string, SceneLine[]> = {
  departure: [
    {
      speaker: SAWATARI.shortName,
      text: "「そろそろ出ましょう。車を下に着けてあります」",
    },
    {
      text: "宿舎の玄関を出ると、黒い車列が待っていた。警護が先に立ち、後ろのドアが開く。\n\n昨日までは、この道を自分の足で歩いて駅まで行く人間だった。",
    },
    {
      speaker: SAWATARI.shortName,
      text: "「公邸への引っ越しは、落ち着いてからで結構です。当面はここから通っていただきます」",
    },
  ],
  return: [
    {
      text: "官邸の玄関を出る。夜になっても、まだ生ぬるい風だった。\n\n車に乗り込むと、一分もしないうちに宿舎に着いた。近いということが、今日は初めて有難く感じられた。",
    },
    {
      speaker: SAWATARI.shortName,
      text: "「お疲れさまでした。明日は八時にお迎えに上がります」",
      unlessFlag: "long-day",
    },
    {
      text: "部屋に入る。静かだった。",
    },
  ],
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
    lines: ["議員宿舎の一室。", "十二年見てきたはずの天井が、今朝は少し違って見える。"],
  },
  {
    kind: "line",
    lines: ["目が覚めた。", "カーテンの隙間から、もう明るい光が差している。"],
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
