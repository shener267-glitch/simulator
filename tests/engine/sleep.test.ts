import { describe, expect, it } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { BEDTIME_EARLIEST, canGoToBed, carriedFatigue } from "../../src/engine/sleep";
import { DAY_LENGTH } from "../../src/types/clock";
import { at, awake, resolved, withoutCall } from "../testUtils";
import type { GameState } from "../../src/types/game";

/** 20:30、宿舎の寝室。予定は全部済んでいる。 */
function homeForTheNight(clock = 870): GameState {
  const done = resolved(
    withoutCall(at(awake(), "bedroom")),
    ...awake().appointments.map((appointment) => appointment.id),
  );
  return { ...done, clock };
}

describe("寝る", () => {
  it("is offered only in the dormitory bedroom, at night, with nothing left on the schedule", () => {
    expect(canGoToBed(homeForTheNight())).toBe(true);

    // 昼間の寝室では寝られない。予定が残っているうちは一日を切り上げられない。
    expect(canGoToBed({ ...homeForTheNight(), clock: 300 })).toBe(false);
    expect(canGoToBed({ ...awake(), clock: 870, place: "bedroom" })).toBe(false);
    expect(canGoToBed({ ...homeForTheNight(), place: "living" })).toBe(false);
  });

  it("ends the day where the player decided to end it", () => {
    const slept = gameReducer(homeForTheNight(900), { type: "GO_TO_BED" });

    expect(slept.phase).toBe("review");
    expect(slept.clock).toBe(900); // 21:00。寝ること自体には時間を使わない
    expect(slept.sleep).toMatchObject({ at: 900, forced: false });
  });

  it("refuses to end the day from anywhere else, silently", () => {
    const daytime = { ...homeForTheNight(), clock: 300 };
    expect(gameReducer(daytime, { type: "GO_TO_BED" })).toEqual(daytime);
  });

  it("closes the day at 24:00 for a player who never went to bed", () => {
    // 23:55、書斎。あと5分の行動を始めると、日付が変わる。手が空いた
    // ところで一日が閉じる — 区切りの途中で画面を奪わないのと同じ扱い。
    const late = { ...homeForTheNight(1075), place: "study" as const };
    const running = gameReducer(late, { type: "START_ACTION", actionId: "sns" });
    expect(running.clock).toBe(DAY_LENGTH);
    expect(running.phase).toBe("day");

    const after = gameReducer(running, { type: "STOP_ACTION" });

    expect(after.clock).toBe(DAY_LENGTH);
    expect(after.phase).toBe("review");
    expect(after.sleep).toMatchObject({ forced: true });
  });

  it("carries less fatigue into tomorrow the earlier the player turns in", () => {
    const early = carriedFatigue(70, BEDTIME_EARLIEST);
    const late = carriedFatigue(70, DAY_LENGTH);

    expect(early).toBeLessThan(late);
    expect(late).toBe(70); // 24:00に寝れば、何も抜けない
    expect(carriedFatigue(10, BEDTIME_EARLIEST)).toBe(0); // 下は0で止まる
  });
});
