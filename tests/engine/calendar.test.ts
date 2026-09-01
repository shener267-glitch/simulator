import { describe, it, expect } from "vitest";
import { advanceDate, createStartDate, formatDate } from "../../src/engine/calendar";

describe("calendar", () => {
  it("creates a start date at dayIndex 0", () => {
    const start = createStartDate();
    expect(start.dayIndex).toBe(0);
  });

  it("advances a single day normally", () => {
    const start = createStartDate();
    const next = advanceDate(start);
    expect(next.day).toBe(start.day + 1);
    expect(next.month).toBe(start.month);
    expect(next.dayIndex).toBe(1);
  });

  it("rolls over to the next month at month end", () => {
    const jan31 = { year: 2026, month: 1, day: 31, dayIndex: 30 };
    const next = advanceDate(jan31);
    expect(next).toEqual({ year: 2026, month: 2, day: 1, dayIndex: 31 });
  });

  it("rolls over to the next year at year end", () => {
    const dec31 = { year: 2026, month: 12, day: 31, dayIndex: 364 };
    const next = advanceDate(dec31);
    expect(next).toEqual({ year: 2027, month: 1, day: 1, dayIndex: 365 });
  });

  it("handles February in a leap year", () => {
    const feb28_2028 = { year: 2028, month: 2, day: 28, dayIndex: 0 };
    const next = advanceDate(feb28_2028);
    expect(next.month).toBe(2);
    expect(next.day).toBe(29);
  });

  it("handles February in a non-leap year", () => {
    const feb28_2026 = { year: 2026, month: 2, day: 28, dayIndex: 0 };
    const next = advanceDate(feb28_2026);
    expect(next.month).toBe(3);
    expect(next.day).toBe(1);
  });

  it("formats a date in Japanese style", () => {
    expect(formatDate({ year: 2026, month: 4, day: 5, dayIndex: 94 })).toBe("2026年4月5日");
  });
});
