import { describe, it, expect } from "vitest";
import { applyEffects } from "../../src/engine/effects";
import { makeState } from "../testUtils";

describe("applyEffects", () => {
  it("applies stat deltas", () => {
    const state = makeState();
    const next = applyEffects(state, { deltas: [{ stat: "approvalRating", delta: 5 }] });
    expect(next.stats.approvalRating).toBe(state.stats.approvalRating + 5);
  });

  it("clamps percentage stats to [0, 100]", () => {
    const state = makeState({ stats: { ...makeState().stats, approvalRating: 98 } });
    const next = applyEffects(state, { deltas: [{ stat: "approvalRating", delta: 10 }] });
    expect(next.stats.approvalRating).toBe(100);

    const low = makeState({ stats: { ...makeState().stats, health: 3 } });
    const nextLow = applyEffects(low, { deltas: [{ stat: "health", delta: -20 }] });
    expect(nextLow.stats.health).toBe(0);
  });

  it("does not clamp unbounded stats like treasuryBalance or gdpGrowth", () => {
    const state = makeState();
    const next = applyEffects(state, { deltas: [{ stat: "treasuryBalance", delta: -500 }] });
    expect(next.stats.treasuryBalance).toBe(state.stats.treasuryBalance - 500);
  });

  it("applies faction relation deltas and clamps them", () => {
    const state = makeState();
    const factionId = Object.keys(state.factions)[0];
    const next = applyEffects(state, {
      deltas: [],
      relationDeltas: [{ kind: "faction", id: factionId, delta: 1000 }],
    });
    expect(next.factions[factionId].loyalty).toBe(100);
  });

  it("applies country relation deltas", () => {
    const state = makeState();
    const countryId = Object.keys(state.countryRelations)[0];
    const next = applyEffects(state, {
      deltas: [],
      relationDeltas: [{ kind: "country", id: countryId, delta: -1000 }],
    });
    expect(next.countryRelations[countryId].relationScore).toBe(0);
  });

  it("applies family relationship deltas", () => {
    const state = makeState();
    const memberId = state.family[0].id;
    const next = applyEffects(state, {
      deltas: [],
      relationDeltas: [{ kind: "family", id: memberId, delta: 5 }],
    });
    const member = next.family.find((m) => m.id === memberId)!;
    expect(member.relationship).toBe(state.family[0].relationship + 5);
  });

  it("sets flags", () => {
    const state = makeState();
    const next = applyEffects(state, { deltas: [], flagsSet: ["metPresidentUS"] });
    expect(next.flags.metPresidentUS).toBe(true);
  });

  it("appends a history entry when a description is present", () => {
    const state = makeState();
    const next = applyEffects(state, { deltas: [], description: "テストニュース" });
    expect(next.history[next.history.length - 1]).toMatchObject({
      text: "テストニュース",
      kind: "news",
      dayIndex: state.date.dayIndex,
    });
  });

  it("does not append history when no description is given", () => {
    const state = makeState();
    const next = applyEffects(state, { deltas: [{ stat: "stress", delta: 1 }] });
    expect(next.history.length).toBe(state.history.length);
  });

  it("never lets dietSeats go negative", () => {
    const state = makeState();
    const next = applyEffects(state, { deltas: [{ stat: "dietSeats", delta: -100000 }] });
    expect(next.stats.dietSeats).toBe(0);
  });
});
