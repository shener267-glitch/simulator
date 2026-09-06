import { describe, expect, it } from "vitest";
import { ECONOMY_POLICIES, findEconomyPolicy } from "../../src/data/economyPolicies";

describe("the economy policy catalogue", () => {
  it("covers the eight policies the brief asks for", () => {
    expect(ECONOMY_POLICIES.length).toBe(8);
  });

  it("gives every policy a unique id", () => {
    const ids = ECONOMY_POLICIES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("orders each policy's stages by increasing delay, staggered rather than all-at-once", () => {
    for (const policy of ECONOMY_POLICIES) {
      expect(policy.stages.length).toBeGreaterThan(1);
      const days = policy.stages.map((s) => s.afterDays);
      const sorted = [...days].sort((a, b) => a - b);
      expect(days).toEqual(sorted);
      expect(new Set(days).size).toBe(days.length);
    }
  });

  it("resolves policies by id", () => {
    expect(findEconomyPolicy("public-investment")?.name).toBe("公共投資");
    expect(findEconomyPolicy("nonexistent")).toBeUndefined();
  });
});
