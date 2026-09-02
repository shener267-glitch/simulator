import { ScreenContainer } from "../shared/ScreenContainer";
import { PlaceHeader } from "../place/PlaceHeader";
import { freeMinutes, remainingToTarget, visibleFreeMinutes } from "../../engine/actions";
import { formatDuration } from "../../engine/clock";
import { findAction } from "../../data/actions";
import { runOf } from "../../types/mode";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * Plays an action one segment at a time. Stopping partway is always available —
 * that is the point of splitting actions up at all (設計書13章).
 */
export function ActionRunner() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const active = state.mode.kind === "action" ? state.mode.run : runOf(state.mode);
  const action =
    active && active.source.kind === "action" ? findAction(active.source.actionId) : undefined;
  if (!active || !action) return null;

  const shownIndex = active.interrupted ? active.segmentIndex : active.segmentIndex - 1;
  const segment = action.segments[shownIndex];
  const nextSegment = action.segments[active.segmentIndex];
  // The button is offered while any time at all is left, but the warning on it
  // only counts down to the next *scheduled* item — an unannounced call cutting
  // the action short should land as a surprise, not as a visible timer.
  const canContinue = !active.interrupted && !active.exhausted && nextSegment && freeMinutes(state) > 0;
  const visibleRemaining = visibleFreeMinutes(state);
  // 選んだ長さは目安。届いたら止めずに「さらに続ける」へ変わるだけ（設計書6章・8章）。
  const toTarget = remainingToTarget(active);
  const willBeCutShort = Boolean(nextSegment) && visibleRemaining < (nextSegment?.minutes ?? 0);

  return (
    <ScreenContainer width="narrow">
      <PlaceHeader />

      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <h1 className="min-w-0 truncate text-[1.05rem] font-medium text-body">{action.label}</h1>
        <span className="figures shrink-0 text-[0.8rem] text-body-muted">
          {formatDuration(active.minutesSpent)}
        </span>
      </div>

      {segment && (
        <div key={shownIndex} className="flex animate-fade-up flex-col gap-4">
          {segment.speaker && (
            <p className="text-[0.8rem] font-medium tracking-wider text-brass">{segment.speaker}</p>
          )}

          <p className="whitespace-pre-line text-[0.95rem] leading-[2] text-body">{segment.text}</p>

          {segment.lines && (
            <div className="flex flex-col gap-2">
              {segment.lines.map((line) => (
                <p
                  key={line}
                  className="rounded-xl border border-line bg-ink-panel px-4 py-3 text-[0.88rem] leading-[1.9] text-body-muted"
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {active.interrupted && (
        <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-[0.88rem] leading-[1.9] text-alert">
          ——そこで時間になった。
        </p>
      )}

      {active.exhausted && !active.interrupted && (
        <p className="text-[0.85rem] text-body-faint">これ以上は、いまはない。</p>
      )}

      <div className="mt-1 flex flex-col gap-2.5">
        {canContinue && (
          <button
            type="button"
            onClick={() => dispatch({ type: "CONTINUE_SEGMENT" })}
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
          >
            {toTarget === null && active.targetMinutes !== null ? "さらに続ける" : "続ける"}
            <span className="figures text-[0.8rem] font-normal text-ink/70">
              {willBeCutShort
                ? `残り${visibleRemaining}分で中断`
                : toTarget !== null
                  ? `あと${formatDuration(toTarget)}`
                  : formatDuration(nextSegment!.minutes)}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "STOP_ACTION" })}
          className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.95rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
        >
          {active.interrupted ? "わかった" : active.exhausted ? "戻る" : "やめる"}
        </button>
      </div>
    </ScreenContainer>
  );
}
