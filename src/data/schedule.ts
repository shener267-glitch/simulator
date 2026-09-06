import type { Appointment } from "../types/game";

/**
 * 2024年10月1日の政治日程（設計書31章「事実」からの積み上げ）。
 *
 * 【事実】この日、国会で首班指名選挙が行われ、石破茂が第102代内閣総理大臣に
 * 指名された。皇居での親任式のあと、閣僚が固まり、その夜に認証式・組閣、
 * 第一回閣議、そして総理就任後はじめての記者会見が行われた。官房長官は
 * 林芳正（留任）。
 *
 * 【推測】各儀式・会議の開始時刻そのもの（10:00、11:30 など分刻みの値）は
 * 公表された正確なタイムテーブルではなく、実際の順序と規模感に沿わせた
 * ゲーム上の割り付け。中身の会話は次のファイル（data/meetings）側で
 * ゲーム上の設定として書く。
 */
export const APPOINTMENTS: Appointment[] = [
  {
    id: "diet-designation-vote",
    label: "国会本会議 — 首班指名選挙",
    at: 600, // 10:00
    minutes: 60,
    resolved: false,
  },
  {
    id: "imperial-attestation-pm",
    label: "皇居 — 総理親任式",
    at: 690, // 11:30
    minutes: 30,
    resolved: false,
  },
  {
    id: "cabinet-lineup-finalization",
    label: "官邸 — 組閣人事の最終調整",
    at: 780, // 13:00
    minutes: 40,
    resolved: false,
  },
  {
    id: "imperial-attestation-ministers",
    label: "皇居 — 閣僚認証式",
    at: 1140, // 19:00
    minutes: 30,
    resolved: false,
  },
  {
    id: "first-cabinet-meeting",
    label: "官邸 — 第一回閣議",
    at: 1200, // 20:00
    minutes: 40,
    resolved: false,
  },
  {
    id: "first-press-conference",
    label: "官邸 — 就任記者会見",
    at: 1260, // 21:00
    minutes: 40,
    resolved: false,
    highlight: "総理として、最初の記者会見に臨んだ。",
  },
];
