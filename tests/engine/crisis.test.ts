import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/state/initialState";
import { makeFiredCrisis, rollChildren, rollStandalone } from "../../src/engine/crisis";

const NEVER = () => 0.999999;
const ALWAYS = () => 0;

describe("crisis firing", () => {
  it("fires nothing when the roll always misses", () => {
    const state = createInitialState();
    expect(rollStandalone(state, 420, NEVER)).toBeNull();
  });

  it("fires a standalone template when the roll always hits", () => {
    const state = createInitialState();
    const fired = rollStandalone(state, 420, ALWAYS);
    expect(fired).not.toBeNull();
    expect(fired?.parents).toEqual([]);
  });

  it("never re-fires a template that has already happened", () => {
    const state = createInitialState();
    const first = rollStandalone(state, 420, ALWAYS);
    expect(first).not.toBeNull();

    const withFired = { ...state, crises: [makeFiredCrisis(first!, 420)] };
    const second = rollStandalone(withFired, 421, ALWAYS);
    expect(second?.id).not.toBe(first!.id);
  });

  it("rolls children only once, right after their parent fires", () => {
    const state = createInitialState();
    expect(rollChildren("earthquake", state, 420, NEVER)).toEqual([]);
    const children = rollChildren("earthquake", state, 420, ALWAYS);
    expect(children.length).toBeGreaterThan(0);
    for (const child of children) expect(child.parents).toContain("earthquake");
  });

  it("stamps a fired crisis with its template id and firing time, unacknowledged", () => {
    const state = createInitialState();
    const template = rollStandalone(state, 420, ALWAYS)!;
    const fired = makeFiredCrisis(template, 420);
    expect(fired).toMatchObject({ templateId: template.id, firedAt: 420, acknowledged: false });
  });
});
