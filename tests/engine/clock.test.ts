import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatDuration, formatTime, minutesIntoDay, minutesPerTick } from "../../src/engine/clock";
import { DAY_START_MINUTES, MINUTES_IN_DAY } from "../../src/types/clock";

describe("the clock", () => {
  it("reads the start of the game as the morning of 2024-10-01", () => {
    expect(formatDate(0)).toBe("10月1日(火)");
    expect(formatTime(DAY_START_MINUTES)).toBe("07:00");
  });

  it("rolls over into the next calendar day without breaking", () => {
    expect(formatDate(MINUTES_IN_DAY)).toBe("10月2日(水)");
    expect(formatTime(MINUTES_IN_DAY)).toBe("00:00");
  });

  it("combines date and time", () => {
    expect(formatDateTime(DAY_START_MINUTES + 43)).toBe("10月1日(火) 07:43");
  });

  it("says how long something took", () => {
    expect(formatDuration(10)).toBe("10分");
    expect(formatDuration(60)).toBe("1時間");
    expect(formatDuration(95)).toBe("1時間35分");
  });

  it("takes the minute-of-day out of an absolute total", () => {
    expect(minutesIntoDay(DAY_START_MINUTES)).toBe(DAY_START_MINUTES);
    expect(minutesIntoDay(MINUTES_IN_DAY + 30)).toBe(30);
  });

  it("advances one game-minute per speed unit on each tick", () => {
    expect(minutesPerTick(1)).toBe(1);
    expect(minutesPerTick(10)).toBe(10);
  });
});
