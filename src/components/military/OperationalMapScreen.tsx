import { Panel } from "../shared/Panel";
import { MILITARY_REGION_LABELS } from "../../data/military";
import type { FrontStatus, MilitaryRegionId } from "../../types/military";
import { useGameState } from "../../state/GameContext";

/** 地図上のおおよその配置（実際の地理を厳密になぞらない、指示書4章のスケッチに沿った簡略配置）。 */
const REGION_POSITIONS: Record<MilitaryRegionId, { x: number; y: number }> = {
  hokkaido: { x: 210, y: 50 },
  sea_of_japan: { x: 90, y: 190 },
  tohoku: { x: 230, y: 150 },
  kanto: { x: 250, y: 250 },
  pacific_ocean: { x: 340, y: 340 },
  chubu: { x: 190, y: 320 },
  kinki: { x: 160, y: 400 },
  chugoku: { x: 110, y: 460 },
  shikoku: { x: 190, y: 490 },
  kyushu: { x: 110, y: 540 },
  east_china_sea: { x: 40, y: 590 },
  nansei: { x: 110, y: 650 },
};

const FRONT_ICON: Record<FrontStatus, string> = { calm: "🟢", tense: "🟡", active: "🔴" };
const FRONT_SYMBOL: Record<FrontStatus, string> = { calm: "●", tense: "▲", active: "■" };
const FRONT_LABEL: Record<FrontStatus, string> = { calm: "平穏", tense: "緊張", active: "交戦" };

/**
 * 作戦地図（指示書4・5・24章）。実在の地理を厳密になぞる世界地図とは別に、
 * 部隊・基地・前線の状況だけを見せる簡略化した図にした——スマートフォンで
 * 判別できるよう、色だけでなくアイコン・記号も併用する。
 */
export function OperationalMapScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const { bases, units, fleets, airWings, war } = state.military;

  return (
    <Panel title="🗺 作戦地図" onClose={onClose}>
      <div className="flex flex-col gap-4 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {war && (
          <p className="rounded-lg border border-alert/30 bg-alert/10 px-3.5 py-2.5 text-center text-[0.85rem] text-alert">
            ⚔️ {war.enemyCountryId} との戦争状態——方面ごとの状況を🟢🟡🔴と●▲■の両方で示す。
          </p>
        )}

        <svg viewBox="0 0 400 720" className="h-[520px] w-full select-none">
          {(Object.keys(MILITARY_REGION_LABELS) as MilitaryRegionId[]).map((regionId) => {
            const pos = REGION_POSITIONS[regionId];
            const status = war?.frontStatus[regionId];
            const regionBases = bases.filter((b) => b.regionId === regionId);
            const regionUnits = units.filter((u) => u.regionId === regionId && u.status !== "moving");
            const regionFleets = fleets.filter((f) => f.regionId === regionId);
            const regionWings = airWings.filter((w) => w.baseId && regionBases.some((b) => b.id === w.baseId));

            return (
              <g key={regionId} transform={`translate(${pos.x} ${pos.y})`}>
                <circle r={22} fill="#1c232d" stroke={status ? undefined : "#2a303b"} strokeWidth={1.5} />
                <text textAnchor="middle" dy={-30} className="fill-body" style={{ fontSize: 11 }}>
                  {MILITARY_REGION_LABELS[regionId]}
                </text>
                {status && (
                  <text textAnchor="middle" dy={5} style={{ fontSize: 14 }}>
                    {FRONT_ICON[status]}
                    {FRONT_SYMBOL[status]}
                  </text>
                )}
                {(regionBases.length > 0 || regionUnits.length > 0 || regionFleets.length > 0 || regionWings.length > 0) && (
                  <text textAnchor="middle" dy={40} className="fill-body-muted" style={{ fontSize: 10 }}>
                    {regionUnits.length > 0 && `🪖${regionUnits.length} `}
                    {regionFleets.length > 0 && `🚢${regionFleets.length} `}
                    {regionWings.length > 0 && `✈️${regionWings.length}`}
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
          <span>🪖 陸上部隊</span>
          <span>🚢 艦隊</span>
          <span>✈️ 航空団</span>
        </div>
      </div>
    </Panel>
  );
}
