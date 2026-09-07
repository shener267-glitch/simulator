import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { MILITARY_REGION_LABELS } from "../../data/military";
import type { AirWingMission } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const MISSION_LABELS: Record<AirWingMission, string> = { air_defense: "防空", intercept: "迎撃", air_superiority: "航空優勢" };

/** 航空戦力画面（指示書9・10章）。航空機は基地に配置し、航続圏内の地域をカバーする。 */
export function AirForceScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [openWingId, setOpenWingId] = useState<string | null>(null);
  const { airWings, bases } = state.military;
  const openWing = airWings.find((w) => w.id === openWingId);

  return (
    <Panel title="✈️ 航空" onClose={onClose}>
      <div className="flex flex-col gap-2 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {airWings.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">この国の航空団データはまだ用意されていない。</p>
        ) : (
          airWings.map((wing) => {
            const base = bases.find((b) => b.id === wing.baseId);
            return (
              <button
                key={wing.id}
                type="button"
                onClick={() => setOpenWingId(wing.id)}
                className="flex flex-col gap-1.5 rounded-lg border border-line bg-ink-panel px-3.5 py-3 text-left transition-colors hover:border-brass/40"
              >
                <span className="text-[0.92rem] text-body">{wing.name}</span>
                <p className="figures text-[0.78rem] text-body-muted">
                  ✈️ 戦闘機×{wing.fighters} {wing.supportAircraft > 0 && `🛩 支援機×${wing.supportAircraft}`}
                </p>
                <p className="text-[0.78rem] text-body-muted">
                  {base?.name ?? "—"} ・ 任務：{MISSION_LABELS[wing.mission]}
                </p>
                <p className="text-[0.75rem] text-body-muted">カバー地域：{wing.coverageRegionIds.map((id) => MILITARY_REGION_LABELS[id]).join("、")}</p>
              </button>
            );
          })
        )}
      </div>

      {openWing && (
        <Modal title={openWing.name} onClose={() => setOpenWingId(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-[0.85rem] text-body-muted">配置基地：{bases.find((b) => b.id === openWing.baseId)?.name ?? "—"}</p>
            <p className="text-[0.85rem] text-body-muted">航続圏内のカバー地域：{openWing.coverageRegionIds.map((id) => MILITARY_REGION_LABELS[id]).join("、")}（基地からの航続距離で決まる）</p>
            <div>
              <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">任務</p>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(MISSION_LABELS) as AirWingMission[]).map((mission) => (
                  <button
                    key={mission}
                    type="button"
                    onClick={() => dispatch({ type: "SET_AIRWING_MISSION", airWingId: openWing.id, mission })}
                    className={`flex min-h-[46px] items-center rounded-lg border px-3.5 text-left text-[0.88rem] transition-colors ${
                      mission === openWing.mission ? "border-brass bg-brass/15 text-brass" : "border-line text-body hover:border-brass/40"
                    }`}
                  >
                    {MISSION_LABELS[mission]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
