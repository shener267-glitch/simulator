import { Panel } from "../shared/Panel";
import { useGameState } from "../../state/GameContext";

/** 貿易（📦）の入口（指示書8・15章）。外交システムが既に持つ資源貿易データをそのまま見せる。 */
export function TradeScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const { trade } = state.diplomacy;

  const rows = [
    { label: "原油の輸入", need: trade.oilImportNeedTrillionYen, filled: trade.oilImportFilledTrillionYen },
    { label: "鉄鉱石の輸入", need: trade.ironImportNeedTrillionYen, filled: trade.ironImportFilledTrillionYen },
  ];

  return (
    <Panel title="📦 貿易" onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.85rem] text-body-muted">資源輸入の充足と、輸出能力（兆円/年）。</p>

        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const percent = row.need > 0 ? Math.min(100, (row.filled / row.need) * 100) : 100;
            return (
              <div key={row.label} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9rem] text-body">{row.label}</span>
                  <span className="figures text-[0.75rem] text-body-muted">
                    ¥{row.filled.toFixed(1)} / ¥{row.need.toFixed(1)}兆
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-raised">
                  <div className={`h-full rounded-full ${percent >= 100 ? "bg-affirm" : "bg-brass/70"}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">輸出能力</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.85rem]">
            <dt className="text-body-muted">機械</dt>
            <dd className="figures text-body">¥{trade.machineryExportCapacityTrillionYen.toFixed(1)}兆/年</dd>
            <dt className="text-body-muted">電子機器</dt>
            <dd className="figures text-body">¥{trade.electronicsExportCapacityTrillionYen.toFixed(1)}兆/年</dd>
          </dl>
        </div>

        <div className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[0.78rem] text-body-faint">
          個別の輸出入契約・国際市場価格の変動は今後のPhaseで実装予定。ここはその入口。
        </div>
      </div>
    </Panel>
  );
}
