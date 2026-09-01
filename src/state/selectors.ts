import type { GameState } from "../types/game";

export function isGameOver(state: GameState): boolean {
  return state.status !== "playing";
}

export function recentHistory(state: GameState, count = 8) {
  return state.history.slice(-count).reverse();
}

export function isAreaOnCooldown(state: GameState, areaId: string): boolean {
  const readyAt = state.policyCooldowns[areaId];
  return readyAt !== undefined && state.date.dayIndex < readyAt;
}

export function averagePartyLoyalty(state: GameState): number {
  const factions = Object.values(state.factions);
  if (factions.length === 0) return 0;
  return factions.reduce((sum, f) => sum + f.loyalty, 0) / factions.length;
}

export function maxReshufflePressure(state: GameState): number {
  const factions = Object.values(state.factions);
  return factions.reduce((max, f) => Math.max(max, f.reshufflePressure), 0);
}
