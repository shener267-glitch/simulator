import { describe, it, expect } from "vitest";
import { gameReducer, createGameReducer } from "../../src/state/gameReducer";
import { createNewGame } from "../../src/state/initialState";
import { policyAreas, eventDefs } from "../../src/data/registry";
import type { GameState } from "../../src/types/game";

describe("gameReducer", () => {
  it("NEW_GAME returns a fresh playing state at day 0", () => {
    const state = gameReducer(createNewGame(), { type: "NEW_GAME" });
    expect(state.status).toBe("playing");
    expect(state.date.dayIndex).toBe(0);
  });

  it("ADVANCE_DAY moves the calendar forward by one day", () => {
    const state = createNewGame();
    const next = gameReducer(state, { type: "ADVANCE_DAY" });
    expect(next.date.dayIndex).toBe(1);
  });

  it("ADVANCE_DAY is a no-op while an event is blocking", () => {
    const state = { ...createNewGame(), activeEvent: { eventId: "x", dayIndex: 0 } };
    const next = gameReducer(state, { type: "ADVANCE_DAY" });
    expect(next).toBe(state);
  });

  it("SELECT_POLICY applies the option's effect and advances one day", () => {
    const state = createNewGame();
    const area = policyAreas[0];
    const option = area.options[0];
    const next = gameReducer(state, { type: "SELECT_POLICY", areaId: area.id, optionId: option.id });

    expect(next.date.dayIndex).toBe(1);
    const expectedDelta = option.effect.deltas.find((d) => d.stat === "approvalRating")?.delta ?? 0;
    // passive drift may nudge approval slightly toward 50 after the choice, so
    // just assert the choice's own direction was applied rather than an exact value.
    if (expectedDelta !== 0) {
      const diff = next.stats.approvalRating - state.stats.approvalRating;
      expect(Math.sign(diff)).toBe(Math.sign(expectedDelta));
    }
  });

  it("SELECT_POLICY is a no-op once the area is on cooldown", () => {
    const state = createNewGame();
    const area = policyAreas[0];
    const once = gameReducer(state, { type: "SELECT_POLICY", areaId: area.id, optionId: area.options[0].id });
    const twice = gameReducer(once, {
      type: "SELECT_POLICY",
      areaId: area.id,
      optionId: area.options[1].id,
    });
    expect(twice.date.dayIndex).toBe(once.date.dayIndex);
  });

  it("RESOLVE_EVENT_CHOICE applies a flat-choice event and clears activeEvent", () => {
    const state = {
      ...createNewGame(),
      activeEvent: { eventId: "cabinet_budget", dayIndex: 7 },
    };
    const next = gameReducer(state, { type: "RESOLVE_EVENT_CHOICE", choiceId: "prioritize_growth" });
    expect(next.activeEvent).toBeNull();
    expect(next.stats.gdpGrowth).toBeGreaterThan(state.stats.gdpGrowth);
  });

  it("RESOLVE_EVENT_CHOICE advances through a dialogue tree without clearing activeEvent until the leaf", () => {
    const state = {
      ...createNewGame(),
      activeEvent: { eventId: "diet_questioning_economy", dayIndex: 42, currentDialogueNodeId: "q1" },
    };
    const afterFirst = gameReducer(state, { type: "RESOLVE_EVENT_CHOICE", choiceId: "defend_policy" });
    expect(afterFirst.activeEvent).not.toBeNull();
    expect(afterFirst.activeEvent?.currentDialogueNodeId).toBe("q2");

    const afterSecond = gameReducer(afterFirst, {
      type: "RESOLVE_EVENT_CHOICE",
      choiceId: "pledge_reform",
    });
    expect(afterSecond.activeEvent).toBeNull();
  });

  it("RESIGN sets game-over status immediately", () => {
    const state = createNewGame();
    const next = gameReducer(state, { type: "RESIGN" });
    expect(next.status).toBe("gameover_resignation");
  });

  it("RESHUFFLE_CABINET boosts faction loyalty and resets pressure", () => {
    const base = createNewGame();
    const factionId = Object.keys(base.factions)[0];
    const state = {
      ...base,
      factions: {
        ...base.factions,
        [factionId]: { ...base.factions[factionId], loyalty: 35, reshufflePressure: 40 },
      },
    };
    const next = gameReducer(state, { type: "RESHUFFLE_CABINET" });
    // Loyalty is raised enough (35 -> 45) to clear the <40 threshold that
    // would otherwise let the following day's passive drift re-add pressure.
    expect(next.factions[factionId].loyalty).toBeGreaterThan(35);
    expect(next.factions[factionId].reshufflePressure).toBe(0);
  });

  it("plays out a scripted multi-day sequence: advance, hit cabinet event, resolve, advance again", () => {
    // rng pinned to 1 so weightedPick always resolves to the *last* eligible
    // random candidate for days 1-7, which happens to be a non-blocking
    // flavor event (see privateLifeEvents.ts ordering) — this keeps the
    // fixed cabinet_budget trigger on day 7 as the first blocking event.
    const deterministicReducer = createGameReducer(() => 1);
    let state: GameState = createNewGame();
    for (let i = 0; i < 7; i++) {
      state = deterministicReducer(state, { type: "ADVANCE_DAY" });
    }
    expect(state.date.dayIndex).toBe(7);
    expect(state.activeEvent).not.toBeNull();

    const def = state.activeEvent!.eventId;
    expect(def).toBe("cabinet_budget");

    state = deterministicReducer(state, { type: "RESOLVE_EVENT_CHOICE", choiceId: "balanced_budget" });
    expect(state.activeEvent).toBeNull();

    state = deterministicReducer(state, { type: "ADVANCE_DAY" });
    expect(state.date.dayIndex).toBe(8);
  });

  it("a bounded fast-forward simulation eventually reaches a non-playing status without crashing", () => {
    // Simple deterministic PRNG (mulberry32) so this smoke test is reproducible.
    let seed = 42;
    const rng = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const reducer = createGameReducer(rng);

    let state: GameState = createNewGame();
    let iterations = 0;
    const MAX_ITERATIONS = 500;
    while (state.status === "playing" && iterations < MAX_ITERATIONS) {
      state = state.activeEvent
        ? resolveFirstChoice(state, reducer)
        : reducer(state, { type: "FAST_FORWARD" });
      iterations += 1;
    }
    expect(state.date.dayIndex).toBeGreaterThan(0);
    expect(iterations).toBeLessThan(MAX_ITERATIONS);
  });
});

function resolveFirstChoice(state: GameState, reducer: typeof gameReducer): GameState {
  const active = state.activeEvent;
  if (!active) return state;
  const def = eventDefs[active.eventId];
  const choiceId = def.dialogue
    ? def.dialogue.nodes[active.currentDialogueNodeId ?? def.dialogue.rootNodeId].choices[0].id
    : def.choices![0].id;
  return reducer(state, { type: "RESOLVE_EVENT_CHOICE", choiceId });
}
