import type { Appointment } from "../types/game";
import { SAWATARI, SHINOZUKA } from "./characters";

/** 通常は07:00。突発イベントが入ると前倒しされる（設計書10章）。 */
export const BRIEFING_APPOINTMENT: Appointment = {
  id: "briefing",
  label: "秘書官による朝のブリーフィング",
  at: 120,
  minutes: 30,
  resolved: false,
  highlight: "沢渡と篠塚から本日の日程の説明を受けた。",
};

/**
 * 07:30。公邸と官邸は徒歩一分だが、出るのはこちらの都合ではない。
 * 済むと現在地が官邸・執務室に変わる（設計書22章）。
 */
export const KANTEI_ARRIVAL_APPOINTMENT: Appointment = {
  id: "kantei",
  label: "官邸入り",
  at: 150,
  minutes: 5,
  resolved: false,
  movesTo: "office",
  highlight: "官邸に入った。",
};

/** 07:45。朝の最後の予定で、08:00からの公務に地続きになっている。 */
export const CHIEF_MEETING_APPOINTMENT: Appointment = {
  id: "chief-meeting",
  label: "官房長官との打ち合わせ",
  at: 165,
  minutes: 15,
  resolved: false,
  highlight: "官房長官と、記載漏れの報道への対応を詰めた。",
};

/**
 * 予定の場面。フラグで出し分ける行がある — 06:10の着信を無視した総理は、
 * ここで初めて用件を聞くことになる（設計書26章・28章）。
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
  kantei: [
    {
      speaker: SAWATARI.shortName,
      text: "「そろそろ出ましょう。歩いて一分ですが、一分でも遅れると全部が押しますので」",
    },
    {
      text: "公邸を出る。まだ涼しい。官邸の玄関までの短い距離に、警護がついた。\n\n昨日までは、この道を自分の足で歩く人間ではなかった。",
    },
    {
      speaker: SAWATARI.shortName,
      text: "「今日から、ここが職場です」",
    },
  ],
  "chief-meeting": [
    {
      speaker: "官房長官",
      text: "「お時間をいただきます。朝の件です」",
      unlessFlag: "ignored-the-call",
    },
    {
      speaker: "官房長官",
      text: "「朝、お電話を差し上げた件です。お出になれなかったので、ここで最初から申し上げます」",
      requiresFlag: "ignored-the-call",
    },
    {
      speaker: "官房長官",
      text: "「国土交通大臣の収支報告書の記載漏れ、訂正の手続きは事務所が今日中に取ります。額は小さく、意図的なものではないという説明で通ると思います」",
    },
    {
      speaker: "官房長官",
      text: "「問題は聞かれ方です。『任命責任をどう考えるか』と来ます。ここで長く答えると、それが見出しになります」",
    },
    {
      text: "短く答える、と決めた。事実関係は事務所が説明する、政府としては説明責任を果たすよう求める。それ以上は言わない。\n\n決めてしまえば、あとは言うだけだった。",
    },
    {
      speaker: SHINOZUKA.shortName,
      text: "「想定問答、車内でお渡しします。一枚に収めました」",
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
  { time: "07:30", label: "官邸入り" },
  { time: "07:45", label: "官房長官との打ち合わせ" },
  { time: "08:00", label: "公務開始" },
  { time: "10:00", label: "幹部打ち合わせ" },
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
