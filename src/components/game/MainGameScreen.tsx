import { useState } from "react";
import { WorldMap } from "../map/WorldMap";
import { Modal } from "../shared/Modal";
import { PlaceholderScreen } from "../shared/PlaceholderScreen";
import { CountryContextPanel } from "../country/CountryContextPanel";
import { NationalOverviewPanel } from "../country/NationalOverviewPanel";
import { ProvinceStatScreen } from "../nation/ProvinceStatScreen";
import { PoliticsScreen } from "../politics/PoliticsScreen";
import { FocusTreeScreen } from "../politics/FocusTreeScreen";
import { FocusNoticeModal } from "../politics/FocusNoticeModal";
import { EconomyScreen } from "../economy/EconomyScreen";
import { ResearchScreen } from "../research/ResearchScreen";
import { DiplomacyScreen } from "../diplomacy/DiplomacyScreen";
import { DiplomaticNoticeModal } from "../diplomacy/DiplomaticNoticeModal";
import { TradeScreen } from "../diplomacy/TradeScreen";
import { WorldTensionScreen } from "../diplomacy/WorldTensionScreen";
import { FactionScreen } from "../diplomacy/FactionScreen";
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
import { totalBudget } from "../../engine/economy";
import { formatDate, formatTime } from "../../engine/gameTime";
import { computeRelation } from "../../engine/diplomacy";
import type { CategoryId, MapModeId } from "../../types/game";
import type { Speed } from "../../types/gameTime";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const SPEEDS: Speed[] = [1, 2, 4, 8];
const SPEED_SYMBOL: Record<Speed, string> = { 0: "⏸", 1: "▶", 2: "▶▶", 4: "▶▶▶", 8: "▶▶▶▶" };

type MilitarySubScreen = "map" | "units" | "navy" | "air" | "production" | "intelligence" | "policy" | "war";

/** 国家管理メニューの一項目。国家方針・徴兵配備だけはカテゴリ画面ではなく既存の別状態を開く（指示書8章）。 */
type MenuButton =
  | { kind: "category"; id: CategoryId; emoji: string; label: string }
  | { kind: "focusTree"; emoji: string; label: string }
  | { kind: "conscription"; emoji: string; label: string };

/** 国家管理・軍事メニュー（指示書8・9章）。HOI4の主要システム一覧を、項目を削らずに入口として並べる。 */
const MENU_BUTTONS: MenuButton[] = [
  { kind: "category", id: "politics", emoji: "🏛", label: "政治" },
  { kind: "focusTree", emoji: "🌳", label: "国家方針" },
  { kind: "category", id: "decisions", emoji: "📋", label: "ディシジョン" },
  { kind: "category", id: "research", emoji: "🔬", label: "研究" },
  { kind: "category", id: "production", emoji: "🏭", label: "生産" },
  { kind: "category", id: "construction", emoji: "🏗", label: "建設" },
  { kind: "conscription", emoji: "👥", label: "徴兵・配備" },
  { kind: "category", id: "military", emoji: "🪖", label: "軍事" },
  { kind: "category", id: "diplomacy", emoji: "🌍", label: "外交" },
  { kind: "category", id: "market", emoji: "💱", label: "国際市場" },
  { kind: "category", id: "trade", emoji: "📦", label: "貿易" },
  { kind: "category", id: "logistics", emoji: "🚚", label: "兵站" },
  { kind: "category", id: "worldTension", emoji: "🌐", label: "国際緊張" },
  { kind: "category", id: "puppets", emoji: "🏴", label: "傀儡・従属国" },
  { kind: "category", id: "faction", emoji: "🤝", label: "陣営" },
  { kind: "category", id: "resistance", emoji: "🕵", label: "レジスタンス" },
  { kind: "category", id: "intelligence", emoji: "🕵", label: "情報" },
  { kind: "category", id: "mio", emoji: "🏭", label: "MIO" },
  { kind: "category", id: "experimental", emoji: "🧪", label: "実験施設" },
  { kind: "category", id: "overview", emoji: "📊", label: "国家概要" },
];

const MAP_MODES: { id: MapModeId; emoji: string; label: string }[] = [
  { id: "political", emoji: "🏛", label: "政治" },
  { id: "terrain", emoji: "⛰", label: "地形" },
  { id: "supply", emoji: "🚚", label: "補給" },
  { id: "air", emoji: "✈", label: "航空" },
  { id: "navy", emoji: "⚓", label: "海軍" },
  { id: "war", emoji: "⚔", label: "戦争" },
  { id: "infrastructure", emoji: "🏗", label: "インフラ" },
  { id: "construction", emoji: "👷", label: "建設" },
];

function ResourcePill({
  emoji,
  value,
  tooltip,
  onClick,
}: {
  emoji: string;
  value: string;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="figures flex shrink-0 items-center gap-1.5 rounded border border-line px-2.5 py-1 text-[0.8rem] text-body transition-colors hover:border-brass/40 hover:bg-white/5"
    >
      <span aria-hidden>{emoji}</span>
      {value}
    </button>
  );
}

/** 国家方針の進行インジケータ（指示書19章）。地図左上に張り付く小カード。クリックすると国家方針ツリーを開く。 */
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
      className="absolute left-3 top-3 z-10 flex w-56 flex-col gap-1 rounded-lg border border-line bg-ink-panel/90 px-3 py-2 text-left shadow-lg shadow-black/40 backdrop-blur-sm transition-colors hover:border-brass/40"
    >
      <p className="text-[0.68rem] font-medium tracking-wider text-brass">🌳 国家方針</p>
      <p className="truncate text-[0.82rem] text-body">{template.name}</p>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-raised">
          <div className="h-full rounded-full bg-brass" style={{ width: `${percent}%` }} />
        </div>
        <span className="figures shrink-0 text-[0.68rem] text-body-muted">残り{remaining}日</span>
      </div>
    </button>
  );
}

/** メイン画面（指示書1〜18章）。世界地図を中心に、上部の国家情報バー・下部の国家管理メニューを配置するHOI4型レイアウト。 */
export function MainGameScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [focusTreeOpen, setFocusTreeOpen] = useState(false);
  const [diplomacyFocusCountryId, setDiplomacyFocusCountryId] = useState<string | null>(null);
  const [militarySubScreen, setMilitarySubScreen] = useState<MilitarySubScreen | null>(null);
  const [mapMode, setMapMode] = useState<MapModeId>("political");
  const [notifOpen, setNotifOpen] = useState(false);

  const player = findCountry(state.countries, state.playerCountryId ?? "");
  const inspected = state.inspectingCountryId
    ? findCountryByIsoNumeric(state.countries, state.inspectingCountryId)
    : undefined;
  const notice = state.politics.pendingNotices[0];
  const diplomaticNotice = state.diplomacy.pendingNotices[0];
  const militaryNotice = state.military.pendingNotices[0];

  const relationLines =
    mapMode === "political" && state.diplomacy.mapOverlayEnabled
      ? Object.keys(state.diplomacy.relations)
          .map((id) => {
            const country = findCountry(state.countries, id);
            if (!country) return null;
            return { isoNumeric: country.isoNumeric, relation: computeRelation(state.diplomacy.relations[id]) };
          })
          .filter((line): line is { isoNumeric: string; relation: number } => line !== null)
      : undefined;

  const budgetBalance = state.economy.stats.taxRevenueTrillionYen + state.economy.stats.otherRevenueTrillionYen - totalBudget(state.economy.budget);
  const notifCount = state.politics.pendingNotices.length + state.diplomacy.pendingNotices.length + state.military.pendingNotices.length;
  const recentEvents = [...state.diplomacy.eventLog, ...state.military.eventLog].sort((a, b) => b.atMinute - a.atMinute).slice(0, 6);

  function openCategory(id: CategoryId) {
    dispatch({ type: "OPEN_CATEGORY", id });
  }

  function closeCategory() {
    dispatch({ type: "OPEN_CATEGORY", id: null });
  }

  function isMenuActive(button: MenuButton): boolean {
    if (button.kind === "category") return state.activeCategory === button.id;
    if (button.kind === "focusTree") return focusTreeOpen;
    return militarySubScreen === "policy";
  }

  function activateMenu(button: MenuButton) {
    if (button.kind === "category") openCategory(button.id);
    else if (button.kind === "focusTree") setFocusTreeOpen(true);
    else setMilitarySubScreen("policy");
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink">
      {/* 上部：国家情報・リソース・時間（指示書4章）。スマホの縦持ちでもはみ出さないよう2段にまとめる。 */}
      <header className="flex shrink-0 flex-col gap-2 border-b border-line px-3 pt-[calc(0.6rem+env(safe-area-inset-top))] pb-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => openCategory("overview")}
            title="国家概要を開く"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="shrink-0 text-[1.3rem] leading-none" aria-hidden>
              {player?.flag}
            </span>
            <span className="min-w-0 truncate">
              <span className="block truncate text-[1rem] font-medium text-body">{player?.name}</span>
              <span className="block truncate text-[0.72rem] text-body-muted">
                {state.politics.leader.name}内閣 ・ {state.politics.leader.cabinetName}
              </span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right leading-tight">
              <p className="figures text-[0.8rem] text-body">{formatDate(state.gameTime)}</p>
              <p className="figures text-[0.72rem] text-body-muted">{formatTime(state.gameTime)}</p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((open) => !open)}
                aria-label="通知"
                title="通知"
                className={`figures flex h-11 items-center gap-1 rounded border px-2.5 text-[0.85rem] transition-colors ${
                  notifCount > 0 ? "border-brass/60 bg-brass/10 text-brass" : "border-line text-body-muted"
                }`}
              >
                🔔 {notifCount}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 z-30 w-72 max-w-[85vw] rounded-lg border border-line-strong bg-ink-panel shadow-2xl shadow-black/50">
                  <p className="border-b border-line px-3 py-2 text-[0.72rem] font-medium tracking-wider text-brass">📰 最近の出来事</p>
                  <ul className="max-h-56 overflow-y-auto px-3 py-2 text-[0.78rem] text-body-muted">
                    {recentEvents.length === 0 ? (
                      <li className="py-2 text-center">まだ出来事はない。</li>
                    ) : (
                      recentEvents.map((entry) => <li key={entry.id} className="py-1">・{entry.text}</li>)
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 速度・国家リソースを1本の横スクロール帯にまとめ、幅の狭い画面でもはみ出させない（指示書4章：省略しない） */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <div className="flex shrink-0 items-center gap-1 border-r border-line pr-1.5">
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_SPEED", speed: 0 })}
              aria-label="一時停止"
              title="一時停止"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded border text-[0.8rem] transition-colors ${
                state.gameTime.speed === 0 ? "border-brass bg-brass/15 text-brass" : "border-line text-body-muted hover:border-line-strong"
              }`}
            >
              ⏸
            </button>
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => dispatch({ type: "SET_SPEED", speed })}
                aria-label={`速度${speed}倍`}
                title={`速度${speed}倍`}
                className={`figures flex h-11 w-11 shrink-0 items-center justify-center rounded border text-[0.75rem] transition-colors ${
                  state.gameTime.speed === speed
                    ? "border-brass bg-brass/15 text-brass"
                    : "border-line text-body-muted hover:border-line-strong"
                }`}
              >
                {SPEED_SYMBOL[speed]}
              </button>
            ))}
          </div>
          <ResourcePill
            emoji="🏛"
            value={`${Math.round(state.politics.stats.politicalPower)} (${state.politics.stats.politicalPowerPerDay >= 0 ? "+" : ""}${state.politics.stats.politicalPowerPerDay.toFixed(1)}/日)`}
            tooltip="政治力：国家方針・政策の決定に使う"
            onClick={() => openCategory("politics")}
          />
          <ResourcePill
            emoji="🤝"
            value={`支持率${Math.round(state.politics.stats.governmentSupport)}%`}
            tooltip="内閣支持率"
            onClick={() => openCategory("politics")}
          />
          <ResourcePill
            emoji="⚖"
            value={`安定${Math.round(state.politics.stats.stability)}%`}
            tooltip="国内の安定度"
            onClick={() => openCategory("politics")}
          />
          <ResourcePill
            emoji="💰"
            value={`¥${state.economy.stats.gdpTrillionYen.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}兆 (${state.economy.stats.gdpGrowthRate >= 0 ? "+" : ""}${state.economy.stats.gdpGrowthRate.toFixed(1)}%)`}
            tooltip="名目GDPと実質成長率"
            onClick={() => openCategory("economy")}
          />
          <ResourcePill
            emoji="💴"
            value={`収支${budgetBalance >= 0 ? "+" : ""}${budgetBalance.toFixed(1)}兆`}
            tooltip="財政収支（税収−歳出）"
            onClick={() => openCategory("economy")}
          />
          <ResourcePill
            emoji="👥"
            value={`現役${(state.military.personnel.activeDuty / 10000).toFixed(1)}万`}
            tooltip={`現役${state.military.personnel.activeDuty.toLocaleString("ja-JP")}人 ・ 動員可能${state.military.personnel.mobilizable.toLocaleString("ja-JP")}人`}
            onClick={() => openCategory("military")}
          />
          <ResourcePill
            emoji="🪖"
            value={`陸${Math.round(state.military.forces.land.capability)}`}
            tooltip="陸上戦力の能力指数"
            onClick={() => openCategory("military")}
          />
          <ResourcePill
            emoji="⚓"
            value={`海${Math.round(state.military.forces.sea.capability)}`}
            tooltip="海上戦力の能力指数"
            onClick={() => openCategory("military")}
          />
          <ResourcePill
            emoji="✈"
            value={`空${Math.round(state.military.forces.air.capability)}`}
            tooltip="航空戦力の能力指数"
            onClick={() => openCategory("military")}
          />
          <ResourcePill
            emoji="🔬"
            value={`研究${state.research.active.length}/${state.research.slots}`}
            tooltip="研究中/研究枠"
            onClick={() => openCategory("research")}
          />
        </div>
      </header>

      {/* 中央：世界地図（指示書6・7章） */}
      <div className="relative min-h-0 flex-1">
        <WorldMap
          countries={state.countries}
          selectedIsoNumeric={player?.isoNumeric}
          onSelectCountry={(iso) => dispatch({ type: "INSPECT_COUNTRY", id: iso })}
          relationLines={relationLines}
        />

        <FocusProgressCard onOpen={() => setFocusTreeOpen(true)} />

        {/* マップモード切替（指示書10章） */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 rounded-lg border border-line-strong bg-ink-panel/90 p-1 shadow-lg shadow-black/40 backdrop-blur-sm">
          {MAP_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setMapMode(mode.id)}
              title={`マップモード：${mode.label}`}
              className={`flex h-8 w-8 items-center justify-center rounded text-[0.85rem] transition-colors ${
                mapMode === mode.id ? "bg-brass/20 text-brass" : "text-body-muted hover:bg-white/5 hover:text-body"
              }`}
            >
              {mode.emoji}
            </button>
          ))}
        </div>

        {state.inspectingCountryId && (
          <CountryContextPanel
            isoNumeric={state.inspectingCountryId}
            country={inspected}
            onClose={() => dispatch({ type: "INSPECT_COUNTRY", id: null })}
            onOpenDiplomacy={() => {
              if (!inspected) return;
              setDiplomacyFocusCountryId(inspected.id);
              dispatch({ type: "INSPECT_COUNTRY", id: null });
              openCategory("diplomacy");
            }}
          />
        )}
      </div>

      {/* 下部：国家管理・軍事・マップ操作UI（指示書8・9章）。
          19項目を折り返すと縦持ちスマホで地図が数センチまで潰れるため、
          項目は削らずに1段の横スクロール帯にする。 */}
      <nav className="flex shrink-0 gap-px overflow-x-auto border-t border-line bg-line pb-[env(safe-area-inset-bottom)]">
        {MENU_BUTTONS.map((button) => {
          const key = button.kind === "category" ? button.id : button.kind;
          return (
            <button
              key={key}
              type="button"
              onClick={() => activateMenu(button)}
              className={`flex min-h-[52px] w-[68px] shrink-0 flex-col items-center justify-center gap-0.5 bg-ink-panel py-1 text-[0.65rem] transition-colors hover:bg-ink-raised ${
                isMenuActive(button) ? "text-brass" : "text-body-muted hover:text-body"
              }`}
            >
              <span className="text-[1.05rem]" aria-hidden>
                {button.emoji}
              </span>
              {button.label}
            </button>
          );
        })}
      </nav>

      {state.activeCategory === "politics" && (
        <PoliticsScreen onClose={closeCategory} onOpenFocusTree={() => setFocusTreeOpen(true)} />
      )}

      {state.activeCategory === "economy" && <EconomyScreen onClose={closeCategory} />}

      {state.activeCategory === "diplomacy" && (
        <DiplomacyScreen
          onClose={() => {
            setDiplomacyFocusCountryId(null);
            closeCategory();
          }}
          initialCountryId={diplomacyFocusCountryId}
        />
      )}

      {state.activeCategory === "research" && <ResearchScreen onClose={closeCategory} />}

      {state.activeCategory === "military" && (
        <MilitaryScreen
          onClose={closeCategory}
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

      {state.activeCategory === "production" && <ProductionScreen onClose={closeCategory} />}

      {state.activeCategory === "intelligence" && <IntelligenceScreen onClose={closeCategory} />}

      {state.activeCategory === "trade" && <TradeScreen onClose={closeCategory} />}
      {state.activeCategory === "worldTension" && <WorldTensionScreen onClose={closeCategory} />}
      {state.activeCategory === "faction" && <FactionScreen onClose={closeCategory} />}

      {state.activeCategory === "construction" && (
        <ProvinceStatScreen
          title="🏗 建設"
          description="各地のインフラ整備度・防御施設。個別の建設キューはまだない。"
          kind="infrastructure"
          onClose={closeCategory}
        />
      )}
      {state.activeCategory === "logistics" && (
        <ProvinceStatScreen
          title="🚚 兵站"
          description="各地の補給の届きやすさ。専用の補給網シミュレーションはまだない。"
          kind="supply"
          onClose={closeCategory}
        />
      )}

      {state.activeCategory === "decisions" && (
        <PlaceholderScreen
          title="📋 ディシジョン"
          description="条件を満たすと随時実行できる、政策アクションの一覧。まだ条件・効果は定義されていない。"
          onClose={closeCategory}
        />
      )}
      {state.activeCategory === "market" && (
        <PlaceholderScreen
          title="💱 国際市場"
          description="資源・製品の世界価格と、価格変動に応じた取引。まだ市場データはない。"
          onClose={closeCategory}
        />
      )}
      {state.activeCategory === "puppets" && (
        <PlaceholderScreen
          title="🏴 傀儡・従属国"
          description="従属させた国の統治方針・自治度・資源徴発。まだ従属国は存在しない。"
          onClose={closeCategory}
        />
      )}
      {state.activeCategory === "resistance" && (
        <PlaceholderScreen
          title="🕵 レジスタンス"
          description="占領地域で発生するレジスタンス運動と、その鎮圧・懐柔。まだ占領システムがない。"
          onClose={closeCategory}
        />
      )}
      {state.activeCategory === "mio" && (
        <PlaceholderScreen
          title="🏭 MIO（軍需産業）"
          description="軍需産業を束ねる組織。研究・生産にボーナスを与える。実データは🏭生産・🔬研究を参照。"
          onClose={closeCategory}
        />
      )}
      {state.activeCategory === "experimental" && (
        <PlaceholderScreen
          title="🧪 実験施設"
          description="先進兵器の研究を加速させる専用施設。通常の研究は🔬研究を参照。"
          onClose={closeCategory}
        />
      )}

      {state.activeCategory === "overview" && player && (
        <Modal title="国家概要" onClose={closeCategory}>
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
