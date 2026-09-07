import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { MILITARY_REGION_LABELS } from "../../data/military";
import { travelDays } from "../../engine/military";
import type { MilitaryRegionId, Unit } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const BRANCH_LABELS: Record<Unit["branch"], string> = { gsdf: "陸上自衛隊", msdf: "海上自衛隊", asdf: "航空自衛隊", joint: "統合部隊" };
const STATUS_LABELS: Record<Unit["status"], string> = { garrison: "駐屯中", moving: "移動中", deployed: "展開中" };

/** 部隊画面（指示書6・7章）。人員・装備・士気・所在地を持たせ、地域間の移動を指示できる。 */
export function UnitsScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  const { units } = state.military;

  return (
    <Panel title="👥 部隊" onClose={onClose}>
      <div className="flex flex-col gap-2 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {units.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">この国の部隊データはまだ用意されていない。</p>
        ) : (
          units.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => setOpenUnitId(unit.id)}
              className="flex flex-col gap-1.5 rounded-lg border border-line bg-ink-panel px-3.5 py-3 text-left transition-colors hover:border-brass/40"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.92rem] text-body">{unit.name}</span>
                <span className="text-[0.75rem] text-body-muted">{BRANCH_LABELS[unit.branch]}</span>
              </div>
              <p className="figures text-[0.78rem] text-body-muted">
                人員 {unit.personnel.current.toLocaleString("ja-JP")} / {unit.personnel.max.toLocaleString("ja-JP")} ・ 装備充足 {unit.equipmentRatePercent}% ・ 士気 {unit.moralePercent}%
              </p>
              <p className="text-[0.78rem] text-body-muted">
                所在地：{MILITARY_REGION_LABELS[unit.regionId]}（{STATUS_LABELS[unit.status]}）
              </p>
            </button>
          ))
        )}
      </div>

      {openUnitId && <UnitDetail unitId={openUnitId} onClose={() => setOpenUnitId(null)} />}
    </Panel>
  );
}

function UnitDetail({ unitId, onClose }: { unitId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const unit = state.military.units.find((u) => u.id === unitId);
  if (!unit) return null;

  return (
    <Modal title={unit.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.85rem]">
          <dt className="text-body-muted">所属</dt>
          <dd className="text-body">{BRANCH_LABELS[unit.branch]}</dd>
          <dt className="text-body-muted">人員</dt>
          <dd className="figures text-body">
            {unit.personnel.current.toLocaleString("ja-JP")} / {unit.personnel.max.toLocaleString("ja-JP")}
          </dd>
          <dt className="text-body-muted">装備充足</dt>
          <dd className="figures text-body">{unit.equipmentRatePercent}%</dd>
          <dt className="text-body-muted">士気</dt>
          <dd className="figures text-body">{unit.moralePercent}%</dd>
          <dt className="text-body-muted">所在地</dt>
          <dd className="text-body">{MILITARY_REGION_LABELS[unit.regionId]}</dd>
          <dt className="text-body-muted">状況</dt>
          <dd className="text-body">
            {STATUS_LABELS[unit.status]}
            {unit.status === "moving" && unit.destinationRegionId && `（${MILITARY_REGION_LABELS[unit.destinationRegionId]}へ）`}
          </dd>
        </dl>

        {unit.status === "garrison" && (
          <button
            type="button"
            onClick={() => setMovePickerOpen(true)}
            className="min-h-[48px] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
          >
            移動を指示する
          </button>
        )}
      </div>

      {movePickerOpen && (
        <Modal title="移動先を選ぶ" onClose={() => setMovePickerOpen(false)}>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(MILITARY_REGION_LABELS) as MilitaryRegionId[])
              .filter((id) => id !== unit.regionId)
              .map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    dispatch({ type: "MOVE_UNIT", unitId: unit.id, destinationRegionId: id });
                    setMovePickerOpen(false);
                    onClose();
                  }}
                  className="flex min-h-[48px] items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 text-left text-[0.88rem] text-body transition-colors hover:border-brass/40"
                >
                  <span>{MILITARY_REGION_LABELS[id]}</span>
                  <span className="figures text-[0.75rem] text-body-muted">約{travelDays(unit.regionId, id)}日</span>
                </button>
              ))}
          </div>
        </Modal>
      )}
    </Modal>
  );
}
