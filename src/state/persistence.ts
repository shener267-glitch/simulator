import type { GameState } from "../types/game";
import { isPlaceId } from "../data/places";
import { SAVE_VERSION } from "./initialState";

/** 版はここ一箇所から作る。定数とキー文字列に別々に埋めると必ずずれる。 */
const STORAGE_KEY = `pm-sim:save:v${SAVE_VERSION}`;

export function saveGame(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage may be unavailable (private browsing, quota) — save is best-effort. */
  }
}

/**
 * 版が違えば捨てる。移行は書かない — v0.2で状態の形が変わっており、古い
 * セーブを読めるように保つ価値より、読めてしまったときに壊れる危険が勝る。
 */
export function loadGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.saveVersion !== SAVE_VERSION) return null;
    // 画面の種類が読めないセーブは、routing が判断できないので捨てる。
    if (typeof parsed.mode?.kind !== "string") return null;
    // 消えた部屋を持つセーブを通すと、あとで placeById が落ちる。
    if (!isPlaceId(parsed.place)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to do — the save is best-effort either way. */
  }
}
