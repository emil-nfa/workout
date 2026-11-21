// Motion specs. Each one is written from the exercise's how-to text (src/data/exercises.ts),
// with measurable checks for the key cues. Start with the three hardest (the M3 bake-off).
import { Vector3 } from "three";
import { LEN, type Pose, type Solved, type V3 } from "./rig";
import { add, mix, phase, scale, type Motion } from "./motion";
import { angleBetween, chestForward, D } from "./geom";

const maxOver = (fs: Solved[], f: (s: Solved) => number) => Math.max(...fs.map(f));
const minOver = (fs: Solved[], f: (s: Solved) => number) => Math.min(...fs.map(f));
const r2 = (x: number) => x.toFixed(2);
const r0 = (x: number) => x.toFixed(0);

// ---------------------------------------------------------------- 45° leg press
// "Back and hips flat on the pad. Feet shoulder-width in the middle of the platform. Lower the platform until
//  knees come toward your chest, as deep as you can WITHOUT your lower back peeling off the pad. Push back up.
//  Stop just short of locking the knees."
const LP = (() => {
  // Found with scripts/pose-dump.mjs sweeps: feet a bit high on the platform, knees to ~90° at the bottom.
  const FEET_HIGH = 0.14, D_TOP = 0.853, D_BOTTOM = 0.595;
  const pelvis: V3 = [0, 0.56, 0];
  const recline = 70; // back pad about 20° above horizontal (checked: keeps ankle and hip angles in range)
  const up: V3 = [-Math.sin(recline * D), Math.cos(recline * D), 0]; // torso axis
  const fwd: V3 = [Math.cos(recline * D), Math.sin(recline * D), 0]; // chest-facing direction
  const rail: V3 = [Math.SQRT1_2, Math.SQRT1_2, 0]; // the sled moves on a 45° line
  const sole: V3 = [-Math.SQRT1_2, Math.SQRT1_2, 0]; // heel to toe along the platform, toes up
  const hipZ = LEN.hipHalf, footZ = 0.13;
  const high: V3 = [-Math.SQRT1_2, Math.SQRT1_2, 0]; // feet sit a little high on the platform: less ankle bend
  const legAt = (z: number, d: number) => ({
    to: add(add([0, pelvis[1], z], scale(rail, d)), scale(high, FEET_HIGH)) as V3,
    pole: [0.35, pelvis[1] + 0.9, z * 1.3] as V3, // knees bend up toward the chest
    sole,
  });
  const handZ = 0.27;
  const grip = (z: number): V3 => [0.02, pelvis[1] - 0.02, z];
  const pose = (k: number): Pose => {
    const d = D_TOP - (D_TOP - D_BOTTOM) * k; // k = 0 top (legs long), 1 bottom (deep)
    return {
      root: { pos: pelvis, pitch: -recline },
      neck: { flex: 22 },
      legL: legAt(footZ, d), legR: legAt(-footZ, d),
      armL: { to: grip(handZ), pole: [-0.25, 0.95, 0.7] },
      armR: { to: grip(-handZ), pole: [-0.25, 0.95, -0.7] },
    };
  };
  const at = (t: number) => pose(phase(t, 1.8, 0.4, 1.2, 0.5)); // lower slowly, pause, press, pause
  void hipZ;
  const m: Motion = {
    exerciseId: "leg_press",
    period: 3.9,
    pose: at,
    tA: 0, tB: 2.0,
    items: [
      { id: "backpad", kind: "box", look: "pad", center: add(add(pelvis, scale(up, 0.36)), scale(fwd, -0.16)), size: [0.07, 0.8, 0.46], rot: [0, 0, recline] },
      { id: "seat", kind: "box", look: "pad", center: add(pelvis, [0.07, -0.15, 0]), size: [0.42, 0.07, 0.46], rot: [0, 0, 12] },
      { id: "frame", kind: "box", look: "metal", center: [0.02, 0.24, 0], size: [0.34, 0.48, 0.3] },
      { id: "platform", kind: "box", look: "metal", follow: "feetMid", center: scale(rail, 0.085), size: [0.04, 0.62, 0.62], rot: [0, 0, 45] },
      { id: "railL", kind: "cyl", look: "metal", a: add([0, pelvis[1], 0.42], scale(rail, 0.15)), b: add([0, pelvis[1], 0.42], scale(rail, 1.35)), r: 0.025 },
      { id: "railR", kind: "cyl", look: "metal", a: add([0, pelvis[1], -0.42], scale(rail, 0.15)), b: add([0, pelvis[1], -0.42], scale(rail, 1.35)), r: 0.025 },
      { id: "handleL", kind: "cyl", look: "metal", a: add(grip(handZ), [-0.07, 0, 0]), b: add(grip(handZ), [0.07, 0, 0]), r: 0.018 },
      { id: "handleR", kind: "cyl", look: "metal", a: add(grip(-handZ), [-0.07, 0, 0]), b: add(grip(-handZ), [0.07, 0, 0]), r: 0.018 },
      { id: "floor", kind: "box", look: "floor", center: [0.3, -0.01, 0], size: [2.4, 0.02, 1.2] },
    ],
    views: [{ name: "Side", yaw: 0, elev: 8 }, { name: "Above", yaw: 38, elev: 38 }],
    view3d: { name: "Above", yaw: 32, elev: 30 },
    highlight: ["quads", "glutes"],
    arrow: "feetMid",
    arrowReverse: true, // show the push (bottom to top)
    contacts: [
      { joint: "ankleL", item: "platform", max: 0.085 }, { joint: "ankleR", item: "platform", max: 0.085 },
      { joint: "waist", item: "backpad", max: 0.13 }, { joint: "chest", item: "backpad", max: 0.15 },
      { joint: "pelvis", item: "seat", max: 0.13 },
      { joint: "handL", item: "handleL", max: 0.02 }, { joint: "handR", item: "handleR", max: 0.02 },
    ],
    fixed: [{ joint: "pelvis", tol: 0.005 }, { joint: "chest", tol: 0.005 }, { joint: "handL", tol: 0.005 }],
    touch: {
      backpad: ["torsoLow", "torsoUp", "head", "upperArmL", "upperArmR"],
      seat: ["torsoLow", "thighL", "thighR"],
      platform: ["footL", "footR", "shinL", "shinR"],
      handleL: ["forearmL"], handleR: ["forearmR"],
      frame: [], railL: [], railR: [], floor: [],
    },
    checks: [
      { name: "Deep at the bottom: knees bent 90-115°", run: (_f, at) => { const k = at(2.0).angles.kneeL; return { ok: k >= 90 && k <= 115, detail: `knee ${r0(k)}°` }; } },
      { name: "Not locked at the top: knees still bent 10-25°", run: (_f, at) => { const k = at(0).angles.kneeL; return { ok: k >= 10 && k <= 25, detail: `knee ${r0(k)}°` }; } },
      { name: "Feet travel on the 45° line", run: (_f, at) => { const d = at(0).p.ankleL.clone().sub(at(2.0).p.ankleL); const a = Math.atan2(d.y, d.x) / D; return { ok: Math.abs(a - 45) < 3, detail: `${r0(a)}°` }; } },
      { name: "Lower back can stay on the pad: hip flexion ≤ 125°", run: (fs) => { const h = maxOver(fs, (s) => s.angles.hipFlexL); return { ok: h <= 125, detail: `max hip flexion ${r0(h)}°` }; } },
      { name: "Feet flat on the platform (toe and heel on it)", run: (fs) => { const g = maxOver(fs, (s) => Math.abs(s.p.toeL.clone().sub(s.p.heelL).dot(new Vector3(...rail)))); return { ok: g < 0.01, detail: `tilt ${r2(g)} m` }; } },
      { name: "Knees track over the toes (no caving in)", run: (fs) => { const c = minOver(fs, (s) => s.p.kneeL.z - LEN.hipHalf * 0.8); return { ok: c > 0, detail: `knee z margin ${r2(c)} m` }; } },
    ],
  };
  return m;
})();

// ---------------------------------------------------------------- Pallof press
// "Stand side-on to the pulley, handle at your sternum with both hands. Press the handle straight out in front,
//  hold 2 s without letting your body twist, bring it back."
const PP = (() => {
  const pelvisY = 0.925;
  const ank = (z: number) => ({ to: [0, 0.08, z] as V3, pole: [1, 0.5, z * 1.4] as V3, sole: [1, 0, 0] as V3 });
  const hands = (x: number, side: 1 | -1) => ({ to: [x, 1.24, side * 0.035] as V3, pole: [-0.1, 0.85, side * 0.55] as V3 });
  const pulley: V3 = [0.3, 1.24, 1.05];
  const pose = (k: number): Pose => {
    const x = 0.21 + (0.57 - 0.21) * k;
    return {
      root: { pos: [0, pelvisY, 0], pitch: 4 },
      spine: { flex: -4 },
      legL: ank(0.16), legR: ank(-0.16),
      armL: hands(x, 1), armR: hands(x, -1),
    };
  };
  const m: Motion = {
    exerciseId: "pallof",
    period: 4.6,
    pose: (t) => pose(phase(t, 1.0, 2.0, 1.1, 0.5)),
    tA: 0, tB: 1.5,
    items: [
      { id: "column", kind: "box", look: "metal", frame: false, center: [0.3, 1.0, 1.22], size: [0.24, 2.0, 0.2] },
      { id: "pulley", kind: "cyl", look: "metal", a: [0.3, 1.24, 1.1], b: [0.3, 1.24, 1.13], r: 0.05 },
      { id: "cable", kind: "cable", from: pulley, to: "handsMid" },
      { id: "handle", kind: "cyl", look: "metal", follow: "handsMid", a: [0, -0.05, 0], b: [0, 0.05, 0], r: 0.02 },
      { id: "floor", kind: "box", look: "floor", center: [0.2, -0.01, 0.4], size: [1.6, 0.02, 2.0] },
    ],
    views: [{ name: "Above", yaw: -62, elev: 60 }, { name: "Side", yaw: -12, elev: 22 }],
    view3d: { name: "Above", yaw: -58, elev: 52 },
    highlight: ["obliques", "abs"],
    arrow: "handsMid",
    contacts: [{ joint: "handsMid", item: "handle", max: 0.03 }, { joint: "ankleL", item: "floor", max: 0.1 }, { joint: "ankleR", item: "floor", max: 0.1 }],
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "chest", tol: 0.003 }, { joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
    touch: { column: [], pulley: [], handle: ["forearmL", "forearmR"], floor: ["footL", "footR"] },
    checks: [
      { name: "Handle starts at the sternum", run: (_f, at) => { const s = at(0); const h = s.p.handL.clone().add(s.p.handR).multiplyScalar(0.5); const dy = h.y - (s.p.chest.y - 0.15); return { ok: Math.abs(dy) < 0.06 && h.x < 0.25, detail: `${r2(dy)} m from sternum height, ${r2(h.x)} m out` }; } },
      { name: "Presses straight forward (no drift up/down or sideways)", run: (_f, at) => { const a = at(0), b = at(1.5); const d = b.p.handL.clone().sub(a.p.handL); return { ok: Math.abs(d.y) < 0.02 && Math.abs(d.z) < 0.02 && d.x > 0.25, detail: `forward ${r2(d.x)}, up ${r2(d.y)}, side ${r2(d.z)} m` }; } },
      { name: "Arms long at the end (elbows ≤ 30°)", run: (_f, at) => { const e = Math.max(at(1.5).angles.elbowL, at(1.5).angles.elbowR); return { ok: e <= 30, detail: `elbow ${r0(e)}°` }; } },
      { name: "Body does not twist toward the machine", run: (fs) => { const a = maxOver(fs, (s) => angleBetween(chestForward(s), chestForward(fs[0]))); return { ok: a < 1, detail: `chest turns ${a.toFixed(1)}°` }; } },
      { name: "Cable pulls from the side (perpendicular-ish to the press)", run: (_f, at) => { const s = at(1.5); const h = s.p.handL.clone().add(s.p.handR).multiplyScalar(0.5); const c = new Vector3(...pulley).sub(h); const a = angleBetween(c, new Vector3(1, 0, 0)); return { ok: a > 60 && a < 120, detail: `${r0(a)}° to the press line` }; } },
    ],
  };
  return m;
})();

// ---------------------------------------------------------------- Reverse pec deck
// "Sit facing the machine, chest on the pad, handles at shoulder height. With almost straight arms, sweep the
//  handles out and back in a wide arc. Stop when arms are in line with your body, squeeze 1 s, return slowly.
//  Keep shoulders down."
const RP = (() => {
  const pelvis: V3 = [0, 0.53, 0];
  const legs = (z: number) => ({ to: [0.43, 0.09, z] as V3, pole: [1, 0.6, z] as V3, sole: [1, 0, 0] as V3 });
  const shoulder = (side: 1 | -1): V3 => [0.0, pelvis[1] + LEN.lumbar + LEN.thoracic - LEN.shoulderDrop, side * LEN.shoulderHalf];
  const reach = 0.611; // elbows soft (~20°)
  const hand = (side: 1 | -1, h: number): V3 => add(shoulder(side), [reach * Math.cos(h * D), -0.02, side * reach * Math.sin(h * D)]);
  const pose = (k: number): Pose => {
    const h = -14 + (86 - -14) * k; // angle from straight ahead, outward
    return {
      root: { pos: pelvis, pitch: 6 },
      spine: { flex: -6 },
      neck: { flex: 5 },
      legL: legs(0.13), legR: legs(-0.13),
      armL: { to: hand(1, h), pole: add(hand(1, h), [-0.3, -0.6, 0.25]) },
      armR: { to: hand(-1, h), pole: add(hand(-1, h), [-0.3, -0.6, -0.25]) },
    };
  };
  const at = (t: number) => pose(phase(t, 1.1, 1.0, 2.0, 0.3));
  const pivotY = 1.38;
  const m: Motion = {
    exerciseId: "reverse_pec",
    period: 4.4,
    pose: at,
    tA: 0, tB: 1.6,
    items: [
      { id: "chestpad", kind: "box", look: "pad", center: [0.19, 0.82, 0], size: [0.07, 0.46, 0.28] },
      { id: "padpost", kind: "box", look: "metal", center: [0.3, 0.55, 0], size: [0.06, 0.25, 0.06] },
      { id: "seat", kind: "box", look: "pad", center: [0.0, 0.405, 0], size: [0.38, 0.07, 0.4] },
      { id: "seatpost", kind: "box", look: "metal", center: [0.0, 0.19, 0], size: [0.08, 0.36, 0.08] },
      { id: "column", kind: "box", look: "metal", frame: false, center: [0.88, 0.85, 0], size: [0.14, 1.7, 0.34] },
      { id: "beam", kind: "cyl", look: "metal", a: [0.88, pivotY, 0], b: [0.55, pivotY, 0], r: 0.03 },
      { id: "hub", kind: "cyl", look: "metal", a: [0.55, pivotY - 0.06, 0], b: [0.55, pivotY + 0.06, 0], r: 0.05 },
      { id: "leverL", kind: "rod", look: "metal", from: [0.55, pivotY, 0.04], to: "handL", toOffset: [0, 0.09, 0], r: 0.018 },
      { id: "leverR", kind: "rod", look: "metal", from: [0.55, pivotY, -0.04], to: "handR", toOffset: [0, 0.09, 0], r: 0.018 },
      { id: "handleL", kind: "cyl", look: "metal", follow: "handL", a: [0, -0.09, 0], b: [0, 0.09, 0], r: 0.018 },
      { id: "handleR", kind: "cyl", look: "metal", follow: "handR", a: [0, -0.09, 0], b: [0, 0.09, 0], r: 0.018 },
      { id: "floor", kind: "box", look: "floor", center: [0.3, -0.01, 0], size: [1.8, 0.02, 1.6] },
    ],
    views: [{ name: "Behind 3/4", yaw: 112, elev: 40 }, { name: "Behind", yaw: 90, elev: 38 }],
    view3d: { name: "Behind 3/4", yaw: 112, elev: 34 },
    highlight: ["rearDelts", "upperBack"],
    arrow: "handL",
    contacts: [
      { joint: "chest", item: "chestpad", max: 0.25 }, { joint: "waist", item: "chestpad", max: 0.15 },
      { joint: "pelvis", item: "seat", max: 0.11 },
      { joint: "ankleL", item: "floor", max: 0.1 }, { joint: "ankleR", item: "floor", max: 0.1 },
      { joint: "handL", item: "handleL", max: 0.02 },
    ],
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "shoulderL", tol: 0.003 }, { joint: "shoulderR", tol: 0.003 }],
    touch: {
      chestpad: ["torsoUp", "torsoLow"], seat: ["torsoLow", "thighL", "thighR"], floor: ["footL", "footR"],
      padpost: [], seatpost: ["shinL", "shinR"], column: [], beam: [], hub: [], handleL: ["forearmL"], handleR: ["forearmR"],
      leverL: ["forearmL", "upperArmL"], leverR: ["forearmR", "upperArmR"],
    },
    checks: [
      { name: "Handles at shoulder height the whole time", run: (fs) => { const d = maxOver(fs, (s) => Math.abs(s.p.handL.y - s.p.shoulderL.y)); return { ok: d < 0.05, detail: `max ${r2(d)} m off` }; } },
      { name: "Arms almost straight (elbows ≤ 30°)", run: (fs) => { const e = maxOver(fs, (s) => s.angles.elbowL); return { ok: e <= 30, detail: `max elbow ${r0(e)}°` }; } },
      { name: "Ends with arms in line with the body", run: (_f, at) => { const s = at(1.6); const dx = s.p.handL.x - s.p.shoulderL.x; return { ok: Math.abs(dx) < 0.1, detail: `hand ${r2(dx)} m ahead of the shoulder` }; } },
      { name: "Starts with arms straight ahead", run: (_f, at) => { const s = at(0); const v = s.p.handL.clone().sub(s.p.shoulderL); const a = Math.atan2(v.z, v.x) / D; return { ok: Math.abs(a) < 20, detail: `${r0(a)}° from straight ahead` }; } },
      { name: "Shoulders stay down (no shrug)", run: (fs) => { const d = maxOver(fs, (s) => Math.abs(s.p.shoulderL.y - fs[0].p.shoulderL.y)); return { ok: d < 0.005, detail: `${r2(d)} m` }; } },
      { name: "Sweep is a wide arc (hands move ≥ 0.6 m)", run: (_f, at) => { const d = at(0).p.handL.distanceTo(at(1.6).p.handL); return { ok: d >= 0.6, detail: `${r2(d)} m` }; } },
    ],
  };
  return m;
})();

export const MOTIONS: Record<string, Motion> = { leg_press: LP, pallof: PP, reverse_pec: RP };
export const BAKEOFF = ["leg_press", "pallof", "reverse_pec"] as const;
void mix;
