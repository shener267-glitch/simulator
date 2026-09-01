import { useGameState } from "../../state/GameContext";
import { recentHistory } from "../../state/selectors";

const KIND_STYLES: Record<string, string> = {
  news: "text-slate-300",
  scandal: "text-rose-400 font-semibold",
  achievement: "text-emerald-400",
  system: "text-slate-500 italic",
};

export function NewsTicker() {
  const state = useGameState();
  const entries = recentHistory(state, 10);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">ニュース</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {entries.length === 0 && <li className="text-slate-500">まだニュースはありません。</li>}
        {entries.map((entry, i) => (
          <li key={`${entry.dayIndex}-${i}`} className={KIND_STYLES[entry.kind]}>
            <span className="mr-2 text-slate-500">Day {entry.dayIndex}</span>
            {entry.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
