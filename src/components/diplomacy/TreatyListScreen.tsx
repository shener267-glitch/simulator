import { Panel } from "../shared/Panel";
import { findCountry } from "../../data/countries";
import { findTreaty } from "../../data/diplomacy";
import { useGameState } from "../../state/GameContext";

/** 締結中の全条約を、相手国を問わず一覧できる画面（Phase 4指示書13章）。 */
export function TreatyListScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const entries = Object.values(state.diplomacy.relations).flatMap((country) =>
    country.treaties.map((treaty) => ({ countryId: country.countryId, treaty })),
  );

  return (
    <Panel title="📜 条約一覧" onClose={onClose}>
      <div className="flex flex-col gap-2 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-[0.85rem] text-body-muted">締結中の条約はまだ無い。</p>
        ) : (
          entries.map(({ countryId, treaty }) => {
            const target = findCountry(state.countries, countryId);
            const template = findTreaty(treaty.treatyTypeId);
            return (
              <div key={treaty.id} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                <p className="text-[0.9rem] text-body">{template?.name ?? treaty.treatyTypeId}</p>
                <p className="text-[0.78rem] text-body-muted">
                  {target?.flag} {target?.name ?? countryId}
                </p>
                <p className="text-[0.75rem] text-body-muted">
                  {treaty.expiresAtMinute === null ? "無期限" : "期限あり"} — {template?.breakConditionLabel}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
