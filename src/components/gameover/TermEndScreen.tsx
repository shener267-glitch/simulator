import { useGameState, useGameDispatch } from "../../state/GameContext";

export function TermEndScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-8 text-center sm:p-6">
      <h1 className="text-2xl font-bold text-emerald-400">任期満了</h1>
      <p className="text-slate-300">4年の任期を最後まで務め上げました。お疲れ様でした。</p>
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-left text-sm text-slate-300">
        <p>最終支持率: {Math.round(state.stats.approvalRating)}%</p>
        <p>財政: {state.stats.treasuryBalance.toFixed(1)} 兆円</p>
        <p>GDP成長率: {state.stats.gdpGrowth.toFixed(1)}%</p>
        <p>党内結束: {Math.round(state.stats.partyUnity)}</p>
        <p>議席数: {Math.round(state.stats.dietSeats)}</p>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "NEW_GAME" })}
        className="w-full rounded-md bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-500"
      >
        新しい任期を始める
      </button>
    </div>
  );
}
