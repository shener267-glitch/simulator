import { describe, expect, it } from "vitest";
import { reviewBlocks, TIME_BLOCKS } from "../../src/engine/review";
import { awake } from "../testUtils";
import type { GameState } from "../../src/types/game";

function logged(entries: { label: string; minutes: number; startedAt: number }[]): GameState {
  return { ...awake(), log: entries };
}

describe("一日の記録", () => {
  it("covers the whole day with no gap and no overlap", () => {
    // どの分も、ちょうど一つの時間帯に入る。取りこぼしがあると行が消える。
    let edge = 0;
    for (const block of TIME_BLOCKS) {
      expect(block.from).toBe(edge);
      edge = block.until;
    }
    expect(edge).toBe(Number.POSITIVE_INFINITY);
  });

  it("groups the day by when things were started, not by what they were", () => {
    const state = logged([
      { label: "身支度をする", minutes: 20, startedAt: 10 },
      { label: "閣議", minutes: 40, startedAt: 240 },
      { label: "夕食をとる", minutes: 30, startedAt: 900 },
    ]);

    expect(reviewBlocks(state).map((block) => block.label)).toEqual(["朝", "午前", "夜"]);
  });

  it("leaves out the parts of the day nothing happened in", () => {
    const state = logged([{ label: "少しぼーっとする", minutes: 15, startedAt: 700 }]);
    const blocks = reviewBlocks(state);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].label).toBe("夕方");
    expect(blocks[0].minutes).toBe(15);
  });

  it("adds up each block on its own, instead of one total that is always a whole day", () => {
    const state = logged([
      { label: "経済対策の資料を読む", minutes: 40, startedAt: 20 },
      { label: "朝食をとる", minutes: 20, startedAt: 60 },
      { label: "閣議", minutes: 40, startedAt: 240 },
    ]);

    expect(reviewBlocks(state).map((block) => block.minutes)).toEqual([60, 40]);
  });
});
