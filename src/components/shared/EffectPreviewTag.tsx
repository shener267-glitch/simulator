import type { Effect } from "../../types/stats";
import { formatDelta, isGoodDelta } from "../../utils/format";

export function EffectPreviewTags({ effect }: { effect: Effect }) {
  const tags = effect.deltas.filter((d) => d.delta !== 0);
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((d) => (
        <span
          key={d.stat}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isGoodDelta(d.stat, d.delta)
              ? "bg-emerald-900/60 text-emerald-300"
              : "bg-rose-900/60 text-rose-300"
          }`}
        >
          {formatDelta(d.stat, d.delta)}
        </span>
      ))}
    </div>
  );
}
