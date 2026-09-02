import type { GameState } from "../src/types/game";
import type { SegmentRun } from "../src/types/mode";
import type { PlaceId } from "../src/types/place";
import { runOf } from "../src/types/mode";
import { gameReducer, type GameAction } from "../src/state/gameReducer";
import { createInitialState } from "../src/state/initialState";

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
