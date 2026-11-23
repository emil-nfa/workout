// Motion for the full-screen player layer (Web Animations API, so it can start from wherever a drag left it):
// - Start / Continue: slides up from the bottom of the screen.
// - Tapping the mini-player pill: grows out of the pill to fill the screen.
// - Minimise (chevron or a downward swipe): shrinks back into the pill; with no pill to go to, slides down.
import { useEffect, useRef } from "react";


const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The pill's box as a clip-path, relative to the full-screen layer. */
function pillClip(layer: HTMLElement): string | null {
  const pill = document.querySelector<HTMLElement>(".mini");
  if (!pill) return null;
  const p = pill.getBoundingClientRect();
  const l = layer.getBoundingClientRect();
  if (!p.width || !l.height) return null;
  const top = p.top - l.top, left = p.left - l.left;
  const right = l.width - (left + p.width), bottom = l.height - (top + p.height);
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${p.height / 2}px)`;
}

const FULL = "inset(0px 0px 0px 0px round 0px)";
// iOS's own sheet curve: quick start, long soft landing.
const IOS = "cubic-bezier(0.32, 0.72, 0, 1)";
const BG = "#0e0e0e", CLEAR = "rgba(14, 14, 14, 0)";

/**
 * The pill morph is drawn by a plain dark "ghost" panel, not by the workout screen itself: animating the clip of a
 * solid panel is cheap, while clipping the whole workout (videos, lists) every frame made the motion stutter.
 */
let opening: { g: HTMLDivElement; layer: HTMLElement } | null = null;
/** True while the grow-from-pill animation runs (drags are ignored until it ends). */
export const isOpening = () => !!opening;
function ghost(): HTMLDivElement {
  const g = document.createElement("div");
  g.className = "player-ghost";
  document.body.appendChild(g);
  return g;
}
const done = (a: Animation, ms: number) => new Promise<void>((res) => {
  let over = false;
  const fin = () => { if (!over) { over = true; res(); } };
  a.finished.then(fin, fin);
  window.setTimeout(fin, ms + 120); // never hang on a paused page
});

export function animateOpen(layer: HTMLElement, from: "bottom" | "pill"): void {
  if (reduced()) return;
  const clip = from === "pill" ? pillClip(layer) : null;
  if (!clip) {
    layer.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 480, easing: IOS });
    return;
  }
  // The pill's dark body grows to fill the screen, then the workout fades in on top of it.
  layer.style.opacity = "0";
  const g = ghost();
  g.style.zIndex = "49"; // under the workout layer, so the workout can fade in on top of it
  const me = { g, layer };
  opening = me;
  const grow = g.animate(
    [{ clipPath: clip, backgroundColor: CLEAR }, { backgroundColor: BG, offset: 0.15 }, { clipPath: FULL, backgroundColor: BG }],
    { duration: 460, easing: IOS, fill: "forwards" },
  );
  // The iOS curve covers most of the distance in the first half: fade the workout in from there, no black pause.
  window.setTimeout(() => {
    if (opening !== me) return; // a close took over
    layer.style.opacity = "";
    const show = layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    void Promise.all([done(show, 220), done(grow, 460)]).then(() => { g.remove(); if (opening === me) opening = null; });
  }, 200);
}

/** Resolves when the layer has left the screen. `dy` = how far a drag had already pulled it down. */
export async function animateClose(layer: HTMLElement, dy = 0): Promise<void> {
  // A close during the open animation: drop the opening panel and start from the real screen.
  if (opening) { opening.g.remove(); opening.layer.style.opacity = ""; opening = null; }
  if (reduced()) return;
  layer.style.transition = "";
  const clip = (() => { const t = layer.style.transform; layer.style.transform = ""; const c = pillClip(layer); layer.style.transform = t; return c; })();
  if (!clip) {
    layer.style.transform = "";
    const a = layer.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(100%)" }], { duration: 320, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "forwards" });
    return done(a, 320);
  }
  // 1. A dark panel fades in over the workout, where the drag left it.
  const g = ghost();
  g.style.transform = `translateY(${dy}px)`;
  await done(g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 110, fill: "forwards" }), 110);
  layer.style.visibility = "hidden";
  layer.style.transform = "";
  // 2. That panel shrinks into the pill and melts into it.
  const shrink = g.animate(
    [
      { transform: `translateY(${dy}px)`, clipPath: `inset(0px 0px 0px 0px round ${dy ? 40 : 0}px)`, backgroundColor: BG },
      { backgroundColor: BG, offset: 0.8 },
      { transform: "translateY(0px)", clipPath: clip, backgroundColor: CLEAR },
    ],
    { duration: 460, easing: IOS, fill: "forwards" },
  );
  await done(shrink, 460);
  window.setTimeout(() => g.remove(), 50);
}

/**
 * Pull the player down to minimise it: from the header at any time, or from anywhere when the
 * page is scrolled to the top (like an iOS sheet). Past ~1/6 of the screen, or a quick flick, it closes.
 */
export function useDragToClose(ref: React.RefObject<HTMLElement>, active: boolean, onClose: (dy: number) => void): void {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    let y0 = 0, x0 = 0, t0 = 0, dy = 0, dragging = false, eligible = false, lastY = 0, lastT = 0, vel = 0;

    const start = (e: TouchEvent) => {
      const t = e.target as HTMLElement;
      // Never steal touches from sheets, the rest bar or the number pad.
      eligible = e.touches.length === 1 && !opening && !t.closest(".scrim, .rest, .sheet, [role='dialog'], input, textarea")
        && (!!t.closest(".wk-head") || el.scrollTop <= 0);
      if (!eligible) return;
      y0 = lastY = e.touches[0].clientY; x0 = e.touches[0].clientX; t0 = lastT = e.timeStamp; dy = 0; dragging = false; vel = 0;
    };
    const move = (e: TouchEvent) => {
      if (!eligible) return;
      const y = e.touches[0].clientY, x = e.touches[0].clientX;
      const d = y - y0;
      if (!dragging) {
        // Upward or sideways: it's a scroll or a tap, let it be.
        if (d < 0 || Math.abs(x - x0) > Math.abs(d) + 6) { eligible = false; return; }
        // Downward: claim it at once, or iOS starts its own bounce scroll and both move (the old glitch).
        e.preventDefault();
        if (d < 6) return;
        dragging = true;
        el.style.willChange = "transform";
      }
      e.preventDefault();
      dy = Math.max(0, d - 6);
      const dt = e.timeStamp - lastT;
      if (dt > 0) vel = (y - lastY) / dt;
      lastY = y; lastT = e.timeStamp;
      el.style.transform = `translateY(${dy}px)`;
    };
    const end = () => {
      if (!eligible || !dragging) { eligible = false; return; }
      eligible = dragging = false;
      el.style.willChange = "";
      const h = el.getBoundingClientRect().height || 800;
      if (dy > h / 6 || (dy > 40 && vel > 0.5) || e_t0_quick()) {
        close.current(dy);
      } else {
        const from = dy;
        el.style.transform = "";
        el.animate([{ transform: `translateY(${from}px)` }, { transform: "translateY(0)" }], { duration: 300, easing: IOS });
      }
    };
    const e_t0_quick = () => dy > 60 && lastT - t0 < 180;

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      // Don't reset the transform here: this runs as the close starts, and the close animation picks up from it.
      el.style.willChange = "";
    };
  }, [ref, active]);
}
