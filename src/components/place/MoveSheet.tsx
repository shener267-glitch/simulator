import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { MOVE_MINUTES } from "../../types/place";
import { formatDuration } from "../../engine/clock";
import { actionsAt, exitsFrom } from "../../engine/places";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 行ける先だけを出す（設計書12章・16章）。一分は安いが、次の予定まで
 * 八分というときには、行って戻るだけで四分の一が消える。
 */
export function MoveSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <Modal title="移動" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {exitsFrom(state.place).map((place) => {
          // 何ができる場所なのかを一行で見せておく。移動そのものが目的では
          // ないので、行き先を決める材料は手前に出す。
          const offers = actionsAt(place.id, state.clock)
            .slice(0, 3)
            .map((action) => action.label)
            .join("・");

          return (
            <SheetRow
              key={place.id}
              emoji={place.emoji}
              label={place.label}
              note={offers}
              meta={formatDuration(MOVE_MINUTES)}
              onClick={() => {
                dispatch({ type: "MOVE_TO", place: place.id });
                onClose();
              }}
            />
          );
        })}
      </div>
    </Modal>
  );
}
