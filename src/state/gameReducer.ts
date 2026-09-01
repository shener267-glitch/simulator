import type { GameState } from "../types/game";
import type { PolicyArea } from "../types/policy";
import { applyEffects } from "../engine/effects";
import { advanceOneDay, type DayStepDeps } from "../engine/dayStep";
import { fastForwardToNextEvent } from "../engine/fastForward";
import { createNewGame } from "./initialState";
import { policyAreas, privateLifePolicyArea, eventDefs, eventTriggers } from "../data/registry";

export type GameAction =
  | { type: "NEW_GAME" }
  | { type: "ADVANCE_DAY" }
  | { type: "FAST_FORWARD" }
  | { type: "SELECT_POLICY"; areaId: string; optionId: string }
  | { type: "SELECT_HOBBY"; optionId: string }
  | { type: "RESOLVE_EVENT_CHOICE"; choiceId: string }
  | { type: "RESHUFFLE_CABINET" }
  | { type: "RESIGN" }
  | { type: "LOAD_GAME"; state: GameState };

const RESHUFFLE_COOLDOWN_ID = "cabinet_reshuffle";
const RESHUFFLE_COOLDOWN_DAYS = 45;

function findPolicyArea(areaId: string): PolicyArea | undefined {
  if (areaId === privateLifePolicyArea.id) return privateLifePolicyArea;
  return policyAreas.find((a) => a.id === areaId);
}

function applyPolicyChoice(state: GameState, areaId: string, optionId: string): GameState {
  const area = findPolicyArea(areaId);
  const option = area?.options.find((o) => o.id === optionId);
  if (!area || !option) return state;
  if (state.policyCooldowns[areaId] !== undefined && state.date.dayIndex < state.policyCooldowns[areaId]) {
    return state;
  }

  let next = applyEffects(state, option.effect);

  if (option.factionReactions) {
    const factions = { ...next.factions };
    for (const [factionId, delta] of Object.entries(option.factionReactions)) {
      const faction = factions[factionId];
      if (faction) {
        factions[factionId] = { ...faction, loyalty: Math.max(0, Math.min(100, faction.loyalty + delta)) };
      }
    }
    next = { ...next, factions };
  }

  next = {
    ...next,
    policyCooldowns: { ...next.policyCooldowns, [areaId]: next.date.dayIndex + area.cooldownDays },
  };

  return next;
}

/**
 * Factory so tests can inject a deterministic rng; production code uses the
 * `gameReducer` export below, which defaults to Math.random.
 */
export function createGameReducer(rng: () => number = Math.random) {
  const dayStepDeps: DayStepDeps = { triggers: eventTriggers, eventDefs, rng };
  return function gameReducer(state: GameState, action: GameAction): GameState {
    return runAction(state, action, dayStepDeps);
  };
}

function runAction(state: GameState, action: GameAction, dayStepDeps: DayStepDeps): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return createNewGame();

    case "LOAD_GAME":
      return action.state;

    case "ADVANCE_DAY": {
      if (state.activeEvent || state.status !== "playing") return state;
      return advanceOneDay(state, dayStepDeps);
    }

    case "FAST_FORWARD": {
      if (state.activeEvent || state.status !== "playing") return state;
      return fastForwardToNextEvent(state, dayStepDeps).state;
    }

    case "SELECT_POLICY": {
      if (state.activeEvent || state.status !== "playing") return state;
      const withChoice = applyPolicyChoice(state, action.areaId, action.optionId);
      if (withChoice === state) return state;
      return advanceOneDay(withChoice, dayStepDeps);
    }

    case "SELECT_HOBBY": {
      if (state.activeEvent || state.status !== "playing") return state;
      const withChoice = applyPolicyChoice(state, privateLifePolicyArea.id, action.optionId);
      if (withChoice === state) return state;
      return advanceOneDay(withChoice, dayStepDeps);
    }

    case "RESOLVE_EVENT_CHOICE": {
      if (!state.activeEvent) return state;
      const def = eventDefs[state.activeEvent.eventId];
      if (!def) return { ...state, activeEvent: null };

      if (def.dialogue) {
        const node = def.dialogue.nodes[state.activeEvent.currentDialogueNodeId ?? def.dialogue.rootNodeId];
        const choice = node?.choices.find((c) => c.id === action.choiceId);
        if (!choice) return state;
        let next = applyEffects(state, choice.effect);
        if (choice.followUpNodeId) {
          next = {
            ...next,
            activeEvent: { ...next.activeEvent!, currentDialogueNodeId: choice.followUpNodeId },
          };
        } else {
          next = { ...next, activeEvent: null };
        }
        return next;
      }

      const choice = def.choices?.find((c) => c.id === action.choiceId);
      if (!choice) return state;
      const next = applyEffects(state, choice.effect);
      return { ...next, activeEvent: null };
    }

    case "RESHUFFLE_CABINET": {
      if (state.activeEvent || state.status !== "playing") return state;
      const readyAt = state.eventCooldowns[RESHUFFLE_COOLDOWN_ID];
      if (readyAt !== undefined && state.date.dayIndex < readyAt) return state;

      const factions = { ...state.factions };
      for (const id of Object.keys(factions)) {
        factions[id] = {
          ...factions[id],
          loyalty: Math.min(100, factions[id].loyalty + 10),
          reshufflePressure: 0,
        };
      }

      const withReshuffle = applyEffects(
        { ...state, factions },
        {
          deltas: [{ stat: "approvalRating", delta: -3 }],
          description: "内閣改造が行われ、党内の引き締めが図られた。",
        },
      );

      const next: GameState = {
        ...withReshuffle,
        eventCooldowns: {
          ...withReshuffle.eventCooldowns,
          [RESHUFFLE_COOLDOWN_ID]: withReshuffle.date.dayIndex + RESHUFFLE_COOLDOWN_DAYS,
        },
      };

      return advanceOneDay(next, dayStepDeps);
    }

    case "RESIGN": {
      if (state.status !== "playing") return state;
      return { ...state, status: "gameover_resignation", gameOverReason: "自らの意思で辞任しました。" };
    }

    default:
      return state;
  }
}

export const gameReducer = createGameReducer();
