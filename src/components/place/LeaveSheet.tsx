import { Modal } from "../shared/Modal";
import { formatClock } from "../../engine/clock";
import { RIDE_MINUTES } from "../../engine/leaving";
import { openDutyCount } from "../../engine/duty";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 帰ると決めるのは総理だけ（本セッションでの決定）。
 *
 * 残っている仕事の数だけは見せる。止めはしない — 残したまま帰ることも、
 * 総理の一日としては珍しくない。
 */
export function LeaveSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const left = openDutyCount(state);

  return (
    <Modal title="官邸を出る" onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="figures font-figure text-[0.7rem] tracking-label text-brass">
          {formatClock(state.clock)}　→　{formatClock(state.clock + RIDE_MINUTES)}
        </p>

        <p className="text-[0.92rem] leading-[1.95] text-body-muted">
          車で五分。宿舎までは五百メートルほどしかない。
        </p>

        {left > 0 && (
          <p className="text-[0.88rem] leading-[1.9] text-alert">
            やることが{left}件、手つかずのまま残っている。
          </p>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "LEAVE_KANTEI" })}
            className="min-h-[56px] w-full rounded-xl border border-brass/50 bg-ink-panel px-4 text-[0.95rem] font-medium text-body transition-colors duration-200 hover:border-brass hover:bg-ink-raised active:bg-ink-raised"
          >
            車を回してもらう
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] w-full rounded-xl border border-line px-4 text-[0.92rem] text-body-muted transition-colors duration-200 hover:border-line-strong hover:text-body active:bg-white/5"
          >
            まだ残る
          </button>
        </div>
      </div>
    </Modal>
  );
}
