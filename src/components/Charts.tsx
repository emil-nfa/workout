// Small hand-built SVG charts for the Journal (notebook mode). Rules from the dataviz guidance:
// one series = one accent colour and no legend; 2 px line, 8 px markers with a surface ring; recessive grid;
// hover/tap readout with a crosshair; a table view for every chart; text in ink tokens, never the series colour.
import { useState } from "react";
import type { Point } from "../logic/stats";

const W = 340, H = 170, L = 40, R = 14, T = 14, B = 26;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const nice = (lo: number, hi: number) => {
  const span = hi - lo || Math.max(1, Math.abs(hi) * 0.1);
  const step = Math.pow(10, Math.floor(Math.log10(span / 3)));
  const s = [1, 2, 2.5, 5, 10].map((k) => k * step).find((k) => span / k <= 4) ?? step * 10;
  const a = Math.floor(lo / s) * s, b = Math.ceil(hi / s) * s;
  const ticks: number[] = [];
  for (let v = a; v <= b + 1e-9; v += s) ticks.push(+v.toFixed(6));
  return ticks;
};

export function LineChart({ points, unit, title }: { points: Point[]; unit: string; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  if (!points.length) return <p className="muted">No data yet.</p>;
  const vals = points.map((p) => p.value);
  const ticks = nice(Math.min(...vals), Math.max(...vals));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x = (i: number) => (points.length === 1 ? (L + W - R) / 2 : L + ((W - L - R) * i) / (points.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - (v - y0) / (y1 - y0 || 1));
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const h = hover ?? points.length - 1;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    setHover(best);
  };

  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span className="caps muted">{title}</span>
        <button className="btn link" style={{ minHeight: 32 }} onClick={() => setTable(!table)}>{table ? "Chart" : "Table"}</button>
      </figcaption>
      {table ? (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
          <thead><tr><th style={{ textAlign: "left" }} className="muted">Date</th><th style={{ textAlign: "right" }} className="muted">{unit}</th><th style={{ textAlign: "right" }} className="muted">Set</th></tr></thead>
          <tbody>{[...points].reverse().map((p) => (
            <tr key={p.date} style={{ borderTop: "1px solid var(--rule)" }}><td>{fmtDate(p.date)}</td><td className="num" style={{ textAlign: "right" }}>{p.value}</td><td className="num" style={{ textAlign: "right" }}>{p.label}</td></tr>
          ))}</tbody>
        </table>
      ) : (
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${title}: ${points.length} sessions, latest ${points[points.length - 1].value} ${unit}`}
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y", display: "block" }}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeWidth="1" />
                <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink2)" className="num">{t}</text>
              </g>
            ))}
            <text x={L} y={H - 6} fontSize="11" fill="var(--ink2)">{fmtDate(points[0].date)}</text>
            {points.length > 1 && <text x={W - R} y={H - 6} fontSize="11" fill="var(--ink2)" textAnchor="end">{fmtDate(points[points.length - 1].date)}</text>}
            {hover !== null && <line x1={x(h)} x2={x(h)} y1={T} y2={H - B} stroke="var(--ink2)" strokeWidth="1" strokeDasharray="3 3" />}
            <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={i === h ? 5 : 4} fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />)}
          </svg>
          <div aria-live="polite" style={{ marginTop: 4, fontSize: "0.9rem" }}>
            <b className="num">{points[h].value} {unit}</b> <span className="muted">· {points[h].label} · {fmtDate(points[h].date)}</span>
          </div>
        </div>
      )}
    </figure>
  );
}

/** Weekly hard sets per muscle vs the target: one bar per muscle, target as a tick. */
export function TargetBars({ rows }: { rows: { label: string; value: number; target: number }[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.target)), 1);
  return (
    <div role="table" aria-label="Hard sets this week per muscle, against the target">
      {rows.map((r) => (
        <div key={r.label} role="row" style={{ display: "grid", gridTemplateColumns: "7.5em 1fr 3.2em", alignItems: "center", gap: 8, minHeight: 30 }}>
          <span role="cell" style={{ fontSize: "0.9rem" }}>{r.label}</span>
          <span role="cell" style={{ position: "relative", height: 12, background: "var(--surface2)", borderRadius: 4 }}>
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(100 * r.value) / max}%`, background: "var(--ink)", borderRadius: 4 }} />
            <span title={`Target ${r.target}`} style={{ position: "absolute", top: -3, bottom: -3, width: 2, left: `calc(${(100 * r.target) / max}% - 1px)`, background: "var(--accent)" }} />
          </span>
          <span role="cell" className="num" style={{ textAlign: "right" }}>{+r.value.toFixed(1)}<span className="muted">/{r.target}</span></span>
        </div>
      ))}
    </div>
  );
}

/** Last N weeks as a Monday-first grid, shaded by ink darkness: stretch, workout, both. */
export function ActivityCalendar({ days, weeks = 12 }: { days: Map<string, number>; weeks?: number }) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const shade = (v: number) => (v === 3 ? "var(--ink)" : v === 2 ? "color-mix(in srgb, var(--ink) 62%, var(--bg))" : v === 1 ? "color-mix(in srgb, var(--ink) 28%, var(--bg))" : "var(--surface2)");
  const cells: JSX.Element[] = [];
  for (let w = 0; w < weeks; w++)
    for (let d = 0; d < 7; d++) {
      const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
      if (day > today) continue;
      const v = days.get(key(day)) ?? 0;
      const what = ["Nothing", "Stretch", "Workout", "Workout and stretch"][v];
      cells.push(<rect key={`${w}-${d}`} x={w * 14} y={d * 14} width={12} height={12} rx={2} fill={shade(v)}><title>{`${day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}: ${what}`}</title></rect>);
    }
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${weeks * 14} 98`} width="100%" style={{ maxWidth: 420 }} role="img" aria-label={`Last ${weeks} weeks of workouts and stretching`}>{cells}</svg>
      <figcaption className="muted" style={{ display: "flex", gap: 12, fontSize: "0.8rem", marginTop: 6, flexWrap: "wrap" }}>
        {[1, 2, 3].map((v) => <span key={v} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><span style={{ width: 10, height: 10, borderRadius: 2, background: shade(v), display: "inline-block" }} />{["", "Stretch", "Workout", "Both"][v]}</span>)}
      </figcaption>
    </figure>
  );
}
