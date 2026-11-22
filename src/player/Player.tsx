import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useApp } from "../state";
import { fmtClock } from "../logic/rotation";
import { Workout } from "./Workout";
import { StretchPlayer } from "./StretchPlayer";
import type { RestState } from "./RestBar";
import { keepAwake } from "../lib/platform";

/** Ticks every second; time shown is always computed from timestamps, so it is right after the screen locks. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    const vis = () => setNow(Date.now());
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [ms]);
  return now;
}

// The full-screen player layer: the workout logging screen or the guided stretch player.
export function Player() {
  const { player, activeSession, settings } = useApp();
  const program = useLiveQuery(() => db.programs.get(settings.activeProgramId), [settings.activeProgramId]);

  useEffect(() => {
    if (settings.wakeLock) void keepAwake(true);
    return () => { void keepAwake(false); };
  }, [settings.wakeLock]);

  // The whole page (incl. overscroll and the iOS status bar area) turns gym-dark while the player is open.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = "gym";
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const old = metas.map((m) => m.content);
    metas.forEach((m) => (m.content = "#0E0E0E"));
    return () => {
      delete root.dataset.mode;
      metas.forEach((m, i) => (m.content = old[i]));
    };
  }, []);

  const [held, setHeld] = useState(activeSession);
  useEffect(() => { if (activeSession) setHeld(activeSession); }, [activeSession]);

  if (player.kind === "stretch") return <div data-mode="gym"><StretchPlayer routineId={player.routineId} startedAt={player.startedAt} /></div>;

  // Keep the session after it ends so the finish summary can show (it closes the player itself).
  const s = activeSession ?? held;
  if (!s || !program) return null;
  const session = program.sessions.find((x) => x.key === s.key);
  if (!session) return null;
  return <Workout key={s.id} session={s} ps={session} />;
}

export function MiniPlayer() {
  const { player, setPlayer, activeSession } = useApp();
  const now = useNow();
  const rest = useLiveQuery(() => db.meta.get("rest"))?.value as RestState | undefined;
  const started = player.kind === "stretch" ? player.startedAt : activeSession?.startedAt;
  if (!started) return null;
  const label = player.kind === "stretch" ? "Stretch in progress" : `Workout ${activeSession?.key} in progress`;
  const restLeft = rest && player.kind !== "stretch" ? Math.ceil((rest.endsAt - now) / 1000) : null;
  return (
    <button data-mode="gym" className="mini" onClick={() => setPlayer({ ...player, kind: player.kind ?? "workout", open: true } as typeof player)}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--accent)", flex: "none", marginLeft: 6 }} aria-hidden />
      <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
      {restLeft !== null && restLeft > 0 ? (
        <span className="num" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }} aria-label="Rest left">Rest {fmtClock(restLeft)}</span>
      ) : (
        <span className="num" style={{ fontSize: "1.5rem", fontWeight: 600 }}>{fmtClock((now - +new Date(started)) / 1000)}</span>
      )}
    </button>
  );
}
