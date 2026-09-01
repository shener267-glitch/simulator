import type { Action } from "../../types/action";
import { ACTIONS, CATEGORY_LABELS, CATEGORY_ORDER } from "../../data/actions";
import { useGameDispatch, useGameState } from "../../state/GameContext";

function ActionButton({ action }: { action: Action }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const spent = state.spentActions.includes(action.id);
  const progress = action.repeatable ? 0 : (state.actionProgress[action.id] ?? 0);
  const nextSegment = action.segments[progress];
  const resumed = progress > 0 && !spent;

  if (spent || !nextSegment) {
    return (
      <div className="rounded-xl border border-slate-800/60 px-4 py-3 text-slate-600">
        <span className="text-[0.95rem]">{action.label}</span>
        <span className="ml-2 text-xs">もう済んだ</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "START_ACTION", actionId: action.id })}
      className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-left hover:border-slate-500 hover:bg-slate-800 active:bg-slate-900"
    >
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-medium text-slate-100">
          {action.label}
          {resumed && <span className="ml-2 text-xs font-normal text-sky-400">続きから</span>}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">{action.hint}</span>
      </span>
      <span className="shrink-0 text-sm tabular-nums text-slate-400">{nextSegment.minutes}分</span>
    </button>
  );
}

export function ActionList() {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    actions: ACTIONS.filter((action) => action.category === category),
  })).filter((group) => group.actions.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ category, actions }) => (
        <section key={category} className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {CATEGORY_LABELS[category]}
          </h2>
          {actions.map((action) => (
            <ActionButton key={action.id} action={action} />
          ))}
        </section>
      ))}
    </div>
  );
}
