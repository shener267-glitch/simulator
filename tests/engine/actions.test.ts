import { describe, expect, it } from "vitest";
import {
  freeMinutes,
  interruptionGuard,
  nextInterruption,
  segmentFits,
  visibleFreeMinutes,
} from "../../src/engine/actions";
import { awake, playThrough } from "../testUtils";

describe("interruption guard", () => {
  it("points at the 06:10 call before the briefing, because it comes first", () => {
    const state = awake();
    expect(nextInterruption(state)).toBe(70);
    expect(interruptionGuard(state)).toBe(70);
    expect(freeMinutes(state)).toBe(70);
  });

  it("falls back to 08:00 once nothing is left on the schedule", () => {
    const settled = {
      ...awake(),
      clock: 150,
      appointments: awake().appointments.map((appointment) => ({ ...appointment, resolved: true })),
      events: awake().events.map((event) => ({ ...event, fired: true })),
    };

    expect(nextInterruption(settled)).toBeNull();
    expect(interruptionGuard(settled)).toBe(180);
    expect(freeMinutes(settled)).toBe(30);
  });

  it("keeps the unannounced call out of the countdown the player is shown", () => {
    const state = awake();
    // 内部の割り込みは06:10の連絡だが、画面には07:00のブリーフィングまでを出す。
    expect(freeMinutes(state)).toBe(70);
    expect(visibleFreeMinutes(state)).toBe(120);
  });

  it("counts down to the briefing once the call has moved it", () => {
    const afterCall = playThrough(playThrough(awake(), "news"), "sns");
    expect(afterCall.clock).toBe(70);
    expect(visibleFreeMinutes(afterCall)).toBe(20);
  });

  it("lets a segment land exactly on the interruption but not past it", () => {
    const state = { ...awake(), clock: 60 };
    expect(segmentFits(state, { minutes: 10, text: "" })).toBe(true);
    expect(segmentFits(state, { minutes: 15, text: "" })).toBe(false);
  });
});
