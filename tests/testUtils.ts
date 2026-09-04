import type { GameState } from "../src/types/game";
import type { SegmentRun } from "../src/types/mode";
import type { PlaceId } from "../src/types/place";
import { runOf } from "../src/types/mode";
import { gameReducer, type GameAction } from "../src/state/gameReducer";
import { createInitialState } from "../src/state/initialState";
import { neighboursOf } from "../src/data/places";
import { applyElapsed } from "../src/engine/condition";

export function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

/** The morning as the player actually meets it: past the 05:00 wake-up. */
export function awake(): GameState {
  return run(createInitialState(), { type: "FINISH_WAKE" });
}

/**
 * 移動の一分を払わずに立ち位置だけ変える。場所ごとの行動を試すテストで、
 * 時計を動かさずに現在地だけ揃えたいときに使う。
 */
export function at(state: GameState, place: PlaceId): GameState {
  return { ...state, place };
}

export function currentRun(state: GameState): SegmentRun | null {
  return runOf(state.mode);
}

/** 指定の予定を済ませたことにする。あとの時間帯だけを試したいとき用。 */
export function resolved(state: GameState, ...ids: string[]): GameState {
  return {
    ...state,
    appointments: state.appointments.map((appointment) =>
      ids.includes(appointment.id) ? { ...appointment, resolved: true } : appointment,
    ),
  };
}

/** 06:10の着信をすでに済ませたことにする。予定に切られる側だけを見たいとき用。 */
export function withoutCall(state: GameState): GameState {
  return { ...state, interrupts: state.interrupts.map((item) => ({ ...item, fired: true })) };
}

/** Play one action from start to finish, or until something cuts it short. */
export function playThrough(state: GameState, actionId: string): GameState {
  let next = gameReducer(state, { type: "START_ACTION", actionId });
  for (let guard = 0; guard < 50; guard += 1) {
    // 連絡が鳴ったら、そこで手が止まる。答えるのは呼び出した側の仕事。
    if (next.mode.kind === "interrupt") return next;
    const active = currentRun(next);
    if (!active || active.exhausted || active.interrupted) break;
    const before = next.clock;
    next = gameReducer(next, { type: "CONTINUE_SEGMENT" });
    if (next.clock === before) break;
  }
  return gameReducer(next, { type: "STOP_ACTION" });
}

export function totalLogged(state: GameState): number {
  return state.log.reduce((sum, entry) => sum + entry.minutes, 0);
}

/** 済んだ予定のid。予定が動いても順番で数えなくて済むように。 */
export function resolvedIds(state: GameState): string[] {
  return state.appointments.filter((appointment) => appointment.resolved).map((a) => a.id);
}

/**
 * できることが尽きた時間を飛ばす。次の予定の一分前まで時計を進めて、
 * 一分歩いて席につく — 待つという行動がまだゲームに無いので、テストでだけ使う。
 */
export function waitForNextAppointment(state: GameState): GameState {
  const pending = state.appointments.filter((appointment) => !appointment.resolved);
  const step = neighboursOf(state.place)[0];
  if (!step) return state;
  // 予定が尽きていたら、あとは寝るだけ。寝室まで一部屋ずつ歩く。
  if (pending.length === 0) {
    return gameReducer(state, { type: "MOVE_TO", place: towardsBedroom(state.place) });
  }
  const next = pending.reduce((soonest, a) => (a.at < soonest.at ? a : soonest));
  const clock = Math.max(state.clock, next.at - 1);
  // 待つあいだも腹は減るし疲れる。ここを飛ばすと「何もしない」が得になる。
  const waited: GameState = {
    ...state,
    clock,
    condition: applyElapsed(state.condition, clock - state.clock, clock),
  };
  return gameReducer(waited, { type: "MOVE_TO", place: step.id });
}

/** 寝室へ向かう次の一歩。宿舎は廊下がハブなので、二手で必ず着く。 */
function towardsBedroom(from: PlaceId): PlaceId {
  if (from === "bedroom") return "bedroom";
  return neighboursOf(from).some((place) => place.id === "bedroom") ? "bedroom" : "corridor";
}
