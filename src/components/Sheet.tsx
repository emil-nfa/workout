// Bottom sheet (iOS style): a grab handle, tap outside or pull it down to dismiss, slides away when closed.
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Inside a sheet: close it with the slide-down animation (e.g. from a Close button). */
export const SheetClose = createContext<() => void>(() => {});
export const useSheetClose = () => useContext(SheetClose);

export function Sheet({ onClose, label, children }: { onClose: () => void; label?: string; children: ReactNode }) {
  const scrimRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const close = useRef(onClose);
  close.current = onClose;

  const dismiss = (from = 0) => {
    if (closing.current) return;
    closing.current = true;
    const sheet = sheetRef.current, scrim = scrimRef.current;
    if (!sheet || !scrim || reduced()) return close.current();
    const h = sheet.getBoundingClientRect().height || 400;
    sheet.style.transform = "";
    sheet.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${h + 20}px)` }], { duration: 260, easing: EASE, fill: "forwards" });
    scrim.animate([{ opacity: getComputedStyle(scrim).opacity }, { opacity: 0 }], { duration: 260, fill: "forwards" });
    window.setTimeout(() => close.current(), 250);
  };

  // Pull down to dismiss: from the handle any time, from the content when it is scrolled to the top.
  useEffect(() => {
    const sheet = sheetRef.current, scrim = scrimRef.current;
    if (!sheet || !scrim) return;
    let y0 = 0, dy = 0, on = false, drag = false, lastY = 0, lastT = 0, vel = 0;
    const start = (e: TouchEvent) => {
      const t = e.target as HTMLElement;
      on = e.touches.length === 1 && (!!t.closest(".sheet-grab") || sheet.scrollTop <= 0) && !t.closest("input, textarea, select");
      y0 = lastY = e.touches[0].clientY; lastT = e.timeStamp; dy = 0; drag = false; vel = 0;
    };
    const move = (e: TouchEvent) => {
      if (!on) return;
      const y = e.touches[0].clientY, d = y - y0;
      if (!drag) {
        if (d > 0) drag = true; // take the very first downward move, or iOS starts its own scroll bounce
        else { on = false; return; }
      }
      e.preventDefault();
      dy = Math.max(0, d);
      const dt = e.timeStamp - lastT; if (dt > 0) vel = (y - lastY) / dt;
      lastY = y; lastT = e.timeStamp;
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${dy}px)`;
      scrim.style.opacity = String(Math.max(0.2, 1 - dy / 600));
    };
    const end = () => {
      if (!on || !drag) { on = false; return; }
      on = drag = false;
      if (dy > 100 || (dy > 30 && vel > 0.5)) dismiss(dy);
      else {
        sheet.style.transform = "";
        sheet.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration: 260, easing: EASE });
        scrim.style.opacity = "";
      }
    };
    sheet.addEventListener("touchstart", start, { passive: true });
    sheet.addEventListener("touchmove", move, { passive: false });
    sheet.addEventListener("touchend", end);
    sheet.addEventListener("touchcancel", end);
    return () => {
      sheet.removeEventListener("touchstart", start);
      sheet.removeEventListener("touchmove", move);
      sheet.removeEventListener("touchend", end);
      sheet.removeEventListener("touchcancel", end);
    };
  }, []);

  return (
    <div className="scrim" ref={scrimRef} onClick={() => dismiss()}>
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" aria-hidden />
        <SheetClose.Provider value={() => dismiss()}>{children}</SheetClose.Provider>
      </div>
    </div>
  );
}
