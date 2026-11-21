import { createContext, useContext } from "react";
import type { Settings, WorkoutSession } from "./db/db";

export type Tab = "today" | "journal" | "library" | "me";

export type PlayerState =
  | { open: boolean; kind?: undefined }
  | { open: boolean; kind: "workout" }
  | { open: boolean; kind: "stretch"; routineId: "morning" | "evening" | "fallback"; startedAt: string };

export interface AppState {
  settings: Settings;
  tab: Tab;
  setTab: (t: Tab) => void;
  player: PlayerState;
  setPlayer: (p: PlayerState) => void;
  activeSession: WorkoutSession | null;
}

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp outside provider");
  return v;
}
