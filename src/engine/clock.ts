import { GAME_START, MINUTES_IN_DAY, type Minutes, type Speed } from "../types/clock";

/**
 * 起点からの経過分を実際の年月日へ。UTCで固定して計算する — ホストの
 * タイムゾーンに依存すると、同じ経過分でもテスト環境によって日付が
 * ずれる（真夜中前後で丸め方向が変わる）。
 */
const EPOCH_UTC = Date.UTC(GAME_START.year, GAME_START.month - 1, GAME_START.day);

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function toDate(totalMinutes: Minutes): Date {
  return new Date(EPOCH_UTC + totalMinutes * 60_000);
}

/** 「10月1日(火)」。 */
export function formatDate(totalMinutes: Minutes): string {
  const date = toDate(totalMinutes);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = WEEKDAYS[date.getUTCDay()];
  return `${month}月${day}日(${weekday})`;
}

/** 「08:43」。 */
export function formatTime(totalMinutes: Minutes): string {
  const date = toDate(totalMinutes);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDateTime(totalMinutes: Minutes): string {
  return `${formatDate(totalMinutes)} ${formatTime(totalMinutes)}`;
}

export function formatDuration(minutes: Minutes): string {
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`;
}

/** その日の00:00からの経過分だけを取り出す。予定の判定はこれで行う。 */
export function minutesIntoDay(totalMinutes: Minutes): Minutes {
  return ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
}

/**
 * 倍速の意味（本セッションでの決定）。1倍で現実の1秒がゲーム内1分に
 * 相当する — 一日(1440分)が現実の24分で終わる速さ。10倍なら2分24秒。
 * ブラウザで実際に遊び切れる速さとして選んだ、ゲーム上の設定であって
 * 現実の時間の流れ方の主張ではない。
 */
export const REAL_MS_PER_TICK = 1000;

export function minutesPerTick(speed: Speed): Minutes {
  return speed;
}
