import { GAME_START, type Minutes } from "../types/clock";
import type { CrisisTemplate, Season } from "../types/crisis";
import type { FiredCrisis, GameState } from "../types/game";
import { CRISES, findCrisis } from "../data/crises/catalogue";

/**
 * 危機イベントの発火（設計書15〜17章）。v0.4まではカタログだけを置いて
 * 一件も発火させなかった——今回、実際に転がすのはここが初めてになる。
 *
 * probability はカタログの側で「一日あたりの目安」として書かれている。
 * ここでは一分あたりの確率に線形近似で落とす。もともと小さい値（最大でも
 * 数%）なので、複利で計算しても線形近似でもほぼ同じ結果になる。
 */
function perMinuteProbability(dailyProbability: number): number {
  return dailyProbability / 1440;
}

function seasonOf(totalMinutes: Minutes): Season {
  const date = new Date(Date.UTC(GAME_START.year, GAME_START.month - 1, GAME_START.day) + totalMinutes * 60_000);
  const month = date.getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function alreadyFired(state: GameState, templateId: string): boolean {
  return state.crises.some((crisis) => crisis.templateId === templateId);
}

/** その時刻に、そのテンプレートが起こりうる状態か。 */
function eligible(template: CrisisTemplate, state: GameState, totalMinutes: Minutes): boolean {
  if (alreadyFired(state, template.id)) return false;
  if (template.seasons && !template.seasons.includes(seasonOf(totalMinutes))) return false;
  if (template.requires && !template.requires.every((flag) => state.flags.includes(flag))) return false;
  return true;
}

/** 0以上1未満の乱数を返すもの。テストから差し替えられるように引数で受ける。 */
export type Rng = () => number;

/**
 * 単独で起きる危機（親を持たないもの）を一分ぶんだけ判定する。
 * 子・関連イベントは、親が実際に起きた瞬間に一回だけ別途判定する
 * （`rollChildren`）——毎分転がし続けるものではない。
 */
export function rollStandalone(
  state: GameState,
  totalMinutes: Minutes,
  rng: Rng = Math.random,
): CrisisTemplate | null {
  const standalone = CRISES.filter((template) => template.parents.length === 0);
  for (const template of standalone) {
    if (!eligible(template, state, totalMinutes)) continue;
    if (rng() < perMinuteProbability(template.probability)) return template;
  }
  return null;
}

/**
 * 何かが起きた直後、その子・関連イベントが連鎖するかを一回だけ判定する。
 * 子の probability は「親が起きたときの条件付き確率」として書かれている
 * （カタログの記述どおり）——一分あたりではなく、この一回だけの抽選。
 */
export function rollChildren(
  parentId: string,
  state: GameState,
  totalMinutes: Minutes,
  rng: Rng = Math.random,
): CrisisTemplate[] {
  const parent = findCrisis(parentId);
  if (!parent) return [];
  const fired: CrisisTemplate[] = [];
  for (const childId of parent.children) {
    const child = findCrisis(childId);
    if (!child || !eligible(child, state, totalMinutes)) continue;
    if (rng() < child.probability) fired.push(child);
  }
  return fired;
}

export function makeFiredCrisis(template: CrisisTemplate, at: Minutes): FiredCrisis {
  return { id: `${template.id}-${at}`, templateId: template.id, firedAt: at, acknowledged: false };
}
