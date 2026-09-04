import { GameProvider, useGameState } from "./state/GameContext";
import { useAutosave } from "./hooks/useAutosave";
import { DayScreen } from "./components/morning/DayScreen";
import { DayReviewScreen } from "./components/review/DayReviewScreen";

function Game() {
  const state = useGameState();
  useAutosave(state);

  return state.phase === "review" ? <DayReviewScreen /> : <DayScreen />;
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
