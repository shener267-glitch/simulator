import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { GameState } from "../types/game";
import { gameReducer, type GameAction } from "./gameReducer";
import { createInitialState } from "./initialState";
import { loadGame } from "./persistence";

const StateContext = createContext<GameState | null>(null);
const DispatchContext = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, () => loadGame() ?? createInitialState());

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useGameState(): GameState {
  const state = useContext(StateContext);
  if (!state) throw new Error("useGameState must be used inside GameProvider");
  return state;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("useGameDispatch must be used inside GameProvider");
  return dispatch;
}
