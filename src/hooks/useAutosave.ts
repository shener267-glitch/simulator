import { useEffect } from "react";
import type { GameState } from "../types/game";
import { saveGame } from "../state/persistence";

/** 行動ごとに自動保存する（本セッションでの決定）。 */
export function useAutosave(state: GameState): void {
  useEffect(() => {
    saveGame(state);
  }, [state]);
}
