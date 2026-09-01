import { ScreenContainer } from "../shared/ScreenContainer";
import { MorningClock } from "./MorningClock";
import { ActionList } from "./ActionList";
import { ActionRunner } from "./ActionRunner";
import { BriefingScreen } from "./BriefingScreen";
import { EventNotice } from "./EventNotice";
import { WakeScene } from "./WakeScene";
import { describeCondition } from "../../engine/condition";
import { useGameState } from "../../state/GameContext";

export function MorningScreen() {
  const state = useGameState();

  if (state.activeAppointmentId === "wake") return <WakeScene />;
  if (state.activeAction) return <ActionRunner />;
  if (state.activeAppointmentId && !state.activeEventId) return <BriefingScreen />;

  return (
    <>
      <ScreenContainer width="narrow">
        <MorningClock />

        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 text-[0.95rem] leading-relaxed text-slate-300">
          {describeCondition(state.condition).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <ActionList />
      </ScreenContainer>

      {state.activeEventId && <EventNotice />}
    </>
  );
}
