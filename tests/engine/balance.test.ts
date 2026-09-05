import { describe, expect, it } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { actionsAt } from "../../src/engine/places";
import { offeredChoices } from "../../src/engine/meeting";
import { blockedBecause } from "../../src/engine/actions";
import { canGoToBed } from "../../src/engine/sleep";
import { fatigueFloor } from "../../src/engine/condition";
import { findAction } from "../../src/data/actions";
import { DAY_LENGTH } from "../../src/types/clock";
import { PLACE_ORDER, neighboursOf } from "../../src/data/places";
import type { PlaceId } from "../../src/types/place";
import { awake, playThrough, waitForNextAppointment } from "../testUtils";
import type { GameState } from "../../src/types/game";

/**
 * その行動ができる部屋へ向かう次の一歩。宿舎は廊下、官邸はエントランスが
 * ハブなので、二手で必ず着く。建物をまたぐ道は開いていない。
 */
function stepToward(from: PlaceId, targets: PlaceId[]): PlaceId | null {
  if (targets.includes(from)) return null;
  const here = neighboursOf(from).map((place) => place.id);
  const direct = targets.find((target) => here.includes(target));
  if (direct) return direct;
  const hub = here.includes("corridor") ? "corridor" : here.includes("entrance") ? "entrance" : null;
  return hub && !targets.includes(from) ? hub : null;
}

/** 会議は枠いっぱいまで聞いて締める。 */
function sitThrough(state: GameState): GameState {
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

interface DayResult {
  end: GameState;
  peakFatigue: number;
  peakHunger: number;
  lowestFatigue: number;
  /** 官邸を出た時点の状態。二つの遊び方を、同じ出来事の地点で比べるために取る。 */
  atReturn: { fatigue: number; hunger: number } | null;
}

/**
 * 好みの順に行動を選んで一日を通す。予定が尽きたら寝る。
 * 「三食と仮眠を取れば保つ」を確かめるための道具（設計書24章）。
 */
function playDay(preference: string[], bedtime = 960): DayResult {
  let state = awake();
  let peakFatigue = 0;
  let peakHunger = 0;
  let lowestFatigue = 100;
  let atReturn: DayResult["atReturn"] = null;

  for (let guard = 0; guard < 900 && state.phase === "day"; guard += 1) {
    peakFatigue = Math.max(peakFatigue, state.condition.fatigue);
    peakHunger = Math.max(peakHunger, state.condition.hunger);
    lowestFatigue = Math.min(lowestFatigue, state.condition.fatigue);
    if (atReturn === null && state.flags.includes("left-the-kantei")) {
      atReturn = { fatigue: state.condition.fatigue, hunger: state.condition.hunger };
    }

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
      state = sitThrough(state);
      continue;
    }
    if (state.mode.kind === "appointment") {
      state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
      continue;
    }
    if (state.appointments.every((appointment) => appointment.resolved) && state.clock >= bedtime) {
      if (canGoToBed(state)) {
        state = gameReducer(state, { type: "GO_TO_BED" });
        continue;
      }
      const stepped = waitForNextAppointment(state);
      if (stepped.clock === state.clock) break;
      state = stepped;
      continue;
    }

    // 好みの順に上から見る。済んだものと、いまの時間には無いものは飛ばす。
    // 部屋が違うだけなら、そこまで歩く — 朝食は居間にしかない。
    const wanted = preference.map(findAction).find((action) => {
      const blocked = action && blockedBecause(state, action);
      return action && blocked !== "spent" && blocked !== "time";
    });
    if (wanted && !blockedBecause(state, wanted)) {
      state = playThrough(state, wanted.id);
      continue;
    }
    // 行きたい先が別の部屋なら、一部屋ぶん歩く。移動にも一分かかる。
    if (wanted) {
      const step = stepToward(state.place, wanted.places);
      if (step) {
        state = gameReducer(state, { type: "MOVE_TO", place: step });
        continue;
      }
    }
    const before = state.clock;
    state = waitForNextAppointment(state);
    if (state.clock === before) break;
  }

  return { end: state, peakFatigue, peakHunger, lowestFatigue, atReturn };
}

/** 仕事もするが、食べるし休む。いちばん普通の一日。 */
const STEADY = [
  "ready", "shower", "breakfast", "documents", "news", "notes", "sign", "press",
  "dinner", "bath", "news-evening", "prepare", "family", "sns", "tea", "nap", "idle",
];

/** 食べない。休まない。仕事だけをして一日を終える。 */
const RELENTLESS = ["ready", "documents", "notes", "sign", "press", "news", "prepare", "sns"];

describe("一日を通したバランス", () => {
  it("keeps a steady day inside the meter at both ends", () => {
    const { end, peakFatigue, peakHunger } = playDay(STEADY);

    expect(end.phase).toBe("review");
    // 三食と仮眠を取れば、限界にも空腹の振り切れにも達しない（設計書24章）。
    expect(peakFatigue).toBeLessThan(100);
    expect(peakHunger).toBeLessThan(100);
    // かといって万全でもない。一日ぶんは必ず残る。
    expect(end.condition.fatigue).toBeGreaterThan(20);
  });

  it("makes a day without food or rest cost something", () => {
    const relentless = playDay(RELENTLESS);
    const steady = playDay(STEADY);

    // 朝食を抜いた側は、昼までにはっきり腹が減る。昼食で両方とも戻るので、
    // 差が出るのは戻る前 — いちばん減ったところで比べる。
    expect(relentless.peakHunger).toBeGreaterThan(steady.peakHunger);
    // 疲労は戻しきれない。官邸を出た時点で、同じ時刻の同じ地点で差が残る。
    expect(relentless.atReturn!.fatigue).toBeGreaterThan(steady.atReturn!.fatigue);
  });

  it("will not let rest undo the hours themselves", () => {
    // 仮眠も入浴も何度でもできる。床がないと、夜に万全の総理が作れてしまう。
    const { end, lowestFatigue } = playDay(["nap", "idle", "tea", "bath", "idle"]);

    expect(end.condition.fatigue).toBeGreaterThanOrEqual(fatigueFloor(end.clock));
    expect(lowestFatigue).toBeGreaterThanOrEqual(0);
    expect(end.condition.fatigue).toBeGreaterThan(20);
  });

  it("leaves something to do in every room, at every hour it can be reached", () => {
    // 自由時間は合わせて九時間近くある。どこかの部屋が空だと、そこで手が止まる。
    for (const place of PLACE_ORDER) {
      for (const clock of [0, 300, 700, 900]) {
        const here = actionsAt(place, clock);
        // 官邸は20:00で閉まり、宿舎は日中は無人になる。行ける時間だけを見る。
        const reachable = clock < 840 ? place !== "living" || clock < 120 : true;
        if (!reachable) continue;
        expect(here.length, `${place} の ${clock}分 に何もない`).toBeGreaterThan(0);
      }
    }
  });

  it("has enough to do that the evening is not spent waiting for midnight", () => {
    // 帰ってから寝るまでを、行動で埋めきれること。
    const { end } = playDay(STEADY);
    const leftAt = end.log.find((entry) => entry.label === "官邸発")?.startedAt ?? 0;

    expect(leftAt).toBeGreaterThanOrEqual(720);
    expect(end.clock).toBeGreaterThan(leftAt + 120);
    expect(end.clock).toBeLessThanOrEqual(DAY_LENGTH);
    expect(end.sleep?.forced).toBe(false);
    // 夜の記録が、帰宅の一行だけということにはならない。
    const night = end.log.filter((entry) => entry.startedAt >= leftAt);
    expect(night.length).toBeGreaterThan(3);
  });
});
