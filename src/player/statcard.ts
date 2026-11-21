// Shareable stat card: a small scoreboard poster (1080 × 1350, Instagram portrait).
// Colours from the statCard theme tokens; numbers in Barlow Condensed with tabular figures.
import themes from "../styles/themes.json";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { ProgramSession } from "../data/types";
import type { WorkoutSession } from "../db/db";
import type { Summary } from "../logic/workout";
import { fmtClock } from "../logic/rotation";

const T = (themes as unknown as Record<string, Record<string, string>>).statCard;

export async function renderStatCard(s: WorkoutSession, ps: ProgramSession, sum: Summary): Promise<Blob> {
  await document.fonts.ready;
  const W = 1080, H = 1350, M = 84;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const num = (w: number, px: number) => `${w} ${px}px "Barlow Condensed", system-ui, sans-serif`;
  const ui = (w: number, px: number) => `${w} ${px}px "Barlow", system-ui, sans-serif`;
  const rule = (y: number) => { g.fillStyle = T.rule; g.fillRect(M, y, W - 2 * M, 3); };

  g.fillStyle = T.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = T.accent; g.fillRect(M, M, 120, 14); // the one cobalt mark

  const date = new Date(s.startedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  g.fillStyle = T.ink2; g.font = ui(600, 34); g.textBaseline = "alphabetic";
  g.fillText(date.toUpperCase(), M, M + 90);

  g.fillStyle = T.ink; g.font = num(700, 210);
  g.fillText(`${s.key} · ${ps.title}`.toUpperCase(), M, M + 300, W - 2 * M);
  rule(M + 350);

  const stats: [string, string][] = [["TIME", fmtClock(sum.durationSec)], ["SETS", String(sum.sets)], ["KG MOVED", sum.volumeKg.toLocaleString("en-GB")]];
  const share = [0.42, 0.2, 0.38]; // time and kg need more room than the set count
  let x = M;
  stats.forEach(([k, v], i) => {
    const colW = (W - 2 * M) * share[i];
    g.fillStyle = T.ink2; g.font = ui(600, 30); g.fillText(k, x, M + 420);
    g.fillStyle = T.ink; g.font = num(700, 124); g.fillText(v, x, M + 556, colW - 48);
    x += colW;
  });
  rule(M + 610);

  let y = M + 690;
  g.fillStyle = T.ink2; g.font = ui(600, 30);
  g.fillText(sum.prs.length ? "PERSONAL RECORDS" : "EXERCISES", M, y);
  y += 30;
  const lines = sum.prs.length
    ? sum.prs.map((p) => [EXERCISE_BY_ID[p.exerciseId]?.name ?? p.exerciseId, `${p.weight} × ${p.reps}`])
    : ps.slots.map((sl) => [EXERCISE_BY_ID[s.swaps?.[ps.slots.indexOf(sl)] ?? sl.exerciseId]?.name ?? "", ""]);
  for (const [name, val] of lines.slice(0, 6)) {
    y += 78;
    if (sum.prs.length) {
      g.fillStyle = T.chip; g.fillRect(M, y - 44, 76, 52);
      g.fillStyle = T.onChip; g.font = num(700, 38); g.fillText("PR", M + 14, y - 3);
    }
    g.fillStyle = T.ink; g.font = ui(500, 46);
    g.fillText(name, M + (sum.prs.length ? 100 : 0), y, W - 2 * M - 320);
    if (val) { g.font = num(700, 64); g.textAlign = "right"; g.fillText(val, W - M, y + 4); g.textAlign = "left"; }
  }

  rule(H - M - 70);
  g.fillStyle = T.ink2; g.font = ui(600, 30);
  g.fillText("UPPER / LOWER ROTATION", M, H - M);

  return new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
}
