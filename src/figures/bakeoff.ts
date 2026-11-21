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
  // Gallery: every exercise in the chosen style (3D), for the user's own review (checking loop, step 5).
  const groups = ["Back", "Chest", "Shoulders", "Posture", "Arms", "Legs", "Core", "Mobility", "Stretch"];
  let h = `<div class="wrap"><h1>Exercise visuals</h1><p class="q">All ${Object.keys(MOTIONS).length} movements in the app. Watch each one: if a movement looks wrong or you can't tell what it is, send me its name.</p>`;
  for (const g of groups) {
    const list = Object.keys(MOTIONS).filter((id) => EXERCISE_BY_ID[id]?.group === g);
    if (!list.length) continue;
    h += `<h2>${g}</h2><div class="pair">`;
    for (const id of list) {
      const e = EXERCISE_BY_ID[id];
      h += `<div class="cell"><div class="stage"><video data-lazy="${base}figures3d/${id}.mp4" poster="${base}figures3d/${id}.jpg" loop muted playsinline preload="none"></video></div>
        <div style="font-weight:600;margin-top:6px">${e.name}</div><div class="fr" style="margin:0">${e.fr}</div></div>`;
    }
    h += `</div>`;
  }
  app.innerHTML = h + `<p class="q" style="margin-top:24px">${Object.keys(MOTIONS).length} movements · rendered from the app's rig, checked automatically against each how-to.</p></div>`;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const v = en.target as HTMLVideoElement;
      if (en.isIntersecting) { if (!v.src) v.src = v.dataset.lazy!; void v.play().catch(() => {}); } else v.pause();
    }
  }, { rootMargin: "100px" });
  document.querySelectorAll("video[data-lazy]").forEach((v) => io.observe(v));
  void figureInner; void svgBox; void video;
}

