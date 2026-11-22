// Guided stretch player, built for distance: the phone lies on the floor 1.5-2 m away.
// Spoken cues come first; huge countdown and name; whole screen = tap to pause; large Back / Skip edge zones.
// Timing is timestamp based (correct after the screen locks) and saved, so minimising or reloading resumes.
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown } from "lucide-react";
import { db, newId } from "../db/db";
import { useApp } from "../state";
import { STRETCH_ROUTINES } from "../data/stretches";
import { EXERCISE_BY_ID } from "../data/exercises";
import { advance, buildTimeline, jump, pause, remaining, resume, type PlayerClock } from "../logic/stretchPlan";
import { fmtClock, localDate, streak } from "../logic/rotation";
import { beep, say } from "../lib/platform";
import { ExerciseVideo } from "../components/ExerciseVisual";
import { useNow } from "./Player";
import "./player.css";

interface Saved { routineId: string; startedAt: string; clock: PlayerClock }

export function StretchPlayer({ routineId, startedAt }: { routineId: "morning" | "evening" | "fallback"; startedAt: string }) {
  const { setPlayer } = useApp();
  const routine = STRETCH_ROUTINES.find((r) => r.id === routineId)!;
  const tl = useMemo(() => buildTimeline(routine), [routine]);
  // null = nothing saved; undefined = still loading (Dexie returns undefined for a missing row, so map it).
  const saved = useLiveQuery(async () => (await db.meta.get("stretch")) ?? null);
  const [clock, setClock] = useState<PlayerClock | null>(null);
  const [ended, setEnded] = useState<null | { completed: boolean; durationSec: number }>(null);
  const now = useNow(250);
  const spoken = useRef(-1);

  // Load (or start) the clock once.
  useEffect(() => {
    if (clock || saved === undefined) return;
    const s = saved?.value as Saved | undefined;
    if (s && s.routineId === routineId && s.startedAt === startedAt) setClock(s.clock);
    else {
      const c = { seg: 0, segStartedAt: Date.now() };
      setClock(c);
      void db.meta.put({ key: "stretch", value: { routineId, startedAt, clock: c } satisfies Saved });
    }
  }, [saved, clock, routineId, startedAt]);

  const store = (c: PlayerClock) => { setClock(c); void db.meta.put({ key: "stretch", value: { routineId, startedAt, clock: c } satisfies Saved }); };

  // Roll the timeline forward; speak and beep when a new segment starts.
  useEffect(() => {
    if (!clock || ended) return;
    const { clock: c, started } = advance(tl, clock, now);
    if (started.length) {
      store(c);
      if (now - c.segStartedAt < 1500) beep(1); // only cue live transitions, not catch-up after a lock
    }
    if (c.seg >= tl.length) return void finish(true);
    if (spoken.current !== c.seg && c.pausedAt === undefined && now - c.segStartedAt < 1500) {
      spoken.current = c.seg;
      say(tl[c.seg].say);
    }
  }, [now, clock, ended]);

  async function finish(completed: boolean) {
    const durationSec = Math.round((Date.now() - +new Date(startedAt)) / 1000);
    setEnded({ completed, durationSec });
    await db.stretchLogs.put({ id: newId(), date: localDate(), routine: routineId, startedAt, durationSec, completed });
    await db.meta.delete("stretch");
    if (completed) say("Done. Nice work.");
  }

  const dates = useLiveQuery(async () => new Set((await db.stretchLogs.toArray()).filter((l) => l.completed).map((l) => l.date)));

  if (ended) {
    return (
      <div className="wk" data-stretch style={{ display: "flex", flexDirection: "column", paddingTop: "calc(var(--safe-t) + var(--s6))", paddingBottom: "calc(var(--safe-b) + var(--s4))" }}>
        <p className="caps muted" style={{ margin: 0 }}>{ended.completed ? "Done" : "Stopped early"}</p>
        <h1 style={{ font: "700 2.4rem/1.1 var(--font-serif)", margin: "var(--s2) 0", letterSpacing: "-0.02em" }}>{routine.name} stretch</h1>
        <div className="sumgrid">
          <div><div className="k">Time</div><div className="v">{fmtClock(ended.durationSec)}</div></div>
          <div><div className="k">Moves</div><div className="v">{ended.completed ? new Set(tl.map((x) => x.step)).size : new Set(tl.filter((x) => tl.reduce((m, y, i) => (y.step === x.step ? i : m), -1) < (clock?.seg ?? 0)).map((x) => x.step)).size}</div></div>
          <div><div className="k">Streak</div><div className="v">{dates ? streak(dates) : "-"}<span style={{ fontSize: "1rem" }}> days</span></div></div>
        </div>
        <p className="muted">{ended.completed ? "Never miss twice: tomorrow counts most." : "Saved as a partial session. It doesn't count for the streak."}</p>
        <button className="btn primary big" style={{ marginTop: "auto" }} onClick={() => setPlayer({ open: false })}>Close</button>
      </div>
    );
  }
  if (!clock) return <div className="wk" />;

  const seg = tl[Math.min(clock.seg, tl.length - 1)];
  const ex = EXERCISE_BY_ID[seg.exerciseId];
  const paused = clock.pausedAt !== undefined;
  const left = remaining(tl, clock, now);
  const nextStep = tl.find((s, i) => i > clock.seg && s.step !== seg.step);
  const blocks = routine.blocks.length;
  const stepsInBlock = (b: number) => new Set(tl.filter((s) => s.block === b).map((s) => s.step)).size;
  const lastSegOf = (step: number) => tl.reduce((m, s, i) => (s.step === step ? i : m), -1);
  const doneInBlock = (b: number) => new Set(tl.filter((s) => s.block === b && lastSegOf(s.step) < clock.seg).map((s) => s.step)).size;
  const big = seg.kind === "reps" ? String(seg.reps) : String(Math.ceil(left));
  const phaseColor = seg.kind === "push" ? "var(--accent)" : "var(--ink)";

  const togglePause = () => store(paused ? resume(clock, Date.now()) : pause(clock, Date.now()));
  const go = (dir: 1 | -1) => { spoken.current = -1; store(jump(tl, clock, Date.now(), dir)); };

  return (
    <div className="stretch" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "calc(var(--safe-t) + var(--s2)) var(--s3) calc(var(--safe-b) + var(--s3))", userSelect: "none" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${blocks}, 1fr)`, gap: 4, marginBottom: "var(--s2)" }} aria-hidden>
        {routine.blocks.map((_, b) => (
          <div key={b} style={{ height: 6, borderRadius: 3, background: "var(--surface2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(100 * doneInBlock(b)) / stepsInBlock(b)}%`, background: "var(--accent)" }} />
          </div>
        ))}
      </div>
      <header style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
        <button className="icon-btn" aria-label="Minimise" onClick={() => setPlayer({ open: false, kind: "stretch", routineId, startedAt })}><ChevronDown aria-hidden /></button>
        <div style={{ flex: 1, fontWeight: 600 }}>{routine.name} stretch</div>
        <button className="btn" onClick={() => { store(pause(clock, Date.now())); }} aria-label="Pause to end or continue">End</button>
      </header>

      {/* Whole middle area: tap to pause. Edge zones: back and skip. */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", gap: "var(--s2)", marginTop: "var(--s2)" }}>
        <button aria-label={paused ? "Resume" : "Pause"} onClick={togglePause} style={{ position: "absolute", inset: 0, background: "none", border: 0, zIndex: 1 }} />
        <button aria-label="Back to the previous move" onClick={() => go(-1)} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "18%", zIndex: 2, background: "none", border: 0, color: "var(--ink2)", fontWeight: 600, textAlign: "left" }}>‹ Back</button>
        <button aria-label="Skip to the next move" onClick={() => go(1)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "18%", zIndex: 2, background: "none", border: 0, color: "var(--ink2)", fontWeight: 600, textAlign: "right" }}>Skip ›</button>

        <div style={{ width: "62%", margin: "0 auto" }}><ExerciseVideo id={seg.exerciseId} name={ex?.name ?? ""} /></div>
        <div style={{ font: "700 clamp(1.8rem, 8vw, 2.6rem)/1.1 var(--font-serif)", letterSpacing: "-0.02em", padding: "0 18%" }}>{ex?.name}</div>
        <div className="muted" style={{ fontSize: "1.05rem" }}>{seg.side ? `${seg.side === "right" ? "Right" : "Left"} side · ` : ""}{seg.label}</div>
        <div aria-live="off" style={{ font: "700 clamp(7rem, 38vw, 12rem)/0.9 var(--font-num)", fontVariantNumeric: "tabular-nums", color: phaseColor }}>{big}</div>
        {seg.kind === "reps" && <div className="muted">reps, slow</div>}
        {paused && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,.55)", zIndex: 3, pointerEvents: "none" }}><div style={{ font: "700 2.4rem var(--font-num)" }}>PAUSED · TAP TO GO ON</div></div>}
      </div>

      {seg.kind === "reps" && !paused && (
        <button className="btn primary big" style={{ minHeight: 88, fontSize: "1.6rem", zIndex: 4 }} onClick={() => { spoken.current = -1; store({ seg: clock.seg + 1, segStartedAt: Date.now() }); }}>Done</button>
      )}
      {paused && (
        <div style={{ display: "grid", gap: "var(--s2)", zIndex: 4 }}>
          <button className="btn primary big" onClick={togglePause}>Continue</button>
          <button className="btn big" onClick={() => finish(false)}>End and save</button>
        </div>
      )}
      {!paused && seg.kind !== "reps" && (
        <div className="muted" style={{ textAlign: "center", fontSize: "1.1rem", minHeight: 56, display: "grid", placeItems: "center" }}>
          {nextStep ? <>Next → <b style={{ color: "var(--ink)" }}>{EXERCISE_BY_ID[nextStep.exerciseId]?.name}</b></> : "Last one"}
        </div>
      )}
    </div>
  );
}
