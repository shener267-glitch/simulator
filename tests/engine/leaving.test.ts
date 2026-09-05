import { describe, expect, it } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { EARLIEST_DEPARTURE, RIDE_MINUTES, canLeaveKantei } from "../../src/engine/leaving";
import { at, awake, resolved, withoutCall } from "../testUtils";
import type { GameState } from "../../src/types/game";

/** 予定が全部済んだ執務室。 */
function done(clock: number): GameState {
  const base = withoutCall(at(awake(), "office"));
  return { ...resolved(base, ...base.appointments.map((a) => a.id)), clock };
}

describe("官邸を出る", () => {
  it("is the player's call from 18:00, not a fixed appointment", () => {
    // 20:00の「官邸発」という予定は無くなった。総理が帰ると言うまで帰らない。
    expect(awake().appointments.map((a) => a.id)).not.toContain("return");

    expect(canLeaveKantei(done(EARLIEST_DEPARTURE))).toBe(true);
    expect(canLeaveKantei(done(EARLIEST_DEPARTURE - 1))).toBe(false);
  });

  it("will not let the player walk out on something still on the schedule", () => {
    const pending = { ...at(awake(), "office"), clock: 800 };
    expect(canLeaveKantei(pending)).toBe(false);
  });

  it("takes five minutes by car, because it is five hundred metres", () => {
    const leaving = gameReducer(done(800), { type: "LEAVE_KANTEI" });

    expect(leaving.clock).toBe(800 + RIDE_MINUTES);
    expect(leaving.place).toBe("living");
    expect(leaving.flags).toContain("left-the-kantei");
    expect(leaving.log[leaving.log.length - 1]).toMatchObject({ label: "官邸発", minutes: 5 });
  });

  it("gives a long evening to whoever leaves early", () => {
    const early = gameReducer(done(EARLIEST_DEPARTURE), { type: "LEAVE_KANTEI" });
    const late = gameReducer(done(960), { type: "LEAVE_KANTEI" });

    // 早く帰れば、そのぶん夜が長い。夜の行動は帰った時刻から使える。
    expect(early.clock).toBeLessThan(late.clock);
  });

  it("does nothing at all from the dormitory", () => {
    const home = { ...done(900), place: "living" as const };
    expect(canLeaveKantei(home)).toBe(false);
    expect(gameReducer(home, { type: "LEAVE_KANTEI" })).toEqual(home);
  });
});
