import { describe, expect, it } from "vitest";
import { reviewBlocks, TIME_BLOCKS } from "../../src/engine/review";
import { at, awake, playThrough, resolved, withoutCall } from "../testUtils";
import { gameReducer } from "../../src/state/gameReducer";
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

/** 21:00、宿舎のリビング。予定は全部済んでいる。 */
function tonight(): GameState {
  const base = withoutCall(at(awake(), "living"));
  return resolved(base, ...base.appointments.map((appointment) => appointment.id));
}

describe("記録のまとめ方", () => {
  it("folds a repeated action into one row instead of twenty", () => {
    // 何度でもできる行動を続けると、同じ行が並んで記録が読めなくなる。
    let state = { ...tonight(), clock: 900 };
    for (let i = 0; i < 4; i += 1) state = playThrough(state, "idle");

    const idle = state.log.filter((entry) => entry.label === "少しぼーっとする");
    expect(idle).toHaveLength(1);
    expect(idle[0].minutes).toBe(60);
    expect(idle[0].startedAt).toBe(900);
  });

  it("starts a new row when something else happened in between", () => {
    let state = { ...tonight(), clock: 900 };
    state = playThrough(state, "idle");
    state = gameReducer(state, { type: "MOVE_TO", place: "corridor" });
    state = gameReducer(state, { type: "MOVE_TO", place: "living" });
    state = playThrough(state, "idle");

    expect(state.log.filter((entry) => entry.label === "少しぼーっとする")).toHaveLength(2);
  });
});
