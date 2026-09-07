import { describe, expect, it } from "vitest";
import { AUTO_COMPLETED_TECH_IDS, TECHNOLOGIES, findTech } from "../../src/data/technologies";

describe("the technology tree", () => {
  it("gives every tech a unique id", () => {
    const ids = TECHNOLOGIES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all six categories (指示書14章の五つ+Phase 5の軍事研究)", () => {
    const categories = new Set(TECHNOLOGIES.map((t) => t.category));
    expect(categories).toEqual(new Set(["basic_science", "computing_ai", "energy", "industry", "aerospace", "military"]));
  });

  it("never points a prerequisite at a tech that doesn't exist", () => {
    for (const tech of TECHNOLOGIES) {
      for (const id of tech.prerequisites) {
        expect(findTech(id), `${tech.id} → ${id} が存在しない`).toBeDefined();
      }
    }
  });

  it("never points unlock_tech at a tech that doesn't exist", () => {
    for (const tech of TECHNOLOGIES) {
      for (const effect of tech.effects) {
        if (effect.type === "unlock_tech") {
          expect(findTech(effect.techId), `${tech.id} → unlock ${effect.techId} が存在しない`).toBeDefined();
        }
      }
    }
  });

  it("marks the root as already completed at game start", () => {
    expect(AUTO_COMPLETED_TECH_IDS).toContain("kiso-kagaku");
    expect(findTech("kiso-kagaku")?.prerequisites).toEqual([]);
  });

  it("keeps every non-root tech reachable from the root", () => {
    const reachable = new Set(AUTO_COMPLETED_TECH_IDS);
    let grew = true;
    while (grew) {
      grew = false;
      for (const tech of TECHNOLOGIES) {
        if (reachable.has(tech.id)) continue;
        if (tech.prerequisites.every((id) => reachable.has(id))) {
          reachable.add(tech.id);
          grew = true;
        }
      }
    }
    for (const tech of TECHNOLOGIES) {
      expect(reachable.has(tech.id), `${tech.id} は根から辿り着けない`).toBe(true);
    }
  });

  it("honors the three durations 指示書15章 gives explicitly", () => {
    expect(findTech("computer-kiso")?.durationDays).toBe(180);
    expect(findTech("ai-kiso")?.durationDays).toBe(240);
    expect(findTech("jisedai-handoutai")?.durationDays).toBe(300);
  });

  it("gates the unlock-only tech behind requiresUnlock", () => {
    expect(findTech("quantum-computing")?.requiresUnlock).toBe(true);
  });
});
