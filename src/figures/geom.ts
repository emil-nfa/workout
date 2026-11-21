// Geometry shared by the checks and both renderers: joint lookup, item placement, distances, body segments.
import { Euler, Quaternion, Vector3 } from "three";
import { WIDTH, TORSO, type Solved, type V3 } from "./rig";
import type { Item, JointRef, Segment } from "./motion";

export const D = Math.PI / 180;
export const vec = (a: V3) => new Vector3(a[0], a[1], a[2]);

export function jointPos(s: Solved, j: JointRef): Vector3 {
  if (j === "handsMid") return s.p.handL.clone().add(s.p.handR).multiplyScalar(0.5);
  if (j === "feetMid") return s.p.ankleL.clone().add(s.p.ankleR).multiplyScalar(0.5);
  return s.p[j].clone();
}

/** Where an item is this frame (items can follow a joint, e.g. a leg-press platform under the feet). */
const refPos = (s: Solved, r: JointRef | V3) => (Array.isArray(r) ? vec(r) : jointPos(s, r));

/** Dumbbell ends (world) for this frame. */
export function dbEnds(item: Extract<Item, { kind: "db" }>, s: Solved): [Vector3, Vector3] {
  const k = item.hand.slice(-1) as "L" | "R";
  const h = s.p[item.hand];
  let axis: Vector3;
  if (item.grip === "z") axis = new Vector3(0, 0, 1);
  else {
    const fore = h.clone().sub(s.p[`elbow${k}`]).normalize();
    axis = fore.clone().cross(new Vector3(0, 0, 1)).normalize();
    if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0);
  }
  const half = 0.15;
  return [h.clone().add(axis.clone().multiplyScalar(half)), h.clone().sub(axis.clone().multiplyScalar(half))];
}

export function bandEnds(item: Extract<Item, { kind: "band" }>, s: Solved): [Vector3, Vector3] {
  return [refPos(s, item.a), refPos(s, item.b)];
}

export function placed(item: Item, s: Solved): Item {
  if (item.kind === "db") {
    const [a, b] = dbEnds(item, s);
    return { id: item.id, kind: "cyl", a: [a.x, a.y, a.z], b: [b.x, b.y, b.z], r: 0.05, look: "metal", frame: item.frame };
  }
  if (item.kind === "band") return item;
  if (item.kind === "rod") {
    const j = jointPos(s, item.to).add(vec(item.toOffset ?? [0, 0, 0]));
    return { id: item.id, kind: "cyl", a: item.from, b: [j.x, j.y, j.z], r: item.r, look: item.look, frame: item.frame };
  }
  if (item.kind === "cable" || !item.follow) return item;
  const o = jointPos(s, item.follow);
  if (item.kind === "box") return { ...item, center: [o.x + item.center[0], o.y + item.center[1], o.z + item.center[2]] };
  return { ...item, a: [o.x + item.a[0], o.y + item.a[1], o.z + item.a[2]], b: [o.x + item.b[0], o.y + item.b[1], o.z + item.b[2]] };
}

export const boxQuat = (rot?: V3) => new Quaternion().setFromEuler(new Euler((rot?.[0] ?? 0) * D, (rot?.[1] ?? 0) * D, (rot?.[2] ?? 0) * D, "XYZ"));

/** Signed distance from a point to an item's surface (negative = inside). Cables have no volume. */
export function sdItem(item: Item, p: Vector3): number {
  if (item.kind === "box") {
    const local = p.clone().sub(vec(item.center)).applyQuaternion(boxQuat(item.rot).invert());
    const q = new Vector3(Math.abs(local.x) - item.size[0] / 2, Math.abs(local.y) - item.size[1] / 2, Math.abs(local.z) - item.size[2] / 2);
    const outside = new Vector3(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0)).length();
    return outside + Math.min(Math.max(q.x, q.y, q.z), 0);
  }
  if (item.kind === "cyl") {
    const a = vec(item.a), b = vec(item.b), ab = b.clone().sub(a);
    const k = Math.min(1, Math.max(0, p.clone().sub(a).dot(ab) / ab.lengthSq()));
    return p.distanceTo(a.add(ab.multiplyScalar(k))) - item.r;
  }
  return Infinity;
}

export interface Seg { name: Segment; a: Vector3; b: Vector3; r: number }

/** Body as capsules (for penetration checks). Torso uses its narrower half-depth as radius. */
export function bodySegments(s: Solved): Seg[] {
  const p = s.p;
  const out: Seg[] = [];
  for (const k of ["L", "R"] as const) {
    out.push(
      { name: `thigh${k}`, a: p[`hip${k}`], b: p[`knee${k}`], r: WIDTH.thigh / 2 },
      { name: `shin${k}`, a: p[`knee${k}`], b: p[`ankle${k}`], r: WIDTH.shin / 2 },
      { name: `foot${k}`, a: p[`heel${k}`], b: p[`toe${k}`], r: WIDTH.foot / 2 },
      { name: `upperArm${k}`, a: p[`shoulder${k}`], b: p[`elbow${k}`], r: WIDTH.upperArm / 2 },
      { name: `forearm${k}`, a: p[`elbow${k}`], b: p[`hand${k}`], r: WIDTH.forearm / 2 },
    );
  }
  out.push(
    { name: "torsoLow", a: p.pelvis, b: p.waist, r: TORSO.waist.a },
    { name: "torsoUp", a: p.waist, b: p.chest, r: TORSO.chest.a },
    { name: "head", a: p.neckTop, b: p.head, r: 0.1 },
  );
  return out;
}

/** Angle (degrees) between two vectors. */
export const angleBetween = (a: Vector3, b: Vector3) => (Math.acos(Math.min(1, Math.max(-1, a.clone().normalize().dot(b.clone().normalize())))) / D);

/** The chest's forward direction (local +x of the chest frame) in world space. */
export function chestForward(s: Solved): Vector3 {
  return new Vector3(1, 0, 0).applyQuaternion(new Quaternion().setFromRotationMatrix(s.frames.chest)).normalize();
}
