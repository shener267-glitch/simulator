import { useGameDispatch } from "../../state/GameContext";

/** タイトル画面（指示書1章）。 */
export function TitleScreen() {
  const dispatch = useGameDispatch();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-px w-48 bg-brass/60" />
        <h1 className="text-[1.6rem] font-medium tracking-[0.3em] text-body">NATIONAL</h1>
        <h1 className="text-[1.6rem] font-medium tracking-[0.3em] text-body">STRATEGY</h1>
        <div className="h-px w-48 bg-brass/60" />
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "START" })}
        className="min-h-[52px] min-w-[160px] rounded border border-brass/60 bg-brass/10 px-8 text-[1rem] font-medium tracking-[0.2em] text-brass transition-colors duration-200 hover:bg-brass/20 active:bg-brass/25"
      >
        開始
      </button>
    </div>
  );
}
