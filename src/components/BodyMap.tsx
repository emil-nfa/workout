// Front and back body map: main muscles in cobalt, helpers in light cobalt. Schematic, drawn in-house.
import type { Muscle } from "../data/types";

type R = [number, number, number, number, number?]; // x, y, w, h, radius
// Each region on a 100 × 210 figure; mirrored regions list both sides.
const FRONT: Partial<Record<Muscle, R[]>> = {
  neck: [[44, 26, 12, 9, 3]],
  frontDelts: [[24, 38, 13, 14, 7], [63, 38, 13, 14, 7]],
  sideDelts: [[19, 40, 8, 13, 4], [73, 40, 8, 13, 4]],
  chest: [[36, 40, 14, 16, 5], [50, 40, 14, 16, 5]],
  biceps: [[18, 55, 10, 22, 5], [72, 55, 10, 22, 5]],
  forearms: [[14, 79, 9, 26, 4], [77, 79, 9, 26, 4]],
  abs: [[41, 58, 18, 32, 5]],
  obliques: [[33, 62, 8, 24, 4], [59, 62, 8, 24, 4]],
  hipFlexors: [[37, 92, 10, 10, 4], [53, 92, 10, 10, 4]],
  quads: [[31, 104, 15, 44, 7], [54, 104, 15, 44, 7]],
  adductors: [[45, 104, 5, 30, 3], [50, 104, 5, 30, 3]],
  calves: [[34, 154, 10, 36, 5], [56, 154, 10, 36, 5]],
};
const BACK: Partial<Record<Muscle, R[]>> = {
  neck: [[44, 26, 12, 9, 3]],
  traps: [[38, 30, 24, 14, 6]],
  rearDelts: [[24, 38, 13, 14, 7], [63, 38, 13, 14, 7]],
  sideDelts: [[19, 40, 8, 13, 4], [73, 40, 8, 13, 4]],
  upperBack: [[38, 44, 24, 16, 5]],
  lats: [[31, 54, 13, 26, 6], [56, 54, 13, 26, 6]],
  triceps: [[18, 55, 10, 22, 5], [72, 55, 10, 22, 5]],
  forearms: [[14, 79, 9, 26, 4], [77, 79, 9, 26, 4]],
  lowerBack: [[42, 70, 16, 20, 5]],
  glutes: [[33, 92, 16, 16, 7], [51, 92, 16, 16, 7]],
  hamstrings: [[32, 110, 14, 40, 7], [54, 110, 14, 40, 7]],
  adductors: [[45, 108, 5, 26, 3], [50, 108, 5, 26, 3]],
  calves: [[33, 152, 12, 32, 6], [55, 152, 12, 32, 6]],
};

function Figure({ map, primary, secondary, label }: { map: Partial<Record<Muscle, R[]>>; primary: Set<Muscle>; secondary: Set<Muscle>; label: string }) {
  const rects: JSX.Element[] = [];
  for (const [m, rs] of Object.entries(map) as [Muscle, R[]][]) {
    const fill = primary.has(m) ? "var(--accent)" : secondary.has(m) ? "color-mix(in srgb, var(--accent) 38%, var(--surface2))" : "var(--surface2)";
    rs.forEach(([x, y, w, h, r], i) => rects.push(<rect key={`${m}${i}`} x={x} y={y} width={w} height={h} rx={r ?? 4} fill={fill} />));
  }
  return (
    <figure style={{ margin: 0, textAlign: "center" }}>
      <svg viewBox="0 0 100 200" width="100%" style={{ maxWidth: 120 }} role="img" aria-label={label}>
        <circle cx="50" cy="13" r="11" fill="var(--surface2)" />
        {rects}
      </svg>
      <figcaption className="caps muted">{label}</figcaption>
    </figure>
  );
}

export function BodyMap({ primary, secondary = [] }: { primary: Muscle[]; secondary?: Muscle[] }) {
  const p = new Set(primary), s = new Set(secondary);
  return (
    <div role="img" aria-label={`Muscles worked. Main: ${primary.join(", ")}${secondary.length ? `. Helpers: ${secondary.join(", ")}` : ""}`}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)", maxWidth: 280 }}>
      <Figure map={FRONT} primary={p} secondary={s} label="Front" />
      <Figure map={BACK} primary={p} secondary={s} label="Back" />
    </div>
  );
}
