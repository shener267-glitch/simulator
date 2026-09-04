import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, isDayOver } from "../../src/engine/clock";
import { DAY_LENGTH } from "../../src/types/clock";

describe("the clock", () => {
  it("reads offsets from 06:00 as wall-clock times", () => {
    expect(formatClock(0)).toBe("06:00");
    expect(formatClock(70)).toBe("07:10");
    expect(formatClock(115)).toBe("07:55");
    expect(formatClock(360)).toBe("12:00");
    expect(formatClock(840)).toBe("20:00");
  });

  it("calls the end of the day 24:00 rather than starting over at zero", () => {
    expect(formatClock(DAY_LENGTH)).toBe("24:00");
  });

  it("wraps anything outside the day instead of printing 25:00", () => {
    // 丸めがないと、範囲外はエラーも出さずに "25:00" や "-1:-10" になる。
    expect(formatClock(DAY_LENGTH + 60)).toBe("01:00");
    expect(formatClock(-60)).toBe("05:00");
    expect(formatClock(-360)).toBe("00:00");
  });

  it("says how long something took", () => {
    expect(formatDuration(10)).toBe("10分");
    expect(formatDuration(60)).toBe("1時間");
    expect(formatDuration(95)).toBe("1時間35分");
  });

  it("ends the day at 24:00 and not a minute before", () => {
    expect(isDayOver(DAY_LENGTH - 1)).toBe(false);
    expect(isDayOver(DAY_LENGTH)).toBe(true);
  });
});
