import { useState } from "react";
import { WorldMap } from "../map/WorldMap";
import { Modal } from "../shared/Modal";
import { CountryInfoPanel } from "../country/CountryInfoPanel";
import { NationalOverviewPanel } from "../country/NationalOverviewPanel";
import { PoliticsScreen } from "../politics/PoliticsScreen";
import { FocusTreeScreen } from "../politics/FocusTreeScreen";
import { FocusNoticeModal } from "../politics/FocusNoticeModal";
import { EconomyScreen } from "../economy/EconomyScreen";
import { ResearchScreen } from "../research/ResearchScreen";
import { DiplomacyScreen } from "../diplomacy/DiplomacyScreen";
import { DiplomaticNoticeModal } from "../diplomacy/DiplomaticNoticeModal";
import { MilitaryScreen } from "../military/MilitaryScreen";
import { DefensePolicyScreen } from "../military/DefensePolicyScreen";
import { OperationalMapScreen } from "../military/OperationalMapScreen";
import { UnitsScreen } from "../military/UnitsScreen";
import { NavyScreen } from "../military/NavyScreen";
import { AirForceScreen } from "../military/AirForceScreen";
import { ProductionScreen } from "../military/ProductionScreen";
import { IntelligenceScreen } from "../military/IntelligenceScreen";
import { WarScreen } from "../military/WarScreen";
import { MilitaryNoticeModal } from "../military/MilitaryNoticeModal";
import { findCountry, findCountryByIsoNumeric } from "../../data/countries";
import { findFocus } from "../../data/focuses";
import { formatDateTime } from "../../engine/gameTime";
import { computeRelation } from "../../engine/diplomacy";
import type { CategoryId } from "../../types/game";
import type { Speed } from "../../types/gameTime";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const SPEEDS: Speed[] = [1, 2, 4, 8];

type MilitarySubScreen = "map" | "units" | "navy" | "air" | "production" | "intelligence" | "policy" | "war";

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

/** 国家方針の進行カード（指示書19章）。クリックすると国家方針ツリーを開く。 */
function FocusProgressCard({ onOpen }: { onOpen: () => void }) {
  const state = useGameState();
  const activeFocus = state.politics.activeFocus;
  if (!activeFocus) return null;
  const template = findFocus(activeFocus.focusId);
  if (!template) return null;

  const remaining = Math.max(0, Math.ceil(template.durationDays - activeFocus.daysElapsed));
  const percent = Math.min(100, (activeFocus.daysElapsed / template.durationDays) * 100);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-4 mb-2 flex flex-col gap-1.5 rounded-lg border border-line bg-ink-panel px-3.5 py-2.5 text-left transition-colors hover:border-brass/40"
    >
      <p className="text-[0.75rem] font-medium tracking-wider text-brass">🌳 国家方針</p>
      <p className="text-[0.9rem] text-body">{template.name}</p>
      <p className="figures text-[0.75rem] text-body-muted">残り {remaining}日</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-raised">
        <div className="h-full rounded-full bg-brass" style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
}

/** メイン画面（指示書4章）。Phase 2で政治・国家方針が実データを持つ。 */
export function MainGameScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [focusTreeOpen, setFocusTreeOpen] = useState(false);
  const [diplomacyFocusCountryId, setDiplomacyFocusCountryId] = useState<string | null>(null);
  const [militarySubScreen, setMilitarySubScreen] = useState<MilitarySubScreen | null>(null);

  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const inspected = state.inspectingCountryId
    ? findCountryByIsoNumeric(state.countries, state.inspectingCountryId)
    : undefined;
  const notice = state.politics.pendingNotices[0];
  const diplomaticNotice = state.diplomacy.pendingNotices[0];
  const militaryNotice = state.military.pendingNotices[0];
  const relationLines = state.diplomacy.mapOverlayEnabled
    ? Object.keys(state.diplomacy.relations)
        .map((id) => {
          const country = findCountry(state.countries, id);
          if (!country) return null;
          return { isoNumeric: country.isoNumeric, relation: computeRelation(state.diplomacy.relations[id]) };
        })
        .filter((line): line is { isoNumeric: string; relation: number } => line !== null)
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

      <FocusProgressCard onOpen={() => setFocusTreeOpen(true)} />

      <div className="min-h-0 flex-1">
        <WorldMap
          countries={state.countries}
          selectedIsoNumeric={player?.isoNumeric}
          onSelectCountry={(iso) => dispatch({ type: "INSPECT_COUNTRY", id: iso })}
          relationLines={relationLines}
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
          <div className="flex flex-col gap-4">
            <CountryInfoPanel isoNumeric={state.inspectingCountryId} country={inspected} />
            {inspected && inspected.id !== state.playerCountryId && state.diplomacy.relations[inspected.id] && (
              <button
                type="button"
                onClick={() => {
                  setDiplomacyFocusCountryId(inspected.id);
                  dispatch({ type: "INSPECT_COUNTRY", id: null });
                  dispatch({ type: "OPEN_CATEGORY", id: "diplomacy" });
                }}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
              >
                🌍 外交関係を見る
              </button>
            )}
          </div>
        </Modal>
      )}

      {state.activeCategory === "politics" && (
        <PoliticsScreen
          onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })}
          onOpenFocusTree={() => setFocusTreeOpen(true)}
        />
      )}

      {state.activeCategory === "economy" && <EconomyScreen onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })} />}

      {state.activeCategory === "diplomacy" && (
        <DiplomacyScreen
          onClose={() => {
            setDiplomacyFocusCountryId(null);
            dispatch({ type: "OPEN_CATEGORY", id: null });
          }}
          initialCountryId={diplomacyFocusCountryId}
        />
      )}

      {state.activeCategory === "research" && <ResearchScreen onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })} />}

      {state.activeCategory === "military" && (
        <MilitaryScreen
          onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })}
          onOpenMap={() => setMilitarySubScreen("map")}
          onOpenUnits={() => setMilitarySubScreen("units")}
          onOpenNavy={() => setMilitarySubScreen("navy")}
          onOpenAirForce={() => setMilitarySubScreen("air")}
          onOpenProduction={() => setMilitarySubScreen("production")}
          onOpenIntelligence={() => setMilitarySubScreen("intelligence")}
          onOpenDefensePolicy={() => setMilitarySubScreen("policy")}
          onOpenWar={() => setMilitarySubScreen("war")}
        />
      )}

      {state.activeCategory === "production" && <ProductionScreen onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })} />}

      {state.activeCategory === "intelligence" && <IntelligenceScreen onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })} />}

      {state.activeCategory === "overview" && player && (
        <Modal title="国家" onClose={() => dispatch({ type: "OPEN_CATEGORY", id: null })}>
          <NationalOverviewPanel country={player} />
        </Modal>
      )}

      {militarySubScreen === "map" && <OperationalMapScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "units" && <UnitsScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "navy" && <NavyScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "air" && <AirForceScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "production" && <ProductionScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "intelligence" && <IntelligenceScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "policy" && <DefensePolicyScreen onClose={() => setMilitarySubScreen(null)} />}
      {militarySubScreen === "war" && <WarScreen onClose={() => setMilitarySubScreen(null)} />}

      {focusTreeOpen && <FocusTreeScreen onClose={() => setFocusTreeOpen(false)} />}

      {notice && <FocusNoticeModal notice={notice} />}
      {!notice && diplomaticNotice && <DiplomaticNoticeModal notice={diplomaticNotice} />}
      {!notice && !diplomaticNotice && militaryNotice && <MilitaryNoticeModal notice={militaryNotice} />}
    </div>
  );
}
