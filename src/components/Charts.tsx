// Small hand-built SVG charts for the Journal (notebook mode). Rules from the dataviz guidance:
// one series = one accent colour and no legend; 2 px line, 8 px markers with a surface ring; recessive grid;
// hover/tap readout with a crosshair; a table view for every chart; text in ink tokens, never the series colour.
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Point } from "../logic/stats";

const W = 340, H = 170, L = 40, R = 14, T = 14, B = 26;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const nice = (lo: number, hi: number) => {
  const span = hi - lo || Math.max(1, Math.abs(hi) * 0.1);
  const step = Math.pow(10, Math.floor(Math.log10(span / 3)));
  const s = [1, 2, 2.5, 5, 10].map((k) => k * step).find((k) => span / k <= 4) ?? step * 10;
  let a = Math.floor(lo / s) * s, b = Math.ceil(hi / s) * s;
  if (a === b) { a -= s; b += s; } // a single value still gets an axis around it
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
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const SHADE = (v: number) => (v === 3 ? "var(--ink)" : v === 2 ? "color-mix(in srgb, var(--ink) 62%, var(--bg))" : v === 1 ? "color-mix(in srgb, var(--ink) 28%, var(--bg))" : "var(--surface)");

/**
 * One month at a time: the 1st sits top-left and the days run on in rows of seven.
 * Swipe left / right (or use the arrows) to change month. Never goes past the current month.
 */
export function MonthCalendar({ days }: { days: Map<string, number> }) {
  const now = new Date();
  const thisMonth = now.getFullYear() * 12 + now.getMonth();
  const firstData = [...days.keys()].sort()[0];
  const minMonth = firstData ? Math.min(thisMonth, +firstData.slice(0, 4) * 12 + +firstData.slice(5, 7) - 1) : thisMonth;
  const [m, setM] = useState(thisMonth);
  const [anim, setAnim] = useState<"" | "from-left" | "from-right">("");
  const go = (d: number) => {
    const n = m + d;
    if (n > thisMonth || n < minMonth) return;
    setAnim(d > 0 ? "from-right" : "from-left");
    setM(n);
  };
  const touch = useRef<{ x: number; y: number } | null>(null);

  const year = Math.floor(m / 12), month = m % 12;
  const count = new Date(year, month + 1, 0).getDate();
  const todayKey = dayKey(now);
  const title = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  let active = 0;
  const cells = Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const k = dayKey(d);
    const v = days.get(k) ?? 0;
    if (v) active++;
    const future = d > now && k !== todayKey;
    const what = ["Nothing", "Stretch", "Workout", "Workout and stretch"][v];
    return (
      <div key={k} className={`cal-day${k === todayKey ? " today" : ""}${future ? " future" : ""}`}
        style={{ background: future ? "transparent" : SHADE(v), color: v >= 2 ? "var(--bg)" : undefined }}
        aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}: ${future ? "not yet" : what}`} role="gridcell">
        <span className="num">{i + 1}</span>
      </div>
    );
  });

  return (
    <figure className="cal" style={{ margin: 0 }}
      onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        const t = touch.current; touch.current = null;
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
      }}>
      <div className="cal-head">
        <button className="cal-arrow" onClick={() => go(-1)} disabled={m <= minMonth} aria-label="Previous month"><ChevronLeft size={22} aria-hidden /></button>
        <div className="cal-title" aria-live="polite">
          <b>{title}</b>
          <span className="muted num">{active} {active === 1 ? "active day" : "active days"}</span>
        </div>
        <button className="cal-arrow" onClick={() => go(1)} disabled={m >= thisMonth} aria-label="Next month"><ChevronRight size={22} aria-hidden /></button>
      </div>
      <div key={m} className={`cal-grid ${anim}`} role="grid" aria-label={title}>{cells}</div>
      <figcaption className="muted" style={{ display: "flex", gap: 12, fontSize: "0.8rem", marginTop: 10, flexWrap: "wrap" }}>
        {[1, 2, 3].map((v) => <span key={v} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: SHADE(v), display: "inline-block" }} />{["", "Stretch", "Workout", "Both"][v]}</span>)}
      </figcaption>
    </figure>
  );
}
