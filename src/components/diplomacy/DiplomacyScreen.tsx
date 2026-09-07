import { useState } from "react";
import { Panel } from "../shared/Panel";
import { findCountry } from "../../data/countries";
import { REGION_LABELS, STANCES } from "../../data/diplomacy";
import { computeRelation, relationStatusLabel } from "../../engine/diplomacy";
import type { RegionId } from "../../types/diplomacy";
import { useGameDispatch, useGameState } from "../../state/GameContext";
import { CountryDiplomacyDetail } from "./CountryDiplomacyDetail";
import { TreatyListScreen } from "./TreatyListScreen";

const REGION_ORDER: RegionId[] = ["east_asia", "pacific", "europe", "middle_east"];

/**
 * 外交画面（Phase 4指示書0〜29章）。国ごとの関係・世界情勢・スタンス・
 * 条約一覧・外交記録をひとつの画面にまとめる——政治・経済画面と同じ密度。
 */
export function DiplomacyScreen({ onClose, initialCountryId }: { onClose: () => void; initialCountryId?: string | null }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [openCountryId, setOpenCountryId] = useState<string | null>(initialCountryId ?? null);
  const [treatyListOpen, setTreatyListOpen] = useState(false);

  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const { relations, regionalTension, stances, factions, eventLog, mapOverlayEnabled } = state.diplomacy;
  const countryIds = Object.keys(relations);
  const ledByPlayer = factions.filter((faction) => faction.leaderCountryId === state.playerCountryId);

  return (
    <Panel title={`${player?.flag ?? ""} 外交`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.8rem] font-medium tracking-wider text-brass">🌍 外交</p>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">🌐 世界情勢</p>
          <div className="grid grid-cols-2 gap-2">
            {REGION_ORDER.map((region) => (
              <div key={region} className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
                <p className="text-[0.7rem] text-body-muted">{REGION_LABELS[region]}</p>
                <p className="figures mt-0.5 text-[1rem] font-medium text-body">{Math.round(regionalTension[region])}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-raised">
                  <div className="h-full rounded-full bg-brass/70" style={{ width: `${regionalTension[region]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[0.75rem] font-medium tracking-wider text-brass">諸外国との関係</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_MAP_OVERLAY" })}
              className={`shrink-0 rounded border px-2 py-1 text-[0.7rem] transition-colors ${
                mapOverlayEnabled ? "border-brass bg-brass/15 text-brass" : "border-line text-body-muted"
              }`}
            >
              地図に関係線を表示
            </button>
          </div>
          {countryIds.length === 0 ? (
            <p className="text-[0.85rem] text-body-muted">この国の外交データはまだ用意されていない。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {countryIds.map((id) => {
                const country = findCountry(state.countries, id);
                const relation = computeRelation(relations[id]);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOpenCountryId(id)}
                    className="flex min-h-[52px] items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 text-left transition-colors hover:border-brass/40"
                  >
                    <span className="flex items-center gap-2 text-[0.9rem] text-body">
                      <span aria-hidden>{country?.flag}</span>
                      {country?.name ?? id}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[0.75rem] text-body-muted">{relationStatusLabel(relation)}</span>
                      <span className="figures w-10 text-right text-[0.9rem] text-body">
                        {relation >= 0 ? "+" : ""}
                        {relation}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">🧭 外交スタンス（複数選択可）</p>
          <div className="flex flex-wrap gap-1.5">
            {STANCES.map((stance) => {
              const active = stances.includes(stance.id);
              return (
                <button
                  key={stance.id}
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_STANCE", stanceId: stance.id })}
                  className={`rounded-full border px-3 py-1.5 text-[0.78rem] transition-colors ${
                    active ? "border-brass bg-brass/15 text-brass" : "border-line text-body-muted"
                  }`}
                >
                  {stance.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setTreatyListOpen(true)}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          📜 条約一覧を見る
        </button>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">🛡 陣営</p>
          {factions.length === 0 ? (
            <p className="mb-2 text-[0.85rem] text-body-muted">まだどの陣営にも属していない。</p>
          ) : (
            <div className="mb-2 flex flex-col gap-2">
              {factions.map((faction) => (
                <div key={faction.id} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                  <p className="text-[0.88rem] text-body">{faction.name}</p>
                  <p className="text-[0.75rem] text-body-muted">
                    {faction.memberCountryIds
                      .map((id) => findCountry(state.countries, id)?.name ?? id)
                      .join("、")}
                  </p>
                </div>
              ))}
            </div>
          )}
          {ledByPlayer.length === 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "PROPOSE_FACTION", name: `${player?.name ?? "自国"}陣営` })}
              className="flex min-h-[44px] items-center justify-center rounded border border-line text-[0.85rem] text-body-muted transition-colors hover:border-brass/40 hover:text-body"
            >
              陣営を立ち上げる
            </button>
          )}
        </div>

        {eventLog.length > 0 && (
          <div>
            <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">📰 外交記録</p>
            <ul className="flex flex-col gap-1.5 text-[0.82rem] text-body-muted">
              {[...eventLog]
                .slice(-8)
                .reverse()
                .map((entry) => (
                  <li key={entry.id}>・{entry.text}</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {openCountryId && <CountryDiplomacyDetail countryId={openCountryId} onClose={() => setOpenCountryId(null)} />}
      {treatyListOpen && <TreatyListScreen onClose={() => setTreatyListOpen(false)} />}
    </Panel>
  );
}
