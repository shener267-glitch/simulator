import { describe, expect, it } from "vitest";
import {
  freeMinutes,
  interruptionGuard,
  nextInterruption,
  segmentFits,
  visibleFreeMinutes,
} from "../../src/engine/actions";
import { gameReducer } from "../../src/state/gameReducer";
import { awake, playThrough } from "../testUtils";

describe("interruption guard", () => {
  it("points at the next appointment, and at nothing softer", () => {
    // 06:10の着信はセグメントを切らないので、ここには現れない（設計書26章）。
    const state = awake();
    expect(nextInterruption(state)).toBe(120);
    expect(interruptionGuard(state)).toBe(120);
    expect(freeMinutes(state)).toBe(120);
  });

  it("falls back to 08:00 once nothing is left on the schedule", () => {
    const settled = {
      ...awake(),
      clock: 150,
      appointments: awake().appointments.map((appointment) => ({ ...appointment, resolved: true })),
      interrupts: awake().interrupts.map((item) => ({ ...item, fired: true })),
    };

    expect(nextInterruption(settled)).toBeNull();
    expect(interruptionGuard(settled)).toBe(180);
    expect(freeMinutes(settled)).toBe(30);
  });

  it("agrees with the countdown, because nothing in this morning cuts in unannounced", () => {
    const state = awake();
    expect(freeMinutes(state)).toBe(visibleFreeMinutes(state));
  });

  it("hides an appointment that was never put on the schedule", () => {
    // 予定表に載っていないものは、時計としては効くが表示には出さない。
    // 「知らないうちに時間がなくなっていた」を作れる余地を残しておく。
    const base = awake();
    const state = {
      ...base,
      appointments: [
        ...base.appointments,
        { id: "unlisted", label: "", at: 40, minutes: 10, resolved: false, announced: false },
      ],
    };

    expect(freeMinutes(state)).toBe(40);
    expect(visibleFreeMinutes(state)).toBe(120);
  });

  it("counts down to the briefing once the call has moved it", () => {
    let state = playThrough(awake(), "documents"); // 30分 → 05:30
    state = playThrough(state, "ready"); // 20分 → 05:50
    state = playThrough(state, "idle"); // 15分 → 06:05
    state = gameReducer(state, { type: "START_ACTION", actionId: "news" }); // 06:20、着信
    state = gameReducer(state, { type: "ANSWER_INTERRUPT", choice: "defer" });

    expect(state.clock).toBe(80);
    expect(visibleFreeMinutes(state)).toBe(10);
  });

  it("lets a segment land exactly on the appointment but not past it", () => {
    const state = { ...awake(), clock: 110 };
    expect(segmentFits(state, { minutes: 10, text: "" })).toBe(true);
    expect(segmentFits(state, { minutes: 15, text: "" })).toBe(false);
  });
});
