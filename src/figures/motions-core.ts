// Core motion specs, each written from its how-to text (src/data/exercises.ts).
// Lying set-ups: root pitch -90 = on the back (head toward -x, chest up); +90 = face down (head toward +x).
import { Vector3 } from "three";
import { solve, type Pose, type V3 } from "./rig";
import type { Item, Motion } from "./motion";
import { alt, armTo, chk, column, floor, rep, spec } from "./kit";

const axes = (m: import("three").Matrix4) => {
  const e = m.elements;
  return { X: new Vector3(e[0], e[1], e[2]), Y: new Vector3(e[4], e[5], e[6]), Z: new Vector3(e[8], e[9], e[10]) };
};
const v3 = (w: Vector3): V3 => [w.x, w.y, w.z];
const mat = (cx: number, len = 1.9, w = 0.62): Item => ({ id: "mat", kind: "box", look: "pad", center: [cx, 0.006, 0], size: [len, 0.012, w], touch: ["torsoLow", "torsoUp", "head", "thighL", "thighR", "shinL", "shinR", "footL", "footR", "upperArmL", "upperArmR", "forearmL", "forearmR"] });

// ---------- Dead bug ----------
// "On your back, arms pointing at the ceiling, knees above hips at 90°. Press your lower back into the floor and keep it
//  there. Slowly extend one arm overhead and the OPPOSITE leg out straight, hovering above the floor. Return, switch."
const deadBug = (() => {
  const half = (side: 1 | -1, k: number): Pose => {
    const reach = { flex: 90 + 80 * k, abd: 4, elbow: 4 }, up = { flex: 90, abd: 4, elbow: 4 };
    const legOut = { flex: 90 - 78 * k, abd: 2, knee: 90 - 86 * k, ankle: -10 }, legUp = { flex: 90, abd: 2, knee: 90, ankle: 0 };
    // side +1: right arm + left leg; side -1: left arm + right leg
    return {
      root: { pos: [0, 0.11, 0], pitch: -90 }, neck: { flex: 8 },
      armR: side === 1 ? reach : up, armL: side === 1 ? up : reach,
      legL: side === 1 ? legOut : legUp, legR: side === 1 ? legUp : legOut,
    };
  };
  return spec({
    exerciseId: "dead_bug", timing: alt(half, 1.6, 0.4, 1.6, 0.4),
    items: [floor(-0.1), mat(-0.1)],
    views: [{ name: "Side, above", yaw: -25, elev: 30 }],
    highlight: ["abs"],
    arrow: "ankleL",
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "waist", tol: 0.003 }],
    checks: [
      chk.valueAt("Arm and leg hover above the floor", 1.8, (s) => Math.min(s.p.handR.y, s.p.ankleL.y), 0.08, 0.4),
      chk.valueAt("Opposite arm and leg extend together", 1.8, (s) => (s.p.handR.x < s.p.chest.x - 0.3 && s.p.ankleL.x > s.p.pelvis.x + 0.6 ? 1 : 0), 1, 1, ""),
      chk.angleAt("The other leg stays at 90/90", "kneeR", 1.8, 85, 95),
      chk.angleAt("Second half switches sides", "kneeL", 5.8, 85, 95),
    ],
  });
})();

// ---------- Kneeling cable crunch ----------
// "Kneel facing the pulley, rope ends beside your head. Hips stay still. Curl your ribcage down toward your pelvis,
//  rounding your back. Squeeze, then uncurl slowly. Think 'chest to belly button', not 'hips back'."
const cableCrunch = (() => {
  const col = column("column", 0.75, 0, 2.05);
  const base = (k: number): Pose => ({
    root: { pos: [0, 0.5, 0], pitch: 12 }, neck: { flex: 15 + 15 * k },
    spine: { flex: 8 + 52 * k },
    legL: { flex: 0, knee: 90, ankle: -45 }, legR: { flex: 0, knee: 90, ankle: -45 },
  });
  const pose = (k: number): Pose => {
    const b = base(k);
    const s = solve(b);
    const H = axes(s.frames.head);
    const at = (x: number, y: number, z: number) => s.p.head.clone().add(H.X.clone().multiplyScalar(x)).add(H.Y.clone().multiplyScalar(y)).add(H.Z.clone().multiplyScalar(z));
    return { ...b, armL: armTo(v3(at(0.06, -0.06, 0.09)), v3(at(0.25, -0.6, 0.3))), armR: armTo(v3(at(0.06, -0.06, -0.09)), v3(at(0.25, -0.6, -0.3))) };
  };
  return spec({
    exerciseId: "cable_crunch", timing: rep(1.1, 0.6, 1.6, 0.3, pose),
    items: [floor(), mat(-0.1, 1.0), ...col.items, { id: "cable", kind: "cable", from: col.pulley, to: "handsMid" }, { id: "rope", kind: "band", a: "handL", b: "handR", look: "strap" }],
    views: [{ name: "Side 3/4", yaw: -28, elev: 12 }],
    highlight: ["abs"],
    arrow: "head",
    fixed: [{ joint: "pelvis", tol: 0.003 }],
    checks: [
      chk.moves("Ribs curl down toward the pelvis", (s) => s.p.chest.y, 0, 1.4, 0.12),
      chk.angleAt("Back rounds (spine flexes) at the bottom", "spineFlex", 1.4, 45, 70),
      chk.valueAlways("Hands stay beside the head", (s) => s.p.handL.distanceTo(s.p.head), 0, 0.17),
    ],
  });
})();

// ---------- Hanging knee raise (captain's chair) ----------
// "Rest forearms on the captain's chair. Raise your knees up to hip height or higher, rolling your pelvis up at the top.
//  Lower slowly, no swinging."
const kneeRaise = (() => {
  const pelvis: V3 = [0, 1.12, 0];
  const pose = (k: number): Pose => ({
    root: { pos: pelvis, pitch: -12 * k }, spine: { flex: 12 * k }, neck: { flex: 5 },
    legL: { flex: 4 + 104 * k, abd: 3, knee: 6 + 84 * k, ankle: -15 }, legR: { flex: 4 + 104 * k, abd: 3, knee: 6 + 84 * k, ankle: -15 },
    armL: { flex: 4, abd: 6, elbow: 90 }, armR: { flex: 4, abd: 6, elbow: 90 },
  });
  const s0 = solve(pose(0)).p;
  const pad = (side: "L" | "R"): Item => {
    const e = s0[`elbow${side}`], h = s0[`hand${side}`];
    return { id: `pad${side}`, kind: "box", look: "pad", center: [(e.x + h.x) / 2, e.y - 0.07, e.z], size: [0.4, 0.06, 0.12], touch: [`forearm${side}`, `upperArm${side}`] };
  };
  return spec({
    exerciseId: "knee_raise", timing: rep(1.1, 0.4, 1.7, 0.4, pose),
    items: [
      floor(),
      pad("L"), pad("R"),
      { id: "back", kind: "box", look: "pad", center: [-0.17, 1.45, 0], size: [0.07, 0.7, 0.35], touch: ["torsoUp", "torsoLow", "head"] },
      { id: "frameL", kind: "box", look: "metal", frame: false, center: [-0.1, 0.65, 0.33], size: [0.08, 1.3, 0.08] },
      { id: "frameR", kind: "box", look: "metal", frame: false, center: [-0.1, 0.65, -0.33], size: [0.08, 1.3, 0.08] },
      { id: "frameB", kind: "box", look: "metal", frame: false, center: [-0.22, 0.9, 0], size: [0.08, 1.8, 0.1] },
    ],
    views: [{ name: "Side 3/4", yaw: -32, elev: 12 }],
    highlight: ["abs", "hipFlexors"],
    arrow: "kneeL",
    fixed: [{ joint: "chest", tol: 0.035 }, { joint: "elbowL", tol: 0.035 }],
    checks: [
      chk.valueAt("Knees reach hip height or higher", 1.3, (s) => s.p.kneeL.y - s.p.hipL.y, -0.03, 0.4),
      chk.angleAt("Pelvis rolls up at the top", "hipFlexL", 1.3, 100, 125),
      chk.valueAlways("No swinging (feet stay in front of the hips)", (s) => s.p.ankleL.x - s.p.hipL.x, -0.06, 0.8),
    ],
  });
})();

// ---------- Side plank ----------
// "On your side, elbow under shoulder, legs straight and stacked. Lift hips so your body forms a straight line.
//  Hold, then switch sides. Push the floor away with the elbow."
const sidePlank = (() => {
  // Body line from the feet: tilt t above the floor; pelvis placed so straight legs reach the stacked feet.
  const za = -0.8, ya = 0.05;
  const pose = (k: number): Pose => {
    const t = ((8 + 9 * k) * Math.PI) / 180;
    const y = ya + 0.87 * Math.sin(t) + 0.09 * Math.cos(t), z = za + 0.87 * Math.cos(t) - 0.09 * Math.sin(t);
    const fz = (off: number) => za + off * Math.sin(t);
    const base: Pose = {
      root: { pos: [0, y, z], roll: 90 - (8 + 9 * k) },
      neck: { flex: 0 },
      legL: { to: [0, ya, fz(0)], pole: [1, 0.3, -0.45], sole: [1, 0, 0] },
      legR: { to: [0.0, ya + 0.18 * Math.cos(t), fz(-0.18)], pole: [1, 0.4, -0.45], sole: [1, 0, 0] },
      armR: { flex: 0, abd: 12, elbow: 75 },
    };
    return { ...base, armL: armTo([HAND.x, 0.035, HAND.z], [HAND.x - 0.28, -1, HAND.z]) };
  };
  // The forearm stays planted: hand placed once, from the shoulder in the lifted position.
  const HAND = (() => { const sh = solve(pose0(1)).p.shoulderL; return { x: sh.x + 0.28, z: sh.z + 0.02 }; })();
  function pose0(k: number): Pose {
    const t = ((8 + 9 * k) * Math.PI) / 180;
    const y = ya + 0.87 * Math.sin(t) + 0.09 * Math.cos(t), z = za + 0.87 * Math.cos(t) - 0.09 * Math.sin(t);
    return { root: { pos: [0, y, z], roll: 90 - (8 + 9 * k) } };
  }
  return spec({
    exerciseId: "side_plank", timing: rep(1.0, 2.6, 0.9, 0.5, pose),
    items: [floor(0, -0.3, 1.6, 2.4), { id: "mat", kind: "box", look: "pad", center: [0.05, 0.006, -0.3], size: [0.62, 0.012, 1.9], touch: ["forearmL", "upperArmL", "footL", "footR", "shinL"] }],
    views: [{ name: "Front, above", yaw: -82, elev: 22 }],
    view3d: { name: "Front, above", yaw: -75, elev: 20 },
    highlight: ["obliques", "glutes"],
    arrow: "pelvis",
    fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "handL", tol: 0.003 }],
    checks: [
      chk.valueAt("Elbow under the shoulder", 2.0, (s) => Math.hypot(s.p.elbowL.x - s.p.shoulderL.x, s.p.elbowL.z - s.p.shoulderL.z), 0, 0.09),
      chk.valueAt("Elbow and forearm on the floor", 2.0, (s) => s.p.elbowL.y, 0.0, 0.08),
      chk.valueAt("Body in one straight line at the top", 2.0, (s) => Math.abs(s.angles.spineFlex) + Math.abs(s.angles.hipFlexL), 0, 12, "°"),
      chk.moves("Hips lift from a sag", (s) => s.p.pelvis.y, 0, 2.0, 0.05),
    ],
  });
})();

// ---------- Bird-dog ----------
// "On hands and knees, hands under shoulders, knees under hips. Slowly reach one arm forward and the OPPOSITE leg back
//  until both are level with your body. Hold 2 s, come back, switch sides. Don't spill the glass on your lower back."
const birdDog = (() => {
  const pelvisY = 0.56;
  const half = (side: 1 | -1, k: number): Pose => {
    const base: Pose = { root: { pos: [0, pelvisY, 0], pitch: 90 }, neck: { flex: -25 } };
    const s = solve(base);
    const shL = s.p.shoulderL, shR = s.p.shoulderR;
    const support = (sh: Vector3, z: number) => armTo([sh.x + 0.02, 0.035, z], [sh.x - 0.4, 0.4, z * 2]);
    const reach = (sh: Vector3, z: number) => armTo([sh.x + 0.02 + 0.58 * k, 0.035 + (sh.y - 0.035) * k, z * (1 - 0.3 * k)], [sh.x, sh.y + 0.4, z * 2]);
    const kneel = (z: number) => ({ to: [-0.43, 0.06, z] as V3, pole: [0.2, -1, z] as V3, sole: [-1, -0.25, 0] as V3 });
    const extend = (z: number) => ({ to: [-0.43 - 0.43 * k, 0.06 + (pelvisY - 0.06 - 0.02) * k, z] as V3, pole: [0.2, -1, z] as V3, sole: [-1, -0.25 + 0.1 * k, 0] as V3 });
    // side +1: right arm + left leg extend
    return {
      ...base,
      armR: side === 1 ? reach(shR, -0.19) : support(shR, -0.19), armL: side === 1 ? support(shL, 0.19) : reach(shL, 0.19),
      legL: side === 1 ? extend(0.11) : kneel(0.11), legR: side === 1 ? kneel(-0.11) : extend(-0.11),
    };
  };
  return spec({
    exerciseId: "bird_dog", timing: alt(half, 1.4, 1.2, 1.2, 0.4),
    items: [floor(0.05), mat(0.05, 1.7)],
    views: [{ name: "Side 3/4", yaw: -28, elev: 24 }],
    highlight: ["lowerBack", "abs", "glutes"],
    arrow: "handR",
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAt("Arm reaches level with the body", 2.0, (s) => s.p.handR.y - s.p.shoulderR.y, -0.08, 0.06),
      chk.valueAt("Opposite leg reaches level with the hips", 2.0, (s) => s.p.ankleL.y - s.p.hipL.y, -0.12, 0.06),
      chk.valueAt("Support hand under the shoulder", 2.0, (s) => Math.abs(s.p.handL.x - s.p.shoulderL.x), 0, 0.08),
      chk.valueAt("Support knee under the hip", 2.0, (s) => Math.abs(s.p.kneeR.x - s.p.hipR.x), 0, 0.08),
    ],
  });
})();

export const CORE: Record<string, Motion> = { dead_bug: deadBug, cable_crunch: cableCrunch, knee_raise: kneeRaise, side_plank: sidePlank, bird_dog: birdDog };
