import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown } from "lucide-react";
import { db, newId } from "../db/db";
import { useApp } from "../state";
import { STRETCH_ROUTINES } from "../data/stretches";
import { fmtClock, localDate } from "../logic/rotation";
import { Workout } from "./Workout";
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

// M1: the full-screen layer, minimise, finish/discard. The logging screen (M2) and stretch player (M4) fill it.
export function Player() {
  const { player, setPlayer, activeSession, settings } = useApp();
  const now = useNow();
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

  const minimise = () => setPlayer({ ...player, open: false });
  const [held, setHeld] = useState(activeSession);
  useEffect(() => { if (activeSession) setHeld(activeSession); }, [activeSession]);

  if (player.kind === "stretch") {
    const r = STRETCH_ROUTINES.find((x) => x.id === player.routineId)!;
    const elapsed = (now - +new Date(player.startedAt)) / 1000;
    const finish = async () => {
      await db.stretchLogs.put({ id: newId(), date: localDate(), routine: r.id, startedAt: player.startedAt, durationSec: Math.round(elapsed), completed: true });
      setPlayer({ open: false });
    };
    return (
      <div data-mode="gym" style={{ minHeight: "100dvh", padding: "calc(var(--safe-t) + var(--s4)) var(--s4) calc(var(--safe-b) + var(--s4))", display: "flex", flexDirection: "column" }}>
        <Header title={`${r.name} stretch`} clock={fmtClock(elapsed)} onMin={minimise} />
        <p className="muted" style={{ flex: 1 }}>The guided stretch player arrives in M4.</p>
        <button className="btn primary big" onClick={finish}>Mark done</button>
        <button className="btn big" style={{ marginTop: "var(--s2)" }} onClick={() => setPlayer({ open: false })}>Stop without saving</button>
      </div>
    );
  }

  // Keep the session after it ends so the finish summary can show (it closes the player itself).
  const s = activeSession ?? held;
  if (!s || !program) return null;
  const session = program.sessions.find((x) => x.key === s.key);
  if (!session) return null;
  return <Workout key={s.id} session={s} ps={session} />;
}

function Header({ title, clock, onMin }: { title: string; clock: string; onMin: () => void }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: "var(--s3)", marginBottom: "var(--s4)" }}>
      <button className="btn" aria-label="Minimise" onClick={onMin} style={{ width: "var(--tap)", padding: 0 }}><ChevronDown aria-hidden /></button>
      <div style={{ flex: 1, fontWeight: 600 }}>{title}</div>
      <div className="num" style={{ fontSize: "1.6rem", fontWeight: 600 }} aria-label="Elapsed time">{clock}</div>
    </header>
  );
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
      <span style={{ width: 4, alignSelf: "stretch", background: "var(--accent)", margin: "12px 0" }} aria-hidden />
      <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
      {restLeft !== null && restLeft > 0 ? (
        <span className="num" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }} aria-label="Rest left">Rest {fmtClock(restLeft)}</span>
      ) : (
        <span className="num" style={{ fontSize: "1.5rem", fontWeight: 600 }}>{fmtClock((now - +new Date(started)) / 1000)}</span>
      )}
    </button>
  );
}
