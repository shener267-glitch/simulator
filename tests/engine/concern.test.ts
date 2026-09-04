import { describe, expect, it } from "vitest";
import { activeConcerns, MAX_CONCERNS } from "../../src/engine/concern";
import { CONCERNS } from "../../src/data/concerns";
import { awake, playThrough, run } from "../testUtils";
import { gameReducer } from "../../src/state/gameReducer";

describe("内心", () => {
  it("opens the day worrying about the papers, and nothing else at 06:00", () => {
    const texts = activeConcerns(awake()).map((concern) => concern.id);
    expect(texts).toContain("papers-unread");
    expect(texts).not.toContain("no-breakfast"); // 06:45から
  });

  it("never shows more than two at once, so it cannot be read as a list", () => {
    // 07:00。着替えも朝食も家族も資料も、全部気になっている時間帯。
    const busy = { ...awake(), clock: 60 };
    expect(activeConcerns(busy).length).toBeLessThanOrEqual(MAX_CONCERNS);
  });

  it("changes what it says once the papers have been half read", () => {
    const half = { ...awake(), flags: ["skimmed-economic-papers"] };
    const ids = activeConcerns(half).map((concern) => concern.id);

    expect(ids).not.toContain("papers-unread");
    expect(ids).toContain("papers-half");
  });

  it("stops mentioning the papers once they have actually been read", () => {
    const read = playThrough(awake(), "documents");

    expect(read.flags).toContain("read-economic-papers");
    expect(activeConcerns(read).map((concern) => concern.id)).not.toContain("papers-half");
  });

  it("lets go of what is no longer possible instead of nagging about it", () => {
    // 11:00を過ぎたら、朝の資料のことはもう気にしない。手遅れは急かさない。
    const later = { ...awake(), clock: 320 };
    const ids = activeConcerns(later).map((concern) => concern.id);

    expect(ids).not.toContain("papers-unread");
    expect(ids).not.toContain("papers-half");
  });

  it("can be ignored for a whole morning without the game saying anything", () => {
    // 何もせずに時間だけ使っても、警告も減点もない。減るのは11:00の手だけ。
    const idled = run(awake(), { type: "START_ACTION", actionId: "idle" }, { type: "STOP_ACTION" });

    expect(idled.flags).not.toContain("read-economic-papers");
    expect(gameReducer(idled, { type: "STOP_ACTION" })).toEqual(idled);
  });

  it("gives every concern a way out, so none of them can get stuck on screen", () => {
    for (const concern of CONCERNS) {
      const escapes = concern.until !== undefined || (concern.unlessFlags?.length ?? 0) > 0;
      expect(escapes, `${concern.id} には消える条件がない`).toBe(true);
    }
  });
});
