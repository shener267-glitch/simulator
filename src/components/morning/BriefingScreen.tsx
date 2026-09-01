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
      <div className="pt-2">
        <p className="text-sm text-slate-500">
          {formatClock(state.clock)}　{formatDuration(appointment.minutes)}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-100">{appointment.label}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {BRIEFING_SCENE.opening.map((line) => (
          <div key={line.text}>
            <p className="text-sm font-medium text-sky-400">{line.speaker}</p>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-300">{line.text}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700">
        <p className="border-b border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
          本日の日程
        </p>
        <ul className="divide-y divide-slate-800">
          {TODAY_SCHEDULE.map((item) => (
            <li key={item.time} className="flex gap-3 px-4 py-2.5">
              <span className="shrink-0 text-sm tabular-nums text-slate-400">{item.time}</span>
              <span className="min-w-0 text-sm text-slate-200">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        {BRIEFING_SCENE.closing.map((line) => (
          <div key={line.text}>
            <p className="text-sm font-medium text-sky-400">{line.speaker}</p>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-300">{line.text}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "RESOLVE_APPOINTMENT" })}
        className="mt-2 min-h-[52px] w-full rounded-xl bg-sky-600 px-4 font-medium text-white hover:bg-sky-500 active:bg-sky-700"
      >
        確認した
      </button>
    </ScreenContainer>
  );
}
