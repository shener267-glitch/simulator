import type { DateCursor } from "../types/game";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

export const TERM_START_YEAR = 2026;
export const TERM_START_MONTH = 1;
export const TERM_START_DAY = 1;

export function createStartDate(): DateCursor {
  return {
    year: TERM_START_YEAR,
    month: TERM_START_MONTH,
    day: TERM_START_DAY,
    dayIndex: 0,
  };
}

export function advanceDate(date: DateCursor): DateCursor {
  let { year, month, day } = date;
  day += 1;
  if (day > daysInMonth(year, month)) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { year, month, day, dayIndex: date.dayIndex + 1 };
}

export function formatDate(date: DateCursor): string {
  return `${date.year}年${date.month}月${date.day}日`;
}
