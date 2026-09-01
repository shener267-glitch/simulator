import { useGameState, useGameDispatch } from "../../state/GameContext";
import { formatDate } from "../../engine/calendar";

const TITLES: Record<string, string> = {
  gameover_resignation: "総理辞任",
  gameover_dissolution: "解散・総選挙敗北",
  gameover_scandal: "スキャンダルによる総辞職",
};

export function GameOverScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const title = TITLES[state.status] ?? "内閣総辞職";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-rose-400">{title}</h1>
      <p className="text-slate-300">{state.gameOverReason}</p>
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-left text-sm text-slate-300">
        <p>在任日数: {state.date.dayIndex} 日({formatDate(state.date)}まで)</p>
        <p>最終支持率: {Math.round(state.stats.approvalRating)}%</p>
        <p>財政: {state.stats.treasuryBalance.toFixed(1)} 兆円</p>
        <p>党内結束: {Math.round(state.stats.partyUnity)}</p>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "NEW_GAME" })}
        className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
      >
        もう一度プレイする
      </button>
    </div>
  );
}
