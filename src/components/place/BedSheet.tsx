import { Modal } from "../shared/Modal";
import { formatClock } from "../../engine/clock";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 寝るのは取り消せない。だからここだけは一度確かめる — 押し間違いで
 * 一日が終わるのは、遅く寝た代償とは別のものになってしまう。
 */
export function BedSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <Modal title="布団に入る" onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="figures font-figure text-[0.7rem] tracking-label text-brass">
          {formatClock(state.clock)}
        </p>

        <p className="text-[0.92rem] leading-[1.95] text-body-muted">
          今日はここまでにする。目を閉じれば、明日の朝が来る。
        </p>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "GO_TO_BED" })}
            className="min-h-[56px] w-full rounded-xl border border-brass/50 bg-ink-panel px-4 text-[0.95rem] font-medium text-body transition-colors duration-200 hover:border-brass hover:bg-ink-raised active:bg-ink-raised"
          >
            眠る
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] w-full rounded-xl border border-line px-4 text-[0.92rem] text-body-muted transition-colors duration-200 hover:border-line-strong hover:text-body active:bg-white/5"
          >
            まだ起きている
          </button>
        </div>
      </div>
    </Modal>
  );
}
