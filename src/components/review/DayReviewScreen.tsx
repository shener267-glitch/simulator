import { ScreenContainer } from "../shared/ScreenContainer";
import { ConditionMeter } from "../shared/ConditionMeter";
import { formatClock, formatDuration } from "../../engine/clock";
import { describeCondition, fatigueGauge, hungerGauge } from "../../engine/condition";
import { MORNING_DATE_STAMP } from "../../data/schedule";
import { describeTendency } from "../../data/tendencies";
import { reviewBlocks } from "../../engine/review";
import { describeBedtime } from "../../engine/sleep";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 一日の記録。何が正しい使い方かは示さない — この朝をどう使ったかを
 * そのまま並べるだけにする（本セッションでの決定）。
 */
export function DayReviewScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const blocks = reviewBlocks(state);
  const tendency = describeTendency(state.flags);

  return (
    <ScreenContainer width="narrow">
      <div className="pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <p className="figures font-figure text-[0.65rem] font-medium tracking-label text-brass">
          {MORNING_DATE_STAMP}　{formatClock(0)} — {formatClock(state.clock)}
        </p>
        <h1 className="mt-3 text-[1.6rem] font-normal tracking-wide text-body">一日の記録</h1>
      </div>

      {blocks.map((block) => (
        <section key={block.id} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">
              {block.label}
            </h2>
            <span className="h-px flex-1 bg-line" />
            <span className="figures shrink-0 text-[0.75rem] text-brass/70">
              {formatDuration(block.minutes)}
            </span>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-line bg-ink-panel">
            {block.entries.map((entry, index) => (
              <li
                key={`${entry.startedAt}-${index}`}
                className="flex items-baseline gap-3.5 border-b border-line px-4 py-3 last:border-b-0"
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
          </ul>
        </section>
      ))}

      {state.highlights.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">この日のこと</h2>
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

      {state.sleep && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">就寝</h2>
            <span className="h-px flex-1 bg-line" />
            <span className="figures shrink-0 text-[0.75rem] text-brass/70">
              {formatClock(state.sleep.at)}
            </span>
          </div>
          <p className="rounded-2xl border border-line bg-ink-panel px-5 py-4 text-[0.9rem] leading-[1.95] text-body">
            {describeBedtime(state.sleep.at, state.sleep.forced)}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">いまの状態</h2>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
          <div className="flex flex-col gap-2.5">
            <ConditionMeter label="疲労" gauge={fatigueGauge(state.condition.fatigue)} />
            <ConditionMeter label="空腹" gauge={hungerGauge(state.condition.hunger)} />
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3.5">
            {describeCondition(state.condition).map((line) => (
              <p key={line} className="text-[0.9rem] leading-[1.95] text-body">
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {tendency && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">
              この日の過ごし方
            </h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <p className="rounded-2xl border border-line bg-ink-panel px-5 py-4 text-[0.9rem] leading-[1.95] text-body">
            {tendency}
          </p>
        </section>
      )}

      <div className="mt-1 rounded-2xl border border-line/60 px-5 py-4 text-[0.82rem] leading-[1.9] text-body-faint">
        <p>6月6日は、ここまで。</p>
        <p>翌日以降は今後のバージョンで実装予定。</p>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "RESTART_DAY" })}
        className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.95rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
      >
        この日をやり直す
      </button>
    </ScreenContainer>
  );
}
