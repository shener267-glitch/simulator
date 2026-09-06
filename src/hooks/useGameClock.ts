import { useEffect } from "react";
import { REAL_MS_PER_TICK } from "../engine/clock";
import { useGameDispatch, useGameState } from "../state/GameContext";

/** 動いている間、現実の1秒ごとにTICKを送る（設計書2章）。 */
export function useGameClock(): void {
  const state = useGameState();
  const dispatch = useGameDispatch();

  useEffect(() => {
    if (!state.clock.running) return;
    const id = window.setInterval(() => dispatch({ type: "TICK" }), REAL_MS_PER_TICK);
    return () => window.clearInterval(id);
  }, [state.clock.running, dispatch]);
}
