import { FamilyPanel } from "./FamilyPanel";
import { HealthStressPanel } from "./HealthStressPanel";
import { HobbySelector } from "./HobbySelector";
import { ScreenContainer } from "../shared/ScreenContainer";
import { ScreenHeader } from "../shared/ScreenHeader";
import type { PlayerScreen } from "../../App";

export function PrivateLifeScreen({ onNavigate }: { onNavigate: (screen: PlayerScreen) => void }) {
  return (
    <ScreenContainer>
      <ScreenHeader title="総理のプライベート" onBack={() => onNavigate("dashboard")} />

      <HealthStressPanel />
      <FamilyPanel />
      <HobbySelector onNavigate={onNavigate} />
    </ScreenContainer>
  );
}
