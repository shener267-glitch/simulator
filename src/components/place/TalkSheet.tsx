import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { actionMinutesLeft, isSpent } from "../../engine/actions";
import { formatDuration } from "../../engine/clock";
import { actionsAt } from "../../engine/places";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * いま話せる相手（設計書9章）。秘書官は電話なのでどこからでも、妻は台所に
 * 立っているのでリビングでしか掴まらない。
 */
export function TalkSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const people = actionsAt(state.place).filter((action) => action.category === "people");

  return (
    <Modal title="話す" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {people.length === 0 && (
          <p className="px-1 py-2 text-[0.88rem] leading-[1.9] text-body-muted">
            ここには誰もいない。
          </p>
        )}

        {people.map((action) => {
          const spent = isSpent(state, action);

          return (
            <SheetRow
              key={action.id}
              emoji={action.emoji}
              label={action.label}
              note={spent ? "いまは話すことがない" : action.hint}
              meta={spent ? "済んだ" : formatDuration(actionMinutesLeft(state, action))}
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
