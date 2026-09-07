import type { IntelSnapshot, MilitaryState } from "../types/military";
import type { Country } from "../types/country";
import { FOREIGN_MILITARY_BASELINE, JAPAN_AIR_WINGS, JAPAN_BASES, JAPAN_FLEETS, JAPAN_FORCES, JAPAN_PERSONNEL, JAPAN_PRODUCTION_LINES, JAPAN_UNITS } from "../data/military";

const EMPTY_FORCES = {
  land: { capability: 0, units: 0, tanksArmor: 0, artillery: 0, airDefenseUnits: 0, longRangeFire: 0 },
  sea: { capability: 0, destroyers: 0, submarines: 0, carrierAviation: 0, supplyShips: 0, patrolVessels: 0 },
  air: { capability: 0, fighters: 0, attackAircraft: 0, transportAircraft: 0, awacs: 0, patrolAircraft: 0, helicopters: 0 },
  missile: { capability: 0, airDefenseMissiles: 0, antiShipMissiles: 0, longRangeMissiles: 0 },
  other: { capability: 0, satellites: 0, cyber: 0, electronicWarfare: 0, intelligenceGathering: 0 },
};

/**
 * 開始時点の軍事状況（Phase 5指示書0〜39章）。
 *
 * 日本を担当したときだけ、実在の自衛隊の編成に基づく基地・部隊・艦隊・
 * 航空団を持たせる（`data/military.ts`）。日本以外は、政治・経済・研究・
 * 外交と同じく、まだ実データを用意していない土台のみ。
 */
export function createMilitaryState(countryId: string, allCountries: Country[]): MilitaryState {
  const intel: Record<string, IntelSnapshot> = {};
  for (const other of allCountries.filter((country) => country.id !== countryId && country.playable)) {
    const baseline = FOREIGN_MILITARY_BASELINE[other.id];
    intel[other.id] = {
      countryId: other.id,
      landEstimate: baseline?.land ?? 0,
      seaEstimate: baseline?.sea ?? 0,
      airEstimate: baseline?.air ?? 0,
      confidencePercent: 50,
    };
  }

  if (countryId === "JPN") {
    return {
      personnel: { ...JAPAN_PERSONNEL },
      forces: {
        land: { ...JAPAN_FORCES.land },
        sea: { ...JAPAN_FORCES.sea },
        air: { ...JAPAN_FORCES.air },
        missile: { ...JAPAN_FORCES.missile },
        other: { ...JAPAN_FORCES.other },
      },
      readiness: "normal",
      mobilization: "peacetime",
      conscriptionPolicy: "volunteer",
      bases: JAPAN_BASES.map((base) => ({ ...base })),
      units: JAPAN_UNITS.map((unit) => ({ ...unit, personnel: { ...unit.personnel } })),
      fleets: JAPAN_FLEETS.map((fleet) => ({ ...fleet })),
      airWings: JAPAN_AIR_WINGS.map((wing) => ({ ...wing, coverageRegionIds: [...wing.coverageRegionIds] })),
      productionLines: JAPAN_PRODUCTION_LINES.map((line) => ({ ...line })),
      intel,
      operations: [],
      war: null,
      scheduledEffects: [],
      eventLog: [],
      pendingNotices: [],
      elapsedMinutes: 0,
    };
  }

  return {
    personnel: { activeDuty: 0, reserve: 0, mobilizable: 0, fillRatePercent: 0 },
    forces: {
      land: { ...EMPTY_FORCES.land },
      sea: { ...EMPTY_FORCES.sea },
      air: { ...EMPTY_FORCES.air },
      missile: { ...EMPTY_FORCES.missile },
      other: { ...EMPTY_FORCES.other },
    },
    readiness: "normal",
    mobilization: "peacetime",
    conscriptionPolicy: "volunteer",
    bases: [],
    units: [],
    fleets: [],
    airWings: [],
    productionLines: [],
    intel,
    operations: [],
    war: null,
    scheduledEffects: [],
    eventLog: [],
    pendingNotices: [],
    elapsedMinutes: 0,
  };
}
