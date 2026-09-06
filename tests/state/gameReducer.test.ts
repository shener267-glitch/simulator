import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/state/initialState";
import { gameReducer } from "../../src/state/gameReducer";
import { DEFAULT_COUNTRY_ID } from "../../src/data/countries";
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
