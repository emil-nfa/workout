// The M3 bake-off page (bakeoff.html): both styles side by side, full size and at thumbnail size,
// on the dark gym ground and the light notebook ground. ?sheet=1 shows frozen frames for review.
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "../styles/base.css";
import { injectTheme } from "../styles/theme";
import { MOTIONS, BAKEOFF } from "./motions";
import { figureInner, figureSvg, boundsFor } from "./svg";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { Motion, View } from "./motion";

injectTheme();
const params = new URLSearchParams(location.search);
const sheet = params.has("sheet");
const only = params.get("id");
const base = import.meta.env.BASE_URL;
const app = document.getElementById("app")!;
document.documentElement.dataset.mode = params.get("mode") === "light" ? "" : "gym";
if (params.get("mode") === "light") delete document.documentElement.dataset.mode;

const css = `
  body{margin:0} .wrap{max-width:900px;margin:0 auto;padding:16px}
  h1{font:600 2rem/1.1 var(--font-num);margin:8px 0 4px;text-transform:uppercase}
  h2{font:600 1.5rem/1.1 var(--font-num);margin:28px 0 2px}
  .fr{color:var(--ink2);font-size:.9rem;margin-bottom:10px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .cell{background:var(--surface);border-radius:12px;padding:8px}
  .cell .lbl{font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin-bottom:4px}
  .stage{aspect-ratio:1;width:100%}
  .stage svg,.stage video,.stage img{width:100%;height:100%;display:block;border-radius:8px}
  .thumbs{display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap}
  .t48{width:48px;height:48px;border-radius:8px;background:var(--surface2);overflow:hidden;display:grid;place-items:center}
  .t48 svg,.t48 img,.t48 video{width:48px;height:48px;object-fit:cover}
  .light{--bg:#F4EFE4;--surface:#EDE6D7;--surface2:#E4DCCA;--ink:#1C1B19;--ink2:#57524A;--accent:#2D4FD6;--rule:#D3CAB7;background:var(--bg);color:var(--ink);padding:8px;border-radius:12px}
  .views{display:flex;gap:6px;margin:6px 0}
  .views button{min-height:36px;border-radius:8px;border:1.5px solid var(--rule);background:none;color:var(--ink);font-weight:600;padding:0 10px}
  .views button[aria-pressed=true]{border-color:var(--accent);color:var(--accent)}
  .sheetrow{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:6px}
  .sheetrow .stage{background:var(--surface);border-radius:8px}
  .cap{font-size:.7rem;color:var(--ink2);text-align:center}
  .q{color:var(--ink2);font-size:.95rem}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

const svgBox = (m: Motion, v: View) => { const b = boundsFor(m, v); return `viewBox="${b.x} ${b.y} ${b.w} ${b.h}"`; };
const video = (id: string, cls = "") =>
  `<video class="${cls}" src="${base}figures3d/${id}.mp4" poster="${base}figures3d/${id}.jpg" autoplay loop muted playsinline preload="auto"></video>`;

const ids = (only ? [only] : [...BAKEOFF]) as string[];

if (sheet) {
  // Frozen frames: for each motion and view, 5 moments through the rep.
  let h = `<div class="wrap">`;
  for (const id of ids) {
    const m = MOTIONS[id];
    for (const v of m.views) {
      h += `<h2>${EXERCISE_BY_ID[id].name} · ${v.name}</h2><div class="sheetrow">`;
      const ts = [0, 0.25, 0.5, 0.75, 1].map((k) => m.tA + (m.tB - m.tA) * k);
      for (const t of ts) h += `<div><div class="stage">${figureSvg(m, t, v, { arrow: t === ts[4] })}</div><div class="cap">t=${t.toFixed(2)}s</div></div>`;
      h += `</div>`;
    }
  }
  app.innerHTML = h + `</div>`;
} else {
  let h = `<div class="wrap"><h1>Pick a style</h1><p class="q">Same movement, two ways of drawing it. Watch each one at full size and as a small icon, then tell me which you recognise faster at the gym.</p>`;
  for (const id of ids) {
    const m = MOTIONS[id], e = EXERCISE_BY_ID[id];
    h += `<section data-id="${id}"><h2>${e.name}</h2><div class="fr">${e.fr}</div>
      <div class="views">${m.views.map((v, i) => `<button data-view="${i}" aria-pressed="${i === 0}">${v.name}</button>`).join("")}</div>
      <div class="pair">
        <div class="cell"><div class="lbl">Style 1 · flat drawing</div><div class="stage"><svg data-anim="${id}" ${svgBox(m, m.views[0])} preserveAspectRatio="xMidYMid meet"></svg></div></div>
        <div class="cell"><div class="lbl">Style 2 · 3D mannequin</div><div class="stage">${video(id)}</div></div>
      </div>
      <div class="thumbs"><span class="q">Icon size:</span>
        <div class="t48">${figureSvg(m, m.tB, m.views[0], { arrow: false })}</div>
        <div class="t48"><img src="${base}figures3d/${id}-48.png" alt=""></div>
        <div class="light thumbs" style="margin:0"><div class="t48">${figureSvg(m, m.tB, m.views[0], { arrow: false })}</div><div class="t48"><img src="${base}figures3d/${id}-48.png" alt=""></div></div>
      </div>
      <p class="q" style="margin-top:10px"><b>How:</b> ${e.how[0]} ${e.how[1] ?? ""}</p>
    </section>`;
  }
  h += `<h2>On the light notebook</h2><div class="light pair">${ids.map((id) => `<div class="stage"><svg data-anim="${id}" data-light ${svgBox(MOTIONS[id], MOTIONS[id].views[0])}></svg></div>`).join("")}</div></div>`;
  app.innerHTML = h;

  const viewOf: Record<string, number> = {};
  app.querySelectorAll<HTMLButtonElement>("button[data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      const sec = b.closest("section")!;
      const id = sec.dataset.id!;
      viewOf[id] = Number(b.dataset.view);
      sec.querySelectorAll("button[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const svg = sec.querySelector("svg[data-anim]")!;
      const bb = boundsFor(MOTIONS[id], MOTIONS[id].views[viewOf[id]]);
      svg.setAttribute("viewBox", `${bb.x} ${bb.y} ${bb.w} ${bb.h}`);
    }),
  );
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  let last = 0;
  const tick = (now: number) => {
    if (now - last > 40) {
      last = now;
      document.querySelectorAll<SVGSVGElement>("svg[data-anim]").forEach((svg) => {
        const r = svg.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const id = svg.dataset.anim!, m = MOTIONS[id];
        const t = reduce ? m.tB : ((now - t0) / 1000) % m.period;
        svg.innerHTML = figureInner(m, t, m.views[svg.hasAttribute("data-light") ? 0 : viewOf[id] ?? 0]);
      });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
