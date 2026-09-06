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
