// The exercise rig: one 3D skeleton with fixed bone lengths, posed by joint angles (forward kinematics)
// and by contact targets (two-bone inverse kinematics), shared by the flat SVG renderer and the 3D renderer.
// Units: metres and degrees. World axes: y up, x = the figure's forward at yaw 0, z = the figure's left.
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

export type V3 = [number, number, number];
export type Side = "L" | "R";

export const LEN = {
  hipHalf: 0.09, lumbar: 0.22, thoracic: 0.28, shoulderHalf: 0.19, shoulderDrop: 0.04,
  neck: 0.1, head: 0.11, upperArm: 0.3, forearm: 0.27, hand: 0.09,
  thigh: 0.44, shin: 0.43, footBack: 0.05, foot: 0.2, ankleUp: 0.0,
};

/** Diameters (m) for drawing and penetration checks. */
export const WIDTH = { thigh: 0.15, shin: 0.11, upperArm: 0.095, forearm: 0.08, hand: 0.07, foot: 0.08, neck: 0.09 };
/** Torso cross-sections: half-depth (front-back) a, half-width (side-side) b. */
export const TORSO = { pelvis: { a: 0.11, b: 0.17 }, waist: { a: 0.1, b: 0.15 }, chest: { a: 0.12, b: 0.2 } };

export interface ArmAngles { flex?: number; abd?: number; rot?: number; elbow?: number }
export interface LegAngles { flex?: number; abd?: number; rot?: number; knee?: number; ankle?: number }
/** A limb is posed by angles, or by a target for the hand / ankle plus a pole (which way the elbow / knee points). */
export interface LimbTarget {
  to: V3;
  pole: V3;
  /** Legs only: the direction the sole should point toward, heel to toe (keeps the foot flat on a platform). */
  sole?: V3;
}

export interface Pose {
  root: { pos: V3; pitch?: number; yaw?: number; roll?: number };
  spine?: { flex?: number; side?: number; twist?: number };
  neck?: { flex?: number; twist?: number };
  armL?: ArmAngles | LimbTarget; armR?: ArmAngles | LimbTarget;
  legL?: LegAngles | LimbTarget; legR?: LegAngles | LimbTarget;
}

export type Joint =
  | "pelvis" | "waist" | "chest" | "neckTop" | "head" | "nose"
  | "hipL" | "kneeL" | "ankleL" | "heelL" | "toeL" | "hipR" | "kneeR" | "ankleR" | "heelR" | "toeR"
  | "shoulderL" | "elbowL" | "wristL" | "handL" | "shoulderR" | "elbowR" | "wristR" | "handR";

export interface Frames { pelvis: Matrix4; waist: Matrix4; chest: Matrix4 }

export interface Solved {
  p: Record<Joint, Vector3>;
  frames: Frames;
  /** Resolved joint angles (degrees), for the anatomical-limit checks. */
  angles: Record<string, number>;
  /** Problems found while solving (unreachable targets). */
  errors: string[];
}

const D = Math.PI / 180;
const isTarget = (x: unknown): x is LimbTarget => !!x && typeof x === "object" && "to" in (x as object);
const v = (a: V3) => new Vector3(a[0], a[1], a[2]);

function rot(flexZ: number, abdX: number, twistY: number): Quaternion {
  // Joint rotation: flex about local z, then abduction about x, then twist about y (applied to the child bone first).
  const qz = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), flexZ * D);
  const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), abdX * D);
  const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), twistY * D);
  return qz.multiply(qx).multiply(qy);
}

const compose = (parent: Matrix4, offset: Vector3, q: Quaternion) =>
  parent.clone().multiply(new Matrix4().compose(offset, q, new Vector3(1, 1, 1)));
const origin = (m: Matrix4) => new Vector3().setFromMatrixPosition(m);
const apply = (m: Matrix4, local: Vector3) => local.clone().applyMatrix4(m);

/**
 * Two-bone IK. Finds joint angles (local to `parent`) so the end of the chain reaches `target`,
 * with the middle joint bending toward `pole`. bendSign: +1 elbow (bends toward local +x), -1 knee.
 * Local joint convention: rest bone points to -y; flex about z, abduction about x, twist about y.
 */
function twoBone(parent: Matrix4, rootLocal: Vector3, l1: number, l2: number, target: V3, pole: V3, bendSign: 1 | -1, side: Side) {
  const inv = parent.clone().invert();
  const root = rootLocal.clone();
  const t = v(target).applyMatrix4(inv).sub(root);
  const pl = v(pole).applyMatrix4(inv).sub(root);
  let d = t.length();
  let error: string | undefined;
  if (d > l1 + l2 - 1e-4) { error = `target out of reach by ${(d - (l1 + l2)).toFixed(3)} m`; d = l1 + l2 - 1e-4; }
  if (d < Math.abs(l1 - l2) + 1e-4) { error = "target too close"; d = Math.abs(l1 - l2) + 1e-4; }
  const dir = t.clone().normalize();
  // Bend plane: from the root toward the pole, minus its component along the chain.
  const polePerp = pl.clone().sub(dir.clone().multiplyScalar(pl.dot(dir)));
  if (polePerp.lengthSq() < 1e-9) polePerp.set(1, 0, 0).sub(dir.clone().multiplyScalar(dir.x));
  polePerp.normalize();
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.min(1, Math.max(-1, cosA)));
  const u = dir.clone().multiplyScalar(Math.cos(A)).add(polePerp.clone().multiplyScalar(Math.sin(A))).normalize(); // upper bone
  const mid = u.clone().multiplyScalar(l1);
  const w = t.clone().sub(mid).normalize(); // lower bone
  // Decompose u = Rz(f) Rx(a) (0,-1,0) = (cos a sin f, -cos a cos f, -sin a)
  const a = -Math.asin(Math.min(1, Math.max(-1, u.z)));
  const f = Math.atan2(u.x, -u.y);
  const qfa = rot(f / D, a / D, 0);
  const X1 = new Vector3(1, 0, 0).applyQuaternion(qfa);
  const Y1 = u.clone().negate();
  const e = Math.acos(Math.min(1, Math.max(-1, u.dot(w))));
  let r = 0;
  const perp = w.clone().sub(u.clone().multiplyScalar(u.dot(w)));
  if (perp.lengthSq() > 1e-9) {
    const Xp = perp.normalize().multiplyScalar(bendSign); // elbow bends toward +x, knee toward -x
    r = Math.atan2(X1.clone().cross(Xp).dot(Y1), X1.dot(Xp));
  }
  void side;
  return { flex: f / D, abd: a / D, rot: r / D, bend: e / D, error };
}

export function solve(pose: Pose): Solved {
  const errors: string[] = [];
  const angles: Record<string, number> = {};
  const R = pose.root;
  const rootQ = new Quaternion().setFromEuler(new Euler((R.roll ?? 0) * D, (R.yaw ?? 0) * D, -(R.pitch ?? 0) * D, "YZX"));
  const pelvis = new Matrix4().compose(v(R.pos), rootQ, new Vector3(1, 1, 1));
  const sp = pose.spine ?? {};
  const half = (x?: number) => (x ?? 0) / 2;
  // Spine flex forward = negative rotation about z (the torso points +y). Split evenly over lumbar and thoracic.
  const spineQ = rot(-half(sp.flex), half(sp.side), half(sp.twist));
  const waist = compose(pelvis, new Vector3(0, 0, 0), new Quaternion()).multiply(new Matrix4().makeRotationFromQuaternion(spineQ));
  const waistTop = compose(waist, new Vector3(0, LEN.lumbar, 0), spineQ);
  const chest = compose(waistTop, new Vector3(0, LEN.thoracic, 0), new Quaternion());
  angles.spineFlex = sp.flex ?? 0;

  const p = {} as Record<Joint, Vector3>;
  p.pelvis = origin(pelvis);
  p.waist = origin(waistTop);
  p.chest = origin(chest);
  const nk = pose.neck ?? {};
  const neckM = compose(chest, new Vector3(0, 0, 0), rot(-(nk.flex ?? 0), 0, nk.twist ?? 0));
  p.neckTop = apply(neckM, new Vector3(0, LEN.neck, 0));
  p.head = apply(neckM, new Vector3(0.015, LEN.neck + LEN.head * 0.95, 0));
  p.nose = apply(neckM, new Vector3(LEN.head + 0.02, LEN.neck + LEN.head * 0.9, 0));

  for (const s of ["L", "R"] as Side[]) {
    const sg = s === "L" ? 1 : -1;
    // ---- leg ----
    const hipLocal = new Vector3(0, 0, sg * LEN.hipHalf);
    const leg = pose[`leg${s}`];
    let L: Required<LegAngles> = { flex: 0, abd: 0, rot: 0, knee: 0, ankle: 0 };
    if (isTarget(leg)) {
      const r = twoBone(pelvis, hipLocal, LEN.thigh, LEN.shin, leg.to, leg.pole, -1, s);
      if (r.error) errors.push(`leg${s}: ${r.error}`);
      L = { flex: r.flex, abd: -sg * r.abd, rot: sg * r.rot, knee: r.bend, ankle: 0 };
    } else if (leg) L = { flex: leg.flex ?? 0, abd: leg.abd ?? 0, rot: leg.rot ?? 0, knee: leg.knee ?? 0, ankle: leg.ankle ?? 0 };
    const hipM = compose(pelvis, hipLocal, rot(L.flex, -sg * L.abd, sg * L.rot));
    const kneeM = compose(hipM, new Vector3(0, -LEN.thigh, 0), rot(-L.knee, 0, 0));
    if (isTarget(leg) && leg.sole) {
      // Ankle angle that points the foot along `sole` (in the shin's bending plane).
      const shinRot = new Quaternion().setFromRotationMatrix(new Matrix4().extractRotation(kneeM)).invert();
      const local = v(leg.sole).normalize().applyQuaternion(shinRot);
      L.ankle = Math.atan2(local.y, local.x) / D;
    }
    const ankleM = compose(kneeM, new Vector3(0, -LEN.shin, 0), rot(L.ankle, 0, 0));
    p[`hip${s}`] = origin(hipM);
    p[`knee${s}`] = origin(kneeM);
    p[`ankle${s}`] = origin(ankleM);
    p[`heel${s}`] = apply(ankleM, new Vector3(-LEN.footBack, -0.06, 0));
    p[`toe${s}`] = apply(ankleM, new Vector3(LEN.foot, -0.06, 0));
    Object.assign(angles, { [`hipFlex${s}`]: L.flex, [`hipAbd${s}`]: L.abd, [`knee${s}`]: L.knee, [`ankle${s}`]: L.ankle });

    // ---- arm ----
    const shLocal = new Vector3(0, -LEN.shoulderDrop, sg * LEN.shoulderHalf);
    const arm = pose[`arm${s}`];
    let A: Required<ArmAngles> = { flex: 0, abd: 0, rot: 0, elbow: 0 };
    if (isTarget(arm)) {
      const r = twoBone(chest, shLocal, LEN.upperArm, LEN.forearm + LEN.hand * 0.5, arm.to, arm.pole, 1, s);
      if (r.error) errors.push(`arm${s}: ${r.error}`);
      A = { flex: r.flex, abd: -sg * r.abd, rot: sg * r.rot, elbow: r.bend };
    } else if (arm) A = { flex: arm.flex ?? 0, abd: arm.abd ?? 0, rot: arm.rot ?? 0, elbow: arm.elbow ?? 0 };
    const shM = compose(chest, shLocal, rot(A.flex, -sg * A.abd, sg * A.rot));
    const elM = compose(shM, new Vector3(0, -LEN.upperArm, 0), rot(A.elbow, 0, 0));
    p[`shoulder${s}`] = origin(shM);
    p[`elbow${s}`] = origin(elM);
    p[`wrist${s}`] = apply(elM, new Vector3(0, -LEN.forearm, 0));
    p[`hand${s}`] = apply(elM, new Vector3(0, -LEN.forearm - LEN.hand * 0.5, 0)); // grip point
    Object.assign(angles, { [`shFlex${s}`]: A.flex, [`shAbd${s}`]: A.abd, [`elbow${s}`]: A.elbow });
  }
  return { p, frames: { pelvis, waist: waistTop, chest }, angles, errors };
}

// ---------- interpolation over a looping timeline ----------
export interface Key { t: number; pose: Pose }

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpV = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function lerpObj<T extends object>(a: T | undefined, b: T | undefined, k: number): T | undefined {
  if (!a && !b) return undefined;
  const out: Record<string, unknown> = {};
  const A = (a ?? {}) as Record<string, unknown>, B = (b ?? {}) as Record<string, unknown>;
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const x = A[key] ?? B[key], y = B[key] ?? A[key];
    out[key] = Array.isArray(x) ? lerpV(x as V3, y as V3, k) : typeof x === "number" ? lerp(x, y as number, k) : x;
  }
  return out as T;
}

export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  return {
    root: lerpObj(a.root, b.root, k)!,
    spine: lerpObj(a.spine, b.spine, k),
    neck: lerpObj(a.neck, b.neck, k),
    armL: lerpObj(a.armL as object, b.armL as object, k) as Pose["armL"],
    armR: lerpObj(a.armR as object, b.armR as object, k) as Pose["armR"],
    legL: lerpObj(a.legL as object, b.legL as object, k) as Pose["legL"],
    legR: lerpObj(a.legR as object, b.legR as object, k) as Pose["legR"],
  };
}

const ease = (k: number) => (1 - Math.cos(Math.PI * k)) / 2;

/** Pose at time t (seconds) on a looping timeline. Keys sorted by t; the last key loops back to the first. */
export function poseAt(keys: Key[], period: number, t: number): Pose {
  const tt = ((t % period) + period) % period;
  for (let i = 0; i < keys.length; i++) {
    const a = keys[i], b = keys[(i + 1) % keys.length];
    const tb = i + 1 < keys.length ? b.t : period;
    if (tt >= a.t && tt <= tb) return lerpPose(a.pose, b.pose, tb === a.t ? 0 : ease((tt - a.t) / (tb - a.t)));
  }
  return keys[0].pose;
}

/** Mirror helper: same limb spec for the other side (z flipped). */
export function mirrorTarget(t: LimbTarget): LimbTarget {
  return { to: [t.to[0], t.to[1], -t.to[2]], pole: [t.pole[0], t.pole[1], -t.pole[2]] };
}
