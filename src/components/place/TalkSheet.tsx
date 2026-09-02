import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { hasSomethingLeft, talkableAt } from "../../engine/talk";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * いま話せる相手（設計書9章）。秘書官は電話なのでどこからでも掴まるが、
 * 妻はリビングにしかいないし、次男は七時を過ぎないと起きてこない。
 */
export function TalkSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const people = talkableAt(state);

  return (
    <Modal title="話す" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {people.length === 0 && (
          <p className="px-1 py-2 text-[0.88rem] leading-[1.9] text-body-muted">
            ここには誰もいない。
          </p>
        )}

        {people.map((tree) => {
          // どの枝にも残っていなければ、もう話すことはない。
          const empty = !tree.nodes.some((node) => hasSomethingLeft(state, tree, node.id));

          return (
            <SheetRow
              key={tree.id}
              emoji={tree.emoji}
              label={tree.label}
              note={empty ? "いまは話すことがない" : tree.hint}
              meta={tree.channel === "phone" ? "電話" : "対面"}
              disabled={empty}
              onClick={() => {
                dispatch({ type: "OPEN_TALK", treeId: tree.id });
                onClose();
              }}
            />
          );
        })}
      </div>
    </Modal>
  );
}
