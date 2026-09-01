import { useGameState } from "../../state/GameContext";
import { formatDate } from "../../engine/calendar";

export function CalendarWidget() {
  const state = useGameState();
  const { date, term } = state;
  const pct = Math.min(100, (date.dayIndex / term.termLengthDays) * 100);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs text-slate-400">在任日数 {date.dayIndex} / {term.termLengthDays} 日</p>
      <p className="text-2xl font-bold text-slate-100">{formatDate(date)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
