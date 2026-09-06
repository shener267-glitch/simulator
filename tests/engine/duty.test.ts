import { describe, expect, it } from "vitest";
import { activeDuties, MAX_DUTIES, openDutyCount } from "../../src/engine/duty";
import { DUTIES } from "../../src/data/duties";
import { ACTIONS } from "../../src/data/actions";
import { MEETINGS } from "../../src/data/meetings";
import { TALK_TREES } from "../../src/data/talk";
import { DAY_INTERRUPTS } from "../../src/data/interrupts";
import { awake, playThrough } from "../testUtils";

const ids = (state: Parameters<typeof activeDuties>[0]) =>
  activeDuties(state).map((duty) => duty.id);

/**
 * 一日の中身のどこかで実際に立てられるフラグ全部。「決めたことになっている
 * doneFlags」が、本当にどこかの選択肢と繋がっているかを確かめるために使う —
 * `by summit` を参照。片方だけを直しても、こちらを更新し忘れると気づけない
 * ので、doneFlagsの検査と対にしてある。
 */
function allSettableFlags(): Set<string> {
  const flags = new Set<string>();
  for (const action of ACTIONS) {
    for (const segment of action.segments) segment.flags?.forEach((f) => flags.add(f));
  }
  for (const meeting of MEETINGS) {
    for (const choice of meeting.choices) choice.flags?.forEach((f) => flags.add(f));
  }
  for (const tree of TALK_TREES) {
    for (const node of tree.nodes) {
      for (const choice of node.choices) {
        if (choice.kind === "topic") choice.flags?.forEach((f) => flags.add(f));
      }
    }
  }
  for (const interrupt of DAY_INTERRUPTS) {
    Object.values(interrupt.flags ?? {}).forEach((list) => list?.forEach((f) => flags.add(f)));
    interrupt.message.flags?.forEach((f) => flags.add(f));
    interrupt.options?.forEach((option) => option.flags?.forEach((f) => flags.add(f)));
  }
  return flags;
}

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

  it("never lists an item that nothing in the day can actually finish", () => {
    // doneFlags が書いてあっても、そのフラグを立てる選択肢が一つも無ければ
    // そのやることは永久に片付かない。「summit」がこの形で壊れていたので、
    // 同じ壊れ方を検査で塞いでおく。
    const settable = allSettableFlags();
    for (const duty of DUTIES) {
      const reachable = duty.doneFlags.some((flag) => settable.has(flag));
      expect(reachable, `${duty.id} の doneFlags を立てる手段がどこにも無い`).toBe(true);
    }
  });

  it("can be ignored in full — nothing forces an item", () => {
    // 一日ぶん進めても、片付けなければ open のまま。咎める仕組みはない。
    const lateAndIdle = { ...awake(), clock: 1000 };
    expect(openDutyCount(lateAndIdle)).toBeGreaterThan(0);
  });
});
