import { useGameState } from "../../state/GameContext";
import { ProgressBar } from "../shared/ProgressBar";

export function HealthStressPanel() {
  const { stats } = useGameState();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">健康・ストレス</p>
      <ProgressBar label="健康" value={stats.health} colorClassName="bg-teal-500" />
      <ProgressBar label="ストレス" value={stats.stress} colorClassName="bg-orange-500" />
      {stats.stress > 70 && (
        <p className="text-xs text-rose-400">ストレスが高く、健康を損ないやすくなっています。</p>
      )}
      {stats.health < 30 && (
        <p className="text-xs font-semibold text-rose-400">
          健康状態が危険水域です。療養しないと執務の継続が困難になります。
        </p>
      )}
    </div>
  );
}
