import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/state/initialState";
import { gameReducer } from "../../src/state/gameReducer";
import { DEFAULT_COUNTRY_ID } from "../../src/data/countries";
import { computeRelation } from "../../src/engine/diplomacy";
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
