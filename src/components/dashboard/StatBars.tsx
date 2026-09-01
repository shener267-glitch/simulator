import { useGameState } from "../../state/GameContext";
import { ProgressBar } from "../shared/ProgressBar";

export function StatBars() {
  const { stats } = useGameState();
  const majority = 233;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4 sm:grid-cols-2">
      <ProgressBar label="支持率" value={stats.approvalRating} colorClassName="bg-emerald-500" />
      <ProgressBar label="党内結束" value={stats.partyUnity} colorClassName="bg-indigo-500" />
      <ProgressBar label="健康" value={stats.health} colorClassName="bg-teal-500" />
      <ProgressBar label="ストレス" value={stats.stress} colorClassName="bg-orange-500" />
      <ProgressBar label="スキャンダルリスク" value={stats.scandalRisk} colorClassName="bg-rose-500" />

      <div className="flex flex-col justify-center gap-1 rounded-md bg-slate-900/40 p-2 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>財政</span>
          <span className={stats.treasuryBalance >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {stats.treasuryBalance >= 0 ? "+" : ""}
            {stats.treasuryBalance.toFixed(1)} 兆円
          </span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>GDP成長率</span>
          <span className={stats.gdpGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {stats.gdpGrowth >= 0 ? "+" : ""}
            {stats.gdpGrowth.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>議席数</span>
          <span className={stats.dietSeats >= majority ? "text-emerald-400" : "text-rose-400"}>
            {Math.round(stats.dietSeats)} / 465 (過半数 {majority})
          </span>
        </div>
      </div>
    </div>
  );
}
