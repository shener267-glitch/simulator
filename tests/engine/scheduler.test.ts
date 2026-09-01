import { describe, it, expect } from "vitest";
import { selectEventForDay } from "../../src/engine/scheduler";
import { makeState } from "../testUtils";
import type { EventTrigger } from "../../src/types/events";

function atDay(dayIndex: number) {
  const state = makeState();
  return { ...state, date: { ...state.date, dayIndex } };
}

describe("selectEventForDay", () => {
  it("fires a fixed trigger exactly on its cadence", () => {
    const triggers: EventTrigger[] = [{ type: "fixed", eventId: "weekly", everyNDays: 7, offset: 0 }];
    expect(selectEventForDay(atDay(0), { triggers })).toBe("weekly");
    expect(selectEventForDay(atDay(7), { triggers })).toBe("weekly");
    expect(selectEventForDay(atDay(3), { triggers })).toBeNull();
  });

  it("respects minDayIndex on fixed triggers", () => {
    const triggers: EventTrigger[] = [
      { type: "fixed", eventId: "weekly", everyNDays: 7, offset: 0, minDayIndex: 14 },
    ];
    expect(selectEventForDay(atDay(0), { triggers })).toBeNull();
    expect(selectEventForDay(atDay(14), { triggers })).toBe("weekly");
  });

  it("fires a conditional trigger only when the predicate is true", () => {
    const triggers: EventTrigger[] = [
      { type: "conditional", eventId: "crisis", check: (s) => s.stats.approvalRating < 30 },
    ];
    expect(selectEventForDay(atDay(5), { triggers })).toBeNull();
    const lowApproval = { ...atDay(5), stats: { ...atDay(5).stats, approvalRating: 10 } };
    expect(selectEventForDay(lowApproval, { triggers })).toBe("crisis");
  });

  it("respects cooldown on conditional triggers", () => {
    const state = { ...atDay(5), eventCooldowns: { crisis: 20 } };
    const triggers: EventTrigger[] = [
      { type: "conditional", eventId: "crisis", check: () => true, cooldownDays: 10 },
    ];
    expect(selectEventForDay(state, { triggers })).toBeNull();
    expect(selectEventForDay({ ...state, date: { ...state.date, dayIndex: 20 } }, { triggers })).toBe(
      "crisis",
    );
  });

  it("prioritizes fixed over conditional over random", () => {
    const triggers: EventTrigger[] = [
      { type: "random", eventId: "flavor", weight: 100 },
      { type: "conditional", eventId: "crisis", check: () => true },
      { type: "fixed", eventId: "cabinet", everyNDays: 1, offset: 0 },
    ];
    expect(selectEventForDay(atDay(3), { triggers })).toBe("cabinet");
  });

  it("picks a random trigger deterministically via injected rng", () => {
    const triggers: EventTrigger[] = [
      { type: "random", eventId: "a", weight: 1 },
      { type: "random", eventId: "b", weight: 1 },
    ];
    expect(selectEventForDay(atDay(1), { triggers, rng: () => 0 })).toBe("a");
    expect(selectEventForDay(atDay(1), { triggers, rng: () => 0.99 })).toBe("b");
  });

  it("supports weight as a function of state", () => {
    const triggers: EventTrigger[] = [
      { type: "random", eventId: "scandal", weight: (s) => s.stats.scandalRisk },
    ];
    const highRisk = { ...atDay(1), stats: { ...atDay(1).stats, scandalRisk: 50 } };
    expect(selectEventForDay(highRisk, { triggers, rng: () => 0 })).toBe("scandal");
  });

  it("returns null when nothing is due", () => {
    expect(selectEventForDay(atDay(1), { triggers: [] })).toBeNull();
  });
});
