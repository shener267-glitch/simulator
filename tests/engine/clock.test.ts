import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, isMorningOver, remainingMinutes } from "../../src/engine/clock";
import { MORNING_LENGTH } from "../../src/types/clock";

describe("clock", () => {
  it("renders offsets from 05:00 as wall-clock labels", () => {
    expect(formatClock(0)).toBe("05:00");
    expect(formatClock(70)).toBe("06:10");
    expect(formatClock(90)).toBe("06:30");
    expect(formatClock(120)).toBe("07:00");
    expect(formatClock(MORNING_LENGTH)).toBe("08:00");
  });

  it("formats durations in Japanese", () => {
    expect(formatDuration(10)).toBe("10分");
    expect(formatDuration(60)).toBe("1時間");
    expect(formatDuration(95)).toBe("1時間35分");
  });

  it("ends the morning at 08:00, not before", () => {
    expect(isMorningOver(179)).toBe(false);
    expect(isMorningOver(180)).toBe(true);
  });

  it("reports the minutes left in the phase", () => {
    expect(remainingMinutes(0)).toBe(180);
    expect(remainingMinutes(150)).toBe(30);
    expect(remainingMinutes(200)).toBe(0);
  });
});
