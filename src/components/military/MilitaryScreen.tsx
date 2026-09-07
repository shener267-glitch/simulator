import { Panel } from "../shared/Panel";
import { findCountry } from "../../data/countries";
import { MOBILIZATION_LABELS, READINESS_LABELS } from "../../engine/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const BUDGET_STEP = 0.5;

function yen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}兆`;
}

interface MilitaryScreenProps {
  onClose: () => void;
  onOpenMap: () => void;
  onOpenUnits: () => void;
  onOpenNavy: () => void;
  onOpenAirForce: () => void;
  onOpenProduction: () => void;
  onOpenIntelligence: () => void;
  onOpenDefensePolicy: () => void;
  onOpenWar: () => void;
}

/** 軍事画面（Phase 5指示書1〜3・34章）。軍事力を「総兵力」の一つの数字にせず、人員・陸海空・ミサイル・その他へ分けて見せる。 */
export function MilitaryScreen({ onClose, onOpenMap, onOpenUnits, onOpenNavy, onOpenAirForce, onOpenProduction, onOpenIntelligence, onOpenDefensePolicy, onOpenWar }: MilitaryScreenProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const { personnel, forces, readiness, mobilization } = state.military;
  const defenseBudget = state.economy.budget.defense;

  function adjustBudget(delta: number) {
    dispatch({ type: "SET_BUDGET", category: "defense", amount: defenseBudget + delta });
  }

  return (
    <Panel title={`${player?.flag ?? ""} ${player?.name ?? ""}国防`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.8rem] font-medium tracking-wider text-brass">🪖 軍事</p>

        {state.military.war && (
          <button
            type="button"
            onClick={onOpenWar}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded border border-alert/60 bg-alert/10 text-[0.95rem] font-medium text-alert transition-colors hover:bg-alert/20"
          >
            ⚔️ 戦争状態——戦況を見る
          </button>
        )}

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">👥 人員</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="現役兵力" value={personnel.activeDuty.toLocaleString("ja-JP")} />
            <Stat label="予備役" value={personnel.reserve.toLocaleString("ja-JP")} />
            <Stat label="動員可能人員" value={personnel.mobilizable.toLocaleString("ja-JP")} />
            <Stat label="充足率" value={`${personnel.fillRatePercent.toFixed(0)}%`} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">戦力（能力指数）</p>
          <div className="flex flex-col gap-2">
            <CapabilityBar label="🪖 陸上戦力" value={forces.land.capability} />
            <CapabilityBar label="🚢 海上戦力" value={forces.sea.capability} />
            <CapabilityBar label="✈️ 航空戦力" value={forces.air.capability} />
            <CapabilityBar label="🚀 ミサイル戦力" value={forces.missile.capability} />
            <CapabilityBar label="🛰 その他（衛星・サイバー・電子戦・情報）" value={forces.other.capability} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onOpenDefensePolicy} className="rounded-lg border border-line bg-ink-panel px-3 py-2.5 text-left transition-colors hover:border-brass/40">
            <p className="text-[0.7rem] text-body-muted">🛡 防衛態勢</p>
            <p className="mt-0.5 text-[0.95rem] font-medium text-body">{READINESS_LABELS[readiness]}</p>
          </button>
          <button type="button" onClick={onOpenDefensePolicy} className="rounded-lg border border-line bg-ink-panel px-3 py-2.5 text-left transition-colors hover:border-brass/40">
            <p className="text-[0.7rem] text-body-muted">⚠️ 動員</p>
            <p className="mt-0.5 text-[0.95rem] font-medium text-body">{MOBILIZATION_LABELS[mobilization]}</p>
          </button>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">💰 防衛予算（年間）</p>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
            <span className="figures flex-1 text-[0.95rem] text-body">{yen(defenseBudget)}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => adjustBudget(-BUDGET_STEP)} className="flex h-9 w-9 items-center justify-center rounded border border-line-strong text-body-muted transition-colors hover:border-brass/40 hover:text-body" aria-label="防衛予算を減らす">
                −
              </button>
              <button type="button" onClick={() => adjustBudget(BUDGET_STEP)} className="flex h-9 w-9 items-center justify-center rounded border border-line-strong text-body-muted transition-colors hover:border-brass/40 hover:text-body" aria-label="防衛予算を増やす">
                ＋
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[0.75rem] text-body-muted">予算を増やしても、装備調達や人員確保には時間がかかる——即座に軍事力が増えるわけではない。</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NavButton emoji="🗺" label="作戦地図" onClick={onOpenMap} />
          <NavButton emoji="👥" label="部隊" onClick={onOpenUnits} />
          <NavButton emoji="🚢" label="海軍" onClick={onOpenNavy} />
          <NavButton emoji="✈️" label="航空" onClick={onOpenAirForce} />
          <NavButton emoji="🏭" label="装備" onClick={onOpenProduction} />
          <NavButton emoji="📡" label="情報" onClick={onOpenIntelligence} />
          <NavButton emoji="⚙️" label="防衛政策" onClick={onOpenDefensePolicy} />
        </div>
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
      <p className="text-[0.7rem] text-body-muted">{label}</p>
      <p className="figures mt-0.5 text-[1rem] font-medium text-body">{value}</p>
    </div>
  );
}

function CapabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.85rem] text-body">{label}</span>
        <span className="figures text-[0.8rem] text-body-muted">{Math.round(value)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-raised">
        <div className="h-full rounded-full bg-brass/70" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function NavButton({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg border border-line bg-ink-panel text-[0.8rem] text-body transition-colors hover:border-brass/40">
      <span className="text-[1.1rem]" aria-hidden>
        {emoji}
      </span>
      {label}
    </button>
  );
}
