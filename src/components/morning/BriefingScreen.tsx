import { ScreenContainer } from "../shared/ScreenContainer";
import { formatClock, formatDuration } from "../../engine/clock";
import { BRIEFING_SCENE, TODAY_SCHEDULE } from "../../data/briefing";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 設計書10章。予定は秘書官側が組んだものを受け取る形にする。
 * v0.1では提示と確認まで。
 */
export function BriefingScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const appointment = state.appointments.find((candidate) => candidate.id === state.activeAppointmentId);
  if (!appointment) return null;

  return (
    <ScreenContainer width="narrow">
      <div className="pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-baseline gap-3">
          <span className="figures font-figure text-[0.75rem] font-medium tracking-label text-brass">
            {formatClock(state.clock)}
          </span>
          <span className="figures text-[0.75rem] text-body-muted">{formatDuration(appointment.minutes)}</span>
        </div>
        <h1 className="mt-2 text-[1.15rem] font-medium leading-snug text-body">{appointment.label}</h1>
      </div>

      <div className="flex flex-col gap-4">
        {BRIEFING_SCENE.opening.map((line) => (
          <div key={line.text}>
            <p className="text-[0.8rem] font-medium tracking-wider text-brass">{line.speaker}</p>
            <p className="mt-1.5 text-[0.92rem] leading-[2] text-body">{line.text}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-ink-panel">
        <p className="border-b border-line px-4 py-3 font-figure text-[0.6rem] font-medium tracking-label text-brass">
          SCHEDULE
        </p>
        <ul>
          {TODAY_SCHEDULE.map((item) => (
            <li key={item.time} className="flex gap-4 border-b border-line px-4 py-3 last:border-b-0">
              <span className="figures shrink-0 font-figure text-[0.8rem] text-brass/80">{item.time}</span>
              <span className="min-w-0 text-[0.85rem] leading-relaxed text-body">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        {BRIEFING_SCENE.closing.map((line) => (
          <div key={line.text}>
            <p className="text-[0.8rem] font-medium tracking-wider text-brass">{line.speaker}</p>
            <p className="mt-1.5 text-[0.92rem] leading-[2] text-body">{line.text}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "RESOLVE_APPOINTMENT" })}
        className="mt-1 min-h-[52px] w-full rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
      >
        確認した
      </button>
    </ScreenContainer>
  );
}
