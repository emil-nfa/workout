import { DEFAULT_PROGRAM } from "../data/program";
import { db, type Settings, type WorkoutDB } from "./db";

export const DEFAULT_SETTINGS: Settings = {
  id: "me",
  units: "kg",
  trainingDays: [0, 1, 2, 5],
  experience: "regular",
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
    const stored = await d.programs.get(DEFAULT_PROGRAM.id);
    // Seed on first launch; later, upgrade the recommended program when its content changes (never a customised one).
    if (!stored || (!stored.customized && stored.version !== DEFAULT_PROGRAM.version)) {
      await d.programs.put({ ...DEFAULT_PROGRAM, updatedAt: new Date().toISOString() });
    }
    return s;
  });
}

/** One-off (22/11/2026): open sessions planned with the old 2-set learning phase, nothing ticked yet, are planned again in full. */
export async function dropLearningPhase(d: WorkoutDB = db): Promise<void> {
  if (await d.meta.get("no-learning-phase")) return;
  await d.transaction("rw", d.sessions, d.sets, d.meta, d.settings, async () => {
    for (const s of await d.sessions.where("status").equals("active").toArray()) {
      const rows = await d.sets.where("sessionId").equals(s.id).toArray();
      if (!rows.some((r) => r.done)) await d.sets.bulkDelete(rows.map((r) => r.id));
    }
    await d.settings.update("me", { experience: "regular" });
    await d.meta.put({ key: "no-learning-phase", value: { at: new Date().toISOString() } });
  });
}

export async function updateSettings(patch: Partial<Settings>, d: WorkoutDB = db): Promise<void> {
  await d.settings.update("me", patch);
}
