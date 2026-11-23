// Motion for the full-screen player layer:
// - Start / Continue: slides up from the bottom of the screen.
// - Tapping the mini-player pill: grows out of the pill to fill the screen.
// - Minimise (chevron or a downward swipe): shrinks back into the pill; with no pill to go to, slides down.
//
// Everything here animates `transform` and `opacity` only, with a cubic-bezier curve, so Safari runs it on the GPU
// compositor and it can't drop frames while React renders or videos decode (see src/lib/motion.ts for the why).
import { useEffect, useRef } from "react";
import { IOS_EASE as IOS, finished as done, reducedMotion as reduced } from "../lib/motion";

interface Box { x: number; y: number; w: number; h: number }

function pillBox(): Box | null {
  const pill = document.querySelector<HTMLElement>(".mini");
  if (!pill) return null;
  const r = pill.getBoundingClientRect();
  return r.width ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
}

/**
 * The pill morph is drawn by a plain dark "ghost" panel made of three slices: a rounded top cap, a middle that
 * stretches (scaleY) and a rounded bottom cap. Moving and stretching the slices with transforms changes the panel's
 * size without distorting its round ends and without any repaint: the GPU just moves three textures.
 */
class Ghost {
  el: HTMLDivElement;
  private parts: HTMLDivElement[];
  constructor(private W: number, private H: number, private R: number, z: number) {
    this.el = document.createElement("div");
    this.el.className = "player-ghost";
    this.el.style.zIndex = String(z);
    this.el.style.height = `${H}px`;
    const part = (cls: string, h: number) => { const d = document.createElement("div"); d.className = cls; d.style.width = `${W}px`; d.style.height = `${h}px`; this.el.appendChild(d); return d; };
    // Caps are 1px taller so they overlap the middle: no hairline seam while it stretches.
    this.parts = [part("g-top", R + 1), part("g-mid", H - 2 * R), part("g-bot", R + 1)];
    this.parts[0].style.borderRadius = `${R}px ${R}px 0 0`;
    this.parts[2].style.borderRadius = `0 0 ${R}px ${R}px`;
    document.body.appendChild(this.el);
  }
  private frames(b: Box): [string, string, string] {
    const { W, H, R } = this;
    const sx = b.w / W;
    const sy = Math.max(0.0001, (b.h - 2 * R) / (H - 2 * R));
    return [
      `translate(${b.x}px, ${b.y}px) scale(${sx}, 1)`,
      `translate(${b.x}px, ${b.y + R}px) scale(${sx}, ${sy})`,
      `translate(${b.x}px, ${b.y + b.h - R - 1}px) scale(${sx}, 1)`,
    ];
  }
  /** Animate from one box to another; resolves when done. */
  move(from: Box, to: Box, duration: number): Promise<void> {
    const a = this.frames(from), b = this.frames(to);
    const anims = this.parts.map((p, i) => p.animate([{ transform: a[i] }, { transform: b[i] }], { duration, easing: IOS, fill: "forwards" }));
    return done(anims[0], duration);
  }
  fade(keyframes: Keyframe[], duration: number): Promise<void> {
    return done(this.el.animate(keyframes, { duration, fill: "forwards" }), duration);
  }
  remove() { this.el.remove(); }
}

let opening: { g: Ghost; layer: HTMLElement | null; t0: number; grow: Promise<void> } | null = null;
/** True while the grow-from-pill animation runs (drags are ignored until it ends). */
export const isOpening = () => !!opening;

/**
 * Opening from the pill, step 1 (called on the tap, before React builds the workout screen): the pill's dark body
 * starts growing right away on the GPU, so building the screen can't delay or stutter the motion.
 */
export function startPillOpen(): boolean {
  if (reduced()) return false;
  if (opening) return true; // a double tap: already on its way
  const pill = pillBox();
  if (!pill) return false;
  const W = window.innerWidth, H = Math.max(window.innerHeight, document.documentElement.clientHeight, screen.height || 0);
  const g = new Ghost(W, H, pill.h / 2, 49); // under the workout layer, so the workout can fade in on top
  void g.fade([{ opacity: 0.85 }, { opacity: 1, offset: 0.12 }, { opacity: 1 }], 500);
  const grow = g.move(pill, { x: 0, y: 0, w: W, h: H }, 500);
  opening = { g, layer: null, t0: performance.now(), grow };
  return true;
}

export function animateOpen(layer: HTMLElement, from: "bottom" | "pill"): void {
  if (reduced()) return;
  const me = opening;
  if (from === "pill" && me && !me.layer) {
    // Step 2: the screen is built; it fades in on top of the growing panel (no dark pause at the end).
    me.layer = layer;
    layer.style.opacity = "0";
    const wait = Math.max(0, 190 - (performance.now() - me.t0));
    window.setTimeout(() => {
      if (opening !== me) return; // a close took over
      layer.style.opacity = "";
      const show = layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      void Promise.all([done(show, 220), me.grow]).then(() => { me.g.remove(); if (opening === me) opening = null; });
    }, wait);
    return;
  }
  layer.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 500, easing: IOS });
}

/** Resolves when the layer has left the screen. `dy` = how far a drag had already pulled it down. */
export async function animateClose(layer: HTMLElement, dy = 0): Promise<void> {
  // A close during the open animation: drop the opening panel and start from the real screen.
  if (opening) { opening.g.remove(); if (opening.layer) opening.layer.style.opacity = ""; opening = null; }
  if (reduced()) return;
  layer.style.transition = "";
  const pill = pillBox();
  if (!pill) {
    layer.style.transform = "";
    const a = layer.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(100%)" }], { duration: 340, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "forwards" });
    return done(a, 340);
  }
  const W = layer.clientWidth || window.innerWidth;
  const t = layer.style.transform; layer.style.transform = "";
  const H = layer.getBoundingClientRect().height || window.innerHeight;
  layer.style.transform = t;
  const full: Box = { x: 0, y: dy, w: W, h: H };
  // 1. A dark panel fades in over the workout, where the drag left it.
  const g = new Ghost(W, H, pill.h / 2, 52);
  void g.move(full, full, 1);
  await g.fade([{ opacity: 0 }, { opacity: 1 }], 120);
  layer.style.visibility = "hidden";
  layer.style.transform = "";
  // 2. It shrinks into the pill and melts into it (the pill under it is the real one).
  void g.fade([{ opacity: 1 }, { opacity: 1, offset: 0.72 }, { opacity: 0 }], 480);
  await g.move(full, pill, 480);
  window.setTimeout(() => g.remove(), 40);
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
