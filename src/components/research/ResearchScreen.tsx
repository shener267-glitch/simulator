import { useState } from "react";
import { Panel } from "../shared/Panel";
import { TechTreeScreen } from "./TechTreeScreen";
import { findTech } from "../../data/technologies";
import { findCountry } from "../../data/countries";
import { useGameState } from "../../state/GameContext";

/** 研究画面（指示書11・12・18章）。 */
export function ResearchScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [treeOpen, setTreeOpen] = useState(false);

  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const { slots, active, speedBonusPercent, modifiers } = state.research;

  return (
    <Panel title={`${player?.flag ?? ""} ${player?.name ?? ""}研究`.trim()} onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.8rem] font-medium tracking-wider text-brass">🔬 研究</p>
          <p className="figures text-[0.8rem] text-body-muted">研究速度 {speedBonusPercent >= 0 ? "+" : ""}{speedBonusPercent}%</p>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">研究枠</p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: slots }, (_, index) => active[index]).map((progress, index) => {
              const template = progress ? findTech(progress.techId) : undefined;
              const remaining = template && progress ? Math.max(0, Math.ceil(template.durationDays - progress.daysElapsed)) : null;
              const percent = template && progress ? Math.min(100, (progress.daysElapsed / template.durationDays) * 100) : 0;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setTreeOpen(true)}
                  className="flex flex-col gap-1.5 rounded-lg border border-line bg-ink-panel px-3.5 py-3 text-left transition-colors hover:border-brass/40"
                >
                  <p className="text-[0.7rem] text-body-muted">研究枠{index + 1}</p>
                  {template && progress ? (
                    <>
                      <p className="text-[0.9rem] text-body">{template.name}</p>
                      <p className="figures text-[0.75rem] text-body-muted">残り {remaining}日</p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-raised">
                        <div className="h-full rounded-full bg-brass" style={{ width: `${percent}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-[0.85rem] text-body-faint">未使用</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {modifiers.map((modifier) => (
              <span key={modifier.id} className="rounded border border-brass/40 bg-brass/10 px-2 py-1 text-[0.75rem] text-brass">
                {modifier.label}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setTreeOpen(true)}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          🌳 研究ツリーを見る
        </button>
      </div>

      {treeOpen && <TechTreeScreen onClose={() => setTreeOpen(false)} />}
    </Panel>
  );
}
