import { useState } from "react";
import { useGameState, useGameDispatch } from "../../state/GameContext";
import { policyAreas } from "../../data/registry";
import { isAreaOnCooldown } from "../../state/selectors";
import { PolicyAreaCard } from "./PolicyAreaCard";
import { PolicyOptionModal } from "./PolicyOptionModal";
import { ScreenContainer } from "../shared/ScreenContainer";
import { ScreenHeader } from "../shared/ScreenHeader";
import type { PlayerScreen } from "../../App";

export function PolicyScreen({ onNavigate }: { onNavigate: (screen: PlayerScreen) => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const selectedArea = policyAreas.find((a) => a.id === selectedAreaId) ?? null;

  return (
    <ScreenContainer>
      <ScreenHeader title="政策決定" onBack={() => onNavigate("dashboard")} />

      <div className="flex flex-col gap-3">
        {policyAreas.map((area) => (
          <PolicyAreaCard
            key={area.id}
            area={area}
            onCooldown={isAreaOnCooldown(state, area.id)}
            readyAtDayIndex={state.policyCooldowns[area.id]}
            onSelect={() => setSelectedAreaId(area.id)}
          />
        ))}
      </div>

      {selectedArea && (
        <PolicyOptionModal
          area={selectedArea}
          onClose={() => setSelectedAreaId(null)}
          onChoose={(optionId) => {
            dispatch({ type: "SELECT_POLICY", areaId: selectedArea.id, optionId });
            setSelectedAreaId(null);
            onNavigate("dashboard");
          }}
        />
      )}
    </ScreenContainer>
  );
}
