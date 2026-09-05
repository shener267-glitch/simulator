import { describe, expect, it } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import type { GameState } from "../../src/types/game";
import { createInitialState } from "../../src/state/initialState";
import { durationOptions, remainingToTarget } from "../../src/engine/actions";
import { actionsAt } from "../../src/engine/places";
import { meetingCeiling, offeredChoices } from "../../src/engine/meeting";
import { canGoToBed } from "../../src/engine/sleep";
import { DAY_LENGTH } from "../../src/types/clock";
import { choicesAt, reachableFrom } from "../../src/engine/talk";
import { findTree } from "../../src/data/talk";
import { nodeOf } from "../../src/types/talk";
import { findAction } from "../../src/data/actions";
import {
  at,
  awake,
  currentRun,
  playThrough,
  resolved,
  resolvedIds,
  waitForNextAppointment,
  run,
  totalLogged,
  withoutCall,
} from "../testUtils";

describe("waking up", () => {
  it("opens on the 06:00 wake-up and costs no time", () => {
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
    expect(after.clock).toBe(5);
    expect(currentRun(after)?.minutesSpent).toBe(5);
  });

  it("charges only the segments actually consumed when the player stops early", () => {
    const after = run(
      awake(),
      { type: "START_ACTION", actionId: "documents" },
      { type: "CONTINUE_SEGMENT" },
      { type: "STOP_ACTION" },
    );

    expect(after.clock).toBe(25);
    expect(after.log).toEqual([{ label: "経済対策の資料を読む", minutes: 25, startedAt: 0 }]);
  });

  it("picks a half-finished action back up where it was left", () => {
    const stopped = run(
      awake(),
      { type: "START_ACTION", actionId: "documents" },
      { type: "CONTINUE_SEGMENT" },
      { type: "STOP_ACTION" },
    );
    const resumed = gameReducer(stopped, { type: "START_ACTION", actionId: "documents" });

    expect(resumed.clock).toBe(40);
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
    expect(options.map((option) => option.minutes)).toEqual([15, 25, 40]);
    expect(options.every((option) => option.available)).toBe(true);
  });

  it("lets the player pick a length that will not fit, and cuts it short", () => {
    // 07:40。次の予定まで20分しかないが、40分を選ぶこと自体は止めない。
    // 警告を出したうえで選ばせ、跨いだぶんは中断のルールが切る（設計書6章・8章）。
    const late = { ...withoutCall(awake()), clock: 100 };
    const options = durationOptions(late, findAction("documents")!);
    expect(options.map((option) => [option.minutes, option.available])).toEqual([
      [15, true],
      [25, false],
      [40, false],
    ]);

    const started = run(
      late,
      { type: "CHOOSE_ACTION", actionId: "documents" },
      { type: "START_ACTION", actionId: "documents", targetMinutes: 40 },
    );
    expect(started.mode.kind).toBe("action");
    expect(started.clock).toBe(115);
    expect(currentRun(started)?.targetMinutes).toBe(40);
  });

  it("treats the chosen length as a target, not a commitment", () => {
    // 30分と答えてから10分でやめる。払うのは10分だけ（設計書8章）。
    const after = run(
      awake(),
      { type: "CHOOSE_ACTION", actionId: "documents" },
      { type: "START_ACTION", actionId: "documents", targetMinutes: 40 },
      { type: "STOP_ACTION" },
    );

    expect(after.clock).toBe(15);
    expect(after.log).toEqual([{ label: "経済対策の資料を読む", minutes: 15, startedAt: 0 }]);
    expect(after.actionProgress.documents).toBe(1);
  });

  it("counts down to the target and then stops counting", () => {
    let state = run(
      awake(),
      { type: "CHOOSE_ACTION", actionId: "documents" },
      { type: "START_ACTION", actionId: "documents", targetMinutes: 25 },
    );
    expect(remainingToTarget(currentRun(state)!)).toBe(10);

    state = gameReducer(state, { type: "CONTINUE_SEGMENT" });
    expect(remainingToTarget(currentRun(state)!)).toBeNull();
    // 目安に届いても勝手には止まらない。まだ続けられる。
    expect(currentRun(state)?.exhausted).toBe(false);
  });
});

describe("moving around the dormitory", () => {
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
    // 07:50。出発まで5分しかないところに、15分の資料を開く。
    const state = gameReducer(
      { ...withoutCall(awake()), clock: 110 },
      { type: "START_ACTION", actionId: "documents" },
    );

    expect(state.clock).toBe(115);
    expect(currentRun(state)?.interrupted).toBe(true);
    expect(currentRun(state)?.minutesSpent).toBe(5);

    const stopped = gameReducer(state, { type: "STOP_ACTION" });
    expect(stopped.log[stopped.log.length - 1]).toEqual({
      label: "経済対策の資料を読む",
      minutes: 5,
      startedAt: 110,
    });
    // 読み切っていないので、あとで資料の続きから読める。
    expect(stopped.actionProgress.documents).toBe(0);
  });

  it("ends a fixed-frame appointment when it is scheduled to end, not when the player sat down", () => {
    let state = { ...withoutCall(awake()), clock: 114 };
    state = gameReducer(state, { type: "MOVE_TO", place: "corridor" });

    expect(state.mode).toMatchObject({ kind: "appointment", appointmentId: "departure" });

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    // 07:55からの5分。廊下へ一分歩いてから車に乗っても、終わりは08:00のまま。
    // 遅れがそのまま後ろへ伸びると、予定が並んだ一日で時間割が崩れていく。
    expect(state.clock).toBe(120);
    expect(state.highlights).toContain("官邸に入った。");
  });
});

describe("being taken to the 官邸", () => {
  it("carries the player across at 07:55 without asking", () => {
    // 07:50、宿舎のリビングにいる。予定は待ってくれない。
    let state = { ...withoutCall(at(awake(), "living")), clock: 110 };
    state = gameReducer(state, { type: "START_ACTION", actionId: "breakfast" });
    state = gameReducer(state, { type: "STOP_ACTION" });

    expect(state.mode).toMatchObject({ kind: "appointment", appointmentId: "departure" });
    expect(state.place).toBe("living");

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    expect(state.clock).toBe(120);
    expect(state.place).toBe("entrance");
    expect(state.highlights).toContain("官邸に入った。");
  });

  it("gives the 官邸 something to do, and no way to wander back", () => {
    const here = actionsAt("office").map((action) => action.id);
    expect(here.length).toBeGreaterThan(0);
    expect(here).toContain("documents");
    // 議員宿舎へ歩いて戻る道はプレイヤーには開いていない。
    expect(gameReducer({ ...awake(), place: "office" }, { type: "MOVE_TO", place: "living" }).place).toBe(
      "office",
    );
  });
});

describe("a meeting, which fills its frame and no more", () => {
  /** 08:00のぶら下がりの直前。次の一手で席につくことになる。 */
  function upToTheGaggle() {
    return {
      ...resolved(withoutCall(at(awake(), "entrance")), "departure"),
      clock: 119,
    };
  }

  it("opens the appointment as a scene, not as a wall of text", () => {
    const state = gameReducer(upToTheGaggle(), { type: "MOVE_TO", place: "office" });

    expect(state.mode).toMatchObject({
      kind: "meeting",
      appointmentId: "gaggle",
      stage: "opening",
      taken: [],
    });
  });

  it("spends the frame on what the player chooses, and ends when the player stands up", () => {
    let state = gameReducer(upToTheGaggle(), { type: "MOVE_TO", place: "office" });
    state = gameReducer(state, { type: "MEETING_BEGIN" });

    expect(state.mode).toMatchObject({ kind: "meeting", stage: "choices" });
    // 落とし穴3の回帰: 会議中の予定は自分自身を天井にするので、区切りで即座に
    // 切られたりはしない。
    expect(offeredChoices(state).every((candidate) => candidate.fits)).toBe(true);

    state = gameReducer(state, { type: "MEETING_CHOOSE", choiceId: "gaggle-economy" });
    expect(state.clock).toBe(125);
    expect(state.flags).toContain("spoke-on-economy");
    expect(state.mode).toMatchObject({ kind: "meeting", stage: "reply", showing: "gaggle-economy" });

    // 席を立てば、そこで終わる。枠の残りを待つ必要はない（本セッションでの決定）。
    state = gameReducer(state, { type: "MEETING_BACK" });
    state = gameReducer(state, { type: "END_MEETING" });
    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });

    expect(state.clock).toBe(125);
    expect(resolvedIds(state)).toContain("gaggle");
  });

  it("lets a meeting run past its frame, but never into the next appointment", () => {
    // 08:00のぶら下がりは枠10分。次は08:20のミーティングなので、
    // 08:10までしか延ばせない（次の予定の10分前、設計上の余白）。
    let state = gameReducer(upToTheGaggle(), { type: "MOVE_TO", place: "office" });
    state = gameReducer(state, { type: "MEETING_BEGIN" });

    expect(meetingCeiling(state)).toBe(130);

    for (let guard = 0; guard < 10; guard += 1) {
      if (state.mode.kind !== "meeting") break;
      if (state.mode.stage === "reply") {
        state = gameReducer(state, { type: "MEETING_BACK" });
        continue;
      }
      const next = offeredChoices(state).find((candidate) => candidate.fits);
      if (!next) break;
      state = gameReducer(state, { type: "MEETING_CHOOSE", choiceId: next.choice.id });
    }

    expect(state.clock).toBeLessThanOrEqual(130);
  });

  it("lets the last meeting of the day run as long as the player wants", () => {
    // 予定が後ろに無ければ天井は一日の終わり。総理が切り上げると言うまで続く。
    const alone = {
      ...resolved(
        withoutCall(at(awake(), "office")),
        "departure",
        "gaggle",
        "morning-meeting",
        "cabinet",
        "party-leaders",
        "lunch",
        "security",
        "foreign",
        "return",
      ),
      clock: 599,
    };
    const sat = gameReducer(alone, { type: "MOVE_TO", place: "secretariat" });

    expect(sat.mode).toMatchObject({ kind: "meeting", appointmentId: "cao" });
    expect(meetingCeiling(sat)).toBe(DAY_LENGTH);
  });

  it("keeps the topics that do not fit on the table, greyed out", () => {
    let state = gameReducer(upToTheGaggle(), { type: "MOVE_TO", place: "office" });
    state = gameReducer(state, { type: "MEETING_BEGIN" });
    state = gameReducer(state, { type: "MEETING_CHOOSE", choiceId: "gaggle-economy" });
    state = gameReducer(state, { type: "MEETING_BACK" });

    const offered = offeredChoices(state);
    // 残り5分。5分の話題は選べて、それ以上のものは見えているが選べない。
    expect(offered.some((candidate) => candidate.fits)).toBe(true);
    expect(offered.every((candidate) => candidate.choice.minutes <= 5 || !candidate.fits)).toBe(true);
    // 一度選んだ話題は二度は出ない。
    expect(offered.map((candidate) => candidate.choice.id)).not.toContain("gaggle-economy");
  });

  it("opens the party leaders up to a reader and closes it to everyone else", () => {
    // 設計書8章。朝に資料を読んだかどうかが、ここで初めて形になって出る。
    const sat = (flags: string[]) =>
      gameReducer(
        {
          ...resolved(
            withoutCall(at(awake(), "office")),
            "departure",
            "gaggle",
            "morning-meeting",
            "cabinet",
          ),
          clock: 299,
          flags,
        },
        { type: "MOVE_TO", place: "secretariat" },
      );

    const read = gameReducer(sat(["read-economic-papers"]), { type: "MEETING_BEGIN" });
    const unread = gameReducer(sat([]), { type: "MEETING_BEGIN" });

    const idsOf = (state: typeof read) => offeredChoices(state).map((c) => c.choice.id);

    expect(idsOf(read)).toContain("party-figures");
    expect(idsOf(read)).not.toContain("party-delegate");
    expect(idsOf(read)).not.toContain("party-later");

    expect(idsOf(unread)).not.toContain("party-figures");
    expect(idsOf(unread)).toContain("party-delegate");
    expect(idsOf(unread)).toContain("party-later");
  });
});

describe("the call that arrives on its own", () => {
  /** 09:17の着信の五分前。執務室にいて、次の一区切りで受け取ることになる。 */
  function upToTheCall() {
    return {
      ...resolved(at(awake(), "office"), "departure", "gaggle", "morning-meeting"),
      clock: 192,
    };
  }

  it("does not cut the segment short the way an appointment does", () => {
    // 15分の資料を開く。着信はその途中に来るが、区切りまでは切られない。
    const state = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "documents" });

    expect(state.clock).toBe(207);
    expect(currentRun(state)?.interrupted).toBe(false);
    expect(currentRun(state)?.minutesSpent).toBe(15);
  });

  it("rings at the end of the segment, over the action the player was in", () => {
    const state = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "sns" });

    expect(state.mode).toMatchObject({
      kind: "interrupt",
      interruptId: "indicator",
      answered: false,
      resume: { kind: "action" },
    });
  });

  it("pulls the party leaders forward to 10:45 whichever way the player answers", () => {
    expect(awake().appointments.find((a) => a.id === "party-leaders")?.at).toBe(300);

    for (const choice of ["answer", "defer", "ignore"] as const) {
      const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "documents" });
      const answered = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice });

      expect(answered.appointments.find((a) => a.id === "party-leaders")?.at).toBe(285);
      expect(answered.highlights.some((line) => line.includes("10:45"))).toBe(true);
    }
  });

  it("goes back to the same action when the player puts it off, and leaves it on the phone", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "documents" });
    const before = currentRun(rung)!;

    const deferred = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "defer" });

    expect(deferred.clock).toBe(207);
    expect(deferred.mode.kind).toBe("action");
    expect(currentRun(deferred)).toEqual(before);
    expect(deferred.phone.messages).toHaveLength(1);
    expect(deferred.phone.messages[0].from).toBe("篠塚");
    expect(deferred.flags).toContain("deferred-the-call");
  });

  it("leaves nothing to read when the player ignores it", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "documents" });
    const ignored = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "ignore" });

    expect(ignored.clock).toBe(207);
    expect(ignored.mode.kind).toBe("action");
    expect(ignored.phone.messages).toHaveLength(0);
    expect(ignored.flags).toContain("ignored-the-call");
  });

  it("ends the action and spends the minutes when the player takes it", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "documents" });
    const answered = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "answer" });

    expect(answered.clock).toBe(217);
    expect(answered.mode).toMatchObject({ kind: "interrupt", answered: true });
    // 手を止めた行動は、そこまでの分がきちんと記録される。
    expect(answered.log.map((entry) => entry.label)).toContain("経済対策の資料を読む");
    expect(answered.log[answered.log.length - 1]).toEqual({
      label: "篠塚からの連絡",
      minutes: 10,
      startedAt: 207,
    });
    expect(answered.actionProgress.documents).toBe(1);

    // 09:27。閉じた先はまだ自由時間で、閣議まではもう少しある。
    const closed = gameReducer(answered, { type: "CLOSE_INTERRUPT" });
    expect(closed.mode.kind).toBe("place");
  });

  it("only rings once, whatever else happens", () => {
    const rung = gameReducer(upToTheCall(), { type: "START_ACTION", actionId: "documents" });
    let state = gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "defer" });
    state = gameReducer(state, { type: "STOP_ACTION" });

    expect(state.interrupts.every((item) => item.fired)).toBe(true);
    expect(state.mode.kind).not.toBe("interrupt");
  });
});

describe("talking to people", () => {
  it("only offers whoever is actually within reach", () => {
    // 06:00の寝室。誰もいないので、掛かる相手だけが並ぶ。
    const inBed = reachableFrom(awake());
    expect(inBed.every((entry) => entry.reach === "phone")).toBe(true);
    expect(inBed.map((entry) => entry.tree.id)).toContain("sawatari");

    // リビングには妻がいる。次男は07:00を過ぎてから起きてくる。
    const living = reachableFrom(at(awake(), "living"));
    expect(living.find((entry) => entry.tree.id === "wife")?.reach).toBe("here");
    expect(living.find((entry) => entry.tree.id === "son")?.reach).not.toBe("here");

    const later = reachableFrom({ ...at(awake(), "living"), clock: 65 });
    expect(later.find((entry) => entry.tree.id === "son")?.reach).toBe("here");
  });

  it("puts the secretaries in the secretaries' room, and lets the office call them in", () => {
    // 秘書官室にいる相手は、電話ではなくその場で話せる（本セッションでの決定）。
    const secretariat = reachableFrom({ ...at(awake(), "secretariat"), clock: 300 });
    expect(secretariat.find((entry) => entry.tree.id === "sawatari")?.reach).toBe("here");
    expect(secretariat.find((entry) => entry.tree.id === "shinozuka")?.reach).toBe("here");

    // 執務室からは呼べる。来るまでの三分はこちらが払う。
    const office = { ...at(awake(), "office"), clock: 300 };
    expect(reachableFrom(office).find((entry) => entry.tree.id === "sawatari")?.reach).toBe("summon");

    const called = gameReducer(office, { type: "OPEN_TALK", treeId: "sawatari" });
    expect(called.clock).toBe(303);
    expect(called.mode).toMatchObject({ kind: "talk", treeId: "sawatari", startedAt: 303 });
  });

  it("puts reporters in the entrance, all day", () => {
    // 官邸3階エントランス。ぶら下がりの時間でなくても記者はいる。
    const entrance = reachableFrom({ ...at(awake(), "entrance"), clock: 300 });
    expect(entrance.find((entry) => entry.tree.id === "press")?.reach).toBe("here");

    // 執務室に記者は入ってこないし、電話も掛からない。
    const office = reachableFrom({ ...at(awake(), "office"), clock: 300 });
    expect(office.map((entry) => entry.tree.id)).not.toContain("press");
  });

  it("writes one row for the whole conversation, not one per topic", () => {
    const after = run(
      awake(),
      { type: "OPEN_TALK", treeId: "sawatari" },
      { type: "TALK_GOTO", nodeId: "consult" },
      { type: "TALK_CHOOSE", choiceId: "consult-party" },
      { type: "TALK_BACK" },
      { type: "TALK_CHOOSE", choiceId: "consult-me" },
      { type: "TALK_BACK" },
      { type: "END_TALK" },
    );

    expect(after.clock).toBe(20);
    expect(after.log).toEqual([{ label: "沢渡と話した", minutes: 20, startedAt: 0 }]);
  });

  it("will not let the same question be asked twice", () => {
    const asked = run(
      awake(),
      { type: "OPEN_TALK", treeId: "sawatari" },
      { type: "TALK_GOTO", nodeId: "consult" },
      { type: "TALK_CHOOSE", choiceId: "consult-party" },
      { type: "TALK_BACK" },
    );

    expect(asked.talkProgress.sawatari).toContain("consult-party");

    const again = gameReducer(asked, { type: "TALK_CHOOSE", choiceId: "consult-party" });
    expect(again.clock).toBe(asked.clock);
    expect(again.mode).toEqual(asked.mode);
  });

  it("keeps a topic out of reach until the player knows enough to ask it", () => {
    // 設計書27章。朝刊のベタ記事に気づいて初めて、沢渡に振れる話題が増える。
    const tree = findTree("sawatari")!;
    const consult = tree.nodes.find((node) => node.id === "consult")!;

    const before = awake();
    expect(choicesAt(before, tree, consult).map((choice) => choice.id)).not.toContain(
      "consult-report",
    );

    const informed = { ...before, flags: ["knows-the-objection"] };
    expect(choicesAt(informed, tree, consult).map((choice) => choice.id)).toContain(
      "consult-report",
    );
  });

  it("opens that topic up by reading the morning paper all the way through", () => {
    const read = playThrough(awake(), "news");
    expect(read.flags).toContain("knows-the-objection");
  });

  it("ends the conversation when an appointment cuts a reply short", () => {
    // 07:50。出発まで5分しかないところに10分の返事。
    const state = run(
      { ...withoutCall(awake()), clock: 110 },
      { type: "OPEN_TALK", treeId: "shinozuka" },
      { type: "TALK_GOTO", nodeId: "consult" },
      { type: "TALK_CHOOSE", choiceId: "consult-opinion" },
    );

    expect(state.clock).toBe(115);
    expect(currentRun(state)?.interrupted).toBe(true);

    const after = gameReducer(state, { type: "TALK_BACK" });
    expect(after.log[after.log.length - 1]).toEqual({
      label: "篠塚と話した",
      minutes: 5,
      startedAt: 110,
    });
    expect(after.mode).toMatchObject({ kind: "appointment", appointmentId: "departure" });
  });
});

describe("reading what was put off", () => {
  /** 着信を後回しにして、要点だけがメッセージで残っている状態を作る。 */
  function deferredTheCall() {
    const rung = gameReducer(
      {
        ...resolved(at(awake(), "office"), "departure", "gaggle", "morning-meeting"),
        clock: 192,
      },
      { type: "START_ACTION", actionId: "documents" },
    );
    return gameReducer(gameReducer(rung, { type: "ANSWER_INTERRUPT", choice: "defer" }), {
      type: "STOP_ACTION",
    });
  }

  it("charges for reading it, so putting it off is not a free way to hear it", () => {
    let state = deferredTheCall();

    expect(state.flags).not.toContain("knows-the-indicator");
    const before = state.clock;

    state = gameReducer(state, { type: "READ_MESSAGE", messageId: "indicator" });

    expect(state.clock).toBe(before + 5);
    expect(state.flags).toContain("knows-the-indicator");
    expect(state.phone.messages[0].read).toBe(true);
    expect(state.log[state.log.length - 1].label).toBe("篠塚からのメッセージ");
  });

  it("does not read the same message twice", () => {
    const state = gameReducer(deferredTheCall(), { type: "READ_MESSAGE", messageId: "indicator" });

    const again = gameReducer(state, { type: "READ_MESSAGE", messageId: "indicator" });
    expect(again.clock).toBe(state.clock);
  });
});

describe("the whole day", () => {
  /** 会議は「入って、入るだけ聞いて、締める」。予定を必ず枠ぴったりで終える。 */
  function sitThroughMeeting(state: GameState): GameState {
    let next = gameReducer(state, { type: "MEETING_BEGIN" });
    for (let guard = 0; guard < 20; guard += 1) {
      if (next.mode.kind !== "meeting") break;
      if (next.mode.stage === "reply") {
        next = gameReducer(next, { type: "MEETING_BACK" });
        continue;
      }
      if (next.mode.stage === "closing") break;
      const topic = offeredChoices(next).find((candidate) => candidate.fits);
      if (!topic) break;
      next = gameReducer(next, { type: "MEETING_CHOOSE", choiceId: topic.choice.id });
    }
    next = gameReducer(next, { type: "END_MEETING" });
    return gameReducer(next, { type: "RESOLVE_APPOINTMENT" });
  }

  /** 手が空いているあいだは、その場でできることを片端からやる。 */
  function playUntilStuck(): GameState {
    let state = awake();
    for (let guard = 0; guard < 400 && state.phase === "day"; guard += 1) {
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
      if (state.mode.kind === "meeting") {
        state = sitThroughMeeting(state);
        continue;
      }
      if (state.mode.kind === "appointment") {
        state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
        continue;
      }
      const available = actionsAt(state.place, state.clock).find(
        (action) => !state.spentActions.includes(action.id),
      );
      // 一日ぶんの行動はまだ揃っていない。尽きたらそこで止める。
      if (!available) break;
      state = playThrough(state, available.id);
    }
    return state;
  }

  /** できることが尽きたら、次の予定の一分前まで待つ。予定は待っていれば来る。 */
  function playUntilReview(): GameState {
    let state = awake();
    for (let guard = 0; guard < 800 && state.phase === "day"; guard += 1) {
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
      if (state.mode.kind === "meeting") {
        state = sitThroughMeeting(state);
        continue;
      }
      if (state.mode.kind === "appointment") {
        state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
        continue;
      }
      // 予定が尽きたら寝床へ向かう。繰り返せる行動があるので、そうしないと
      // いつまでも夜が続いて24:00に閉じられてしまう。
      if (state.appointments.every((appointment) => appointment.resolved)) {
        if (canGoToBed(state)) {
          state = gameReducer(state, { type: "GO_TO_BED" });
          continue;
        }
        const stepped = waitForNextAppointment(state);
        if (stepped.clock !== state.clock) {
          state = stepped;
          continue;
        }
        break;
      }
      const available = actionsAt(state.place, state.clock).find(
        (action) => !state.spentActions.includes(action.id),
      );
      if (available) {
        state = playThrough(state, available.id);
        continue;
      }
      const before = state.clock;
      state = waitForNextAppointment(state);
      // 予定も尽き、寝床にも辿り着けないなら、そこで止める。
      if (state.clock === before) break;
    }
    return state;
  }

  it("accounts for every minute it spends", () => {
    const state = playUntilStuck();

    // 一日を最後まで埋めるコンテンツはまだないが、使った分は必ずログに残る。
    expect(state.clock).toBeGreaterThan(180);
    expect(totalLogged(state)).toBe(state.clock);
  });

  it("ends the day in bed, once there is nothing left on the schedule", () => {
    const state = playUntilReview();

    expect(state.phase).toBe("review");
    expect(state.sleep).not.toBeNull();
    expect(state.sleep?.forced).toBe(false);
    // 帰る時刻は自分で決める。18:00より前に寝ることはない。
    expect(state.clock).toBeGreaterThanOrEqual(720);
    expect(state.clock).toBeLessThanOrEqual(DAY_LENGTH);
    expect(state.flags).toContain("left-the-kantei");
  });

  it("closes the day at midnight for a player who never stops", () => {
    // 夜の行動には繰り返せるものがあるので、続けようと思えば続けられる。
    // 続けたぶんは、翌朝に持ち越す疲労になって返ってくる。
    let awakeAll = awake();
    for (let guard = 0; guard < 800 && awakeAll.phase === "day"; guard += 1) {
      if (awakeAll.mode.kind === "interrupt") {
        awakeAll = awakeAll.mode.answered
          ? gameReducer(awakeAll, { type: "CLOSE_INTERRUPT" })
          : gameReducer(awakeAll, { type: "ANSWER_INTERRUPT", choice: "answer" });
        continue;
      }
      if (awakeAll.mode.kind === "duration") {
        awakeAll = gameReducer(awakeAll, { type: "CANCEL_DURATION" });
        continue;
      }
      if (awakeAll.mode.kind === "meeting") {
        awakeAll = sitThroughMeeting(awakeAll);
        continue;
      }
      if (awakeAll.mode.kind === "appointment") {
        awakeAll = gameReducer(awakeAll, { type: "RESOLVE_APPOINTMENT" });
        continue;
      }
      const next = actionsAt(awakeAll.place, awakeAll.clock).find(
        (action) => !awakeAll.spentActions.includes(action.id),
      );
      if (next) {
        awakeAll = playThrough(awakeAll, next.id);
        continue;
      }
      const before = awakeAll.clock;
      awakeAll = waitForNextAppointment(awakeAll);
      if (awakeAll.clock === before) break;
    }

    expect(awakeAll.phase).toBe("review");
    expect(awakeAll.clock).toBe(DAY_LENGTH);
    expect(awakeAll.sleep).toMatchObject({ forced: true });
  });

  it("gets the call and every appointment in, however the time was spent", () => {
    const state = playUntilReview();

    expect(state.interrupts.every((item) => item.fired)).toBe(true);
    expect(state.appointments.every((appointment) => appointment.resolved)).toBe(true);
    expect(state.log.some((entry) => entry.label.includes("閣議"))).toBe(true);
  });

  it("never lets a meeting push the next appointment", () => {
    const state = playUntilReview();

    for (const appointment of state.appointments) {
      const next = state.appointments.find((other) => other.at > appointment.at);
      if (!next) continue;
      expect(appointment.at + appointment.minutes).toBeLessThanOrEqual(next.at);
    }
  });

  it("puts the day back to 06:00 when it is restarted", () => {
    const restarted = gameReducer(playUntilStuck(), { type: "RESTART_DAY" });

    expect(restarted.clock).toBe(0);
    expect(restarted.phase).toBe("day");
    expect(restarted.log).toHaveLength(0);
    expect(restarted.highlights).toHaveLength(0);
    expect(restarted.place).toBe("bedroom");
    expect(restarted.mode.kind).toBe("wake");
  });
});

describe("同じ人が、朝と夜で同じことを言わない", () => {
  it("gives the wife a different conversation once the day is over", () => {
    const tree = findTree("wife")!;

    const morning = nodeOf(tree, "root", [])!;
    const evening = nodeOf(tree, "root", ["left-the-kantei"])!;

    expect(morning.prompt).not.toBe(evening.prompt);
    expect(morning.choices.map((choice) => choice.id)).not.toEqual(
      evening.choices.map((choice) => choice.id),
    );
  });

  it("offers the evening topics only after the player has come home", () => {
    const beforeGoing = { ...at(awake(), "living"), clock: 60 };
    const tree = findTree("wife")!;
    const node = nodeOf(tree, "root", beforeGoing.flags)!;

    expect(choicesAt(beforeGoing, tree, node).map((c) => c.id)).not.toContain("evening-today");

    const home = { ...at(awake(), "living"), clock: 900, flags: ["left-the-kantei"] };
    const evening = nodeOf(tree, "root", home.flags)!;
    expect(choicesAt(home, tree, evening).map((c) => c.id)).toContain("evening-today");
  });
});
