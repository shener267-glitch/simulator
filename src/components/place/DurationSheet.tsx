import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { durationOptions } from "../../engine/actions";
import { formatDuration } from "../../engine/clock";
import { findAction } from "../../data/actions";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 「どのくらい？」（設計書6章）。選んだ長さは目安であって縛りではない —
 * 始めたあともセグメントごとに続けるかやめるかは選べる（設計書8章）。
 * 次の予定に入らない長さは、消さずに押せない形で見せる。あることが
 * 分かっていて選べない、という手触りを残したいので。
 */
export function DurationSheet() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  if (state.mode.kind !== "duration") return null;

  const action = findAction(state.mode.actionId);
  if (!action) return null;

  const options = durationOptions(state, action);
  const close = () => dispatch({ type: "CANCEL_DURATION" });

  return (
    <Modal title={action.label} onClose={close}>
      <p className="mb-4 text-[0.88rem] leading-[1.9] text-body-muted">どのくらい？</p>

      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <SheetRow
            key={option.minutes}
            emoji={action.emoji}
            label={formatDuration(option.minutes)}
            // 入らない長さも選べる。警告して、あとは本人に決めさせる（設計書6章）。
            // 跨いだぶんは既存の中断ルールが切って、消化した分だけを課金する。
            note={option.available ? undefined : "次の予定に間に合わない可能性があります"}
            warn={!option.available}
            onClick={() =>
              dispatch({
                type: "START_ACTION",
                actionId: action.id,
                targetMinutes: option.minutes,
              })
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={close}
        className="mt-3 min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.9rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
      >
        やめる
      </button>
    </Modal>
  );
}
