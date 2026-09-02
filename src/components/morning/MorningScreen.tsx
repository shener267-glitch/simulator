import { ScreenContainer } from "../shared/ScreenContainer";
import { MorningClock } from "./MorningClock";
import { ActionList } from "./ActionList";
import { ActionRunner } from "./ActionRunner";
import { BriefingScreen } from "./BriefingScreen";
import { EventNotice } from "./EventNotice";
import { WakeScene } from "./WakeScene";
import { describeCondition } from "../../engine/condition";
import type { RestingMode } from "../../types/mode";
import { useGameState } from "../../state/GameContext";

/** 現在地の画面。行動を選ぶところ。 */
function PlaceView() {
  const state = useGameState();

  return (
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
  );
}

function Base({ mode }: { mode: RestingMode }) {
  switch (mode.kind) {
    case "wake":
      return <WakeScene />;
    case "action":
      return <ActionRunner />;
    case "appointment":
      return <BriefingScreen />;
    case "place":
      return <PlaceView />;
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
