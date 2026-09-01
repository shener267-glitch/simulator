import type { GameState } from "../types/game";
import { SAVE_VERSION } from "./initialState";

const STORAGE_KEY = "pm-sim:save:v2";

export function saveGame(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private browsing, quota) — save is best-effort.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.saveVersion !== SAVE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
