import { describe, expect, it } from "vitest";
import { activeConcerns, MAX_CONCERNS } from "../../src/engine/concern";
import { CONCERNS } from "../../src/data/concerns";
import { DUTIES } from "../../src/data/duties";
import { awake, playThrough, run } from "../testUtils";
import { gameReducer } from "../../src/state/gameReducer";

const ids = (state: Parameters<typeof activeConcerns>[0]) =>
  activeConcerns(state).map((concern) => concern.id);

describe("🧠内心", () => {
  it("says how the body feels, not what there is to do", () => {
    // 仕事は📋やることの側にある。内心に仕事の行が混ざると、ToDoに見える。
    const work = DUTIES.map((duty) => duty.text);
    for (const concern of CONCERNS) {
      expect(work, `内心「${concern.text}」が やること と重なっている`).not.toContain(concern.text);
    }
  });

  it("never shows more than two at once, so it cannot be read as a list", () => {
    const busy = { ...awake(), clock: 60, condition: { fatigue: 90, hunger: 90 } };
    expect(activeConcerns(busy).length).toBeLessThanOrEqual(MAX_CONCERNS);
  });

  it("comes from the body, not the clock", () => {
    // 同じ時刻でも、腹が満ちていれば腹の話は出ない。
    const fed = { ...awake(), clock: 300, condition: { fatigue: 30, hunger: 10 } };
    const starving = { ...awake(), clock: 300, condition: { fatigue: 30, hunger: 85 } };

    expect(ids(fed)).not.toContain("starving");
    expect(ids(fed)).not.toContain("hungry");
    expect(ids(starving)).toContain("starving");
  });

  it("stops mentioning the wife once they have spoken", () => {
    const before = { ...awake(), clock: 40, condition: { fatigue: 20, hunger: 20 } };
    expect(ids(before)).toContain("wife-morning");

    const after = { ...before, flags: ["talked-to-wife"] };
    expect(ids(after)).not.toContain("wife-morning");
  });

  it("lets go of what is no longer possible instead of nagging about it", () => {
    // 家を出たあとは、着替えのことも妻のことも、もう気にしない。
    const gone = { ...awake(), clock: 300, condition: { fatigue: 20, hunger: 20 } };
    expect(ids(gone)).not.toContain("not-dressed");
    expect(ids(gone)).not.toContain("wife-morning");
  });

  it("can be ignored for a whole morning without the game saying anything", () => {
    const idled = run(awake(), { type: "START_ACTION", actionId: "idle" }, { type: "STOP_ACTION" });

    expect(idled.flags).not.toContain("read-economic-papers");
    expect(gameReducer(idled, { type: "STOP_ACTION" })).toEqual(idled);
  });

  it("gives every concern a way out, so none of them can get stuck on screen", () => {
    for (const concern of CONCERNS) {
      const escapes =
        concern.until !== undefined ||
        (concern.unlessFlags?.length ?? 0) > 0 ||
        // 体から来るものは、食べるか休めば消える。
        concern.whenFatigueOver !== undefined ||
        concern.whenHungerOver !== undefined;
      expect(escapes, `${concern.id} には消える条件がない`).toBe(true);
    }
  });

  it("still lets reading the papers change what the day looks like", () => {
    // 資料そのものは やること に移ったが、読んだ事実はフラグとして残る。
    const read = playThrough(awake(), "documents");
    expect(read.flags).toContain("read-economic-papers");
  });
});
