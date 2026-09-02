import { describe, expect, it } from "vitest";
import {
  METER_CELLS,
  applyElapsed,
  describeCondition,
  describeFatigue,
  describeHunger,
  fatigueGauge,
  hungerGauge,
} from "../../src/engine/condition";

const DIGITS = /[0-9０-９]/;

describe("condition", () => {
  it("never leaks a number into the player-facing text", () => {
    for (let value = 0; value <= 100; value += 1) {
      expect(describeFatigue(value)).not.toMatch(DIGITS);
      expect(describeHunger(value)).not.toMatch(DIGITS);
    }
  });

  it("describes both fatigue and hunger", () => {
    expect(describeCondition({ fatigue: 55, hunger: 45 })).toHaveLength(2);
  });

  it("worsens the wording as fatigue climbs", () => {
    expect(describeFatigue(10)).not.toBe(describeFatigue(50));
    expect(describeFatigue(50)).not.toBe(describeFatigue(90));
  });

  it("lets hunger creep up with the passing minutes", () => {
    const after = applyElapsed({ fatigue: 50, hunger: 40 }, 30);
    expect(after.hunger).toBeGreaterThan(40);
    expect(after.fatigue).toBe(50);
  });

  it("keeps values inside their range", () => {
    expect(applyElapsed({ fatigue: 50, hunger: 99 }, 180).hunger).toBeLessThanOrEqual(100);
  });
});

describe("the condition meter", () => {
  it("stays inside its five cells and never labels itself with a number", () => {
    for (let value = 0; value <= 100; value += 1) {
      for (const gauge of [fatigueGauge(value), hungerGauge(value)]) {
        expect(gauge.filled).toBeGreaterThanOrEqual(1);
        expect(gauge.filled).toBeLessThanOrEqual(METER_CELLS);
        expect(gauge.label).not.toMatch(DIGITS);
      }
    }
  });

  it("fills up as the state gets worse, and never goes back on its own", () => {
    let previous = 0;
    for (let value = 0; value <= 100; value += 1) {
      const { filled } = fatigueGauge(value);
      expect(filled).toBeGreaterThanOrEqual(previous);
      previous = filled;
    }
    expect(fatigueGauge(0).label).toBe("低");
    expect(fatigueGauge(100).label).toBe("高");
  });
});
