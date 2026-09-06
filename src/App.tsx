import { GameProvider, useGameState } from "./state/GameContext";
import { useAutosave } from "./hooks/useAutosave";
import { useGameClock } from "./hooks/useGameClock";
import { MainScreen } from "./components/main/MainScreen";
import { MeetingScreen } from "./components/meeting/MeetingScreen";

function Game() {
  const state = useGameState();
  useAutosave(state);
  useGameClock();

  return state.mode.kind === "meeting" ? <MeetingScreen /> : <MainScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-full bg-ink text-body antialiased">
        <Game />
      </div>
    </GameProvider>
  );
}
