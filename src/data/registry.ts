import type { PolicyArea } from "../types/policy";
import type { EventDef, EventTrigger } from "../types/events";

import { economyPolicy } from "./policies/economy";
import { diplomacyPolicy } from "./policies/diplomacy";
import { socialPolicy } from "./policies/social";
import { fiscalPolicy } from "./policies/fiscal";
import { privateLifeArea } from "./policies/privateLife";
import { cabinetEvents, cabinetTriggers } from "./cabinetAgendaTemplates";
import { dietEvents, dietTriggers } from "./dietEventTemplates";
import { diplomacyEvents, diplomacyTriggers } from "./diplomacyCounterparts";
import { privateEvents, ambientFlavorEvents, privateTriggers } from "./privateLifeEvents";
import { scandalEvents, scandalTriggers } from "./scandalEvents";

export { factionDefs, countryDefs, familyDefs, INITIAL_DIET_SEATS } from "./factions";

/** Policy areas offered on the main PolicyScreen (private life has its own screen). */
export const policyAreas: PolicyArea[] = [economyPolicy, diplomacyPolicy, socialPolicy, fiscalPolicy];

/** Hobby/rest options offered on PrivateLifeScreen. */
export const privateLifePolicyArea: PolicyArea = privateLifeArea;

const allEventDefs: EventDef[] = [
  ...cabinetEvents,
  ...dietEvents,
  ...diplomacyEvents,
  ...privateEvents,
  ...ambientFlavorEvents,
  ...scandalEvents,
];

export const eventDefs: Record<string, EventDef> = Object.fromEntries(
  allEventDefs.map((def) => [def.id, def]),
);

export const eventTriggers: EventTrigger[] = [
  ...cabinetTriggers,
  ...dietTriggers,
  ...diplomacyTriggers,
  ...privateTriggers,
  ...scandalTriggers,
];
