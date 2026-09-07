import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { findProvince } from "../../data/military";
import { provinceTravelDays } from "../../engine/military";
import type { Unit } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const BRANCH_LABELS: Record<Unit["branch"], string> = { gsdf: "陸上自衛隊", msdf: "海上自衛隊", asdf: "航空自衛隊", joint: "統合部隊" };
const STATUS_LABELS: Record<Unit["status"], string> = { garrison: "駐屯中", moving: "移動中", deployed: "展開中" };

/**
 * 部隊画面（指示書1・3・4・6・7章、HOI4型改訂）。師団を選択してプロヴィンスを
 * 指定し、直接移動・攻撃・防御を命令できる。複数の師団を同時に選んで
 * まとめて移動させることもできる。
 */
export function UnitsScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const { units, provinces } = state.military;

  function toggleSelected(unitId: string) {
    setSelectedIds((prev) => (prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]));
  }

  return (
    <Panel
      title="👥 部隊"
      onClose={onClose}
      actions={
        <button
          type="button"
          onClick={() => {
            setSelectionMode((v) => !v);
            setSelectedIds([]);
          }}
          className={`rounded border px-2.5 py-1.5 text-[0.75rem] transition-colors ${selectionMode ? "border-brass bg-brass/15 text-brass" : "border-line text-body-muted"}`}
        >
          複数選択
        </button>
      }
    >
      <div className="flex flex-col gap-2 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
        {units.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">この国の部隊データはまだ用意されていない。</p>
        ) : (
          units.map((unit) => {
            const location = findProvince(provinces, unit.provinceId);
            const selected = selectedIds.includes(unit.id);
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => (selectionMode ? (unit.status === "garrison" ? toggleSelected(unit.id) : undefined) : setOpenUnitId(unit.id))}
                disabled={selectionMode && unit.status !== "garrison"}
                className={`flex flex-col gap-1.5 rounded-lg border px-3.5 py-3 text-left transition-colors disabled:opacity-40 ${
                  selected ? "border-brass bg-brass/10" : "border-line bg-ink-panel hover:border-brass/40"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.92rem] text-body">
                    {selectionMode && (unit.status === "garrison" ? (selected ? "☑ " : "☐ ") : "")}
                    {unit.name}
                  </span>
                  <span className="text-[0.75rem] text-body-muted">{BRANCH_LABELS[unit.branch]}</span>
                </div>
                <p className="figures text-[0.78rem] text-body-muted">
                  人員 {unit.personnel.current.toLocaleString("ja-JP")} / {unit.personnel.max.toLocaleString("ja-JP")} ・ 装備充足 {unit.equipmentRatePercent}% ・ 士気 {unit.moralePercent}%
                </p>
                <p className="text-[0.78rem] text-body-muted">
                  所在地：{location?.name ?? unit.provinceId}（{STATUS_LABELS[unit.status]}
                  {unit.order === "defend" ? "・防御中" : ""}）
                </p>
              </button>
            );
          })
        )}
      </div>

      {selectionMode && selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-panel px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setBatchMoveOpen(true)}
            className="flex min-h-[48px] w-full items-center justify-center rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
          >
            選択した{selectedIds.length}個師団を移動
          </button>
        </div>
      )}

      {openUnitId && <UnitDetail unitId={openUnitId} onClose={() => setOpenUnitId(null)} />}

      {batchMoveOpen && (
        <ProvincePicker
          fromProvinceId={findProvince(provinces, units.find((u) => u.id === selectedIds[0])?.provinceId ?? "")?.id ?? ""}
          onClose={() => setBatchMoveOpen(false)}
          onPick={(destinationProvinceId) => {
            dispatch({ type: "MOVE_UNITS", unitIds: selectedIds, destinationProvinceId });
            setBatchMoveOpen(false);
            setSelectionMode(false);
            setSelectedIds([]);
          }}
        />
      )}
    </Panel>
  );
}

function UnitDetail({ unitId, onClose }: { unitId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const unit = state.military.units.find((u) => u.id === unitId);
  if (!unit) return null;
  const location = findProvince(state.military.provinces, unit.provinceId);

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
          <dd className="text-body">
            {location?.name ?? unit.provinceId}
            {location && ` （${location.terrain}・要塞化${location.fortificationLevel}）`}
          </dd>
          <dt className="text-body-muted">状況</dt>
          <dd className="text-body">
            {STATUS_LABELS[unit.status]}
            {unit.status === "moving" && unit.destinationProvinceId && `（${findProvince(state.military.provinces, unit.destinationProvinceId)?.name ?? unit.destinationProvinceId}へ）`}
            {unit.order === "defend" && "・防御命令中"}
          </dd>
        </dl>

        {unit.status === "garrison" && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMovePickerOpen(true)}
              className="min-h-[48px] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
            >
              移動・攻撃を指示する
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_UNIT_ORDER", unitId: unit.id, order: unit.order === "defend" ? null : "defend" })}
              className={`min-h-[48px] rounded border text-[0.9rem] font-medium transition-colors ${
                unit.order === "defend" ? "border-brass bg-brass/15 text-brass" : "border-line text-body-muted hover:border-brass/40"
              }`}
            >
              {unit.order === "defend" ? "防御命令を解除する" : "防御を命令する"}
            </button>
          </div>
        )}
      </div>

      {movePickerOpen && (
        <ProvincePicker
          fromProvinceId={unit.provinceId}
          onClose={() => setMovePickerOpen(false)}
          onPick={(destinationProvinceId) => {
            dispatch({ type: "MOVE_UNITS", unitIds: [unit.id], destinationProvinceId });
            setMovePickerOpen(false);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

/** プロヴィンス選択（移動先＝陸上のみ）。係争中のプロヴィンスは⚔️をつけ、選ぶと攻撃命令を兼ねることを示す。 */
function ProvincePicker({ fromProvinceId, onClose, onPick }: { fromProvinceId: string; onClose: () => void; onPick: (provinceId: string) => void }) {
  const state = useGameState();
  const { provinces } = state.military;

  return (
    <Modal title="移動先を選ぶ" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        {provinces
          .filter((p) => p.kind === "land" && p.id !== fromProvinceId)
          .map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="flex min-h-[48px] items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 text-left text-[0.88rem] text-body transition-colors hover:border-brass/40"
            >
              <span>
                {p.contested && "⚔️ "}
                {p.name}
                {p.contested && <span className="ml-1 text-[0.72rem] text-alert">（攻撃）</span>}
              </span>
              <span className="figures text-[0.75rem] text-body-muted">約{provinceTravelDays(provinces, fromProvinceId, p.id)}日</span>
            </button>
          ))}
      </div>
    </Modal>
  );
}
