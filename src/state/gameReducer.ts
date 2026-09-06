import type { BudgetCategory } from "../types/economy";
import type { CategoryId, FocusNotice, GameState, PoliticsState } from "../types/game";
import type { ResearchProgress } from "../types/research";
import type { Speed } from "../types/gameTime";
import { advanceOneMinute, minutesPerTick } from "../engine/gameTime";
import { applyFocusEffects, isFocusAvailable, isFocusDone, minutesToDays } from "../engine/focus";
import { advanceEconomy, applyEconomyEffects, politicalDriftPerDay, schedulePolicyEffects } from "../engine/economy";
import { advanceResearch, applyTechEffects, isTechAvailable, isTechDone } from "../engine/research";
import { findFocus } from "../data/focuses";
import { findEconomyPolicy } from "../data/economyPolicies";
import { findTech } from "../data/technologies";
import { createPoliticsState } from "./politics";
import { createEconomyState } from "./economy";
import { createResearchState } from "./research";

export type GameAction =
  /** タイトル画面から国家選択画面へ。 */
  | { type: "START" }
  /** 国家選択画面で、プレビューする国を変える。時間は動かない。 */
  | { type: "SELECT_COUNTRY"; id: string }
  /** 選んだ国でゲームを開始する。 */
  | { type: "BEGIN_GAME" }
  /** メイン画面の地図をクリックして国家情報を覗く。idがnullなら閉じる。 */
  | { type: "INSPECT_COUNTRY"; id: string | null }
  /** 下部メニューのカテゴリを開閉する。idがnullなら閉じる。 */
  | { type: "OPEN_CATEGORY"; id: CategoryId | null }
  /** 速度を変える。0は一時停止（指示書5章）。 */
  | { type: "SET_SPEED"; speed: Speed }
  /** 一分ずつ、最大speed分だけ時間を進める。 */
  | { type: "TICK" }
  /** 国家方針を選んで進め始める（指示書11章：同時に一つだけ）。 */
  | { type: "START_FOCUS"; focusId: string }
  /** 国家方針完了・イベントの通知を読み終えて、次の通知か通常画面へ。 */
  | { type: "ACK_FOCUS_NOTICE" }
  /** 予算配分を変える（指示書4章）。 */
  | { type: "SET_BUDGET"; category: BudgetCategory; amount: number }
  /** 経済政策を決める（指示書7・8章）。一度決めた政策は決め直せない。 */
  | { type: "DECIDE_ECONOMY_POLICY"; policyId: string }
  /** 研究を始める（指示書11〜16章）。空いている研究枠が要る。 */
  | { type: "START_RESEARCH"; techId: string };

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function tick(state: GameState): GameState {
  if (state.phase !== "playing" || state.gameTime.speed === 0) return state;

  const elapsedMinutes = minutesPerTick(state.gameTime.speed);
  let time = state.gameTime;
  for (let i = 0; i < elapsedMinutes; i++) time = advanceOneMinute(time);
  const elapsedDays = minutesToDays(elapsedMinutes);

  let politics: PoliticsState = {
    ...state.politics,
    stats: {
      ...state.politics.stats,
      politicalPower: Math.max(
        0,
        state.politics.stats.politicalPower + state.politics.stats.politicalPowerPerDay * elapsedDays,
      ),
    },
  };
  let economy = state.economy;
  let research = state.research;
  let shouldPause = false;
  const newNotices: FocusNotice[] = [];

  // --- 経済: 決めた政策の、予定されていた段階を適用する（指示書8章） ---
  const newElapsedMinutes = economy.elapsedMinutes + elapsedMinutes;
  const due = economy.scheduledEffects.filter((effect) => effect.atMinute <= newElapsedMinutes);
  const stillPending = economy.scheduledEffects.filter((effect) => effect.atMinute > newElapsedMinutes);
  let econStats = economy.stats;
  let econBudget = economy.budget;
  for (const scheduled of due) {
    const result = applyEconomyEffects(scheduled.effects, econStats, econBudget);
    econStats = result.stats;
    econBudget = result.budget;
    for (const eventId of result.triggeredEventIds) newNotices.push({ kind: "event", eventId });
  }

  // --- 経済: 時間経過そのものによる変化（GDP成長・財政赤字の積み上がり、指示書5・6章） ---
  econStats = advanceEconomy(econStats, econBudget, elapsedDays);
  economy = { ...economy, stats: econStats, budget: econBudget, scheduledEffects: stillPending, elapsedMinutes: newElapsedMinutes };

  // --- 経済→政治への、ゆるやかな影響（指示書9章） ---
  const drift = politicalDriftPerDay(econStats);
  politics = {
    ...politics,
    stats: {
      ...politics.stats,
      governmentSupport: clampPercent(politics.stats.governmentSupport + drift.governmentSupport * elapsedDays),
      stability: clampPercent(politics.stats.stability + drift.stability * elapsedDays),
    },
  };

  // --- 国家方針の進行 ---
  if (politics.activeFocus) {
    const template = findFocus(politics.activeFocus.focusId);
    const advanced = { ...politics.activeFocus, daysElapsed: politics.activeFocus.daysElapsed + elapsedDays };

    if (template && isFocusDone(advanced, template)) {
      const result = applyFocusEffects(
        template.effects,
        politics.stats,
        politics.parties,
        politics.modifiers,
        politics.unlockedFocusIds,
      );
      newNotices.push({ kind: "focus_complete", focusId: template.id });
      for (const eventId of result.triggeredEventIds) newNotices.push({ kind: "event", eventId });
      politics = {
        ...politics,
        stats: result.stats,
        parties: result.parties,
        modifiers: result.modifiers,
        unlockedFocusIds: result.unlockedFocusIds,
        completedFocusIds: [...politics.completedFocusIds, template.id],
        activeFocus: null,
      };
      research = { ...research, speedBonusPercent: research.speedBonusPercent + result.researchSpeedDelta };
      shouldPause = true;
    } else {
      politics = { ...politics, activeFocus: advanced };
    }
  }

  // --- 研究の進行（指示書15〜17章） ---
  if (research.active.length > 0) {
    const advancedList = advanceResearch(research.active, elapsedDays, research.speedBonusPercent);
    const stillActive: ResearchProgress[] = [];
    let completedTechIds = research.completedTechIds;
    let unlockedTechIds = research.unlockedTechIds;
    let modifiers = research.modifiers;
    let speedBonusPercent = research.speedBonusPercent;
    let politicalStats = politics.stats;

    for (const progress of advancedList) {
      const template = findTech(progress.techId);
      if (template && isTechDone(progress, template)) {
        const result = applyTechEffects(template.effects, politicalStats, modifiers, unlockedTechIds);
        politicalStats = result.politicalStats;
        modifiers = result.modifiers;
        unlockedTechIds = result.unlockedTechIds;
        speedBonusPercent += result.speedBonusDelta;
        completedTechIds = [...completedTechIds, template.id];
        newNotices.push({ kind: "tech_complete", techId: template.id });
        shouldPause = true;
      } else {
        stillActive.push(progress);
      }
    }

    politics = { ...politics, stats: politicalStats };
    research = { ...research, active: stillActive, completedTechIds, unlockedTechIds, modifiers, speedBonusPercent };
  }

  politics = { ...politics, pendingNotices: [...politics.pendingNotices, ...newNotices] };

  return {
    ...state,
    gameTime: shouldPause ? { ...time, speed: 0 } : time,
    politics,
    economy,
    research,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return state.phase === "title" ? { ...state, phase: "select" } : state;

    case "SELECT_COUNTRY":
      return state.phase === "select" ? { ...state, selectedCountryId: action.id } : state;

    case "BEGIN_GAME":
      return state.phase === "select"
        ? {
            ...state,
            phase: "playing",
            playerCountryId: state.selectedCountryId,
            politics: createPoliticsState(state.selectedCountryId),
            economy: createEconomyState(state.selectedCountryId),
            research: createResearchState(),
          }
        : state;

    case "INSPECT_COUNTRY":
      return state.phase === "playing" ? { ...state, inspectingCountryId: action.id } : state;

    case "OPEN_CATEGORY":
      return state.phase === "playing" ? { ...state, activeCategory: action.id } : state;

    case "SET_SPEED":
      return state.phase === "playing"
        ? { ...state, gameTime: { ...state.gameTime, speed: action.speed } }
        : state;

    case "TICK":
      return tick(state);

    case "START_FOCUS": {
      if (state.phase !== "playing") return state;
      const politics = state.politics;
      // 同時に複数の国家方針は選ばない（指示書11章）。
      if (politics.activeFocus) return state;
      const template = findFocus(action.focusId);
      if (!template) return state;
      if (!isFocusAvailable(template, politics.completedFocusIds, politics.unlockedFocusIds)) return state;
      if (politics.stats.politicalPower < template.politicalPowerCost) return state;

      return {
        ...state,
        politics: {
          ...politics,
          stats: { ...politics.stats, politicalPower: politics.stats.politicalPower - template.politicalPowerCost },
          activeFocus: { focusId: template.id, daysElapsed: 0 },
        },
      };
    }

    case "ACK_FOCUS_NOTICE": {
      if (state.politics.pendingNotices.length === 0) return state;
      return { ...state, politics: { ...state.politics, pendingNotices: state.politics.pendingNotices.slice(1) } };
    }

    case "SET_BUDGET": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        economy: {
          ...state.economy,
          budget: { ...state.economy.budget, [action.category]: Math.max(0, action.amount) },
        },
      };
    }

    case "DECIDE_ECONOMY_POLICY": {
      if (state.phase !== "playing") return state;
      const economy = state.economy;
      if (economy.decidedPolicyIds.includes(action.policyId)) return state;
      const policy = findEconomyPolicy(action.policyId);
      if (!policy) return state;
      if (state.politics.stats.politicalPower < policy.politicalPowerCost) return state;

      const scheduledEffects = [...economy.scheduledEffects, ...schedulePolicyEffects(policy, economy.elapsedMinutes)];
      return {
        ...state,
        politics: {
          ...state.politics,
          stats: {
            ...state.politics.stats,
            politicalPower: state.politics.stats.politicalPower - policy.politicalPowerCost,
          },
        },
        economy: { ...economy, decidedPolicyIds: [...economy.decidedPolicyIds, policy.id], scheduledEffects },
      };
    }

    case "START_RESEARCH": {
      if (state.phase !== "playing") return state;
      const research = state.research;
      // 空いている研究枠が要る（指示書12章）。
      if (research.active.length >= research.slots) return state;
      const template = findTech(action.techId);
      if (!template) return state;
      const activeTechIds = research.active.map((progress) => progress.techId);
      if (!isTechAvailable(template, research.completedTechIds, research.unlockedTechIds, activeTechIds)) return state;

      return {
        ...state,
        research: { ...research, active: [...research.active, { techId: template.id, daysElapsed: 0 }] },
      };
    }

    default:
      return state;
  }
}
