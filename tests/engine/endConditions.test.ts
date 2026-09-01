import { describe, it, expect } from "vitest";
import { checkEndConditions } from "../../src/engine/endConditions";
import { makeState } from "../testUtils";

describe("checkEndConditions", () => {
  it("returns null when nothing triggers", () => {
    expect(checkEndConditions(makeState())).toBeNull();
  });

  it("triggers resignation when health collapses", () => {
    const state = makeState({ stats: { ...makeState().stats, health: 0 } });
    expect(checkEndConditions(state)?.status).toBe("gameover_resignation");
  });

  it("does not trigger resignation above zero health", () => {
    const state = makeState({ stats: { ...makeState().stats, health: 1 } });
    expect(checkEndConditions(state)).toBeNull();
  });

  it("triggers scandal collapse when scandalRisk and approval both cross thresholds", () => {
    const base = makeState();
    const state = makeState({
      stats: { ...base.stats, scandalRisk: base.term.scandalCollapseThreshold, approvalRating: 20 },
    });
    expect(checkEndConditions(state)?.status).toBe("gameover_scandal");
  });

  it("does not trigger scandal collapse if approval is still above the safety bar", () => {
    const base = makeState();
    const state = makeState({
      stats: { ...base.stats, scandalRisk: base.term.scandalCollapseThreshold, approvalRating: 50 },
    });
    expect(checkEndConditions(state)).toBeNull();
  });

  it("triggers dissolution when approval and party unity both collapse", () => {
    const base = makeState();
    const state = makeState({
      stats: {
        ...base.stats,
        approvalRating: base.term.dissolutionThresholdApproval,
        partyUnity: 30,
      },
    });
    expect(checkEndConditions(state)?.status).toBe("gameover_dissolution");
  });

  it("does not trigger dissolution if party unity is still healthy", () => {
    const base = makeState();
    const state = makeState({
      stats: { ...base.stats, approvalRating: base.term.dissolutionThresholdApproval, partyUnity: 80 },
    });
    expect(checkEndConditions(state)).toBeNull();
  });

  it("triggers term end once dayIndex reaches termLengthDays", () => {
    const base = makeState();
    const state = makeState({ date: { ...base.date, dayIndex: base.term.termLengthDays } });
    expect(checkEndConditions(state)?.status).toBe("termend");
  });
});
