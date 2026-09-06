import { describe, expect, it } from "vitest";
import {
  applyFocusEffects,
  isFocusAvailable,
  isFocusDone,
  minutesToDays,
} from "../../src/engine/focus";
import { findFocus } from "../../src/data/focuses";
import { PARTIES } from "../../src/data/parties";
import type { PoliticalStats } from "../../src/types/politics";

const BASE_STATS: PoliticalStats = { politicalPower: 50, politicalPowerPerDay: 2, governmentSupport: 60, stability: 70 };

describe("focus availability", () => {
  it("is unavailable until its prerequisites are completed", () => {
    const focus = findFocus("keizai-saisei")!;
    expect(isFocusAvailable(focus, [], [])).toBe(false);
    expect(isFocusAvailable(focus, ["kokunai-seisaku"], [])).toBe(true);
  });

  it("is unavailable once already completed", () => {
    const focus = findFocus("kokunai-seisaku")!;
    expect(isFocusAvailable(focus, ["seiken-hossoku", "kokunai-seisaku"], [])).toBe(false);
  });

  it("stays locked behind requiresUnlock even with prerequisites met", () => {
    const focus = findFocus("chiiki-anpo")!;
    expect(isFocusAvailable(focus, ["ajia-gaikou"], [])).toBe(false);
    expect(isFocusAvailable(focus, ["ajia-gaikou"], ["chiiki-anpo"])).toBe(true);
  });
});

describe("day conversion", () => {
  it("converts 1440 minutes to exactly one day", () => {
    expect(minutesToDays(1440)).toBe(1);
  });

  it("marks a focus done once enough days have elapsed", () => {
    const focus = findFocus("kokunai-seisaku")!; // 20日
    expect(isFocusDone({ focusId: focus.id, daysElapsed: 19.9 }, focus)).toBe(false);
    expect(isFocusDone({ focusId: focus.id, daysElapsed: 20 }, focus)).toBe(true);
  });
});

describe("applying focus effects", () => {
  it("adds political power and clamps stability/support to 0-100", () => {
    const result = applyFocusEffects(
      [
        { type: "add_political_power", amount: 50 },
        { type: "modify_stability", amount: 50 },
        { type: "modify_government_support", amount: -80 },
      ],
      BASE_STATS,
      PARTIES,
      [],
      [],
    );
    expect(result.stats.politicalPower).toBe(100);
    expect(result.stats.stability).toBe(100);
    expect(result.stats.governmentSupport).toBe(0);
  });

  it("modifies a single party's popularity without touching the others", () => {
    const result = applyFocusEffects(
      [{ type: "modify_party_popularity", partyId: "ldp", amount: 5 }],
      BASE_STATS,
      PARTIES,
      [],
      [],
    );
    const ldp = result.parties.find((p) => p.id === "ldp")!;
    const cdp = result.parties.find((p) => p.id === "cdp")!;
    expect(ldp.popularity).toBe(PARTIES.find((p) => p.id === "ldp")!.popularity + 5);
    expect(cdp).toEqual(PARTIES.find((p) => p.id === "cdp"));
  });

  it("appends a national modifier and reports triggered events, without duplicating unlocks", () => {
    const result = applyFocusEffects(
      [
        { type: "add_national_modifier", id: "m1", label: "test" },
        { type: "trigger_event", eventId: "fiscal-reform-debate" },
        { type: "unlock_focus", focusId: "chiiki-anpo" },
        { type: "unlock_focus", focusId: "chiiki-anpo" },
      ],
      BASE_STATS,
      PARTIES,
      [],
      [],
    );
    expect(result.modifiers).toEqual([{ id: "m1", label: "test" }]);
    expect(result.triggeredEventIds).toEqual(["fiscal-reform-debate"]);
    expect(result.unlockedFocusIds).toEqual(["chiiki-anpo"]);
  });
});
