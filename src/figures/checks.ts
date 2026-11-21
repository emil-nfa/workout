// Automatic checks on the pose data (checking loop, step 2). Run by Vitest and by the review script.
import { solve, type Solved } from "./rig";
import type { CheckResult, Motion } from "./motion";
import { bodySegments, jointPos, placed, sdItem } from "./geom";

/** Human joint ranges (degrees) the drawings must respect. */
const LIMITS: Record<string, [number, number]> = {
  kneeL: [0, 160], kneeR: [0, 160], elbowL: [0, 150], elbowR: [0, 150],
  hipFlexL: [-30, 135], hipFlexR: [-30, 135], hipAbdL: [-25, 60], hipAbdR: [-25, 60],
  ankleL: [-90, 35], ankleR: [-90, 35], // kneeling with the foot flat behind = full plantarflexion spineFlex: [-30, 80],
};

export function sample(m: Motion, n = 96): Solved[] {
  return Array.from({ length: n }, (_, i) => solve(m.pose((i / n) * m.period)));
}

export function runChecks(m: Motion): CheckResult[] {
  const frames = sample(m);
  const at = (t: number) => solve(m.pose(t));
  const out: CheckResult[] = [];

  const ik = frames.flatMap((f) => f.errors);
  out.push({ name: "Every contact target is reachable (no stretched limbs)", ok: ik.length === 0, detail: ik.length ? [...new Set(ik)].join("; ") : "ok" });

  const bad: string[] = [];
  for (const f of frames)
    for (const [k, [lo, hi]] of Object.entries(LIMITS)) {
      const a = f.angles[k];
      if (a !== undefined && (a < lo - 0.5 || a > hi + 0.5)) bad.push(`${k} ${a.toFixed(0)}°`);
    }
  out.push({ name: "Joints stay within human ranges", ok: !bad.length, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(", ") : "ok" });

  for (const c of m.contacts) {
    const item = m.items.find((i) => i.id === c.item)!;
    const worst = Math.max(...frames.map((f) => sdItem(placed(item, f), jointPos(f, c.joint))));
    out.push({ name: `${c.joint} stays on ${c.item}`, ok: worst <= c.max, detail: `max gap ${worst.toFixed(3)} m (limit ${c.max})` });
  }

  for (const fx of m.fixed) {
    const p0 = jointPos(frames[0], fx.joint);
    const worst = Math.max(...frames.map((f) => jointPos(f, fx.joint).distanceTo(p0)));
    out.push({ name: `${fx.joint} does not move`, ok: worst <= fx.tol, detail: `moves ${worst.toFixed(3)} m` });
  }

  const hits = new Set<string>();
  for (const f of frames)
    for (const seg of bodySegments(f))
      for (const it of m.items) {
        if (it.kind === "cable" || it.kind === "band" || (m.touch[it.id] ?? it.touch ?? []).includes(seg.name)) continue;
        const item = placed(it, f);
        for (let k = 0; k <= 6; k++) {
          const p = seg.a.clone().lerp(seg.b, k / 6);
          if (sdItem(item, p) < -seg.r * 0.25) { hits.add(`${seg.name} through ${it.id}`); break; }
        }
      }
  out.push({ name: "No limb passes through the equipment", ok: !hits.size, detail: hits.size ? [...hits].join(", ") : "ok" });

  for (const c of m.checks) {
    const r = c.run(frames, at);
    out.push({ name: c.name, ...r });
  }
  return out;
}
