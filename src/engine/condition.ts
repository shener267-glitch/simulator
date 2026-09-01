import type { Condition } from "../types/game";

/**
 * Condition is shown as prose only — never as a number (本セッションでの決定)．
 * Every function here must return text free of digits.
 */

const FATIGUE_STEPS: { below: number; text: string }[] = [
  { below: 20, text: "体は軽い。頭もよく回っている。" },
  { below: 40, text: "眠気は少し残っているが、問題なく動ける。" },
  { below: 60, text: "疲れが抜けきっていない。長く座っていると瞼が重くなる。" },
  { below: 80, text: "頭が重い。集中がなかなか続かない。" },
  { below: Infinity, text: "限界が近い。立っているだけで消耗していく。" },
];

const HUNGER_STEPS: { below: number; text: string }[] = [
  { below: 20, text: "腹は満たされている。" },
  { below: 40, text: "特に空腹は感じない。" },
  { below: 60, text: "そろそろ何か腹に入れておきたい。" },
  { below: 80, text: "腹が減っている。落ち着かない。" },
  { below: Infinity, text: "空腹で胃が縮んでいる感覚がある。" },
];

function pick(steps: { below: number; text: string }[], value: number): string {
  return steps.find((step) => value < step.below)!.text;
}

export function describeFatigue(fatigue: number): string {
  return pick(FATIGUE_STEPS, fatigue);
}

export function describeHunger(hunger: number): string {
  return pick(HUNGER_STEPS, hunger);
}

export function describeCondition(condition: Condition): string[] {
  return [describeFatigue(condition.fatigue), describeHunger(condition.hunger)];
}

export function clampCondition(condition: Condition): Condition {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  return { fatigue: clamp(condition.fatigue), hunger: clamp(condition.hunger) };
}

/** Hunger creeps up as the morning passes, a little every ten minutes. */
export function applyElapsed(condition: Condition, minutes: number): Condition {
  return clampCondition({
    fatigue: condition.fatigue,
    hunger: condition.hunger + minutes * 0.1,
  });
}
