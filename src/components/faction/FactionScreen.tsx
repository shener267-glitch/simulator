import { useState } from "react";
import { useGameState, useGameDispatch } from "../../state/GameContext";
import { FactionLeaderCard } from "./FactionLeaderCard";
import { ReshuffleModal } from "./ReshuffleModal";
import { ScreenContainer } from "../shared/ScreenContainer";
import { ScreenHeader } from "../shared/ScreenHeader";
import type { PlayerScreen } from "../../App";

const RESHUFFLE_COOLDOWN_ID = "cabinet_reshuffle";

export function FactionScreen({ onNavigate }: { onNavigate: (screen: PlayerScreen) => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showReshuffle, setShowReshuffle] = useState(false);

  const readyAt = state.eventCooldowns[RESHUFFLE_COOLDOWN_ID];
  const onCooldown = readyAt !== undefined && state.date.dayIndex < readyAt;

  return (
    <ScreenContainer>
      <ScreenHeader title="党内・内閣" onBack={() => onNavigate("dashboard")} />

      <div className="flex flex-col gap-3">
        {Object.values(state.factions).map((faction) => (
          <FactionLeaderCard key={faction.id} faction={faction} />
        ))}
      </div>

      <button
        type="button"
        disabled={onCooldown}
        onClick={() => setShowReshuffle(true)}
        className={`rounded-md px-4 py-3 font-medium ${
          onCooldown
            ? "cursor-not-allowed bg-slate-800 text-slate-500"
            : "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {onCooldown ? `内閣改造は Day ${readyAt} まで実施できません` : "内閣改造を行う"}
      </button>

      {showReshuffle && (
        <ReshuffleModal
          onClose={() => setShowReshuffle(false)}
          onConfirm={() => {
            dispatch({ type: "RESHUFFLE_CABINET" });
            setShowReshuffle(false);
            onNavigate("dashboard");
          }}
        />
      )}
    </ScreenContainer>
  );
}
