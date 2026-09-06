import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { ECONOMY_POLICIES, findEconomyPolicy } from "../../data/economyPolicies";
import { debtToGdpRatio, fiscalBalance, totalBudget } from "../../engine/economy";
import type { BudgetCategory, EconomyEffect, EconomyPolicyTemplate } from "../../types/economy";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const BUDGET_LABELS: Record<BudgetCategory, string> = {
  socialSecurity: "社会保障",
  defense: "防衛",
  publicWorks: "公共事業",
  educationResearch: "教育・研究",
  diplomacy: "外交",
  industry: "産業政策",
  other: "その他",
};
const BUDGET_ORDER: BudgetCategory[] = ["socialSecurity", "defense", "publicWorks", "educationResearch", "diplomacy", "industry", "other"];
const BUDGET_STEP = 0.5;

function yen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}兆`;
}

/** 経済画面（指示書1〜10章）。 */
export function EconomyScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [openPolicyId, setOpenPolicyId] = useState<string | null>(null);

  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const { stats, budget } = state.economy;
  const balance = fiscalBalance(stats, budget);
  const expenditure = totalBudget(budget);

  function adjustBudget(category: BudgetCategory, delta: number) {
    dispatch({ type: "SET_BUDGET", category, amount: budget[category] + delta });
  }

  return (
    <Panel title={`${player?.flag ?? ""} ${player?.name ?? ""}経済`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.8rem] font-medium tracking-wider text-brass">💰 経済</p>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="GDP" value={yen(stats.gdpTrillionYen)} />
          <Stat label="GDP成長率" value={`${stats.gdpGrowthRate >= 0 ? "+" : ""}${stats.gdpGrowthRate.toFixed(1)}%`} />
          <Stat label="国家予算" value={yen(expenditure)} />
          <Stat label="税収" value={yen(stats.taxRevenueTrillionYen)} />
          <Stat label="政府支出" value={yen(expenditure)} />
          <Stat label="財政収支" value={`${balance >= 0 ? "" : "-"}¥${Math.abs(balance).toFixed(1)}兆`} warn={balance < 0} />
          <Stat label="政府債務" value={yen(stats.govDebtTrillionYen)} note={`対GDP比 ${debtToGdpRatio(stats).toFixed(0)}%`} />
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">経済指標</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="インフレ率" value={`${stats.inflationRate.toFixed(1)}%`} />
            <Stat label="失業率" value={`${stats.unemploymentRate.toFixed(1)}%`} />
            <Stat label="消費" value={stats.consumption.toFixed(1)} />
            <Stat label="民間投資" value={stats.privateInvestment.toFixed(1)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">国家予算（年間、兆円）</p>
          <div className="flex flex-col gap-2">
            {BUDGET_ORDER.map((category) => (
              <div key={category} className="flex items-center gap-3 rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                <span className="flex-1 text-[0.88rem] text-body">{BUDGET_LABELS[category]}</span>
                <span className="figures w-16 text-right text-[0.88rem] text-body">{yen(budget[category])}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => adjustBudget(category, -BUDGET_STEP)}
                    className="flex h-9 w-9 items-center justify-center rounded border border-line-strong text-body-muted transition-colors hover:border-brass/40 hover:text-body"
                    aria-label={`${BUDGET_LABELS[category]}を減らす`}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustBudget(category, BUDGET_STEP)}
                    className="flex h-9 w-9 items-center justify-center rounded border border-line-strong text-body-muted transition-colors hover:border-brass/40 hover:text-body"
                    aria-label={`${BUDGET_LABELS[category]}を増やす`}
                  >
                    ＋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">📈 経済政策</p>
          <div className="flex flex-col gap-2">
            {ECONOMY_POLICIES.map((policy) => {
              const decided = state.economy.decidedPolicyIds.includes(policy.id);
              return (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => setOpenPolicyId(policy.id)}
                  className="flex min-h-[48px] items-center justify-between rounded-lg border border-line bg-ink-panel px-3.5 text-left text-[0.9rem] text-body transition-colors hover:border-brass/40"
                >
                  <span>{policy.name}</span>
                  {decided && <span className="text-[0.75rem] text-affirm">決定済み</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {openPolicyId && <EconomyPolicyDetail policy={findEconomyPolicy(openPolicyId)!} onClose={() => setOpenPolicyId(null)} />}
    </Panel>
  );
}

function Stat({ label, value, note, warn }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
      <p className="text-[0.7rem] text-body-muted">{label}</p>
      <p className={`figures mt-0.5 text-[1rem] font-medium ${warn ? "text-alert" : "text-body"}`}>{value}</p>
      {note && <p className="figures text-[0.7rem] text-body-muted">{note}</p>}
    </div>
  );
}

function describeEconomyEffect(effect: EconomyEffect): string {
  switch (effect.type) {
    case "modify_stat":
      return `${STAT_LABELS[effect.stat]} ${effect.amount >= 0 ? "+" : ""}${effect.amount}`;
    case "modify_budget":
      return `${BUDGET_LABELS[effect.category]}予算 ${effect.amount >= 0 ? "+" : ""}${effect.amount}兆円`;
    case "trigger_event":
      return "経済ニュースが発生する";
  }
}

const STAT_LABELS: Record<string, string> = {
  gdpTrillionYen: "GDP",
  gdpGrowthRate: "GDP成長率",
  taxRevenueTrillionYen: "税収",
  otherRevenueTrillionYen: "税外収入",
  govDebtTrillionYen: "政府債務",
  inflationRate: "インフレ率",
  unemploymentRate: "失業率",
  consumption: "消費",
  privateInvestment: "民間投資",
};

function EconomyPolicyDetail({ policy, onClose }: { policy: EconomyPolicyTemplate; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const decided = state.economy.decidedPolicyIds.includes(policy.id);
  const canAfford = state.politics.stats.politicalPower >= policy.politicalPowerCost;

  return (
    <Modal title={policy.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[0.9rem] leading-[1.8] text-body">{policy.description}</p>

        <div>
          <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">効果（段階的に効いてくる）</p>
          <ul className="flex flex-col gap-1.5 text-[0.85rem] text-body">
            {policy.stages.map((stage, index) => (
              <li key={index}>
                <span className="figures text-body-muted">{stage.afterDays === 0 ? "即時" : `${stage.afterDays}日後`}</span>
                {" — "}
                {stage.effects.map((effect, effectIndex) => (
                  <span key={effectIndex}>
                    {effectIndex > 0 && "、"}
                    {describeEconomyEffect(effect)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[0.85rem] text-body-muted">
          必要政治力 <span className="figures text-body">{policy.politicalPowerCost}</span>
        </p>

        {decided ? (
          <p className="rounded-lg border border-affirm/30 bg-affirm/10 px-4 py-3 text-center text-[0.9rem] text-affirm">
            ✅ 決定済み
          </p>
        ) : (
          <>
            {!canAfford && <p className="text-[0.8rem] text-alert">政治力が足りない。</p>}
            <button
              type="button"
              disabled={!canAfford}
              onClick={() => {
                dispatch({ type: "DECIDE_ECONOMY_POLICY", policyId: policy.id });
                onClose();
              }}
              className="min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
            >
              この政策を決める
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
