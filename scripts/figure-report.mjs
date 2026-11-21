// Prints every check for every motion (used in the checking loop).
import { createServer } from "vite";
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error", optimizeDeps: { noDiscovery: true, include: [] } });
const { MOTIONS } = await server.ssrLoadModule("/src/figures/motions.ts");
const { runChecks } = await server.ssrLoadModule("/src/figures/checks.ts");
let fails = 0;
for (const [id, m] of Object.entries(MOTIONS)) {
  console.log(`\n${id}`);
  for (const r of runChecks(m)) { if (!r.ok) fails++; console.log(`  ${r.ok ? "ok  " : "FAIL"} ${r.name}: ${r.detail}`); }
}
await server.close();
process.exit(fails ? 1 : 0);
