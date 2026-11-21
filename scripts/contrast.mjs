// WCAG 2.x contrast check of every text/icon token pair in every theme state.
// Text pairs need >= 4.5:1. Filled shapes / large digits need >= 3:1. Exit code 1 on any failure.
import fs from "node:fs";
const themes = JSON.parse(fs.readFileSync(new URL("../src/styles/themes.json", import.meta.url)));
const lum = (hex) => {
  const c = hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const TEXT = 4.5, SHAPE = 3;
const checks = [];
for (const [name, t] of Object.entries(themes)) {
  if (name.startsWith("_")) continue;
  for (const ground of ["bg", "surface", "surface2"]) {
    for (const fg of ["ink", "ink2", "suggest", "accent", "danger"]) checks.push([name, fg, ground, t[fg], t[ground], TEXT]);
  }
  checks.push([name, "onAccent", "accent fill", t.onAccent, t.accent, TEXT]);
  checks.push([name, "onDanger", "danger fill", t.onDanger, t.danger, TEXT]);
  checks.push([name, "onChip", "chip (PR)", t.onChip, t.chip, TEXT]);
  checks.push([name, "accent shape", "bg", t.accent, t.bg, SHAPE]);
  checks.push([name, "ink", "accentSoft", t.ink, t.accentSoft, TEXT]);
}
let fail = 0;
for (const [theme, fg, ground, a, b, min] of checks) {
  const r = ratio(a, b);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${theme.padEnd(13)} ${fg.padEnd(13)} on ${ground.padEnd(12)} ${r.toFixed(2)}:1 (min ${min})`);
}
console.log(fail ? `\n${fail} pair(s) below threshold` : `\nAll ${checks.length} pairs pass`);
process.exit(fail ? 1 : 0);
