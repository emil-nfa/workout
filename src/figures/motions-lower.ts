// Lower-body motion specs, each written from its how-to text (src/data/exercises.ts).
import { Vector3 } from "three";
import { solve, LEN, type Pose, type V3 } from "./rig";
import type { Motion } from "./motion";
import { add, scale } from "./motion";
import { D } from "./geom";
import { SEAT, armTo, bench, chk, dbs, feet, floor, rep, seated, spec } from "./kit";

const axes = (m: import("three").Matrix4) => {
  const e = m.elements;
  return { X: new Vector3(e[0], e[1], e[2]), Y: new Vector3(e[4], e[5], e[6]), Z: new Vector3(e[8], e[9], e[10]) };
};
const torsoLean = (s: ReturnType<typeof solve>) => Math.atan2(s.p.chest.x - s.p.pelvis.x, s.p.chest.y - s.p.pelvis.y) / D;

// ---------- Romanian deadlift (dumbbells) ----------
// "Dumbbells in front of your thighs, knees soft. Push your hips BACK, sliding the dumbbells down your legs, until
//  a strong hamstring stretch, usually just below the knees, back flat. Drive hips forward to stand up. It's a hinge,
//  not a squat: knees barely bend more."
const rdl = (() => {
  const pose = (k: number): Pose => {
    const p = 70 * k;
    return {
      root: { pos: [-0.23 * k, 0.94 - 0.04 * k, 0], pitch: p }, neck: { flex: -10 * k },
      ...feet(0, 0.12),
      armL: { flex: p - 15, abd: 4, elbow: 3 }, armR: { flex: p - 15, abd: 4, elbow: 3 },
    };
  };
  return spec({
    exerciseId: "rdl", timing: rep(1.8, 0.4, 1.2, 0.5, pose), arrowReverse: true,
    items: [floor(), ...dbs("z").map((i) => ({ ...i, touch: [...(i.touch ?? []), "thighL", "thighR", "shinL", "shinR"] } as typeof i))],
    views: [{ name: "Side", yaw: -12, elev: 10 }],
    highlight: ["hamstrings", "glutes"],
    arrow: "pelvis",
    fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
    checks: [
      chk.angleAlways("Hinge, not a squat: knees stay soft (≤ 30°)", "kneeL", 0, 30),
      chk.angleAlways("Back flat", "spineFlex", -1, 1),
      chk.moves("Hips push back", (s) => s.p.pelvis.x, 0, 2.0, 0.12),
      chk.valueAt("Dumbbells reach just below the knees", 2.0, (s) => s.p.kneeL.y - s.p.handL.y, 0.0, 0.18),
      chk.valueAt("Dumbbells stay close to the legs", 2.0, (s) => Math.abs(s.p.handL.x - s.p.kneeL.x), 0, 0.14),
    ],
  });
})();

// ---------- Goblet squat ----------
// "Hold a dumbbell vertically against your chest, feet shoulder-width, toes slightly out. Sit down between your heels,
//  knees pushing outward, chest up. As low as you can with a neutral back (thighs at least parallel), then stand up.
//  Heels down."
const goblet = (() => {
  const base = (k: number): Pose => ({
    root: { pos: [-0.17 * k, 0.93 - 0.49 * k, 0], pitch: 36 * k }, neck: { flex: -16 * k },
    ...feet(0, 0.17, { toeOut: 18 }),
  });
  const pose = (k: number): Pose => {
    const b = base(k);
    const s = solve(b);
    const { X, Y, Z } = axes(s.frames.chest);
    const at = (x: number, y: number, z: number) => s.p.chest.clone().add(X.clone().multiplyScalar(x)).add(Y.clone().multiplyScalar(y)).add(Z.clone().multiplyScalar(z));
    const v = (w: Vector3): V3 => [w.x, w.y, w.z];
    return { ...b, armL: armTo(v(at(0.21, -0.17, 0.035)), v(at(0.15, -0.7, 0.3))), armR: armTo(v(at(0.21, -0.17, -0.035)), v(at(0.15, -0.7, -0.3))) };
  };
  return spec({
    exerciseId: "goblet_squat", timing: rep(1.8, 0.4, 1.2, 0.5, pose), arrowReverse: true,
    items: [floor(), { id: "db", kind: "cyl", look: "metal", follow: "handsMid", a: [0, -0.13, 0], b: [0, 0.13, 0], r: 0.055, touch: ["forearmL", "forearmR", "torsoUp"] }],
    views: [{ name: "Front 3/4", yaw: -50, elev: 14 }],
    highlight: ["quads", "glutes"],
    arrow: "pelvis",
    fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
    checks: [
      chk.valueAt("Thighs at least parallel at the bottom", 2.0, (s) => s.p.hipL.y - s.p.kneeL.y, -0.15, 0.03),
      chk.valueAlways("Knees push out over the toes (no caving)", (s) => s.p.kneeL.z - s.p.ankleL.z, -0.01, 0.2),
      chk.valueAt("Chest up at the bottom (torso ≤ 40°)", 2.0, torsoLean, 0, 40, "°"),
      chk.valueAt("Stands tall at the top", 0, (s) => s.p.pelvis.y, 0.9, 0.96),
    ],
  });
})();

// ---------- Leg curls and leg extension (machines) ----------
// Seated leg curl: "Knee in line with the pivot. Thigh pad locks you in, roller just above the heels. Curl your heels
//  down and back as far as possible, pause, return slowly to straight legs. Lean your torso slightly forward."
function seatedKnee(id: "leg_curl_seated" | "leg_ext"): Motion {
  const curl = id === "leg_curl_seated";
  const pitch = curl ? 10 : -8;
  const hip = 90 + pitch;
  const pose = (k: number): Pose => {
    const knee = curl ? 8 + 100 * k : 95 - 90 * k;
    return {
      root: { pos: [0, SEAT + 0.02, 0], pitch }, neck: { flex: curl ? 5 : 10 },
      legL: { flex: hip, abd: 2, knee, ankle: curl ? 5 : 10 }, legR: { flex: hip, abd: 2, knee, ankle: curl ? 5 : 10 },
      armL: { flex: 30, abd: 18, elbow: 55 }, armR: { flex: 30, abd: 18, elbow: 55 },
    };
  };
  const up: V3 = [Math.sin(pitch * D), Math.cos(pitch * D), 0], fwd: V3 = [Math.cos(pitch * D), -Math.sin(pitch * D), 0];
  const base = solve(pose(0)).p;
  return spec({
    exerciseId: id, timing: rep(1.0, 0.5, 1.8, 0.4, pose),
    items: [
      floor(),
      { id: "seat", kind: "box", look: "pad", center: [0.12, SEAT - 0.125, 0], size: [0.5, 0.07, 0.4], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "back", kind: "box", look: "pad", center: add(add([0, SEAT, 0], scale(up, 0.36)), scale(fwd, -0.165)), size: [0.07, 0.6, 0.36], rot: [0, 0, -pitch], touch: ["torsoUp", "torsoLow"] },
      { id: "post", kind: "box", look: "metal", center: [0.05, 0.2, 0], size: [0.1, 0.38, 0.1] },
      ...(curl ? [{ id: "thighPad", kind: "cyl" as const, look: "pad" as const, a: [base.kneeL.x - 0.08, base.kneeL.y + 0.11, 0.28] as V3, b: [base.kneeL.x - 0.08, base.kneeL.y + 0.11, -0.28] as V3, r: 0.045 }] : []),
      { id: "roller", kind: "cyl", look: "pad", follow: "feetMid", a: curl ? [-0.05, 0.03, 0.25] : [0.07, 0.03, 0.25], b: curl ? [-0.05, 0.03, -0.25] : [0.07, 0.03, -0.25], r: 0.05, touch: ["shinL", "shinR", "footL", "footR"] },
      { id: "arm", kind: "box", look: "metal", frame: false, center: [base.kneeL.x, base.kneeL.y, 0.33], size: [0.08, 0.08, 0.08] },
      { id: "handleL", kind: "cyl", look: "metal", a: [base.handL.x - 0.08, base.handL.y, base.handL.z], b: [base.handL.x + 0.08, base.handL.y, base.handL.z], r: 0.018, touch: ["forearmL"] },
      { id: "handleR", kind: "cyl", look: "metal", a: [base.handR.x - 0.08, base.handR.y, base.handR.z], b: [base.handR.x + 0.08, base.handR.y, base.handR.z], r: 0.018, touch: ["forearmR"] },
    ],
    views: [{ name: "Side 3/4", yaw: -28, elev: 14 }],
    highlight: curl ? ["hamstrings"] : ["quads"],
    arrow: "ankleL",
    contacts: [{ joint: "pelvis", item: "seat", max: 0.12 }],
    fixed: [{ joint: "kneeL", tol: 0.003 }, { joint: "pelvis", tol: 0.003 }],
    checks: curl
      ? [chk.angleAt("Legs straight at the start", "kneeL", 0, 0, 12), chk.angleAt("Heels curled well under at the end", "kneeL", 1.25, 95, 115)]
      : [chk.angleAt("Knees well bent at the start", "kneeL", 0, 85, 100), chk.angleAt("Legs fully straight at the top", "kneeL", 1.25, 0, 8)],
  });
}

// Lying leg curl: "Lie face down, knees just off the end of the pad, roller above the heels. Curl heels toward your
//  bum, pause. Lower slowly all the way. Hips pressed into the pad."
const legCurlLying = (() => {
  const pelvis: V3 = [0, 0.61, 0];
  const pose = (k: number): Pose => ({
    root: { pos: pelvis, pitch: 92 }, neck: { flex: -35 },
    legL: { flex: 0, knee: 6 + 112 * k, ankle: -10 }, legR: { flex: 0, knee: 6 + 112 * k, ankle: -10 },
    armL: armTo([0.78, 0.42, 0.21], [0.4, 0.2, 0.5]), armR: armTo([0.78, 0.42, -0.21], [0.4, 0.2, -0.5]),
  });
  return spec({
    exerciseId: "leg_curl_lying", timing: rep(1.0, 0.5, 1.8, 0.4, pose),
    items: [
      floor(0.2),
      { id: "pad", kind: "box", look: "pad", center: [0.22, 0.465, 0], size: [1.24, 0.07, 0.34], touch: ["torsoLow", "torsoUp", "thighL", "thighR", "head", "upperArmL", "upperArmR"] },
      { id: "frame", kind: "box", look: "metal", center: [0.22, 0.21, 0], size: [1.0, 0.42, 0.12] },
      { id: "handles", kind: "cyl", look: "metal", a: [0.8, 0.42, 0.3], b: [0.8, 0.42, -0.3], r: 0.018, touch: ["forearmL", "forearmR"] },
      { id: "roller", kind: "cyl", look: "pad", follow: "feetMid", a: [0.0, 0.07, 0.25], b: [0.0, 0.07, -0.25], r: 0.045, touch: ["shinL", "shinR", "footL", "footR"] },
    ],
    views: [{ name: "Side 3/4", yaw: -25, elev: 22 }],
    highlight: ["hamstrings", "calves"],
    arrow: "ankleL",
    contacts: [{ joint: "pelvis", item: "pad", max: 0.14 }],
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "kneeL", tol: 0.003 }],
    checks: [
      chk.valueAlways("Knees just off the end of the pad", (s) => -0.4 - s.p.kneeL.x, -0.06, 0.1),
      chk.angleAt("Legs straight at the start", "kneeL", 0, 0, 12),
      chk.angleAt("Heels come up toward the bum", "kneeL", 1.25, 105, 125),
    ],
  });
})();

// ---------- Bulgarian split squat ----------
// "Back foot laces-down on a bench, front foot a big step forward. Drop straight down until the back knee nearly
//  touches the floor. Push through the front foot to stand. Slight forward lean."
const bulgarian = (() => {
  const pose = (k: number): Pose => ({
    root: { pos: [-0.04, 0.835 - 0.37 * k, 0], pitch: 10 + 6 * k }, neck: { flex: -6 },
    legL: { to: [0.36, 0.08, 0.13], pole: [1.4, 0.6, 0.16], sole: [1, 0, 0] },
    legR: { to: [-0.58, 0.52, -0.13], pole: [0.2, -1, -0.13], sole: [-1, 0.15, 0] },
    armL: { flex: 12, abd: 4, elbow: 3 }, armR: { flex: 12, abd: 4, elbow: 3 },
  });
  return spec({
    exerciseId: "bulgarian", timing: rep(1.6, 0.3, 1.1, 0.5, pose), arrowReverse: true,
    items: [floor(0, 0, 2.6), ...bench("bench", -0.9, -0.13, { len: 1.0, top: 0.45 }), ...dbs("neutral")],
    views: [{ name: "Side 3/4", yaw: -20, elev: 12 }],
    highlight: ["quads", "glutes"],
    arrow: "pelvis",
    contacts: [{ joint: "ankleR", item: "bench", max: 0.09 }],
    fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
    checks: [
      chk.valueAt("Back knee nearly touches the floor", 1.75, (s) => s.p.kneeR.y, 0.04, 0.2),
      chk.valueAt("Drops straight down (hips over the middle)", 1.75, (s) => s.p.pelvis.x, -0.1, 0.05),
      chk.valueAlways("Front heel stays down, knee over the foot", (s) => s.p.kneeL.x - s.p.toeL.x, -0.6, 0.06),
      chk.valueAt("Torso fairly upright", 1.75, torsoLean, 0, 22, "°"),
    ],
  });
})();

// ---------- Calf raises ----------
// Standing: "Balls of the feet on the edge, heels hanging. Lower the heels as far as possible, pause 1-2 s in the
//  stretch. Rise as high as you can onto your toes. The pause at the bottom is the important part."
const footVec = (a: number) => [0.2 * Math.cos(a * D) + 0.06 * Math.sin(a * D), 0.2 * Math.sin(a * D) - 0.06 * Math.cos(a * D)];
const calfStand = (() => {
  const T = { x: 0.13, y: 0.12 };
  const pose = (k: number): Pose => {
    const a = 22 - 52 * k;
    const [fx, fy] = footVec(a);
    const ax = T.x - fx, ay = T.y - fy;
    return {
      root: { pos: [ax, ay + LEN.thigh + LEN.shin - 0.002, 0] },
      legL: { flex: 0, knee: 2, ankle: a }, legR: { flex: 0, knee: 2, ankle: a },
      armL: { flex: 55, abd: 10, elbow: 70 }, armR: { flex: 55, abd: 10, elbow: 70 },
    };
  };
  return spec({
    exerciseId: "calf_stand", timing: rep(0.9, 0.6, 1.4, 1.2, pose),
    items: [
      floor(),
      { id: "step", kind: "box", look: "pad", center: [0.26, 0.06, 0], size: [0.38, 0.12, 0.6], touch: ["footL", "footR"] },
      { id: "rail", kind: "cyl", look: "metal", follow: "handsMid", a: [0.02, -0.4, 0.35], b: [0.02, 0.4, 0.35], r: 0.02 },
    ],
    views: [{ name: "Side", yaw: -15, elev: 8 }],
    highlight: ["calves"],
    arrow: "heelL",
    contacts: [{ joint: "toeL", item: "step", max: 0.06 }],
    fixed: [{ joint: "toeL", tol: 0.01 }],
    checks: [
      chk.valueAt("Heels drop below the step at the bottom", 0, (s) => 0.12 - s.p.heelL.y, 0.02, 0.2),
      chk.valueAt("Rises high onto the toes", 1.2, (s) => s.p.heelL.y - s.p.toeL.y, 0.07, 0.2),
      chk.angleAlways("Knees straight", "kneeL", 0, 5),
    ],
  });
})();

// Seated: "Knee pad snug on lower thighs, balls of feet on the plate. Lower heels fully, pause, push up high."
const calfSeated = (() => {
  const T = { x: 0.55, y: 0.14 };
  const base = seated(0, { kneeX: 0.43 });
  const pose = (k: number): Pose => {
    const a = 18 - 46 * k;
    const [fx, fy] = footVec(a);
    const to: V3 = [T.x - fx, T.y - fy, 0.13];
    return {
      ...base,
      legL: { to, pole: [1.4, 1.0, 0.13], sole: [Math.cos(a * D), Math.sin(a * D), 0] },
      legR: { to: [to[0], to[1], -0.13], pole: [1.4, 1.0, -0.13], sole: [Math.cos(a * D), Math.sin(a * D), 0] },
      armL: { flex: 40, abd: 10, elbow: 70 }, armR: { flex: 40, abd: 10, elbow: 70 },
    };
  };
  return spec({
    exerciseId: "calf_seated", timing: rep(0.9, 0.6, 1.4, 1.2, pose),
    items: [
      floor(),
      { id: "seat", kind: "box", look: "pad", center: [0.0, 0.405, 0], size: [0.42, 0.07, 0.4], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "post", kind: "box", look: "metal", center: [0, 0.19, 0], size: [0.08, 0.36, 0.08] },
      { id: "plate", kind: "box", look: "metal", center: [0.65, 0.07, 0], size: [0.3, 0.14, 0.45], touch: ["footL", "footR"] },
      { id: "kneePad", kind: "cyl", look: "pad", follow: "kneeL", a: [-0.08, 0.1, 0.12], b: [-0.08, 0.1, -0.38], r: 0.05, touch: ["thighL", "thighR", "forearmL", "forearmR"] },
    ],
    views: [{ name: "Side 3/4", yaw: -22, elev: 12 }],
    highlight: ["calves"],
    arrow: "kneeL",
    contacts: [{ joint: "toeL", item: "plate", max: 0.06 }],
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "toeL", tol: 0.012 }],
    checks: [
      chk.valueAt("Heels drop low at the bottom", 0, (s) => s.p.toeL.y - s.p.heelL.y, 0.04, 0.2),
      chk.valueAt("Heels up high at the top", 1.2, (s) => s.p.heelL.y - s.p.toeL.y, 0.06, 0.2),
    ],
  });
})();

// ---------- 45° back extension ----------
// "Pad just below your hip bones, heels against the plate, arms crossed on your chest. Bend at the hips and lower your
//  torso. Come up until your body is in one straight line, then squeeze your upper back. Don't over-arch past straight."
const backExt = (() => {
  const u: V3 = [Math.SQRT1_2, Math.SQRT1_2, 0], n: V3 = [Math.SQRT1_2, -Math.SQRT1_2, 0];
  const ank = (z: number): V3 => [-0.62, 0.22, z];
  const pelvis = add(ank(0), scale(u, LEN.thigh + LEN.shin - 0.004));
  const pose = (k: number): Pose => ({
    root: { pos: pelvis, pitch: 45 + 72 * k }, neck: { flex: -15 + 10 * k },
    legL: { to: ank(0.11), pole: add(ank(0.11), [0.5, -0.4, 0]), sole: n }, legR: { to: ank(-0.11), pole: add(ank(-0.11), [0.5, -0.4, 0]), sole: n },
    armL: { flex: 25, abd: -38, elbow: 135 }, armR: { flex: 25, abd: -38, elbow: 135 },
  });
  return spec({
    exerciseId: "back_ext", timing: rep(1.8, 0.3, 1.2, 0.6, pose), arrowReverse: true,
    items: [
      floor(0, 0, 2.4),
      { id: "pad", kind: "box", look: "pad", center: add(add(pelvis, scale(u, -0.1)), scale(n, 0.17)), size: [0.1, 0.3, 0.42], rot: [0, 0, -45], touch: ["torsoLow", "thighL", "thighR"] },
      { id: "plate", kind: "box", look: "metal", center: add(add(ank(0), scale(u, -0.07)), scale(n, 0.02)), size: [0.28, 0.04, 0.42], rot: [0, 0, -45], touch: ["footL", "footR", "shinL", "shinR"] },
      { id: "frame", kind: "cyl", look: "metal", a: add(add(pelvis, scale(u, -0.1)), scale(n, 0.25)), b: add(ank(0), scale(n, 0.12)), r: 0.04 },
      { id: "leg1", kind: "cyl", look: "metal", a: add(add(pelvis, scale(u, -0.1)), scale(n, 0.25)), b: [0.15, 0, 0], r: 0.035 },
    ],
    views: [{ name: "Side", yaw: -15, elev: 10 }],
    highlight: ["lowerBack", "glutes", "hamstrings"],
    arrow: "head",
    contacts: [{ joint: "pelvis", item: "pad", max: 0.2 }],
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "ankleL", tol: 0.003 }],
    checks: [
      chk.valueAt("Top: one straight line, not over-arched", 0, (s) => Math.atan2(s.p.chest.y - s.p.pelvis.y, s.p.chest.x - s.p.pelvis.x) / D - 45, -8, 8, "°"),
      chk.angleAt("Bottom: deep hip bend", "hipFlexL", 2.0, 55, 90),
      chk.angleAlways("Back stays flat (moves at the hips)", "spineFlex", -1, 1),
    ],
  });
})();

// ---------- Hack squat (machine) ----------
// "Back flat on the pad, shoulders under the pads, feet shoulder-width in the middle of the platform. Release the
//  safety. Bend your knees and let the sled slide down the rails until your thighs are at least parallel, then push
//  back up through the whole foot without locking the knees. Back stays on the pad the whole time."
const hackSquat = (() => {
  const a = 35; // the body leans back along the rails
  const up: V3 = [-Math.sin(a * D), Math.cos(a * D), 0];
  const back: V3 = [-Math.cos(a * D), -Math.sin(a * D), 0];
  const ankle: V3 = [0, 0.08, 0];
  const top = add(ankle, scale(up, 0.858));
  const travel = 0.31;
  const pelvisAt = (k: number) => add(top, scale(up, -travel * k));
  const pose = (k: number): Pose => ({
    root: { pos: pelvisAt(k), pitch: -a }, neck: { flex: 12 },
    ...feet(0, 0.13, { toeOut: 10 }),
    // Hands on the handles at the front of the shoulder pads.
    armL: { flex: 12, abd: 38, elbow: 145 }, armR: { flex: 12, abd: 38, elbow: 145 },
  });
  return spec({
    exerciseId: "hack_squat", timing: rep(1.8, 0.4, 1.2, 0.5, pose), arrowReverse: true,
    items: [
      floor(0, 0, 2.4),
      { id: "platform", kind: "box", look: "metal", center: [0.02, 0.035, 0], size: [0.5, 0.07, 0.62] },
      { id: "backpad", kind: "box", look: "pad", follow: "pelvis", center: add(scale(up, 0.33), scale(back, 0.15)), size: [0.08, 0.78, 0.44], rot: [0, 0, a] },
      { id: "shoulderL", kind: "cyl", look: "pad", follow: "pelvis", a: add(add(scale(up, 0.62), scale(back, 0.03)), [0, 0, 0.13]), b: add(add(scale(up, 0.62), scale(back, -0.09)), [0, 0, 0.13]), r: 0.045 },
      { id: "shoulderR", kind: "cyl", look: "pad", follow: "pelvis", a: add(add(scale(up, 0.62), scale(back, 0.03)), [0, 0, -0.13]), b: add(add(scale(up, 0.62), scale(back, -0.09)), [0, 0, -0.13]), r: 0.045 },
      { id: "railL", kind: "cyl", look: "metal", a: add(add(ankle, scale(back, 0.24)), [0, 0, 0.34]), b: add(add(top, add(scale(up, 0.75), scale(back, 0.24))), [0, 0, 0.34]), r: 0.03 },
      { id: "railR", kind: "cyl", look: "metal", a: add(add(ankle, scale(back, 0.24)), [0, 0, -0.34]), b: add(add(top, add(scale(up, 0.75), scale(back, 0.24))), [0, 0, -0.34]), r: 0.03 },
    ],
    views: [{ name: "Side 3/4", yaw: -30, elev: 12 }],
    highlight: ["quads", "glutes"],
    arrow: "pelvis",
    contacts: [{ joint: "waist", item: "backpad", max: 0.14 }, { joint: "chest", item: "backpad", max: 0.16 }],
    fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
    touch: { backpad: ["torsoLow", "torsoUp", "head", "upperArmL", "upperArmR"], shoulderL: ["torsoUp", "upperArmL", "head"], shoulderR: ["torsoUp", "upperArmR", "head"], platform: ["footL", "footR"] },
    checks: [
      chk.angleAt("Not locked at the top: knees bent 5-25°", "kneeL", 0, 5, 25),
      chk.angleAt("Deep at the bottom: knees bent 90-115°", "kneeL", 2.0, 90, 115),
      chk.valueAlways("Torso keeps the pad angle (back stays on the pad)", (s) => Math.atan2(s.p.chest.x - s.p.pelvis.x, s.p.chest.y - s.p.pelvis.y) / D, -40, -30, "°"),
      chk.valueAlways("Knees track over the toes (no caving)", (s) => s.p.kneeL.z - s.p.ankleL.z, -0.02, 0.2),
    ],
  });
})();

export const LOWER: Record<string, Motion> = {
  rdl, goblet_squat: goblet, leg_curl_seated: seatedKnee("leg_curl_seated"), leg_ext: seatedKnee("leg_ext"),
  leg_curl_lying: legCurlLying, bulgarian, calf_stand: calfStand, calf_seated: calfSeated, back_ext: backExt, hack_squat: hackSquat,
};
