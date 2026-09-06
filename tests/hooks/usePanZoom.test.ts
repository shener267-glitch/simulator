import { describe, expect, it } from "vitest";
import { clampPanZoom } from "../../src/hooks/usePanZoom";

const OPTS = { width: 960, height: 500, minScale: 1, maxScale: 8, marginRatio: 0.4 };

describe("clampPanZoom", () => {
  it("lets the true right edge be reached at high zoom (regression: used to be unreachable)", () => {
    // scale=8のとき、右端(o=width)を画面右端に映すにはx = width*(1-8) = -7*width が必要。
    const clamped = clampPanZoom({ x: -7 * OPTS.width, y: 0, scale: 8 }, OPTS);
    expect(clamped.x).toBeCloseTo(-7 * OPTS.width);
  });

  it("lets the true left edge be reached at high zoom", () => {
    const clamped = clampPanZoom({ x: 0, y: 0, scale: 8 }, OPTS);
    expect(clamped.x).toBeCloseTo(0);
  });

  it("allows a fixed screen-space overscroll regardless of zoom level", () => {
    const atScale1 = clampPanZoom({ x: 10_000, y: 0, scale: 1 }, OPTS);
    const atScale8 = clampPanZoom({ x: 10_000, y: 0, scale: 8 }, OPTS);
    expect(atScale1.x).toBeCloseTo(OPTS.width * OPTS.marginRatio);
    expect(atScale8.x).toBeCloseTo(OPTS.width * OPTS.marginRatio);
  });

  it("clamps scale to the configured range", () => {
    expect(clampPanZoom({ x: 0, y: 0, scale: 20 }, OPTS).scale).toBe(8);
    expect(clampPanZoom({ x: 0, y: 0, scale: 0.1 }, OPTS).scale).toBe(1);
  });
});
