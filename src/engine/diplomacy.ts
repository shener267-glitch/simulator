import type {
  AiPersonality,
  CountryDiplomacy,
  DiplomacyEffect,
  DiplomaticActionTemplate,
  DiplomaticStanceId,
  RegionId,
  RelationModifier,
  ScheduledDiplomacyEffect,
  TradeState,
  Treaty,
  TreatyTypeId,
} from "../types/diplomacy";
import { DIPLOMATIC_CRISES, DIPLOMATIC_NEWS, REGION_LABELS, findStance, findTreaty } from "../data/diplomacy";

export const MINUTES_PER_DAY = 1440;
export const REGION_IDS = Object.keys(REGION_LABELS) as RegionId[];

export function minutesToDays(minutes: number): number {
  return minutes / MINUTES_PER_DAY;
}

function clampRelation(value: number): number {
  return Math.min(100, Math.max(-100, value));
}

function clampBar(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/** 関係値 = 基準値 + 内訳の合計（指示書5章、内訳を見せるための形）。 */
export function computeRelation(country: CountryDiplomacy): number {
  return clampRelation(country.modifiers.reduce((sum, modifier) => sum + modifier.amount, country.baseRelation));
}

export function relationStatusLabel(relation: number): string {
  if (relation >= 60) return "友好国";
  if (relation >= 20) return "良好";
  if (relation >= -20) return "普通";
  if (relation >= -60) return "緊張";
  return "険悪";
}

const BAR_LABEL: Record<"gov" | "econ" | "mil", string> = { gov: "政府間関係", econ: "経済関係", mil: "軍事関係" };

function signed(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

/** 効果を日本語の一行にする。行動・条約の詳細表示だけで使う表示用の関数。 */
export function describeDiplomacyEffect(effect: DiplomacyEffect): string {
  switch (effect.type) {
    case "modify_relation":
      return `関係値 ${signed(effect.amount)}`;
    case "modify_bar":
      return `${BAR_LABEL[effect.bar]} ${signed(effect.amount)}`;
    case "modify_regional_tension":
      return `${REGION_LABELS[effect.region]}の緊張度 ${signed(effect.amount)}`;
    case "modify_political_power":
      return `政治力 ${signed(effect.amount)}`;
    case "modify_government_support":
      return `政府支持率 ${signed(effect.amount)}%`;
    case "add_treaty": {
      const treaty = findTreaty(effect.treatyTypeId);
      return `「${treaty?.name ?? effect.treatyTypeId}」を締結する`;
    }
    case "modify_trade":
      return `貿易充足 ${signed(effect.amount)}兆円`;
    case "trigger_event":
      return "イベントが発生する";
  }
}

/**
 * 行動・条約テンプレートの効果は相手国idを空文字のプレースホルダで持つ
 * （どの国にでも使える一つのテンプレートのため）。実際に選んだ瞬間、
 * 相手国idへ差し替える。
 */
export function bindEffectsToCountry(effects: DiplomacyEffect[], countryId: string): DiplomacyEffect[] {
  return effects.map((effect) => {
    if (effect.type === "modify_relation" && effect.countryId === "") return { ...effect, countryId };
    if (effect.type === "modify_bar" && effect.countryId === "") return { ...effect, countryId };
    if (effect.type === "add_treaty" && effect.countryId === "") return { ...effect, countryId };
    return effect;
  });
}

export interface DiplomacyEffectResult {
  relations: Record<string, CountryDiplomacy>;
  trade: TradeState;
  regionalTension: Record<RegionId, number>;
  politicalPowerDelta: number;
  governmentSupportDelta: number;
  triggeredEventIds: string[];
}

/** 外交効果の適用。国家方針・経済と同じ、閉じた語彙のEffectシステム（指示書各章）。 */
export function applyDiplomacyEffects(
  effects: DiplomacyEffect[],
  relations: Record<string, CountryDiplomacy>,
  trade: TradeState,
  regionalTension: Record<RegionId, number>,
  atMinute: number,
): DiplomacyEffectResult {
  let nextRelations = relations;
  let nextTrade = trade;
  let nextTension = regionalTension;
  let politicalPowerDelta = 0;
  let governmentSupportDelta = 0;
  const triggeredEventIds: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case "modify_relation": {
        const country = nextRelations[effect.countryId];
        if (!country) break;
        const modifier: RelationModifier = { id: `${effect.label}-${atMinute}-${country.modifiers.length}`, label: effect.label, amount: effect.amount };
        nextRelations = { ...nextRelations, [effect.countryId]: { ...country, modifiers: [...country.modifiers, modifier] } };
        break;
      }
      case "modify_bar": {
        const country = nextRelations[effect.countryId];
        if (!country) break;
        const key = effect.bar === "gov" ? "barGov" : effect.bar === "econ" ? "barEcon" : "barMil";
        nextRelations = { ...nextRelations, [effect.countryId]: { ...country, [key]: clampBar(country[key] + effect.amount) } };
        break;
      }
      case "modify_regional_tension":
        nextTension = { ...nextTension, [effect.region]: clampBar(nextTension[effect.region] + effect.amount) };
        break;
      case "modify_political_power":
        politicalPowerDelta += effect.amount;
        break;
      case "modify_government_support":
        governmentSupportDelta += effect.amount;
        break;
      case "add_treaty": {
        const template = findTreaty(effect.treatyTypeId);
        const country = nextRelations[effect.countryId];
        if (!template || !country) break;
        const treaty: Treaty = {
          id: `${effect.countryId}-${effect.treatyTypeId}-${atMinute}`,
          treatyTypeId: effect.treatyTypeId,
          countryId: effect.countryId,
          signedAtMinute: atMinute,
          expiresAtMinute: template.durationDays === null ? null : atMinute + template.durationDays * MINUTES_PER_DAY,
        };
        nextRelations = { ...nextRelations, [effect.countryId]: { ...country, treaties: [...country.treaties, treaty] } };
        break;
      }
      case "modify_trade":
        nextTrade = { ...nextTrade, [effect.field]: clampNonNegative(nextTrade[effect.field] + effect.amount) };
        break;
      case "trigger_event":
        triggeredEventIds.push(effect.eventId);
        break;
    }
  }

  return { relations: nextRelations, trade: nextTrade, regionalTension: nextTension, politicalPowerDelta, governmentSupportDelta, triggeredEventIds };
}

/** 行動を決めた瞬間に、各段階を絶対時刻へ落とし込む（経済政策と同じ発想、指示書8章）。 */
export function scheduleActionEffects(action: DiplomaticActionTemplate, countryId: string, decidedAtMinute: number): ScheduledDiplomacyEffect[] {
  return action.stages.map((stage) => ({
    id: `${action.id}-${countryId}-${stage.afterDays}-${decidedAtMinute}`,
    atMinute: decidedAtMinute + stage.afterDays * MINUTES_PER_DAY,
    effects: bindEffectsToCountry(stage.effects, countryId),
  }));
}

/** いま選べる外交行動か（指示書11章）。関係値の範囲と、相手国別のクールダウン。 */
export function isActionAvailable(action: DiplomaticActionTemplate, country: CountryDiplomacy, nowMinute: number): boolean {
  const relation = computeRelation(country);
  if (action.minRelation !== undefined && relation < action.minRelation) return false;
  if (action.maxRelation !== undefined && relation > action.maxRelation) return false;
  const lastAt = country.lastActionAtMinute[action.id];
  if (lastAt !== undefined && nowMinute - lastAt < action.cooldownDays * MINUTES_PER_DAY) return false;
  return true;
}

/** いま提案できる条約か（指示書13章）。関係値がしきい値以上であること。 */
export function canProposeTreaty(minRelationToPropose: number, country: CountryDiplomacy): boolean {
  return computeRelation(country) >= minRelationToPropose;
}

const BREAK_THRESHOLD: Partial<Record<TreatyTypeId, number>> = {
  friendship: -30,
  trade_agreement: -20,
  defense_cooperation: -10,
  mutual_defense: 0,
  resource_supply: -20,
};

/** 期限切れ・破棄条件を満たした条約を取り除く（指示書13章）。 */
export function sweepTreaties(relations: Record<string, CountryDiplomacy>, nowMinute: number): Record<string, CountryDiplomacy> {
  let changed = false;
  const next: Record<string, CountryDiplomacy> = {};
  for (const [countryId, country] of Object.entries(relations)) {
    const relation = computeRelation(country);
    const kept = country.treaties.filter((treaty) => {
      if (treaty.expiresAtMinute !== null && treaty.expiresAtMinute <= nowMinute) return false;
      const threshold = BREAK_THRESHOLD[treaty.treatyTypeId];
      if (threshold !== undefined && relation < threshold) return false;
      return true;
    });
    if (kept.length !== country.treaties.length) {
      changed = true;
      next[countryId] = { ...country, treaties: kept };
    } else {
      next[countryId] = country;
    }
  }
  return changed ? next : relations;
}

export interface StanceTotals {
  politicalPowerPerDayDelta: number;
  relationDriftPerDay: number;
  treatyPartnerDriftBonus: number;
  exportCapacityPercent: number;
}

/** 複数選択・併用可能なスタンスの効果を足し合わせる（指示書20章）。 */
export function aggregateStanceEffects(stanceIds: DiplomaticStanceId[]): StanceTotals {
  const zero: StanceTotals = { politicalPowerPerDayDelta: 0, relationDriftPerDay: 0, treatyPartnerDriftBonus: 0, exportCapacityPercent: 0 };
  return stanceIds.reduce((totals, id) => {
    const stance = findStance(id);
    if (!stance) return totals;
    return {
      politicalPowerPerDayDelta: totals.politicalPowerPerDayDelta + stance.politicalPowerPerDayDelta,
      relationDriftPerDay: totals.relationDriftPerDay + stance.relationDriftPerDay,
      treatyPartnerDriftBonus: totals.treatyPartnerDriftBonus + stance.treatyPartnerDriftBonus,
      exportCapacityPercent: totals.exportCapacityPercent + stance.exportCapacityPercent,
    };
  }, zero);
}

/** スタンスによる、関係値へのごく緩やかな下地（政治への`politicalDriftPerDay`と同じ発想）。 */
export function applyStanceRelationDrift(relations: Record<string, CountryDiplomacy>, totals: StanceTotals, elapsedDays: number): Record<string, CountryDiplomacy> {
  if (totals.relationDriftPerDay === 0 && totals.treatyPartnerDriftBonus === 0) return relations;
  const next: Record<string, CountryDiplomacy> = {};
  for (const [id, country] of Object.entries(relations)) {
    const bonus = country.treaties.length > 0 ? totals.treatyPartnerDriftBonus : 0;
    const amount = (totals.relationDriftPerDay + bonus) * elapsedDays;
    next[id] = amount === 0 ? country : { ...country, baseRelation: clampRelation(country.baseRelation + amount) };
  }
  return next;
}

/** 世界情勢パネルの緊張度、ゆるやかなランダムウォーク（指示書24章）。 */
export function driftRegionalTension(tension: Record<RegionId, number>, elapsedDays: number, random: () => number): Record<RegionId, number> {
  const next = { ...tension };
  for (const region of REGION_IDS) {
    const delta = (random() - 0.5) * 0.6 * elapsedDays;
    next[region] = clampBar(next[region] + delta);
  }
  return next;
}

/** 関係が良いほど、貿易の充足率がゆるやかに上向く／悪いほど下向く（指示書15章の簡略化）。 */
export function driftTradeFulfillment(trade: TradeState, oilRelation: number, ironRelation: number, elapsedDays: number): TradeState {
  function drift(filled: number, need: number, relation: number): number {
    if (need <= 0) return filled;
    const pull = (relation / 100) * need * 0.01 * elapsedDays;
    return Math.min(need * 1.2, Math.max(0, filled + pull));
  }
  return {
    ...trade,
    oilImportFilledTrillionYen: drift(trade.oilImportFilledTrillionYen, trade.oilImportNeedTrillionYen, oilRelation),
    ironImportFilledTrillionYen: drift(trade.ironImportFilledTrillionYen, trade.ironImportNeedTrillionYen, ironRelation),
  };
}

/** 輸入の不足分が、経済へじわりと効く下地（指示書15章：不足は物価上昇・成長率低下）。 */
export function economyDriftFromTrade(trade: TradeState): { inflationRate: number; gdpGrowthRate: number } {
  const oilShortfall = Math.max(0, trade.oilImportNeedTrillionYen - trade.oilImportFilledTrillionYen);
  const ironShortfall = Math.max(0, trade.ironImportNeedTrillionYen - trade.ironImportFilledTrillionYen);
  const shortfall = oilShortfall + ironShortfall;
  return { inflationRate: shortfall * 0.01, gdpGrowthRate: -shortfall * 0.01 };
}

const PERSONALITY_ACTIVITY_PER_DAY: Record<AiPersonality, number> = {
  cooperative: 0.02,
  pragmatic: 0.015,
  assertive: 0.02,
  isolationist: 0.005,
};

export interface AiActionRoll {
  countryId: string;
  effects: DiplomacyEffect[];
  logText: string;
}

/**
 * 他国の簡易AI（指示書26章）。外交行動だけを、性格ごとの確率で発火させる
 * ——経済・政治・軍事まで含む本格AIは今回作らない。性格は
 * `CountryDiplomacy.personality`に持たせてあるので、後でここを差し替えれば
 * 行動の中身だけ変えられる。
 */
export function rollAiActions(relations: Record<string, CountryDiplomacy>, elapsedDays: number, random: () => number): AiActionRoll[] {
  const rolls: AiActionRoll[] = [];
  for (const [countryId, country] of Object.entries(relations)) {
    const chance = PERSONALITY_ACTIVITY_PER_DAY[country.personality] * elapsedDays;
    if (random() >= chance) continue;
    const relation = computeRelation(country);
    if (country.personality === "cooperative" || relation >= 30) {
      rolls.push({
        countryId,
        effects: [{ type: "modify_relation", countryId, amount: 2, label: "相手国からの友好的な接触" }],
        logText: "相手国から友好的な接触があった。",
      });
    } else if (country.personality === "assertive" && relation < 10) {
      rolls.push({
        countryId,
        effects: [{ type: "modify_relation", countryId, amount: -2, label: "相手国からの牽制" }],
        logText: "相手国からの牽制的な動きが報告された。",
      });
    }
  }
  return rolls;
}

/** 定期的な国際ニュース（指示書25章）。たいていは何も起きない。 */
export function rollDiplomaticNews(elapsedDays: number, random: () => number): string | null {
  if (random() >= 0.05 * elapsedDays) return null;
  return DIPLOMATIC_NEWS[Math.floor(random() * DIPLOMATIC_NEWS.length)].id;
}

/** 短い応答選択肢を持つ、簡易的な国際危機（指示書18章）。予兆ではなく発生そのもの——今回はここまで単純化。 */
export function rollDiplomaticCrisis(elapsedDays: number, random: () => number): string | null {
  if (random() >= 0.01 * elapsedDays) return null;
  return DIPLOMATIC_CRISES[Math.floor(random() * DIPLOMATIC_CRISES.length)].id;
}
