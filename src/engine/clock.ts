import { DAY_LENGTH, DAY_START_HOUR, MINUTES_IN_DAY, type Minutes } from "../types/clock";

/**
 * Offset from 06:00 to a wall-clock label, e.g. 80 -> "07:20".
 *
 * 24:00 はその日の終わりとしてそのまま出す（日本語の慣習どおり）。それ以外の
 * 範囲外は一日で丸める — 丸めないと 25:00 や -1:-10 を、例外も出さずに
 * 表示してしまう。
 */
export function formatClock(offset: Minutes): string {
  const raw = DAY_START_HOUR * 60 + offset;
  const total =
    raw >= 0 && raw <= MINUTES_IN_DAY ? raw : ((raw % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;

  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatDuration(minutes: Minutes): string {
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`;
}

export function isDayOver(clock: Minutes): boolean {
  return clock >= DAY_LENGTH;
}
