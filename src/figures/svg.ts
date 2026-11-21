// Style 1: flat vector figure. Projects the 3D rig with an orthographic camera and draws depth-sorted
// shapes (thick limbs, torso outline, head, shaded machine boxes). Colours are CSS variables, so the same
// SVG works on the dark gym screens and the light notebook. Runs in the browser and in Node.
import { Vector3 } from "three";
import { solve, TORSO, WIDTH, type Solved } from "./rig";
import type { Item, Motion, View } from "./motion";
import { D, bandEnds, boxQuat, jointPos, placed, vec } from "./geom";
import type { Muscle } from "../data/types";

const S = 100; // 1 m = 100 SVG units

interface Cam { R: Vector3; U: Vector3; F: Vector3; back: Vector3 }
export function camera(v: View): Cam {
  const e = v.elev * D, y = v.yaw * D;
  const back = new Vector3(-Math.cos(e) * Math.sin(y), Math.sin(e), -Math.cos(e) * Math.cos(y)).normalize();
  const F = back.clone().negate();
  const R = new Vector3(0, 1, 0).cross(F).normalize();
  const U = F.clone().cross(R).normalize();
  return { R, U, F, back };
}
const proj = (c: Cam, p: Vector3): [number, number] => [p.dot(c.R) * S, -p.dot(c.U) * S];
const depth = (c: Cam, p: Vector3) => p.dot(c.F);
const f1 = (n: number) => n.toFixed(1);

const COL = {
  near: "var(--fig-near, var(--ink))",
  far: "var(--fig-far, color-mix(in srgb, var(--ink) 62%, var(--bg)))",
  edge: "var(--bg)",
  accent: "var(--accent)",
  metal: "color-mix(in srgb, var(--ink) 24%, var(--bg))",
  metalDark: "color-mix(in srgb, var(--ink) 16%, var(--bg))",
  metalLight: "color-mix(in srgb, var(--ink) 34%, var(--bg))",
  pad: "color-mix(in srgb, var(--ink) 40%, var(--bg))",
  padDark: "color-mix(in srgb, var(--ink) 30%, var(--bg))",
  cable: "color-mix(in srgb, var(--ink) 72%, var(--bg))",
  shadow: "color-mix(in srgb, var(--ink) 10%, var(--bg))",
  hair: "color-mix(in srgb, var(--ink) 38%, var(--bg))",
};

interface Prim { z: number; svg: string }

function capsule(c: Cam, a: Vector3, b: Vector3, w: number, color: string, outline = true): string {
  const [x1, y1] = proj(c, a), [x2, y2] = proj(c, b);
  const line = (col: string, sw: number) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${col}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  return (outline ? line(COL.edge, w * S + 2.4) : "") + line(color, w * S);
}

function itemPrims(c: Cam, it: Item, s: Solved): Prim[] {
  if (it.kind === "cable") {
    const a = vec(it.from), b = jointPos(s, it.to);
    const [x1, y1] = proj(c, a), [x2, y2] = proj(c, b);
    return [{ z: (depth(c, a) + depth(c, b)) / 2, svg: `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${COL.cable}" stroke-width="2.2" stroke-linecap="round"/>` }];
  }
  if (it.kind === "band") {
    const [a, b] = bandEnds(it, s);
    const [x1, y1] = proj(c, a), [x2, y2] = proj(c, b);
    return [{ z: Math.min(depth(c, a), depth(c, b)) - 0.02, svg: `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${COL.cable}" stroke-width="${it.look === "strap" ? 3 : 2.4}" stroke-linecap="round"/>` }];
  }
  if (it.kind === "cyl") {
    const a = vec(it.a), b = vec(it.b);
    return [{ z: (depth(c, a) + depth(c, b)) / 2, svg: capsule(c, a, b, it.r * 2, it.look === "pad" ? COL.pad : COL.metalLight, false) }];
  }
  if (it.kind === "rod" || it.kind === "db" || it.look === "floor") return []; // rods arrive here already turned into cylinders by placed()
  // Box: draw the faces turned toward the camera, shaded by orientation (top lighter, sides darker).
  const q = boxQuat(it.rot), ctr = vec(it.center), h = it.size.map((x) => x / 2);
  const corner = (sx: number, sy: number, sz: number) => new Vector3(sx * h[0], sy * h[1], sz * h[2]).applyQuaternion(q).add(ctr);
  const faces: { n: Vector3; pts: Vector3[] }[] = [];
  for (const [axis, sign] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]] as const) {
    const n = new Vector3(axis === 0 ? sign : 0, axis === 1 ? sign : 0, axis === 2 ? sign : 0).applyQuaternion(q);
    if (n.dot(c.back) <= 0.02) continue;
    const quad: Vector3[] = [];
    const others = [0, 1, 2].filter((k) => k !== axis);
    for (const [u, w] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const sgn = [0, 0, 0];
      sgn[axis] = sign; sgn[others[0]] = u; sgn[others[1]] = w;
      quad.push(corner(sgn[0], sgn[1], sgn[2]));
    }
    faces.push({ n, pts: quad });
  }
  const pad = it.look === "pad";
  const svg = faces
    .map(({ n, pts }) => {
      const fill = n.y > 0.5 ? (pad ? COL.pad : COL.metalLight) : n.y < -0.5 ? (pad ? COL.padDark : COL.metalDark) : pad ? COL.padDark : COL.metal;
      return `<polygon points="${pts.map((p) => proj(c, p).map(f1).join(",")).join(" ")}" fill="${fill}" stroke="${COL.edge}" stroke-width="0.6" stroke-linejoin="round"/>`;
    })
    .join("");
  return [{ z: depth(c, ctr) + Math.max(...it.size) * 0.15, svg }];
}

/** Screen-space half-width of an elliptical torso section, measured perpendicular to the spine on screen. */
function sectionHalf(frame: { X: Vector3; Z: Vector3 }, a: number, b: number, perp3: Vector3) {
  return Math.sqrt((a * frame.X.dot(perp3)) ** 2 + (b * frame.Z.dot(perp3)) ** 2);
}

function axes(m: import("three").Matrix4) {
  const e = m.elements;
  return { X: new Vector3(e[0], e[1], e[2]).normalize(), Y: new Vector3(e[4], e[5], e[6]).normalize(), Z: new Vector3(e[8], e[9], e[10]).normalize() };
}

const LIMB_MUSCLE: Partial<Record<Muscle, string[]>> = {
  quads: ["thigh"], hamstrings: ["thigh"], adductors: ["thigh"], hipFlexors: ["thigh"], calves: ["shin"],
  biceps: ["upperArm"], triceps: ["upperArm"], forearms: ["forearm"],
};

function bodyPrims(c: Cam, s: Solved, hl: Set<Muscle>): Prim[] {
  const p = s.p;
  const out: Prim[] = [];
  const torsoZ = depth(c, p.waist);
  const col = (z: number) => (z > torsoZ + 0.02 ? COL.far : COL.near);
  const limbHl = new Set<string>();
  for (const m of hl) for (const seg of LIMB_MUSCLE[m] ?? []) limbHl.add(seg);

  const limb = (a: Vector3, b: Vector3, w: number, seg: string) => {
    const z = (depth(c, a) + depth(c, b)) / 2;
    let svg = capsule(c, a, b, w, col(z));
    if (limbHl.has(seg)) {
      const k = 0.18; // keep the joint ends in body colour so the joints read
      svg += capsule(c, a.clone().lerp(b, k), b.clone().lerp(a, k), w * 0.72, COL.accent, false);
    }
    out.push({ z, svg });
  };
  for (const k of ["L", "R"] as const) {
    limb(p[`hip${k}`], p[`knee${k}`], WIDTH.thigh, "thigh");
    limb(p[`knee${k}`], p[`ankle${k}`], WIDTH.shin, "shin");
    limb(p[`heel${k}`], p[`toe${k}`], WIDTH.foot, "foot");
    limb(p[`shoulder${k}`], p[`elbow${k}`], WIDTH.upperArm, "upperArm");
    limb(p[`elbow${k}`], p[`hand${k}`], WIDTH.forearm, "forearm");
    const hz = depth(c, p[`hand${k}`]);
    const [hx, hy] = proj(c, p[`hand${k}`]);
    out.push({ z: hz - 0.001, svg: `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="${f1(WIDTH.hand * S * 0.62)}" fill="${col(hz)}" stroke="${COL.edge}" stroke-width="1.2"/>` });
  }

  // Torso: outline through pelvis, waist and chest sections.
  const fr = { pelvis: axes(s.frames.pelvis), waist: axes(s.frames.waist), chest: axes(s.frames.chest) };
  const chestC = p.chest.clone().sub(fr.chest.Y.clone().multiplyScalar(0.07));
  const secs = [
    { c: p.pelvis.clone().sub(fr.pelvis.Y.clone().multiplyScalar(0.02)), f: fr.pelvis, ...TORSO.pelvis },
    { c: p.waist, f: fr.waist, ...TORSO.waist },
    { c: chestC, f: fr.chest, ...TORSO.chest },
  ];
  const [sx0, sy0] = proj(c, secs[0].c), [sx2, sy2] = proj(c, secs[2].c);
  let dx = sx2 - sx0, dy = sy2 - sy0;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const perp3 = c.R.clone().multiplyScalar(-dy).add(c.U.clone().multiplyScalar(-dx)).normalize(); // screen perpendicular, in 3D
  const left: string[] = [], right: string[] = [];
  for (const sec of secs) {
    const h = sectionHalf(sec.f, sec.a, sec.b, perp3);
    left.push(proj(c, sec.c.clone().add(perp3.clone().multiplyScalar(h))).map(f1).join(","));
    right.unshift(proj(c, sec.c.clone().sub(perp3.clone().multiplyScalar(h))).map(f1).join(","));
  }
  const torsoPath = `M${left[0]} L${left[1]} L${left[2]} L${right[0]} L${right[1]} L${right[2]} Z`;
  const tz = (depth(c, p.pelvis) + depth(c, p.chest)) / 2;
  out.push({ z: tz, svg: `<path d="${torsoPath}" fill="${COL.near}" stroke="${COL.edge}" stroke-width="2.4" stroke-linejoin="round"/><path d="${torsoPath}" fill="${COL.near}" stroke="${COL.near}" stroke-width="7" stroke-linejoin="round"/>` });

  // Torso muscle patches (front = chest-facing side). Visible only when that side faces the camera.
  const patch = (center: Vector3, normal: Vector3, rx: number, ry: number) => {
    if (normal.dot(c.back) < 0.15) return;
    const [x, y] = proj(c, center);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const squash = Math.max(0.35, normal.dot(c.back));
    out.push({ z: depth(c, center) - 0.05, svg: `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx * S * squash)}" ry="${f1(ry * S)}" transform="rotate(${f1(ang)} ${f1(x)} ${f1(y)})" fill="${COL.accent}"/>` });
  };
  const at = (base: Vector3, f: { X: Vector3; Y: Vector3; Z: Vector3 }, x: number, y: number, z: number) =>
    base.clone().add(f.X.clone().multiplyScalar(x)).add(f.Y.clone().multiplyScalar(y)).add(f.Z.clone().multiplyScalar(z));
  const W = fr.waist, C = fr.chest, P = fr.pelvis;
  for (const m of hl) {
    if (m === "chest") for (const sg of [1, -1]) patch(at(chestC, C, 0.1, 0.02, sg * 0.08), C.X.clone().add(C.Z.clone().multiplyScalar(sg * 0.3)), 0.06, 0.05);
    if (m === "abs") patch(at(p.waist, W, 0.09, -0.04, 0), W.X, 0.07, 0.12);
    if (m === "obliques") for (const sg of [1, -1]) patch(at(p.waist, W, 0.02, -0.04, sg * 0.13), W.Z.clone().multiplyScalar(sg).add(W.X.clone().multiplyScalar(0.5)), 0.065, 0.11);
    if (m === "upperBack") for (const sg of [1, -1]) patch(at(chestC, C, -0.11, 0.0, sg * 0.055), C.X.clone().negate(), 0.04, 0.075);
    if (m === "lats") for (const sg of [1, -1]) patch(at(p.waist, W, -0.07, 0.08, sg * 0.11), W.X.clone().negate().add(W.Z.clone().multiplyScalar(sg * 0.6)), 0.05, 0.11);
    if (m === "lowerBack") patch(at(p.waist, W, -0.1, -0.08, 0), W.X.clone().negate(), 0.06, 0.07);
    if (m === "traps") patch(at(p.chest, C, -0.06, -0.01, 0), C.X.clone().negate().add(C.Y), 0.08, 0.04);
    if (m === "glutes") for (const sg of [1, -1]) patch(at(p.pelvis, P, -0.1, -0.06, sg * 0.08), P.X.clone().negate(), 0.07, 0.07);
  }

  // Shoulder caps (deltoids), drawn over the arm root.
  for (const k of ["L", "R"] as const) {
    const sg = k === "L" ? 1 : -1;
    const sh = p[`shoulder${k}`];
    const z = depth(c, sh);
    const [x, y] = proj(c, sh);
    let svg = `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(WIDTH.upperArm * S * 0.62)}" fill="${col(z)}"/>`;
    const delt = (dir: Vector3) => {
      const q = sh.clone().add(dir.multiplyScalar(0.035));
      const [qx, qy] = proj(c, q);
      return `<circle cx="${f1(qx)}" cy="${f1(qy)}" r="${f1(WIDTH.upperArm * S * 0.42)}" fill="${COL.accent}"/>`;
    };
    if (hl.has("rearDelts") && C.X.clone().negate().dot(c.back) > -0.3) svg += delt(C.X.clone().negate());
    if (hl.has("frontDelts") && C.X.dot(c.back) > -0.3) svg += delt(C.X.clone());
    if (hl.has("sideDelts")) svg += delt(C.Z.clone().multiplyScalar(sg));
    out.push({ z: z - 0.01, svg });
  }

  // Neck and head (with a nose so the facing direction reads at a glance).
  const nz = depth(c, p.neckTop);
  out.push({ z: nz, svg: capsule(c, p.chest, p.neckTop, WIDTH.neck, COL.near) });
  const [hx, hy] = proj(c, p.head);
  const [nx, ny] = proj(c, p.nose);
  const headR = 0.105 * S;
  const noseVisible = depth(c, p.nose) < depth(c, p.head) + 0.06;
  let head = `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="${f1(headR + 1.2)}" fill="${COL.edge}"/>`;
  if (noseVisible) head += `<line x1="${f1(hx)}" y1="${f1(hy)}" x2="${f1(nx)}" y2="${f1(ny)}" stroke="${COL.near}" stroke-width="${f1(0.06 * S)}" stroke-linecap="round"/>`;
  head += `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="${f1(headR)}" fill="${COL.near}"/>`;
  // Hair on the back and top of the head: tells front from back at a glance.
  const Hd = axes(s.frames.head);
  const hairC = p.head.clone().sub(Hd.X.clone().multiplyScalar(0.035)).add(Hd.Y.clone().multiplyScalar(0.03));
  const backVis = Hd.X.clone().negate().add(Hd.Y.clone().multiplyScalar(0.6)).normalize().dot(c.back);
  if (backVis > -0.35) {
    const [cx, cy] = proj(c, hairC);
    const r = headR * (0.62 + 0.22 * Math.max(0, backVis));
    head += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${COL.hair}"/>`;
  }
  out.push({ z: depth(c, p.head) - 0.02, svg: head });
  return out;
}

export interface Bounds { x: number; y: number; w: number; h: number }
const boundsCache = new Map<string, Bounds>();

/** Fixed viewBox over the whole rep (so the drawing doesn't jump), with a margin. */
export function boundsFor(m: Motion, view: View): Bounds {
  const key = `${m.exerciseId}|${view.yaw}|${view.elev}`;
  const hit = boundsCache.get(key);
  if (hit) return hit;
  const c = camera(view);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const addP = (p: Vector3, r = 0) => {
    const [x, y] = proj(c, p);
    x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r);
  };
  for (let i = 0; i < 24; i++) {
    const s = solve(m.pose((i / 24) * m.period));
    for (const p of m.frameJoints ? m.frameJoints.map((j) => s.p[j]) : Object.values(s.p)) addP(p, 9);
    if (m.frameJoints) continue;
    for (const it0 of m.items) {
      if (it0.frame === false) continue;
      const it = placed(it0, s);
      if (it.kind === "box" && it.look !== "floor") {
        const q = boxQuat(it.rot), h = it.size.map((v) => v / 2);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) addP(new Vector3(sx * h[0], sy * h[1], sz * h[2]).applyQuaternion(q).add(vec(it.center)));
      } else if (it.kind === "cyl") { addP(vec(it.a), it.r * S); addP(vec(it.b), it.r * S); }
    }
  }
  const pad = 8;
  const b = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  // Square it up so thumbnails and the full view share framing.
  if (b.w > b.h) { b.y -= (b.w - b.h) / 2; b.h = b.w; } else { b.x -= (b.h - b.w) / 2; b.w = b.h; }
  boundsCache.set(key, b);
  return b;
}

export interface SvgOpts { arrow?: boolean; highlight?: boolean; shadow?: boolean }

/** Inner SVG markup for time t (for animation: set innerHTML each frame). */
export function figureInner(m: Motion, t: number, view: View, o: SvgOpts = {}): string {
  const c = camera(view);
  const s = solve(m.pose(t));
  const hl = new Set<Muscle>(o.highlight === false ? [] : m.highlight);
  const prims: Prim[] = [...bodyPrims(c, s, hl)];
  for (const it of m.items) prims.push(...itemPrims(c, placed(it, s), s));
  prims.sort((a, b) => b.z - a.z); // far first

  let under = "";
  if (o.shadow !== false) {
    // Soft floor shadow under the feet / body centre.
    const g = new Vector3((s.p.pelvis.x + s.p.chest.x) / 2, 0, (s.p.pelvis.z + s.p.chest.z) / 2);
    const [x, y] = proj(c, g);
    const ry = Math.max(4, 26 * Math.abs(c.U.y < 0.99 ? Math.sin(view.elev * D) : 1));
    under = `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="46" ry="${f1(ry)}" fill="${COL.shadow}"/>`;
  }
  let over = "";
  if (o.arrow !== false && m.arrow) {
    const pts: string[] = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const k = m.arrowReverse ? 1 - i / n : i / n;
      const tt = m.tA + (m.tB - m.tA) * k;
      pts.push(proj(c, jointPos(solve(m.pose(tt)), m.arrow)).map(f1).join(","));
    }
    over = `<polyline points="${pts.join(" ")}" fill="none" stroke="${COL.accent}" stroke-width="1.6" stroke-dasharray="4 3" stroke-linecap="round" opacity="0.8" marker-end="url(#ah-${m.exerciseId})"/>`;
  }
  const defs = `<defs><marker id="ah-${m.exerciseId}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${COL.accent}"/></marker></defs>`;
  return defs + under + prims.map((p) => p.svg).join("") + over;
}

export function figureSvg(m: Motion, t: number, view: View, o: SvgOpts = {}): string {
  const b = boundsFor(m, view);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(b.x)} ${f1(b.y)} ${f1(b.w)} ${f1(b.h)}" preserveAspectRatio="xMidYMid meet" role="img">${figureInner(m, t, view, o)}</svg>`;
}
