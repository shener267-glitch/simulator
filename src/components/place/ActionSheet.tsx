import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { durationRange, formatRange, isSpent, resumeIndex } from "../../engine/actions";
import { actionsAt } from "../../engine/places";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 現在地でできること（設計書5章）。人と話すものは「話す」に分けてあるので、
 * ここには出さない。できない行動はそもそも並ばない（設計書16章）。
 */
export function ActionSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const actions = actionsAt(state.place, state.clock);

  return (
    <Modal title="行動" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {actions.map((action) => {
          const spent = isSpent(state, action);
          const resumed = !spent && resumeIndex(state, action) > 0;
          const range = durationRange(state, action);

          return (
            <SheetRow
              key={action.id}
              emoji={action.emoji}
              label={action.label}
              note={spent ? "もう出てこない" : resumed ? `続きから — ${action.hint}` : action.hint}
              // 所要時間は必ず範囲で見せる（設計書6章）。
              meta={spent || !range ? "済んだ" : formatRange(range)}
              disabled={spent}
              onClick={() => {
                dispatch({ type: "CHOOSE_ACTION", actionId: action.id });
                onClose();
              }}
            />
          );
        })}
      </div>
    </Modal>
  );
}
