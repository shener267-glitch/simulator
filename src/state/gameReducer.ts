import type { BudgetCategory } from "../types/economy";
import type { CategoryId, FocusNotice, GameState, PoliticsState } from "../types/game";
import type { ResearchProgress } from "../types/research";
import type { Speed } from "../types/gameTime";
import type { DiplomaticLogEntry, DiplomaticNotice, DiplomaticStanceId, DiplomacyEffect, DiplomacyState, PendingSummit, TreatyTypeId } from "../types/diplomacy";
import type {
  AllianceCooperationId,
  ConscriptionPolicyId,
  FleetMission,
  AirWingMission,
  FrontStatus,
  MilitaryEffect,
  MilitaryLogEntry,
  MilitaryNotice,
  MilitaryRegionId,
  MilitaryState,
  MobilizationState,
  Operation,
  OperationPriority,
  ReadinessLevel,
  UnitOrder,
} from "../types/military";
import { advanceOneMinute, minutesPerTick } from "../engine/gameTime";
import { applyFocusEffects, isFocusAvailable, isFocusDone, minutesToDays } from "../engine/focus";
import { advanceEconomy, applyEconomyEffects, politicalDriftPerDay, schedulePolicyEffects } from "../engine/economy";
import { advanceResearch, applyTechEffects, isTechAvailable, isTechDone } from "../engine/research";
import {
  MINUTES_PER_DAY as DIPLOMACY_MINUTES_PER_DAY,
  aggregateStanceEffects,
  applyDiplomacyEffects,
  applyStanceRelationDrift,
  bindEffectsToCountry,
  canProposeTreaty,
  computeRelation,
  driftRegionalTension,
  driftTradeFulfillment,
  economyDriftFromTrade,
  isActionAvailable,
  rollAiActions,
  rollDiplomaticCrisis,
  rollDiplomaticNews,
  scheduleActionEffects,
  sweepTreaties,
} from "../engine/diplomacy";
import {
  MILITARY_REGION_IDS,
  MINUTES_PER_DAY as MILITARY_MINUTES_PER_DAY,
  MOBILIZATION_DAILY_DRAG,
  MOBILIZATION_ORDER,
  MOBILIZATION_POLITICAL_POWER_COST,
  READINESS_DAILY_DRAG,
  READINESS_ORDER,
  READINESS_POLITICAL_POWER_COST,
  advanceProduction,
  applyMilitaryEffects,
  bindMilitaryEffectsToCountry,
  driftFrontStatus,
  driftIntel,
  markFrontProvincesContested,
  provinceTravelDays,
  resolveLandCombat,
  rollArmedAttack,
  rollMilitaryEvent,
} from "../engine/military";
import { findFocus } from "../data/focuses";
import { findEconomyPolicy } from "../data/economyPolicies";
import { findTech } from "../data/technologies";
import { SUMMIT_PREP_DAYS, findDiplomaticAction, findDiplomaticCrisis, findTreaty } from "../data/diplomacy";
import { FOREIGN_MILITARY_BASELINE, REGION_ADJACENCY, findAllianceCooperation, findMilitaryEvent, findProvince } from "../data/military";
import { createPoliticsState } from "./politics";
import { createEconomyState } from "./economy";
import { createResearchState } from "./research";
import { createDiplomacyState } from "./diplomacy";
import { createMilitaryState } from "./military";

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
  | { type: "START_RESEARCH"; techId: string }
  /** 外交行動を決める（Phase 4指示書10〜12章）。`propose_summit`だけ特別扱い。 */
  | { type: "DECIDE_DIPLOMATIC_ACTION"; countryId: string; actionId: string }
  /** 条約を結ぶ（指示書13章）。簡易チェックボックス交渉——選んだ追加条項のidを渡す。 */
  | { type: "DECIDE_TREATY"; countryId: string; treatyTypeId: TreatyTypeId; clauseIds: string[] }
  /** 外交スタンスの選択を切り替える（指示書20章、複数選択・併用可能）。 */
  | { type: "TOGGLE_STANCE"; stanceId: DiplomaticStanceId }
  /** 首脳会談の招請に応じる（指示書9章：承諾／延期／辞退）。 */
  | { type: "RESPOND_SUMMIT_INVITE"; response: "accept" | "reschedule" | "decline" }
  /** 簡易的な国際危機に、短い選択肢で対応する（指示書18章）。 */
  | { type: "RESPOND_DIPLOMATIC_CRISIS"; optionId: string }
  /** 国際ニュースなど、確認するだけの外交通知を読み終える。 */
  | { type: "ACK_DIPLOMATIC_NOTICE" }
  /** 簡易的な陣営を立ち上げる（指示書14章）。 */
  | { type: "PROPOSE_FACTION"; name: string }
  /** 一定以上の関係を持つ国を、陣営へ招く。 */
  | { type: "INVITE_TO_FACTION"; factionId: string; countryId: string }
  /** 世界地図の関係線オーバーレイの表示を切り替える（指示書24章、任意）。 */
  | { type: "TOGGLE_MAP_OVERLAY" }
  /** 防衛態勢を変える（Phase 5指示書11章）。引き上げには政治力が要る。 */
  | { type: "SET_READINESS"; level: ReadinessLevel }
  /** 動員状態を変える（指示書12章）。 */
  | { type: "SET_MOBILIZATION"; state: MobilizationState }
  /** 徴募制度を変える（指示書13章）。政治システムと接続する。 */
  | { type: "SET_CONSCRIPTION_POLICY"; policy: ConscriptionPolicyId }
  /**
   * 選んだ師団（複数可）を、隣接プロヴィンスへ直接移動させる（HOI4型改訂・
   * 指示書1・3章）。移動には時間がかかる。係争プロヴィンスへの移動命令は
   * 到着時に自動的に戦闘として解決される（攻撃命令を兼ねる）。
   */
  | { type: "MOVE_UNITS"; unitIds: string[]; destinationProvinceId: string }
  /** 部隊に防御命令を出す（指示書4章）。地形ボーナスに加えて小さな防御加算を受ける。 */
  | { type: "SET_UNIT_ORDER"; unitId: string; order: UnitOrder | null }
  /** 艦隊を海域プロヴィンスへ直接移動させる（HOI4型改訂・指示書6章）。 */
  | { type: "MOVE_FLEET"; fleetId: string; destinationProvinceId: string }
  /** 艦隊の任務を変える（指示書8章）。 */
  | { type: "SET_FLEET_MISSION"; fleetId: string; mission: FleetMission }
  /** 航空団の任務を変える（指示書9章）。 */
  | { type: "SET_AIRWING_MISSION"; airWingId: string; mission: AirWingMission }
  /** 航空団の作戦地域を指定する（HOI4型改訂・指示書7章）。航続圏内のみ指定できる。 */
  | { type: "SET_AIRWING_TARGET"; airWingId: string; targetRegionId: MilitaryRegionId }
  /** 作戦を立ち上げる（指示書25・26章）。前線をAIに任せる場合の枠組み——個別の師団の手動操作とは独立して併用できる。 */
  | { type: "START_OPERATION"; name: string; objective: string; regionId: MilitaryRegionId; priority: OperationPriority; unitIds: string[]; fleetIds: string[]; airWingIds: string[] }
  /** 作戦を終了する。 */
  | { type: "END_OPERATION"; operationId: string }
  /** 同盟国との軍事協力（指示書27章）。 */
  | { type: "MILITARY_COOPERATION_ACTION"; countryId: string; cooperationId: AllianceCooperationId }
  /** 平時の軍事イベントに対応する（指示書31・32章）。選択肢を持つものだけ。 */
  | { type: "RESPOND_MILITARY_EVENT"; optionId: string }
  /** 確認するだけの軍事通知を読み終える。 */
  | { type: "ACK_MILITARY_NOTICE" }
  /** 武力攻撃への対応を決める（指示書23章）。戦争そのものは通知が立った時点で始まっている。 */
  | { type: "RESPOND_ARMED_ATTACK"; response: "defend" | "request_ally_support" | "issue_statement" | "diplomatic_talks" }
  /** 生産ラインの工場数を変える（指示書16章：何をどれだけ生産するかを決める）。 */
  | { type: "ADJUST_PRODUCTION_FACTORIES"; itemId: "fighter" | "destroyer" | "tank" | "missile"; delta: number };

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
  const newDiploNotices: DiplomaticNotice[] = [];
  const diploEventLog: DiplomaticLogEntry[] = [];

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

  // --- 外交（Phase 4指示書0〜29章） ---
  const diplomacy = state.diplomacy;
  const newDiplomacyElapsedMinutes = diplomacy.elapsedMinutes + elapsedMinutes;
  const dueDiplomacy = diplomacy.scheduledEffects.filter((effect) => effect.atMinute <= newDiplomacyElapsedMinutes);
  const stillPendingDiplomacy = diplomacy.scheduledEffects.filter((effect) => effect.atMinute > newDiplomacyElapsedMinutes);
  let diploRelations = diplomacy.relations;
  let diploTrade = diplomacy.trade;
  let diploTension = diplomacy.regionalTension;
  let politicalPowerFromDiplomacy = 0;
  let governmentSupportFromDiplomacy = 0;

  // 決めた行動・条約の、予定されていた段階を適用する（経済政策と同じ発想）。
  for (const scheduled of dueDiplomacy) {
    const result = applyDiplomacyEffects(scheduled.effects, diploRelations, diploTrade, diploTension, newDiplomacyElapsedMinutes);
    diploRelations = result.relations;
    diploTrade = result.trade;
    diploTension = result.regionalTension;
    politicalPowerFromDiplomacy += result.politicalPowerDelta;
    governmentSupportFromDiplomacy += result.governmentSupportDelta;
    for (const eventId of result.triggeredEventIds) newDiploNotices.push({ kind: "diplomatic_event", eventId });
  }

  // 条約の期限切れ・破棄条件のスイープ。
  diploRelations = sweepTreaties(diploRelations, newDiplomacyElapsedMinutes);

  // スタンスによる、関係値・政治力へのごく緩やかな下地。
  const stanceTotals = aggregateStanceEffects(diplomacy.stances);
  diploRelations = applyStanceRelationDrift(diploRelations, stanceTotals, elapsedDays);
  politicalPowerFromDiplomacy += stanceTotals.politicalPowerPerDayDelta * elapsedDays;

  // 世界情勢パネルの緊張度、ゆるやかなランダムウォーク。
  diploTension = driftRegionalTension(diploTension, elapsedDays, Math.random);

  // 貿易充足のドリフト（ロシアとの関係を原油、全体平均を鉄鉱石の代理指標にする簡略化、指示書15章）。
  const rusRelation = diploRelations.RUS ? computeRelation(diploRelations.RUS) : 0;
  const relationValues = Object.values(diploRelations).map((country) => computeRelation(country));
  const avgRelation = relationValues.length > 0 ? relationValues.reduce((sum, value) => sum + value, 0) / relationValues.length : 0;
  diploTrade = driftTradeFulfillment(diploTrade, rusRelation, avgRelation, elapsedDays);

  // 他国の簡易AI——外交行動だけを、性格ごとの確率で発火させる。
  for (const roll of rollAiActions(diploRelations, elapsedDays, Math.random)) {
    const result = applyDiplomacyEffects(roll.effects, diploRelations, diploTrade, diploTension, newDiplomacyElapsedMinutes);
    diploRelations = result.relations;
    diploEventLog.push({ id: `ai-${roll.countryId}-${newDiplomacyElapsedMinutes}`, atMinute: newDiplomacyElapsedMinutes, text: roll.logText });
  }

  // 定期的な国際ニュース。たいていは何も起きない。
  const newsId = rollDiplomaticNews(elapsedDays, Math.random);
  if (newsId) {
    newDiploNotices.push({ kind: "diplomatic_event", eventId: newsId });
    shouldPause = true;
  }

  // 短い応答選択肢を持つ、簡易的な国際危機。
  const crisisId = rollDiplomaticCrisis(elapsedDays, Math.random);
  if (crisisId) {
    newDiploNotices.push({ kind: "international_crisis", crisisId });
    shouldPause = true;
  }

  // 首脳会談の準備が整ったら、承諾／延期／辞退の通知を立てる。
  for (const summit of diplomacy.pendingSummits) {
    if (summit.readyAtMinute > newDiplomacyElapsedMinutes) continue;
    const alreadyNotified =
      diplomacy.pendingNotices.some((notice) => notice.kind === "summit_invite" && notice.countryId === summit.countryId) ||
      newDiploNotices.some((notice) => notice.kind === "summit_invite" && notice.countryId === summit.countryId);
    if (!alreadyNotified) {
      newDiploNotices.push({ kind: "summit_invite", countryId: summit.countryId });
      shouldPause = true;
    }
  }

  politics = {
    ...politics,
    stats: {
      ...politics.stats,
      politicalPower: Math.max(0, politics.stats.politicalPower + politicalPowerFromDiplomacy),
      governmentSupport: clampPercent(politics.stats.governmentSupport + governmentSupportFromDiplomacy),
    },
  };

  // 外交→経済: 輸入の不足分が、物価と成長率へじわりと効く（指示書15章）。
  const tradeDrift = economyDriftFromTrade(diploTrade);
  economy = {
    ...economy,
    stats: {
      ...economy.stats,
      inflationRate: Math.max(0, economy.stats.inflationRate + tradeDrift.inflationRate * elapsedDays),
      gdpGrowthRate: economy.stats.gdpGrowthRate + tradeDrift.gdpGrowthRate * elapsedDays,
    },
  };

  // --- 軍事（Phase 5指示書0〜39章） ---
  const military = state.military;
  const newMilitaryElapsedMinutes = military.elapsedMinutes + elapsedMinutes;
  const dueMilitary = military.scheduledEffects.filter((effect) => effect.atMinute <= newMilitaryElapsedMinutes);
  const stillPendingMilitary = military.scheduledEffects.filter((effect) => effect.atMinute > newMilitaryElapsedMinutes);
  let militaryForces = military.forces;
  let militaryPersonnel = military.personnel;
  let politicalPowerFromMilitary = 0;
  let governmentSupportFromMilitary = 0;
  const newMilitaryNotices: MilitaryNotice[] = [];
  const militaryEventLog: MilitaryLogEntry[] = [];

  // 予定されていた段階の適用（武力攻撃への「防衛作戦」対応など、経済政策と同じ発想）。
  for (const scheduled of dueMilitary) {
    const result = applyMilitaryEffects(scheduled.effects, militaryForces, militaryPersonnel);
    militaryForces = result.forces;
    militaryPersonnel = result.personnel;
    politicalPowerFromMilitary += result.politicalPowerDelta;
    governmentSupportFromMilitary += result.governmentSupportDelta;
  }

  // 部隊の移動——到着予定時刻に達したら、駐屯地扱いに戻す。係争プロヴィンス
  // （HOI4型改訂・指示書3・4章）へ到着した場合は、そのまま簡略化した陸上戦闘
  // を解決する。
  let militaryProvinces = military.provinces;
  const militaryUnits = military.units.map((unit) => {
    if (unit.status !== "moving" || unit.arrivalAtMinute === undefined || unit.arrivalAtMinute > newMilitaryElapsedMinutes) {
      // 防御命令中の部隊は、持ち場を固めることでわずかに士気が回復する。
      if (unit.order === "defend" && unit.status === "garrison") {
        return { ...unit, moralePercent: Math.min(100, unit.moralePercent + 0.3 * elapsedDays) };
      }
      return unit;
    }
    const destinationId = unit.destinationProvinceId!;
    const destination = findProvince(militaryProvinces, destinationId);
    const origin = unit.originProvinceId ?? unit.provinceId;

    if (destination?.contested) {
      const enemyLandEstimate = military.war ? (military.intel[military.war.enemyCountryId]?.landEstimate ?? 30) : 30;
      const result = resolveLandCombat(unit, destination, enemyLandEstimate, Math.random);
      if (result.provinceSecured) {
        militaryProvinces = militaryProvinces.map((province) => (province.id === destinationId ? { ...province, contested: false } : province));
      }
      const outcomeLabel = result.outcome === "victory" ? "勝利" : result.outcome === "defeat" ? "敗北" : "膠着";
      militaryEventLog.push({
        id: `combat-${unit.id}-${newMilitaryElapsedMinutes}`,
        atMinute: newMilitaryElapsedMinutes,
        text: `${unit.name}が${destination.name}で交戦——${outcomeLabel}。`,
        confidence: "high",
      });
      const settledProvinceId = result.outcome === "defeat" ? origin : destinationId;
      const settledRegionId = findProvince(militaryProvinces, settledProvinceId)?.regionId ?? unit.regionId;
      return { ...result.unit, status: "garrison" as const, provinceId: settledProvinceId, regionId: settledRegionId, destinationProvinceId: undefined, originProvinceId: undefined, arrivalAtMinute: undefined };
    }

    militaryEventLog.push({
      id: `arrive-${unit.id}-${newMilitaryElapsedMinutes}`,
      atMinute: newMilitaryElapsedMinutes,
      text: `${unit.name}が${destination?.name ?? destinationId}に到着した。`,
    });
    return { ...unit, status: "garrison" as const, provinceId: destinationId, regionId: destination?.regionId ?? unit.regionId, destinationProvinceId: undefined, originProvinceId: undefined, arrivalAtMinute: undefined };
  });

  // 艦隊の移動——到着予定時刻に達したら、その海域へ配置する（HOI4型改訂・指示書6章）。
  const militaryFleets = military.fleets.map((fleet) => {
    if (fleet.status !== "moving" || fleet.arrivalAtMinute === undefined || fleet.arrivalAtMinute > newMilitaryElapsedMinutes) return fleet;
    const destinationId = fleet.destinationProvinceId!;
    const destination = findProvince(militaryProvinces, destinationId);
    militaryEventLog.push({
      id: `fleet-arrive-${fleet.id}-${newMilitaryElapsedMinutes}`,
      atMinute: newMilitaryElapsedMinutes,
      text: `${fleet.name}が${destination?.name ?? destinationId}に到着した。`,
    });
    return { ...fleet, status: "garrison" as const, provinceId: destinationId, regionId: destination?.regionId ?? fleet.regionId, destinationProvinceId: undefined, arrivalAtMinute: undefined };
  });

  // 生産ライン——工場×効率×予算比率で累積し、1単位ぶん貯まるたびに能力指数へ少しずつ還元する（指示書16章）。
  const militaryProductionLines = military.productionLines.map((line) => {
    const advanced = advanceProduction(line, elapsedDays, economy.budget.defense, research.speedBonusPercent);
    for (const gain of advanced.capabilityGains) {
      militaryForces = { ...militaryForces, [gain.category]: { ...militaryForces[gain.category], capability: Math.min(100, militaryForces[gain.category].capability + gain.amount) } };
    }
    return advanced.line;
  });

  // 各国の軍事情報のドリフト（指示書20・21章）。確度は必ず不確実。
  const militaryIntel: MilitaryState["intel"] = {};
  for (const [countryId, snapshot] of Object.entries(military.intel)) {
    const baseline = FOREIGN_MILITARY_BASELINE[countryId] ?? { land: 0, sea: 0, air: 0 };
    militaryIntel[countryId] = driftIntel(snapshot, baseline, elapsedDays, Math.random);
  }

  // 防衛態勢・動員による、経済・関係値へのごく緩やかな負担（指示書11・12章）。
  const readinessDrag = READINESS_DAILY_DRAG[military.readiness];
  const mobilizationDrag = MOBILIZATION_DAILY_DRAG[military.mobilization];
  economy = {
    ...economy,
    stats: { ...economy.stats, gdpGrowthRate: economy.stats.gdpGrowthRate + (readinessDrag.gdpGrowthDelta + mobilizationDrag.gdpGrowthDelta) * elapsedDays },
  };
  militaryPersonnel = { ...militaryPersonnel, fillRatePercent: Math.min(100, militaryPersonnel.fillRatePercent + mobilizationDrag.fillRateDrift * elapsedDays) };
  if (readinessDrag.relationDriftAll !== 0) {
    diploRelations = applyStanceRelationDrift(diploRelations, { politicalPowerPerDayDelta: 0, relationDriftPerDay: readinessDrag.relationDriftAll, treatyPartnerDriftBonus: 0, exportCapacityPercent: 0 }, elapsedDays);
  }

  // 平時にも起き続ける軍事イベント（指示書31・32章）。たいていは軽い出来事。
  const militaryEventId = rollMilitaryEvent(elapsedDays, Math.random);
  if (militaryEventId) {
    const template = findMilitaryEvent(militaryEventId);
    newMilitaryNotices.push({ kind: "military_event", eventId: militaryEventId });
    militaryEventLog.push({ id: `event-${militaryEventId}-${newMilitaryElapsedMinutes}`, atMinute: newMilitaryElapsedMinutes, text: template?.title ?? militaryEventId, confidence: "medium" });
    shouldPause = true;
  }

  // 武力攻撃の発生判定（指示書23章）。すでに戦争状態なら発生させない。
  let militaryWar = military.war;
  if (!militaryWar) {
    const relationByCountry: Record<string, number> = {};
    for (const [countryId, country] of Object.entries(diploRelations)) relationByCountry[countryId] = computeRelation(country);
    const attackerId = rollArmedAttack(relationByCountry, elapsedDays, Math.random);
    if (attackerId) {
      const frontRegion: MilitaryRegionId = attackerId === "RUS" ? "sea_of_japan" : attackerId === "CHN" ? "east_china_sea" : "pacific_ocean";
      const frontStatus = Object.fromEntries(MILITARY_REGION_IDS.map((id) => [id, "calm"])) as Record<MilitaryRegionId, FrontStatus>;
      frontStatus[frontRegion] = "active";
      for (const neighbor of REGION_ADJACENCY[frontRegion]) frontStatus[neighbor] = "tense";
      militaryWar = { enemyCountryId: attackerId, startedAtMinute: newMilitaryElapsedMinutes, frontStatus };
      militaryProvinces = markFrontProvincesContested(militaryProvinces, frontRegion);
      newMilitaryNotices.push({ kind: "armed_attack", enemyCountryId: attackerId });
      militaryEventLog.push({ id: `armed-attack-${newMilitaryElapsedMinutes}`, atMinute: newMilitaryElapsedMinutes, text: `${attackerId}による武力攻撃を確認した。`, confidence: "high" });
      shouldPause = true;
    }
  } else {
    // 前線の状況ドリフト（指示書24・26章）。詳細な戦闘計算はしない——作戦を割り当てた方面ほど持ちこたえやすい。
    const regionSupportScore: Partial<Record<MilitaryRegionId, number>> = {};
    for (const operation of military.operations) {
      regionSupportScore[operation.regionId] = (regionSupportScore[operation.regionId] ?? 0) + (operation.priority === "defense" ? 6 : 3);
    }
    militaryWar = driftFrontStatus(militaryWar, regionSupportScore, Math.random);
  }

  politics = {
    ...politics,
    stats: {
      ...politics.stats,
      politicalPower: Math.max(0, politics.stats.politicalPower + politicalPowerFromMilitary),
      governmentSupport: clampPercent(politics.stats.governmentSupport + governmentSupportFromMilitary),
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
      // 国家方針↔外交の接続（Phase 4指示書16章）。日米関係強化・アジア外交が、既存の効果に加えて関係値も動かす。
      if (result.relationDeltas.length > 0) {
        const relationEffects: DiplomacyEffect[] = result.relationDeltas.map((delta) => ({
          type: "modify_relation",
          countryId: delta.countryId,
          amount: delta.amount,
          label: template.name,
        }));
        const relationResult = applyDiplomacyEffects(relationEffects, diploRelations, diploTrade, diploTension, newDiplomacyElapsedMinutes);
        diploRelations = relationResult.relations;
        diploTrade = relationResult.trade;
        diploTension = relationResult.regionalTension;
      }
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
        // 研究↔軍事の接続（Phase 5指示書19・30章）。軍事研究の完了が、対応する能力指数を押し上げる。
        for (const delta of result.militaryCapabilityDeltas) {
          militaryForces = { ...militaryForces, [delta.category]: { ...militaryForces[delta.category], capability: Math.min(100, Math.max(0, militaryForces[delta.category].capability + delta.amount)) } };
        }
        shouldPause = true;
      } else {
        stillActive.push(progress);
      }
    }

    politics = { ...politics, stats: politicalStats };
    research = { ...research, active: stillActive, completedTechIds, unlockedTechIds, modifiers, speedBonusPercent };
  }

  politics = { ...politics, pendingNotices: [...politics.pendingNotices, ...newNotices] };

  const nextDiplomacy: DiplomacyState = {
    ...diplomacy,
    relations: diploRelations,
    trade: diploTrade,
    regionalTension: diploTension,
    scheduledEffects: stillPendingDiplomacy,
    elapsedMinutes: newDiplomacyElapsedMinutes,
    eventLog: [...diplomacy.eventLog, ...diploEventLog],
    pendingNotices: [...diplomacy.pendingNotices, ...newDiploNotices],
  };

  const nextMilitary: MilitaryState = {
    ...military,
    forces: militaryForces,
    personnel: militaryPersonnel,
    provinces: militaryProvinces,
    units: militaryUnits,
    fleets: militaryFleets,
    productionLines: militaryProductionLines,
    intel: militaryIntel,
    war: militaryWar,
    scheduledEffects: stillPendingMilitary,
    elapsedMinutes: newMilitaryElapsedMinutes,
    eventLog: [...military.eventLog, ...militaryEventLog],
    pendingNotices: [...military.pendingNotices, ...newMilitaryNotices],
  };

  return {
    ...state,
    gameTime: shouldPause ? { ...time, speed: 0 } : time,
    politics,
    economy,
    research,
    diplomacy: nextDiplomacy,
    military: nextMilitary,
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
            diplomacy: createDiplomacyState(state.selectedCountryId, state.countries),
            military: createMilitaryState(state.selectedCountryId, state.countries),
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

    case "DECIDE_DIPLOMATIC_ACTION": {
      if (state.phase !== "playing") return state;
      const diplomacy = state.diplomacy;
      const country = diplomacy.relations[action.countryId];
      const template = findDiplomaticAction(action.actionId);
      if (!country || !template) return state;
      if (!isActionAvailable(template, country, diplomacy.elapsedMinutes)) return state;
      if (state.politics.stats.politicalPower < template.politicalPowerCost) return state;

      const politics = {
        ...state.politics,
        stats: { ...state.politics.stats, politicalPower: state.politics.stats.politicalPower - template.politicalPowerCost },
      };
      const touchedCountry = {
        ...country,
        lastActionAtMinute: { ...country.lastActionAtMinute, [template.id]: diplomacy.elapsedMinutes },
      };

      // 首脳会談の提案だけは特別扱い——即座に効果を出さず、準備期間を挟む（指示書9章）。
      if (template.id === "propose_summit") {
        if (diplomacy.pendingSummits.some((summit) => summit.countryId === action.countryId)) return state;
        const summit: PendingSummit = {
          id: `${action.countryId}-${diplomacy.elapsedMinutes}`,
          countryId: action.countryId,
          readyAtMinute: diplomacy.elapsedMinutes + SUMMIT_PREP_DAYS * DIPLOMACY_MINUTES_PER_DAY,
        };
        return {
          ...state,
          politics,
          diplomacy: {
            ...diplomacy,
            pendingSummits: [...diplomacy.pendingSummits, summit],
            relations: { ...diplomacy.relations, [action.countryId]: touchedCountry },
          },
        };
      }

      const scheduledEffects = [...diplomacy.scheduledEffects, ...scheduleActionEffects(template, action.countryId, diplomacy.elapsedMinutes)];
      return {
        ...state,
        politics,
        diplomacy: {
          ...diplomacy,
          scheduledEffects,
          relations: { ...diplomacy.relations, [action.countryId]: touchedCountry },
        },
      };
    }

    case "DECIDE_TREATY": {
      if (state.phase !== "playing") return state;
      const diplomacy = state.diplomacy;
      const country = diplomacy.relations[action.countryId];
      const template = findTreaty(action.treatyTypeId);
      if (!country || !template) return state;
      if (country.treaties.some((treaty) => treaty.treatyTypeId === template.id)) return state; // 同種の条約は重複させない
      if (!canProposeTreaty(template.minRelationToPropose, country)) return state;

      const clauses = template.optionalClauses.filter((clause) => action.clauseIds.includes(clause.id));
      const totalCost = template.politicalPowerCost + clauses.reduce((sum, clause) => sum + clause.politicalPowerCost, 0);
      if (state.politics.stats.politicalPower < totalCost) return state;

      const effects: DiplomacyEffect[] = [
        ...bindEffectsToCountry(template.effects, action.countryId),
        { type: "add_treaty", countryId: action.countryId, treatyTypeId: template.id },
        ...clauses.flatMap((clause) => bindEffectsToCountry(clause.effects, action.countryId)),
      ];
      const result = applyDiplomacyEffects(effects, diplomacy.relations, diplomacy.trade, diplomacy.regionalTension, diplomacy.elapsedMinutes);

      return {
        ...state,
        politics: {
          ...state.politics,
          stats: {
            ...state.politics.stats,
            politicalPower: state.politics.stats.politicalPower - totalCost,
            governmentSupport: clampPercent(state.politics.stats.governmentSupport + result.governmentSupportDelta),
          },
        },
        diplomacy: { ...diplomacy, relations: result.relations, trade: result.trade, regionalTension: result.regionalTension },
      };
    }

    case "TOGGLE_STANCE": {
      if (state.phase !== "playing") return state;
      const stances = state.diplomacy.stances.includes(action.stanceId)
        ? state.diplomacy.stances.filter((id) => id !== action.stanceId)
        : [...state.diplomacy.stances, action.stanceId];
      return { ...state, diplomacy: { ...state.diplomacy, stances } };
    }

    case "RESPOND_SUMMIT_INVITE": {
      const diplomacy = state.diplomacy;
      const notice = diplomacy.pendingNotices[0];
      if (!notice || notice.kind !== "summit_invite") return state;
      const summit = diplomacy.pendingSummits.find((s) => s.countryId === notice.countryId);
      if (!summit) return { ...state, diplomacy: { ...diplomacy, pendingNotices: diplomacy.pendingNotices.slice(1) } };

      if (action.response === "reschedule") {
        const rescheduled = { ...summit, readyAtMinute: diplomacy.elapsedMinutes + SUMMIT_PREP_DAYS * DIPLOMACY_MINUTES_PER_DAY };
        return {
          ...state,
          diplomacy: {
            ...diplomacy,
            pendingNotices: diplomacy.pendingNotices.slice(1),
            pendingSummits: diplomacy.pendingSummits.map((s) => (s.id === summit.id ? rescheduled : s)),
          },
        };
      }

      const remainingSummits = diplomacy.pendingSummits.filter((s) => s.id !== summit.id);
      const country = diplomacy.relations[notice.countryId];
      if (!country) {
        return { ...state, diplomacy: { ...diplomacy, pendingNotices: diplomacy.pendingNotices.slice(1), pendingSummits: remainingSummits } };
      }

      const effects: DiplomacyEffect[] =
        action.response === "accept"
          ? [
              { type: "modify_relation", countryId: notice.countryId, amount: 12, label: "首脳会談の成果" },
              { type: "modify_bar", countryId: notice.countryId, bar: "gov", amount: 15 },
              { type: "modify_bar", countryId: notice.countryId, bar: "econ", amount: 5 },
              { type: "modify_government_support", amount: 3 },
            ]
          : [
              { type: "modify_relation", countryId: notice.countryId, amount: -5, label: "首脳会談の見送り" },
              { type: "modify_government_support", amount: -1 },
            ];

      const result = applyDiplomacyEffects(effects, diplomacy.relations, diplomacy.trade, diplomacy.regionalTension, diplomacy.elapsedMinutes);
      return {
        ...state,
        politics: {
          ...state.politics,
          stats: { ...state.politics.stats, governmentSupport: clampPercent(state.politics.stats.governmentSupport + result.governmentSupportDelta) },
        },
        diplomacy: {
          ...diplomacy,
          relations: result.relations,
          trade: result.trade,
          regionalTension: result.regionalTension,
          pendingNotices: diplomacy.pendingNotices.slice(1),
          pendingSummits: remainingSummits,
          eventLog: [
            ...diplomacy.eventLog,
            {
              id: `summit-${notice.countryId}-${diplomacy.elapsedMinutes}`,
              atMinute: diplomacy.elapsedMinutes,
              text: action.response === "accept" ? "首脳会談を実施した。" : "首脳会談を見送った。",
            },
          ],
        },
      };
    }

    case "RESPOND_DIPLOMATIC_CRISIS": {
      const diplomacy = state.diplomacy;
      const notice = diplomacy.pendingNotices[0];
      if (!notice || notice.kind !== "international_crisis") return state;
      const crisis = findDiplomaticCrisis(notice.crisisId);
      const option = crisis?.options.find((o) => o.id === action.optionId);
      if (!crisis || !option) return { ...state, diplomacy: { ...diplomacy, pendingNotices: diplomacy.pendingNotices.slice(1) } };

      const result = applyDiplomacyEffects(option.effects, diplomacy.relations, diplomacy.trade, diplomacy.regionalTension, diplomacy.elapsedMinutes);
      return {
        ...state,
        politics: {
          ...state.politics,
          stats: { ...state.politics.stats, governmentSupport: clampPercent(state.politics.stats.governmentSupport + result.governmentSupportDelta) },
        },
        diplomacy: {
          ...diplomacy,
          relations: result.relations,
          trade: result.trade,
          regionalTension: result.regionalTension,
          pendingNotices: diplomacy.pendingNotices.slice(1),
          eventLog: [...diplomacy.eventLog, { id: `crisis-${crisis.id}-${diplomacy.elapsedMinutes}`, atMinute: diplomacy.elapsedMinutes, text: `${crisis.title}: ${option.label}` }],
        },
      };
    }

    case "ACK_DIPLOMATIC_NOTICE": {
      if (state.diplomacy.pendingNotices.length === 0) return state;
      return { ...state, diplomacy: { ...state.diplomacy, pendingNotices: state.diplomacy.pendingNotices.slice(1) } };
    }

    case "PROPOSE_FACTION": {
      if (state.phase !== "playing" || !state.playerCountryId) return state;
      const diplomacy = state.diplomacy;
      const faction = {
        id: `faction-${diplomacy.factions.length}-${diplomacy.elapsedMinutes}`,
        name: action.name,
        leaderCountryId: state.playerCountryId,
        memberCountryIds: [state.playerCountryId],
      };
      return { ...state, diplomacy: { ...diplomacy, factions: [...diplomacy.factions, faction] } };
    }

    case "INVITE_TO_FACTION": {
      if (state.phase !== "playing") return state;
      const diplomacy = state.diplomacy;
      const faction = diplomacy.factions.find((f) => f.id === action.factionId);
      const country = diplomacy.relations[action.countryId];
      if (!faction || !country || faction.memberCountryIds.includes(action.countryId)) return state;
      if (computeRelation(country) < 30) return state; // 一定以上の関係が要る、簡易な参加条件
      const factions = diplomacy.factions.map((f) => (f.id === faction.id ? { ...f, memberCountryIds: [...f.memberCountryIds, action.countryId] } : f));
      return { ...state, diplomacy: { ...diplomacy, factions } };
    }

    case "TOGGLE_MAP_OVERLAY":
      return { ...state, diplomacy: { ...state.diplomacy, mapOverlayEnabled: !state.diplomacy.mapOverlayEnabled } };

    case "SET_READINESS": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      if (action.level === military.readiness) return state;
      const escalating = READINESS_ORDER.indexOf(action.level) > READINESS_ORDER.indexOf(military.readiness);
      const cost = escalating ? READINESS_POLITICAL_POWER_COST[action.level] : 0;
      if (state.politics.stats.politicalPower < cost) return state;
      return {
        ...state,
        politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: state.politics.stats.politicalPower - cost } },
        military: { ...military, readiness: action.level },
      };
    }

    case "SET_MOBILIZATION": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      if (action.state === military.mobilization) return state;
      const escalating = MOBILIZATION_ORDER.indexOf(action.state) > MOBILIZATION_ORDER.indexOf(military.mobilization);
      const cost = escalating ? MOBILIZATION_POLITICAL_POWER_COST[action.state] : 0;
      if (state.politics.stats.politicalPower < cost) return state;
      return {
        ...state,
        politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: state.politics.stats.politicalPower - cost } },
        military: { ...military, mobilization: action.state },
      };
    }

    case "SET_CONSCRIPTION_POLICY": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      if (action.policy === military.conscriptionPolicy) return state;
      const cost = 20;
      if (state.politics.stats.politicalPower < cost) return state;
      const personnelBump =
        action.policy === "draft" ? { mobilizable: military.personnel.mobilizable + 50000 } : action.policy === "reserve_expansion" ? { reserve: military.personnel.reserve + 20000 } : {};
      return {
        ...state,
        politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: state.politics.stats.politicalPower - cost } },
        military: { ...military, conscriptionPolicy: action.policy, personnel: { ...military.personnel, ...personnelBump } },
      };
    }

    case "MOVE_UNITS": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const destination = findProvince(military.provinces, action.destinationProvinceId);
      if (!destination || destination.kind !== "land") return state;
      let changed = false;
      const units = military.units.map((unit) => {
        if (!action.unitIds.includes(unit.id) || unit.status !== "garrison" || unit.provinceId === action.destinationProvinceId) return unit;
        const days = provinceTravelDays(military.provinces, unit.provinceId, action.destinationProvinceId);
        changed = true;
        return {
          ...unit,
          status: "moving" as const,
          destinationProvinceId: action.destinationProvinceId,
          originProvinceId: unit.provinceId,
          arrivalAtMinute: military.elapsedMinutes + days * MILITARY_MINUTES_PER_DAY,
          order: undefined,
        };
      });
      if (!changed) return state;
      return { ...state, military: { ...military, units } };
    }

    case "SET_UNIT_ORDER": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const unit = military.units.find((u) => u.id === action.unitId);
      if (!unit || unit.status !== "garrison") return state;
      const units = military.units.map((u) => (u.id === action.unitId ? { ...u, order: action.order ?? undefined } : u));
      return { ...state, military: { ...military, units } };
    }

    case "MOVE_FLEET": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const fleet = military.fleets.find((f) => f.id === action.fleetId);
      const destination = findProvince(military.provinces, action.destinationProvinceId);
      if (!fleet || !destination || destination.kind !== "sea" || fleet.status !== "garrison" || fleet.provinceId === action.destinationProvinceId) return state;
      const days = provinceTravelDays(military.provinces, fleet.provinceId, action.destinationProvinceId);
      const fleets = military.fleets.map((f) =>
        f.id === fleet.id ? { ...f, status: "moving" as const, destinationProvinceId: action.destinationProvinceId, arrivalAtMinute: military.elapsedMinutes + days * MILITARY_MINUTES_PER_DAY } : f,
      );
      return { ...state, military: { ...military, fleets } };
    }

    case "SET_FLEET_MISSION": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const fleets = military.fleets.map((fleet) => (fleet.id === action.fleetId ? { ...fleet, mission: action.mission } : fleet));
      return { ...state, military: { ...military, fleets } };
    }

    case "SET_AIRWING_MISSION": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const airWings = military.airWings.map((wing) => (wing.id === action.airWingId ? { ...wing, mission: action.mission } : wing));
      return { ...state, military: { ...military, airWings } };
    }

    case "SET_AIRWING_TARGET": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const wing = military.airWings.find((w) => w.id === action.airWingId);
      if (!wing || !wing.coverageRegionIds.includes(action.targetRegionId)) return state;
      const airWings = military.airWings.map((w) => (w.id === wing.id ? { ...w, targetRegionId: action.targetRegionId } : w));
      return { ...state, military: { ...military, airWings } };
    }

    case "START_OPERATION": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const cost = 15;
      if (state.politics.stats.politicalPower < cost) return state;
      const operation: Operation = {
        id: `op-${military.operations.length}-${military.elapsedMinutes}`,
        name: action.name,
        objective: action.objective,
        regionId: action.regionId,
        priority: action.priority,
        unitIds: action.unitIds,
        fleetIds: action.fleetIds,
        airWingIds: action.airWingIds,
        startedAtMinute: military.elapsedMinutes,
      };
      return {
        ...state,
        politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: state.politics.stats.politicalPower - cost } },
        military: { ...military, operations: [...military.operations, operation] },
      };
    }

    case "END_OPERATION": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      return { ...state, military: { ...military, operations: military.operations.filter((op) => op.id !== action.operationId) } };
    }

    case "MILITARY_COOPERATION_ACTION": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const template = findAllianceCooperation(action.cooperationId);
      if (!template) return state;
      const isAlly = state.diplomacy.factions.some((faction) => faction.leaderCountryId === state.playerCountryId && faction.memberCountryIds.includes(action.countryId));
      if (!isAlly) return state;
      if (state.politics.stats.politicalPower < template.politicalPowerCost) return state;

      const effects: MilitaryEffect[] = bindMilitaryEffectsToCountry(template.effects, action.countryId);
      const result = applyMilitaryEffects(effects, military.forces, military.personnel);
      const diplomacyEffects: DiplomacyEffect[] = result.relationDeltas.map((delta) => ({ type: "modify_relation", countryId: delta.countryId, amount: delta.amount, label: delta.label }));
      const diplomacyResult = applyDiplomacyEffects(diplomacyEffects, state.diplomacy.relations, state.diplomacy.trade, state.diplomacy.regionalTension, state.diplomacy.elapsedMinutes);

      return {
        ...state,
        politics: {
          ...state.politics,
          stats: {
            ...state.politics.stats,
            politicalPower: state.politics.stats.politicalPower - template.politicalPowerCost + result.politicalPowerDelta,
            governmentSupport: clampPercent(state.politics.stats.governmentSupport + result.governmentSupportDelta),
          },
        },
        diplomacy: { ...state.diplomacy, relations: diplomacyResult.relations },
        military: { ...military, forces: result.forces, personnel: result.personnel },
      };
    }

    case "RESPOND_MILITARY_EVENT": {
      const military = state.military;
      const notice = military.pendingNotices[0];
      if (!notice || notice.kind !== "military_event") return state;
      const template = findMilitaryEvent(notice.eventId);
      const option = template?.options.find((o) => o.id === action.optionId);
      if (!template || !option) return { ...state, military: { ...military, pendingNotices: military.pendingNotices.slice(1) } };

      const result = applyMilitaryEffects(option.effects, military.forces, military.personnel);
      const diplomacyEffects: DiplomacyEffect[] = result.relationDeltas.map((delta) => ({ type: "modify_relation", countryId: delta.countryId, amount: delta.amount, label: delta.label }));
      const diplomacyResult = applyDiplomacyEffects(diplomacyEffects, state.diplomacy.relations, state.diplomacy.trade, state.diplomacy.regionalTension, state.diplomacy.elapsedMinutes);

      return {
        ...state,
        politics: {
          ...state.politics,
          stats: {
            ...state.politics.stats,
            politicalPower: state.politics.stats.politicalPower + result.politicalPowerDelta,
            governmentSupport: clampPercent(state.politics.stats.governmentSupport + result.governmentSupportDelta),
          },
        },
        diplomacy: { ...state.diplomacy, relations: diplomacyResult.relations },
        military: { ...military, forces: result.forces, personnel: result.personnel, pendingNotices: military.pendingNotices.slice(1) },
      };
    }

    case "ACK_MILITARY_NOTICE": {
      if (state.military.pendingNotices.length === 0) return state;
      return { ...state, military: { ...state.military, pendingNotices: state.military.pendingNotices.slice(1) } };
    }

    case "RESPOND_ARMED_ATTACK": {
      const military = state.military;
      const notice = military.pendingNotices[0];
      if (!notice || notice.kind !== "armed_attack") return state;
      const enemyCountryId = notice.enemyCountryId;

      const immediateEffects: MilitaryEffect[] =
        action.response === "defend"
          ? [
              { type: "modify_capability", category: "land", amount: 3 },
              { type: "modify_capability", category: "air", amount: 3 },
              { type: "modify_government_support", amount: 2 },
            ]
          : action.response === "issue_statement"
            ? [
                { type: "modify_relation", countryId: enemyCountryId, amount: -3, label: "抗議声明" },
                { type: "modify_government_support", amount: 1 },
              ]
            : action.response === "diplomatic_talks"
              ? [
                  { type: "modify_relation", countryId: enemyCountryId, amount: 5, label: "外交交渉" },
                  { type: "modify_government_support", amount: -2 },
                ]
              : [{ type: "modify_government_support", amount: 1 }]; // request_ally_support: 同盟国への連絡そのものは外交側で処理

      const result = applyMilitaryEffects(immediateEffects, military.forces, military.personnel);
      const diplomacyEffects: DiplomacyEffect[] = result.relationDeltas.map((delta) => ({ type: "modify_relation", countryId: delta.countryId, amount: delta.amount, label: delta.label }));
      let diplomacyRelations = applyDiplomacyEffects(diplomacyEffects, state.diplomacy.relations, state.diplomacy.trade, state.diplomacy.regionalTension, state.diplomacy.elapsedMinutes).relations;

      if (action.response === "request_ally_support") {
        const allyIds = state.diplomacy.factions
          .filter((faction) => faction.leaderCountryId === state.playerCountryId)
          .flatMap((faction) => faction.memberCountryIds)
          .filter((id) => id !== state.playerCountryId);
        const allySupportEffects: DiplomacyEffect[] = allyIds.map((id) => ({ type: "modify_relation", countryId: id, amount: 5, label: "支援要請" }));
        diplomacyRelations = applyDiplomacyEffects(allySupportEffects, diplomacyRelations, state.diplomacy.trade, state.diplomacy.regionalTension, state.diplomacy.elapsedMinutes).relations;
      }

      // 防衛作戦は、準備が整った増援が後から戦力に加わる（指示書12章：動員には時間がかかる、と同じ発想）。
      const scheduledEffects =
        action.response === "defend"
          ? [
              ...military.scheduledEffects,
              {
                id: `defend-reinforce-${military.elapsedMinutes}`,
                atMinute: military.elapsedMinutes + 7 * MILITARY_MINUTES_PER_DAY,
                effects: [
                  { type: "modify_capability" as const, category: "land" as const, amount: 5 },
                  { type: "modify_capability" as const, category: "missile" as const, amount: 3 },
                ],
              },
            ]
          : military.scheduledEffects;

      return {
        ...state,
        politics: { ...state.politics, stats: { ...state.politics.stats, governmentSupport: clampPercent(state.politics.stats.governmentSupport + result.governmentSupportDelta) } },
        diplomacy: { ...state.diplomacy, relations: diplomacyRelations },
        military: { ...military, forces: result.forces, personnel: result.personnel, scheduledEffects, pendingNotices: military.pendingNotices.slice(1) },
      };
    }

    case "ADJUST_PRODUCTION_FACTORIES": {
      if (state.phase !== "playing") return state;
      const military = state.military;
      const line = military.productionLines.find((l) => l.itemId === action.itemId);
      if (!line) return state;
      const nextFactories = Math.max(0, Math.min(10, line.factories + action.delta));
      if (nextFactories === line.factories) return state;
      const cost = action.delta > 0 ? 5 * action.delta : 0;
      if (state.politics.stats.politicalPower < cost) return state;
      const productionLines = military.productionLines.map((l) => (l.itemId === action.itemId ? { ...l, factories: nextFactories } : l));
      return {
        ...state,
        politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: state.politics.stats.politicalPower - cost } },
        military: { ...military, productionLines },
      };
    }

    default:
      return state;
  }
}
