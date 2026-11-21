// Upper-body motion specs, each written from its how-to text (src/data/exercises.ts).
import { solve, type Pose, type V3 } from "./rig";
import type { Item, Motion } from "./motion";
import { add, mix, scale } from "./motion";
import { D, angleBetween, chestForward } from "./geom";
import { STAND, SEAT, SH_UP, armTo, bench, chk, column, db, dbs, feet, floor, rep, seated, spec } from "./kit";

const sh = (pelvisY: number, pitch = 0, side: 1 | -1 = 1, px = 0): V3 => [px + Math.sin(pitch * D) * SH_UP, pelvisY + Math.cos(pitch * D) * SH_UP, side * 0.19];
const lerp3 = mix;
const both = (f: (side: 1 | -1) => ReturnType<typeof armTo>) => ({ armL: f(1), armR: f(-1) });
const zs = (v: V3, side: 1 | -1): V3 => [v[0], v[1], side * v[2]];

// ---------- Chest-supported row ----------
// "Chest stays glued to the pad. Start with arms straight. Pull elbows back past your ribs, squeezing the
//  shoulder blades together and down. Pause, then let the weight go back slowly."
const rowChest = (() => {
  const pitch = 20, base = seated(0, { kneeX: 0.46 });
  const fwd: V3 = [Math.cos(pitch * D), -Math.sin(pitch * D), 0], up: V3 = [Math.sin(pitch * D), Math.cos(pitch * D), 0];
  const pad = add(add(base.root.pos, scale(up, 0.3)), scale(fwd, 0.17));
  const start: V3 = [0.76, 0.82, 0.2], end: V3 = [0.26, 0.85, 0.24];
  const pose = (k: number): Pose => ({ ...base, root: { ...base.root, pitch }, neck: { flex: -10 }, ...both((s) => armTo(zs(lerp3(start, end, k), s), [-0.4, 0.95, s * 0.45])) });
  return spec({
    exerciseId: "row_chest", timing: rep(1.1, 0.8, 1.9, 0.4, pose),
    items: [
      floor(),
      { id: "pad", kind: "box", look: "pad", center: pad, size: [0.07, 0.42, 0.3], rot: [0, 0, -pitch], touch: ["torsoUp", "torsoLow"] },
      { id: "seat", kind: "box", look: "pad", center: [0, 0.405, 0], size: [0.38, 0.07, 0.4], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "post", kind: "box", look: "metal", center: [0.02, 0.19, 0], size: [0.08, 0.36, 0.08], touch: ["shinL", "shinR"] },
      { id: "frame", kind: "box", look: "metal", frame: false, center: [1.0, 0.75, 0], size: [0.12, 1.5, 0.5] },
      { id: "leverL", kind: "rod", look: "metal", from: [0.98, 1.3, 0.22], to: "handL", toOffset: [0, 0.06, 0], r: 0.02, touch: ["forearmL"] },
      { id: "leverR", kind: "rod", look: "metal", from: [0.98, 1.3, -0.22], to: "handR", toOffset: [0, 0.06, 0], r: 0.02, touch: ["forearmR"] },
    ],
    views: [{ name: "Side 3/4", yaw: -35, elev: 22 }],
    highlight: ["upperBack", "lats", "rearDelts"],
    arrow: "handL",
    contacts: [{ joint: "chest", item: "pad", max: 0.2 }, { joint: "pelvis", item: "seat", max: 0.11 }],
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.angleAt("Arms straight at the start (full stretch)", "elbowL", 0, 0, 25),
      chk.valueAt("Elbows travel past the ribs at the end", 1.5, (s) => s.p.chest.x - s.p.elbowL.x, 0.15, 0.6),
      chk.valueAlways("Pull is level, not a shrug (hand height steady)", (s) => s.p.handL.y, 0.8, 0.9),
    ],
  });
})();

// ---------- Machine chest press ----------
// "Handles level with mid-chest. Shoulder blades back and down into the pad. Press until arms are straight
//  but not locked. Return slowly until you feel a stretch across the chest. Wrists straight over elbows."
const chestPress = (() => {
  const pitch = -6, base = seated(0, { kneeX: 0.42 });
  const shL = sh(SEAT, pitch);
  const start: V3 = [0.13, 0.86, 0.26], end: V3 = [0.547, 0.88, 0.2];
  const pose = (k: number): Pose => ({ ...base, root: { ...base.root, pitch }, ...both((s) => armTo(zs(lerp3(start, end, k), s), [0.1, 0.55, s * 0.75])) });
  const up: V3 = [Math.sin(pitch * D), Math.cos(pitch * D), 0], fwd: V3 = [Math.cos(pitch * D), -Math.sin(pitch * D), 0];
  return spec({
    exerciseId: "chest_press", timing: rep(1.0, 0.3, 1.8, 0.5, pose),
    items: [
      floor(),
      { id: "back", kind: "box", look: "pad", center: add(add(base.root.pos, scale(up, 0.38)), scale(fwd, -0.165)), size: [0.07, 0.75, 0.38], rot: [0, 0, -pitch], touch: ["torsoUp", "torsoLow", "head", "upperArmL", "upperArmR"] },
      { id: "seat", kind: "box", look: "pad", center: [0.02, 0.405, 0], size: [0.4, 0.07, 0.4], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "post", kind: "box", look: "metal", center: [0, 0.19, 0], size: [0.08, 0.36, 0.08], touch: ["shinL", "shinR"] },
      { id: "frame", kind: "box", look: "metal", frame: false, center: [-0.32, 0.9, 0], size: [0.12, 1.8, 0.7] },
      { id: "leverL", kind: "rod", look: "metal", from: [-0.25, 1.62, 0.36], to: "handL", toOffset: [0, 0.07, 0], r: 0.022, touch: ["forearmL", "upperArmL"] },
      { id: "leverR", kind: "rod", look: "metal", from: [-0.25, 1.62, -0.36], to: "handR", toOffset: [0, 0.07, 0], r: 0.022, touch: ["forearmR", "upperArmR"] },
    ],
    views: [{ name: "Front 3/4", yaw: -50, elev: 18 }],
    highlight: ["chest", "frontDelts", "triceps"],
    arrow: "handL",
    contacts: [{ joint: "chest", item: "back", max: 0.16 }, { joint: "pelvis", item: "seat", max: 0.11 }],
    fixed: [{ joint: "chest", tol: 0.003 }, { joint: "shoulderL", tol: 0.003 }],
    checks: [
      chk.valueAlways("Handles stay level with mid-chest", (s) => shL[1] - s.p.handL.y, 0.05, 0.2),
      chk.angleAt("Arms long at the end, not locked hard (elbows 5-25°)", "elbowL", 1.15, 5, 25),
      chk.valueAt("Elbows about 45° out at the start, not flared to 90°", 0, (s) => s.p.elbowL.z, 0.25, 0.48),
    ],
  });
})();

// ---------- Lat pulldown ----------
// "Grip a bit wider than shoulders, thighs locked under the pad, lean back slightly. Pull the bar to your
//  upper chest by driving elbows down to your sides. Let it rise all the way until arms are straight."
const latPulldown = (() => {
  const pitch = -12, base = seated(0, { kneeX: 0.45 });
  const top: V3 = [0.05, 1.56, 0.36], bottom: V3 = [0.14, 0.96, 0.37];
  const pose = (k: number): Pose => ({ ...base, root: { ...base.root, pitch }, neck: { flex: -8 }, ...both((s) => armTo(zs(lerp3(top, bottom, k), s), [-0.1, 0.4, s * 0.7])) });
  return spec({
    exerciseId: "lat_pulldown", timing: rep(1.1, 0.5, 1.9, 0.4, pose),
    items: [
      floor(),
      { id: "seat", kind: "box", look: "pad", center: [0.02, 0.405, 0], size: [0.4, 0.07, 0.4], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "post", kind: "box", look: "metal", center: [0, 0.19, 0], size: [0.08, 0.36, 0.08], touch: ["shinL", "shinR"] },
      { id: "kneePad", kind: "cyl", look: "pad", a: [0.4, 0.66, 0.3], b: [0.4, 0.66, -0.3], r: 0.05 },
      { id: "column", kind: "box", look: "metal", frame: false, center: [-0.45, 1.15, 0], size: [0.14, 2.3, 0.3] },
      { id: "bar", kind: "cyl", look: "metal", follow: "handsMid", a: [0, 0, 0.55], b: [0, 0, -0.55], r: 0.017, touch: ["forearmL", "forearmR"] },
      { id: "cable", kind: "cable", from: [0.08, 2.35, 0], to: "handsMid" },
    ],
    views: [{ name: "Front 3/4", yaw: -50, elev: 12 }],
    highlight: ["lats", "biceps"],
    arrow: "handsMid",
    contacts: [{ joint: "pelvis", item: "seat", max: 0.11 }, { joint: "kneeL", item: "kneePad", max: 0.13 }],
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.angleAt("Arms straight at the top (sides stretched)", "elbowL", 0, 0, 22),
      chk.valueAt("Bar reaches the upper chest", 1.35, (s) => s.p.chest.y - s.p.handL.y, -0.05, 0.15),
      chk.valueAt("Elbows driven down to the sides", 1.35, (s) => s.p.shoulderL.y - s.p.elbowL.y, 0.15, 0.4),
      chk.valueAlways("Leans back only slightly (10-15°)", (s) => Math.atan2(s.p.pelvis.x - s.p.chest.x, s.p.chest.y - s.p.pelvis.y) / D, 9, 16, "°"),
    ],
  });
})();

// ---------- Seated dumbbell shoulder press ----------
// "Back against the pad, dumbbells at shoulder height, palms forward. Press straight up until arms are straight.
//  Lower to about chin level. Forearms vertical. Ribs down."
const dbShoulder = (() => {
  const pitch = -6, base = seated(0, { kneeX: 0.42 });
  const low: V3 = [0.02, 1.2, 0.48], high: V3 = [0.0, 1.6, 0.2];
  const pose = (k: number): Pose => ({ ...base, root: { ...base.root, pitch }, ...both((s) => armTo(zs(lerp3(low, high, k), s), [0.0, 0.6, s * 1.0])) });
  const up: V3 = [Math.sin(pitch * D), Math.cos(pitch * D), 0], fwd: V3 = [Math.cos(pitch * D), -Math.sin(pitch * D), 0];
  return spec({
    exerciseId: "db_shoulder", timing: rep(1.0, 0.3, 1.7, 0.4, pose),
    items: [
      floor(),
      { id: "back", kind: "box", look: "pad", center: add(add(base.root.pos, scale(up, 0.38)), scale(fwd, -0.165)), size: [0.07, 0.75, 0.3], rot: [0, 0, -pitch], touch: ["torsoUp", "torsoLow", "head"] },
      { id: "seat", kind: "box", look: "pad", center: [0.02, 0.405, 0], size: [0.4, 0.07, 0.32], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "post", kind: "box", look: "metal", center: [0, 0.19, 0], size: [0.08, 0.36, 0.08], touch: ["shinL", "shinR"] },
      ...dbs("z"),
    ],
    views: [{ name: "Front 3/4", yaw: -55, elev: 10 }],
    highlight: ["frontDelts", "sideDelts", "triceps"],
    arrow: "handL",
    contacts: [{ joint: "chest", item: "back", max: 0.16 }],
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAt("Forearms vertical at the bottom", 0, (s) => Math.hypot(s.p.handL.x - s.p.elbowL.x, s.p.handL.z - s.p.elbowL.z), 0, 0.09),
      chk.angleAt("Arms straight overhead at the top", "elbowL", 1.15, 0, 22),
      chk.valueAt("Dumbbells start around chin level", 0, (s) => s.p.head.y - s.p.handL.y, 0.0, 0.25),
    ],
  });
})();

// ---------- Face pull ----------
// "Rope at forehead height. Pull the rope toward your eyes, splitting the ends apart, elbows high and wide.
//  Finish like a 'double biceps' pose, hands beside your ears."
const facePull = (() => {
  const pelvisY = 0.93;
  const legs = { legL: { to: [0.16, 0.08, 0.12] as V3, pole: [1.2, 0.55, 0.15] as V3, sole: [1, 0, 0] as V3 }, legR: { to: [-0.16, 0.08, -0.12] as V3, pole: [0.9, 0.55, -0.15] as V3, sole: [1, 0, 0] as V3 } };
  const col = column("column", 1.2, 0, 1.66);
  const start: V3 = [0.56, 1.58, 0.05], end: V3 = [0.04, 1.64, 0.21];
  const pose = (k: number): Pose => ({ root: { pos: [0, pelvisY, 0] }, ...legs, ...both((s) => armTo(zs(lerp3(start, end, k), s), [0.0, 1.85, s * 0.9])) });
  return spec({
    exerciseId: "face_pull", timing: rep(1.0, 1.0, 1.6, 0.4, pose),
    items: [floor(), ...col.items, { id: "cable", kind: "cable", from: col.pulley, to: "handsMid" }, { id: "rope", kind: "band", a: "handL", b: "handR", look: "strap" }],
    views: [{ name: "Behind 3/4", yaw: 125, elev: 24 }, { name: "Side 3/4", yaw: -30, elev: 18 }],
    view3d: { name: "Behind 3/4", yaw: 125, elev: 24 },
    highlight: ["rearDelts", "upperBack"],
    arrow: "handL",
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAt("Hands end beside the ears", 1.5, (s) => Math.hypot(s.p.handL.x - s.p.head.x, s.p.handL.y - s.p.head.y), 0, 0.12),
      chk.valueAt("Elbows high and wide at the end", 1.5, (s) => s.p.elbowL.y - s.p.shoulderL.y, -0.03, 0.25),
      chk.valueAt("Elbows wide", 1.5, (s) => s.p.elbowL.z, 0.42, 0.7),
      chk.angleAt("Arms long at the start", "elbowL", 0, 0, 30),
    ],
  });
})();

// ---------- Curls ----------
// "Stand tall. Curl the dumbbells up without moving your elbows forward. Lower fully until arms are straight."
function curl(id: "db_curl" | "hammer_curl", grip: "z" | "neutral"): Motion {
  const pose = (k: number): Pose => ({
    root: { pos: [0, STAND - 0.01, 0] }, ...feet(0, 0.12),
    armL: { flex: 6, abd: 7, elbow: 8 + 132 * k }, armR: { flex: 6, abd: 7, elbow: 8 + 132 * k },
  });
  return spec({
    exerciseId: id, timing: rep(1.0, 0.3, 1.6, 0.3, pose),
    items: [floor(), ...dbs(grip)],
    views: [{ name: "Side 3/4", yaw: -30, elev: 12 }],
    highlight: grip === "z" ? ["biceps"] : ["biceps", "forearms"],
    arrow: "handL",
    fixed: [{ joint: "elbowL", tol: 0.003 }, { joint: "elbowR", tol: 0.003 }, { joint: "chest", tol: 0.003 }],
    checks: [
      chk.angleAt("Arms straight at the bottom", "elbowL", 0, 0, 15),
      chk.angleAt("Full curl at the top", "elbowL", 1.15, 120, 145),
      chk.valueAlways("Elbows pinned at the sides", (s) => s.p.elbowL.x - s.p.shoulderL.x, -0.02, 0.06),
    ],
  });
}

// ---------- Triceps rope pushdown ----------
// "Face the pulley, slight forward lean, elbows by your sides. Push the rope down until arms are straight,
//  spreading the ends at the bottom. Let it come back up until forearms pass horizontal. Only the forearms move."
const pushdown = (() => {
  const col = column("column", 0.62, 0, 2.05);
  const pose = (k: number): Pose => ({
    root: { pos: [-0.02, STAND - 0.02, 0], pitch: 12 }, ...feet(0, 0.13),
    armL: { flex: -10, abd: 4, rot: 0, elbow: 118 - 111 * k }, armR: { flex: -10, abd: 4, rot: 0, elbow: 118 - 111 * k },
  });
  return spec({
    exerciseId: "pushdown", timing: rep(0.9, 0.5, 1.6, 0.3, pose),
    items: [floor(), ...col.items, { id: "cable", kind: "cable", from: col.pulley, to: "handsMid" }, { id: "rope", kind: "band", a: "handL", b: "handR", look: "strap" }],
    views: [{ name: "Side 3/4", yaw: -25, elev: 12 }],
    highlight: ["triceps"],
    arrow: "handL",
    fixed: [{ joint: "elbowL", tol: 0.003 }, { joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAt("Forearms just past horizontal at the top", 0, (s) => s.p.handL.y - s.p.elbowL.y, 0.0, 0.15),
      chk.angleAt("Arms straight at the bottom", "elbowL", 1.35, 0, 12),
      chk.valueAlways("Elbows stay by the sides", (s) => s.p.shoulderL.y - s.p.elbowL.y, 0.25, 0.32),
    ],
  });
})();

// ---------- Overhead cable triceps extension ----------
// "Face away from the pulley in a split stance, rope behind your head. Elbows point forward and stay fixed.
//  Straighten the arms forward and up, then let the rope pull your hands back behind your head."
const ohTriceps = (() => {
  const col = column("column", -0.85, 0, 1.35);
  const legs = { legL: { to: [0.3, 0.08, 0.12] as V3, pole: [1.3, 0.55, 0.14] as V3, sole: [1, 0, 0] as V3 }, legR: { to: [-0.3, 0.08, -0.12] as V3, pole: [0.8, 0.5, -0.14] as V3, sole: [1, 0, 0] as V3 } };
  const pose = (k: number): Pose => ({
    root: { pos: [0, 0.875, 0], pitch: 22 }, ...legs, neck: { flex: -12 },
    armL: { flex: 150, abd: -6, elbow: 125 - 110 * k }, armR: { flex: 150, abd: -6, elbow: 125 - 110 * k },
  });
  return spec({
    exerciseId: "oh_triceps", timing: rep(1.0, 0.4, 1.7, 0.4, pose),
    items: [floor(), ...col.items, { id: "cable", kind: "cable", from: col.pulley, to: "handsMid" }, { id: "rope", kind: "band", a: "handL", b: "handR", look: "strap" }],
    views: [{ name: "Side 3/4", yaw: -22, elev: 12 }],
    highlight: ["triceps"],
    arrow: "handL",
    fixed: [{ joint: "elbowL", tol: 0.003 }, { joint: "elbowR", tol: 0.003 }, { joint: "chest", tol: 0.003 }],
    checks: [
      chk.angleAt("Deep stretch at the start: hands behind the head", "elbowL", 0, 110, 135),
      chk.angleAt("Arms straight at the end", "elbowL", 1.2, 0, 20),
      chk.valueAlways("Elbows stay narrow", (s) => s.p.elbowL.z - s.p.elbowR.z, 0.2, 0.42),
      chk.valueAt("Hands end forward and up", 1.2, (s) => s.p.handL.y - s.p.shoulderL.y, 0.3, 0.7),
    ],
  });
})();

// ---------- Assisted pull-up ----------
// "Kneel on the pad, hands slightly wider than shoulders. Pull your chest to the bar, then lower all the way
//  to straight arms. Body stays still, no kicking."
const assistedPullup = (() => {
  const barY = 2.05, grip: V3 = [0.06, barY, 0.3];
  const pose = (k: number): Pose => {
    const y = 1.01 + (1.5 - 1.01) * k;
    return {
      root: { pos: [-0.02, y, 0], pitch: -6 }, neck: { flex: -10 },
      legL: { flex: 8, knee: 95, ankle: -20 }, legR: { flex: 8, knee: 95, ankle: -20 },
      ...both((s) => armTo(zs(grip, s), [0.15, y + 0.55, s * 0.8])),
    };
  };
  return spec({
    exerciseId: "assisted_pullup", timing: rep(1.2, 0.4, 1.8, 0.4, pose),
    items: [
      floor(),
      { id: "bar", kind: "cyl", look: "metal", a: [0.06, barY + 0.02, 0.55], b: [0.06, barY + 0.02, -0.55], r: 0.02, touch: ["forearmL", "forearmR"] },
      { id: "pad", kind: "box", look: "pad", follow: "kneeL", center: [-0.1, -0.08, -0.09], size: [0.36, 0.06, 0.38], touch: ["shinL", "shinR", "thighL", "thighR"] },
      { id: "frame", kind: "box", look: "metal", frame: false, center: [0.32, 1.1, 0], size: [0.1, 2.2, 0.8] },
    ],
    views: [{ name: "Side 3/4", yaw: -35, elev: 10 }],
    highlight: ["lats", "upperBack", "biceps"],
    arrow: "head",
    fixed: [{ joint: "handL", tol: 0.003 }, { joint: "handR", tol: 0.003 }],
    checks: [
      chk.angleAt("Arms straight at the bottom", "elbowL", 0, 0, 22),
      chk.valueAt("Chin reaches the bar at the top", 1.4, (s) => s.p.head.y - barY, -0.05, 0.2),
      chk.valueAlways("No swinging (hips stay under the bar)", (s) => s.p.pelvis.x, -0.06, 0.02),
    ],
  });
})();

// ---------- Incline dumbbell press (30°) ----------
// "Bench at about 30°. Press up and slightly in until arms are straight over your shoulders. Lower slowly until the
//  dumbbells are beside your chest. Elbows about 45° from your body. Shoulder blades pinned back."
const inclineDb = (() => {
  const pitch = -60, pelvis: V3 = [0, 0.56, 0];
  const up: V3 = [Math.sin(pitch * D), Math.cos(pitch * D), 0], fwd: V3 = [Math.cos(pitch * D), -Math.sin(pitch * D), 0];
  const shL = add(pelvis, add(scale(up, SH_UP), [0, 0, 0.19]));
  const top: V3 = [shL[0] + 0.02, shL[1] + 0.61, 0.17];
  const bottom: V3 = add(add(shL, scale(fwd, 0.14)), [0.1, -0.07, 0.13]);
  const pose = (k: number): Pose => ({
    root: { pos: pelvis, pitch }, neck: { flex: 25 },
    legL: { to: [0.48, 0.08, 0.17], pole: [1.3, 0.7, 0.2], sole: [1, 0, 0] }, legR: { to: [0.48, 0.08, -0.17], pole: [1.3, 0.7, -0.2], sole: [1, 0, 0] },
    ...both((s) => armTo(zs(lerp3(bottom, top, k), s), add(add(shL, scale(fwd, -0.6)), [0.4, 0, 0.0]).map((v, i) => (i === 2 ? s * 0.6 : v)) as V3)),
  });
  return spec({
    exerciseId: "incline_db", timing: rep(1.0, 0.3, 1.9, 0.4, pose),
    items: [
      floor(),
      { id: "back", kind: "box", look: "pad", center: add(add(pelvis, scale(up, 0.42)), scale(fwd, -0.15)), size: [0.07, 0.95, 0.3], rot: [0, 0, -pitch], touch: ["torsoUp", "torsoLow", "head", "upperArmL", "upperArmR"] },
      { id: "seat", kind: "box", look: "pad", center: [0.06, 0.42, 0], size: [0.36, 0.07, 0.3], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "frame", kind: "box", look: "metal", center: [-0.15, 0.2, 0], size: [0.6, 0.38, 0.1], touch: ["shinL", "shinR"] },
      ...dbs("z"),
    ],
    views: [{ name: "Side 3/4", yaw: -35, elev: 20 }],
    highlight: ["chest", "frontDelts", "triceps"],
    arrow: "handL",
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAt("Arms straight over the shoulders at the top", 1.15, (s) => Math.abs(s.p.handL.x - s.p.shoulderL.x), 0, 0.07),
      chk.angleAt("Arms long at the top", "elbowL", 1.15, 0, 22),
      chk.valueAt("Dumbbells come down beside the chest", 0, (s) => s.p.handL.y - s.p.shoulderL.y, -0.15, 0.06),
      chk.valueAt("Elbows about 45°, not flared wide", 0, (s) => s.p.elbowL.z, 0.25, 0.5),
    ],
  });
})();

// ---------- One-arm dumbbell row ----------
// "Same-side knee and hand on the bench, other foot on the floor. Back flat like a table. Let the dumbbell hang
//  straight down. Pull it toward your hip, elbow close to your body. Lower under control."
const dbRow = (() => {
  const pitch = 74, pelvis: V3 = [0, 0.92, 0];
  const shR = solve({ root: { pos: pelvis, pitch } }).p.shoulderR;
  const hang: V3 = [shR.x + 0.02, shR.y - 0.612, -0.21], hip: V3 = [0.15, 0.86, -0.25];
  const pose = (k: number): Pose => ({
    root: { pos: pelvis, pitch }, neck: { flex: -55 },
    legL: { to: [-0.42, 0.53, 0.1], pole: [0.1, 0.2, 0.1], sole: [-1, 0.05, 0] },
    legR: { to: [-0.12, 0.08, -0.3], pole: [0.6, 0.6, -0.4], sole: [1, 0, -0.2] },
    armL: armTo([0.52, 0.5, 0.17], [0.2, 0.8, 0.5]),
    armR: armTo(lerp3(hang, hip, k), [-0.25, 1.45, -0.3]),
  });
  return spec({
    exerciseId: "db_row", timing: rep(1.0, 0.5, 1.6, 0.4, pose),
    items: [floor(), ...bench("bench", 0.1, 0.12, { len: 1.25, top: 0.45 }), db("handR", "neutral")],
    views: [{ name: "Side 3/4", yaw: -30, elev: 22 }],
    highlight: ["lats", "upperBack"],
    arrow: "handR",
    contacts: [{ joint: "handL", item: "bench", max: 0.06 }, { joint: "kneeL", item: "bench", max: 0.09 }],
    fixed: [{ joint: "chest", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
    checks: [
      chk.angleAt("Arm hangs straight at the start", "elbowR", 0, 0, 15),
      chk.valueAt("Dumbbell ends at the hip", 1.25, (s) => s.p.handR.distanceTo(s.p.hipR), 0, 0.3),
      chk.angleAlways("Back flat (no rounding)", "spineFlex", -3, 3),
      chk.valueAt("Elbow close to the body at the top", 1.25, (s) => Math.abs(s.p.elbowR.z) - 0.19, -0.1, 0.12),
    ],
  });
})();

// ---------- Lateral raise ----------
// "Stand tall, dumbbells at your sides, slight bend in the elbows. Raise arms out to the sides up to shoulder height.
//  Lower slowly over 2-3 seconds. Not far above shoulder height."
const lateralRaise = (() => {
  const pose = (k: number): Pose => ({
    root: { pos: [0, STAND - 0.01, 0] }, ...feet(0, 0.12),
    armL: { flex: 12, abd: 10 + 78 * k, rot: -10, elbow: 15 }, armR: { flex: 12, abd: 10 + 78 * k, rot: -10, elbow: 15 },
  });
  return spec({
    exerciseId: "lateral_raise", timing: rep(1.0, 0.4, 2.2, 0.3, pose),
    items: [floor(), ...dbs("neutral")],
    views: [{ name: "Front 3/4", yaw: -62, elev: 10 }],
    highlight: ["sideDelts"],
    arrow: "handL",
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAt("Hands reach shoulder height, not far above", 1.2, (s) => s.p.handL.y - s.p.shoulderL.y, -0.08, 0.06),
      chk.angleAlways("Soft elbows the whole time", "elbowL", 10, 25),
    ],
  });
})();

// ---------- Seated cable row, wide grip ----------
// "Sit tall, knees slightly bent, feet on the plate. Arms straight. Pull the bar to your lower chest with elbows
//  flaring out about 60°. Squeeze shoulder blades together, then return slowly. Torso stays nearly still."
const cableRow = (() => {
  const pelvis: V3 = [0, 0.5, 0], pitch = 4;
  const start: V3 = [0.64, 0.86, 0.22], end: V3 = [0.16, 0.86, 0.26];
  const pose = (k: number): Pose => ({
    root: { pos: pelvis, pitch },
    legL: { to: [0.7, 0.3, 0.13], pole: [0.7, 1.0, 0.15], sole: [0.5, 1, 0] }, legR: { to: [0.7, 0.3, -0.13], pole: [0.7, 1.0, -0.15], sole: [0.5, 1, 0] },
    ...both((s) => armTo(zs(lerp3(start, end, k), s), [-0.3, 1.0, s * 0.75])),
  });
  return spec({
    exerciseId: "cable_row", timing: rep(1.1, 0.6, 1.7, 0.4, pose),
    items: [
      floor(),
      { id: "seat", kind: "box", look: "pad", center: [-0.05, 0.37, 0], size: [0.5, 0.06, 0.34], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "rail", kind: "box", look: "metal", center: [0.3, 0.17, 0], size: [1.3, 0.08, 0.12], touch: ["shinL", "shinR", "footL", "footR"] },
      { id: "plate", kind: "box", look: "metal", center: [0.8, 0.3, 0], size: [0.05, 0.32, 0.5], rot: [0, 0, 27], touch: ["footL", "footR"] },
      { id: "column", kind: "box", look: "metal", frame: false, center: [1.25, 0.9, 0], size: [0.2, 1.8, 0.3] },
      { id: "bar", kind: "cyl", look: "metal", follow: "handsMid", a: [0, 0, 0.34], b: [0, 0, -0.34], r: 0.017, touch: ["forearmL", "forearmR"] },
      { id: "cable", kind: "cable", from: [1.13, 0.52, 0], to: "handsMid" },
    ],
    views: [{ name: "Side 3/4", yaw: -30, elev: 26 }],
    highlight: ["upperBack", "rearDelts", "lats"],
    arrow: "handL",
    contacts: [{ joint: "pelvis", item: "seat", max: 0.12 }],
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.angleAt("Arms straight at the start", "elbowL", 0, 0, 22),
      chk.valueAt("Elbows end behind the torso", 1.4, (s) => s.p.chest.x - s.p.elbowL.x, 0.05, 0.5),
      chk.valueAt("Elbows flare out (about 60°)", 1.4, (s) => s.p.elbowL.z, 0.33, 0.6),
    ],
  });
})();

// ---------- Push-up ----------
// "Hands a bit wider than shoulders, body in one straight line from head to heels. Lower until your chest is a fist
//  from the floor. Push back up. Like a moving plank."
const pushup = (() => {
  const ank: V3 = [0, 0.1, 0.1], L = 0.87 + 0.46;
  const handX = 1.23;
  const pose = (k: number): Pose => {
    const th = (23 - 19.5 * k) * D;
    const pel: V3 = [ank[0] + 0.87 * Math.cos(th), ank[1] + 0.87 * Math.sin(th), 0];
    void L;
    return {
      root: { pos: pel, pitch: 90 - th / D }, neck: { flex: -15 },
      legL: { to: ank, pole: [0.4, -1, 0.1], sole: [0.3, -1, 0] }, legR: { to: [ank[0], ank[1], -ank[2]], pole: [0.4, -1, -0.1], sole: [0.3, -1, 0] },
      ...both((s) => armTo([handX, 0.03, s * 0.27], [0.75, 0.9, s * 0.75])),
    };
  };
  return spec({
    exerciseId: "pushup", timing: rep(1.6, 0.2, 1.0, 0.4, pose), arrowReverse: true,
    items: [floor(0.6)],
    views: [{ name: "Side 3/4", yaw: -22, elev: 18 }],
    highlight: ["chest", "triceps", "frontDelts"],
    arrow: "chest",
    fixed: [{ joint: "handL", tol: 0.003 }, { joint: "ankleL", tol: 0.003 }],
    checks: [
      chk.valueAt("Hands under the shoulders at the top", 0, (s) => Math.abs(s.p.handL.x - s.p.shoulderL.x), 0, 0.09),
      chk.valueAt("Chest about a fist from the floor at the bottom", 1.7, (s) => s.p.chest.y, 0.1, 0.3),
      chk.angleAlways("Body in one straight line (hips don't sag or pike)", "hipFlexL", -10, 10),
      chk.valueAt("Elbows about 45°, not flared", 1.7, (s) => s.p.elbowL.z, 0.2, 0.5),
    ],
  });
})();

// ---------- Farmer's carry ----------
// "Stand tall, shoulders down and back, and walk with short controlled steps."
const farmer = (() => {
  const T = 1.1;
  const pose = (t: number): Pose => {
    const w = (2 * Math.PI * t) / T;
    const legs = (ph: number) => ({ flex: 16 * Math.sin(w + ph), knee: Math.max(3, 36 * Math.sin(w + ph + 1.4)), ankle: 4 + 6 * Math.cos(w + ph) });
    return {
      root: { pos: [0, 0.955 + 0.01 * Math.cos(2 * w), 0], pitch: 2 }, neck: { flex: -5 },
      legL: legs(0), legR: legs(Math.PI),
      armL: { flex: 2, abd: 9, elbow: 3 }, armR: { flex: 2, abd: 9, elbow: 3 },
    };
  };
  return spec({
    exerciseId: "farmer", timing: { pose, period: T, tA: 0, tB: T / 2 },
    items: [floor(), ...dbs("neutral").map((i) => ({ ...i, heads: 0.065 } as Item))],
    views: [{ name: "Side 3/4", yaw: -30, elev: 12 }],
    highlight: ["forearms", "traps", "abs"],
    checks: [
      chk.angleAlways("Arms straight, weights at the sides", "elbowL", 0, 8),
      chk.angleAlways("Tall torso", "spineFlex", -2, 2),
      chk.valueAlways("Feet stay above the floor line (no sinking)", (s) => Math.min(s.p.heelL.y, s.p.toeL.y, s.p.heelR.y, s.p.toeR.y), -0.02, 0.4),
    ],
  });
})();

// ---------- Band pull-apart ----------
// "Hold a band at shoulder height, arms straight in front. Pull it apart until it touches your chest,
//  squeezing shoulder blades. Return slowly."
const bandPullApart = (() => {
  const reach = 0.612;
  const hand = (s: 1 | -1, h: number): V3 => { const sh0 = sh(STAND - 0.01, 0, s); return [sh0[0] + reach * Math.cos(h * D), sh0[1] - 0.02, sh0[2] + s * reach * Math.sin(h * D)]; };
  const pose = (k: number): Pose => {
    const h = -13 + 98 * k;
    return { root: { pos: [0, STAND - 0.01, 0] }, ...feet(0, 0.12), ...both((s) => armTo(hand(s, h), add(hand(s, h), [-0.3, -0.5, s * 0.25]))) };
  };
  return spec({
    exerciseId: "band_pullapart", timing: rep(0.9, 0.6, 1.4, 0.3, pose),
    items: [floor(), { id: "band", kind: "band", a: "handL", b: "handR", look: "band" }],
    views: [{ name: "Front, above", yaw: -60, elev: 32 }],
    highlight: ["rearDelts", "upperBack"],
    arrow: "handL",
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAlways("Hands at shoulder height", (s) => s.p.handL.y - s.p.shoulderL.y, -0.06, 0.02),
      chk.valueAt("Arms end out to the sides (band at the chest)", 1.2, (s) => Math.abs(s.p.handL.x - s.p.shoulderL.x), 0, 0.12),
      chk.angleAlways("Arms straight", "elbowL", 0, 20),
    ],
  });
})();

void angleBetween; void chestForward;
export const UPPER: Record<string, Motion> = {
  row_chest: rowChest, chest_press: chestPress, lat_pulldown: latPulldown, db_shoulder: dbShoulder,
  face_pull: facePull, db_curl: curl("db_curl", "z"), hammer_curl: curl("hammer_curl", "neutral"),
  pushdown, oh_triceps: ohTriceps, assisted_pullup: assistedPullup, incline_db: inclineDb, db_row: dbRow,
  lateral_raise: lateralRaise, cable_row: cableRow, pushup, farmer, band_pullapart: bandPullApart,
};
