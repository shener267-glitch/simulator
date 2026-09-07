import { Panel } from "../shared/Panel";
import { PRODUCTION_ITEM_LABELS, PRODUCTION_UNIT_COST } from "../../data/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 装備生産画面（Phase 5指示書15・16章）。HOI4型の考え方——工場数×生産効率で
 * 累積生産が進み、1単位ぶん貯まるたびに戦力へ少しずつ還元される。
 * 「防衛費を増やせば無条件に軍事力が増えるわけではない」という指示書14章の
 * 釘刺しどおり、ここでの生産にも時間がかかる。
 */
export function ProductionScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { productionLines } = state.military;
  const politicalPower = state.politics.stats.politicalPower;

  return (
    <Panel title="🏭 装備生産" onClose={onClose}>
      <div className="flex flex-col gap-3 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.8rem] font-medium tracking-wider text-brass">🏭 生産ライン</p>

        {productionLines.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">この国の生産ラインデータはまだ用意されていない。</p>
        ) : (
          productionLines.map((line) => {
            const unitCost = PRODUCTION_UNIT_COST[line.itemId];
            const percent = Math.min(100, (line.accumulatedOutput / unitCost) * 100);
            return (
              <div key={line.itemId} className="rounded-lg border border-line bg-ink-panel px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9rem] text-body">{PRODUCTION_ITEM_LABELS[line.itemId]}</span>
                  <span className="figures text-[0.75rem] text-body-muted">工場×{line.factories} ・ 効率{line.efficiencyPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-raised">
                  <div className="h-full rounded-full bg-brass" style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="figures text-[0.75rem] text-body-muted">次の1単位まで {percent.toFixed(0)}%</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "ADJUST_PRODUCTION_FACTORIES", itemId: line.itemId, delta: -1 })}
                      className="flex h-8 w-8 items-center justify-center rounded border border-line-strong text-body-muted transition-colors hover:border-brass/40 hover:text-body"
                      aria-label={`${PRODUCTION_ITEM_LABELS[line.itemId]}の工場を減らす`}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      disabled={politicalPower < 5}
                      onClick={() => dispatch({ type: "ADJUST_PRODUCTION_FACTORIES", itemId: line.itemId, delta: 1 })}
                      className="flex h-8 w-8 items-center justify-center rounded border border-line-strong text-body-muted transition-colors enabled:hover:border-brass/40 enabled:hover:text-body disabled:opacity-40"
                      aria-label={`${PRODUCTION_ITEM_LABELS[line.itemId]}の工場を増やす（PP5）`}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
