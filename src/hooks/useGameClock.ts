import { useEffect } from "react";
import { REAL_MS_PER_TICK } from "../engine/gameTime";
import { useGameDispatch, useGameState } from "../state/GameContext";

/** 速度が0(一時停止)でない間、現実の1秒ごとにTICKを送る（指示書5章）。 */
export function useGameClock(): void {
  const state = useGameState();
  const dispatch = useGameDispatch();

  useEffect(() => {
    if (state.phase !== "playing" || state.gameTime.speed === 0) return;
    const id = window.setInterval(() => dispatch({ type: "TICK" }), REAL_MS_PER_TICK);
    return () => window.clearInterval(id);
  }, [state.phase, state.gameTime.speed, dispatch]);
}
