import { WorldMap } from "../map/WorldMap";
import { Modal } from "../shared/Modal";
import { CountryInfoPanel } from "../country/CountryInfoPanel";
import { findCountry, findCountryByIsoNumeric } from "../../data/countries";
import { formatDateTime } from "../../engine/gameTime";
import type { CategoryId } from "../../types/game";
import type { Speed } from "../../types/gameTime";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const SPEEDS: Speed[] = [1, 2, 4, 8];

const CATEGORIES: { id: CategoryId; emoji: string; label: string }[] = [
  { id: "politics", emoji: "🏛", label: "政治" },
  { id: "economy", emoji: "💰", label: "経済" },
  { id: "diplomacy", emoji: "🌍", label: "外交" },
  { id: "military", emoji: "🪖", label: "軍事" },
  { id: "research", emoji: "🔬", label: "研究" },
  { id: "production", emoji: "🏭", label: "生産" },
  { id: "intelligence", emoji: "🕵", label: "情報" },
  { id: "overview", emoji: "📊", label: "国家" },
];

const CATEGORY_LABEL: Record<CategoryId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;

/** メイン画面（指示書4章）。Phase 1では国家欄以外はすべて仮画面。 */
export function MainGameScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const player = findCountry(state.playerCountryId ?? "");
  const inspected = state.inspectingCountryId
    ? findCountryByIsoNumeric(state.inspectingCountryId)
    : undefined;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-col gap-1.5 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.95rem] font-medium text-body">
            <span className="mr-1.5" aria-hidden>
              {player?.flag}
            </span>
            {player?.name}
          </span>
          <span className="figures text-[0.85rem] text-body-muted">{formatDateTime(state.gameTime)}</span>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_SPEED", speed: 0 })}
            className={`flex h-11 min-w-[44px] items-center justify-center rounded border px-2 text-[0.85rem] font-medium transition-colors ${
              state.gameTime.speed === 0
                ? "border-brass bg-brass/15 text-brass"
                : "border-line text-body-muted hover:border-line-strong"
            }`}
          >
            Ⅱ
          </button>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => dispatch({ type: "SET_SPEED", speed })}
              className={`figures flex h-11 min-w-[44px] items-center justify-center rounded border px-2 text-[0.85rem] transition-colors ${
                state.gameTime.speed === speed
                  ? "border-brass bg-brass/15 text-brass"
                  : "border-line text-body-muted hover:border-line-strong"
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <WorldMap
          selectedIsoNumeric={player?.isoNumeric}
          onSelectCountry={(iso) => dispatch({ type: "INSPECT_COUNTRY", id: iso })}
        />
      </div>

      <nav className="grid grid-cols-4 gap-px border-t border-line bg-line pb-[env(safe-area-inset-bottom)]">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => dispatch({ type: "OPEN_CATEGORY", id: category.id })}
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 bg-ink-panel py-1.5 text-[0.7rem] text-body-muted transition-colors hover:bg-ink-raised hover:text-body"
          >
            <span className="text-[1.1rem]" aria-hidden>
              {category.emoji}
            </span>
            {category.label}
          </button>
        ))}
      </nav>

      {state.inspectingCountryId && (
        <Modal title="国家情報" onClose={() => dispatch({ type: "INSPECT_COUNTRY", id: null })}>
          <CountryInfoPanel isoNumeric={state.inspectingCountryId} country={inspected} />
        </Modal>
      )}

      {state.activeCategory && (
        <Modal title={CATEGORY_LABEL[state.activeCategory]} onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })}>
          {state.activeCategory === "overview" && player ? (
            <CountryInfoPanel isoNumeric={player.isoNumeric} country={player} />
          ) : (
            <p className="py-6 text-center text-[0.85rem] text-body-muted">
              {CATEGORY_LABEL[state.activeCategory]}
              <br />
              Phase 2で実装予定
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
