import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { MILITARY_REGION_LABELS } from "../../data/military";
import type { FleetMission } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const MISSION_LABELS: Record<FleetMission, string> = { patrol: "哨戒", escort: "護衛", transport: "輸送", blockade: "海上封鎖", asw: "対潜作戦" };

/** 海軍画面（指示書8章）。艦艇を艦隊として編成し、任務を設定する。 */
export function NavyScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [openFleetId, setOpenFleetId] = useState<string | null>(null);
  const { fleets, bases } = state.military;
  const openFleet = fleets.find((f) => f.id === openFleetId);

  return (
    <Panel title="🚢 海軍" onClose={onClose}>
      <div className="flex flex-col gap-2 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {fleets.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">この国の艦隊データはまだ用意されていない。</p>
        ) : (
          fleets.map((fleet) => {
            const base = bases.find((b) => b.id === fleet.baseId);
            return (
              <button
                key={fleet.id}
                type="button"
                onClick={() => setOpenFleetId(fleet.id)}
                className="flex flex-col gap-1.5 rounded-lg border border-line bg-ink-panel px-3.5 py-3 text-left transition-colors hover:border-brass/40"
              >
                <span className="text-[0.92rem] text-body">{fleet.name}</span>
                <p className="figures text-[0.78rem] text-body-muted">
                  {fleet.destroyers > 0 && `🚢護衛艦×${fleet.destroyers} `}
                  {fleet.submarines > 0 && `🌊潜水艦×${fleet.submarines} `}
                  {fleet.supplyShips > 0 && `⛽補給艦×${fleet.supplyShips}`}
                </p>
                <p className="text-[0.78rem] text-body-muted">
                  所在地：{base?.name ?? MILITARY_REGION_LABELS[fleet.regionId]} ・ 任務：{MISSION_LABELS[fleet.mission]}
                </p>
              </button>
            );
          })
        )}
      </div>

      {openFleet && (
        <Modal title={openFleet.name} onClose={() => setOpenFleetId(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-[0.85rem] text-body-muted">所在地：{bases.find((b) => b.id === openFleet.baseId)?.name ?? MILITARY_REGION_LABELS[openFleet.regionId]}</p>
            <div>
              <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">任務</p>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(MISSION_LABELS) as FleetMission[]).map((mission) => (
                  <button
                    key={mission}
                    type="button"
                    onClick={() => dispatch({ type: "SET_FLEET_MISSION", fleetId: openFleet.id, mission })}
                    className={`flex min-h-[46px] items-center rounded-lg border px-3.5 text-left text-[0.88rem] transition-colors ${
                      mission === openFleet.mission ? "border-brass bg-brass/15 text-brass" : "border-line text-body hover:border-brass/40"
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
