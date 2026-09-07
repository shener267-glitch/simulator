import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { ALLIANCE_COOPERATIONS } from "../../data/military";
import { CONFIDENCE_LABEL_JA, confidenceLabel } from "../../engine/military";
import type { AllianceCooperationId } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 情報画面（Phase 5指示書20・21・27章）。各国の軍事動向を、必ず不確実な
 * 確度つきで見せる——プレイヤーが世界のすべてを知っている状態にはしない。
 * 陣営を組んでいる相手とは、ここから軍事協力も申し入れられる（指示書27章）。
 */
export function IntelligenceScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [openCountryId, setOpenCountryId] = useState<string | null>(null);
  const { intel } = state.military;
  const countryIds = Object.keys(intel);

  return (
    <Panel title="🕵 情報" onClose={onClose}>
      <div className="flex flex-col gap-2 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.8rem] font-medium tracking-wider text-brass">🛰 各国の軍事情報</p>
        {countryIds.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">この国の情報データはまだ用意されていない。</p>
        ) : (
          countryIds.map((id) => {
            const country = findCountry(state.countries, id);
            const snapshot = intel[id];
            const confidence = confidenceLabel(snapshot.confidencePercent);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOpenCountryId(id)}
                className="flex flex-col gap-2 rounded-lg border border-line bg-ink-panel px-3.5 py-3 text-left transition-colors hover:border-brass/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[0.9rem] text-body">
                    <span aria-hidden>{country?.flag}</span>
                    {country?.name ?? id}
                  </span>
                  <span className="text-[0.75rem] text-body-muted">{CONFIDENCE_LABEL_JA[confidence]}</span>
                </div>
                <IntelBar label="陸軍" value={snapshot.landEstimate} />
                <IntelBar label="海軍" value={snapshot.seaEstimate} />
                <IntelBar label="航空" value={snapshot.airEstimate} />
              </button>
            );
          })
        )}
      </div>

      {openCountryId && <CooperationDetail countryId={openCountryId} onClose={() => setOpenCountryId(null)} />}
    </Panel>
  );
}

function IntelBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[0.72rem] text-body-muted">
        <span>{label}</span>
        <span className="figures">{Math.round(value)}</span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-ink-raised">
        <div className="h-full rounded-full bg-brass/60" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CooperationDetail({ countryId, onClose }: { countryId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const country = findCountry(state.countries, countryId);
  const isAlly = state.diplomacy.factions.some((faction) => faction.leaderCountryId === state.playerCountryId && faction.memberCountryIds.includes(countryId));
  const politicalPower = state.politics.stats.politicalPower;

  return (
    <Modal title={`${country?.flag ?? ""} ${country?.name ?? countryId}`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">🤝 同盟国との軍事協力</p>
        {!isAlly ? (
          <p className="text-[0.85rem] text-body-muted">陣営を組んでいる相手にだけ申し入れられる（🌍外交画面の陣営を参照）。</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ALLIANCE_COOPERATIONS.map((cooperation) => (
              <button
                key={cooperation.id}
                type="button"
                disabled={politicalPower < cooperation.politicalPowerCost}
                onClick={() => dispatch({ type: "MILITARY_COOPERATION_ACTION", countryId, cooperationId: cooperation.id as AllianceCooperationId })}
                className="flex min-h-[48px] items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 text-left text-[0.88rem] text-body transition-colors enabled:hover:border-brass/40 disabled:opacity-40"
              >
                <span>
                  {cooperation.name}
                  <span className="ml-2 text-[0.75rem] text-body-muted">{cooperation.description}</span>
                </span>
                <span className="figures shrink-0 text-[0.75rem] text-body-muted">PP{cooperation.politicalPowerCost}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
