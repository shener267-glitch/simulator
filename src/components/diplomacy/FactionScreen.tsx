import { Panel } from "../shared/Panel";
import { findCountry } from "../../data/countries";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/** 陣営（🤝）の入口（指示書8・14章）。外交システムが持つ簡易陣営データをそのまま見せる。 */
export function FactionScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { factions } = state.diplomacy;
  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const ledByPlayer = factions.filter((faction) => faction.leaderCountryId === state.playerCountryId);

  return (
    <Panel title="🤝 陣営" onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.85rem] text-body-muted">同盟に近い、ゆるい国家グループ。加盟国は外交行動で増減する。</p>

        {factions.length === 0 ? (
          <p className="text-[0.85rem] text-body-muted">まだどの陣営にも属していない。</p>
        ) : (
          <div className="flex flex-col gap-2">
            {factions.map((faction) => (
              <div key={faction.id} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                <p className="text-[0.9rem] text-body">{faction.name}</p>
                <p className="mt-1 text-[0.78rem] text-body-muted">
                  {faction.memberCountryIds.map((id) => findCountry(state.countries, id)?.name ?? id).join("、")}
                </p>
              </div>
            ))}
          </div>
        )}

        {ledByPlayer.length === 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "PROPOSE_FACTION", name: `${player?.name ?? "自国"}陣営` })}
            className="flex min-h-[48px] items-center justify-center rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
          >
            陣営を立ち上げる
          </button>
        )}

        <div className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[0.78rem] text-body-faint">
          陣営内の指揮系統・共同作戦は今後のPhaseで実装予定。ここはその入口。
        </div>
      </div>
    </Panel>
  );
}
