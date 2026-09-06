import { describe, expect, it } from "vitest";
import { COUNTRY_FEATURES } from "../../src/data/worldTopology";
import { COUNTRIES } from "../../src/data/countries";

describe("the world map topology", () => {
  it("carries a plausible number of country shapes", () => {
    expect(COUNTRY_FEATURES.length).toBeGreaterThan(150);
  });

  it("resolves every playable country's iso code to an actual shape on the map", () => {
    const ids = new Set(COUNTRY_FEATURES.map((f) => f.id));
    for (const country of COUNTRIES) {
      expect(ids.has(country.isoNumeric), `${country.name} (${country.isoNumeric}) は地図データに無い`).toBe(true);
    }
  });
});
