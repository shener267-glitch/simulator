import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/state/initialState";
import { MEETING_GAP, currentMeeting, meetingBudget, meetingCeiling, offeredChoices } from "../../src/engine/meeting";
import type { GameState } from "../../src/types/game";

function meetingState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    clock: { totalMinutes: 600, running: false, speed: 1 },
    mode: { kind: "meeting", appointmentId: "diet-designation-vote", startedAt: 600, stage: "choices", showing: null, taken: [] },
    ...overrides,
  };
}

describe("meeting budget and ceiling", () => {
  it("returns null outside of meeting mode", () => {
    expect(currentMeeting(createInitialState())).toBeNull();
  });

  it("stops ten minutes before the next appointment on the schedule", () => {
    // diet-designation-vote は 10:00開始・60分枠。次の予定は 11:30 の親任式。
    const state = meetingState();
    expect(meetingCeiling(state)).toBe(690 - MEETING_GAP);
  });

  it("has no ceiling once every other appointment is resolved", () => {
    const base = createInitialState();
    const state = meetingState({
      appointments: base.appointments.map((a) =>
        a.id === "first-press-conference" ? a : { ...a, resolved: true },
      ),
      clock: { totalMinutes: 1260, running: false, speed: 1 },
      mode: { kind: "meeting", appointmentId: "first-press-conference", startedAt: 1260, stage: "choices", showing: null, taken: [] },
    });
    expect(meetingCeiling(state)).toBe(Number.MAX_SAFE_INTEGER);
    expect(meetingBudget(state)).toBe(Number.MAX_SAFE_INTEGER - 1260);
  });

  it("offers only the choices that fit in what is left of the budget", () => {
    // 天井(680)まで15分だけ残す。15分の話題は入り、20分の話題は入らない。
    const state = meetingState({ clock: { totalMinutes: 680 - 15, running: false, speed: 1 } });
    const offered = offeredChoices(state);
    expect(offered.some((o) => o.fits && o.choice.minutes === 15)).toBe(true);
    expect(offered.some((o) => !o.fits && o.choice.minutes === 20)).toBe(true);
  });

  it("drops a choice once it has already been taken", () => {
    const state = meetingState({
      mode: {
        kind: "meeting",
        appointmentId: "diet-designation-vote",
        startedAt: 600,
        stage: "choices",
        showing: null,
        taken: ["check-numbers"],
      },
    });
    expect(offered(state).some((o) => o.choice.id === "check-numbers")).toBe(false);
  });
});

function offered(state: GameState) {
  return offeredChoices(state);
}
