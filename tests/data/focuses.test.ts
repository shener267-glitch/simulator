import { describe, expect, it } from "vitest";
import { AUTO_COMPLETED_FOCUS_IDS, JAPAN_FOCUSES, findFocus } from "../../src/data/focuses";

describe("the Japan focus tree", () => {
  it("gives every focus a unique id", () => {
    const ids = JAPAN_FOCUSES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never points a prerequisite at a focus that doesn't exist", () => {
    for (const focus of JAPAN_FOCUSES) {
      for (const id of focus.prerequisites) {
        expect(findFocus(id), `${focus.id} → ${id} が存在しない`).toBeDefined();
      }
    }
  });

  it("never points unlock_focus at a focus that doesn't exist", () => {
    for (const focus of JAPAN_FOCUSES) {
      for (const effect of focus.effects) {
        if (effect.type === "unlock_focus") {
          expect(findFocus(effect.focusId), `${focus.id} → unlock ${effect.focusId} が存在しない`).toBeDefined();
        }
      }
    }
  });

  it("marks the root focus as already completed at game start", () => {
    expect(AUTO_COMPLETED_FOCUS_IDS).toContain("seiken-hossoku");
    expect(findFocus("seiken-hossoku")?.prerequisites).toEqual([]);
  });

  it("keeps every non-root focus reachable from the root", () => {
    const reachable = new Set(AUTO_COMPLETED_FOCUS_IDS);
    let grew = true;
    while (grew) {
      grew = false;
      for (const focus of JAPAN_FOCUSES) {
        if (reachable.has(focus.id)) continue;
        if (focus.prerequisites.every((id) => reachable.has(id))) {
          reachable.add(focus.id);
          grew = true;
        }
      }
    }
    for (const focus of JAPAN_FOCUSES) {
      expect(reachable.has(focus.id), `${focus.id} は根から辿り着けない`).toBe(true);
    }
  });

  it("gates the unlock-only focus behind requiresUnlock", () => {
    expect(findFocus("chiiki-anpo")?.requiresUnlock).toBe(true);
  });
});
