import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { MILITARY_REGION_LABELS, findProvince } from "../../data/military";
import type { FrontStatus, MilitaryRegionId, Province } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const FRONT_ICON: Record<FrontStatus, string> = { calm: "🟢", tense: "🟡", active: "🔴" };
const FRONT_SYMBOL: Record<FrontStatus, string> = { calm: "●", tense: "▲", active: "■" };
const FRONT_LABEL: Record<FrontStatus, string> = { calm: "平穏", tense: "緊張", active: "交戦" };
const TERRAIN_LABELS: Record<Province["terrain"], string> = { plains: "平地", mountains: "山地", forest: "森林", urban: "都市", coastal: "沿岸", sea: "海域" };

/**
 * 作戦地図（HOI4型改訂・指示書1〜5章）。実在の地理を厳密になぞる世界地図とは
 * 別に、プロヴィンス単位で部隊・基地・前線の状況を見せる。師団を選択して
 * プロヴィンスをタップすると、その場で移動・攻撃命令を出せる——「師団を選択
 * →隣接プロヴィンスをタップ→移動命令」という指示書の操作をそのまま
 * 地図上で行える。色だけでなくアイコン・記号も併用する。
 */
export function OperationalMapScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { provinces, units, fleets, airWings, bases, war } = state.military;
  const [openProvinceId, setOpenProvinceId] = useState<string | null>(null);
  const [moveUnitIds, setMoveUnitIds] = useState<string[] | null>(null);

  function tapProvince(provinceId: string) {
    if (moveUnitIds) {
      dispatch({ type: "MOVE_UNITS", unitIds: moveUnitIds, destinationProvinceId: provinceId });
      setMoveUnitIds(null);
      return;
    }
    setOpenProvinceId(provinceId);
  }

  const openProvince = openProvinceId ? findProvince(provinces, openProvinceId) : undefined;

  return (
    <Panel title="🗺 作戦地図" onClose={onClose}>
      <div className="flex flex-col gap-4 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {moveUnitIds && (
          <p className="rounded-lg border border-brass/40 bg-brass/10 px-3.5 py-2.5 text-center text-[0.85rem] text-brass">
            移動先のプロヴィンスをタップ（⚔️は攻撃になる）
            <button type="button" onClick={() => setMoveUnitIds(null)} className="ml-2 underline">
              取消
            </button>
          </p>
        )}
        {war && !moveUnitIds && (
          <p className="rounded-lg border border-alert/30 bg-alert/10 px-3.5 py-2.5 text-center text-[0.85rem] text-alert">
            ⚔️ {war.enemyCountryId} との戦争状態——係争プロヴィンスには⚔️マークがつく。
          </p>
        )}

        <svg viewBox="0 0 400 720" className="h-[560px] w-full select-none">
          {provinces.map((province) => {
            const regionUnits = units.filter((u) => u.provinceId === province.id && u.status !== "moving");
            const regionFleets = fleets.filter((f) => f.provinceId === province.id && f.status !== "moving");
            const regionWings = airWings.filter((w) => bases.find((b) => b.id === w.baseId)?.provinceId === province.id);
            const hasFriendlyGarrison = regionUnits.length > 0;

            return (
              <g key={province.id} transform={`translate(${province.position.x} ${province.position.y})`} onClick={() => tapProvince(province.id)} className="cursor-pointer">
                <circle
                  r={province.kind === "sea" ? 14 : 16}
                  fill={province.kind === "sea" ? "#0f1a26" : "#1c232d"}
                  stroke={province.contested ? "#c0564f" : moveUnitIds && province.kind === "land" ? "#c8a96b" : "#2a303b"}
                  strokeWidth={province.contested || moveUnitIds ? 2.5 : 1.5}
                />
                <text textAnchor="middle" dy={-22} className="fill-body" style={{ fontSize: 9.5 }}>
                  {province.contested && "⚔️"}
                  {province.name}
                </text>
                {(regionUnits.length > 0 || regionFleets.length > 0 || regionWings.length > 0 || province.baseId) && (
                  <text textAnchor="middle" dy={30} className="fill-body-muted" style={{ fontSize: 9 }}>
                    {province.baseId && "🏭"}
                    {regionUnits.length > 0 && `🪖${regionUnits.length}`}
                    {regionFleets.length > 0 && `🚢${regionFleets.length}`}
                    {regionWings.length > 0 && `✈️${regionWings.length}`}
                  </text>
                )}
                {hasFriendlyGarrison && !moveUnitIds && (
                  <text textAnchor="middle" dy={4} style={{ fontSize: 9 }} className="fill-brass">
                    ●
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {war && (
          <div>
            <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">方面ごとの状況</p>
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
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-body-muted">
          <span>🏭 基地</span>
          <span>🪖 陸上部隊</span>
          <span>🚢 艦隊</span>
          <span>✈️ 航空団</span>
          <span>⚔️ 係争中</span>
        </div>
      </div>

      {openProvince && (
        <ProvinceDetailModal
          province={openProvince}
          onClose={() => setOpenProvinceId(null)}
          onStartMove={(unitIds) => {
            setOpenProvinceId(null);
            setMoveUnitIds(unitIds);
          }}
        />
      )}
    </Panel>
  );
}

function ProvinceDetailModal({ province, onClose, onStartMove }: { province: Province; onClose: () => void; onStartMove: (unitIds: string[]) => void }) {
  const state = useGameState();
  const { units, fleets, airWings, bases, provinces } = state.military;
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const garrisonUnits = units.filter((u) => u.provinceId === province.id && u.status === "garrison");
  const movingUnits = units.filter((u) => u.provinceId === province.id && u.status === "moving");
  const stationedFleets = fleets.filter((f) => f.provinceId === province.id);
  const stationedBase = province.baseId ? bases.find((b) => b.id === province.baseId) : undefined;
  const stationedWings = stationedBase ? airWings.filter((w) => w.baseId === stationedBase.id) : [];

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Modal title={province.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.85rem]">
          <dt className="text-body-muted">所有国</dt>
          <dd className="text-body">{province.ownerCountryId}</dd>
          <dt className="text-body-muted">地形</dt>
          <dd className="text-body">{TERRAIN_LABELS[province.terrain]}</dd>
          <dt className="text-body-muted">インフラ</dt>
          <dd className="figures text-body">{province.infrastructureLevel} / 10</dd>
          <dt className="text-body-muted">補給</dt>
          <dd className="figures text-body">{province.supplyLevel} / 100</dd>
          <dt className="text-body-muted">要塞化</dt>
          <dd className="figures text-body">{province.fortificationLevel} / 10</dd>
          <dt className="text-body-muted">都市／港</dt>
          <dd className="text-body">
            {province.hasCity ? "都市 " : ""}
            {province.hasPort ? "港" : ""}
            {!province.hasCity && !province.hasPort && "—"}
          </dd>
          {province.contested && (
            <>
              <dt className="text-body-muted">状況</dt>
              <dd className="text-alert">⚔️ 係争中</dd>
            </>
          )}
        </dl>

        {(garrisonUnits.length > 0 || movingUnits.length > 0 || stationedFleets.length > 0 || stationedWings.length > 0) && (
          <div>
            <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">現在いる部隊</p>
            <ul className="flex flex-col gap-1 text-[0.85rem] text-body">
              {garrisonUnits.map((u) => (
                <li key={u.id}>🪖 {u.name}</li>
              ))}
              {movingUnits.map((u) => (
                <li key={u.id} className="text-body-muted">
                  🪖 {u.name}（移動中→{findProvince(provinces, u.destinationProvinceId ?? "")?.name}）
                </li>
              ))}
              {stationedFleets.map((f) => (
                <li key={f.id}>🚢 {f.name}</li>
              ))}
              {stationedWings.map((w) => (
                <li key={w.id}>✈️ {w.name}</li>
              ))}
            </ul>
          </div>
        )}

        {province.kind === "land" && garrisonUnits.length > 0 && (
          <>
            {!selecting ? (
              <button
                type="button"
                onClick={() => setSelecting(true)}
                className="min-h-[48px] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
              >
                ここから部隊を移動
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {garrisonUnits.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink-panel px-3 py-2 text-[0.85rem] text-body">
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggle(u.id)} className="h-5 w-5" />
                    {u.name}
                  </label>
                ))}
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => onStartMove(selectedIds)}
                  className="min-h-[48px] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  地図で移動先をタップ
                </button>
              </div>
            )}
          </>
        )}

        {province.kind === "land" && garrisonUnits.length === 0 && movingUnits.length === 0 && (
          <p className="text-[0.78rem] text-body-muted">このプロヴィンスには現在、駐屯している部隊がいない。</p>
        )}
      </div>
    </Modal>
  );
}
