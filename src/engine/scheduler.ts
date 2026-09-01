import type { GameState } from "../types/game";
import type { EventTrigger } from "../types/events";
import { weightedPick } from "./randomEvents";

export interface SchedulerDeps {
  triggers: EventTrigger[];
  rng?: () => number;
}

/**
 * Picks at most one blocking-eligible event id due for the current day.
 * Priority: fixed > conditional > random (fixed recurring meetings should never
 * get crowded out by a random flavor event on the same day).
 */
export function selectEventForDay(state: GameState, deps: SchedulerDeps): string | null {
  const dayIndex = state.date.dayIndex;
  const rng = deps.rng ?? Math.random;

  const isOnCooldown = (eventId: string, cooldownDays?: number) => {
    if (!cooldownDays) return false;
    const readyAt = state.eventCooldowns[eventId];
    return readyAt !== undefined && dayIndex < readyAt;
  };

  for (const trigger of deps.triggers) {
    if (trigger.type !== "fixed") continue;
    const min = trigger.minDayIndex ?? 0;
    if (dayIndex < min) continue;
    const offset = trigger.offset ?? 0;
    if ((dayIndex - offset) % trigger.everyNDays === 0) {
      return trigger.eventId;
    }
  }

  for (const trigger of deps.triggers) {
    if (trigger.type !== "conditional") continue;
    if (isOnCooldown(trigger.eventId, trigger.cooldownDays)) continue;
    if (trigger.check(state)) return trigger.eventId;
  }

  const randomCandidates = deps.triggers.filter(
    (t): t is Extract<EventTrigger, { type: "random" }> =>
      t.type === "random" &&
      (t.minDayIndex ?? 0) <= dayIndex &&
      !isOnCooldown(t.eventId, t.cooldownDays),
  );
  if (randomCandidates.length === 0) return null;
  const picked = weightedPick(
    randomCandidates.map((t) => ({
      item: t.eventId,
      weight: typeof t.weight === "function" ? t.weight(state) : t.weight,
    })),
    rng,
  );
  return picked;
}
