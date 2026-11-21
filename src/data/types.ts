// Shared content types. Static content lives in src/data; user data lives in Dexie (src/db).

export type LoadType =
  | "stack" // machine weight stack (kg on the pin)
  | "dumbbell" // kg per dumbbell
  | "plate" // plate-loaded: total or per side (user choice)
  | "bodyweight" // bodyweight, optional added kg
  | "assisted" // assistance kg: lower = harder
  | "time" // seconds held
  | "distance" // metres carried
  | "none"; // mobility / stretch: not logged as sets

export type Muscle =
  | "chest" | "frontDelts" | "sideDelts" | "rearDelts" | "lats" | "upperBack" | "traps"
  | "biceps" | "triceps" | "forearms" | "abs" | "obliques" | "lowerBack" | "glutes"
  | "quads" | "hamstrings" | "adductors" | "calves" | "hipFlexors" | "neck";

export type ExerciseGroup =
  | "Back" | "Chest" | "Shoulders" | "Posture" | "Arms" | "Legs" | "Core" | "Mobility" | "Stretch";

export interface Exercise {
  id: string;
  name: string;
  /** French name, as on the gym's labels */
  fr: string;
  group: ExerciseGroup;
  /** Plain-words list of muscles worked */
  muscles: string;
  /** Equipment, with the likely Technogym / Hammer machine */
  equipment: string;
  loadType: LoadType;
  tags: string[];
  where: "gym" | "home" | "both";
  primary: Muscle[];
  secondary: Muscle[];
  how: string[];
  cues: string[];
  avoid: string[];
  /** The likely machine at Fitness Park Lille "Le 31" (exact models not confirmed: research/PROGRAM.md §2). */
  machine?: string;
  /** Backup when the machine is taken or broken. */
  alternative?: string;
  progression?: string;
  posture?: boolean;
  /** Citation ids into research/RESEARCH.md */
  sources?: string[];
}

export type SessionKey = "A" | "B" | "C" | "D" | "E";

export interface Slot {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  /** For time / distance exercises: target per set */
  target?: string;
  perSide?: boolean;
  restSec: number;
  /** Slots sharing a group letter are a superset, done alternately */
  superset?: string;
}

export interface ProgramSession {
  key: SessionKey;
  title: string;
  subtitle: string;
  kind: "upper" | "lower";
  optional?: boolean;
  slots: Slot[];
}

export interface Program {
  id: string;
  name: string;
  rotation: SessionKey[];
  sessions: ProgramSession[];
}

export interface StretchStep {
  exerciseId: string;
  /** Seconds per side (or total if sides = 1). 0 = rep-based. */
  seconds: number;
  sides: 1 | 2;
  reps?: number;
  /** Proprioceptive neuromuscular facilitation: contract/relax cycles */
  pnf?: { rounds: number; pushSec: number; holdSec: number; startHoldSec: number };
  note?: string;
}

export interface StretchBlock {
  title: string;
  steps: StretchStep[];
}

export interface StretchRoutine {
  id: "morning" | "evening" | "fallback";
  name: string;
  when: string;
  blocks: StretchBlock[];
}
