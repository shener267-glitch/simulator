import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { durationRange, formatRange, resumeIndex } from "../../engine/actions";
import { actionsAt } from "../../engine/places";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../../data/actions";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 現在地でできること（設計書5章）。人と話すものは「話す」に分けてある。
 *
 * もう出てこない行動は一覧から**消す**（本セッションでの決定）。以前は
 * 薄く残していたが、一日ぶんの行動が並ぶと済んだ行ばかりが場所を取り、
 * 「いま何ができるか」が読めなくなる。
 *
 * 数が増えたので、仕事／情報／休息／私生活で区切って並べる。
 */
export function ActionSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const actions = actionsAt(state.place, state.clock).filter(
    (action) => durationRange(state, action) !== null,
  );

  return (
    <Modal title="行動" onClose={onClose}>
      {actions.length === 0 && (
        <p className="px-1 py-2 text-[0.88rem] leading-[1.9] text-body-muted">
          ここでできることは、いまは残っていない。
        </p>
      )}

      <div className="flex flex-col gap-4">
        {CATEGORY_ORDER.map((category) => {
          const here = actions.filter((action) => action.category === category);
          if (here.length === 0) return null;

          return (
            <section key={category} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="text-[0.68rem] font-medium tracking-[0.2em] text-body-faint">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>

              {here.map((action) => {
                const resumed = resumeIndex(state, action) > 0;
                const range = durationRange(state, action)!;

                return (
                  <SheetRow
                    key={action.id}
                    emoji={action.emoji}
                    label={action.label}
                    note={resumed ? `続きから — ${action.hint}` : action.hint}
                    // 所要時間は必ず範囲で見せる（設計書6章）。
                    meta={formatRange(range)}
                    onClick={() => {
                      dispatch({ type: "CHOOSE_ACTION", actionId: action.id });
                      onClose();
                    }}
                  />
                );
              })}
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
