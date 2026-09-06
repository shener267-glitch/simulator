import type { CategoryId, GameState } from "../types/game";
import type { Speed } from "../types/gameTime";
import { advanceOneMinute, minutesPerTick } from "../engine/gameTime";

export type GameAction =
  /** タイトル画面から国家選択画面へ。 */
  | { type: "START" }
  /** 国家選択画面で、プレビューする国を変える。時間は動かない。 */
  | { type: "SELECT_COUNTRY"; id: string }
  /** 選んだ国でゲームを開始する。 */
  | { type: "BEGIN_GAME" }
  /** メイン画面の地図をクリックして国家情報を覗く。idがnullなら閉じる。 */
  | { type: "INSPECT_COUNTRY"; id: string | null }
  /** 下部メニューのカテゴリを開閉する。idがnullなら閉じる。 */
  | { type: "OPEN_CATEGORY"; id: CategoryId | null }
  /** 速度を変える。0は一時停止（指示書5章）。 */
  | { type: "SET_SPEED"; speed: Speed }
  /** 一分ずつ、最大speed分だけ時間を進める。 */
  | { type: "TICK" };

function tick(state: GameState): GameState {
  if (state.phase !== "playing" || state.gameTime.speed === 0) return state;
  const steps = minutesPerTick(state.gameTime.speed);
  let time = state.gameTime;
  for (let i = 0; i < steps; i++) time = advanceOneMinute(time);
  return { ...state, gameTime: time };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return state.phase === "title" ? { ...state, phase: "select" } : state;

    case "SELECT_COUNTRY":
      return state.phase === "select" ? { ...state, selectedCountryId: action.id } : state;

    case "BEGIN_GAME":
      return state.phase === "select"
        ? { ...state, phase: "playing", playerCountryId: state.selectedCountryId }
        : state;

    case "INSPECT_COUNTRY":
      return state.phase === "playing" ? { ...state, inspectingCountryId: action.id } : state;

    case "OPEN_CATEGORY":
      return state.phase === "playing" ? { ...state, activeCategory: action.id } : state;

    case "SET_SPEED":
      return state.phase === "playing"
        ? { ...state, gameTime: { ...state.gameTime, speed: action.speed } }
        : state;

    case "TICK":
      return tick(state);

    default:
      return state;
  }
}
