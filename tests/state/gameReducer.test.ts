import { describe, expect, it } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { createInitialState } from "../../src/state/initialState";
import { actionsAt } from "../../src/engine/places";
import { at, awake, currentRun, playThrough, run, totalLogged } from "../testUtils";

describe("waking up", () => {
  it("opens on the 05:00 wake-up and costs no time", () => {
    const state = createInitialState();
    expect(state.clock).toBe(0);
    expect(state.mode.kind).toBe("wake");
    expect(state.place).toBe("bedroom");

    const after = gameReducer(state, { type: "FINISH_WAKE" });
    expect(after.clock).toBe(0);
    expect(after.mode.kind).toBe("place");
    expect(after.log).toHaveLength(0);
  });
});

describe("spending time on an action", () => {
  it("consumes the first segment as soon as the action starts", () => {
    const after = gameReducer(awake(), { type: "START_ACTION", actionId: "news" });
    expect(after.clock).toBe(15);
    expect(currentRun(after)?.minutesSpent).toBe(15);
  });

  it("charges only the segments actually consumed when the player stops early", () => {
    const after = run(
      awake(),
      { type: "START_ACTION", actionId: "documents" },
      { type: "CONTINUE_SEGMENT" },
      { type: "STOP_ACTION" },
    );

    expect(after.clock).toBe(20);
    expect(after.log).toEqual([{ label: "資料を読む", minutes: 20, startedAt: 0 }]);
  });

  it("picks a half-finished action back up where it was left", () => {
    const stopped = run(
      awake(),
      { type: "START_ACTION", actionId: "documents" },
      { type: "CONTINUE_SEGMENT" },
      { type: "STOP_ACTION" },
    );
    const resumed = gameReducer(stopped, { type: "START_ACTION", actionId: "documents" });

    expect(resumed.clock).toBe(30);
    expect(currentRun(resumed)?.exhausted).toBe(true);
  });

  it("uses up an ordinary action but lets a repeatable one come round again", () => {
    const usedUp = playThrough(awake(), "documents");
    expect(usedUp.spentActions).toContain("documents");
    expect(
      currentRun(gameReducer(usedUp, { type: "START_ACTION", actionId: "documents" })),
    ).toBeNull();

    const twice = playThrough(playThrough(awake(), "idle"), "idle");
    expect(twice.clock).toBe(30);
    expect(twice.spentActions).not.toContain("idle");
  });

  it("refuses an action the current place does not offer", () => {
    // 朝食はリビングにしかない。寝室から呼んでも何も起きない（設計書16章）。
    const ignored = gameReducer(awake(), { type: "START_ACTION", actionId: "breakfast" });
    expect(ignored.clock).toBe(0);
    expect(ignored.mode.kind).toBe("place");

    const inTheLivingRoom = gameReducer(at(awake(), "living"), {
      type: "START_ACTION",
      actionId: "breakfast",
    });
    expect(inTheLivingRoom.clock).toBe(10);
  });
});

describe("moving around the residence", () => {
  it("costs a minute and puts the player in the next room", () => {
    const after = gameReducer(awake(), { type: "MOVE_TO", place: "corridor" });
    expect(after.clock).toBe(1);
    expect(after.place).toBe("corridor");
  });

  it("will not jump to a room that does not touch this one", () => {
    const after = gameReducer(awake(), { type: "MOVE_TO", place: "living" });
    expect(after.clock).toBe(0);
    expect(after.place).toBe("bedroom");
  });

  it("keeps a walk in the log so every minute is still accounted for", () => {
    const after = run(
      awake(),
      { type: "MOVE_TO", place: "corridor" },
      { type: "MOVE_TO", place: "living" },
    );

    expect(after.clock).toBe(2);
    expect(after.place).toBe("living");
    // 続けて歩いた分は一行にまとめる。廊下の一分だけの行が並ぶと読みにくい。
    expect(after.log).toEqual([{ label: "リビングへ移動", minutes: 2, startedAt: 0, move: true }]);
    expect(totalLogged(after)).toBe(2);
  });

  it("starts a fresh row once something else has happened in between", () => {
    const after = run(
      awake(),
      { type: "MOVE_TO", place: "corridor" },
      { type: "MOVE_TO", place: "living" },
      { type: "START_ACTION", actionId: "breakfast" },
      { type: "STOP_ACTION" },
      { type: "MOVE_TO", place: "corridor" },
    );

    expect(after.log.map((entry) => entry.label)).toEqual([
      "リビングへ移動",
      "朝食をとる",
      "廊下へ移動",
    ]);
    expect(totalLogged(after)).toBe(after.clock);
  });
});

describe("interruptions", () => {
  it("cuts an action short at the interruption and charges only the minutes that were left", () => {
    let state = playThrough(awake(), "documents"); // 30分 → 05:30
    state = playThrough(state, "ready"); // 20分 → 05:50
    state = playThrough(state, "idle"); // 15分 → 06:05
    expect(state.clock).toBe(65);

    // 15分のニュースを始めるが、06:10の連絡まで5分しかない。
    state = gameReducer(state, { type: "START_ACTION", actionId: "news" });
    expect(state.clock).toBe(70);
    expect(currentRun(state)?.interrupted).toBe(true);
    expect(currentRun(state)?.minutesSpent).toBe(5);

    state = gameReducer(state, { type: "STOP_ACTION" });
    expect(state.log[state.log.length - 1]).toEqual({
      label: "ニュースを見る",
      minutes: 5,
      startedAt: 65,
    });
    // 読み切っていないので、あとでニュースの続きから読める。
    expect(state.actionProgress.news).toBe(0);
  });

  it("brings the briefing forward from 07:00 to 06:30 when the call comes in", () => {
    const before = awake();
    expect(before.appointments.find((a) => a.id === "briefing")?.at).toBe(120);

    let state = playThrough(before, "news"); // 60分 → 06:00
    state = playThrough(state, "sns"); // 06:10の連絡で頭打ち
    expect(state.clock).toBe(70);
    expect(state.mode).toMatchObject({ kind: "event", eventId: "funding-report" });
    expect(state.appointments.find((a) => a.id === "briefing")?.at).toBe(90);
    expect(state.highlights.some((line) => line.includes("06:30"))).toBe(true);
  });

  it("comes back to the screen the call arrived over", () => {
    let state = playThrough(playThrough(awake(), "news"), "sns");
    expect(state.mode).toMatchObject({ kind: "event", resume: { kind: "place" } });

    state = gameReducer(state, { type: "DISMISS_EVENT" });
    expect(state.mode.kind).toBe("place");
    expect(state.clock).toBe(70);
  });

  it("runs the briefing for its full half hour once the player sits down for it", () => {
    let state = playThrough(playThrough(awake(), "news"), "sns");
    state = gameReducer(state, { type: "DISMISS_EVENT" });

    state = playThrough(state, "idle"); // 15分 → 06:25
    state = playThrough(state, "idle"); // 06:30で頭打ち
    expect(state.clock).toBe(90);
    expect(state.mode).toMatchObject({ kind: "appointment", appointmentId: "briefing" });

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    expect(state.clock).toBe(120);
    expect(state.highlights).toContain("沢渡と篠塚から本日の日程の説明を受けた。");
  });
});

describe("the whole morning", () => {
  function playUntilReview() {
    let state = awake();
    for (let guard = 0; guard < 400 && state.phase === "morning"; guard += 1) {
      if (state.mode.kind === "event") {
        state = gameReducer(state, { type: "DISMISS_EVENT" });
        continue;
      }
      if (state.mode.kind === "appointment") {
        state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
        continue;
      }
      const available = actionsAt(state.place).find(
        (action) => !state.spentActions.includes(action.id),
      );
      state = playThrough(state, available!.id);
    }
    return state;
  }

  it("ends at 08:00 with every minute accounted for in the log", () => {
    const state = playUntilReview();

    expect(state.phase).toBe("review");
    expect(state.clock).toBe(180);
    expect(totalLogged(state)).toBe(180);
  });

  it("always gets the call and the briefing in, however the time was spent", () => {
    const state = playUntilReview();

    expect(state.events.every((event) => event.fired)).toBe(true);
    expect(state.appointments.every((appointment) => appointment.resolved)).toBe(true);
    expect(state.log.some((entry) => entry.label.includes("ブリーフィング"))).toBe(true);
  });

  it("puts the morning back to 05:00 when it is restarted", () => {
    const restarted = gameReducer(playUntilReview(), { type: "RESTART_MORNING" });

    expect(restarted.clock).toBe(0);
    expect(restarted.phase).toBe("morning");
    expect(restarted.log).toHaveLength(0);
    expect(restarted.highlights).toHaveLength(0);
    expect(restarted.place).toBe("bedroom");
    expect(restarted.mode.kind).toBe("wake");
  });
});
