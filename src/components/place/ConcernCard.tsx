import { activeConcerns } from "../../engine/concern";
import { activeDuties } from "../../engine/duty";
import { formatClock } from "../../engine/clock";
import { useGameState } from "../../state/GameContext";

/**
 * 🧠内心と📋やることを、隣り合った別のカードとして出す（本セッションでの決定）。
 *
 * 内心は感情と体だけ。チェックボックスも件数も出さない。やることは仕事の
 * 一覧だが、こちらも達成率は出さない — 片付いたものに印がつくだけで、
 * 一つも片付けずに一日を終えられる。
 */
export function ConcernCard() {
  const state = useGameState();
  const concerns = activeConcerns(state);
  const duties = activeDuties(state);

  if (concerns.length === 0 && duties.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {concerns.length > 0 && (
        <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
          <p className="font-figure text-[0.6rem] font-medium tracking-label text-brass">🧠 内心</p>

          <div className="mt-3 flex flex-col gap-2.5">
            {concerns.map((concern) => (
              <p key={concern.id} className="text-[0.88rem] leading-[1.9] text-body-muted">
                {concern.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {duties.length > 0 && (
        <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
          <p className="font-figure text-[0.6rem] font-medium tracking-label text-brass">
            📋 やること
          </p>

          <div className="mt-3 flex flex-col gap-2.5">
            {duties.map((duty) => (
              <div key={duty.id} className="flex items-baseline gap-2.5">
                <span
                  className={`shrink-0 text-[0.75rem] ${duty.done ? "text-brass/70" : "text-body-faint"}`}
                  aria-hidden
                >
                  {duty.done ? "✓" : "・"}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[0.88rem] leading-[1.8] ${
                      duty.done ? "text-body-faint line-through" : "text-body-muted"
                    }`}
                  >
                    {duty.text}
                  </span>
                  {!duty.done && (duty.from || duty.by !== undefined) && (
                    <span className="mt-0.5 block text-[0.74rem] text-body-faint">
                      {duty.from && `${duty.from}から`}
                      {duty.from && duty.by !== undefined && "　"}
                      {duty.by !== undefined && `${formatClock(duty.by)}まで`}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
