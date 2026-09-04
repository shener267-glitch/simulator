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

/**
 * 目盛り（設計書30章）。数字は返さない — マスの数と「低/中/高」だけ。
 * 内部値をそのまま出さないのは、体調を管理する対象ではなく感じ取るものに
 * しておきたいから。
 */
export const METER_CELLS = 5;

export type GaugeLabel = "低" | "中" | "高";

export interface ConditionGauge {
  /** 五マスのうち埋まる数。一から五。 */
  filled: number;
  label: GaugeLabel;
}

function gauge(value: number): ConditionGauge {
  const filled = Math.max(1, Math.min(METER_CELLS, Math.floor(value / 20) + 1));
  const label: GaugeLabel = value < 34 ? "低" : value < 67 ? "中" : "高";
  return { filled, label };
}

export function fatigueGauge(fatigue: number): ConditionGauge {
  return gauge(fatigue);
}

export function hungerGauge(hunger: number): ConditionGauge {
  return gauge(hunger);
}

export function clampCondition(condition: Condition, clock = 0): Condition {
  return {
    fatigue: Math.max(fatigueFloor(clock), Math.min(100, condition.fatigue)),
    hunger: Math.max(0, Math.min(100, condition.hunger)),
  };
}

/**
 * その日のうちには、もう抜けないぶん（本セッションでの決定）。
 *
 * 仮眠も入浴も何度でもできるので、床がないと「一日の終わりに万全」が
 * 常に作れてしまう。起きている時間そのものは休んでも消えない、という
 * 一点だけを床にして、あとは休んだぶんだけ戻るようにしてある。
 * 抜けるのは寝てからで、それは翌朝の話になる（engine/sleep.ts）。
 */
export function fatigueFloor(clock: number): number {
  return Math.min(60, clock * 0.045);
}

/**
 * 時間が経つだけで消耗する（設計書24章）。起きているかぎり疲労は少しずつ
 * 積もり、空腹はそれより速く来る。仮眠・入浴・食事で戻せるが、戻すには
 * 時間を使う。生活を削れば今の時間は増えて、あとで返すことになる。
 *
 * 係数は一日（1080分）で意味が出るように置いてある。何も食べず何も休まずに
 * 24:00まで起きていれば疲労は限界近くまで積もり、空腹は振り切れる。三食と
 * 仮眠を取れば最後まで保つ、という幅になるように選んだ。
 */
export function applyElapsed(condition: Condition, minutes: number, clock = 0): Condition {
  return clampCondition(
    {
      fatigue: condition.fatigue + minutes * 0.03,
      hunger: condition.hunger + minutes * 0.055,
    },
    clock,
  );
}
