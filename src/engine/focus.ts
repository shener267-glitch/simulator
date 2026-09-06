import type { FocusEffect, FocusProgress, FocusTemplate } from "../types/focus";
import type { NationalModifier, Party, PoliticalStats } from "../types/politics";
import { findFocus } from "../data/focuses";

/** 1日=1440分。ゲーム内時間(分)から国家方針の進捗(日)へ換算する基準。 */
export const MINUTES_PER_DAY = 1440;

export function minutesToDays(minutes: number): number {
  return minutes / MINUTES_PER_DAY;
}

export function isFocusCompleted(completedFocusIds: string[], focusId: string): boolean {
  return completedFocusIds.includes(focusId);
}

/**
 * いま選べる国家方針か（指示書12・14章）。前提条件をすべて満たし、
 * まだ完了していないこと。`requiresUnlock`が立っている方針は、それに加えて
 * `unlock_focus`効果で明示的に解禁されていないと選べない。
 */
export function isFocusAvailable(
  focus: FocusTemplate,
  completedFocusIds: string[],
  unlockedFocusIds: string[],
): boolean {
  if (isFocusCompleted(completedFocusIds, focus.id)) return false;
  if (!focus.prerequisites.every((id) => completedFocusIds.includes(id))) return false;
  if (focus.requiresUnlock && !unlockedFocusIds.includes(focus.id)) return false;
  return true;
}

export function isFocusDone(progress: FocusProgress, template: FocusTemplate): boolean {
  return progress.daysElapsed >= template.durationDays;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export interface FocusEffectResult {
  stats: PoliticalStats;
  parties: Party[];
  modifiers: NationalModifier[];
  unlockedFocusIds: string[];
  triggeredEventIds: string[];
}

/**
 * 国家方針が完了した瞬間に一度だけ適用する効果（指示書14章）。ここで
 * 使えるEffectの語彙は指示書が挙げた8種類ちょうど——後のPhaseでGDPや
 * 防衛力などを足すときも、この形のまま種類を増やせばよい。
 */
export function applyFocusEffects(
  effects: FocusEffect[],
  stats: PoliticalStats,
  parties: Party[],
  modifiers: NationalModifier[],
  unlockedFocusIds: string[],
): FocusEffectResult {
  let nextStats = stats;
  let nextParties = parties;
  let nextModifiers = modifiers;
  let nextUnlocked = unlockedFocusIds;
  const triggeredEventIds: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case "add_political_power":
        nextStats = { ...nextStats, politicalPower: Math.max(0, nextStats.politicalPower + effect.amount) };
        break;
      case "modify_political_power_gain":
        nextStats = { ...nextStats, politicalPowerPerDay: nextStats.politicalPowerPerDay + effect.amount };
        break;
      case "modify_stability":
        nextStats = { ...nextStats, stability: clampPercent(nextStats.stability + effect.amount) };
        break;
      case "modify_government_support":
        nextStats = { ...nextStats, governmentSupport: clampPercent(nextStats.governmentSupport + effect.amount) };
        break;
      case "modify_party_popularity":
        nextParties = nextParties.map((party) =>
          party.id === effect.partyId ? { ...party, popularity: clampPercent(party.popularity + effect.amount) } : party,
        );
        break;
      case "add_national_modifier":
        nextModifiers = [...nextModifiers, { id: effect.id, label: effect.label }];
        break;
      case "trigger_event":
        triggeredEventIds.push(effect.eventId);
        break;
      case "unlock_focus":
        nextUnlocked = nextUnlocked.includes(effect.focusId) ? nextUnlocked : [...nextUnlocked, effect.focusId];
        break;
    }
  }

  return { stats: nextStats, parties: nextParties, modifiers: nextModifiers, unlockedFocusIds: nextUnlocked, triggeredEventIds };
}

function signed(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

/** 効果を日本語の一行にする。国家方針の詳細表示だけで使う表示用の関数。 */
export function describeFocusEffect(effect: FocusEffect, parties: Party[]): string {
  switch (effect.type) {
    case "add_political_power":
      return `政治力 ${signed(effect.amount)}`;
    case "modify_political_power_gain":
      return `政治力の1日あたり獲得量 ${signed(effect.amount)}`;
    case "modify_stability":
      return `安定度 ${signed(effect.amount)}%`;
    case "modify_government_support":
      return `政府支持率 ${signed(effect.amount)}%`;
    case "modify_party_popularity": {
      const party = parties.find((p) => p.id === effect.partyId);
      return `${party?.name ?? effect.partyId}の支持率 ${signed(effect.amount)}%`;
    }
    case "add_national_modifier":
      return `国家補正「${effect.label}」`;
    case "trigger_event":
      return `イベントが発生する`;
    case "unlock_focus": {
      const unlocked = findFocus(effect.focusId);
      return `「${unlocked?.name ?? effect.focusId}」が選べるようになる`;
    }
  }
}
