import { ScreenContainer } from "../shared/ScreenContainer";
import { formatClock, formatDuration } from "../../engine/clock";
import { APPOINTMENT_SCENES, type SceneLine } from "../../data/schedule";
import { placeById } from "../../data/places";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/** フラグで出し分ける行を絞る。何も指定のない行は常に出る。 */
function visibleLines(lines: SceneLine[], flags: string[]): SceneLine[] {
  return lines.filter(
    (line) =>
      (!line.requiresFlag || flags.includes(line.requiresFlag)) &&
      (!line.unlessFlag || !flags.includes(line.unlessFlag)),
  );
}

/**
 * ブリーフィング以外の予定（設計書22章）。プレイヤーに選ぶことはなく、
 * 時間になれば始まり、終われば時計が進んでいる。総理が自分の時間を
 * 自由にできないことの、いちばん素朴な形。
 */
export function AppointmentScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const appointmentId = state.mode.kind === "appointment" ? state.mode.appointmentId : null;
  const appointment = state.appointments.find((candidate) => candidate.id === appointmentId);
  if (!appointment) return null;

  const lines = visibleLines(APPOINTMENT_SCENES[appointment.id] ?? [], state.flags);
  const arriving = appointment.movesTo ? placeById(appointment.movesTo) : null;

  return (
    <ScreenContainer width="narrow">
      <div className="pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="figures font-figure text-[0.75rem] font-medium tracking-label text-brass">
            {formatClock(appointment.at)}
          </span>
          <span className="figures text-[0.75rem] text-body-muted">
            {formatDuration(appointment.minutes)}
          </span>
        </div>
        <h1 className="mt-2 text-[1.15rem] font-medium leading-snug text-body">{appointment.label}</h1>
      </div>

      <div className="flex flex-col gap-5">
        {lines.map((line) => (
          <div key={line.text}>
            {line.speaker && (
              <p className="text-[0.8rem] font-medium tracking-wider text-brass">{line.speaker}</p>
            )}
            <p className={`whitespace-pre-line text-[0.92rem] leading-[2] text-body ${line.speaker ? "mt-1.5" : ""}`}>
              {line.text}
            </p>
          </div>
        ))}
      </div>

      {arriving && (
        <p className="rounded-xl border border-line bg-ink-panel px-4 py-3 text-[0.85rem] text-body-muted">
          <span className="mr-2" aria-hidden>
            {arriving.emoji}
          </span>
          {arriving.label}へ
        </p>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: "RESOLVE_APPOINTMENT" })}
        className="mt-1 min-h-[52px] w-full rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
      >
        わかった
      </button>
    </ScreenContainer>
  );
}
