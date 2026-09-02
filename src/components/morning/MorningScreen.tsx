import { PlaceScreen } from "../place/PlaceScreen";
import { TalkRunner } from "../talk/TalkRunner";
import { ActionRunner } from "./ActionRunner";
import { AppointmentScreen } from "./AppointmentScreen";
import { BriefingScreen } from "./BriefingScreen";
import { InterruptNotice } from "./InterruptNotice";
import { WakeScene } from "./WakeScene";
import type { RestingMode } from "../../types/mode";
import { useGameState } from "../../state/GameContext";

function Base({ mode }: { mode: RestingMode }) {
  switch (mode.kind) {
    case "wake":
      return <WakeScene />;
    case "action":
      return <ActionRunner />;
    case "talk":
      return <TalkRunner />;
    // ブリーフィングだけは日程表を出すので、専用の画面を持っている。
    case "appointment":
      return mode.appointmentId === "briefing" ? <BriefingScreen /> : <AppointmentScreen />;
    // 「どのくらい？」は現在地の画面に重ねて出す。
    case "duration":
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
  const base = mode.kind === "interrupt" ? mode.resume : mode;

  return (
    <>
      <Base mode={base} />
      {mode.kind === "interrupt" && <InterruptNotice />}
    </>
  );
}
