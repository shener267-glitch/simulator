import { MORNING_LENGTH } from "../../types/clock";
import { formatClock, formatDuration } from "../../engine/clock";
import { visibleFreeMinutes } from "../../engine/actions";
import { nextAppointment } from "../../engine/schedule";
import { MORNING_DATE_LABEL } from "../../data/briefing";
import { useGameState } from "../../state/GameContext";

/**
 * The clock is the thing the player is actually managing, so it leads the
 * screen and stays visible while the action list scrolls under it. The rail
 * under it is the three hours of the morning draining away.
 */
export function MorningClock() {
  const state = useGameState();
  const upcoming = nextAppointment(state);
  const untilNext = visibleFreeMinutes(state);
  const elapsed = Math.min(100, (state.clock / MORNING_LENGTH) * 100);

  return (
    <div className="sticky top-0 z-10 -mx-5 border-b border-line bg-ink/90 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-md">
      <div className="flex items-end justify-between gap-3">
        <span className="figures font-figure text-[2.6rem] font-extralight leading-none tracking-tight text-body">
          {formatClock(state.clock)}
        </span>
        <span className="figures shrink-0 pb-1 font-figure text-[0.7rem] tracking-label text-body-muted">
          {MORNING_DATE_LABEL}
        </span>
      </div>

      <div className="mt-3.5 h-px w-full bg-line-strong">
        <div
          className="h-px bg-brass transition-[width] duration-700 ease-out"
          style={{ width: `${elapsed}%` }}
        />
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[0.85rem] text-body-muted">
          {upcoming ? upcoming.label : "朝が終わるまで"}
        </span>
        <span className="figures shrink-0 text-[0.85rem] font-medium text-brass">
          {formatDuration(untilNext)}
        </span>
      </div>
    </div>
  );
}
