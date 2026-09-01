import { EventScreen } from "../shared/EventScreen";
import type { EventDef } from "../../types/events";

export function DiplomaticMeetingScreen({ def }: { def: EventDef }) {
  return <EventScreen def={def} kicker="外交" accent="purple" />;
}
