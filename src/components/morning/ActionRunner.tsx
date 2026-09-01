import { ScreenContainer } from "../shared/ScreenContainer";
import { MorningClock } from "./MorningClock";
import { freeMinutes, visibleFreeMinutes } from "../../engine/actions";
import { formatDuration } from "../../engine/clock";
import { findAction } from "../../data/actions";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * Plays an action one segment at a time. Stopping partway is always available —
 * that is the point of splitting actions up at all (設計書13章).
 */
export function ActionRunner() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const active = state.activeAction;
  const action = active ? findAction(active.actionId) : undefined;
  if (!active || !action) return null;

  const shownIndex = active.interrupted ? active.segmentIndex : active.segmentIndex - 1;
  const segment = action.segments[shownIndex];
  const nextSegment = action.segments[active.segmentIndex];
  // The button is offered while any time at all is left, but the warning on it
  // only counts down to the next *scheduled* item — an unannounced call cutting
  // the action short should land as a surprise, not as a visible timer.
  const canContinue = !active.interrupted && !active.exhausted && nextSegment && freeMinutes(state) > 0;
  const visibleRemaining = visibleFreeMinutes(state);
  const willBeCutShort = Boolean(nextSegment) && visibleRemaining < (nextSegment?.minutes ?? 0);

  return (
    <ScreenContainer width="narrow">
      <MorningClock />

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="min-w-0 truncate text-lg font-bold text-slate-100">{action.label}</h1>
        <span className="shrink-0 text-sm tabular-nums text-slate-500">
          {formatDuration(active.minutesSpent)}
        </span>
      </div>

      {segment && (
        <div className="flex flex-col gap-4">
          {segment.speaker && <p className="text-sm font-medium text-sky-400">{segment.speaker}</p>}

          <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-slate-300">{segment.text}</p>

          {segment.lines && (
            <div className="flex flex-col gap-2">
              {segment.lines.map((line) => (
                <p
                  key={line}
                  className="rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm leading-relaxed text-slate-300"
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {active.interrupted && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-200">
          ——そこで時間になった。
        </p>
      )}

      {active.exhausted && !active.interrupted && (
        <p className="text-sm text-slate-500">これ以上は、いまはない。</p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        {canContinue && (
          <button
            type="button"
            onClick={() => dispatch({ type: "CONTINUE_SEGMENT" })}
            className="min-h-[52px] w-full rounded-xl bg-sky-600 px-4 font-medium text-white hover:bg-sky-500 active:bg-sky-700"
          >
            続ける
            <span className="ml-2 text-sm font-normal text-sky-200">
              {willBeCutShort ? `残り${visibleRemaining}分で中断` : formatDuration(nextSegment!.minutes)}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "STOP_ACTION" })}
          className="min-h-[52px] w-full rounded-xl border border-slate-700 px-4 font-medium text-slate-200 hover:bg-slate-800 active:bg-slate-900"
        >
          {active.interrupted ? "わかった" : active.exhausted ? "戻る" : "やめる"}
        </button>
      </div>
    </ScreenContainer>
  );
}
