import { DEFAULT_PROGRAM } from "../data/program";
import { db, type Settings, type WorkoutDB } from "./db";

export const DEFAULT_SETTINGS: Settings = {
  id: "me",
  units: "kg",
  trainingDays: [0, 1, 2, 5],
  experience: "new",
  activeProgramId: DEFAULT_PROGRAM.id,
  defaultRestSec: { compound: 120, isolation: 60 },
  plateMode: "total",
  smallestPlateKg: 1.25,
  wakeLock: true,
  textSize: "normal",
  onboarded: false,
  createdAt: new Date(0).toISOString(),
};

/** Creates the settings row and seeds the default program on first launch. Idempotent. */
export async function ensureSeeded(d: WorkoutDB = db): Promise<Settings> {
  return d.transaction("rw", d.settings, d.programs, async () => {
    let s = await d.settings.get("me");
    if (!s) {
      s = { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() };
      await d.settings.put(s);
    }
    if (!(await d.programs.get(DEFAULT_PROGRAM.id))) {
      await d.programs.put({ ...DEFAULT_PROGRAM, updatedAt: new Date().toISOString() });
    }
    return s;
  });
}

export async function updateSettings(patch: Partial<Settings>, d: WorkoutDB = db): Promise<void> {
  await d.settings.update("me", patch);
}
