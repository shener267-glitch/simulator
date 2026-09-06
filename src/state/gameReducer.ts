import type { CategoryId, FocusNotice, GameState, PoliticsState } from "../types/game";
import type { Speed } from "../types/gameTime";
import { advanceOneMinute, minutesPerTick } from "../engine/gameTime";
import { applyFocusEffects, isFocusAvailable, isFocusDone, minutesToDays } from "../engine/focus";
import { findFocus } from "../data/focuses";
import { createPoliticsState } from "./politics";

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
  | { type: "ACK_FOCUS_NOTICE" };

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
      const notices: FocusNotice[] = [
        { kind: "focus_complete", focusId: template.id },
        ...result.triggeredEventIds.map((eventId): FocusNotice => ({ kind: "event", eventId })),
      ];
      politics = {
        ...politics,
        stats: result.stats,
        parties: result.parties,
        modifiers: result.modifiers,
        unlockedFocusIds: result.unlockedFocusIds,
        completedFocusIds: [...politics.completedFocusIds, template.id],
        activeFocus: null,
        pendingNotices: [...politics.pendingNotices, ...notices],
      };
      // 国家方針の完了は重要な出来事として自動停止し、確認させる（指示書15章）。
      return { ...state, gameTime: { ...time, speed: 0 }, politics };
    }

    politics = { ...politics, activeFocus: advanced };
  }

  return { ...state, gameTime: time, politics };
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

    default:
      return state;
  }
}

