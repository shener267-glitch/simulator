import { MORNING_LENGTH, MORNING_START_HOUR, type Minutes } from "../types/clock";

/** Offset from 05:00 to a wall-clock label, e.g. 80 -> "06:20". */
export function formatClock(offset: Minutes): string {
  const total = MORNING_START_HOUR * 60 + offset;
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

export function isMorningOver(clock: Minutes): boolean {
  return clock >= MORNING_LENGTH;
}

export function remainingMinutes(clock: Minutes): Minutes {
  return Math.max(0, MORNING_LENGTH - clock);
}
