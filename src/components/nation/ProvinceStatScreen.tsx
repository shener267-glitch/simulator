import { Panel } from "../shared/Panel";
import { MILITARY_REGION_LABELS } from "../../data/military";
import type { Province } from "../../types/military";
import { useGameState } from "../../state/GameContext";

type ProvinceStatKind = "infrastructure" | "supply";

const STAT_CONFIG: Record<ProvinceStatKind, { label: string; max: number; field: (p: Province) => number }> = {
  infrastructure: { label: "インフラ整備度", max: 10, field: (p) => p.infrastructureLevel },
  supply: { label: "補給の届きやすさ", max: 100, field: (p) => p.supplyLevel },
};

/**
 * 建設（🏗）・兵站（🚚）の入口（指示書8章）。専用の建設キュー・補給網は
 * まだないが、プロヴィンスが既に持つインフラ・補給レベル（Phase 5改訂）を
 * そのまま一覧にする——ダミー値を新設せず、既存データを見せる形。
 */
export function ProvinceStatScreen({ title, description, kind, onClose }: { title: string; description: string; kind: ProvinceStatKind; onClose: () => void }) {
  const state = useGameState();
  const { provinces } = state.military;
  const landProvinces = provinces.filter((p) => p.kind === "land");
  const config = STAT_CONFIG[kind];

  return (
    <Panel title={title} onClose={onClose}>
      <div className="flex flex-col gap-4 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.85rem] text-body-muted">{description}</p>

        <div className="flex flex-col gap-2">
          {landProvinces.map((province) => {
            const value = config.field(province);
            const percent = Math.min(100, (value / config.max) * 100);
            return (
              <div key={province.id} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.88rem] text-body">{province.name}</span>
                  <span className="text-[0.72rem] text-body-muted">{MILITARY_REGION_LABELS[province.regionId]}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-raised">
                    <div className="h-full rounded-full bg-brass/70" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="figures w-14 shrink-0 text-right text-[0.75rem] text-body-muted">
                    {config.label === "補給の届きやすさ" ? `${Math.round(value)}%` : `${value}/${config.max}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[0.78rem] text-body-faint">
          建設キュー・補給網の専用シミュレーションは今後のPhaseで実装予定。ここはその入口。
        </div>
      </div>
    </Panel>
  );
}
