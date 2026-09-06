import type { GameTime, Speed } from "../types/gameTime";

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

/**
 * ちょうど一分だけ進める。年・月・日・時・分の繰り上がりをここだけで扱う
 * ——時計をUTC epochなどの別表現に頼らず、この構造体自身で完結させる
 * （指示書11章の「独立したシステム」という要求に沿わせてある）。
 */
export function advanceOneMinute(time: GameTime): GameTime {
  let { year, month, day, hour, minute } = time;
  minute += 1;
  if (minute >= 60) {
    minute = 0;
    hour += 1;
  }
  if (hour >= 24) {
    hour = 0;
    day += 1;
  }
  if (day > daysInMonth(year, month)) {
    day = 1;
    month += 1;
  }
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return { ...time, year, month, day, hour, minute };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** 「2024年10月1日」。 */
export function formatDate(time: GameTime): string {
  return `${time.year}年${time.month}月${time.day}日`;
}

/** 「08:00」。 */
export function formatTime(time: GameTime): string {
  return `${pad2(time.hour)}:${pad2(time.minute)}`;
}

export function formatDateTime(time: GameTime): string {
  return `${formatDate(time)} ${formatTime(time)}`;
}

/**
 * 速度の意味（前バージョンからの決定を踏襲）。1倍で現実の1秒がゲーム内
 * 1分に相当する——ブラウザで実際に遊び切れる速さとして選んだゲーム上の
 * 設定であって、現実の時間の流れ方の主張ではない。
 */
export const REAL_MS_PER_TICK = 1000;

export function minutesPerTick(speed: Speed): number {
  return speed;
}
