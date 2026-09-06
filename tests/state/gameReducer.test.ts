import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../../src/state/initialState";
import { gameReducer } from "../../src/state/gameReducer";
import type { GameState } from "../../src/types/game";

function running(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), clock: { totalMinutes: 420, running: true, speed: 1 }, ...overrides };
}

describe("TICK", () => {
  it("does nothing while paused", () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: "TICK" });
    expect(next.clock.totalMinutes).toBe(state.clock.totalMinutes);
  });

  it("advances by `speed` minutes per tick while running", () => {
    const state = running({ clock: { totalMinutes: 420, running: true, speed: 5 } });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.clock.totalMinutes).toBe(425);
  });

  it("opens a meeting and pauses the moment an appointment's time comes", () => {
    const state = running({ clock: { totalMinutes: 599, running: true, speed: 1 } });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.clock.totalMinutes).toBe(600);
    expect(next.clock.running).toBe(false);
    expect(next.mode).toMatchObject({ kind: "meeting", appointmentId: "diet-designation-vote" });
  });

  it("applies a due pending effect to the nation, then clears it", () => {
    const state = running({
      clock: { totalMinutes: 419, running: true, speed: 1 },
      pendingEffects: [{ id: "test", at: 420, delta: { approval: 5 }, note: "test note" }],
    });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.nation.approval).toBe(state.nation.approval + 5);
    expect(next.pendingEffects).toHaveLength(0);
    expect(next.feed.some((entry) => entry.text === "test note")).toBe(true);
  });

  it("pauses without opening a mode when an urgent report arrives", () => {
    const state = running({ clock: { totalMinutes: 1019, running: true, speed: 1 } });
    const next = gameReducer(state, { type: "TICK" });
    expect(next.clock.running).toBe(false);
    expect(next.mode.kind).toBe("main");
    expect(next.feed.some((entry) => entry.kind === "urgent")).toBe(true);
  });

  describe("with a crisis forced to fire", () => {
    afterEach(() => vi.restoreAllMocks());

    it("fires a crisis and pauses the game", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const state = running({ clock: { totalMinutes: 419, running: true, speed: 1 } });
      const next = gameReducer(state, { type: "TICK" });
      expect(next.mode.kind).toBe("event");
      expect(next.clock.running).toBe(false);
      expect(next.crises.length).toBeGreaterThan(0);
    });
  });
});

describe("meeting flow", () => {
  function opened(): GameState {
    return {
      ...createInitialState(),
      clock: { totalMinutes: 600, running: false, speed: 1 },
      mode: { kind: "meeting", appointmentId: "diet-designation-vote", startedAt: 600, stage: "opening", showing: null, taken: [] },
    };
  }

  it("goes opening → choices → reply → choices → closing → main", () => {
    let state = gameReducer(opened(), { type: "MEETING_BEGIN" });
    expect(state.mode.kind === "meeting" && state.mode.stage).toBe("choices");

    state = gameReducer(state, { type: "MEETING_CHOOSE", choiceId: "check-numbers" });
    expect(state.clock.totalMinutes).toBe(615);
    expect(state.mode.kind === "meeting" && state.mode.stage).toBe("reply");

    state = gameReducer(state, { type: "MEETING_BACK" });
    expect(state.mode.kind === "meeting" && state.mode.stage).toBe("choices");

    state = gameReducer(state, { type: "END_MEETING" });
    expect(state.mode.kind === "meeting" && state.mode.stage).toBe("closing");

    state = gameReducer(state, { type: "RESOLVE_APPOINTMENT" });
    expect(state.mode.kind).toBe("main");
    expect(state.clock.running).toBe(true);
    expect(state.appointments.find((a) => a.id === "diet-designation-vote")?.resolved).toBe(true);
  });

  it("refuses a choice that no longer fits in the remaining budget", () => {
    // 天井(680)まで10分しか残っていない状態で、20分の話題は選べない。
    const state: GameState = {
      ...createInitialState(),
      clock: { totalMinutes: 680 - 10, running: false, speed: 1 },
      mode: { kind: "meeting", appointmentId: "diet-designation-vote", startedAt: 600, stage: "choices", showing: null, taken: [] },
    };
    const next = gameReducer(state, { type: "MEETING_CHOOSE", choiceId: "review-remarks" });
    expect(next).toBe(state);
  });
});

describe("crisis acknowledgement", () => {
  it("resumes the clock and returns to the main screen", () => {
    const state: GameState = {
      ...createInitialState(),
      clock: { totalMinutes: 420, running: false, speed: 1 },
      mode: { kind: "event", crisisId: "earthquake-420" },
      crises: [{ id: "earthquake-420", templateId: "earthquake", firedAt: 420, acknowledged: false }],
    };
    const next = gameReducer(state, { type: "ACK_CRISIS" });
    expect(next.mode.kind).toBe("main");
    expect(next.clock.running).toBe(true);
    expect(next.crises[0].acknowledged).toBe(true);
  });
});

describe("reports", () => {
  it("refuses to mark a report read before it has arrived", () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: "READ_REPORT", reportId: "keizai-taisaku-shian" });
    expect(next.reports.find((r) => r.id === "keizai-taisaku-shian")?.read).toBe(false);
  });

  it("marks a report read once it has arrived, and raises its flags", () => {
    const state = running({ clock: { totalMinutes: 480, running: false, speed: 1 } });
    const next = gameReducer(state, { type: "READ_REPORT", reportId: "keizai-taisaku-shian" });
    expect(next.reports.find((r) => r.id === "keizai-taisaku-shian")?.read).toBe(true);
    expect(next.flags).toContain("read-keizai-taisaku-shian");
  });
});

describe("policies", () => {
  it("refuses to decide a policy whose required flags are not yet set", () => {
    const state = running({ clock: { totalMinutes: 480, running: false, speed: 1 } });
    const next = gameReducer(state, { type: "DECIDE_POLICY", policyId: "keizai-taisaku-kibo", optionId: "large" });
    expect(next.policies.find((p) => p.id === "keizai-taisaku-kibo")?.decided).toBeUndefined();
  });

  it("decides a policy once its flags are set, and queues a delayed effect — with no single correct answer", () => {
    const state = running({
      clock: { totalMinutes: 480, running: false, speed: 1 },
      flags: ["read-keizai-taisaku-shian"],
    });
    const next = gameReducer(state, { type: "DECIDE_POLICY", policyId: "keizai-taisaku-kibo", optionId: "large" });
    const policy = next.policies.find((p) => p.id === "keizai-taisaku-kibo");
    expect(policy?.decided).toBe("large");
    expect(next.pendingEffects).toHaveLength(1);
    // どの選択肢にも長所と短所の文章だけがあり、内部の優劣スコアは持たない。
    for (const option of policy!.options) {
      expect(option.summary.length).toBeGreaterThan(0);
    }
  });

  it("refuses to decide the same policy twice", () => {
    const decided = gameReducer(
      running({ clock: { totalMinutes: 480, running: false, speed: 1 }, flags: ["read-keizai-taisaku-shian"] }),
      { type: "DECIDE_POLICY", policyId: "keizai-taisaku-kibo", optionId: "large" },
    );
    const again = gameReducer(decided, { type: "DECIDE_POLICY", policyId: "keizai-taisaku-kibo", optionId: "small" });
    expect(again).toBe(decided);
  });
});
