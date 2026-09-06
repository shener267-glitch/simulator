import { Modal } from "../shared/Modal";
import { formatTime } from "../../engine/clock";
import { useGameState } from "../../state/GameContext";

/** その日の政治日程の一覧（設計書17章の「予定」）。プレイヤーが動かせるものではない。 */
export function ScheduleSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const sorted = [...state.appointments].sort((a, b) => a.at - b.at);

  return (
    <Modal title="予定" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {sorted.map((appointment) => {
          const past = appointment.resolved;
          const now =
            !past && state.clock.totalMinutes >= appointment.at && state.clock.totalMinutes < appointment.at + appointment.minutes;
          return (
            <div
              key={appointment.id}
              className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 ${
                now ? "border-brass/50 bg-brass/10" : "border-line bg-ink-panel"
              }`}
            >
              <span className={`figures shrink-0 text-[0.8rem] ${past ? "text-body-faint" : "text-brass"}`}>
                {formatTime(appointment.at)}
              </span>
              <span className={`flex-1 text-[0.9rem] ${past ? "text-body-faint line-through" : "text-body"}`}>
                {appointment.label}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
