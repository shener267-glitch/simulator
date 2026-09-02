import { PlaceScreen } from "../place/PlaceScreen";
import { ActionRunner } from "./ActionRunner";
import { BriefingScreen } from "./BriefingScreen";
import { EventNotice } from "./EventNotice";
import { WakeScene } from "./WakeScene";
import type { RestingMode } from "../../types/mode";
import { useGameState } from "../../state/GameContext";

function Base({ mode }: { mode: RestingMode }) {
  switch (mode.kind) {
    case "wake":
      return <WakeScene />;
    case "action":
      return <ActionRunner />;
    case "appointment":
      return <BriefingScreen />;
    case "place":
      return <PlaceScreen />;
  }
}

/**
 * 画面は mode ひとつで決まる。届いた連絡は下の画面を置き換えるのではなく、
 * その上に重ねる — 戻る先は mode.resume が覚えている。
 */
export function MorningScreen() {
  const state = useGameState();
  const mode = state.mode;
  const base = mode.kind === "event" ? mode.resume : mode;

  return (
    <>
      <Base mode={base} />
      {mode.kind === "event" && <EventNotice />}
    </>
  );
}
