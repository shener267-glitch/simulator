import { useState } from "react";
import { Modal } from "../shared/Modal";
import { TREATIES } from "../../data/diplomacy";
import { canProposeTreaty, describeDiplomacyEffect } from "../../engine/diplomacy";
import type { TreatyTypeId } from "../../types/diplomacy";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 簡易的なチェックボックス交渉画面（Phase 4指示書13章）。条約の種類を選び、
 * 任意の追加条項をチェックボックスで足してから締結する——本格的な交渉AIは
 * 今回作らない。
 */
export function NegotiationScreen({ countryId, onClose }: { countryId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const diplo = state.diplomacy.relations[countryId];
  const [selectedId, setSelectedId] = useState<TreatyTypeId | null>(null);
  const [clauseIds, setClauseIds] = useState<string[]>([]);

  if (!diplo) return null;
  const hasTreaty = (id: TreatyTypeId) => diplo.treaties.some((treaty) => treaty.treatyTypeId === id);
  const selected = selectedId ? TREATIES.find((treaty) => treaty.id === selectedId) : null;

  if (!selected) {
    return (
      <Modal title="条約を結ぶ" onClose={onClose}>
        <div className="flex flex-col gap-2">
          {TREATIES.map((treaty) => {
            const eligible = canProposeTreaty(treaty.minRelationToPropose, diplo) && !hasTreaty(treaty.id);
            return (
              <button
                key={treaty.id}
                type="button"
                disabled={!eligible}
                onClick={() => {
                  setSelectedId(treaty.id);
                  setClauseIds([]);
                }}
                className="flex flex-col gap-1 rounded-lg border border-line bg-ink-panel px-3.5 py-2.5 text-left transition-colors enabled:hover:border-brass/40 disabled:opacity-40"
              >
                <span className="text-[0.9rem] text-body">{treaty.name}</span>
                <span className="text-[0.75rem] text-body-muted">{treaty.description}</span>
                {hasTreaty(treaty.id) ? (
                  <span className="text-[0.72rem] text-affirm">締結済み</span>
                ) : (
                  <span className="figures text-[0.72rem] text-body-muted">関係値{treaty.minRelationToPropose}以上が必要</span>
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    );
  }

  const clauses = selected.optionalClauses;
  const totalCost = selected.politicalPowerCost + clauses.filter((clause) => clauseIds.includes(clause.id)).reduce((sum, clause) => sum + clause.politicalPowerCost, 0);
  const canAfford = state.politics.stats.politicalPower >= totalCost;

  function toggleClause(id: string) {
    setClauseIds((prev) => (prev.includes(id) ? prev.filter((clauseId) => clauseId !== id) : [...prev, id]));
  }

  return (
    <Modal title={selected.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[0.9rem] leading-[1.8] text-body">{selected.description}</p>
        <ul className="flex flex-col gap-1 text-[0.85rem] text-body">
          {selected.effects.map((effect, index) => (
            <li key={index}>・{describeDiplomacyEffect(effect)}</li>
          ))}
        </ul>
        <p className="text-[0.78rem] text-body-muted">{selected.breakConditionLabel}</p>

        {clauses.length > 0 && (
          <div>
            <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">追加条項（任意）</p>
            <div className="flex flex-col gap-1.5">
              {clauses.map((clause) => (
                <label key={clause.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink-panel px-3 py-2 text-[0.85rem] text-body">
                  <input type="checkbox" checked={clauseIds.includes(clause.id)} onChange={() => toggleClause(clause.id)} className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{clause.label}</span>
                  <span className="figures text-[0.75rem] text-body-muted">PP{clause.politicalPowerCost}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <p className="text-[0.85rem] text-body-muted">
          必要政治力 <span className="figures text-body">{totalCost}</span>
        </p>
        {!canAfford && <p className="text-[0.8rem] text-alert">政治力が足りない。</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => setSelectedId(null)} className="min-h-[48px] flex-1 rounded border border-line text-[0.9rem] text-body-muted transition-colors hover:border-line-strong">
            戻る
          </button>
          <button
            type="button"
            disabled={!canAfford}
            onClick={() => {
              dispatch({ type: "DECIDE_TREATY", countryId, treatyTypeId: selected.id, clauseIds });
              onClose();
            }}
            className="min-h-[48px] flex-[2] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
          >
            締結する
          </button>
        </div>
      </div>
    </Modal>
  );
}
