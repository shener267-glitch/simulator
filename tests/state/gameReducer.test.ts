import { describe, expect, it } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { createInitialState } from "../../src/state/initialState";
import { durationOptions, remainingToTarget } from "../../src/engine/actions";
import { actionsAt } from "../../src/engine/places";
import { findAction } from "../../src/data/actions";
import {
  at,
  awake,
  currentRun,
  playThrough,
  resolved,
  run,
  totalLogged,
  withoutCall,
} from "../testUtils";

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

describe("choosing how long to spend", () => {
  it("asks before it starts, and asking costs nothing", () => {
    const asked = gameReducer(awake(), { type: "CHOOSE_ACTION", actionId: "documents" });
    expect(asked.clock).toBe(0);
    expect(asked.mode).toMatchObject({ kind: "duration", actionId: "documents" });

    const cancelled = gameReducer(asked, { type: "CANCEL_DURATION" });
    expect(cancelled.clock).toBe(0);
    expect(cancelled.mode.kind).toBe("place");
  });

  it("does not ask when there is only one length to pick", () => {
    // 少しぼーっとするは15分ひと区切りしかない。聞くだけ無駄なので始める。
    const started = gameReducer(awake(), { type: "CHOOSE_ACTION", actionId: "idle" });
    expect(started.mode.kind).toBe("action");
    expect(started.clock).toBe(15);
  });

  it("offers the lengths the segments actually add up to", () => {
    const state = awake();
    const options = durationOptions(state, findAction("documents")!);
    expect(options.map((option) => option.minutes)).toEqual([10, 20, 30]);
    expect(options.every((option) => option.available)).toBe(true);
  });

  it("shows a length that will not fit, but refuses to start it", () => {
    // 06:40。ブリーフィングまで20分しかないので、30分は選べない。
    const late = { ...awake(), clock: 100 };
    const options = durationOptions(late, findAction("documents")!);
    expect(options.map((option) => [option.minutes, option.available])).toEqual([
      [10, true],
      [20, true],
      [30, false],
    ]);

    const refused = run(
      late,
      { type: "CHOOSE_ACTION", actionId: "documents" },
      { type: "START_ACTION", actionId: "documents", targetMinutes: 30 },
    );
    expect(refused.clock).toBe(100);
    expect(refused.mode.kind).toBe("duration");
  });

  it("treats the chosen length as a target, not a commitment", () => {
    // 30分と答えてから10分でやめる。払うのは10分だけ（設計書8章）。
    const after = run(
      awake(),
      { type: "CHOOSE_ACTION", actionId: "documents" },
      { type: "START_ACTION", actionId: "documents", targetMinutes: 30 },
      { type: "STOP_ACTION" },
    );

    expect(after.clock).toBe(10);
    expect(after.log).toEqual([{ label: "資料を読む", minutes: 10, startedAt: 0 }]);
    expect(after.actionProgress.documents).toBe(1);
  });

  it("counts down to the target and then stops counting", () => {
    let state = run(
      awake(),
      { type: "CHOOSE_ACTION", actionId: "documents" },
      { type: "START_ACTION", actionId: "documents", targetMinutes: 20 },
    );
    expect(remainingToTarget(currentRun(state)!)).toBe(10);

    state = gameReducer(state, { type: "CONTINUE_SEGMENT" });
    expect(remainingToTarget(currentRun(state)!)).toBeNull();
    // 目安に届いても勝手には止まらない。まだ続けられる。
    expect(currentRun(state)?.exhausted).toBe(false);
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

describe("appointments, which are not negotiable", () => {
  it("cuts an action short at the appointment and charges only the minutes that were left", () => {
    // 06:50。07:00のブリーフィングまで10分しかないところに15分のニュース。
    const state = gameReducer(
      { ...withoutCall(awake()), clock: 110 },
      { type: "START_ACTION", actionId: "news" },
    );

    expect(state.clock).toBe(120);
    expect(currentRun(state)?.interrupted).toBe(true);
    expect(currentRun(state)?.minutesSpent).toBe(10);

    const stopped = gameReducer(state, { type: "STOP_ACTION" });
    expect(stopped.log[stopped.log.length - 1]).toEqual({
      label: "ニュースを見る",
      minutes: 10,
      startedAt: 110,
    });
    // 読み切っていないので、あとでニュースの続きから読める。
    expect(stopped.actionProgress.news).toBe(0);
  });

  it("runs the briefing for its full half hour once the player sits down for it", () => {
    let state = { ...withoutCall(awake()), clock: 120 };
    state = gameReducer(state, { type: "FINISH_WAKE" }); // すでに place なので何も起きない
    state = gameReducer({ ...state, mode: { kind: "place" } }, { type: "MOVE_TO", place: "corridor" });

    expect(state.mode).toMatchObject({ kind: "appointment", appointmentId: "briefing" });

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    expect(state.clock).toBe(151);
    expect(state.highlights).toContain("沢渡と篠塚から本日の日程の説明を受けた。");
  });
});

describe("being taken to the 官邸", () => {
  it("carries the player across at 07:30 without asking", () => {
    // 07:25、公邸のリビングにいる。予定は待ってくれない。
    let state = { ...resolved(withoutCall(at(awake(), "living")), "briefing"), clock: 145 };
    state = gameReducer(state, { type: "START_ACTION", actionId: "breakfast" });
    state = gameReducer(state, { type: "STOP_ACTION" });

    expect(state.mode).toMatchObject({ kind: "appointment", appointmentId: "kantei" });
    expect(state.place).toBe("living");

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    expect(state.clock).toBe(155);
    expect(state.place).toBe("office");
    expect(state.highlights).toContain("官邸に入った。");
  });

  it("gives the 官邸 something to do, and no way to wander back", () => {
    const here = actionsAt("office").map((action) => action.id);
    expect(here.length).toBeGreaterThan(0);
    expect(here).toContain("documents");
    // 公邸へ歩いて戻る道はプレイヤーには開いていない。
    expect(gameReducer({ ...awake(), place: "office" }, { type: "MOVE_TO", place: "living" }).place).toBe(
      "office",
    );
  });

  it("finishes the morning on the 官房長官 meeting, exactly at 08:00", () => {
    let state = {
      ...resolved(withoutCall(at(awake(), "office")), "briefing", "kantei"),
      clock: 165,
    };
    state = gameReducer(state, { type: "MOVE_TO", place: "secretariat" });

    expect(state.mode).toMatchObject({ kind: "appointment", appointmentId: "chief-meeting" });

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    expect(state.clock).toBe(180);
    expect(state.phase).toBe("review");
  });
});

describe("the call that arrives on its own", () => {
  /** 06:05まで進めて、次の一区切りで着信を受ける。 */
  function upToTheCall() {
    let state = playThrough(awake(), "documents"); // 30分 → 05:30
    state = playThrough(state, "ready"); // 20分 → 05:50
    state = playThrough(state, "idle"); // 15分 → 06:05
    expect(state.clock).toBe(65);
    return state;
  }

  it("does not cut the segment short the way an appointment does", () => {
    // 06:05に15分のニュース。着信は06:10だが、区切りまでは切られない。
    const state = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });

    expect(state.clock).toBe(80);
    expect(currentRun(state)?.interrupted).toBe(false);
    expect(currentRun(state)?.minutesSpent).toBe(15);
  });

  it("rings at the end of the segment, over the action the player was in", () => {
    const state = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });

    expect(state.mode).toMatchObject({
      kind: "interrupt",
      interruptId: "funding-report",
      answered: false,
      resume: { kind: "action" },
    });
  });

  it("moves the briefing to 06:30 whichever way the player answers", () => {
    expect(awake().appointments.find((a) => a.id === "briefing")?.at).toBe(120);

    for (const choice of ["answer", "defer", "ignore"] as const) {
      const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });
      const answered = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice });

      expect(answered.appointments.find((a) => a.id === "briefing")?.at).toBe(90);
      expect(answered.highlights.some((line) => line.includes("06:30"))).toBe(true);
    }
  });

  it("goes back to the same action when the player puts it off, and leaves it on the phone", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });
    const before = currentRun(rung)!;

    const deferred = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "defer" });

    expect(deferred.clock).toBe(80);
    expect(deferred.mode.kind).toBe("action");
    expect(currentRun(deferred)).toEqual(before);
    expect(deferred.phone.messages).toHaveLength(1);
    expect(deferred.phone.messages[0].from).toBe("官房長官");
    expect(deferred.flags).toContain("deferred-the-call");
  });

  it("leaves nothing to read when the player ignores it", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });
    const ignored = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "ignore" });

    expect(ignored.clock).toBe(80);
    expect(ignored.mode.kind).toBe("action");
    expect(ignored.phone.messages).toHaveLength(0);
    expect(ignored.flags).toContain("ignored-the-call");
  });

  it("ends the action and spends the minutes when the player takes it", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });
    const answered = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "answer" });

    expect(answered.clock).toBe(90);
    expect(answered.mode).toMatchObject({ kind: "interrupt", answered: true });
    // 手を止めた行動は、そこまでの分がきちんと記録される。
    expect(answered.log.map((entry) => entry.label)).toContain("ニュースを見る");
    expect(answered.log[answered.log.length - 1]).toEqual({
      label: "官房長官からの連絡",
      minutes: 10,
      startedAt: 80,
    });
    expect(answered.actionProgress.news).toBe(1);

    const closed = gameReducer(answered, { type: "CLOSE_INTERRUPT" });
    // 06:30。閉じた先はもうブリーフィングの時間。
    expect(closed.mode).toMatchObject({ kind: "appointment", appointmentId: "briefing" });
  });

  it("only rings once, whatever else happens", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "news" });
    let state = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "defer" });
    state = gameReducer(state, { type: "STOP_ACTION" });

    expect(state.interrupts.every((item) => item.fired)).toBe(true);
    expect(state.mode.kind).not.toBe("interrupt");
  });
});

describe("the whole morning", () => {
  function playUntilReview() {
    let state = awake();
    for (let guard = 0; guard < 400 && state.phase === "morning"; guard += 1) {
      if (state.mode.kind === "interrupt") {
        state = state.mode.answered
          ? gameReducer(state, { type: "CLOSE_INTERRUPT" })
          : gameReducer(state, { type: "ANSWER_INTERRUPT", choice: "answer" });
        continue;
      }
      if (state.mode.kind === "duration") {
        state = gameReducer(state, { type: "CANCEL_DURATION" });
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

    expect(state.interrupts.every((item) => item.fired)).toBe(true);
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
