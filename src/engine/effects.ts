import type { GameState, HistoryLogEntry } from "../types/game";
import type { Effect } from "../types/stats";
import { CLAMPED_0_100_STATS } from "../types/stats";

function clamp(value: number, stat: string): number {
  if (CLAMPED_0_100_STATS.includes(stat as never)) {
    return Math.max(0, Math.min(100, value));
  }
  return value;
}

export function applyEffects(state: GameState, effect: Effect): GameState {
  const stats = { ...state.stats };
  for (const { stat, delta } of effect.deltas) {
    stats[stat] = clamp(stats[stat] + delta, stat);
  }
  if (stats.dietSeats < 0) stats.dietSeats = 0;

  let factions = state.factions;
  let countryRelations = state.countryRelations;
  let family = state.family;

  for (const rel of effect.relationDeltas ?? []) {
    if (rel.kind === "faction") {
      const target = factions[rel.id];
      if (target) {
        if (factions === state.factions) factions = { ...state.factions };
        factions[rel.id] = {
          ...target,
          loyalty: Math.max(0, Math.min(100, target.loyalty + rel.delta)),
        };
      }
    } else if (rel.kind === "country") {
      const target = countryRelations[rel.id];
      if (target) {
        if (countryRelations === state.countryRelations) countryRelations = { ...state.countryRelations };
        countryRelations[rel.id] = {
          ...target,
          relationScore: Math.max(0, Math.min(100, target.relationScore + rel.delta)),
        };
      }
    } else if (rel.kind === "family") {
      const index = family.findIndex((m) => m.id === rel.id);
      if (index !== -1) {
        if (family === state.family) family = [...state.family];
        family[index] = {
          ...family[index],
          relationship: Math.max(0, Math.min(100, family[index].relationship + rel.delta)),
        };
      }
    }
  }

  let flags = state.flags;
  if (effect.flagsSet && effect.flagsSet.length > 0) {
    flags = { ...state.flags };
    for (const flag of effect.flagsSet) {
      flags[flag] = true;
    }
  }

  let history = state.history;
  if (effect.description) {
    const entry: HistoryLogEntry = {
      dayIndex: state.date.dayIndex,
      text: effect.description,
      kind: "news",
    };
    history = [...state.history, entry];
  }

  return { ...state, stats, factions, countryRelations, family, flags, history };
}

export function pushHistory(
  state: GameState,
  text: string,
  kind: HistoryLogEntry["kind"] = "news",
): GameState {
  const entry: HistoryLogEntry = { dayIndex: state.date.dayIndex, text, kind };
  return { ...state, history: [...state.history, entry] };
}
