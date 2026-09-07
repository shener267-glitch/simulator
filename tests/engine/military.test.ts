import { describe, expect, it } from "vitest";
import {
  advanceProduction,
  applyMilitaryEffects,
  bindMilitaryEffectsToCountry,
  driftFrontStatus,
  driftIntel,
  markFrontProvincesContested,
  provinceHopDistance,
  provinceTravelDays,
  regionHopDistance,
  resolveLandCombat,
  rollArmedAttack,
  rollMilitaryEvent,
  travelDays,
} from "../../src/engine/military";
import { JAPAN_PROVINCES } from "../../src/data/military";
import type { ForceStats, IntelSnapshot, PersonnelStats, Province, Unit, WarState } from "../../src/types/military";

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

function landUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: "test-div",
    name: "テスト師団",
    branch: "gsdf",
    personnel: { current: 7000, max: 7000 },
    equipmentRatePercent: 100,
    moralePercent: 100,
    baseId: "asaka-camp",
    regionId: "kanto",
    provinceId: "tokyo-metro",
    status: "garrison",
    ...overrides,
  };
}

function landProvince(overrides: Partial<Province> = {}): Province {
  return {
    id: "test-province",
    name: "テストプロヴィンス",
    regionId: "kanto",
    kind: "land",
    terrain: "plains",
    ownerCountryId: "JPN",
    infrastructureLevel: 5,
    supplyLevel: 70,
    hasCity: false,
    hasPort: false,
    fortificationLevel: 0,
    contested: true,
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

describe("province adjacency and travel time (HOI4型改訂・指示書1・3章)", () => {
  it("is zero hops for the same province", () => {
    expect(provinceHopDistance("tokyo-metro", "tokyo-metro")).toBe(0);
  });

  it("is one hop between adjacent provinces", () => {
    expect(provinceHopDistance("tokyo-metro", "tohoku-rural")).toBe(1);
  });

  it("finds a multi-hop path between distant provinces", () => {
    expect(provinceHopDistance("sapporo-chitose", "naha-province")).toBeGreaterThan(1);
  });

  it("gives a shorter travel time between two well-developed provinces than two undeveloped ones, for the same hop count", () => {
    const highInfra = provinceTravelDays(JAPAN_PROVINCES, "tokyo-metro", "tohoku-rural"); // 平均インフラ6.5、1区間
    const lowInfra = provinceTravelDays(JAPAN_PROVINCES, "chubu-mountain", "kinki-rural"); // 平均インフラ3.5、同じく1区間
    expect(highInfra).toBeGreaterThan(0);
    expect(highInfra).toBeLessThan(lowInfra);
  });

  it("takes at least a quarter day even for a same-province order", () => {
    expect(provinceTravelDays(JAPAN_PROVINCES, "tokyo-metro", "tokyo-metro")).toBe(0.25);
  });
});

describe("simplified land combat (HOI4型改訂・指示書4章)", () => {
  it("wins decisively when the attacker is far stronger than the defender", () => {
    const unit = landUnit();
    const province = landProvince({ terrain: "plains", fortificationLevel: 0 });
    const result = resolveLandCombat(unit, province, 10, () => 0.5); // random=0.5でブレをゼロにする
    expect(result.outcome).toBe("victory");
    expect(result.provinceSecured).toBe(true);
    expect(result.unit.personnel.current).toBeLessThan(unit.personnel.current);
  });

  it("loses decisively when the attacker is far weaker than a fortified, defensible position", () => {
    const unit = landUnit({ personnel: { current: 700, max: 7000 }, equipmentRatePercent: 20, moralePercent: 20 });
    const province = landProvince({ terrain: "mountains", fortificationLevel: 8 });
    const result = resolveLandCombat(unit, province, 80, () => 0.5);
    expect(result.outcome).toBe("defeat");
    expect(result.provinceSecured).toBe(false);
    expect(result.unit.moralePercent).toBeLessThan(unit.moralePercent);
  });

  it("settles into a stalemate when the two sides are roughly even", () => {
    const unit = landUnit({ personnel: { current: 3500, max: 7000 }, equipmentRatePercent: 50, moralePercent: 100 });
    const province = landProvince({ terrain: "plains", fortificationLevel: 0 });
    const result = resolveLandCombat(unit, province, 25, () => 0.5); // attacker≈25, defender=25
    expect(result.outcome).toBe("stalemate");
    expect(result.provinceSecured).toBe(false);
  });

  it("never lets losses push personnel, equipment, or morale below zero", () => {
    const unit = landUnit({ personnel: { current: 1, max: 7000 }, equipmentRatePercent: 1, moralePercent: 1 });
    const province = landProvince({ terrain: "mountains", fortificationLevel: 10 });
    const result = resolveLandCombat(unit, province, 100, () => 0);
    expect(result.unit.personnel.current).toBeGreaterThanOrEqual(0);
    expect(result.unit.equipmentRatePercent).toBeGreaterThanOrEqual(0);
    expect(result.unit.moralePercent).toBeGreaterThanOrEqual(0);
  });
});

describe("marking front-region provinces contested on war entry (HOI4型改訂・指示書4・5章)", () => {
  it("marks only provinces belonging to the attacked region", () => {
    const marked = markFrontProvincesContested(JAPAN_PROVINCES, "kyushu");
    for (const province of marked) {
      expect(province.contested).toBe(province.regionId === "kyushu");
    }
  });
});
