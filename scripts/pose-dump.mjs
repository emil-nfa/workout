// Debug helper: node scripts/pose-dump.mjs <motionId> [t1 t2 ...] -> joint angles and key positions.
import { createServer } from "vite";
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error", optimizeDeps: { noDiscovery: true, include: [] } });
const { MOTIONS } = await server.ssrLoadModule("/src/figures/motions.ts");
const { solve } = await server.ssrLoadModule("/src/figures/rig.ts");
const [id, ...ts] = process.argv.slice(2);
const m = MOTIONS[id];
const f = (v) => `(${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)})`;
for (const t of (ts.length ? ts.map(Number) : [m.tA, m.tB])) {
  const s = solve(m.pose(t));
  console.log(`t=${t}`, JSON.stringify(Object.fromEntries(Object.entries(s.angles).map(([k, v]) => [k, Math.round(v)]))));
  for (const j of ["pelvis", "chest", "hipL", "kneeL", "ankleL", "heelL", "toeL", "shoulderL", "elbowL", "handL"]) console.log(`  ${j} ${f(s.p[j])}`);
}
await server.close();
