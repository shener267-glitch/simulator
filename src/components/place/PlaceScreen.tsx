import { useState } from "react";
import { PlaceHeader } from "./PlaceHeader";
import { CommandBar, type CommandId } from "./CommandBar";
import { ActionSheet } from "./ActionSheet";
import { MoveSheet } from "./MoveSheet";
import { TalkSheet } from "./TalkSheet";
import { ItemSheet } from "./ItemSheet";
import { DurationSheet } from "./DurationSheet";
import { ConditionMeter } from "../shared/ConditionMeter";
import { describeCondition, hungerGauge } from "../../engine/condition";
import { useGameState } from "../../state/GameContext";

/**
 * v0.2の中心画面（設計書3章・30章）。「次へ」を押す場所ではなく、
 * 「今どこにいて、次の予定まで何分あって、その時間を何に使うか」を
 * 毎回決める場所。開いているシートは保存しない — 画面の状態であって、
 * 朝の出来事ではないので。
 */
export function PlaceScreen() {
  const state = useGameState();
  const [panel, setPanel] = useState<CommandId | null>(null);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[27rem] animate-fade-in flex-col px-5">
      <PlaceHeader />

      <div className="flex flex-1 flex-col gap-4 pt-5">
        <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
          <p className="font-figure text-[0.6rem] font-medium tracking-label text-brass">CONDITION</p>

          {/* 疲労はヘッダーに出ているので、ここでは繰り返さない。 */}
          <div className="mt-3.5">
            <ConditionMeter label="空腹" gauge={hungerGauge(state.condition.hunger)} />
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3.5">
            {describeCondition(state.condition).map((line) => (
              <p key={line} className="text-[0.88rem] leading-[1.9] text-body-muted">
                {line}
              </p>
            ))}
          </div>
        </div>

      </div>

      <CommandBar onOpen={setPanel} />

      {state.mode.kind === "duration" && <DurationSheet />}

      {panel === "act" && <ActionSheet onClose={() => setPanel(null)} />}
      {panel === "talk" && <TalkSheet onClose={() => setPanel(null)} />}
      {panel === "move" && <MoveSheet onClose={() => setPanel(null)} />}
      {panel === "item" && <ItemSheet onClose={() => setPanel(null)} />}
    </div>
  );
}
