// Local database (IndexedDB via Dexie). The only store in v2.
// Sync-ready: every primary key is a string id we generate (no auto-increment),
// so dexie-cloud-addon can be added later without migrating data.
import Dexie, { type Table } from "dexie";
import type { Program, SessionKey } from "../data/types";

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export type TextSize = "normal" | "large" | "xlarge";
export type PlateMode = "total" | "perSide";

export interface Settings {
  id: "me";
  name?: string;
  units: "kg";
  bodyweightKg?: number;
  trainingDays: number[]; // 0 = Monday
  experience: "new" | "some" | "regular";
  injuries?: string;
  programStart?: string; // ISO date of the first session
  activeProgramId: string;
  defaultRestSec: { compound: number; isolation: number };
  plateMode: PlateMode;
  smallestPlateKg: number;
  wakeLock: boolean;
  textSize: TextSize;
  lastBackupAt?: string; // ISO datetime
  onboarded: boolean;
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  key: SessionKey | "custom";
  programId: string;
  startedAt: string;
  endedAt?: string;
  status: "active" | "finished" | "discarded";
  deload?: boolean;
  note?: string;
  /** Exercise swaps made during this session: slot index -> exercise id */
  swaps?: Record<number, string>;
}

export type SetType = "warmup" | "working" | "drop";

export interface LoggedSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  slot: number;
  order: number;
  type: SetType;
  weight?: number;
  reps?: number;
  rir?: number;
  durationSec?: number;
  distanceM?: number;
  done: boolean;
  note?: string;
  at?: string; // ISO datetime when ticked
}

export interface ExercisePref {
  exerciseId: string; // primary key
  swapTo?: Record<string, string>; // "A:2" (session:slot) -> exercise id
  loadMode?: PlateMode;
  incrementKg?: number;
  restSec?: number;
  note?: string;
}

export interface StretchLog {
  id: string;
  date: string; // YYYY-MM-DD local
  routine: "morning" | "evening" | "fallback";
  startedAt: string;
  durationSec: number;
  completed: boolean;
}

export interface BodyweightEntry {
  id: string;
  date: string;
  kg: number;
}

export interface StoredProgram extends Program {
  updatedAt: string;
}

export interface MachinePhoto {
  id: string;
  exerciseId: string;
  blob: Blob;
  createdAt: string;
}

export interface Meta {
  key: string;
  value: unknown;
}

export class WorkoutDB extends Dexie {
  settings!: Table<Settings, string>;
  programs!: Table<StoredProgram, string>;
  sessions!: Table<WorkoutSession, string>;
  sets!: Table<LoggedSet, string>;
  exercisePrefs!: Table<ExercisePref, string>;
  stretchLogs!: Table<StretchLog, string>;
  bodyweight!: Table<BodyweightEntry, string>;
  customExercises!: Table<{ id: string; name: string; fr?: string }, string>;
  machinePhotos!: Table<MachinePhoto, string>;
  meta!: Table<Meta, string>;

  constructor(name = "workout") {
    super(name);
    // v1 of the schema. Add new versions below; never edit a released one.
    this.version(1).stores({
      settings: "id",
      programs: "id",
      sessions: "id, startedAt, status, key",
      sets: "id, sessionId, exerciseId, [exerciseId+at]",
      exercisePrefs: "exerciseId",
      stretchLogs: "id, date, routine",
      bodyweight: "id, date",
      customExercises: "id",
      machinePhotos: "id, exerciseId",
      meta: "key",
    });
  }
}

export const db = new WorkoutDB();

export const TABLES = [
  "settings", "programs", "sessions", "sets", "exercisePrefs",
  "stretchLogs", "bodyweight", "customExercises", "machinePhotos", "meta",
] as const;
export type TableName = (typeof TABLES)[number];
