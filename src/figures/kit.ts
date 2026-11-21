// Building blocks for motion specs: equipment, common body set-ups, timing and reusable checks.
// Conventions: metres, x = the figure's forward, y up, z = the figure's left. Standing pelvis height 0.95.
import { solve, LEN, type LimbTarget, type Pose, type Solved, type V3 } from "./rig";
import type { Item, Motion, Segment, View } from "./motion";
import { phase } from "./motion";
import type { Muscle } from "../data/types";

export const STAND = 0.95;
export const SEAT = 0.53; // pelvis height seated on a 0.45 m bench
export const SH_UP = LEN.lumbar + LEN.thoracic - LEN.shoulderDrop; // pelvis to shoulder, upright

// ---------- equipment ----------
export const floor = (cx = 0.2, cz = 0, w = 2.4, d = 2): Item => ({ id: "floor", kind: "box", look: "floor", center: [cx, -0.01, cz], size: [w, 0.02, d] });

/** Flat bench: pad + two legs. `along` "x" = bench runs front-back, "z" = side to side. */
export function bench(id: string, x: number, z: number, opts: { len?: number; top?: number; w?: number; along?: "x" | "z"; touch?: Segment[] } = {}): Item[] {
  const len = opts.len ?? 1.15, top = opts.top ?? 0.45, w = opts.w ?? 0.3, ax = (opts.along ?? "x") === "x";
  const size: V3 = ax ? [len, 0.07, w] : [w, 0.07, len];
  const leg = (k: number): Item => ({ id: `${id}Leg${k}`, kind: "box", look: "metal", center: ax ? [x + k * (len / 2 - 0.12), (top - 0.07) / 2, z] : [x, (top - 0.07) / 2, z + k * (len / 2 - 0.12)], size: ax ? [0.08, top - 0.07, w * 0.8] : [w * 0.8, top - 0.07, 0.08], touch: ["shinL", "shinR", "footL", "footR"] });
  return [{ id, kind: "box", look: "pad", center: [x, top - 0.035, z], size, touch: opts.touch ?? ["torsoLow", "torsoUp", "thighL", "thighR", "head", "upperArmL", "upperArmR", "shinL", "shinR", "forearmL", "forearmR", "footL", "footR"] }, leg(1), leg(-1)];
}

/** Cable column with a pulley at `pulleyY`; the column is left out of the camera framing. */
export function column(id: string, x: number, z: number, pulleyY: number, face: "x" | "z" = "x"): { items: Item[]; pulley: V3 } {
  const off = face === "x" ? [-0.13, 0, 0] : [0, 0, z > 0 ? -0.13 : 0.13];
  const pulley: V3 = [x + off[0], pulleyY, z + off[2]];
  return {
    pulley,
    items: [
      { id, kind: "box", look: "metal", frame: false, center: [x, 1.05, z], size: [0.22, 2.1, 0.22] },
      { id: `${id}Pulley`, kind: "cyl", look: "metal", a: [pulley[0], pulley[1] - 0.035, pulley[2]], b: [pulley[0], pulley[1] + 0.035, pulley[2]], r: 0.05 },
    ],
  };
}

export const db = (hand: "handL" | "handR", grip: "z" | "neutral" = "z"): Item => ({ id: `db${hand.slice(-1)}`, kind: "db", hand, grip, touch: [hand === "handL" ? "forearmL" : "forearmR"] });
export const dbs = (grip: "z" | "neutral" = "z"): Item[] => [db("handL", grip), db("handR", grip)];

// ---------- body set-ups ----------
type Leg = LimbTarget;
/** Feet planted (ankles on the floor), knees bending forward. */
export function feet(x = 0, z = 0.12, opts: { toeOut?: number; poleFwd?: number } = {}): { legL: Leg; legR: Leg } {
  const t = ((opts.toeOut ?? 0) * Math.PI) / 180;
  const f = opts.poleFwd ?? 1;
  return {
    legL: { to: [x, 0.08, z], pole: [x + f, 0.55, z + f * Math.sin(t) * 1.4], sole: [Math.cos(t), 0, Math.sin(t)] },
    legR: { to: [x, 0.08, -z], pole: [x + f, 0.55, -z - f * Math.sin(t) * 1.4], sole: [Math.cos(t), 0, -Math.sin(t)] },
  };
}
export const legTo = (to: V3, pole: V3, sole?: V3): Leg => ({ to, pole, sole });
export const armTo = (to: V3, pole: V3): LimbTarget => ({ to, pole });

/** Seated on a bench edge, feet flat on the floor in front. */
export function seated(x = 0, opts: { kneeX?: number; z?: number; pelvisY?: number } = {}): { root: Pose["root"]; legL: Leg; legR: Leg } {
  const kx = x + (opts.kneeX ?? 0.43), z = opts.z ?? 0.13;
  return {
    root: { pos: [x, opts.pelvisY ?? SEAT, 0] },
    legL: { to: [kx, 0.08, z], pole: [kx + 1, 0.7, z], sole: [1, 0, 0] },
    legR: { to: [kx, 0.08, -z], pole: [kx + 1, 0.7, -z], sole: [1, 0, 0] },
  };
}

/** Pose with the arms positioned relative to the solved body (e.g. hands to the head). */
export function withArms(base: Pose, arms: (s: Solved) => Partial<Pick<Pose, "armL" | "armR">>): Pose {
  return { ...base, ...arms(solve(base)) };
}
export const addV = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vOf = (v: { x: number; y: number; z: number }): V3 => [v.x, v.y, v.z];

// ---------- timing ----------
/** A rep: k goes 0 -> 1 over `up` s, holds `top` s, back over `down` s, holds `bottom` s. */
export function rep(up: number, top: number, down: number, bottom: number, f: (k: number) => Pose) {
  return { pose: (t: number) => f(phase(t, up, top, down, bottom)), period: up + top + down + bottom, tA: 0, tB: up + top * 0.5 };
}
/** Alternating sides: first half k for one side, second half for the other. side = +1 / -1. */
export function alt(half: (side: 1 | -1, k: number) => Pose, up: number, top: number, down: number, gap: number) {
  const P = up + top + down + gap;
  return {
    pose: (t: number) => { const tt = ((t % (2 * P)) + 2 * P) % (2 * P); const side = tt < P ? 1 : -1; return half(side, phase(tt % P, up, top, down, gap)); },
    period: 2 * P, tA: 0, tB: up + top * 0.5,
  };
}

// ---------- checks ----------
type Check = Motion["checks"][number];
const fmt = (x: number) => (Math.abs(x) >= 10 ? x.toFixed(0) : x.toFixed(2));
export const chk = {
  /** An angle (from Solved.angles) at time t is within [lo, hi]. */
  angleAt: (name: string, key: string, t: number, lo: number, hi: number): Check => ({ name, run: (_f, at) => { const a = at(t).angles[key]; return { ok: a >= lo && a <= hi, detail: `${key} ${fmt(a)}°` }; } }),
  /** An angle stays within [lo, hi] for the whole rep. */
  angleAlways: (name: string, key: string, lo: number, hi: number): Check => ({ name, run: (f) => { const v = f.map((s) => s.angles[key]); const mn = Math.min(...v), mx = Math.max(...v); return { ok: mn >= lo && mx <= hi, detail: `${key} ${fmt(mn)}..${fmt(mx)}°` }; } }),
  /** A value computed from the pose at time t is within [lo, hi]. */
  valueAt: (name: string, t: number, f: (s: Solved) => number, lo: number, hi: number, unit = "m"): Check => ({ name, run: (_f, at) => { const v = f(at(t)); return { ok: v >= lo && v <= hi, detail: `${fmt(v)} ${unit}` }; } }),
  /** A value stays within [lo, hi] for the whole rep. */
  valueAlways: (name: string, f: (s: Solved) => number, lo: number, hi: number, unit = "m"): Check => ({ name, run: (fr) => { const v = fr.map(f); const mn = Math.min(...v), mx = Math.max(...v); return { ok: mn >= lo && mx <= hi, detail: `${fmt(mn)}..${fmt(mx)} ${unit}` }; } }),
  /** A value changes by at least `min` between tA and tB. */
  moves: (name: string, f: (s: Solved) => number, tA: number, tB: number, min: number, unit = "m"): Check => ({ name, run: (_f, at) => { const d = f(at(tB)) - f(at(tA)); return { ok: Math.abs(d) >= min, detail: `changes ${fmt(d)} ${unit}` }; } }),
};

export interface SpecIn {
  exerciseId: string;
  timing: { pose: (t: number) => Pose; period: number; tA: number; tB: number };
  items?: Item[];
  views?: View[];
  view3d?: View;
  highlight: Muscle[];
  arrow?: Motion["arrow"];
  arrowReverse?: boolean;
  frameJoints?: Motion["frameJoints"];
  contacts?: Motion["contacts"];
  fixed?: Motion["fixed"];
  touch?: Motion["touch"];
  checks?: Motion["checks"];
}
export function spec(s: SpecIn): Motion {
  const views = s.views ?? [{ name: "Side 3/4", yaw: -28, elev: 16 }];
  return {
    exerciseId: s.exerciseId, ...s.timing, items: s.items ?? [floor()], views, view3d: s.view3d ?? views[0],
    highlight: s.highlight, frameJoints: s.frameJoints, arrow: s.arrow, arrowReverse: s.arrowReverse,
    contacts: s.contacts ?? [], fixed: s.fixed ?? [], touch: s.touch ?? {}, checks: s.checks ?? [],
  };
}
