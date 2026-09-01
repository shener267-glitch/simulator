import type { GameState, FactionState, CountryRelationState, FamilyMemberState } from "../types/game";
import { createStartDate } from "../engine/calendar";
import { factionDefs, countryDefs, familyDefs, INITIAL_DIET_SEATS } from "../data/registry";

export const SAVE_VERSION = 1;

export function createNewGame(): GameState {
  const factions: Record<string, FactionState> = {};
  for (const def of factionDefs) {
    factions[def.id] = {
      id: def.id,
      name: def.name,
      leaderName: def.leaderName,
      personality: def.personality,
      seatShare: def.initialSeatShare,
      loyalty: def.initialLoyalty,
      reshufflePressure: 0,
    };
  }

  const countryRelations: Record<string, CountryRelationState> = {};
  for (const def of countryDefs) {
    countryRelations[def.id] = {
      countryId: def.id,
      name: def.name,
      relationScore: def.initialRelation,
      lastMetDayIndex: null,
    };
  }

  const family: FamilyMemberState[] = familyDefs.map((def) => ({
    id: def.id,
    name: def.name,
    relation: def.relation,
    relationship: def.initialRelationship,
  }));

  return {
    saveVersion: SAVE_VERSION,
    date: createStartDate(),
    term: {
      termLengthDays: 1460,
      dissolutionThresholdApproval: 20,
      scandalCollapseThreshold: 70,
    },
    stats: {
      approvalRating: 55,
      treasuryBalance: 0,
      gdpGrowth: 1.0,
      partyUnity: 60,
      dietSeats: INITIAL_DIET_SEATS,
      health: 85,
      stress: 20,
      scandalRisk: 5,
    },
    factions,
    countryRelations,
    family,
    flags: {},
    history: [{ dayIndex: 0, text: "組閣が完了し、新内閣が発足した。", kind: "system" }],
    policyCooldowns: {},
    eventCooldowns: {},
    activeEvent: null,
    status: "playing",
  };
}
