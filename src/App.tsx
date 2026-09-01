import { GameProvider, useGameState } from "./state/GameContext";
import { useAutosave } from "./hooks/useAutosave";
import { MorningScreen } from "./components/morning/MorningScreen";
import { MorningReviewScreen } from "./components/review/MorningReviewScreen";

function Game() {
  const state = useGameState();
  useAutosave(state);

  return state.phase === "review" ? <MorningReviewScreen /> : <MorningScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-full bg-slate-900">
        <Game />
      </div>
    </GameProvider>
  );
}
