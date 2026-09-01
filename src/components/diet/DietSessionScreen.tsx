import { EventScreen } from "../shared/EventScreen";
import type { EventDef } from "../../types/events";

export function DietSessionScreen({ def }: { def: EventDef }) {
  return <EventScreen def={def} kicker="国会" accent="blue" />;
}
