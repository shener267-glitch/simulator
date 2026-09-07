import { describe, expect, it } from "vitest";
import {
  MINUTES_PER_DAY,
  aggregateStanceEffects,
  applyDiplomacyEffects,
  applyStanceRelationDrift,
  bindEffectsToCountry,
  canProposeTreaty,
  computeRelation,
  driftRegionalTension,
  driftTradeFulfillment,
  economyDriftFromTrade,
  isActionAvailable,
  relationStatusLabel,
  rollAiActions,
  rollDiplomaticCrisis,
  rollDiplomaticNews,
  scheduleActionEffects,
  sweepTreaties,
} from "../../src/engine/diplomacy";
import { DIPLOMATIC_ACTIONS, TREATIES, findDiplomaticAction } from "../../src/data/diplomacy";
import type { CountryDiplomacy, RegionId, TradeState } from "../../src/types/diplomacy";

function country(overrides: Partial<CountryDiplomacy> = {}): CountryDiplomacy {
  return {
    countryId: "USA",
    baseRelation: 10,
    modifiers: [],
    barGov: 40,
    barEcon: 30,
    barMil: 20,
    personality: "pragmatic",
    treaties: [],
    lastActionAtMinute: {},
    ...overrides,
  };
}

const TENSION: Record<RegionId, number> = { europe: 30, east_asia: 30, middle_east: 30, pacific: 30 };

const TRADE: TradeState = {
  oilImportNeedTrillionYen: 10,
  oilImportFilledTrillionYen: 8,
  ironImportNeedTrillionYen: 5,
  ironImportFilledTrillionYen: 5,
  machineryExportCapacityTrillionYen: 20,
  electronicsExportCapacityTrillionYen: 15,
};

describe("computeRelation / relationStatusLabel", () => {
  it("sums the base value and all modifiers, clamped to -100..100", () => {
    const c = country({ baseRelation: 10, modifiers: [{ id: "a", label: "a", amount: 5 }, { id: "b", label: "b", amount: -2 }] });
    expect(computeRelation(c)).toBe(13);
  });

  it("clamps extreme totals", () => {
    const c = country({ baseRelation: 90, modifiers: [{ id: "a", label: "a", amount: 50 }] });
    expect(computeRelation(c)).toBe(100);
  });

  it("labels the relation band", () => {
    expect(relationStatusLabel(70)).toBe("友好国");
    expect(relationStatusLabel(30)).toBe("良好");
    expect(relationStatusLabel(0)).toBe("普通");
    expect(relationStatusLabel(-40)).toBe("緊張");
    expect(relationStatusLabel(-70)).toBe("険悪");
  });
});

describe("applying diplomacy effects (指示書各章、閉じたEffect語彙)", () => {
  it("adds a relation modifier under the target country", () => {
    const relations = { USA: country() };
    const result = applyDiplomacyEffects([{ type: "modify_relation", countryId: "USA", amount: 5, label: "使節団派遣" }], relations, TRADE, TENSION, 0);
    expect(computeRelation(result.relations.USA)).toBe(15);
    expect(result.relations.USA.modifiers).toHaveLength(1);
  });

  it("modifies a bar and clamps it to 0..100", () => {
    const relations = { USA: country({ barGov: 95 }) };
    const result = applyDiplomacyEffects([{ type: "modify_bar", countryId: "USA", bar: "gov", amount: 20 }], relations, TRADE, TENSION, 0);
    expect(result.relations.USA.barGov).toBe(100);
  });

  it("modifies regional tension, clamped to 0..100", () => {
    const result = applyDiplomacyEffects([{ type: "modify_regional_tension", region: "pacific", amount: -50 }], { USA: country() }, TRADE, TENSION, 0);
    expect(result.regionalTension.pacific).toBe(0);
  });

  it("accumulates political power and government support deltas without mutating relations", () => {
    const relations = { USA: country() };
    const result = applyDiplomacyEffects(
      [{ type: "modify_political_power", amount: 5 }, { type: "modify_government_support", amount: -2 }],
      relations,
      TRADE,
      TENSION,
      0,
    );
    expect(result.politicalPowerDelta).toBe(5);
    expect(result.governmentSupportDelta).toBe(-2);
    expect(result.relations).toBe(relations);
  });

  it("signs a treaty, recording its expiry from the template's duration", () => {
    const relations = { USA: country() };
    const result = applyDiplomacyEffects([{ type: "add_treaty", countryId: "USA", treatyTypeId: "trade_agreement" }], relations, TRADE, TENSION, 1000);
    expect(result.relations.USA.treaties).toHaveLength(1);
    expect(result.relations.USA.treaties[0].expiresAtMinute).toBe(1000 + 730 * MINUTES_PER_DAY);
  });

  it("signs a permanent treaty (durationDays: null) with a null expiry", () => {
    const relations = { USA: country() };
    const result = applyDiplomacyEffects([{ type: "add_treaty", countryId: "USA", treatyTypeId: "friendship" }], relations, TRADE, TENSION, 1000);
    expect(result.relations.USA.treaties[0].expiresAtMinute).toBeNull();
  });

  it("modifies trade fields, never letting them go negative", () => {
    const result = applyDiplomacyEffects([{ type: "modify_trade", field: "oilImportFilledTrillionYen", amount: -100 }], { USA: country() }, TRADE, TENSION, 0);
    expect(result.trade.oilImportFilledTrillionYen).toBe(0);
  });

  it("reports triggered events without changing anything else", () => {
    const relations = { USA: country() };
    const result = applyDiplomacyEffects([{ type: "trigger_event", eventId: "news-trade-friction" }], relations, TRADE, TENSION, 0);
    expect(result.triggeredEventIds).toEqual(["news-trade-friction"]);
    expect(result.relations).toBe(relations);
  });
});

describe("binding placeholder effects to a country", () => {
  it("fills in the empty countryId placeholder used by shared templates", () => {
    const bound = bindEffectsToCountry([{ type: "modify_relation", countryId: "", amount: 3, label: "使節団派遣" }], "USA");
    expect(bound).toEqual([{ type: "modify_relation", countryId: "USA", amount: 3, label: "使節団派遣" }]);
  });
});

describe("scheduling a diplomatic action's staged effects", () => {
  it("lays out each stage at its own absolute minute, bound to the target country", () => {
    const action = findDiplomaticAction("seek_improved_relations")!;
    const scheduled = scheduleActionEffects(action, "USA", 1000);
    expect(scheduled.map((s) => s.atMinute)).toEqual([1000, 1000 + 30 * MINUTES_PER_DAY]);
    expect(scheduled[0].effects[0]).toMatchObject({ countryId: "USA" });
  });
});

describe("action availability (指示書11章)", () => {
  it("refuses an action below its minRelation", () => {
    const action = findDiplomaticAction("propose_summit")!; // minRelation: -10
    expect(isActionAvailable(action, country({ baseRelation: -50 }), 0)).toBe(false);
    expect(isActionAvailable(action, country({ baseRelation: 0 }), 0)).toBe(true);
  });

  it("enforces a per-country cooldown after the action was last used", () => {
    const action = DIPLOMATIC_ACTIONS.find((a) => a.id === "send_envoy")!; // cooldown 20 days
    const c = country({ lastActionAtMinute: { send_envoy: 0 } });
    expect(isActionAvailable(action, c, 10 * MINUTES_PER_DAY)).toBe(false);
    expect(isActionAvailable(action, c, 21 * MINUTES_PER_DAY)).toBe(true);
  });
});

describe("treaty eligibility and lifecycle", () => {
  it("requires the relation to meet the treaty's threshold", () => {
    const treaty = TREATIES.find((t) => t.id === "mutual_defense")!; // minRelationToPropose: 50
    expect(canProposeTreaty(treaty.minRelationToPropose, country({ baseRelation: 40 }))).toBe(false);
    expect(canProposeTreaty(treaty.minRelationToPropose, country({ baseRelation: 60 }))).toBe(true);
  });

  it("removes a treaty once its expiry minute has passed", () => {
    const relations = { USA: country({ treaties: [{ id: "t1", treatyTypeId: "trade_agreement", countryId: "USA", signedAtMinute: 0, expiresAtMinute: 100 }] }) };
    const next = sweepTreaties(relations, 200);
    expect(next.USA.treaties).toHaveLength(0);
  });

  it("removes a treaty once the relation drops below its break threshold", () => {
    const relations = { USA: country({ baseRelation: -50, treaties: [{ id: "t1", treatyTypeId: "friendship", countryId: "USA", signedAtMinute: 0, expiresAtMinute: null }] }) }; // threshold -30
    const next = sweepTreaties(relations, 0);
    expect(next.USA.treaties).toHaveLength(0);
  });

  it("keeps a healthy, unexpired treaty untouched", () => {
    const relations = { USA: country({ treaties: [{ id: "t1", treatyTypeId: "friendship", countryId: "USA", signedAtMinute: 0, expiresAtMinute: null }] }) };
    const next = sweepTreaties(relations, 1000);
    expect(next).toBe(relations); // 変化が無ければ同一参照を返す
  });
});

describe("diplomatic stances (指示書20章、複数選択・併用可能)", () => {
  it("sums the effects of multiple active stances", () => {
    const totals = aggregateStanceEffects(["free_trade", "alliance_focus"]);
    expect(totals.exportCapacityPercent).toBe(10);
    expect(totals.treatyPartnerDriftBonus).toBeCloseTo(0.05);
  });

  it("drifts relations toward the stance's daily baseline, and gives treaty partners a bonus", () => {
    const relations = {
      USA: country({ baseRelation: 0, treaties: [] }),
      CHN: country({ baseRelation: 0, treaties: [{ id: "t1", treatyTypeId: "friendship", countryId: "CHN", signedAtMinute: 0, expiresAtMinute: null }] }),
    };
    const totals = aggregateStanceEffects(["internationalism", "alliance_focus"]);
    const next = applyStanceRelationDrift(relations, totals, 10);
    expect(next.USA.baseRelation).toBeCloseTo(totals.relationDriftPerDay * 10);
    expect(next.CHN.baseRelation).toBeCloseTo((totals.relationDriftPerDay + totals.treatyPartnerDriftBonus) * 10);
  });
});

describe("world tension and trade drift", () => {
  it("moves regional tension only within a small range per day, clamped 0..100", () => {
    const next = driftRegionalTension(TENSION, 1, () => 1); // 最大方向いっぱい
    expect(next.pacific).toBeCloseTo(30 + 0.3);
  });

  it("pulls trade fulfillment up when relations are good, down when relations are bad", () => {
    const up = driftTradeFulfillment(TRADE, 100, 100, 10);
    const down = driftTradeFulfillment(TRADE, -100, -100, 10);
    expect(up.oilImportFilledTrillionYen).toBeGreaterThan(TRADE.oilImportFilledTrillionYen);
    expect(down.oilImportFilledTrillionYen).toBeLessThan(TRADE.oilImportFilledTrillionYen);
  });

  it("never lets fulfillment go negative or far past need", () => {
    const next = driftTradeFulfillment({ ...TRADE, oilImportFilledTrillionYen: 0 }, -1000, -1000, 100);
    expect(next.oilImportFilledTrillionYen).toBe(0);
  });

  it("turns an import shortfall into a small upward inflation / downward growth drift", () => {
    const drift = economyDriftFromTrade(TRADE); // 10-8=2 oil shortfall, iron fully met
    expect(drift.inflationRate).toBeCloseTo(0.02);
    expect(drift.gdpGrowthRate).toBeCloseTo(-0.02);
  });

  it("has no drift once shortfalls are fully met", () => {
    const drift = economyDriftFromTrade({ ...TRADE, oilImportFilledTrillionYen: 10 });
    expect(drift.inflationRate).toBe(0);
    expect(drift.gdpGrowthRate).toBe(-0);
  });
});

describe("simplified other-nation AI and world events (指示書25・26章)", () => {
  it("rolls a friendly contact from a cooperative country when the dice land right", () => {
    const relations = { USA: country({ personality: "cooperative" }) };
    const rolls = rollAiActions(relations, 10, () => 0); // random()=0 は常に確率内
    expect(rolls).toHaveLength(1);
    expect(rolls[0].countryId).toBe("USA");
  });

  it("rolls nothing when the dice land outside the chance", () => {
    const relations = { USA: country({ personality: "isolationist" }) };
    const rolls = rollAiActions(relations, 1, () => 0.999);
    expect(rolls).toHaveLength(0);
  });

  it("mostly rolls no news or crisis — these are rare events", () => {
    expect(rollDiplomaticNews(1, () => 0.999)).toBeNull();
    expect(rollDiplomaticCrisis(1, () => 0.999)).toBeNull();
  });

  it("can roll a news id when the dice land right", () => {
    expect(rollDiplomaticNews(100, () => 0)).not.toBeNull();
  });
});
