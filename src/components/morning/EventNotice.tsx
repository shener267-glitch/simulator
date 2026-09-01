import { Modal } from "../shared/Modal";
import { formatClock } from "../../engine/clock";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/** 突発の連絡（設計書17章）。v0.1では受け取って予定が動くところまで。 */
export function EventNotice() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const event = state.events.find((candidate) => candidate.id === state.activeEventId);
  if (!event) return null;

  return (
    <Modal title={event.title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          {formatClock(state.clock)}　{event.from}
        </p>

        <div className="flex flex-col gap-3 text-[0.95rem] leading-relaxed text-slate-300">
          {event.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        {event.movesAppointment && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-200">
            {event.movesAppointment.note}
          </p>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "DISMISS_EVENT" })}
          className="min-h-[52px] w-full rounded-xl bg-slate-700 px-4 font-medium text-slate-100 hover:bg-slate-600 active:bg-slate-800"
        >
          わかった
        </button>
      </div>
    </Modal>
  );
}
