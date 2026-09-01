import { ScreenContainer } from "../shared/ScreenContainer";
import { formatClock, formatDuration } from "../../engine/clock";
import { describeCondition } from "../../engine/condition";
import { MORNING_DATE_LABEL } from "../../data/briefing";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 朝の記録。何が正しい使い方かは示さない — この朝をどう使ったかを
 * そのまま並べるだけにする（本セッションでの決定）。
 */
export function MorningReviewScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const total = state.log.reduce((sum, entry) => sum + entry.minutes, 0);

  return (
    <ScreenContainer width="narrow">
      <div className="pt-4">
        <p className="text-sm text-slate-500">{MORNING_DATE_LABEL}　05:00 — 08:00</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-100">朝の記録</h1>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">使った時間</h2>
        <ul className="overflow-hidden rounded-xl border border-slate-800 divide-y divide-slate-800">
          {state.log.map((entry, index) => (
            <li key={`${entry.startedAt}-${index}`} className="flex items-baseline gap-3 px-4 py-2.5">
              <span className="shrink-0 text-sm tabular-nums text-slate-500">
                {formatClock(entry.startedAt)}
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-200">{entry.label}</span>
              <span className="shrink-0 text-sm tabular-nums text-slate-400">
                {formatDuration(entry.minutes)}
              </span>
            </li>
          ))}
          <li className="flex items-baseline gap-3 bg-slate-800/40 px-4 py-2.5">
            <span className="min-w-0 flex-1 text-sm text-slate-400">合計</span>
            <span className="shrink-0 text-sm tabular-nums text-slate-200">{formatDuration(total)}</span>
          </li>
        </ul>
      </section>

      {state.highlights.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">この朝のこと</h2>
          <ul className="flex flex-col gap-2">
            {state.highlights.map((line, index) => (
              <li
                key={`${index}-${line}`}
                className="rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2 text-sm leading-relaxed text-slate-300"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">いまの状態</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 text-[0.95rem] leading-relaxed text-slate-300">
          {describeCondition(state.condition).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm leading-relaxed text-slate-500">
        <p>v0.1ではここまで。</p>
        <p className="mt-1">午前フェーズは今後のバージョンで実装予定。</p>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "RESTART_MORNING" })}
        className="min-h-[52px] w-full rounded-xl border border-slate-700 px-4 font-medium text-slate-200 hover:bg-slate-800 active:bg-slate-900"
      >
        この朝をやり直す
      </button>
    </ScreenContainer>
  );
}
