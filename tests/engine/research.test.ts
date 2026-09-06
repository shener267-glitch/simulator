import { describe, expect, it } from "vitest";
import {
  advanceResearch,
  applyTechEffects,
  isTechAvailable,
  isTechDone,
  minutesToDays,
  speedMultiplier,
} from "../../src/engine/research";
import { findTech } from "../../src/data/technologies";
import type { PoliticalStats } from "../../src/types/politics";

const STATS: PoliticalStats = { politicalPower: 50, politicalPowerPerDay: 2, governmentSupport: 60, stability: 70 };

describe("tech availability", () => {
  it("is unavailable until its prerequisites are completed", () => {
    const tech = findTech("ai-kiso")!;
    expect(isTechAvailable(tech, [], [], [])).toBe(false);
    expect(isTechAvailable(tech, ["computer-kiso"], [], [])).toBe(true);
  });

  it("is unavailable once already completed", () => {
    const tech = findTech("sugaku")!;
    expect(isTechAvailable(tech, ["kiso-kagaku", "sugaku"], [], [])).toBe(false);
  });

  it("is unavailable while already being researched in another slot", () => {
    const tech = findTech("sugaku")!;
    expect(isTechAvailable(tech, ["kiso-kagaku"], [], ["sugaku"])).toBe(false);
  });

  it("stays locked behind requiresUnlock even with prerequisites met", () => {
    const tech = findTech("quantum-computing")!;
    const prereqsMet = ["ai-ouyou", "jisedai-handoutai"];
    expect(isTechAvailable(tech, prereqsMet, [], [])).toBe(false);
    expect(isTechAvailable(tech, prereqsMet, ["quantum-computing"], [])).toBe(true);
  });
});

describe("day conversion and completion", () => {
  it("converts 1440 minutes to exactly one day", () => {
    expect(minutesToDays(1440)).toBe(1);
  });

  it("marks a tech done once enough days have elapsed", () => {
    const tech = findTech("computer-kiso")!; // 180日
    expect(isTechDone({ techId: tech.id, daysElapsed: 179.9 }, tech)).toBe(false);
    expect(isTechDone({ techId: tech.id, daysElapsed: 180 }, tech)).toBe(true);
  });
});

describe("advancing research across concurrent slots", () => {
  it("advances every active slot by the same elapsed days at 0% bonus", () => {
    const active = [
      { techId: "sugaku", daysElapsed: 10 },
      { techId: "butsurigaku", daysElapsed: 5 },
    ];
    const next = advanceResearch(active, 2, 0);
    expect(next[0].daysElapsed).toBe(12);
    expect(next[1].daysElapsed).toBe(7);
  });

  it("scales progress by the speed bonus", () => {
    expect(speedMultiplier(10)).toBeCloseTo(1.1);
    const next = advanceResearch([{ techId: "sugaku", daysElapsed: 0 }], 10, 10);
    expect(next[0].daysElapsed).toBeCloseTo(11);
  });
});

describe("applying tech effects", () => {
  it("accumulates a research speed bonus without touching political stats", () => {
    const result = applyTechEffects([{ type: "modify_research_speed", amount: 5 }], STATS, [], []);
    expect(result.speedBonusDelta).toBe(5);
    expect(result.politicalStats).toEqual(STATS);
  });

  it("raises political power gain when a tech says so", () => {
    const result = applyTechEffects([{ type: "modify_political_power_gain", amount: 0.5 }], STATS, [], []);
    expect(result.politicalStats.politicalPowerPerDay).toBe(2.5);
  });

  it("appends a national modifier and unlocks a gated tech without duplicating it", () => {
    const result = applyTechEffects(
      [
        { type: "add_national_modifier", id: "m1", label: "test" },
        { type: "unlock_tech", techId: "quantum-computing" },
        { type: "unlock_tech", techId: "quantum-computing" },
      ],
      STATS,
      [],
      [],
    );
    expect(result.modifiers).toEqual([{ id: "m1", label: "test" }]);
    expect(result.unlockedTechIds).toEqual(["quantum-computing"]);
  });
});

