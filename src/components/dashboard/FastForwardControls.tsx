import { useGameDispatch } from "../../state/GameContext";

export function FastForwardControls() {
  const dispatch = useGameDispatch();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => dispatch({ type: "ADVANCE_DAY" })}
        className="flex-1 rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
      >
        次の日へ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "FAST_FORWARD" })}
        className="flex-1 rounded-md bg-slate-700 px-4 py-2 font-medium text-slate-100 hover:bg-slate-600"
      >
        次のイベントまで早送り
      </button>
    </div>
  );
}
