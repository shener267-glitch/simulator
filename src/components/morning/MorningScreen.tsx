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

        <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
          <p className="font-figure text-[0.6rem] font-medium tracking-label text-brass">CONDITION</p>
          <div className="mt-3 flex flex-col gap-2">
            {describeCondition(state.condition).map((line) => (
              <p key={line} className="text-[0.9rem] leading-[1.9] text-body-muted">
                {line}
              </p>
            ))}
          </div>
        </div>

        <ActionList />
      </ScreenContainer>

      {state.activeEventId && <EventNotice />}
    </>
  );
}
