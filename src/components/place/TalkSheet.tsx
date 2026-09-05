import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { hasSomethingLeft, reachableFrom } from "../../engine/talk";
import { SUMMON_MINUTES } from "../../types/person";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const REACH_LABEL = {
  here: "ここにいる",
  summon: `呼ぶ　${SUMMON_MINUTES}分`,
  phone: "電話",
} as const;

/**
 * いま話せる相手（設計書9章）。同じ部屋にいる人が先に並び、次に執務室へ
 * 呼べる人、最後に電話。誰にどう届くかが、その部屋にいる意味になる。
 */
export function TalkSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const order = { here: 0, summon: 1, phone: 2 } as const;
  const people = reachableFrom(state).sort((a, b) => order[a.reach] - order[b.reach]);

  return (
    <Modal title="話す" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {people.length === 0 && (
          <p className="px-1 py-2 text-[0.88rem] leading-[1.9] text-body-muted">
            ここには誰もいないし、いま掛けられる相手もいない。
          </p>
        )}

        {people.map(({ tree, reach, note }) => {
          // どの枝にも残っていなければ、もう話すことはない。
          const empty = !tree.nodes.some((node) => hasSomethingLeft(state, tree, node.id));

          return (
            <SheetRow
              key={tree.id}
              emoji={tree.emoji}
              label={tree.label}
              note={empty ? "いまは話すことがない" : (note ?? tree.hint)}
              meta={REACH_LABEL[reach]}
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
