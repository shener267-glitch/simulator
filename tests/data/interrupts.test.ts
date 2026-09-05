import { describe, expect, it } from "vitest";
import { DAY_INTERRUPTS } from "../../src/data/interrupts";
import { optionsOf } from "../../src/engine/interrupt";
import { DAY_LENGTH } from "../../src/types/clock";
import { gameReducer } from "../../src/state/gameReducer";
import { at, awake, resolved, upTo } from "../testUtils";

describe("割り込み", () => {
  it("spreads across the day, so the schedule is never the whole story", () => {
    // 予定表を見ただけでは、その日の出来事は分からない（設計書16章）。
    expect(DAY_INTERRUPTS.length).toBeGreaterThanOrEqual(6);

    const hours = new Set(DAY_INTERRUPTS.map((item) => Math.floor(item.at / 180)));
    expect(hours.size, "突発が一つの時間帯に固まっている").toBeGreaterThanOrEqual(4);
  });

  it("always leaves a way to say no", () => {
    // 全部聞いていたら一日は回らない。断る手が無い割り込みは作らない。
    for (const interrupt of DAY_INTERRUPTS) {
      const options = optionsOf(interrupt);
      const refusals = options.filter(
        (option) => option.id === "ignore" || option.id === "defer" || option.id === "delegate",
      );
      expect(refusals.length, `${interrupt.id} に断る手がない`).toBeGreaterThan(0);
    }
  });

  it("keeps every refusal cheap in minutes, and every 'yes' honest about its cost", () => {
    for (const interrupt of DAY_INTERRUPTS) {
      for (const option of optionsOf(interrupt)) {
        expect(option.minutes).toBeGreaterThanOrEqual(0);
        if (option.id === "answer") expect(option.minutes).toBeGreaterThan(0);
        if (option.id === "ignore") expect(option.minutes).toBeLessThanOrEqual(2);
      }
    }
  });

  it("offers a shorter way to listen where a shorter way makes sense", () => {
    // 「三分だけ聞く」がある件は、聞く手が長短二つある。
    const withBrief = DAY_INTERRUPTS.filter((interrupt) =>
      optionsOf(interrupt).some((option) => option.id === "brief"),
    );
    expect(withBrief.length).toBeGreaterThanOrEqual(3);

    for (const interrupt of withBrief) {
      const options = optionsOf(interrupt);
      const brief = options.find((option) => option.id === "brief")!;
      const full = options.find((option) => option.id === "answer");
      if (full) expect(brief.minutes).toBeLessThan(full.minutes);
    }
  });

  it("rings inside the day, and never at a time that cannot happen", () => {
    for (const interrupt of DAY_INTERRUPTS) {
      expect(interrupt.at).toBeGreaterThanOrEqual(0);
      expect(interrupt.at).toBeLessThan(DAY_LENGTH);
    }
  });

  it("lets a whole interruption be handed to a secretary without hearing it", () => {
    // 11:40の官僚。任せれば、こちらの手は止まらない。
    const office = {
      ...upTo(
        resolved(
          at(awake(), "office"),
          "departure",
          "gaggle",
          "morning-meeting",
          "cabinet",
          "party-leaders",
        ),
        "official-door",
      ),
      clock: 335,
    };
    const rung = gameReducer(office, { type: "START_ACTION", actionId: "sns" });
    expect(rung.mode).toMatchObject({ kind: "interrupt", interruptId: "official-door" });

    const handed = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "delegate" });
    expect(handed.flags).toContain("delegated-the-official");
    // 任せた件は電話に残る。読むかどうかは、あとで決められる。
    expect(handed.phone.messages.map((message) => message.id)).toContain("official-door");
  });
});
