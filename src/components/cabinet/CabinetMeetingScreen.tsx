import { EventScreen } from "../shared/EventScreen";
import type { EventDef } from "../../types/events";

export function CabinetMeetingScreen({ def }: { def: EventDef }) {
  return <EventScreen def={def} kicker="閣議" accent="amber" />;
}
