// Motion for the full-screen player layer (Web Animations API, so it can start from wherever a drag left it):
// - Start / Continue: slides up from the bottom of the screen.
// - Tapping the mini-player pill: grows out of the pill to fill the screen.
// - Minimise (chevron or a downward swipe): shrinks back into the pill; with no pill to go to, slides down.
import { useEffect, useRef } from "react";

const EASE_OUT = "cubic-bezier(0.2, 0.9, 0.2, 1)";
const EASE_IN_OUT = "cubic-bezier(0.4, 0, 0.2, 1)";

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
  return `inset(${top}px ${right}px ${bottom}px ${left}px round 22px)`;
}

const FULL = "inset(0px 0px 0px 0px round 0px)";

export function animateOpen(layer: HTMLElement, from: "bottom" | "pill"): void {
  if (reduced()) return;
  const clip = from === "pill" ? pillClip(layer) : null;
  if (clip) {
    layer.animate([{ clipPath: clip }, { clipPath: FULL }], { duration: 520, easing: EASE_OUT });
    // The workout fades in as the pill grows (a class, because the content can mount a moment after the layer).
    layer.classList.add("growing");
    window.setTimeout(() => layer.classList.remove("growing"), 520);
  } else {
    layer.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 440, easing: EASE_OUT });
  }
}

/** Resolves when the layer has left the screen. `dy` = how far a drag had already pulled it down. */
export function animateClose(layer: HTMLElement, dy = 0): Promise<void> {
  if (reduced()) return Promise.resolve();
  const clip = pillClip(layer);
  const content = layer.firstElementChild as HTMLElement | null;
  const start = `translateY(${dy}px)`;
  layer.style.transform = "";
  let a: Animation;
  if (clip) {
    a = layer.animate(
      [{ transform: start, clipPath: `inset(0px 0px 0px 0px round ${dy ? 32 : 0}px)` }, { transform: "translateY(0)", clipPath: clip }],
      { duration: 420, easing: EASE_IN_OUT, fill: "forwards" },
    );
    content?.animate([{ opacity: 1 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }], { duration: 420, fill: "forwards" });
  } else {
    a = layer.animate([{ transform: start }, { transform: "translateY(100%)" }], { duration: 300, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "forwards" });
  }
  // Never wait on the animation alone (a paused or throttled page would leave the player stuck half-closed).
  const ms = clip ? 420 : 300;
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    a.finished.then(finish, finish);
    window.setTimeout(finish, ms + 120);
  });
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
      eligible = e.touches.length === 1 && !t.closest(".scrim, .rest, .sheet, [role='dialog'], input, textarea")
        && (!!t.closest(".wk-head") || el.scrollTop <= 0);
      if (!eligible) return;
      y0 = lastY = e.touches[0].clientY; x0 = e.touches[0].clientX; t0 = lastT = e.timeStamp; dy = 0; dragging = false; vel = 0;
    };
    const move = (e: TouchEvent) => {
      if (!eligible) return;
      const y = e.touches[0].clientY, x = e.touches[0].clientX;
      const d = y - y0;
      if (!dragging) {
        if (d > 8 && Math.abs(d) > Math.abs(x - x0) * 1.2) dragging = true;
        else if (d < -4 || Math.abs(x - x0) > 12) { eligible = false; return; }
        else return;
      }
      e.preventDefault();
      dy = Math.max(0, d);
      const dt = e.timeStamp - lastT;
      if (dt > 0) vel = (y - lastY) / dt;
      lastY = y; lastT = e.timeStamp;
      el.style.transform = `translateY(${dy}px)`;
      el.style.clipPath = `inset(0px 0px 0px 0px round ${Math.min(32, dy / 4)}px)`;
    };
    const end = () => {
      if (!eligible || !dragging) { eligible = false; return; }
      eligible = dragging = false;
      const h = el.getBoundingClientRect().height || 800;
      el.style.clipPath = "";
      if (dy > h / 6 || (dy > 40 && vel > 0.5) || e_t0_quick()) {
        close.current(dy);
      } else {
        const from = dy;
        el.style.transform = "";
        el.animate([{ transform: `translateY(${from}px)` }, { transform: "translateY(0)" }], { duration: 260, easing: EASE_OUT });
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
      el.style.transform = ""; el.style.clipPath = "";
    };
  }, [ref, active]);
}
