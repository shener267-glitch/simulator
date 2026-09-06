import { describe, expect, it } from "vitest";
import { advanceOneMinute, formatDate, formatDateTime, formatTime, minutesPerTick } from "../../src/engine/gameTime";
import type { GameTime } from "../../src/types/gameTime";

function at(overrides: Partial<GameTime>): GameTime {
  return { year: 2024, month: 10, day: 1, hour: 8, minute: 0, speed: 1, ...overrides };
}

describe("game time", () => {
  it("formats the date and time", () => {
    expect(formatDate(at({}))).toBe("2024年10月1日");
    expect(formatTime(at({}))).toBe("08:00");
    expect(formatDateTime(at({}))).toBe("2024年10月1日 08:00");
  });

  it("rolls the minute over into the hour", () => {
    expect(advanceOneMinute(at({ minute: 59 }))).toMatchObject({ hour: 9, minute: 0 });
  });

  it("rolls the hour over into the next day", () => {
    expect(advanceOneMinute(at({ hour: 23, minute: 59 }))).toMatchObject({ day: 2, hour: 0, minute: 0 });
  });

  it("rolls a short month over into the next month", () => {
    expect(advanceOneMinute(at({ month: 9, day: 30, hour: 23, minute: 59 }))).toMatchObject({
      month: 10,
      day: 1,
    });
  });

  it("rolls December over into the next year", () => {
    expect(advanceOneMinute(at({ month: 12, day: 31, hour: 23, minute: 59 }))).toMatchObject({
      year: 2025,
      month: 1,
      day: 1,
    });
  });

  it("knows February has 29 days in a leap year and 28 otherwise", () => {
    expect(advanceOneMinute(at({ year: 2024, month: 2, day: 28, hour: 23, minute: 59 }))).toMatchObject({
      month: 2,
      day: 29,
    });
    expect(advanceOneMinute(at({ year: 2023, month: 2, day: 28, hour: 23, minute: 59 }))).toMatchObject({
      month: 3,
      day: 1,
    });
  });

  it("keeps the speed field untouched across a rollover", () => {
    expect(advanceOneMinute(at({ hour: 23, minute: 59, speed: 4 })).speed).toBe(4);
  });

  it("advances one game-minute per speed unit on each tick", () => {
    expect(minutesPerTick(1)).toBe(1);
    expect(minutesPerTick(8)).toBe(8);
    expect(minutesPerTick(0)).toBe(0);
  });
});
