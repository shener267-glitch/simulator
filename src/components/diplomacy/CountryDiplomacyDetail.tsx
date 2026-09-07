import { useState } from "react";
import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { DIPLOMATIC_ACTIONS, SUMMIT_PREP_DAYS, findDiplomaticAction, findTreaty } from "../../data/diplomacy";
import { computeRelation, describeDiplomacyEffect, isActionAvailable, relationStatusLabel } from "../../engine/diplomacy";
import { useGameDispatch, useGameState } from "../../state/GameContext";
import { NegotiationScreen } from "./NegotiationScreen";

/** 相手国一件の外交詳細（指示書5・10〜13章）。関係の内訳・三本メーター・条約・行動をまとめる。 */
export function CountryDiplomacyDetail({ countryId, onClose }: { countryId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const country = findCountry(state.countries, countryId);
  const diplo = state.diplomacy.relations[countryId];
  if (!diplo) return null;
  const relation = computeRelation(diplo);
  const invitableFaction = state.diplomacy.factions.find(
    (faction) => faction.leaderCountryId === state.playerCountryId && !faction.memberCountryIds.includes(countryId),
  );

  return (
    <Modal title={`${country?.flag ?? ""} ${country?.name ?? countryId}`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-line bg-ink-panel px-4 py-3 text-center">
          <p className="text-[0.75rem] text-body-muted">関係値</p>
          <p className="figures mt-0.5 text-[1.4rem] font-medium text-brass">
            {relation >= 0 ? "+" : ""}
            {relation}
          </p>
          <p className="text-[0.8rem] text-body-muted">{relationStatusLabel(relation)}</p>
        </div>

        <div>
          <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">内訳</p>
          <ul className="flex flex-col gap-1 text-[0.82rem] text-body">
            <li>
              基礎値 {diplo.baseRelation >= 0 ? "+" : ""}
              {diplo.baseRelation}
            </li>
            {diplo.modifiers.map((modifier) => (
              <li key={modifier.id}>
                {modifier.label} {modifier.amount >= 0 ? "+" : ""}
                {modifier.amount}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Bar label="政府間" value={diplo.barGov} />
          <Bar label="経済" value={diplo.barEcon} />
          <Bar label="軍事" value={diplo.barMil} />
        </div>

        {diplo.treaties.length > 0 && (
          <div>
            <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">締結中の条約</p>
            <ul className="flex flex-col gap-1 text-[0.82rem] text-body">
              {diplo.treaties.map((treaty) => (
                <li key={treaty.id}>「{findTreaty(treaty.treatyTypeId)?.name ?? treaty.treatyTypeId}」</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => setNegotiationOpen(true)}
          className="flex min-h-[48px] items-center justify-center rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          📜 条約を結ぶ
        </button>

        {invitableFaction && (
          <button
            type="button"
            disabled={relation < 30}
            onClick={() => dispatch({ type: "INVITE_TO_FACTION", factionId: invitableFaction.id, countryId })}
            className="flex min-h-[44px] items-center justify-center rounded border border-line text-[0.85rem] text-body-muted transition-colors enabled:hover:border-brass/40 enabled:hover:text-body disabled:opacity-40"
          >
            🛡「{invitableFaction.name}」に招く{relation < 30 ? "（関係値30以上が必要）" : ""}
          </button>
        )}

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">🤝 外交行動</p>
          <div className="flex flex-col gap-2">
            {DIPLOMATIC_ACTIONS.map((action) => {
              const available = isActionAvailable(action, diplo, state.diplomacy.elapsedMinutes);
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={!available}
                  onClick={() => setOpenActionId(action.id)}
                  className="flex min-h-[48px] items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 text-left text-[0.88rem] text-body transition-colors enabled:hover:border-brass/40 disabled:opacity-40"
                >
                  <span>{action.name}</span>
                  <span className="figures text-[0.75rem] text-body-muted">PP{action.politicalPowerCost}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {openActionId && <ActionConfirm countryId={countryId} actionId={openActionId} onClose={() => setOpenActionId(null)} />}
      {negotiationOpen && <NegotiationScreen countryId={countryId} onClose={() => setNegotiationOpen(false)} />}
    </Modal>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-ink-panel px-2.5 py-2 text-center">
      <p className="text-[0.68rem] text-body-muted">{label}</p>
      <p className="figures text-[0.9rem] text-body">{Math.round(value)}</p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-raised">
        <div className="h-full rounded-full bg-brass/70" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ActionConfirm({ countryId, actionId, onClose }: { countryId: string; actionId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const action = findDiplomaticAction(actionId);
  if (!action) return null;
  const canAfford = state.politics.stats.politicalPower >= action.politicalPowerCost;

  return (
    <Modal title={action.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[0.9rem] leading-[1.8] text-body">{action.description}</p>

        {action.id === "propose_summit" ? (
          <p className="text-[0.85rem] text-body-muted">準備に{SUMMIT_PREP_DAYS}日かかる。準備が整うと通知が届く。</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-[0.85rem] text-body">
            {action.stages.map((stage, index) => (
              <li key={index}>
                <span className="figures text-body-muted">{stage.afterDays === 0 ? "即時" : `${stage.afterDays}日後`}</span>
                {" — "}
                {stage.effects.map((effect, effectIndex) => (
                  <span key={effectIndex}>
                    {effectIndex > 0 && "、"}
                    {describeDiplomacyEffect(effect)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}

        <p className="text-[0.85rem] text-body-muted">
          必要政治力 <span className="figures text-body">{action.politicalPowerCost}</span>
        </p>
        {!canAfford && <p className="text-[0.8rem] text-alert">政治力が足りない。</p>}
        <button
          type="button"
          disabled={!canAfford}
          onClick={() => {
            dispatch({ type: "DECIDE_DIPLOMATIC_ACTION", countryId, actionId });
            onClose();
          }}
          className="min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
        >
          実行する
        </button>
      </div>
    </Modal>
  );
}
