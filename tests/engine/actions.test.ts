import { describe, expect, it } from "vitest";
import {
  freeMinutes,
  interruptionGuard,
  nextInterruption,
  durationOptions,
  durationRange,
  formatRange,
  segmentFits,
  visibleFreeMinutes,
} from "../../src/engine/actions";
import { ACTIONS, findAction } from "../../src/data/actions";
import { gameReducer } from "../../src/state/gameReducer";
import { DAY_LENGTH } from "../../src/types/clock";
import { awake, resolved, upTo } from "../testUtils";

describe("interruption guard", () => {
  it("points at the next appointment, and at nothing softer", () => {
    // 09:17の着信はセグメントを切らないので、ここには現れない（設計書26章）。
    // 最初の壁は07:55の出発。
    const state = awake();
    expect(nextInterruption(state)).toBe(115);
    expect(interruptionGuard(state)).toBe(115);
    expect(freeMinutes(state)).toBe(115);
  });

  it("falls back to the end of the day once nothing is left on the schedule", () => {
    const settled = {
      ...awake(),
      clock: 150,
      appointments: awake().appointments.map((appointment) => ({ ...appointment, resolved: true })),
      interrupts: awake().interrupts.map((item) => ({ ...item, fired: true })),
    };

    expect(nextInterruption(settled)).toBeNull();
    expect(interruptionGuard(settled)).toBe(DAY_LENGTH);
    expect(freeMinutes(settled)).toBe(DAY_LENGTH - 150);
  });

  it("agrees with the countdown, because nothing in this morning cuts in unannounced", () => {
    const state = awake();
    expect(freeMinutes(state)).toBe(visibleFreeMinutes(state));
  });

  it("hides an appointment that was never put on the schedule", () => {
    // 予定表に載っていないものは、時計としては効くが表示には出さない。
    // 「知らないうちに時間がなくなっていた」を作れる余地を残しておく。
    const base = awake();
    const state = {
      ...base,
      appointments: [
        ...base.appointments,
        { id: "unlisted", label: "", at: 40, minutes: 10, resolved: false, announced: false },
      ],
    };

    expect(freeMinutes(state)).toBe(40);
    expect(visibleFreeMinutes(state)).toBe(115);
  });

  it("counts down to the party leaders once the call has moved them", () => {
    // 09:12。15分の資料を開くと着信の時刻を跨ぐ。切れ目で鳴り、そこで受ける。
    const morning = upTo(
      resolved(awake(), "departure", "gaggle", "morning-meeting", "cabinet"),
      "indicator",
    );
    let state = gameReducer({ ...morning, clock: 192 }, { type: "START_ACTION", actionId: "documents" });
    state = gameReducer(state, { type: "ANSWER_INTERRUPT", choice: "defer" });

    expect(state.clock).toBe(207);
    // 着信で党幹部との会談が285分（10:45）に繰り上がっている。
    expect(visibleFreeMinutes(state)).toBe(78);
  });

  it("lets a segment land exactly on the appointment but not past it", () => {
    // 07:45。出発まであと10分。
    const state = { ...awake(), clock: 105 };
    expect(segmentFits(state, { minutes: 10, text: "" })).toBe(true);
    expect(segmentFits(state, { minutes: 15, text: "" })).toBe(false);
  });
});

describe("how long an action says it takes", () => {
  it("shows a range for every action the player can pick", () => {
    for (const action of ACTIONS) {
      const range = durationRange(awake(), action);
      expect(range, action.id).not.toBeNull();
      expect(range!.min).toBeGreaterThan(0);
      expect(range!.max).toBeGreaterThanOrEqual(range!.min);
    }
  });

  it("promises exactly the lengths it will offer, and no more", () => {
    // 範囲は「いま決められる幅」。中身の総量ではない — SNSのように後ろが
    // 長く続くものは、その先を「さらに続ける」で伸ばす。
    for (const action of ACTIONS) {
      const options = durationOptions(awake(), action);
      const range = durationRange(awake(), action)!;
      expect(range.min, action.id).toBe(options[0].minutes);
      expect(range.max, action.id).toBe(options[options.length - 1].minutes);
    }
  });

  it("matches the lengths the design asks for", () => {
    const shown = (id: string) => formatRange(durationRange(awake(), findAction(id)!)!);
    expect(shown("ready")).toBe("10〜20分");
    expect(shown("nap")).toBe("15〜30分");
    expect(shown("documents")).toBe("15〜40分");
    expect(shown("news")).toBe("5〜15分");
    expect(shown("idle")).toBe("15分");
  });
});
