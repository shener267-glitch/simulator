import { describe, expect, it } from "vitest";
import { activeDuties, MAX_DUTIES, openDutyCount } from "../../src/engine/duty";
import { DUTIES } from "../../src/data/duties";
import { awake, playThrough } from "../testUtils";

const ids = (state: Parameters<typeof activeDuties>[0]) =>
  activeDuties(state).map((duty) => duty.id);

describe("📋やること", () => {
  it("opens the day with the papers on the list", () => {
    expect(ids(awake())).toContain("papers");
  });

  it("ticks an item off when the work is actually done, not when it is acknowledged", () => {
    const read = playThrough(awake(), "documents");
    const papers = activeDuties(read).find((duty) => duty.id === "papers");

    expect(papers?.done).toBe(true);
    expect(openDutyCount(read)).toBeLessThan(openDutyCount(awake()));
  });

  it("keeps the list short enough not to read as a checklist", () => {
    for (const clock of [0, 200, 400, 700, 1000]) {
      expect(activeDuties({ ...awake(), clock }).length).toBeLessThanOrEqual(MAX_DUTIES);
    }
  });

  it("only raises work the player could actually know about", () => {
    // 外務省の件は、外務省の話を聞いてから出る。
    expect(ids({ ...awake(), clock: 600 })).not.toContain("summit");
    expect(ids({ ...awake(), clock: 600, flags: ["knows-the-summit"] })).toContain("summit");
  });

  it("takes an item down once it is too late, without saying anything", () => {
    // 日程の確認は、昼を過ぎたらもう意味がない。
    expect(ids({ ...awake(), clock: 100 })).toContain("schedule");
    expect(ids({ ...awake(), clock: 400 })).not.toContain("schedule");
  });

  it("gives every item a way to be finished", () => {
    for (const duty of DUTIES) {
      expect(duty.doneFlags.length, `${duty.id} に済んだ判定がない`).toBeGreaterThan(0);
    }
  });

  it("can be ignored in full — nothing forces an item", () => {
    // 一日ぶん進めても、片付けなければ open のまま。咎める仕組みはない。
    const lateAndIdle = { ...awake(), clock: 1000 };
    expect(openDutyCount(lateAndIdle)).toBeGreaterThan(0);
  });
});
