// Collapsible block that animates like an iOS list: no height animation (that re-lays out the page every frame and
// stutters). Closing: the content fades out, the space closes in one step, and everything below ([data-flip])
// glides up with a transform. Opening: the space opens in one step, things below glide down, the content fades in.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DUR, IOS_EASE, finished, playFlip, reducedMotion, snapshot, type Snapshot } from "../lib/motion";

export function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  const [shown, setShown] = useState(open);
  const inner = useRef<HTMLDivElement>(null);
  const snap = useRef<Snapshot | null>(null);
  const opening = useRef(false);
  const want = useRef(open);
  want.current = open;

  // Follow the `open` prop, animating the way there.
  useLayoutEffect(() => {
    if (open === shown) return;
    if (reducedMotion()) { setShown(open); return; }
    if (open) {
      snap.current = snapshot();
      opening.current = true;
      setShown(true);
    } else {
      const el = inner.current;
      const go = () => { if (want.current) { el?.getAnimations().forEach((a) => a.cancel()); return; } snap.current = snapshot(); setShown(false); };
      if (!el) return go();
      void finished(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-out", fill: "forwards" }), 140).then(go);
    }
  }, [open]);

  // The layout just changed: glide the rest of the page from where it was.
  useLayoutEffect(() => {
    if (!snap.current) return;
    playFlip(snap.current);
    snap.current = null;
    if (opening.current && inner.current) {
      opening.current = false;
      inner.current.animate(
        [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: DUR.small, easing: IOS_EASE, delay: 60, fill: "backwards" },
      );
    }
  }, [shown]);

  if (!shown) return null;
  return <div ref={inner}>{children}</div>;
}
