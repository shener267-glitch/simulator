import type { GameState } from "../types/game";
import type { EventDef, EventTrigger } from "../types/events";
import { advanceDate } from "./calendar";
import { applyEffects } from "./effects";
import { selectEventForDay } from "./scheduler";
import { checkEndConditions } from "./endConditions";

export interface DayStepDeps {
  triggers: EventTrigger[];
  eventDefs: Record<string, EventDef>;
  rng?: () => number;
}

function applyPassiveDrift(state: GameState): GameState {
  const stats = { ...state.stats };
  stats.stress = Math.min(100, stats.stress + 1);
  if (stats.stress > 70) {
    stats.health = Math.max(0, stats.health - 1);
  } else if (stats.stress < 30) {
    stats.health = Math.min(100, stats.health + 1);
  }
  if (stats.approvalRating > 50) stats.approvalRating -= 0.1;
  else if (stats.approvalRating < 50) stats.approvalRating += 0.1;

  const factions = { ...state.factions };
  for (const id of Object.keys(factions)) {
    if (factions[id].loyalty < 40) {
      factions[id] = {
        ...factions[id],
        reshufflePressure: Math.min(100, factions[id].reshufflePressure + 1),
      };
    }
  }

  return { ...state, stats, factions };
}

export function advanceOneDay(state: GameState, deps: DayStepDeps): GameState {
  if (state.status !== "playing") return state;

  let next: GameState = { ...state, date: advanceDate(state.date) };
  next = applyPassiveDrift(next);

  const eventId = selectEventForDay(next, { triggers: deps.triggers, rng: deps.rng });
  if (eventId) {
    const def = deps.eventDefs[eventId];
    if (def) {
      if (def.blocking) {
        next = {
          ...next,
          activeEvent: {
            eventId,
            dayIndex: next.date.dayIndex,
            currentDialogueNodeId: def.dialogue?.rootNodeId,
          },
        };
      } else if (def.autoEffect) {
        next = applyEffects(next, def.autoEffect);
      }

      const trigger = deps.triggers.find(
        (t) => t.eventId === eventId && (t.type === "conditional" || t.type === "random") && t.cooldownDays,
      );
      if (trigger && trigger.type !== "fixed" && trigger.cooldownDays) {
        next = {
          ...next,
          eventCooldowns: { ...next.eventCooldowns, [eventId]: next.date.dayIndex + trigger.cooldownDays },
        };
      }
    }
  }

  const end = checkEndConditions(next);
  if (end) {
    next = { ...next, status: end.status, gameOverReason: end.reason };
  }

  return next;
}
