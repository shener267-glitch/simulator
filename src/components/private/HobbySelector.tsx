import { useGameState, useGameDispatch } from "../../state/GameContext";
import { privateLifePolicyArea } from "../../data/registry";
import { isAreaOnCooldown } from "../../state/selectors";
import { EffectPreviewTags } from "../shared/EffectPreviewTag";
import type { PlayerScreen } from "../../App";

export function HobbySelector({ onNavigate }: { onNavigate: (screen: PlayerScreen) => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const onCooldown = isAreaOnCooldown(state, privateLifePolicyArea.id);
  const readyAt = state.policyCooldowns[privateLifePolicyArea.id];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {privateLifePolicyArea.name}
      </p>
      {onCooldown && <p className="text-sm text-amber-400">Day {readyAt} まで自由時間を取れません</p>}
      <div className="flex flex-col gap-2">
        {privateLifePolicyArea.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={onCooldown}
            onClick={() => {
              dispatch({ type: "SELECT_HOBBY", optionId: option.id });
              onNavigate("dashboard");
            }}
            className={`flex flex-col gap-1 rounded-md border p-3 text-left ${
              onCooldown
                ? "cursor-not-allowed border-slate-800 opacity-50"
                : "border-slate-700 hover:border-slate-500"
            }`}
          >
            <span className="font-medium text-slate-100">{option.label}</span>
            <span className="text-sm text-slate-400">{option.description}</span>
            <EffectPreviewTags effect={option.effect} />
          </button>
        ))}
      </div>
    </div>
  );
}
