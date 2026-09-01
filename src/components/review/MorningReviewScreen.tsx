import { ScreenContainer } from "../shared/ScreenContainer";
import { formatClock, formatDuration } from "../../engine/clock";
import { describeCondition } from "../../engine/condition";
import { MORNING_DATE_STAMP } from "../../data/briefing";
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
      <div className="pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <p className="figures font-figure text-[0.65rem] font-medium tracking-label text-brass">
          {MORNING_DATE_STAMP}　05:00 — 08:00
        </p>
        <h1 className="mt-3 text-[1.6rem] font-normal tracking-wide text-body">朝の記録</h1>
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">使った時間</h2>
          <span className="h-px flex-1 bg-line" />
        </div>
        <ul className="overflow-hidden rounded-2xl border border-line bg-ink-panel">
          {state.log.map((entry, index) => (
            <li
              key={`${entry.startedAt}-${index}`}
              className="flex items-baseline gap-3.5 border-b border-line px-4 py-3"
            >
              <span className="figures shrink-0 font-figure text-[0.78rem] text-brass/70">
                {formatClock(entry.startedAt)}
              </span>
              <span className="min-w-0 flex-1 text-[0.88rem] text-body">{entry.label}</span>
              <span className="figures shrink-0 text-[0.78rem] text-body-muted">
                {formatDuration(entry.minutes)}
              </span>
            </li>
          ))}
          <li className="flex items-baseline gap-3.5 bg-ink-raised px-4 py-3">
            <span className="min-w-0 flex-1 text-[0.8rem] tracking-wider text-body-muted">合計</span>
            <span className="figures shrink-0 text-[0.85rem] font-medium text-brass">
              {formatDuration(total)}
            </span>
          </li>
        </ul>
      </section>

      {state.highlights.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">この朝のこと</h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <ul className="flex flex-col gap-2">
            {state.highlights.map((line, index) => (
              <li
                key={`${index}-${line}`}
                className="rounded-xl border border-line bg-ink-panel px-4 py-3 text-[0.88rem] leading-[1.9] text-body-muted"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">いまの状態</h2>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-ink-panel px-5 py-4">
          {describeCondition(state.condition).map((line) => (
            <p key={line} className="text-[0.9rem] leading-[1.95] text-body">
              {line}
            </p>
          ))}
        </div>
      </section>

      <div className="mt-1 rounded-2xl border border-line/60 px-5 py-4 text-[0.82rem] leading-[1.9] text-body-faint">
        <p>v0.1ではここまで。</p>
        <p>午前フェーズは今後のバージョンで実装予定。</p>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "RESTART_MORNING" })}
        className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.95rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
      >
        この朝をやり直す
      </button>
    </ScreenContainer>
  );
}
