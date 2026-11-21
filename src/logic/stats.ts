// Progress numbers for the Journal. Pure functions over logged data, unit-tested.
import type { LoggedSet, WorkoutSession, StretchLog } from "../db/db";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { Muscle } from "../data/types";
import { e1rm } from "./progression";
import { localDate } from "./rotation";

/** Weekly hard-set targets per muscle (research/PROGRAM.md §5, fractional counting, 4-day week, weeks 3+). */
export const WEEKLY_TARGET: Partial<Record<Muscle, number>> = {
  lats: 12, upperBack: 12, rearDelts: 12, chest: 7, frontDelts: 5, sideDelts: 4,
  biceps: 10, triceps: 8, quads: 10, hamstrings: 10.5, glutes: 8.5, calves: 6, abs: 7,
};

export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

/** Fractional hard sets per muscle: a done working set counts 1 for each main muscle, 0.5 for each helper. */
export function weeklySets(sets: LoggedSet[], sessions: WorkoutSession[], from: Date, to: Date): Partial<Record<Muscle, number>> {
  const inRange = new Set(sessions.filter((s) => s.status === "finished" && +new Date(s.startedAt) >= +from && +new Date(s.startedAt) < +to).map((s) => s.id));
  const out: Partial<Record<Muscle, number>> = {};
  for (const x of sets) {
    if (!x.done || x.type === "warmup" || !inRange.has(x.sessionId)) continue;
    const e = EXERCISE_BY_ID[x.exerciseId];
    if (!e) continue;
    for (const m of e.primary) out[m] = (out[m] ?? 0) + 1;
    for (const m of e.secondary) out[m] = (out[m] ?? 0) + 0.5;
  }
  return out;
}

export interface Point { date: string; value: number; label: string }

/** Best estimated 1-rep max per session for one exercise, oldest first (for the progress chart). */
export function e1rmSeries(exerciseId: string, sets: LoggedSet[], sessions: WorkoutSession[]): Point[] {
  const byId = new Map(sessions.filter((s) => s.status === "finished").map((s) => [s.id, s]));
  const best = new Map<string, { v: number; w: number; r: number; date: string }>();
  for (const x of sets) {
    const s = byId.get(x.sessionId);
    if (!s || !x.done || x.type === "warmup" || x.exerciseId !== exerciseId || !x.weight || !x.reps) continue;
    const v = e1rm(x.weight, x.reps);
    const cur = best.get(s.id);
    if (!cur || v > cur.v) best.set(s.id, { v, w: x.weight, r: x.reps, date: s.startedAt });
  }
  return [...best.values()].sort((a, b) => a.date.localeCompare(b.date)).map((b) => ({ date: b.date, value: Math.round(b.v * 10) / 10, label: `${b.w} kg × ${b.r}` }));
}

/** Best set ever per exercise (by estimated 1RM), newest exercises first. */
export function personalBests(sets: LoggedSet[], sessions: WorkoutSession[]): { exerciseId: string; weight: number; reps: number; date: string }[] {
  const finished = new Map(sessions.filter((s) => s.status === "finished").map((s) => [s.id, s.startedAt]));
  const best = new Map<string, { exerciseId: string; weight: number; reps: number; date: string; v: number }>();
  for (const x of sets) {
    const d = finished.get(x.sessionId);
    if (!d || !x.done || x.type === "warmup" || !x.weight || !x.reps) continue;
    const lt = EXERCISE_BY_ID[x.exerciseId]?.loadType;
    if (lt === "assisted" || lt === "time" || lt === "distance") continue;
    const v = e1rm(x.weight, x.reps);
    const cur = best.get(x.exerciseId);
    if (!cur || v > cur.v) best.set(x.exerciseId, { exerciseId: x.exerciseId, weight: x.weight, reps: x.reps, date: d, v });
  }
  return [...best.values()].sort((a, b) => b.date.localeCompare(a.date)).map(({ v: _v, ...r }) => r);
}

/** Activity per local day for the calendar: 0 none, 1 stretch only, 2 workout only, 3 both. */
export function activityByDay(sessions: WorkoutSession[], stretches: StretchLog[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) if (s.status === "finished") { const d = localDate(new Date(s.startedAt)); m.set(d, (m.get(d) ?? 0) | 2); }
  for (const l of stretches) if (l.completed) m.set(l.date, (m.get(l.date) ?? 0) | 1);
  return m;
}
