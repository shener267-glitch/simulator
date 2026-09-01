import { useEffect } from "react";
import type { GameState } from "../types/game";
import { saveGame } from "../state/persistence";

export function useAutosave(state: GameState): void {
  useEffect(() => {
    saveGame(state);
  }, [state]);
}
