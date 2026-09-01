import { useState } from "react";
import { GameProvider, useGameState } from "./state/GameContext";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./components/dashboard/Dashboard";
import { PolicyScreen } from "./components/policy/PolicyScreen";
import { FactionScreen } from "./components/faction/FactionScreen";
import { PrivateLifeScreen } from "./components/private/PrivateLifeScreen";
import { CabinetMeetingScreen } from "./components/cabinet/CabinetMeetingScreen";
import { DietSessionScreen } from "./components/diet/DietSessionScreen";
import { DiplomaticMeetingScreen } from "./components/diplomacy/DiplomaticMeetingScreen";
import { IncidentScreen } from "./components/shared/IncidentScreen";
import { GameOverScreen } from "./components/gameover/GameOverScreen";
import { TermEndScreen } from "./components/gameover/TermEndScreen";
import { eventDefs } from "./data/registry";

export type PlayerScreen = "dashboard" | "policy" | "faction" | "private";

function GameRoot() {
  const state = useGameState();
  const [playerScreen, setPlayerScreen] = useState<PlayerScreen>("dashboard");

  if (state.status === "termend") return <TermEndScreen />;
  if (state.status !== "playing") return <GameOverScreen />;

  if (state.activeEvent) {
    const def = eventDefs[state.activeEvent.eventId];
    if (def) {
      switch (def.category) {
        case "cabinet":
          return <CabinetMeetingScreen def={def} />;
        case "diet":
          return <DietSessionScreen def={def} />;
        case "diplomacy":
          return <DiplomaticMeetingScreen def={def} />;
        case "private":
        case "scandal":
          return <IncidentScreen def={def} />;
      }
    }
  }

  switch (playerScreen) {
    case "policy":
      return <PolicyScreen onNavigate={setPlayerScreen} />;
    case "faction":
      return <FactionScreen onNavigate={setPlayerScreen} />;
    case "private":
      return <PrivateLifeScreen onNavigate={setPlayerScreen} />;
    default:
      return <Dashboard onNavigate={setPlayerScreen} />;
  }
}

function App() {
  return (
    <GameProvider>
      <AppShell>
        <GameRoot />
      </AppShell>
    </GameProvider>
  );
}

export default App;
