import type { Action } from "../../types/action";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../../data/actions";
import { actionsAt } from "../../engine/places";
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
      <div className="flex min-h-[60px] items-center justify-between gap-3 rounded-2xl border border-line/50 px-4 py-3">
        <span className="text-[0.95rem] text-body-faint">{action.label}</span>
        <span className="shrink-0 text-[0.7rem] text-body-faint">済んだ</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "START_ACTION", actionId: action.id })}
      className="group flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border border-line bg-ink-panel px-4 py-3 text-left transition-colors duration-200 hover:border-brass/40 hover:bg-ink-raised active:bg-ink-raised"
    >
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-medium text-body">
          {action.label}
          {resumed && <span className="ml-2 text-[0.7rem] font-normal text-brass">続きから</span>}
        </span>
        <span className="mt-1 block truncate text-[0.78rem] text-body-muted">{action.hint}</span>
      </span>
      <span className="figures shrink-0 rounded-full border border-line px-2.5 py-1 text-[0.75rem] text-body-muted transition-colors duration-200 group-hover:border-brass/40 group-hover:text-brass">
        {nextSegment.minutes}分
      </span>
    </button>
  );
}

export function ActionList() {
  const state = useGameState();
  // 現在地でできないことは並べない（設計書16章）。
  const here = actionsAt(state.place);
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    actions: here.filter((action) => action.category === category),
  })).filter((group) => group.actions.length > 0);

  return (
    <div className="flex flex-col gap-7">
      {grouped.map(({ category, actions }) => (
        <section key={category} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[0.72rem] font-medium tracking-[0.2em] text-body-muted">
              {CATEGORY_LABELS[category]}
            </h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          {actions.map((action) => (
            <ActionButton key={action.id} action={action} />
          ))}
        </section>
      ))}
    </div>
  );
}
