import { createContext, useContext, useReducer, type ReactNode } from "react";
import { gameReducer, type GameAction } from "./gameReducer";
import { createNewGame } from "./initialState";
import { loadGame } from "./persistence";
import { useAutosave } from "../hooks/useAutosave";
import type { GameState } from "../types/game";

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<((action: GameAction) => void) | null>(null);

function init(): GameState {
  return loadGame() ?? createNewGame();
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);

  useAutosave(state);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameState {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within a GameProvider");
  return ctx;
}

export function useGameDispatch(): (action: GameAction) => void {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error("useGameDispatch must be used within a GameProvider");
  return ctx;
}
