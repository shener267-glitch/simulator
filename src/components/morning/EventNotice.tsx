import { Modal } from "../shared/Modal";
import { formatClock } from "../../engine/clock";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/** 突発の連絡（設計書17章）。v0.1では受け取って予定が動くところまで。 */
export function EventNotice() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const eventId = state.mode.kind === "event" ? state.mode.eventId : null;
  const event = state.events.find((candidate) => candidate.id === eventId);
  if (!event) return null;

  return (
    <Modal title={event.title} urgent>
      <div className="flex flex-col gap-5">
        <div className="flex items-baseline gap-2.5">
          <span className="figures font-figure text-[0.8rem] font-medium text-alert">
            {formatClock(state.clock)}
          </span>
          <span className="text-[0.78rem] tracking-wider text-body-muted">{event.from}</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {event.body.map((line) => (
            <p key={line} className="text-[0.92rem] leading-[2] text-body">
              {line}
            </p>
          ))}
        </div>

        {event.movesAppointment && (
          <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-[0.85rem] leading-[1.9] text-alert">
            {event.movesAppointment.note}
          </p>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "DISMISS_EVENT" })}
          className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.95rem] font-medium text-body transition-colors duration-200 hover:border-brass/40 active:bg-white/5"
        >
          わかった
        </button>
      </div>
    </Modal>
  );
}
