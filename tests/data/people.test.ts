import { describe, expect, it } from "vitest";
import { PEOPLE, peopleAt, personById } from "../../src/data/people";
import { TALK_TREES } from "../../src/data/talk";
import { PLACE_ORDER } from "../../src/data/places";
import { at, awake } from "../testUtils";

describe("部屋にいる人", () => {
  it("gives every conversation a person to belong to", () => {
    // 木のidと人物のidが揃っていないと、その相手は「いるのに話せない」になる。
    for (const tree of TALK_TREES) {
      expect(personById(tree.id), `${tree.id} に対応する人物がいない`).toBeDefined();
    }
  });

  it("puts everyone somewhere real, or nowhere at all", () => {
    for (const person of PEOPLE) {
      for (const spot of person.presence) {
        expect(PLACE_ORDER, `${person.id} の居場所 ${spot.place} が無い`).toContain(spot.place);
        if (spot.from !== undefined && spot.until !== undefined) {
          expect(spot.from).toBeLessThan(spot.until);
        }
      }
    }
  });

  it("empties the dormitory once the day has started, and fills the 官邸", () => {
    // 07:55に家を出る。日中のリビングには誰もいない。
    const daytimeLiving = peopleAt({ ...at(awake(), "living"), clock: 300 });
    expect(daytimeLiving).toHaveLength(0);

    const secretariat = peopleAt({ ...at(awake(), "secretariat"), clock: 300 });
    expect(secretariat.map((entry) => entry.person.id)).toEqual(["sawatari", "shinozuka"]);
  });

  it("brings the family back in the evening", () => {
    const evening = peopleAt({ ...at(awake(), "living"), clock: 900 });
    expect(evening.map((entry) => entry.person.id)).toContain("wife");
  });

  it("says what each person is doing, not just that they are there", () => {
    for (const { note } of peopleAt({ ...at(awake(), "secretariat"), clock: 300 })) {
      expect(note?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
