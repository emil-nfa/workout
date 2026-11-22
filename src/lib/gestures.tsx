// Touch gestures that iPhone users expect:
// - SwipeRow: swipe a list row to the left to reveal a red Delete button (like Mail).
// - useEdgeBack: swipe from the left edge of the screen to the right to go back from a detail page.
import { useEffect, useRef, useState, type ReactNode } from "react";

const ACTION_W = 88; // width of the revealed Delete button

export function SwipeRow({ children, onDelete, label = "Delete" }: { children: ReactNode; onDelete: () => void; label?: string }) {
  const [x, setX] = useState(0); // current offset (<= 0)
  const [drag, setDrag] = useState(false);
  const [gone, setGone] = useState(false);
  const t = useRef<{ x0: number; y0: number; base: number; dir: "h" | "v" | null } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Close the open row when another part of the page is touched.
  useEffect(() => {
    if (x === 0) return;
    const away = (e: TouchEvent | MouseEvent) => { if (!rowRef.current?.contains(e.target as Node)) setX(0); };
    document.addEventListener("touchstart", away, { passive: true });
    document.addEventListener("mousedown", away);
    return () => { document.removeEventListener("touchstart", away); document.removeEventListener("mousedown", away); };
  }, [x]);

  // Horizontal drags must not scroll the page: a non-passive listener lets us cancel the move.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const move = (e: TouchEvent) => { if (t.current?.dir === "h") e.preventDefault(); };
    el.addEventListener("touchmove", move, { passive: false });
    return () => el.removeEventListener("touchmove", move);
  }, []);

  const remove = () => {
    setGone(true); // collapse, then delete
    window.setTimeout(onDelete, 220);
  };

  return (
    <div ref={rowRef} className={`swipe-row${gone ? " gone" : ""}`}>
      <button className="swipe-del" tabIndex={x === 0 ? -1 : 0} aria-hidden={x === 0} onClick={remove}>{label}</button>
      <div
        className="swipe-front"
        style={{ transform: `translateX(${x}px)`, transition: drag ? "none" : "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)" }}
        onTouchStart={(e) => { t.current = { x0: e.touches[0].clientX, y0: e.touches[0].clientY, base: x, dir: null }; }}
        onTouchMove={(e) => {
          const s = t.current; if (!s) return;
          const dx = e.touches[0].clientX - s.x0, dy = e.touches[0].clientY - s.y0;
          if (!s.dir) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { s.dir = "h"; setDrag(true); } else if (Math.abs(dy) > 8) s.dir = "v"; }
          if (s.dir === "h") setX(Math.min(0, Math.max(-ACTION_W * 1.6, s.base + dx)));
        }}
        onTouchEnd={() => {
          const s = t.current; t.current = null; setDrag(false);
          if (s?.dir === "h") setX((cur) => (cur < -ACTION_W / 2 ? -ACTION_W : 0));
        }}
        onClickCapture={(e) => { if (x !== 0) { e.stopPropagation(); e.preventDefault(); setX(0); } }}
      >
        {children}
      </div>
      {/* Keyboard / VoiceOver: a visible way to delete without the gesture. */}
      <button className="sr-only" onClick={remove}>{label}</button>
    </div>
  );
}

/** Swipe from the left edge of the screen to the right to go back. The page follows the finger. */
export function useEdgeBack(onBack: () => void, pageRef: React.RefObject<HTMLElement>): void {
  const back = useRef(onBack);
  back.current = onBack;
  useEffect(() => {
    let x0 = 0, y0 = 0, dx = 0, on = false, dir: "h" | "v" | null = null;
    const start = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      on = e.touches.length === 1 && x < 28 && !document.getElementById("player");
      if (!on) return;
      x0 = x; y0 = e.touches[0].clientY; dx = 0; dir = null;
    };
    const move = (e: TouchEvent) => {
      if (!on) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (!dir) { if (mx > 8 && mx > Math.abs(my)) dir = "h"; else if (Math.abs(my) > 8 || mx < -8) { on = false; return; } else return; }
      e.preventDefault();
      dx = Math.max(0, mx);
      const el = pageRef.current;
      if (el) { el.style.transition = "none"; el.style.transform = `translateX(${dx}px)`; el.style.opacity = String(1 - Math.min(0.4, dx / 800)); }
    };
    const end = () => {
      if (!on) return;
      on = false;
      const el = pageRef.current;
      const w = window.innerWidth || 400;
      if (dir === "h" && dx > w * 0.3) {
        if (el) { el.style.transition = "transform 180ms ease-out, opacity 180ms ease-out"; el.style.transform = `translateX(${w}px)`; el.style.opacity = "0"; }
        window.setTimeout(() => back.current(), 170);
      } else if (el) {
        el.style.transition = "transform 240ms cubic-bezier(0.32, 0.72, 0, 1), opacity 240ms";
        el.style.transform = ""; el.style.opacity = "";
      }
    };
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, [pageRef]);
}
