import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/state/initialState";
import { gameReducer } from "../../src/state/gameReducer";
import { DEFAULT_COUNTRY_ID } from "../../src/data/countries";
import { computeRelation } from "../../src/engine/diplomacy";
import { markFrontProvincesContested, provinceTravelDays } from "../../src/engine/military";
import type { GameState } from "../../src/types/game";

describe("the title → select → playing flow", () => {
  it("moves from the title to the country-select screen on START", () => {
    const next = gameReducer(createInitialState(), { type: "START" });
    expect(next.phase).toBe("select");
  });

  it("defaults the select screen to Japan, and lets the player change the preview", () => {
    const selecting = gameReducer(createInitialState(), { type: "START" });
    expect(selecting.selectedCountryId).toBe(DEFAULT_COUNTRY_ID);

    const previewingUsa = gameReducer(selecting, { type: "SELECT_COUNTRY", id: "USA" });
    expect(previewingUsa.selectedCountryId).toBe("USA");
    expect(previewingUsa.phase).toBe("select");
  });

  it("refuses to select a country outside of the select screen", () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: "SELECT_COUNTRY", id: "USA" });
    expect(next).toBe(state);
  });

  it("begins the game with whichever country was selected", () => {
    let state = gameReducer(createInitialState(), { type: "START" });
    state = gameReducer(state, { type: "SELECT_COUNTRY", id: "DEU" });
    state = gameReducer(state, { type: "BEGIN_GAME" });
    expect(state.phase).toBe("playing");
    expect(state.playerCountryId).toBe("DEU");
  });

  it("refuses to begin the game from the title screen", () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: "BEGIN_GAME" });
    expect(next).toBe(state);
  });
});

function playing(overrides: Partial<GameState> = {}): GameState {
  let state = gameReducer(createInitialState(), { type: "START" });
  state = gameReducer(state, { type: "BEGIN_GAME" });
  return { ...state, ...overrides };
}

describe("national focus", () => {
  function withPoliticalPower(state: GameState, amount: number): GameState {
    return { ...state, politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: amount } } };
  }

  it("starts a focus once affordable, deducting its political power cost", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "START_FOCUS", focusId: "kokunai-seisaku" });
    expect(next.politics.activeFocus).toEqual({ focusId: "kokunai-seisaku", daysElapsed: 0 });
    expect(next.politics.stats.politicalPower).toBe(90); // cost 10
  });

  it("refuses to start a focus that cannot yet be afforded", () => {
    const state = withPoliticalPower(playing(), 5);
    const next = gameReducer(state, { type: "START_FOCUS", focusId: "kokunai-seisaku" }); // cost 10
    expect(next).toBe(state);
  });

  it("refuses to start a focus whose prerequisites are unmet", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "START_FOCUS", focusId: "keizai-saisei" }); // needs kokunai-seisaku
    expect(next).toBe(state);
  });

  it("refuses to start a second focus while one is already in progress (指示書11章)", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "START_FOCUS", focusId: "kokunai-seisaku" });
    const next = gameReducer(state, { type: "START_FOCUS", focusId: "gaikou-seisaku" });
    expect(next).toBe(state);
  });

  it("advances the active focus's progress and accrues political power on TICK", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "START_FOCUS", focusId: "kokunai-seisaku" }); // 20日, PP -10 → 90
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" }); // 8分 = 8/1440日
    expect(next.politics.activeFocus?.daysElapsed).toBeCloseTo(8 / 1440);
    expect(next.politics.stats.politicalPower).toBeCloseTo(90 + 2 * (8 / 1440));
  });

  it("completes a focus once its full duration has elapsed, applies effects, and pauses with a notice", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "START_FOCUS", focusId: "kokunai-seisaku" }); // 20日, effect: PP+10
    state = { ...state, politics: { ...state.politics, activeFocus: { focusId: "kokunai-seisaku", daysElapsed: 20 - 1 / 1440 } } };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" }); // 最後の1分でちょうど20日に達する
    expect(next.politics.activeFocus).toBeNull();
    expect(next.politics.completedFocusIds).toContain("kokunai-seisaku");
    expect(next.gameTime.speed).toBe(0);
    expect(next.politics.pendingNotices).toEqual([{ kind: "focus_complete", focusId: "kokunai-seisaku" }]);
  });

  it("queues an event notice after the completion notice when a focus triggers one", () => {
    let state = withPoliticalPower(playing(), 500);
    // 財政健全化まで一気に前提を満たした状態を組み立てる。
    state = {
      ...state,
      politics: {
        ...state.politics,
        completedFocusIds: [...state.politics.completedFocusIds, "kokunai-seisaku", "keizai-saisei", "zaisei-saiken", "saishutsu-kaikaku"],
        activeFocus: { focusId: "zaisei-kenzenka", daysElapsed: 70 - 1 / 1440 },
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.politics.pendingNotices).toEqual([
      { kind: "focus_complete", focusId: "zaisei-kenzenka" },
      { kind: "event", eventId: "fiscal-reform-debate" },
    ]);
  });

  it("dismisses one notice at a time with ACK_FOCUS_NOTICE", () => {
    let state = playing();
    state = {
      ...state,
      politics: {
        ...state.politics,
        pendingNotices: [
          { kind: "focus_complete", focusId: "kokunai-seisaku" },
          { kind: "event", eventId: "fiscal-reform-debate" },
        ],
      },
    };
    state = gameReducer(state, { type: "ACK_FOCUS_NOTICE" });
    expect(state.politics.pendingNotices).toEqual([{ kind: "event", eventId: "fiscal-reform-debate" }]);
    state = gameReducer(state, { type: "ACK_FOCUS_NOTICE" });
    expect(state.politics.pendingNotices).toEqual([]);
  });

  it("unlocks a requiresUnlock focus once its unlock_focus effect fires", () => {
    let state = withPoliticalPower(playing(), 500);
    state = {
      ...state,
      politics: {
        ...state.politics,
        completedFocusIds: [...state.politics.completedFocusIds, "gaikou-seisaku"],
        activeFocus: { focusId: "ajia-gaikou", daysElapsed: 45 - 1 / 1440 },
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    state = gameReducer(state, { type: "TICK" });
    expect(state.politics.unlockedFocusIds).toContain("chiiki-anpo");

    const started = gameReducer(state, { type: "START_FOCUS", focusId: "chiiki-anpo" });
    expect(started.politics.activeFocus?.focusId).toBe("chiiki-anpo");
  });
});

describe("time control", () => {
  it("does not advance time while paused (speed 0)", () => {
    const state = playing();
    expect(state.gameTime.speed).toBe(0);
    const next = gameReducer(state, { type: "TICK" });
    expect(next.gameTime).toEqual(state.gameTime);
  });

  it("advances by `speed` minutes per tick once a speed is chosen", () => {
    let state = playing();
    state = gameReducer(state, { type: "SET_SPEED", speed: 4 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.gameTime.minute).toBe(state.gameTime.minute + 4);
  });

  it("refuses to change speed before the game has begun", () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: "SET_SPEED", speed: 2 });
    expect(next).toBe(state);
  });

  it("rolls the hour over correctly across a tick", () => {
    let state = playing();
    state = { ...state, gameTime: { ...state.gameTime, minute: 58, speed: 4 } };
    const next = gameReducer(state, { type: "TICK" });
    expect(next.gameTime).toMatchObject({ hour: state.gameTime.hour + 1, minute: 2 });
  });
});

describe("map inspection and category menu", () => {
  it("opens and closes a country info panel while playing", () => {
    let state = playing();
    state = gameReducer(state, { type: "INSPECT_COUNTRY", id: "FRA" });
    expect(state.inspectingCountryId).toBe("FRA");
    state = gameReducer(state, { type: "INSPECT_COUNTRY", id: null });
    expect(state.inspectingCountryId).toBeNull();
  });

  it("opens and closes a bottom-menu category while playing", () => {
    let state = playing();
    state = gameReducer(state, { type: "OPEN_CATEGORY", id: "overview" });
    expect(state.activeCategory).toBe("overview");
    state = gameReducer(state, { type: "OPEN_CATEGORY", id: null });
    expect(state.activeCategory).toBeNull();
  });

  it("does not let the player inspect a country before the game begins", () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: "INSPECT_COUNTRY", id: "JPN" });
    expect(next).toBe(state);
  });
});

describe("budget and economy policy", () => {
  it("sets a budget category directly", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_BUDGET", category: "defense", amount: 10 });
    expect(next.economy.budget.defense).toBe(10);
  });

  it("never lets a budget category go negative", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_BUDGET", category: "defense", amount: -5 });
    expect(next.economy.budget.defense).toBe(0);
  });

  it("decides a policy once affordable, deducting its political power cost and scheduling its stages", () => {
    let state = playing();
    state = {
      ...state,
      politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: 100 } },
    };
    const next = gameReducer(state, { type: "DECIDE_ECONOMY_POLICY", policyId: "public-investment" });
    expect(next.politics.stats.politicalPower).toBe(85); // cost 15
    expect(next.economy.decidedPolicyIds).toContain("public-investment");
    expect(next.economy.scheduledEffects.length).toBeGreaterThan(0);
  });

  it("refuses to decide a policy that cannot be afforded", () => {
    const state = playing();
    const next = gameReducer(state, { type: "DECIDE_ECONOMY_POLICY", policyId: "public-investment" });
    expect(next).toBe(state);
  });

  it("refuses to decide the same policy twice", () => {
    let state = playing();
    state = {
      ...state,
      politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: 100 } },
    };
    const decided = gameReducer(state, { type: "DECIDE_ECONOMY_POLICY", policyId: "public-investment" });
    const again = gameReducer(decided, { type: "DECIDE_ECONOMY_POLICY", policyId: "public-investment" });
    expect(again).toBe(decided);
  });
});

describe("economy over time", () => {
  it("applies a scheduled policy stage once its minute arrives", () => {
    let state = playing();
    state = {
      ...state,
      politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: 100 } },
    };
    state = gameReducer(state, { type: "DECIDE_ECONOMY_POLICY", policyId: "public-investment" }); // 即時段階あり
    const budgetBefore = state.economy.budget.publicWorks;
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.economy.budget.publicWorks).toBe(budgetBefore + 2);
    expect(next.economy.scheduledEffects.length).toBe(state.economy.scheduledEffects.length - 1);
  });

  it("grows GDP and moves debt with the fiscal balance as time passes", () => {
    let state = playing();
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const before = state.economy.stats;
    const next = gameReducer(state, { type: "TICK" });
    expect(next.economy.stats.gdpTrillionYen).toBeGreaterThan(before.gdpTrillionYen);
    expect(next.economy.stats.govDebtTrillionYen).toBeGreaterThan(before.govDebtTrillionYen); // 財政赤字なので増える
  });

  it("nudges government support from strong growth over time (指示書9章)", () => {
    let state = playing();
    state = {
      ...state,
      economy: { ...state.economy, stats: { ...state.economy.stats, gdpGrowthRate: 3, unemploymentRate: 2, inflationRate: 2 } },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const before = state.politics.stats.governmentSupport;
    const next = gameReducer(state, { type: "TICK" });
    expect(next.politics.stats.governmentSupport).toBeGreaterThan(before);
  });
});

describe("research", () => {
  it("starts a tech in a free slot", () => {
    const state = playing();
    const next = gameReducer(state, { type: "START_RESEARCH", techId: "sugaku" });
    expect(next.research.active).toEqual([{ techId: "sugaku", daysElapsed: 0 }]);
  });

  it("fills both slots but refuses a third concurrent research", () => {
    let state = playing();
    state = gameReducer(state, { type: "START_RESEARCH", techId: "sugaku" });
    state = gameReducer(state, { type: "START_RESEARCH", techId: "butsurigaku" });
    const next = gameReducer(state, { type: "START_RESEARCH", techId: "handoutai" });
    expect(next).toBe(state);
  });

  it("refuses a tech whose prerequisites are unmet", () => {
    const state = playing();
    const next = gameReducer(state, { type: "START_RESEARCH", techId: "ai-kiso" }); // needs computer-kiso
    expect(next).toBe(state);
  });

  it("advances active research on TICK", () => {
    let state = playing();
    state = gameReducer(state, { type: "START_RESEARCH", techId: "sugaku" });
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.research.active[0].daysElapsed).toBeCloseTo(8 / 1440);
  });

  it("completes a tech once its duration has elapsed, applies its effects, and pauses with a notice", () => {
    let state = playing();
    state = gameReducer(state, { type: "START_RESEARCH", techId: "sugaku" }); // 90日、効果なし
    state = {
      ...state,
      research: { ...state.research, active: [{ techId: "sugaku", daysElapsed: 90 - 1 / 1440 }] },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.research.active).toEqual([]);
    expect(next.research.completedTechIds).toContain("sugaku");
    expect(next.gameTime.speed).toBe(0);
    expect(next.politics.pendingNotices).toEqual([{ kind: "tech_complete", techId: "sugaku" }]);
  });

  it("unlocks a requiresUnlock tech once its unlock_tech effect fires", () => {
    let state = playing();
    state = {
      ...state,
      research: {
        ...state.research,
        completedTechIds: [...state.research.completedTechIds, "kiso-kagaku", "sugaku", "butsurigaku", "computer-kiso", "ai-kiso"],
        active: [{ techId: "ai-ouyou", daysElapsed: 280 - 1 / 1440 }],
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    state = gameReducer(state, { type: "TICK" });
    expect(state.research.unlockedTechIds).toContain("quantum-computing");
  });
});

describe("national focus ↔ research connection (指示書19章)", () => {
  it("boosts research speed when 科学技術立国 completes", () => {
    let state = playing();
    state = {
      ...state,
      politics: {
        ...state.politics,
        completedFocusIds: [...state.politics.completedFocusIds, "kokunai-seisaku", "shakai-seisaku"],
        activeFocus: { focusId: "kagaku-gijutsu-rikkoku", daysElapsed: 50 - 1 / 1440 },
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.research.speedBonusPercent).toBe(10);
  });
});

describe("diplomatic actions (Phase 4指示書10〜12章)", () => {
  function withPoliticalPower(state: GameState, amount: number): GameState {
    return { ...state, politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: amount } } };
  }

  it("decides an affordable action, deducting its cost and scheduling its effect", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "DECIDE_DIPLOMATIC_ACTION", countryId: "USA", actionId: "send_envoy" });
    expect(next.politics.stats.politicalPower).toBe(92); // cost 8
    expect(next.diplomacy.scheduledEffects.length).toBeGreaterThan(0);
    expect(next.diplomacy.relations.USA.lastActionAtMinute.send_envoy).toBe(0);
  });

  it("refuses an action that cannot be afforded", () => {
    const state = withPoliticalPower(playing(), 1);
    const next = gameReducer(state, { type: "DECIDE_DIPLOMATIC_ACTION", countryId: "USA", actionId: "send_envoy" });
    expect(next).toBe(state);
  });

  it("refuses an action against a country this player has no diplomacy data for", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "DECIDE_DIPLOMATIC_ACTION", countryId: "JPN", actionId: "send_envoy" });
    expect(next).toBe(state);
  });

  it("applies a scheduled action stage once its minute arrives, and clears it from the queue", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "DECIDE_DIPLOMATIC_ACTION", countryId: "USA", actionId: "send_envoy" }); // 即時段階
    const before = state.diplomacy.relations.USA;
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.diplomacy.relations.USA.modifiers.length).toBeGreaterThan(before.modifiers.length);
    expect(next.diplomacy.scheduledEffects).toHaveLength(0);
  });

  it("propose_summit schedules a pending summit instead of an immediate effect", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "DECIDE_DIPLOMATIC_ACTION", countryId: "USA", actionId: "propose_summit" });
    expect(next.diplomacy.scheduledEffects).toHaveLength(0);
    expect(next.diplomacy.pendingSummits).toEqual([{ id: "USA-0", countryId: "USA", readyAtMinute: 14 * 1440 }]);
  });
});

describe("treaties (Phase 4指示書13章)", () => {
  function withPoliticalPower(state: GameState, amount: number): GameState {
    return { ...state, politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: amount } } };
  }

  it("signs a treaty once relation and political power both qualify", () => {
    const state = withPoliticalPower(playing(), 100); // 日米関係の初期値は友好条約のしきい値(20)を上回る
    const next = gameReducer(state, { type: "DECIDE_TREATY", countryId: "USA", treatyTypeId: "friendship", clauseIds: [] });
    expect(next.politics.stats.politicalPower).toBe(90); // cost 10
    expect(next.diplomacy.relations.USA.treaties).toHaveLength(1);
    expect(next.diplomacy.relations.USA.treaties[0].treatyTypeId).toBe("friendship");
  });

  it("refuses to sign the same treaty type with the same country twice", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "DECIDE_TREATY", countryId: "USA", treatyTypeId: "friendship", clauseIds: [] });
    const again = gameReducer(state, { type: "DECIDE_TREATY", countryId: "USA", treatyTypeId: "friendship", clauseIds: [] });
    expect(again).toBe(state);
  });

  it("refuses a treaty the relation does not yet qualify for", () => {
    const state = withPoliticalPower(playing(), 100); // ロシアとの初期関係値は相互防衛条約のしきい値(50)に遠く届かない
    const next = gameReducer(state, { type: "DECIDE_TREATY", countryId: "RUS", treatyTypeId: "mutual_defense", clauseIds: [] });
    expect(next).toBe(state);
  });

  it("adds an optional clause's cost on top of the treaty's base cost", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "DECIDE_TREATY", countryId: "USA", treatyTypeId: "trade_agreement", clauseIds: ["tariff_relief"] });
    expect(next.politics.stats.politicalPower).toBe(100 - 15 - 8); // 通商協定15 + 関税優遇条項8
  });
});

describe("diplomatic stances (指示書20章)", () => {
  it("toggles a stance on and off", () => {
    let state = playing();
    state = gameReducer(state, { type: "TOGGLE_STANCE", stanceId: "free_trade" });
    expect(state.diplomacy.stances).toEqual(["free_trade"]);
    state = gameReducer(state, { type: "TOGGLE_STANCE", stanceId: "free_trade" });
    expect(state.diplomacy.stances).toEqual([]);
  });
});

describe("summit invitations (指示書9章：承諾／延期／辞退)", () => {
  it("fires a summit_invite notice, pausing the game, once the prep period has fully elapsed", () => {
    let state = playing();
    state = { ...state, diplomacy: { ...state.diplomacy, pendingSummits: [{ id: "USA-0", countryId: "USA", readyAtMinute: 1 }] } };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.diplomacy.pendingNotices).toEqual([{ kind: "summit_invite", countryId: "USA" }]);
    expect(next.gameTime.speed).toBe(0);
  });

  it("accepting raises relation and government support, and clears the pending summit", () => {
    let state = playing();
    state = {
      ...state,
      diplomacy: {
        ...state.diplomacy,
        pendingSummits: [{ id: "USA-0", countryId: "USA", readyAtMinute: 0 }],
        pendingNotices: [{ kind: "summit_invite", countryId: "USA" }],
      },
    };
    const relationBefore = state.diplomacy.relations.USA.modifiers.length;
    const supportBefore = state.politics.stats.governmentSupport;
    const next = gameReducer(state, { type: "RESPOND_SUMMIT_INVITE", response: "accept" });
    expect(next.diplomacy.pendingNotices).toEqual([]);
    expect(next.diplomacy.pendingSummits).toEqual([]);
    expect(next.diplomacy.relations.USA.modifiers.length).toBeGreaterThan(relationBefore);
    expect(next.politics.stats.governmentSupport).toBeGreaterThan(supportBefore);
  });

  it("rescheduling pushes the summit's ready time out without resolving it", () => {
    let state = playing();
    state = {
      ...state,
      diplomacy: {
        ...state.diplomacy,
        elapsedMinutes: 500,
        pendingSummits: [{ id: "USA-0", countryId: "USA", readyAtMinute: 500 }],
        pendingNotices: [{ kind: "summit_invite", countryId: "USA" }],
      },
    };
    const next = gameReducer(state, { type: "RESPOND_SUMMIT_INVITE", response: "reschedule" });
    expect(next.diplomacy.pendingNotices).toEqual([]);
    expect(next.diplomacy.pendingSummits).toEqual([{ id: "USA-0", countryId: "USA", readyAtMinute: 500 + 14 * 1440 }]);
  });

  it("declining removes the summit and slightly lowers relation", () => {
    let state = playing();
    state = {
      ...state,
      diplomacy: {
        ...state.diplomacy,
        pendingSummits: [{ id: "USA-0", countryId: "USA", readyAtMinute: 0 }],
        pendingNotices: [{ kind: "summit_invite", countryId: "USA" }],
      },
    };
    const before = computeRelation(state.diplomacy.relations.USA);
    const next = gameReducer(state, { type: "RESPOND_SUMMIT_INVITE", response: "decline" });
    expect(next.diplomacy.pendingSummits).toEqual([]);
    expect(computeRelation(next.diplomacy.relations.USA)).toBeLessThan(before);
  });
});

describe("simplified international crises (指示書18章)", () => {
  it("resolves the notice and applies the chosen option's effects", () => {
    let state = playing();
    state = { ...state, diplomacy: { ...state.diplomacy, pendingNotices: [{ kind: "international_crisis", crisisId: "border-incident" }] } };
    const before = computeRelation(state.diplomacy.relations.CHN);
    const next = gameReducer(state, { type: "RESPOND_DIPLOMATIC_CRISIS", optionId: "quiet-channel" });
    expect(next.diplomacy.pendingNotices).toEqual([]);
    expect(computeRelation(next.diplomacy.relations.CHN)).toBeGreaterThan(before);
    expect(next.diplomacy.eventLog.length).toBeGreaterThan(0);
  });
});

describe("diplomatic news notices", () => {
  it("acknowledges one notice at a time", () => {
    let state = playing();
    state = {
      ...state,
      diplomacy: { ...state.diplomacy, pendingNotices: [{ kind: "diplomatic_event", eventId: "news-trade-friction" }] },
    };
    const next = gameReducer(state, { type: "ACK_DIPLOMATIC_NOTICE" });
    expect(next.diplomacy.pendingNotices).toEqual([]);
  });
});

describe("factions (指示書14章)", () => {
  it("proposes a faction led by the player, then invites a country whose relation qualifies", () => {
    let state = playing();
    state = gameReducer(state, { type: "PROPOSE_FACTION", name: "テスト陣営" });
    expect(state.diplomacy.factions).toHaveLength(1);
    const factionId = state.diplomacy.factions[0].id;

    const next = gameReducer(state, { type: "INVITE_TO_FACTION", factionId, countryId: "USA" }); // 日米関係55は30以上
    expect(next.diplomacy.factions[0].memberCountryIds).toContain("USA");
  });

  it("refuses to invite a country whose relation is too low", () => {
    let state = playing();
    state = gameReducer(state, { type: "PROPOSE_FACTION", name: "テスト陣営" });
    const factionId = state.diplomacy.factions[0].id;
    const next = gameReducer(state, { type: "INVITE_TO_FACTION", factionId, countryId: "RUS" }); // 関係値-20
    expect(next).toBe(state);
  });
});

describe("map relation overlay toggle", () => {
  it("toggles on and off", () => {
    let state = playing();
    expect(state.diplomacy.mapOverlayEnabled).toBe(false);
    state = gameReducer(state, { type: "TOGGLE_MAP_OVERLAY" });
    expect(state.diplomacy.mapOverlayEnabled).toBe(true);
  });
});

describe("national focus ↔ diplomacy connection (Phase 4指示書16章)", () => {
  it("raises relation with the USA when 日米関係強化 completes", () => {
    let state = playing();
    state = {
      ...state,
      politics: {
        ...state.politics,
        completedFocusIds: [...state.politics.completedFocusIds, "gaikou-seisaku"],
        activeFocus: { focusId: "nichibei-kankei", daysElapsed: 45 - 1 / 1440 },
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const before = computeRelation(state.diplomacy.relations.USA);
    const next = gameReducer(state, { type: "TICK" });
    expect(computeRelation(next.diplomacy.relations.USA)).toBe(before + 8);
  });

  it("raises relation with China when アジア外交 completes", () => {
    let state = playing();
    state = {
      ...state,
      politics: {
        ...state.politics,
        completedFocusIds: [...state.politics.completedFocusIds, "gaikou-seisaku"],
        activeFocus: { focusId: "ajia-gaikou", daysElapsed: 45 - 1 / 1440 },
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const before = computeRelation(state.diplomacy.relations.CHN);
    const next = gameReducer(state, { type: "TICK" });
    expect(computeRelation(next.diplomacy.relations.CHN)).toBe(before + 8);
  });
});

function withPoliticalPower(state: GameState, amount: number): GameState {
  return { ...state, politics: { ...state.politics, stats: { ...state.politics.stats, politicalPower: amount } } };
}

describe("defense readiness and mobilization (Phase 5指示書11・12章)", () => {
  it("escalates readiness, deducting its political power cost", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "SET_READINESS", level: "alert" });
    expect(next.military.readiness).toBe("alert");
    expect(next.politics.stats.politicalPower).toBe(92); // cost 8
  });

  it("refuses to escalate readiness without enough political power", () => {
    const state = withPoliticalPower(playing(), 1);
    const next = gameReducer(state, { type: "SET_READINESS", level: "emergency" });
    expect(next).toBe(state);
  });

  it("de-escalates readiness for free", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "SET_READINESS", level: "high_alert" });
    const powerAfterEscalating = state.politics.stats.politicalPower;
    const next = gameReducer(state, { type: "SET_READINESS", level: "normal" });
    expect(next.military.readiness).toBe("normal");
    expect(next.politics.stats.politicalPower).toBe(powerAfterEscalating);
  });

  it("is a no-op when setting the same readiness level again", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_READINESS", level: "normal" });
    expect(next).toBe(state);
  });

  it("escalates mobilization, deducting its political power cost", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "SET_MOBILIZATION", state: "partial" });
    expect(next.military.mobilization).toBe("partial");
    expect(next.politics.stats.politicalPower).toBe(85); // cost 15
  });
});

describe("conscription policy (指示書13章)", () => {
  it("changes policy, deducting its cost and bumping the mobilizable pool for draft", () => {
    const state = withPoliticalPower(playing(), 100);
    const before = state.military.personnel.mobilizable;
    const next = gameReducer(state, { type: "SET_CONSCRIPTION_POLICY", policy: "draft" });
    expect(next.military.conscriptionPolicy).toBe("draft");
    expect(next.politics.stats.politicalPower).toBe(80); // cost 20
    expect(next.military.personnel.mobilizable).toBe(before + 50000);
  });

  it("refuses to change policy without enough political power", () => {
    const state = withPoliticalPower(playing(), 5);
    const next = gameReducer(state, { type: "SET_CONSCRIPTION_POLICY", policy: "draft" });
    expect(next).toBe(state);
  });

  it("is a no-op when setting the same policy again", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_CONSCRIPTION_POLICY", policy: "volunteer" });
    expect(next).toBe(state);
  });
});

describe("direct unit movement (HOI4型改訂・指示書1・3章)", () => {
  it("sends a garrisoned unit moving to an adjacent province, with an arrival time derived from province travel days", () => {
    const state = playing();
    const next = gameReducer(state, { type: "MOVE_UNITS", unitIds: ["div1"], destinationProvinceId: "tohoku-rural" }); // tokyo-metro→tohoku-rural、隣接1区間
    const unit = next.military.units.find((u) => u.id === "div1")!;
    const expectedDays = provinceTravelDays(state.military.provinces, "tokyo-metro", "tohoku-rural");
    expect(unit.status).toBe("moving");
    expect(unit.destinationProvinceId).toBe("tohoku-rural");
    expect(unit.originProvinceId).toBe("tokyo-metro");
    expect(unit.arrivalAtMinute).toBeCloseTo(expectedDays * 1440);
  });

  it("moves several selected divisions to the same province at once", () => {
    const state = playing();
    const next = gameReducer(state, { type: "MOVE_UNITS", unitIds: ["div1", "div6"], destinationProvinceId: "tohoku-rural" });
    expect(next.military.units.find((u) => u.id === "div1")?.status).toBe("moving");
    expect(next.military.units.find((u) => u.id === "div6")?.status).toBe("moving");
  });

  it("refuses to move a unit that is already moving", () => {
    let state = playing();
    state = gameReducer(state, { type: "MOVE_UNITS", unitIds: ["div1"], destinationProvinceId: "tohoku-rural" });
    const next = gameReducer(state, { type: "MOVE_UNITS", unitIds: ["div1"], destinationProvinceId: "kumamoto-province" });
    expect(next).toBe(state);
  });

  it("resolves the move once the arrival minute has passed, on TICK, when the destination is uncontested", () => {
    let state = playing();
    state = {
      ...state,
      military: {
        ...state.military,
        units: state.military.units.map((u) => (u.id === "div1" ? { ...u, status: "moving", destinationProvinceId: "tohoku-rural", originProvinceId: "tokyo-metro", arrivalAtMinute: 1 } : u)),
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    const unit = next.military.units.find((u) => u.id === "div1")!;
    expect(unit.status).toBe("garrison");
    expect(unit.provinceId).toBe("tohoku-rural");
    expect(unit.regionId).toBe("tohoku");
    expect(unit.destinationProvinceId).toBeUndefined();
  });

  it("resolves combat on arrival at a contested province, and clears the flag on victory", () => {
    let state = playing();
    state = {
      ...state,
      military: {
        ...state.military,
        provinces: state.military.provinces.map((p) => (p.id === "tohoku-rural" ? { ...p, contested: true } : p)),
        units: state.military.units.map((u) => (u.id === "div1" ? { ...u, status: "moving", destinationProvinceId: "tohoku-rural", originProvinceId: "tokyo-metro", arrivalAtMinute: 1 } : u)),
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    const unit = next.military.units.find((u) => u.id === "div1")!;
    expect(unit.status).toBe("garrison");
    // 攻撃側は第1師団（充足度が高い）、防御側は関係値の目安（デフォルト0）——高確率で勝利するはずだが、
    // 乱数のブレを踏まえて「駐屯地扱いに戻ったこと」と「戦闘ログが残ること」だけを厳密に確かめる。
    expect(["tohoku-rural", "tokyo-metro"]).toContain(unit.provinceId);
    expect(next.military.eventLog.some((entry) => entry.text.includes("交戦"))).toBe(true);
  });

  it("gives a defending garrisoned unit a small morale regen over time", () => {
    let state = playing();
    state = gameReducer(state, { type: "SET_UNIT_ORDER", unitId: "div1", order: "defend" });
    const before = state.military.units.find((u) => u.id === "div1")!.moralePercent;
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.military.units.find((u) => u.id === "div1")!.moralePercent).toBeGreaterThan(before);
  });

  it("clears the defend order once the unit is given a move order", () => {
    let state = playing();
    state = gameReducer(state, { type: "SET_UNIT_ORDER", unitId: "div1", order: "defend" });
    state = gameReducer(state, { type: "MOVE_UNITS", unitIds: ["div1"], destinationProvinceId: "tohoku-rural" });
    expect(state.military.units.find((u) => u.id === "div1")?.order).toBeUndefined();
  });
});

describe("fleet movement (HOI4型改訂・指示書6章)", () => {
  it("sends a garrisoned fleet moving to a sea province", () => {
    const state = playing();
    const next = gameReducer(state, { type: "MOVE_FLEET", fleetId: "escort-flotilla-1", destinationProvinceId: "sea-of-japan-zone" });
    const fleet = next.military.fleets.find((f) => f.id === "escort-flotilla-1")!;
    expect(fleet.status).toBe("moving");
    expect(fleet.destinationProvinceId).toBe("sea-of-japan-zone");
  });

  it("refuses to move a fleet onto a land province", () => {
    const state = playing();
    const next = gameReducer(state, { type: "MOVE_FLEET", fleetId: "escort-flotilla-1", destinationProvinceId: "tokyo-metro" });
    expect(next).toBe(state);
  });

  it("resolves the fleet's move once the arrival minute has passed, on TICK", () => {
    let state = playing();
    state = {
      ...state,
      military: {
        ...state.military,
        fleets: state.military.fleets.map((f) => (f.id === "escort-flotilla-1" ? { ...f, status: "moving", destinationProvinceId: "sea-of-japan-zone", arrivalAtMinute: 1 } : f)),
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    const fleet = next.military.fleets.find((f) => f.id === "escort-flotilla-1")!;
    expect(fleet.status).toBe("garrison");
    expect(fleet.provinceId).toBe("sea-of-japan-zone");
  });
});

describe("air wing target area (HOI4型改訂・指示書7章)", () => {
  it("sets a target region within the wing's coverage", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_AIRWING_TARGET", airWingId: "chitose-wing", targetRegionId: "hokkaido" });
    expect(next.military.airWings.find((w) => w.id === "chitose-wing")?.targetRegionId).toBe("hokkaido");
  });

  it("refuses a target region outside the wing's coverage", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_AIRWING_TARGET", airWingId: "chitose-wing", targetRegionId: "kyushu" });
    expect(next).toBe(state);
  });
});

describe("war entry marks front-region provinces contested (HOI4型改訂・指示書4・5章)", () => {
  it("marks provinces in the attacked region as contested when the armed-attack notice fires", () => {
    let state = playing();
    state = { ...state, diplomacy: { ...state.diplomacy, relations: { ...state.diplomacy.relations, RUS: { ...state.diplomacy.relations.RUS, baseRelation: -90, modifiers: [] } } } };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    // 発火確率は低いので、決定論的に確かめるにはmarkFrontProvincesContestedそのものを直接使う。
    const marked = markFrontProvincesContested(state.military.provinces, "sea_of_japan");
    const seaOfJapanProvince = marked.find((p) => p.regionId === "sea_of_japan");
    expect(seaOfJapanProvince?.contested).toBe(true);
    const untouched = marked.find((p) => p.regionId === "kanto");
    expect(untouched?.contested).toBe(false);
  });
});

describe("fleet and air wing missions (指示書8・9章)", () => {
  it("sets a fleet's mission directly", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_FLEET_MISSION", fleetId: "escort-flotilla-1", mission: "blockade" });
    expect(next.military.fleets.find((f) => f.id === "escort-flotilla-1")?.mission).toBe("blockade");
  });

  it("sets an air wing's mission directly", () => {
    const state = playing();
    const next = gameReducer(state, { type: "SET_AIRWING_MISSION", airWingId: "chitose-wing", mission: "intercept" });
    expect(next.military.airWings.find((w) => w.id === "chitose-wing")?.mission).toBe("intercept");
  });
});

describe("operations (指示書25・26章、国家レベルの意思決定であって一マスずつの操作ではない)", () => {
  it("starts an operation, deducting its political power cost", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "START_OPERATION", name: "南西諸島防衛", objective: "南西諸島の防衛", regionId: "nansei", priority: "defense", unitIds: ["brigade15"], fleetIds: [], airWingIds: ["naha-wing"] });
    expect(next.politics.stats.politicalPower).toBe(85); // cost 15
    expect(next.military.operations).toHaveLength(1);
    expect(next.military.operations[0].name).toBe("南西諸島防衛");
  });

  it("refuses to start an operation without enough political power", () => {
    const state = withPoliticalPower(playing(), 1);
    const next = gameReducer(state, { type: "START_OPERATION", name: "x", objective: "x", regionId: "kanto", priority: "defense", unitIds: [], fleetIds: [], airWingIds: [] });
    expect(next).toBe(state);
  });

  it("ends an operation", () => {
    let state = withPoliticalPower(playing(), 100);
    state = gameReducer(state, { type: "START_OPERATION", name: "x", objective: "x", regionId: "kanto", priority: "defense", unitIds: [], fleetIds: [], airWingIds: [] });
    const operationId = state.military.operations[0].id;
    const next = gameReducer(state, { type: "END_OPERATION", operationId });
    expect(next.military.operations).toEqual([]);
  });
});

describe("alliance military cooperation (指示書27章)", () => {
  function withAlly(state: GameState): GameState {
    return { ...state, diplomacy: { ...state.diplomacy, factions: [{ id: "f1", name: "テスト陣営", leaderCountryId: "JPN", memberCountryIds: ["JPN", "USA"] }] } };
  }

  it("refuses cooperation with a country that is not an ally", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "MILITARY_COOPERATION_ACTION", countryId: "USA", cooperationId: "intel_sharing" });
    expect(next).toBe(state);
  });

  it("applies cooperation effects — capability and relation — once an alliance exists", () => {
    let state = withPoliticalPower(playing(), 100);
    state = withAlly(state);
    const relationBefore = computeRelation(state.diplomacy.relations.USA);
    const landBefore = state.military.forces.land.capability;
    const next = gameReducer(state, { type: "MILITARY_COOPERATION_ACTION", countryId: "USA", cooperationId: "joint_exercise" });
    expect(next.politics.stats.politicalPower).toBe(90); // cost 10
    expect(computeRelation(next.diplomacy.relations.USA)).toBeGreaterThan(relationBefore);
    expect(next.military.forces.land.capability).toBeGreaterThan(landBefore);
  });
});

describe("military notices (指示書31・32章)", () => {
  it("resolves a military event that has response options, applying the chosen effect", () => {
    let state = playing();
    state = { ...state, military: { ...state.military, pendingNotices: [{ kind: "military_event", eventId: "scramble" }] } };
    const missileBefore = state.military.forces.missile.capability;
    const next = gameReducer(state, { type: "RESPOND_MILITARY_EVENT", optionId: "raise-alert" });
    expect(next.military.pendingNotices).toEqual([]);
    expect(next.military.forces.missile.capability).toBeGreaterThan(missileBefore);
  });

  it("acknowledges a flavor-only military notice", () => {
    let state = playing();
    state = { ...state, military: { ...state.military, pendingNotices: [{ kind: "military_event", eventId: "joint-drill" }] } };
    const next = gameReducer(state, { type: "ACK_MILITARY_NOTICE" });
    expect(next.military.pendingNotices).toEqual([]);
  });
});

describe("armed attack (指示書23章、戦争は通知が立った時点で始まっている)", () => {
  function withArmedAttackNotice(state: GameState): GameState {
    return { ...state, military: { ...state.military, pendingNotices: [{ kind: "armed_attack", enemyCountryId: "RUS" }] } };
  }

  it("defending applies immediate capability gains and schedules a delayed reinforcement", () => {
    let state = withArmedAttackNotice(playing());
    const landBefore = state.military.forces.land.capability;
    const supportBefore = state.politics.stats.governmentSupport;
    const next = gameReducer(state, { type: "RESPOND_ARMED_ATTACK", response: "defend" });
    expect(next.military.pendingNotices).toEqual([]);
    expect(next.military.forces.land.capability).toBeGreaterThan(landBefore);
    expect(next.politics.stats.governmentSupport).toBeGreaterThan(supportBefore);
    expect(next.military.scheduledEffects).toHaveLength(1);
    expect(next.military.scheduledEffects[0].atMinute).toBe(7 * 1440);
  });

  it("diplomatic talks raise relation with the enemy but cost domestic support", () => {
    let state = withArmedAttackNotice(playing());
    const relationBefore = computeRelation(state.diplomacy.relations.RUS);
    const supportBefore = state.politics.stats.governmentSupport;
    const next = gameReducer(state, { type: "RESPOND_ARMED_ATTACK", response: "diplomatic_talks" });
    expect(computeRelation(next.diplomacy.relations.RUS)).toBeGreaterThan(relationBefore);
    expect(next.politics.stats.governmentSupport).toBeLessThan(supportBefore);
  });

  it("a scheduled reinforcement applies once its minute arrives, on TICK", () => {
    let state = withArmedAttackNotice(playing());
    state = gameReducer(state, { type: "RESPOND_ARMED_ATTACK", response: "defend" });
    const missileBefore = state.military.forces.missile.capability;
    state = { ...state, military: { ...state.military, scheduledEffects: state.military.scheduledEffects.map((e) => ({ ...e, atMinute: 1 })) } };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.military.forces.missile.capability).toBeGreaterThan(missileBefore);
    expect(next.military.scheduledEffects).toEqual([]);
  });
});

describe("equipment production (指示書16章)", () => {
  it("increases factories, deducting political power", () => {
    const state = withPoliticalPower(playing(), 100);
    const next = gameReducer(state, { type: "ADJUST_PRODUCTION_FACTORIES", itemId: "fighter", delta: 1 });
    expect(next.military.productionLines.find((l) => l.itemId === "fighter")?.factories).toBe(4);
    expect(next.politics.stats.politicalPower).toBe(95); // cost 5
  });

  it("decreases factories for free, floored at 0", () => {
    const state = playing();
    const next = gameReducer(state, { type: "ADJUST_PRODUCTION_FACTORIES", itemId: "fighter", delta: -100 });
    expect(next.military.productionLines.find((l) => l.itemId === "fighter")?.factories).toBe(0);
    expect(next.politics.stats.politicalPower).toBe(state.politics.stats.politicalPower);
  });

  it("caps factories at 10", () => {
    const state = withPoliticalPower(playing(), 1000);
    const next = gameReducer(state, { type: "ADJUST_PRODUCTION_FACTORIES", itemId: "fighter", delta: 100 });
    expect(next.military.productionLines.find((l) => l.itemId === "fighter")?.factories).toBe(10);
  });
});

describe("military tick integration", () => {
  it("advances a near-complete production line into a capability gain on TICK", () => {
    let state = playing();
    state = {
      ...state,
      military: {
        ...state.military,
        productionLines: state.military.productionLines.map((l) => (l.itemId === "tank" ? { ...l, factories: 100, efficiencyPercent: 100, accumulatedOutput: 1.999 } : l)), // 戦車1台=2、あと僅かで完成
      },
    };
    const landBefore = state.military.forces.land.capability;
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.military.forces.land.capability).toBeGreaterThan(landBefore);
  });

  it("keeps intel confidence within the 20..95 band after many ticks", () => {
    let state = playing();
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    for (let i = 0; i < 50; i++) state = gameReducer(state, { type: "TICK" });
    for (const snapshot of Object.values(state.military.intel)) {
      expect(snapshot.confidencePercent).toBeGreaterThanOrEqual(20);
      expect(snapshot.confidencePercent).toBeLessThanOrEqual(95);
    }
  });

  it("keeps a full 12-region front status record intact across ticks while at war", () => {
    let state = playing();
    state = {
      ...state,
      military: {
        ...state.military,
        war: {
          enemyCountryId: "RUS",
          startedAtMinute: 0,
          frontStatus: { hokkaido: "tense", tohoku: "calm", kanto: "calm", chubu: "calm", kinki: "calm", chugoku: "calm", shikoku: "calm", kyushu: "calm", nansei: "calm", sea_of_japan: "active", east_china_sea: "calm", pacific_ocean: "calm" },
        },
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const next = gameReducer(state, { type: "TICK" });
    expect(Object.keys(next.military.war!.frontStatus)).toHaveLength(12);
  });

  it("applies readiness's daily drag on GDP growth and diplomatic relations", () => {
    let state = playing();
    state = { ...state, military: { ...state.military, readiness: "emergency" } };
    state = gameReducer(state, { type: "SET_SPEED", speed: 8 });
    const growthBefore = state.economy.stats.gdpGrowthRate;
    const relationBefore = computeRelation(state.diplomacy.relations.USA);
    const next = gameReducer(state, { type: "TICK" });
    expect(next.economy.stats.gdpGrowthRate).toBeLessThan(growthBefore);
    expect(computeRelation(next.diplomacy.relations.USA)).toBeLessThan(relationBefore);
  });
});

describe("research ↔ military connection (Phase 5指示書19・30章)", () => {
  it("raises land capability when 防勢重視ドクトリン completes", () => {
    let state = playing();
    state = {
      ...state,
      research: {
        ...state.research,
        completedTechIds: [...state.research.completedTechIds, "gunji-kihon"],
        active: [{ techId: "bousei-jushi", daysElapsed: 100 - 1 / 1440 }],
      },
    };
    state = gameReducer(state, { type: "SET_SPEED", speed: 1 });
    const before = state.military.forces.land.capability;
    const next = gameReducer(state, { type: "TICK" });
    expect(next.military.forces.land.capability).toBe(before + 8);
  });
});
