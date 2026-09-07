import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { MILITARY_REGION_LABELS } from "../../data/military";
import type { FrontStatus, MilitaryRegionId, OperationPriority } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const FRONT_ICON: Record<FrontStatus, string> = { calm: "🟢", tense: "🟡", active: "🔴" };
const FRONT_SYMBOL: Record<FrontStatus, string> = { calm: "●", tense: "▲", active: "■" };
const FRONT_LABEL: Record<FrontStatus, string> = { calm: "平穏", tense: "緊張", active: "交戦" };
const PRIORITY_LABELS: Record<OperationPriority, string> = { defense: "防衛", sea_control: "海上交通路の確保", air_superiority: "航空優勢の確保", logistics: "兵站の維持" };

/**
 * 戦争画面（Phase 5指示書24〜26章）。プレイヤーは部隊を1マスずつ操作せず、
 * 「どの方面を優先するか」という国家レベルの作戦方針を決める——実際の運用は
 * AIに委ねる。詳細な戦闘計算はしない。
 */
export function WarScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [createOpen, setCreateOpen] = useState(false);
  const war = state.military.war;
  if (!war) return null;
  const enemy = findCountry(state.countries, war.enemyCountryId);

  return (
    <Panel title="⚔️ 戦争" onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <div className="rounded-lg border border-alert/30 bg-alert/10 px-4 py-3 text-center">
          <p className="text-[0.95rem] text-body">
            🇯🇵 日本 <span className="text-alert">VS</span> {enemy?.flag ?? ""} {enemy?.name ?? war.enemyCountryId}
          </p>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">戦況</p>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(war.frontStatus) as [MilitaryRegionId, FrontStatus][]).map(([regionId, status]) => (
              <div key={regionId} className="flex items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 py-2 text-[0.85rem]">
                <span className="text-body">{MILITARY_REGION_LABELS[regionId]}</span>
                <span className="text-body-muted">
                  {FRONT_ICON[status]} {FRONT_SYMBOL[status]} {FRONT_LABEL[status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.75rem] font-medium tracking-wider text-brass">作戦</p>
            <button type="button" onClick={() => setCreateOpen(true)} className="rounded border border-brass/60 bg-brass/10 px-2.5 py-1 text-[0.75rem] text-brass hover:bg-brass/20">
              ＋ 作戦を立てる
            </button>
          </div>
          {state.military.operations.length === 0 ? (
            <p className="text-[0.85rem] text-body-muted">まだ作戦を立てていない。作戦を割り当てた方面は持ちこたえやすくなる。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {state.military.operations.map((operation) => (
                <OperationCard key={operation.id} operationId={operation.id} />
              ))}
            </div>
          )}
        </div>
      </div>

      {createOpen && <CreateOperationModal onClose={() => setCreateOpen(false)} />}
    </Panel>
  );
}

function OperationCard({ operationId }: { operationId: string }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const operation = state.military.operations.find((op) => op.id === operationId);
  if (!operation) return null;

  return (
    <div className="rounded-lg border border-line bg-ink-panel px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.9rem] text-body">{operation.name}</span>
        <button type="button" onClick={() => dispatch({ type: "END_OPERATION", operationId: operation.id })} className="text-[0.75rem] text-body-muted hover:text-alert">
          終了
        </button>
      </div>
      <p className="text-[0.78rem] text-body-muted">{operation.objective}</p>
      <p className="text-[0.78rem] text-body-muted">
        {MILITARY_REGION_LABELS[operation.regionId]} ・ 優先：{PRIORITY_LABELS[operation.priority]}
      </p>
      <p className="figures text-[0.75rem] text-body-muted">
        部隊{operation.unitIds.length} ・ 艦隊{operation.fleetIds.length} ・ 航空団{operation.airWingIds.length}
      </p>
    </div>
  );
}

function CreateOperationModal({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [regionId, setRegionId] = useState<MilitaryRegionId>("nansei");
  const [priority, setPriority] = useState<OperationPriority>("defense");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [fleetIds, setFleetIds] = useState<string[]>([]);
  const [airWingIds, setAirWingIds] = useState<string[]>([]);
  const canAfford = state.politics.stats.politicalPower >= 15;

  function toggle(list: string[], setList: (next: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <Modal title="作戦を立てる" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-[0.8rem] text-body-muted">
          作戦名
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：南西諸島防衛" className="min-h-[44px] rounded border border-line bg-ink px-3 text-[0.9rem] text-body" />
        </label>
        <label className="flex flex-col gap-1 text-[0.8rem] text-body-muted">
          目的
          <input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="例：南西諸島の防衛" className="min-h-[44px] rounded border border-line bg-ink px-3 text-[0.9rem] text-body" />
        </label>

        <div>
          <p className="mb-1.5 text-[0.75rem] font-medium tracking-wider text-brass">方面</p>
          <select value={regionId} onChange={(e) => setRegionId(e.target.value as MilitaryRegionId)} className="min-h-[44px] w-full rounded border border-line bg-ink px-3 text-[0.9rem] text-body">
            {(Object.keys(MILITARY_REGION_LABELS) as MilitaryRegionId[]).map((id) => (
              <option key={id} value={id}>
                {MILITARY_REGION_LABELS[id]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-[0.75rem] font-medium tracking-wider text-brass">優先</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PRIORITY_LABELS) as OperationPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-full border px-3 py-1.5 text-[0.78rem] transition-colors ${p === priority ? "border-brass bg-brass/15 text-brass" : "border-line text-body-muted"}`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[0.75rem] font-medium tracking-wider text-brass">投入する部隊・艦隊・航空団</p>
          <div className="flex flex-col gap-1">
            {state.military.units.map((unit) => (
              <label key={unit.id} className="flex items-center gap-2 text-[0.85rem] text-body">
                <input type="checkbox" checked={unitIds.includes(unit.id)} onChange={() => toggle(unitIds, setUnitIds, unit.id)} className="h-5 w-5" />
                🪖 {unit.name}
              </label>
            ))}
            {state.military.fleets.map((fleet) => (
              <label key={fleet.id} className="flex items-center gap-2 text-[0.85rem] text-body">
                <input type="checkbox" checked={fleetIds.includes(fleet.id)} onChange={() => toggle(fleetIds, setFleetIds, fleet.id)} className="h-5 w-5" />
                🚢 {fleet.name}
              </label>
            ))}
            {state.military.airWings.map((wing) => (
              <label key={wing.id} className="flex items-center gap-2 text-[0.85rem] text-body">
                <input type="checkbox" checked={airWingIds.includes(wing.id)} onChange={() => toggle(airWingIds, setAirWingIds, wing.id)} className="h-5 w-5" />
                ✈️ {wing.name}
              </label>
            ))}
          </div>
        </div>

        <p className="text-[0.85rem] text-body-muted">
          必要政治力 <span className="figures text-body">15</span>
        </p>
        {!canAfford && <p className="text-[0.8rem] text-alert">政治力が足りない。</p>}
        <button
          type="button"
          disabled={!canAfford || name.trim() === ""}
          onClick={() => {
            dispatch({ type: "START_OPERATION", name, objective, regionId, priority, unitIds, fleetIds, airWingIds });
            onClose();
          }}
          className="min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
        >
          作戦を開始する
        </button>
      </div>
    </Modal>
  );
}
