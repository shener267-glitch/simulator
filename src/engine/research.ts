import type { ResearchProgress, TechEffect, TechTemplate } from "../types/research";
import type { NationalModifier, PoliticalStats } from "../types/politics";
import { findTech } from "../data/technologies";

/** 1日=1440分。国家方針と同じ基準。 */
export const MINUTES_PER_DAY = 1440;

export function minutesToDays(minutes: number): number {
  return minutes / MINUTES_PER_DAY;
}

export function isTechCompleted(completedTechIds: string[], techId: string): boolean {
  return completedTechIds.includes(techId);
}

/**
 * いま選べる技術か（指示書16章）。前提条件をすべて満たし、まだ完了しておらず、
 * 別の研究枠ですでに進めていないこと。`requiresUnlock`が立っている技術は、
 * それに加えて`unlock_tech`効果で明示的に解禁されていないと選べない。
 */
export function isTechAvailable(
  tech: TechTemplate,
  completedTechIds: string[],
  unlockedTechIds: string[],
  activeTechIds: string[],
): boolean {
  if (isTechCompleted(completedTechIds, tech.id)) return false;
  if (activeTechIds.includes(tech.id)) return false;
  if (!tech.prerequisites.every((id) => completedTechIds.includes(id))) return false;
  if (tech.requiresUnlock && !unlockedTechIds.includes(tech.id)) return false;
  return true;
}

export function isTechDone(progress: ResearchProgress, template: TechTemplate): boolean {
  return progress.daysElapsed >= template.durationDays;
}

/** 研究速度の倍率。研究予算・国家方針・既存技術のボーナスを積み上げたもの（指示書15章）。 */
export function speedMultiplier(speedBonusPercent: number): number {
  return 1 + speedBonusPercent / 100;
}

/** 研究枠すべてを、経過日数×速度倍率ぶんだけ進める。 */
export function advanceResearch(active: ResearchProgress[], elapsedDays: number, speedBonusPercent: number): ResearchProgress[] {
  const multiplier = speedMultiplier(speedBonusPercent);
  return active.map((progress) => ({ ...progress, daysElapsed: progress.daysElapsed + elapsedDays * multiplier }));
}

export interface TechEffectResult {
  politicalStats: PoliticalStats;
  modifiers: NationalModifier[];
  unlockedTechIds: string[];
  speedBonusDelta: number;
}

/**
 * 技術の研究完了時に一度だけ適用する効果（指示書17章）。研究速度・政治力の
 * 獲得量など、政治システムをまたぐ効果もここでまとめて扱う。
 */
export function applyTechEffects(
  effects: TechEffect[],
  politicalStats: PoliticalStats,
  modifiers: NationalModifier[],
  unlockedTechIds: string[],
): TechEffectResult {
  let nextStats = politicalStats;
  let nextModifiers = modifiers;
  let nextUnlocked = unlockedTechIds;
  let speedBonusDelta = 0;

  for (const effect of effects) {
    switch (effect.type) {
      case "modify_research_speed":
        speedBonusDelta += effect.amount;
        break;
      case "modify_political_power_gain":
        nextStats = { ...nextStats, politicalPowerPerDay: nextStats.politicalPowerPerDay + effect.amount };
        break;
      case "add_national_modifier":
        nextModifiers = [...nextModifiers, { id: effect.id, label: effect.label }];
        break;
      case "unlock_tech":
        nextUnlocked = nextUnlocked.includes(effect.techId) ? nextUnlocked : [...nextUnlocked, effect.techId];
        break;
    }
  }

  return { politicalStats: nextStats, modifiers: nextModifiers, unlockedTechIds: nextUnlocked, speedBonusDelta };
}

function signed(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

export function describeTechEffect(effect: TechEffect): string {
  switch (effect.type) {
    case "modify_research_speed":
      return `研究速度 ${signed(effect.amount)}%`;
    case "modify_political_power_gain":
      return `政治力の1日あたり獲得量 ${signed(effect.amount)}`;
    case "add_national_modifier":
      return `国家補正「${effect.label}」`;
    case "unlock_tech": {
      const unlocked = findTech(effect.techId);
      return `「${unlocked?.name ?? effect.techId}」が選べるようになる`;
    }
  }
}
