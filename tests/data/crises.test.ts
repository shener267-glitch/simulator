import { describe, expect, it } from "vitest";
import { CRISES, findCrisis } from "../../src/data/crises/catalogue";

/**
 * カタログの検査。発火の仕組みはまだ無いので、確かめられるのは形だけ —
 * ただし、繋がりの切れたidや、予兆が予告になっている書き方は、あとで
 * 発火を載せたときに黙って壊れる種類のものなので、いま止めておく。
 */
describe("危機イベントのカタログ", () => {
  it("covers the ground the spec asks for", () => {
    expect(CRISES.length).toBeGreaterThanOrEqual(40);
  });

  it("gives every crisis a unique id", () => {
    const ids = CRISES.map((crisis) => crisis.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never points at a crisis that is not in the catalogue", () => {
    for (const crisis of CRISES) {
      for (const id of [...crisis.children, ...crisis.parents, ...crisis.related]) {
        expect(findCrisis(id), `${crisis.id} が指す ${id} が無い`).toBeDefined();
      }
    }
  });

  it("keeps parents and children pointing at each other", () => {
    // 片側だけ張られていると、あとで木を辿るときに静かに落ちる。
    for (const crisis of CRISES) {
      for (const childId of crisis.children) {
        expect(
          findCrisis(childId)?.parents,
          `${crisis.id} → ${childId} の親子が片側だけになっている`,
        ).toContain(crisis.id);
      }
    }
  });

  it("keeps 'related' symmetric, since it is not a direction", () => {
    for (const crisis of CRISES) {
      for (const id of crisis.related) {
        expect(findCrisis(id)?.related, `${crisis.id} と ${id} の関連が片側だけ`).toContain(crisis.id);
      }
    }
  });

  it("leaves every crisis unlikely on any given day", () => {
    // 予兆は予告ではない（指示書19章）。親を持たないものの確率がどれも小さく、
    // 合計しても1に届かないことが、「何も起きない日の方が多い」の中身になる。
    const standalone = CRISES.filter((crisis) => crisis.parents.length === 0);
    for (const crisis of standalone) {
      expect(crisis.probability, `${crisis.id} の確率が高すぎる`).toBeLessThan(0.05);
    }
    const total = standalone.reduce((sum, crisis) => sum + crisis.probability, 0);
    expect(total).toBeLessThan(1);
  });

  it("has no omen that promises the thing will happen", () => {
    // 「必ず」「確実」と書いた予兆があると、出た瞬間に答えが割れる。
    for (const crisis of CRISES) {
      for (const omen of crisis.omens) {
        expect(omen.text, `${crisis.id} の予兆が断定している`).not.toMatch(/必ず|確実に/);
        expect(omen.from.length).toBeGreaterThan(0);
      }
    }
  });

  it("says what each one does to the day", () => {
    for (const crisis of CRISES) {
      expect(crisis.scheduleImpact).toBeDefined();
      if (crisis.durationMinutes) {
        expect(crisis.durationMinutes.min).toBeLessThanOrEqual(crisis.durationMinutes.max);
      }
    }
  });

  it("fires nothing in this version", () => {
    // 発火の入口が無いことをここで固定しておく。作るときは、このテストを
    // 書き換えるところから始める。
    expect(CRISES.every((crisis) => !("fired" in crisis))).toBe(true);
  });
});
