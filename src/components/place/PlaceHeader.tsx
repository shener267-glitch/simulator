import { MORNING_LENGTH } from "../../types/clock";
import { formatClock, formatDuration } from "../../engine/clock";
import { visibleFreeMinutes } from "../../engine/actions";
import { fatigueGauge } from "../../engine/condition";
import { nextVisibleAppointment } from "../../engine/schedule";
import { placeById } from "../../data/places";
import { MORNING_DATE_LABEL } from "../../data/briefing";
import { ConditionMeter } from "../shared/ConditionMeter";
import { useGameState } from "../../state/GameContext";

/**
 * 時刻・日付・現在地・疲労・次の予定まで（設計書21章・30章）。プレイヤーが
 * 「今どこにいて、次の予定まで何分あるか」を常に見ていられるようにする。
 * 下の内容がスクロールしても、これは残る。
 */
export function PlaceHeader() {
  const state = useGameState();
  const place = placeById(state.place);
  const upcoming = nextVisibleAppointment(state);
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

      <p className="mt-2 flex items-center gap-2 text-[0.9rem] text-body">
        <span aria-hidden>{place.emoji}</span>
        <span className="min-w-0 truncate">{place.label}</span>
      </p>

      <div className="mt-3.5 h-px w-full bg-line-strong">
        <div
          className="h-px bg-brass transition-[width] duration-700 ease-out"
          style={{ width: `${elapsed}%` }}
        />
      </div>

      <div className="mt-3">
        <ConditionMeter label="疲労" gauge={fatigueGauge(state.condition.fatigue)} />
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[0.85rem] text-body-muted">
          {upcoming ? (
            <>
              <span className="figures mr-2 text-brass/80">{formatClock(upcoming.at)}</span>
              {upcoming.label}
            </>
          ) : (
            "朝が終わるまで"
          )}
        </span>
        <span className="figures shrink-0 text-[0.85rem] font-medium text-brass">
          あと{formatDuration(untilNext)}
        </span>
      </div>
    </div>
  );
}
