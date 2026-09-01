import { useGameDispatch } from "../../state/GameContext";
import { CalendarWidget } from "./CalendarWidget";
import { StatBars } from "./StatBars";
import { NewsTicker } from "./NewsTicker";
import { FastForwardControls } from "./FastForwardControls";
import type { PlayerScreen } from "../../App";

interface DashboardProps {
  onNavigate: (screen: PlayerScreen) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const dispatch = useGameDispatch();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-slate-100">総理大臣シミュレーター</h1>
      <CalendarWidget />
      <StatBars />
      <FastForwardControls />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate("policy")}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-left font-medium text-slate-100 hover:border-slate-500"
        >
          政策を決定する
        </button>
        <button
          type="button"
          onClick={() => onNavigate("faction")}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-left font-medium text-slate-100 hover:border-slate-500"
        >
          党内・内閣を見る
        </button>
        <button
          type="button"
          onClick={() => onNavigate("private")}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-left font-medium text-slate-100 hover:border-slate-500"
        >
          プライベート
        </button>
      </div>

      <NewsTicker />

      <button
        type="button"
        onClick={() => {
          if (window.confirm("本当に辞任しますか?")) {
            dispatch({ type: "RESIGN" });
          }
        }}
        className="mt-2 self-start text-sm text-slate-500 underline hover:text-rose-400"
      >
        辞任する
      </button>
    </div>
  );
}
