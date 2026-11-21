// Motion specs: how each exercise moves, the equipment around the body, the camera, and the checks
// that prove the drawing does what the how-to text says (plan: "checking loop", step 1 and 2).
import type { Muscle } from "../data/types";
import { poseAt, type Joint, type Key, type Pose, type Solved, type V3 } from "./rig";

export type JointRef = Joint | "handsMid" | "feetMid";

/** `frame: false` leaves an item out of the camera framing (e.g. the top of a tall column). */
export type Item = { frame?: false; touch?: Segment[] } & (
  | { id: string; kind: "box"; center: V3; size: V3; rot?: V3; follow?: JointRef; look?: "metal" | "pad" | "floor" }
  | { id: string; kind: "cyl"; a: V3; b: V3; r: number; follow?: JointRef; look?: "metal" | "pad" }
  | { id: string; kind: "cable"; from: V3; to: JointRef }
  /** A rigid lever from a fixed pivot to a moving joint (e.g. a pec-deck arm to the handle). */
  | { id: string; kind: "rod"; from: V3; to: JointRef; toOffset?: V3; r: number; look?: "metal" | "pad" }
  /** A dumbbell held in a hand: bar side to side ("z") or along the thumb, palms facing in ("neutral"). */
  | { id: string; kind: "db"; hand: "handL" | "handR"; grip: "z" | "neutral"; heads?: number }
  /** A band or strap stretched between two body points (or a body point and a fixed point). */
  | { id: string; kind: "band"; a: JointRef | V3; b: JointRef | V3; look?: "band" | "strap" }
);

export interface View { name: string; yaw: number; elev: number }

export type Segment =
  | "thighL" | "shinL" | "footL" | "thighR" | "shinR" | "footR"
  | "upperArmL" | "forearmL" | "upperArmR" | "forearmR" | "torsoLow" | "torsoUp" | "head";

export interface CheckResult { name: string; ok: boolean; detail: string }

export interface Motion {
  exerciseId: string;
  period: number; // seconds per rep, loops
  pose: (t: number) => Pose;
  /** Time of the start (A) and end (B) positions, for the arrow, contact sheet and thumbnail. */
  tA: number;
  tB: number;
  items: Item[];
  views: View[]; // first = default
  view3d: View;
  highlight: Muscle[];
  /** Frame the camera on these joints only (close-ups, e.g. the chin tuck). */
  frameJoints?: Joint[];
  arrow?: JointRef;
  /** Draw the arrow from B to A (the working direction, e.g. the leg-press push). */
  arrowReverse?: boolean;
  /** Body points that must stay on an item (distance from the joint centre to the item's surface, metres). */
  contacts: { joint: JointRef; item: string; max: number }[];
  /** Joints that must not move during the rep (metres). */
  fixed: { joint: JointRef; tol: number }[];
  /** Body segments allowed to touch each item (anything else passing through it fails). */
  touch: Record<string, Segment[]>;
  /** Exercise-specific checks, written from the how-to text. */
  checks: { name: string; run: (frames: Solved[], at: (t: number) => Solved) => { ok: boolean; detail: string } }[];
}

export const fromKeys = (keys: Key[], period: number) => (t: number) => poseAt(keys, period, t);

/** Smooth 0..1..0 phase with holds: up over `up` s, hold `top` s, down over `down` s, hold `bottom` s. */
export function phase(t: number, up: number, top: number, down: number, bottom: number): number {
  const P = up + top + down + bottom;
  const x = ((t % P) + P) % P;
  const e = (k: number) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, k)))) / 2;
  if (x < up) return e(x / up);
  if (x < up + top) return 1;
  if (x < up + top + down) return 1 - e((x - up - top) / down);
  return 0;
}

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const mix = (a: V3, b: V3, k: number): V3 => add(scale(a, 1 - k), scale(b, k));
