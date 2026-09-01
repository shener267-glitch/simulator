import { useGameDispatch } from "../../state/GameContext";
import { ScreenContainer } from "../shared/ScreenContainer";
import { CalendarWidget } from "./CalendarWidget";
import { StatBars } from "./StatBars";
import { NewsTicker } from "./NewsTicker";
import { FastForwardControls } from "./FastForwardControls";
import type { PlayerScreen } from "../../App";

interface DashboardProps {
  onNavigate: (screen: PlayerScreen) => void;
}

const NAV_BUTTONS: { screen: PlayerScreen; label: string }[] = [
  { screen: "policy", label: "政策を決定する" },
  { screen: "faction", label: "党内・内閣を見る" },
  { screen: "private", label: "プライベート" },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const dispatch = useGameDispatch();

  return (
    <ScreenContainer width="wide" flushBottom>
      <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">総理大臣シミュレーター</h1>
      <CalendarWidget />
      <StatBars />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {NAV_BUTTONS.map(({ screen, label }) => (
          <button
            key={screen}
            type="button"
            onClick={() => onNavigate(screen)}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-left font-medium text-slate-100 hover:border-slate-500"
          >
            {label}
          </button>
        ))}
      </div>

      <NewsTicker />

      <button
        type="button"
        onClick={() => {
          if (window.confirm("本当に辞任しますか?")) {
            dispatch({ type: "RESIGN" });
          }
        }}
        className="flex min-h-[44px] items-center self-start text-sm text-slate-500 underline hover:text-rose-400"
      >
        辞任する
      </button>

      {/* Pinned so the most-used controls stay in thumb reach as news piles up. */}
      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-slate-700 bg-slate-900/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">
        <FastForwardControls />
      </div>
    </ScreenContainer>
  );
}
