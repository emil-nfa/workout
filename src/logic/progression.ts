// Progression engine: what to lift today, given what was lifted before. Pure functions, unit-tested.
// Rules (plan §Progression; evidence in research/RESEARCH.md once M0 lands):
// - Double progression: every working set at the top of the rep range last time -> add the smallest step.
// - Below the bottom of the range two exposures in a row at the same weight -> drop ~10 %.
// - Otherwise hold the weight and beat last time's reps.
// - Assisted machines: progress by REDUCING assistance (lower = harder).
// - Ramp-in (first sessions, counted in sessions, not weeks): max 2 sets, ~3 reps in reserve.
// - Deload: half the sets (rounded up), same weight, easy effort.
import type { LoadType } from "../data/types";

export interface PastSet { weight?: number; reps?: number; durationSec?: number; distanceM?: number }
/** One past workout's working sets for this exercise (warm-ups and drop sets excluded). */
export interface Exposure { date: string; sets: PastSet[] }

export interface SlotTarget { sets: number; repMin: number; repMax: number; loadType: LoadType }
export interface Phase { rampIn?: boolean; deload?: boolean }

export type Action = "first" | "add" | "less-help" | "hold" | "drop" | "more-help" | "deload" | "none";

export interface Suggestion {
  action: Action;
  sets: number;
  /** Total kg (plate-loaded: total of plates, both sides). Undefined = no suggestion (first time / bodyweight). */
  weight?: number;
  /** Change vs last time's weight, for the "+2.5" marker. */
  delta?: number;
  /** Rep target per set (time in s / distance in m for those load types). */
  reps: number[];
  /** Reps to keep in reserve (how far from failure to stop). */
  rir: number;
  /** 3-4 word command shown in the chip. */
  chip: string;
}

export const DEFAULT_INCREMENT: Record<LoadType, number> = {
  stack: 2.5, dumbbell: 2, plate: 5, bodyweight: 2.5, assisted: 5, time: 5, distance: 5, none: 0,
};

export const RAMP_IN_SESSIONS = 8;

const round = (x: number, step: number) => (step > 0 ? Math.round(x / step) * step : x);
const fmtKg = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(x * 4 === Math.round(x * 4) ? 2 : 1).replace(/0$/, ""));
const isTimed = (t: LoadType) => t === "time" || t === "distance";
const valueOf = (s: PastSet, t: LoadType) => (t === "time" ? s.durationSec : t === "distance" ? s.distanceM : s.reps) ?? 0;

export function suggest(slot: SlotTarget, history: Exposure[], phase: Phase = {}, increment = DEFAULT_INCREMENT[slot.loadType]): Suggestion {
  const t = slot.loadType;
  let sets = slot.sets;
  let rir = 1;
  if (phase.rampIn) { sets = Math.min(sets, 2); rir = 3; }
  if (phase.deload) { sets = Math.max(1, Math.ceil(slot.sets / 2)); rir = 3; }
  const fill = (n: number) => Array.from({ length: sets }, () => n);

  if (t === "none") return { action: "none", sets, reps: fill(slot.repMax), rir, chip: "" };

  const last = history.find((h) => h.sets.length > 0);
  if (!last) {
    return { action: "first", sets, reps: fill(slot.repMax), rir: Math.max(rir, 3), chip: "Find your weight" };
  }

  const lastW = last.sets[0].weight;
  const values = last.sets.map((s) => valueOf(s, t));

  if (phase.deload) {
    return { action: "deload", sets, weight: lastW, delta: 0, reps: fill(slot.repMin), rir, chip: "Deload: easy sets" };
  }

  // Time / distance: progress the target, not the load (farmer's carry keeps its weight until the top is reached).
  if (isTimed(t)) {
    const top = values.every((v) => v >= slot.repMax);
    const unit = t === "time" ? "s" : "m";
    if (top) return { action: "add", sets, weight: lastW, delta: 0, reps: fill(slot.repMax), rir, chip: `Hold ${slot.repMax} ${unit}` };
    const next = Math.min(slot.repMax, Math.max(...values) + increment);
    return { action: "hold", sets, weight: lastW, delta: 0, reps: fill(next), rir, chip: `Aim ${next} ${unit}` };
  }

  const allTop = values.length > 0 && values.every((v) => v >= slot.repMax);
  const belowMin = (e: Exposure) => e.sets.length > 0 && e.sets.some((s) => valueOf(s, t) < slot.repMin);
  const prev = history.filter((h) => h.sets.length > 0)[1];
  const twoMisses = belowMin(last) && !!prev && belowMin(prev) && prev.sets[0].weight === lastW;
  const beat = (i: number) => Math.min(slot.repMax, Math.max(slot.repMin, (values[i] ?? values[values.length - 1] ?? slot.repMin) + 1));

  // Bodyweight with nothing added: progress by reps; once at the top, add a small weight.
  if (t === "bodyweight" && !lastW) {
    if (allTop) return { action: "add", sets, weight: increment, delta: increment, reps: fill(slot.repMin), rir, chip: `Add ${fmtKg(increment)} kg` };
    return { action: "hold", sets, reps: Array.from({ length: sets }, (_, i) => beat(i)), rir, chip: `Beat ${values[0]} reps` };
  }

  const w = lastW ?? 0;
  if (t === "assisted") {
    if (allTop) {
      const nw = Math.max(0, round(w - increment, increment));
      return { action: "less-help", sets, weight: nw, delta: nw - w, reps: fill(slot.repMin), rir, chip: nw === 0 ? "Try no help" : `Less help: ${fmtKg(nw)} kg` };
    }
    if (twoMisses) {
      const nw = round(w + increment, increment);
      return { action: "more-help", sets, weight: nw, delta: nw - w, reps: fill(slot.repMin), rir, chip: `More help: ${fmtKg(nw)} kg` };
    }
    return { action: "hold", sets, weight: w, delta: 0, reps: Array.from({ length: sets }, (_, i) => beat(i)), rir, chip: `Beat ${values[0]} reps` };
  }

  if (allTop) {
    const nw = round(w + increment, increment / 2);
    return { action: "add", sets, weight: nw, delta: nw - w, reps: fill(slot.repMin), rir, chip: `Add ${fmtKg(nw - w)} kg` };
  }
  if (twoMisses) {
    const nw = Math.max(0, round(w * 0.9, increment / 2));
    const drop = nw < w ? nw : Math.max(0, w - increment);
    return { action: "drop", sets, weight: drop, delta: drop - w, reps: fill(slot.repMin), rir, chip: `Drop to ${fmtKg(drop)} kg` };
  }
  return { action: "hold", sets, weight: w, delta: 0, reps: Array.from({ length: sets }, (_, i) => beat(i)), rir, chip: `Beat ${values[0]} reps` };
}

// ---------- plate-loaded machines: total vs per side ----------
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/** Stored weight is always the total of plates on both sides. */
export const perSide = (total: number) => total / 2;
export const fromPerSide = (side: number) => side * 2;

/** Plates to load on ONE side for a per-side weight, biggest first. Remainder > 0 means it can't be made exactly. */
export function platesPerSide(sideKg: number, available = PLATES_KG): { plates: number[]; remainder: number } {
  const plates: number[] = [];
  let left = Math.round(sideKg * 100) / 100;
  for (const p of available) {
    while (left + 1e-9 >= p) { plates.push(p); left = Math.round((left - p) * 100) / 100; }
  }
  return { plates, remainder: left };
}

/** Whether the deload week is due: ~8 weeks since program start or the last deload. */
export function deloadDue(lastDeloadOrStartISO: string | undefined, now = new Date(), weeks = 8): boolean {
  if (!lastDeloadOrStartISO) return false;
  return now.getTime() - new Date(lastDeloadOrStartISO).getTime() >= weeks * 7 * 86_400_000;
}

/** Estimated one-rep max (Epley). For trends only. */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));
