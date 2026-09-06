import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { useGameState } from "../../state/GameContext";

const POLITICAL_ACTIONS = ["政党との調整", "政府支持率を確認", "党内情勢を確認", "政治状況を確認"] as const;

/** 政治画面（指示書1〜6・17章）。Phase 2ではまだ詳細な政治操作はしない。 */
export function PoliticsScreen({ onClose, onOpenFocusTree }: { onClose: () => void; onOpenFocusTree: () => void }) {
  const state = useGameState();
  const [openAction, setOpenAction] = useState<string | null>(null);

  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const { leader, stats, parties, modifiers } = state.politics;

  return (
    <Panel title={`${player?.flag ?? ""} ${player?.name ?? ""}`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.8rem] font-medium tracking-wider text-brass">🏛 政治</p>

        <div className="rounded-lg border border-line bg-ink-panel p-4">
          <p className="text-[0.75rem] text-body-muted">国家指導者</p>
          <p className="mt-0.5 text-[1.05rem] font-medium text-body">{leader.name}</p>
          <p className="mt-2 text-[0.75rem] text-body-muted">内閣</p>
          <p className="mt-0.5 text-[0.95rem] text-body">{leader.cabinetName}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
            <p className="text-[0.7rem] text-body-muted">⭐ 政治力</p>
            <p className="figures mt-0.5 text-[1.1rem] font-medium text-brass">{Math.floor(stats.politicalPower)}</p>
            <p className="figures text-[0.7rem] text-body-muted">
              {stats.politicalPowerPerDay >= 0 ? "+" : ""}
              {stats.politicalPowerPerDay.toFixed(1)} / 日
            </p>
          </div>
          <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
            <p className="text-[0.7rem] text-body-muted">📊 政府支持率</p>
            <p className="figures mt-0.5 text-[1.1rem] font-medium text-body">{Math.round(stats.governmentSupport)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
            <p className="text-[0.7rem] text-body-muted">⚖️ 安定度</p>
            <p className="figures mt-0.5 text-[1.1rem] font-medium text-body">{Math.round(stats.stability)}%</p>
          </div>
        </div>

        {modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {modifiers.map((modifier) => (
              <span
                key={modifier.id}
                className="rounded border border-brass/40 bg-brass/10 px-2 py-1 text-[0.75rem] text-brass"
              >
                {modifier.label}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onOpenFocusTree}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          🌳 国家方針を見る
        </button>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">👥 政党</p>
          {parties.length === 0 ? (
            <p className="text-[0.85rem] text-body-muted">この国の政党データはまだ用意されていない。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {parties.map((party) => (
                <div key={party.id} className="rounded-lg border border-line bg-ink-panel px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[0.9rem] text-body">{party.name}</span>
                    <span className="figures shrink-0 text-[0.85rem] text-body-muted">{party.popularity}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-raised">
                    <div className="h-full rounded-full bg-brass/70" style={{ width: `${Math.min(100, party.popularity * 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">🏛 政治行動</p>
          <div className="flex flex-col gap-2">
            {POLITICAL_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setOpenAction(action)}
                className="flex min-h-[48px] items-center rounded-lg border border-line bg-ink-panel px-3.5 text-left text-[0.9rem] text-body transition-colors hover:border-brass/40"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {openAction && (
        <Modal title={openAction} onClose={() => setOpenAction(null)}>
          <p className="py-6 text-center text-[0.85rem] text-body-muted">
            詳細な政治操作は今後のPhaseで実装予定。
          </p>
        </Modal>
      )}
    </Panel>
  );
}
