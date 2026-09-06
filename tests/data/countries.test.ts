import { describe, expect, it } from "vitest";
import { COUNTRIES, DEFAULT_COUNTRY_ID, findCountry, findCountryByIsoNumeric } from "../../src/data/countries";

describe("the country catalogue", () => {
  it("covers the seven countries the brief asks for", () => {
    expect(COUNTRIES.length).toBe(7);
    expect(COUNTRIES.every((c) => c.playable)).toBe(true);
  });

  it("gives every country a unique id and iso numeric code", () => {
    expect(new Set(COUNTRIES.map((c) => c.id)).size).toBe(COUNTRIES.length);
    expect(new Set(COUNTRIES.map((c) => c.isoNumeric)).size).toBe(COUNTRIES.length);
  });

  it("resolves a country by id and by iso numeric code", () => {
    expect(findCountry("JPN")?.name).toBe("日本");
    expect(findCountryByIsoNumeric("392")?.id).toBe("JPN");
  });

  it("defaults the test start country to Japan", () => {
    expect(DEFAULT_COUNTRY_ID).toBe("JPN");
    expect(findCountry(DEFAULT_COUNTRY_ID)).toBeDefined();
  });
});
