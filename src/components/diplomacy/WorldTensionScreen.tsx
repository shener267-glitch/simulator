import { Panel } from "../shared/Panel";
import { REGION_LABELS } from "../../data/diplomacy";
import type { RegionId } from "../../types/diplomacy";
import { useGameState } from "../../state/GameContext";

const REGION_ORDER: RegionId[] = ["east_asia", "pacific", "europe", "middle_east"];

/** 国際緊張（🌐）の入口（指示書8・24章）。外交システムが持つ地域別の緊張度をそのまま見せる。 */
export function WorldTensionScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const { regionalTension } = state.diplomacy;

  return (
    <Panel title="🌐 国際緊張" onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.85rem] text-body-muted">地域ごとの緊張度。高いほど危機・軍事事案が起きやすい。</p>

        <div className="grid grid-cols-2 gap-2">
          {REGION_ORDER.map((region) => (
            <div key={region} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
              <p className="text-[0.7rem] text-body-muted">{REGION_LABELS[region]}</p>
              <p className="figures mt-0.5 text-[1.1rem] font-medium text-body">{Math.round(regionalTension[region])}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-raised">
                <div
                  className={`h-full rounded-full ${regionalTension[region] >= 60 ? "bg-alert" : "bg-brass/70"}`}
                  style={{ width: `${regionalTension[region]}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[0.78rem] text-body-faint">
          世界規模の緊張度指標・戦争許容度は今後のPhaseで実装予定。ここはその入口。
        </div>
      </div>
    </Panel>
  );
}
