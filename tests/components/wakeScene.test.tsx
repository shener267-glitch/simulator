import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DayScreen } from "../../src/components/morning/DayScreen";
import { GameProvider } from "../../src/state/GameContext";
import { WAKE_BEATS } from "../../src/data/briefing";

const LAST_BEAT = WAKE_BEATS.length - 1;

function renderMorning() {
  return render(
    <GameProvider>
      <DayScreen />
    </GameProvider>,
  );
}

/**
 * Let the typewriter run to the end of whatever beat is on screen. Each
 * character schedules the next one from an effect, so the clock has to be
 * advanced once per character rather than in a single jump.
 */
function finishTyping() {
  for (let guard = 0; guard < 500; guard += 1) {
    if (!screen.queryByRole("button", { name: "すべて表示" })) return;
    act(() => {
      vi.advanceTimersByTime(400);
    });
  }
}

function tapNext() {
  finishTyping();
  fireEvent.click(screen.getByRole("button", { name: "次へ" }));
}

/** Walk to a beat without consuming it. */
function advanceTo(beat: number) {
  for (let step = 0; step < beat; step += 1) tapNext();
  finishTyping();
}

describe("the opening", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("opens on the clock, with getting up still several beats away", () => {
    renderMorning();

    expect(screen.getByText("06:00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "起きる" })).not.toBeInTheDocument();
  });

  it("reveals the rest of a sentence on the first tap and moves on with the second", () => {
    renderMorning();
    tapNext(); // past the clock, onto the first line

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByRole("button", { name: "すべて表示" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "すべて表示" }));
    expect(screen.getByText("2026年6月6日、土曜日。")).toBeInTheDocument();
    // Still the same beat — finishing the text is not the same as leaving it.
    expect(screen.getByRole("button", { name: "次へ" })).toBeInTheDocument();
  });

  it("describes how the morning feels without ever printing a number", () => {
    renderMorning();
    advanceTo(WAKE_BEATS.findIndex((beat) => beat.kind === "condition"));

    const panel = screen.getByText("CONDITION").parentElement;
    expect(panel?.textContent ?? "").not.toMatch(/\d/);
  });

  it("holds the phone back until the last beat, and only then gets the player up", () => {
    renderMorning();
    advanceTo(LAST_BEAT);

    expect(screen.getByText("枕元のスマートフォンに、通知が溜まっている。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "起きる" }));

    // 起きた先は行動一覧ではなく現在地の画面。四つの入口がそこにある。
    expect(screen.getByText("議員宿舎・寝室")).toBeInTheDocument();
    for (const command of ["行動", "話す", "移動", "アイテム"]) {
      expect(screen.getByRole("button", { name: new RegExp(command) })).toBeInTheDocument();
    }

    // The morning proper: the opening costs nothing, so it is still 05:00.
    expect(screen.getByText("06:00")).toBeInTheDocument();
  });
});
