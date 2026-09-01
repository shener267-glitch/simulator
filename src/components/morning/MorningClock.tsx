import { formatClock, formatDuration } from "../../engine/clock";
import { visibleFreeMinutes } from "../../engine/actions";
import { nextAppointment } from "../../engine/schedule";
import { MORNING_DATE_LABEL } from "../../data/briefing";
import { useGameState } from "../../state/GameContext";

/**
 * The clock is the thing the player is actually managing, so it leads the
 * screen and stays visible while the action list scrolls under it.
 */
export function MorningClock() {
  const state = useGameState();
  const upcoming = nextAppointment(state);
  const untilNext = visibleFreeMinutes(state);

  return (
    <div className="sticky top-0 z-10 -mx-4 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-slate-50">
          {formatClock(state.clock)}
        </span>
        <span className="shrink-0 text-sm text-slate-400">{MORNING_DATE_LABEL}</span>
      </div>

      <p className="mt-1 text-sm text-slate-400">
        {upcoming ? (
          <>
            <span className="text-slate-300">{upcoming.label}</span>
            {" まで "}
            <span className="tabular-nums text-slate-100">{formatDuration(untilNext)}</span>
          </>
        ) : (
          <>
            朝が終わるまで <span className="tabular-nums text-slate-100">{formatDuration(untilNext)}</span>
          </>
        )}
      </p>
    </div>
  );
}
