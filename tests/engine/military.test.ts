import { describe, expect, it } from "vitest";
import {
  advanceProduction,
  applyMilitaryEffects,
  bindMilitaryEffectsToCountry,
  driftFrontStatus,
  driftIntel,
  regionHopDistance,
  rollArmedAttack,
  rollMilitaryEvent,
  travelDays,
} from "../../src/engine/military";
import type { ForceStats, IntelSnapshot, PersonnelStats, WarState } from "../../src/types/military";

const FORCES: ForceStats = {
  land: { capability: 50, units: 5, tanksArmor: 500, artillery: 200, airDefenseUnits: 5, longRangeFire: 1 },
  sea: { capability: 50, destroyers: 20, submarines: 10, carrierAviation: 1, supplyShips: 3, patrolVessels: 3 },
  air: { capability: 50, fighters: 200, attackAircraft: 0, transportAircraft: 20, awacs: 10, patrolAircraft: 30, helicopters: 50 },
  missile: { capability: 50, airDefenseMissiles: 5, antiShipMissiles: 5, longRangeMissiles: 0 },
  other: { capability: 50, satellites: 5, cyber: 10, electronicWarfare: 5, intelligenceGathering: 20 },
};

const PERSONNEL: PersonnelStats = { activeDuty: 100000, reserve: 20000, mobilizable: 10000, fillRatePercent: 80 };

describe("applying military effects (閉じたEffect語彙)", () => {
  it("modifies a capability index and clamps it to 0..100", () => {
    const result = applyMilitaryEffects([{ type: "modify_capability", category: "land", amount: 60 }], FORCES, PERSONNEL);
    expect(result.forces.land.capability).toBe(100);
  });

  it("never lets a capability index go negative", () => {
    const result = applyMilitaryEffects([{ type: "modify_capability", category: "sea", amount: -1000 }], FORCES, PERSONNEL);
    expect(result.forces.sea.capability).toBe(0);
  });

  it("modifies a personnel field without letting it go negative", () => {
    const result = applyMilitaryEffects([{ type: "modify_personnel", field: "reserve", amount: -100000 }], FORCES, PERSONNEL);
    expect(result.personnel.reserve).toBe(0);
  });

  it("accumulates political power and government support deltas without mutating forces", () => {
    const result = applyMilitaryEffects(
      [{ type: "modify_political_power", amount: 5 }, { type: "modify_government_support", amount: -2 }],
      FORCES,
      PERSONNEL,
    );
    expect(result.politicalPowerDelta).toBe(5);
    expect(result.governmentSupportDelta).toBe(-2);
    expect(result.forces).toBe(FORCES);
  });

  it("surfaces relation deltas for the reducer to route into diplomacy, without touching military state", () => {
    const result = applyMilitaryEffects([{ type: "modify_relation", countryId: "USA", amount: 4, label: "共同演習" }], FORCES, PERSONNEL);
    expect(result.relationDeltas).toEqual([{ countryId: "USA", amount: 4, label: "共同演習" }]);
  });

  it("reports triggered events", () => {
    const result = applyMilitaryEffects([{ type: "trigger_event", eventId: "scramble" }], FORCES, PERSONNEL);
    expect(result.triggeredEventIds).toEqual(["scramble"]);
  });
});

describe("binding placeholder effects to a country", () => {
  it("fills in the empty countryId placeholder used by shared templates", () => {
    const bound = bindMilitaryEffectsToCountry([{ type: "modify_relation", countryId: "", amount: 3, label: "情報共有" }], "USA");
    expect(bound).toEqual([{ type: "modify_relation", countryId: "USA", amount: 3, label: "情報共有" }]);
  });
});

describe("region travel (指示書7章)", () => {
  it("is zero hops for the same region", () => {
    expect(regionHopDistance("kanto", "kanto")).toBe(0);
  });

  it("is one hop between adjacent regions", () => {
    expect(regionHopDistance("kanto", "tohoku")).toBe(1);
  });

  it("finds a multi-hop path between distant regions", () => {
    expect(regionHopDistance("hokkaido", "nansei")).toBeGreaterThan(1);
  });

  it("turns hop count into a travel-day estimate, at least half a day", () => {
    expect(travelDays("kanto", "kanto")).toBe(0.5);
    expect(travelDays("kanto", "tohoku")).toBeCloseTo(1.5);
  });
});

describe("advancing a production line (指示書16章)", () => {
  it("accumulates output and yields a capability gain once a full unit is reached", () => {
    const line = { itemId: "tank" as const, factories: 100, efficiencyPercent: 100, accumulatedOutput: 0 };
    const { line: next, capabilityGains } = advanceProduction(line, 365, 7.9, 0); // 十分な工場×日数で1台以上完成する
    expect(capabilityGains.length).toBeGreaterThan(0);
    expect(capabilityGains[0].category).toBe("land");
    expect(next.accumulatedOutput).toBeGreaterThanOrEqual(0);
  });

  it("produces nothing when no time has passed", () => {
    const line = { itemId: "fighter" as const, factories: 5, efficiencyPercent: 80, accumulatedOutput: 0 };
    const { capabilityGains } = advanceProduction(line, 0, 7.9, 0);
    expect(capabilityGains).toEqual([]);
  });

  it("scales output with the defense budget relative to the ¥7.9兆 baseline", () => {
    const line = { itemId: "missile" as const, factories: 10, efficiencyPercent: 100, accumulatedOutput: 0 };
    const rich = advanceProduction(line, 10, 15.8, 0); // 基準の2倍の予算
    const poor = advanceProduction(line, 10, 7.9, 0);
    expect(rich.line.accumulatedOutput).toBeGreaterThan(poor.line.accumulatedOutput);
  });
});

describe("intel drift (指示書20・21章、確度は必ず不確実)", () => {
  it("keeps confidence within the 20..95 band", () => {
    const snapshot: IntelSnapshot = { countryId: "USA", landEstimate: 50, seaEstimate: 50, airEstimate: 50, confidencePercent: 90 };
    const next = driftIntel(snapshot, { land: 70, sea: 90, air: 90 }, 100, () => 1);
    expect(next.confidencePercent).toBeLessThanOrEqual(95);
    expect(next.confidencePercent).toBeGreaterThanOrEqual(20);
  });

  it("pulls estimates toward the baseline over time", () => {
    const snapshot: IntelSnapshot = { countryId: "CHN", landEstimate: 0, seaEstimate: 0, airEstimate: 0, confidencePercent: 50 };
    const next = driftIntel(snapshot, { land: 75, sea: 70, air: 65 }, 30, () => 0.5); // random=0.5でノイズ項が0になる
    expect(next.landEstimate).toBeGreaterThan(0);
  });
});

describe("front status drift (指示書24・26章、詳細な戦闘計算はしない)", () => {
  function war(): WarState {
    return {
      enemyCountryId: "RUS",
      startedAtMinute: 0,
      frontStatus: { hokkaido: "tense", tohoku: "calm", kanto: "calm", chubu: "calm", kinki: "calm", chugoku: "calm", shikoku: "calm", kyushu: "calm", nansei: "calm", sea_of_japan: "active", east_china_sea: "calm", pacific_ocean: "calm" },
    };
  }

  it("can improve a region's status when it has strong operational support", () => {
    const next = driftFrontStatus(war(), { hokkaido: 10 }, () => 0); // roll=0は必ずしきい値を下回る
    expect(next.frontStatus.hokkaido).toBe("calm");
  });

  it("can worsen a region's status when it has negative support", () => {
    const next = driftFrontStatus(war(), { tohoku: -10 }, () => 0);
    expect(next.frontStatus.tohoku).toBe("tense");
  });

  it("leaves an unassigned region's status alone — its default support (-2) is too mild to trigger a shift either way", () => {
    const next = driftFrontStatus(war(), {}, () => 0);
    expect(next.frontStatus.tohoku).toBe("calm");
    expect(next.frontStatus.hokkaido).toBe("tense");
  });
});

describe("peacetime events and armed attack rolls", () => {
  it("mostly rolls no military event", () => {
    expect(rollMilitaryEvent(1, () => 0.999)).toBeNull();
  });

  it("can roll a military event id when the dice land right", () => {
    expect(rollMilitaryEvent(100, () => 0)).not.toBeNull();
  });

  it("never rolls an armed attack against a country whose relation is not hostile", () => {
    expect(rollArmedAttack({ USA: 40, CHN: 0 }, 1000, () => 0)).toBeNull();
  });

  it("can roll an armed attack once a relation is deeply hostile", () => {
    expect(rollArmedAttack({ RUS: -80 }, 1000, () => 0)).toBe("RUS");
  });
});
