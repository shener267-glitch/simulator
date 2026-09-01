import { EventScreen } from "./EventScreen";
import type { EventDef } from "../../types/events";

export function IncidentScreen({ def }: { def: EventDef }) {
  const kicker = def.category === "scandal" ? "スキャンダル" : "プライベート";
  const accent = def.category === "scandal" ? "rose" : "amber";
  return <EventScreen def={def} kicker={kicker} accent={accent} />;
}
