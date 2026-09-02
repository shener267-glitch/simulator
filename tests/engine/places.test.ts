import { describe, expect, it } from "vitest";
import { actionsAt, canTravel, exitsFrom, travelMinutes } from "../../src/engine/places";
import { PLACES, PLACE_ORDER } from "../../src/data/places";
import { ACTIONS } from "../../src/data/actions";
import type { PlaceId } from "../../src/types/place";

describe("getting around the residence", () => {
  it("puts every room one minute off the corridor", () => {
    for (const id of ["bedroom", "bath", "living", "study"] as PlaceId[]) {
      expect(travelMinutes(id, "corridor")).toBe(1);
      expect(travelMinutes("corridor", id)).toBe(1);
    }
  });

  it("refuses to jump between rooms that do not touch", () => {
    // 寝室からリビングへは廊下を通るしかない。だから二分かかる。
    expect(travelMinutes("bedroom", "living")).toBeNull();
    expect(canTravel("bedroom", "living")).toBe(false);
    expect(canTravel("bedroom", "corridor")).toBe(true);
    expect(canTravel("corridor", "living")).toBe(true);
  });

  it("keeps the 官邸 out of reach on foot from the residence", () => {
    // 徒歩一分の隣同士だが、入るのは07:30の予定の側の都合による。
    for (const id of PLACE_ORDER) {
      if (PLACES[id].building !== "residence") continue;
      for (const exit of exitsFrom(id)) {
        expect(PLACES[exit.id].building).toBe("residence");
      }
    }
  });

  it("keeps every exit mutual", () => {
    for (const id of PLACE_ORDER) {
      for (const exit of exitsFrom(id)) {
        expect(PLACES[exit.id].neighbours).toContain(id);
      }
    }
  });
});

describe("what a place offers", () => {
  it("does not let the player read a document in the bath", () => {
    const here = actionsAt("bath").map((action) => action.id);
    expect(here).not.toContain("documents");
    expect(here).not.toContain("breakfast");
  });

  it("still lets the phone through where paper does not go", () => {
    // アイテムは場所の制限を一部だけ解除する（設計書16章）。
    expect(actionsAt("bath").map((action) => action.id)).toContain("sns");
  });

  it("serves breakfast only in the living room", () => {
    for (const id of PLACE_ORDER) {
      const offered = actionsAt(id).map((action) => action.id).includes("breakfast");
      expect(offered).toBe(id === "living");
    }
  });

  it("gives every place at least one thing to do", () => {
    for (const id of PLACE_ORDER) {
      expect(actionsAt(id).length).toBeGreaterThan(0);
    }
  });

  it("gives every action somewhere to happen", () => {
    for (const action of ACTIONS) {
      expect(action.places.length).toBeGreaterThan(0);
      for (const place of action.places) {
        expect(PLACE_ORDER).toContain(place);
      }
    }
  });
});
