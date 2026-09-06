import { describe, expect, it } from "vitest";
import {
  advanceEconomy,
  applyEconomyEffects,
  debtToGdpRatio,
  fiscalBalance,
  politicalDriftPerDay,
  schedulePolicyEffects,
  totalBudget,
} from "../../src/engine/economy";
import { findEconomyPolicy } from "../../src/data/economyPolicies";
import type { Budget, EconomyStats } from "../../src/types/economy";

const BUDGET: Budget = {
  socialSecurity: 37,
  defense: 7.9,
  publicWorks: 6,
  educationResearch: 5.4,
  diplomacy: 0.7,
  industry: 1.5,
  other: 53.5,
};

const STATS: EconomyStats = {
  gdpTrillionYen: 600,
  gdpGrowthRate: 1.2,
  taxRevenueTrillionYen: 70,
  otherRevenueTrillionYen: 7,
  govDebtTrillionYen: 1105,
  inflationRate: 2.5,
  unemploymentRate: 2.5,
  consumption: 5,
  privateInvestment: 5,
};

describe("fiscal arithmetic", () => {
  it("sums the budget to get total expenditure", () => {
    expect(totalBudget(BUDGET)).toBeCloseTo(112);
  });

  it("computes a deficit when expenditure outruns revenue", () => {
    expect(fiscalBalance(STATS, BUDGET)).toBeCloseTo(70 + 7 - 112);
  });

  it("computes debt as a percentage of GDP", () => {
    expect(debtToGdpRatio(STATS)).toBeCloseTo((1105 / 600) * 100);
  });
});

describe("advancing the economy over time", () => {
  it("grows GDP proportionally to the annual growth rate over a fraction of a year", () => {
    const next = advanceEconomy(STATS, BUDGET, 365);
    expect(next.gdpTrillionYen).toBeCloseTo(600 * 1.012);
  });

  it("accumulates government debt by the deficit, prorated by elapsed time", () => {
    const next = advanceEconomy(STATS, BUDGET, 365);
    const deficit = fiscalBalance(STATS, BUDGET); // negative
    expect(next.govDebtTrillionYen).toBeCloseTo(1105 - deficit);
  });

  it("never lets debt go negative", () => {
    const richStats = { ...STATS, taxRevenueTrillionYen: 1000, govDebtTrillionYen: 1 };
    const next = advanceEconomy(richStats, BUDGET, 3650);
    expect(next.govDebtTrillionYen).toBe(0);
  });
});

describe("applying economy effects", () => {
  it("modifies a stat and clamps rates that cannot go negative", () => {
    const result = applyEconomyEffects([{ type: "modify_stat", stat: "unemploymentRate", amount: -10 }], STATS, BUDGET);
    expect(result.stats.unemploymentRate).toBe(0);
  });

  it("leaves gdpGrowthRate free to go negative (a recession is a real state, not an error)", () => {
    const result = applyEconomyEffects([{ type: "modify_stat", stat: "gdpGrowthRate", amount: -10 }], STATS, BUDGET);
    expect(result.stats.gdpGrowthRate).toBeCloseTo(-8.8);
  });

  it("modifies a single budget category without touching the others", () => {
    const result = applyEconomyEffects([{ type: "modify_budget", category: "publicWorks", amount: 2 }], STATS, BUDGET);
    expect(result.budget.publicWorks).toBe(8);
    expect(result.budget.defense).toBe(BUDGET.defense);
  });

  it("reports triggered events without changing stats", () => {
    const result = applyEconomyEffects([{ type: "trigger_event", eventId: "private-investment-up" }], STATS, BUDGET);
    expect(result.triggeredEventIds).toEqual(["private-investment-up"]);
    expect(result.stats).toEqual(STATS);
  });
});

describe("scheduling a policy's staged effects", () => {
  it("lays out each stage at its own absolute minute, in order", () => {
    const policy = findEconomyPolicy("public-investment")!;
    const scheduled = schedulePolicyEffects(policy, 1000);
    expect(scheduled.map((s) => s.atMinute)).toEqual([1000, 1000 + 120 * 1440, 1000 + 365 * 1440]);
  });
});

describe("economy → politics drift (指示書9章)", () => {
  it("nudges support up in a strong economy and down in a weak one", () => {
    const strong = politicalDriftPerDay({ ...STATS, gdpGrowthRate: 3, unemploymentRate: 2, inflationRate: 2 });
    const weak = politicalDriftPerDay({ ...STATS, gdpGrowthRate: -1, unemploymentRate: 5, inflationRate: 4 });
    expect(strong.governmentSupport).toBeGreaterThan(0);
    expect(weak.governmentSupport).toBeLessThan(0);
  });

  it("keeps the daily drift small — policies and events carry the big swings, not a formula", () => {
    const extreme = politicalDriftPerDay({ ...STATS, gdpGrowthRate: -20, unemploymentRate: 50, inflationRate: 50 });
    expect(Math.abs(extreme.governmentSupport)).toBeLessThan(1);
    expect(Math.abs(extreme.stability)).toBeLessThan(1);
  });
});
