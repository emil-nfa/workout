// Motion rules for the whole app, so every animation feels like an iOS one and never drops frames.
//
// Why it stuttered before: in shipping Safari only `transform` and `opacity` animations with a cubic-bezier (or
// keyword) easing run on the GPU compositor, independent of JavaScript and layout. Anything else (clip-path,
// height or grid-row changes, background-color, and even transform with a CSS `linear()` spring curve) runs on the
// main thread, so it drops frames whenever React renders, a video decodes or the timers tick.
// Sources: WebKit bug 312407 (linear() not accelerated); Apple WWDC23 "Animate with springs" (10158).
//
// So: animate transform + opacity only, with Apple's no-bounce spring approximated as a cubic-bezier.

/** iOS sheet / navigation curve (a critically damped spring, no bounce): fast start, long soft landing. */
export const IOS_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Durations that match UIKit's defaults (sheet present ~0.5 s, push ~0.35 s, small changes ~0.3 s). */
export const DUR = { sheet: 480, push: 380, small: 300, fade: 180 } as const;

export const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Resolves when an animation ends, or after a safety timeout (a paused page must never leave the UI stuck). */
export function finished(a: Animation, ms: number): Promise<void> {
  return new Promise((res) => {
    let over = false;
    const fin = () => { if (!over) { over = true; res(); } };
    a.finished.then(fin, fin);
    window.setTimeout(fin, ms + 120);
  });
}

// ---------- FLIP: smooth layout changes with transforms only ----------
// First (where things are) → Last (change the layout in one step) → Invert (translate them back to where they were)
// → Play (animate the translate to 0). Elements marked [data-flip] glide to their new place.

export type Snapshot = Map<HTMLElement, number>;

export function snapshot(root: ParentNode = document): Snapshot {
  const m: Snapshot = new Map();
  root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => m.set(el, el.getBoundingClientRect().top));
  return m;
}

/** Call right after the layout changed (e.g. in useLayoutEffect), with the snapshot taken before. */
export function playFlip(before: Snapshot, duration: number = DUR.push): void {
  if (reducedMotion()) return;
  before.forEach((oldTop, el) => {
    if (!el.isConnected) return;
    el.getAnimations().forEach((a) => a.cancel()); // start from where it is drawn now
    const d = oldTop - el.getBoundingClientRect().top;
    if (Math.abs(d) < 1) return;
    el.animate([{ transform: `translateY(${d}px)` }, { transform: "translateY(0)" }], { duration, easing: IOS_EASE });
  });
}
