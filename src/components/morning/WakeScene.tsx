import { ScreenContainer } from "../shared/ScreenContainer";
import { describeCondition } from "../../engine/condition";
import { WAKE_SCENE } from "../../data/briefing";
import { useGameDispatch, useGameState } from "../../state/GameContext";

export function WakeScene() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <ScreenContainer width="narrow">
      <div className="pt-6">
        <p className="text-sm text-slate-500">05:00</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-100">{WAKE_SCENE.title}</h1>
      </div>

      <div className="flex flex-col gap-4 text-[0.95rem] leading-relaxed text-slate-300">
        {WAKE_SCENE.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4 text-[0.95rem] leading-relaxed text-slate-300">
        {describeCondition(state.condition).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "RESOLVE_APPOINTMENT" })}
        className="mt-2 min-h-[52px] w-full rounded-xl bg-sky-600 px-4 font-medium text-white hover:bg-sky-500 active:bg-sky-700"
      >
        起きる
      </button>
    </ScreenContainer>
  );
}
