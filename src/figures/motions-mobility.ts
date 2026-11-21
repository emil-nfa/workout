// Mobility and stretch motion specs (warm-ups and the stretch routines), each written from its how-to text.
import { Vector3 } from "three";
import { solve, type Pose, type V3 } from "./rig";
import type { Item, Motion } from "./motion";
import { angleBetween, chestForward, D } from "./geom";
import { STAND, armTo, chk, feet, floor, rep, spec } from "./kit";

const v3 = (w: Vector3): V3 => [w.x, w.y, w.z];
const mat = (cx: number, len = 1.9, w = 0.62, cz = 0): Item => ({ id: "mat", kind: "box", look: "pad", center: [cx, 0.006, cz], size: [len, 0.012, w], touch: ["torsoLow", "torsoUp", "head", "thighL", "thighR", "shinL", "shinR", "footL", "footR", "upperArmL", "upperArmR", "forearmL", "forearmR"] });
const lean = (s: ReturnType<typeof solve>) => Math.atan2(s.p.chest.x - s.p.pelvis.x, s.p.chest.y - s.p.pelvis.y) / D;
/** Ping-pong 0 -> 1 -> 0 for continuous drills (no holds). */
const swing = (period: number, f: (k: number) => Pose) => ({ pose: (t: number) => f((1 - Math.cos((2 * Math.PI * t) / period)) / 2), period, tA: 0, tB: period / 2 });

// Quadruped base (hands under shoulders, knees under hips), used by cat-cow.
const QUAD_Y = 0.5;
const quadHands = (() => { const s = solve({ root: { pos: [0, QUAD_Y, 0], pitch: 90 } }); return { L: s.p.shoulderL.x + 0.02, R: s.p.shoulderR.x + 0.02 }; })();

// ---------- Cat-cow ----------
// "On hands and knees. Breathe in: let the belly drop, look up (cow). Breathe out: round the back up high, tuck the chin (cat)."
const catCow = spec({
  exerciseId: "cat_cow",
  timing: swing(4.4, (k) => ({
    root: { pos: [0, QUAD_Y, 0], pitch: 90 }, spine: { flex: -24 + 60 * k }, neck: { flex: -30 + 65 * k },
    armL: armTo([quadHands.L, 0.035, 0.19], [0, 0.4, 0.5]), armR: armTo([quadHands.R, 0.035, -0.19], [0, 0.4, -0.5]),
    legL: { to: [-0.43, 0.06, 0.11], pole: [0.2, -1, 0.11], sole: [-1, -0.25, 0] }, legR: { to: [-0.43, 0.06, -0.11], pole: [0.2, -1, -0.11], sole: [-1, -0.25, 0] },
  })),
  items: [floor(0.05), mat(0.05, 1.5)],
  views: [{ name: "Side", yaw: -15, elev: 14 }],
  highlight: ["lowerBack", "upperBack"],
  arrow: "chest",
  fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "handL", tol: 0.004 }, { joint: "kneeL", tol: 0.003 }],
  checks: [
    chk.moves("Back moves from arched (cow) to rounded (cat)", (s) => s.angles.spineFlex, 0, 2.2, 50, "°"),
    chk.moves("Head looks up, then tucks", (s) => s.p.head.y, 0, 2.2, 0.1),
  ],
});

// ---------- Open book ----------
// "Lie on your side, knees bent at 90° and stacked, arms straight out in front. Keep the knees together and open the top
//  arm across to the other side, following your hand with your eyes. Breathe out at the end, then close the book."
const openBook = (() => {
  const base = (k: number): Pose => ({
    root: { pos: [0, 0.2, 0], roll: 90 }, spine: { twist: -55 * k }, neck: { twist: -40 * k },
    legL: { flex: 90, knee: 90 }, legR: { flex: 90, knee: 90 },
    armL: { flex: 88, elbow: 3 },
  });
  const pose = (k: number): Pose => {
    const b = base(k);
    const sh = solve(b).p.shoulderR;
    const phi = (5 + 165 * k) * D;
    return { ...b, armR: armTo([sh.x + 0.6 * Math.cos(phi), Math.max(0.04, sh.y + 0.6 * Math.sin(phi)), sh.z + 0.02], [sh.x, sh.y - 0.1, sh.z + 0.5]) };
  };
  return spec({
    exerciseId: "open_book", timing: rep(1.6, 1.2, 1.6, 0.4, pose),
    items: [floor(0.1, 0, 1.6, 2.2), { ...mat(0.1, 1.1, 1.9), touch: ["torsoLow", "torsoUp", "head", "thighL", "thighR", "shinL", "shinR", "footL", "footR", "upperArmL", "upperArmR", "forearmL", "forearmR"] }],
    views: [{ name: "Front, above", yaw: -80, elev: 50 }],
    highlight: ["upperBack", "chest"],
    arrow: "handR",
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "kneeL", tol: 0.003 }, { joint: "kneeR", tol: 0.003 }],
    checks: [
      chk.valueAt("Top arm travels across to the other side", 2.2, (s) => s.p.handR.x, -0.8, -0.3),
      { name: "Upper back turns open (chest rotates ≥ 35°)", run: (_f, at) => { const a = angleBetween(chestForward(at(0)), chestForward(at(2.2))); return { ok: a >= 35, detail: `${a.toFixed(0)}°` }; } },
      chk.valueAlways("Knees stay stacked together", (s) => s.p.kneeL.distanceTo(s.p.kneeR), 0, 0.2),
    ],
  });
})();

// ---------- Wall angel ----------
// "Back, head and bum against the wall, arms in a W with elbows and wrists touching the wall. Slide the arms up into a Y
//  while keeping contact. Slide back down, squeezing shoulder blades down. Ribs down."
const wallAngel = (() => {
  const wallX = -0.09;
  const W: V3 = [wallX + 0.02, 1.62, 0.39], Y: V3 = [wallX + 0.02, 1.98, 0.37];
  const pose = (k: number): Pose => ({
    root: { pos: [0.02, STAND - 0.02, 0], pitch: -2 }, ...feet(0.1, 0.12),
    armL: armTo([W[0], W[1] + (Y[1] - W[1]) * k, W[2] + (Y[2] - W[2]) * k], [wallX - 0.3, 1.3, 1.0]),
    armR: armTo([W[0], W[1] + (Y[1] - W[1]) * k, -(W[2] + (Y[2] - W[2]) * k)], [wallX - 0.3, 1.3, -1.0]),
  });
  return spec({
    exerciseId: "wall_slide", timing: rep(1.6, 0.4, 1.6, 0.4, pose),
    items: [floor(), { id: "wall", kind: "box", look: "pad", frame: false, center: [wallX - 0.17, 1.1, 0], size: [0.1, 2.2, 1.6], touch: ["torsoUp", "torsoLow", "head", "upperArmL", "upperArmR", "forearmL", "forearmR"] }],
    views: [{ name: "Front 3/4", yaw: -55, elev: 10 }],
    highlight: ["traps", "upperBack"],
    arrow: "handL",
    fixed: [{ joint: "chest", tol: 0.003 }],
    checks: [
      chk.valueAlways("Wrists stay on the wall", (s) => s.p.handL.x - wallX, -0.01, 0.07),
      chk.valueAlways("Elbows stay on the wall", (s) => s.p.elbowL.x - wallX, -0.05, 0.09),
      chk.valueAt("Arms reach a Y at the top", 1.8, (s) => s.p.handL.y - s.p.head.y, 0.2, 0.5),
      chk.valueAt("W at the bottom: elbows near shoulder height", 0, (s) => Math.abs(s.p.elbowL.y - s.p.shoulderL.y), 0, 0.12),
    ],
  });
})();

// ---------- Chin tuck ----------
// "Stand or sit tall. Glide your head straight back, making a double chin, without tilting up or down. Hold 3 s, relax."
const chinTuck = spec({
  exerciseId: "chin_tuck",
  timing: rep(0.8, 1.6, 0.8, 0.6, (k) => ({ root: { pos: [0, STAND - 0.01, 0] }, ...feet(0, 0.12), neck: { flex: 14 - 24 * k, head: -14 + 24 * k }, armL: { flex: 4, abd: 6, elbow: 6 }, armR: { flex: 4, abd: 6, elbow: 6 } })),
  views: [{ name: "Side", yaw: -8, elev: 6 }],
  highlight: ["neck"],
  arrow: "nose",
  checks: [
    chk.moves("Head glides straight back", (s) => s.p.head.x, 0, 1.6, 0.025),
    { name: "Head stays level (no nodding)", run: (f) => { const v = f.map((s) => Math.atan2(s.p.nose.y - s.p.head.y, s.p.nose.x - s.p.head.x) / D); return { ok: Math.max(...v) - Math.min(...v) < 3, detail: `tilt varies ${(Math.max(...v) - Math.min(...v)).toFixed(1)}°` }; } },
  ],
});

// ---------- Leg swings ----------
// "Hold a rack or wall, stand on one leg. Swing the free leg forward and back, gradually higher. Relaxed, smooth."
const legSwing = spec({
  exerciseId: "leg_swing",
  timing: swing(1.6, (k) => ({
    root: { pos: [0, STAND - 0.02, 0] },
    legL: { to: [0, 0.08, 0.12], pole: [1, 0.55, 0.12], sole: [1, 0, 0] },
    legR: { flex: -24 + 82 * k, abd: 3, knee: 4 + 8 * k, ankle: 10 * k },
    armL: armTo([0.12, 1.12, 0.56], [-0.2, 0.9, 0.8]), armR: { flex: 10, abd: 12, elbow: 20 },
  })),
  items: [floor(), { id: "rack", kind: "cyl", look: "metal", a: [0.12, 0, 0.6], b: [0.12, 1.9, 0.6], r: 0.035, touch: ["forearmL"] }],
  views: [{ name: "Side 3/4", yaw: -25, elev: 10 }],
  highlight: ["hipFlexors", "hamstrings"],
  arrow: "ankleR",
  fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "chest", tol: 0.003 }, { joint: "handL", tol: 0.004 }],
  checks: [chk.moves("Big swing, front to back", (s) => s.angles.hipFlexR, 0, 0.8, 70, "°"), chk.angleAlways("Leg stays nearly straight", "kneeR", 0, 15)],
});

// ---------- Single-leg RDL (bodyweight) ----------
// "Stand on one leg, knee soft. Hinge forward at the hip, 3 s down, as the free leg rises straight behind you, back flat.
//  Body and back leg move as one straight plank. Stand back up by squeezing the glute."
const slRdl = spec({
  exerciseId: "sl_rdl_bw",
  timing: rep(3.0, 0.4, 1.2, 0.5, (k) => {
    const p = 72 * k;
    return {
      root: { pos: [-0.16 * k, 0.94 - 0.02 * k, 0.04 * k], pitch: p }, neck: { flex: -8 * k },
      legL: { to: [0, 0.08, 0.1], pole: [1, 0.55, 0.12], sole: [1, 0, 0] },
      legR: { flex: 2 * k, abd: 2, knee: 4, ankle: -20 * k },
      armL: { flex: p, abd: 6, elbow: 5 }, armR: { flex: p, abd: 6, elbow: 5 },
    };
  }),
  views: [{ name: "Side", yaw: -12, elev: 10 }],
  highlight: ["hamstrings", "glutes"],
  arrow: "head",
  fixed: [{ joint: "ankleL", tol: 0.003 }],
  checks: [
    chk.valueAt("Torso hinges well forward", 3.2, lean, 60, 80, "°"),
    chk.angleAlways("Back flat", "spineFlex", -1, 1),
    chk.angleAlways("Back leg in line with the body (one plank)", "hipFlexR", -5, 8),
    chk.angleAlways("Standing knee soft, not a squat", "kneeL", 0, 30),
  ],
});

// ---------- March on the spot ----------
const march = spec({
  exerciseId: "march",
  timing: {
    pose: (t: number) => {
      const w = (2 * Math.PI * t) / 1.0;
      const lift = (ph: number) => Math.max(0, Math.sin(w + ph));
      const leg = (ph: number) => ({ flex: 85 * lift(ph), abd: 2, knee: 90 * lift(ph), ankle: -15 * lift(ph) });
      return { root: { pos: [0, STAND - 0.005, 0] }, legL: leg(0), legR: leg(Math.PI), armL: { flex: 35 * Math.sin(w + Math.PI), abd: 6, elbow: 80 }, armR: { flex: 35 * Math.sin(w), abd: 6, elbow: 80 } };
    },
    period: 1.0, tA: 0, tB: 0.25,
  },
  views: [{ name: "Side 3/4", yaw: -30, elev: 10 }],
  highlight: ["quads", "calves"],
  checks: [
    chk.valueAlways("Feet never sink into the floor", (s) => Math.min(s.p.heelL.y, s.p.toeL.y, s.p.heelR.y, s.p.toeR.y), -0.025, 0.6),
    chk.valueAt("Knees come up high", 0.25, (s) => s.p.kneeL.y - s.p.hipL.y, -0.15, 0.1),
  ],
});

// ---------- Doorway chest stretch ----------
// "Forearm on the door frame, elbow at shoulder height. Step through with the same-side foot until you feel a stretch
//  across the chest. Don't let the shoulder roll forward."
const pecDoor = (() => {
  const frameX = -0.07;
  const pose = (k: number): Pose => ({
    root: { pos: [0.02 + 0.1 * k, 0.875, 0], pitch: 4 + 4 * k, yaw: -6 * k },
    legL: { to: [0.32, 0.08, 0.14], pole: [1.3, 0.55, 0.16], sole: [1, 0, 0] }, legR: { to: [-0.2, 0.08, -0.12], pole: [0.8, 0.5, -0.14], sole: [1, 0, 0] },
    armL: armTo([frameX + 0.03, 1.7, 0.53], [frameX - 0.7, 1.38, 1.0]), armR: { flex: 6, abd: 8, elbow: 10 },
  });
  return spec({
    exerciseId: "pec_door", timing: rep(1.6, 2.2, 1.4, 0.4, pose),
    items: [floor(), { id: "frame", kind: "box", look: "pad", frame: false, center: [frameX - 0.06, 1.1, 0.62], size: [0.1, 2.2, 0.12], touch: ["forearmL", "upperArmL"] }, { id: "wall", kind: "box", look: "metal", frame: false, center: [frameX - 0.06, 1.1, 1.0], size: [0.1, 2.2, 0.65] }],
    views: [{ name: "Front 3/4", yaw: -60, elev: 15 }],
    highlight: ["chest", "frontDelts"],
    arrow: "chest",
    fixed: [{ joint: "handL", tol: 0.004 }],
    checks: [
      chk.valueAt("Elbow at shoulder height", 2.5, (s) => Math.abs(s.p.elbowL.y - s.p.shoulderL.y), 0, 0.09),
      chk.valueAlways("Forearm stays on the frame", (s) => Math.abs(s.p.elbowL.x - frameX), 0, 0.09),
      chk.moves("Chest steps through the doorway", (s) => s.p.chest.x, 0, 2.5, 0.08),
    ],
  });
})();

// ---------- Child's pose lat stretch ----------
// "Kneel, sit back on your heels, reach your arms far forward on the floor. Walk both hands to the right to stretch the
//  left side, then to the left. Sink the hips back, chest toward the floor."
const childLat = (() => {
  const P = 6;
  const pose = (t: number): Pose => {
    const x = ((t % P) + P) % P;
    const side = Math.sin((2 * Math.PI * x) / P); // centre -> right -> centre -> left
    const zH = -0.22 * side;
    return {
      root: { pos: [-0.3, 0.29, 0], pitch: 104, yaw: -8 * side }, spine: { flex: 18, side: 16 * side }, neck: { flex: 10 },
      legL: { to: [-0.43, 0.06, 0.11], pole: [0.4, 0.1, 0.11], sole: [-1, -0.25, 0] }, legR: { to: [-0.43, 0.06, -0.11], pole: [0.4, 0.1, -0.11], sole: [-1, -0.25, 0] },
      armL: armTo([0.43, 0.035, 0.16 + zH], [0.2, 0.4, 0.4 + zH]), armR: armTo([0.43, 0.035, -0.16 + zH], [0.2, 0.4, -0.4 + zH]),
    };
  };
  return spec({
    exerciseId: "child_lat", timing: { pose, period: P, tA: 0, tB: P / 4 },
    items: [floor(0.05), mat(0.05, 1.6, 0.9)],
    views: [{ name: "Above, behind", yaw: 130, elev: 50 }],
    highlight: ["lats"],
    arrow: "handsMid",
    fixed: [{ joint: "kneeL", tol: 0.025 }, { joint: "ankleL", tol: 0.003 }],
    checks: [
      chk.valueAlways("Hips stay back near the heels", (s) => s.p.pelvis.x - s.p.ankleL.x, 0, 0.2),
      chk.valueAlways("Hands stay on the floor", (s) => Math.max(s.p.handL.y, s.p.handR.y), 0, 0.06),
      chk.valueAt("Hands walk to the side", 1.5, (s) => Math.abs((s.p.handL.z + s.p.handR.z) / 2), 0.15, 0.4),
      chk.angleAlways("Knees stay within range", "kneeL", 130, 160),
    ],
  });
})();

// ---------- Thoracic extension over a roller ----------
// "Roller across your upper back (below the shoulder blades), hands supporting your head, hips on the floor. Let your upper
//  back drape back over the roller, breathe out. Never on the lower back. Keep the ribs down."
const thoracicRoll = (() => {
  const pitch = -76;
  const base = (k: number): Pose => ({
    root: { pos: [0, 0.11, 0], pitch }, spine: { flex: -24 * k }, neck: { flex: 6 - 8 * k },
    legL: { to: [0.48, 0.08, 0.13], pole: [0.5, 1, 0.13], sole: [1, 0, 0] }, legR: { to: [0.48, 0.08, -0.13], pole: [0.5, 1, -0.13], sole: [1, 0, 0] },
  });
  const pose = (k: number): Pose => {
    const b = base(k);
    const s = solve(b);
    const back = s.p.head.clone().sub(s.p.nose).normalize();
    const at = (z: number) => v3(s.p.head.clone().add(back.clone().multiplyScalar(0.11)).add(new Vector3(0, 0, z)));
    return { ...b, armL: armTo(at(0.08), [s.p.head.x + 0.2, s.p.head.y + 0.4, 0.6]), armR: armTo(at(-0.08), [s.p.head.x + 0.2, s.p.head.y + 0.4, -0.6]) };
  };
  const s0 = solve(base(0));
  const rollAt = s0.p.waist.clone().lerp(s0.p.chest, 0.15);
  return spec({
    exerciseId: "thoracic_roll", timing: rep(2.0, 1.4, 1.6, 0.6, pose),
    items: [floor(-0.1), mat(-0.1, 1.6), { id: "roller", kind: "cyl", look: "pad", a: [rollAt.x, 0.075, 0.42], b: [rollAt.x, 0.075, -0.42], r: 0.075, touch: ["torsoUp", "torsoLow", "upperArmL", "upperArmR"] }],
    views: [{ name: "Side 3/4", yaw: -22, elev: 16 }],
    highlight: ["upperBack"],
    arrow: "head",
    contacts: [{ joint: "waist", item: "roller", max: 0.14 }],
    fixed: [{ joint: "pelvis", tol: 0.003 }],
    checks: [
      chk.valueAlways("Hips stay on the floor", (s) => s.p.pelvis.y, 0.09, 0.13),
      chk.angleAt("Upper back extends over the roller", "spineFlex", 2.5, -30, -15),
      chk.valueAlways("Hands support the head", (s) => s.p.handL.distanceTo(s.p.head), 0, 0.2),
    ],
  });
})();

// ---------- Kneeling hip-flexor stretch ----------
// "Half-kneel, back knee on a mat. Squeeze the glute of the back leg and tuck your pelvis under. Shift slightly forward
//  until the front of the back hip stretches; reach the same-side arm up. Small movement, big glute squeeze."
const hipFlexor = spec({
  exerciseId: "hip_flexor",
  timing: rep(1.4, 1.6, 1.2, 0.4, (k) => ({
    root: { pos: [0.02 + 0.09 * k, 0.53 - 0.03 * k, 0], pitch: -4 },
    legL: { to: [0.46, 0.08, 0.13], pole: [1.4, 0.7, 0.15], sole: [1, 0, 0] },
    legR: { to: [-0.43, 0.06, -0.13], pole: [0.3, -1, -0.13], sole: [-1, -0.25, 0] },
    armR: { flex: 20 + 150 * k, abd: 8, elbow: 8 }, armL: { flex: 25, abd: 10, elbow: 35 },
  })),
  items: [floor(), mat(0.0, 1.3)],
  views: [{ name: "Side", yaw: -15, elev: 10 }],
  highlight: ["hipFlexors", "quads"],
  arrow: "pelvis",
  fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
  checks: [
    chk.valueAlways("Back knee stays on the mat", (s) => s.p.kneeR.y, 0, 0.1),
    chk.valueAlways("Torso upright (no arching)", lean, -8, 8, "°"),
    chk.moves("Hips shift forward", (s) => s.p.pelvis.x, 0, 2.2, 0.07),
    chk.valueAlways("Front knee not past the toes", (s) => s.p.kneeL.x - s.p.toeL.x, -0.6, 0.03),
  ],
});

// ---------- Lying hamstring stretch with a strap (PNF) ----------
// "Lie on your back, strap around one foot, other leg flat. Keep the knee straight and pull the leg up until a strong
//  stretch behind the thigh. Contract-relax: push the heel into the strap, relax, pull a little deeper."
const hamStrap = (() => {
  const pose = (k: number): Pose => ({
    root: { pos: [0, 0.11, 0], pitch: -90 }, neck: { flex: 12 },
    legL: { flex: 0, knee: 0, ankle: 10 },
    legR: { flex: 52 + 26 * k, abd: 2, knee: 3, ankle: 8 },
    armL: armTo([-0.12, 0.36, -0.05], [-0.25, 0.05, 0.45]), armR: armTo([-0.12, 0.36, -0.16], [-0.25, 0.05, -0.5]),
  });
  return spec({
    exerciseId: "ham_strap", timing: rep(2.2, 2.0, 1.0, 1.0, pose),
    items: [floor(0.1), mat(0.1, 2.0), { id: "strapL", kind: "band", a: "handL", b: "toeR", look: "strap" }, { id: "strapR", kind: "band", a: "handR", b: "toeR", look: "strap" }],
    views: [{ name: "Side 3/4", yaw: -20, elev: 18 }],
    highlight: ["hamstrings"],
    arrow: "ankleR",
    fixed: [{ joint: "pelvis", tol: 0.003 }, { joint: "ankleL", tol: 0.003 }],
    checks: [
      chk.angleAlways("Raised knee stays straight", "kneeR", 0, 6),
      chk.valueAlways("Other leg stays flat on the floor", (s) => s.p.ankleL.y, 0.0, 0.14),
      chk.moves("Leg comes up deeper into the stretch", (s) => s.angles.hipFlexR, 0, 3.2, 20, "°"),
    ],
  });
})();

// ---------- Figure-4 glute stretch ----------
// "On your back, knees bent. Cross your right ankle over your left knee (a 4). Pull the left thigh toward your chest until
//  the right buttock stretches. Push the crossed knee gently away."
const glute4 = (() => {
  const base = (k: number): Pose => ({ root: { pos: [0, 0.11, 0], pitch: -90 }, neck: { flex: 15 }, legL: { flex: 62 + 30 * k, abd: 0, knee: 92, ankle: 5 } });
  const pose = (k: number): Pose => {
    const b = base(k);
    const s = solve(b);
    const kn = s.p.kneeL, hp = s.p.hipL;
    const onKnee = kn.clone().lerp(hp, 0.12).add(new Vector3(0, 0.07, 0.02));
    const thighMid = kn.clone().lerp(hp, 0.45);
    return {
      ...b,
      legR: { to: v3(onKnee), pole: [s.p.hipR.x + 0.3, s.p.hipR.y + 0.2, -0.8] },
      armL: armTo(v3(thighMid.clone().add(new Vector3(0, -0.04, 0.09))), [thighMid.x - 0.3, 0.05, 0.6]),
      armR: armTo(v3(thighMid.clone().add(new Vector3(-0.12, -0.02, 0.04))), [thighMid.x - 0.4, 0.05, -0.3]),
    };
  };
  return spec({
    exerciseId: "glute_fig4", timing: rep(1.8, 2.2, 1.4, 0.6, pose),
    items: [floor(0.0), mat(0.0, 1.6)],
    views: [{ name: "Side 3/4", yaw: -40, elev: 30 }],
    highlight: ["glutes"],
    arrow: "kneeL",
    fixed: [{ joint: "pelvis", tol: 0.003 }],
    checks: [
      chk.valueAlways("Right ankle stays crossed on the left knee", (s) => s.p.ankleR.distanceTo(s.p.kneeL), 0, 0.16),
      chk.angleAt("Left thigh pulled toward the chest", "hipFlexL", 2.5, 85, 100),
      chk.valueAlways("Crossed knee points out to the side", (s) => -s.p.kneeR.z, 0.25, 0.7),
    ],
  });
})();

// ---------- Wall calf stretch ----------
// "Hands on the wall, one foot back with the leg straight, heel down. Lean into the wall until the back calf stretches.
//  Back toes point straight forward."
const calfWall = (() => {
  const wallX = 0.78;
  const pose = (k: number): Pose => ({
    root: { pos: [0.02 + 0.08 * k, 0.867 - 0.047 * k, 0], pitch: 12 + 6 * k },
    legL: { to: [0.3, 0.08, 0.13], pole: [1.3, 0.55, 0.15], sole: [1, 0, 0] }, legR: { to: [-0.36, 0.08, -0.13], pole: [1, 0.4, -0.15], sole: [1, 0, 0] },
    armL: armTo([wallX - 0.04, 1.32, 0.24], [0.4, 0.8, 0.7]), armR: armTo([wallX - 0.04, 1.32, -0.24], [0.4, 0.8, -0.7]),
  });
  return spec({
    exerciseId: "calf_wall", timing: rep(1.6, 2.2, 1.2, 0.5, pose),
    items: [floor(), { id: "wall", kind: "box", look: "pad", frame: false, center: [wallX + 0.05, 1.1, 0], size: [0.1, 2.2, 1.4], touch: ["forearmL", "forearmR"] }],
    views: [{ name: "Side 3/4", yaw: -25, elev: 10 }],
    highlight: ["calves"],
    arrow: "pelvis",
    contacts: [{ joint: "handL", item: "wall", max: 0.06 }],
    fixed: [{ joint: "handL", tol: 0.015 }, { joint: "ankleR", tol: 0.003 }],
    checks: [
      chk.valueAlways("Back heel stays down", (s) => Math.abs(s.p.toeR.y - s.p.heelR.y), 0, 0.01),
      chk.angleAlways("Back knee straight", "kneeR", 0, 8),
      chk.moves("Leans into the wall", (s) => s.p.pelvis.x, 0, 2.7, 0.06),
      chk.angleAt("Back ankle bends into the stretch", "ankleR", 2.7, 10, 38),
    ],
  });
})();

// ---------- Seated pike ----------
// "Legs straight, towel around both feet. Pull the chest forward with a flat back: hinge from the hips, don't round
//  to fake depth. Chest toward the knees, not the head."
const seatedPike = spec({
  exerciseId: "seated_pike",
  timing: rep(2.2, 2.4, 1.6, 0.6, (k) => ({
    root: { pos: [0, 0.12, 0], pitch: 4 + 38 * k }, spine: { flex: 4 + 8 * k }, neck: { flex: 5 },
    legL: { to: [0.87, 0.085, 0.1], pole: [0.4, 1, 0.1], sole: [0.05, 1, 0] }, legR: { to: [0.87, 0.085, -0.1], pole: [0.4, 1, -0.1], sole: [0.05, 1, 0] },
    armL: armTo([0.48 + 0.24 * k, 0.4 - 0.14 * k, 0.12], [0.3, 0.1, 0.5]), armR: armTo([0.48 + 0.24 * k, 0.4 - 0.14 * k, -0.12], [0.3, 0.1, -0.5]),
  })),
  items: [floor(0.3), mat(0.3, 1.4), { id: "towelL", kind: "band", a: "handL", b: "toeL", look: "strap" }, { id: "towelR", kind: "band", a: "handR", b: "toeR", look: "strap" }],
  views: [{ name: "Side", yaw: -12, elev: 12 }],
  highlight: ["hamstrings", "calves"],
  arrow: "chest",
  fixed: [{ joint: "ankleL", tol: 0.003 }],
  checks: [
    chk.angleAlways("Knees straight", "kneeL", 0, 6),
    chk.angleAlways("Flat back: the hinge is at the hips", "spineFlex", 0, 14),
    chk.moves("Chest travels forward toward the knees", (s) => s.p.chest.x, 0, 3.4, 0.2),
  ],
});

// ---------- Pancake straddle lean ----------
// "Legs wide, tilt the pelvis forward, chest proud. 30 s to the centre, 30 s over each leg."
const pancake = spec({
  exerciseId: "pancake",
  timing: rep(2.2, 2.4, 1.6, 0.6, (k) => ({
    root: { pos: [0, 0.12, 0], pitch: 4 + 34 * k }, spine: { flex: 3 + 7 * k }, neck: { flex: -5 },
    legL: { to: [0.67, 0.085, 0.655], pole: [0.6, 1, 0.655], sole: [0.05, 1, 0] }, legR: { to: [0.67, 0.085, -0.655], pole: [0.6, 1, -0.655], sole: [0.05, 1, 0] },
    armL: armTo([0.36 + 0.3 * k, 0.035, 0.16], [0.2, 0.5, 0.5]), armR: armTo([0.36 + 0.3 * k, 0.035, -0.16], [0.2, 0.5, -0.5]),
  })),
  items: [floor(0.3), mat(0.3, 1.3, 1.6)],
  views: [{ name: "Front, above", yaw: -70, elev: 40 }],
  highlight: ["adductors", "hamstrings"],
  arrow: "chest",
  fixed: [{ joint: "ankleL", tol: 0.003 }, { joint: "ankleR", tol: 0.003 }],
  checks: [
    chk.valueAlways("Legs wide apart", (s) => s.p.ankleL.z - s.p.ankleR.z, 1.1, 1.5),
    chk.angleAlways("Knees straight, pointing up", "kneeL", 0, 8),
    chk.angleAlways("Chest proud: hinge from the hips", "spineFlex", 0, 12),
    chk.moves("Leans forward", (s) => s.p.chest.x, 0, 3.4, 0.15),
  ],
});

export const MOBILITY: Record<string, Motion> = {
  cat_cow: catCow, open_book: openBook, wall_slide: wallAngel, chin_tuck: chinTuck, leg_swing: legSwing, sl_rdl_bw: slRdl,
  march, pec_door: pecDoor, child_lat: childLat, thoracic_roll: thoracicRoll, hip_flexor: hipFlexor, ham_strap: hamStrap,
  glute_fig4: glute4, calf_wall: calfWall, seated_pike: seatedPike, pancake,
};
