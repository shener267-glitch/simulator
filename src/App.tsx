import { GameProvider, useGameState } from "./state/GameContext";
import { useAutosave } from "./hooks/useAutosave";
import { useGameClock } from "./hooks/useGameClock";
import { TitleScreen } from "./components/title/TitleScreen";
import { CountrySelectScreen } from "./components/select/CountrySelectScreen";
import { MainGameScreen } from "./components/game/MainGameScreen";

function Game() {
  const state = useGameState();
  useAutosave(state);
  useGameClock();

  switch (state.phase) {
    case "title":
      return <TitleScreen />;
    case "select":
      return <CountrySelectScreen />;
    case "playing":
      return <MainGameScreen />;
  }
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
