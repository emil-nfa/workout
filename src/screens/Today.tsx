import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, newId } from "../db/db";
import { useApp } from "../state";
import { EXERCISE_BY_ID } from "../data/exercises";
import { STRETCH_ROUTINES } from "../data/stretches";
import { buildTimeline, totalSeconds } from "../logic/stretchPlan";
import { daysSince, estimateMinutes, localDate, nextSessionKey, streak } from "../logic/rotation";
import { isStandalone, unlockAudio } from "../lib/platform";
import type { SessionKey } from "../data/types";

export function Today() {
  const { settings, setPlayer, activeSession, setTab } = useApp();
  // Remember Workout / Stretch between visits (the player replaces this screen while it runs).
  const [mode, setModeState] = useState<"workout" | "stretch">(() => { try { return localStorage.getItem("today-mode") === "stretch" ? "stretch" : "workout"; } catch { return "workout"; } });
  const setMode = (m: "workout" | "stretch") => { setModeState(m); try { localStorage.setItem("today-mode", m); } catch { /* private mode */ } };
  const program = useLiveQuery(() => db.programs.get(settings.activeProgramId), [settings.activeProgramId]);
  const finished = useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().filter((s) => s.status === "finished").toArray());
  const stretchDates = useLiveQuery(async () => new Set((await db.stretchLogs.toArray()).filter((l) => l.completed).map((l) => l.date)));
  const [pick, setPick] = useState<SessionKey | null>(null);

  if (!program || !finished || !stretchDates) return null;

  const next = nextSessionKey(program, finished.map((s) => s.key));
  const key = (activeSession?.key as SessionKey | undefined) ?? pick ?? next;
  const session = program.sessions.find((s) => s.key === key)!;
  const minutes = estimateMinutes(session.slots);
  const backupAge = daysSince(settings.lastBackupAt);
  const hasData = finished.length > 0 || stretchDates.size > 0;
  const backupDue = hasData && (backupAge === null || backupAge >= 7);
  const today = localDate();
  const doneToday = finished.some((s) => s.startedAt.slice(0, 10) === today);

  async function start() {
    unlockAudio();
    if (!activeSession) {
      await db.sessions.put({ id: newId(), key, programId: program!.id, startedAt: new Date().toISOString(), status: "active" });
    }
    setPlayer({ open: true, kind: "workout" });
  }

  return (
    <>
      {!isStandalone() && (
        <div className="banner warn" role="note">
          <p><b>You're in a Safari tab.</b> Data here is separate from the installed app. Install it first (Me, Install), then log from the Home Screen icon.</p>
        </div>
      )}
      {backupDue && (
        <div className="banner" role="note">
          <p>{backupAge === null ? "No backup yet." : `Last backup ${backupAge} days ago.`}{" "}
            <button className="btn link" onClick={() => setTab("me")}>Back up now</button></p>
        </div>
      )}

      <div className="seg" role="group" aria-label="Mode" style={{ marginBottom: "var(--s5)" }}>
        <button aria-pressed={mode === "workout"} onClick={() => setMode("workout")}>Workout</button>
        <button aria-pressed={mode === "stretch"} onClick={() => setMode("stretch")}>Stretch</button>
      </div>

      {mode === "workout" ? (
        <section aria-labelledby="next-h">
          {activeSession ? (
            <>
              <p className="caps muted">In progress</p>
              <h1 id="next-h"><span className="num">{key}</span> · {session.title}</h1>
              <button className="btn primary big" onClick={() => setPlayer({ open: true, kind: "workout" })}>Continue</button>
            </>
          ) : (
            <>
              <p className="caps muted">{key === next ? "Next in rotation" : "Picked instead"}</p>
              <h1 id="next-h"><span className="num">{key}</span> · {session.title}</h1>
              <p className="lede">{session.slots.length} exercises · about <span className="num">{minutes}</span> min · {session.subtitle}</p>
              <button className="btn primary big" onClick={start}>Start</button>
              {doneToday && <p className="muted" style={{ marginTop: "var(--s3)" }}>You already trained today. Rest is part of the plan.</p>}
            </>
          )}

          <h2>The session</h2>
          <ol className="ruled" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {session.slots.map((s, i) => {
              const e = EXERCISE_BY_ID[s.exerciseId];
              return (
                <li key={i} className="row">
                  <span className="num muted" style={{ width: "1.5em" }}>{s.superset ? `${s.superset.toUpperCase()}${session.slots.filter((x, j) => x.superset === s.superset && j <= i).length}` : i + 1}</span>
                  <span className="grow">
                    <span style={{ fontWeight: 600 }}>{e?.name ?? s.exerciseId}</span><br />
                    <span className="muted" style={{ fontSize: "0.85rem" }}>{e?.fr}</span>
                  </span>
                  <span className="num">{s.sets} × {s.target ?? (s.repMin === s.repMax ? s.repMin : `${s.repMin}-${s.repMax}`)}{s.perSide ? "/side" : ""}</span>
                </li>
              );
            })}
          </ol>

          {!activeSession && (
            <>
              <h2>Train something else</h2>
              <div className="seg" role="group" aria-label="Pick a session">
                {program.sessions.map((s) => (
                  <button key={s.key} aria-pressed={s.key === key} aria-label={`Session ${s.key}, ${s.title}`} onClick={() => setPick(s.key === next ? null : s.key)}>
                    <span className="num">{s.key}</span>
                  </button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: "0.9rem" }}>Not training today? Do the next letter whenever you go back. Never skip a letter.</p>
            </>
          )}
        </section>
      ) : (
        <section aria-labelledby="stretch-h">
          <p className="caps muted">Streak <span className="num">{streak(stretchDates)}</span> {streak(stretchDates) === 1 ? "day" : "days"}</p>
          <h1 id="stretch-h">Stretch</h1>
          <p className="lede">Separate from the gym. Intensity 6-7 out of 10, never pain.</p>
          <div className="ruled">
            {STRETCH_ROUTINES.map((r) => (
              <div key={r.id} className="row" style={{ alignItems: "center" }}>
                <div className="grow">
                  <h3>{r.name} <span className="num muted" style={{ fontWeight: 500 }}>{Math.round(totalSeconds(buildTimeline(r)) / 60)} min</span></h3>
                  <span className="muted" style={{ fontSize: "0.9rem" }}>{r.when}</span>
                </div>
                <button
                  className="btn primary"
                  onClick={() => { unlockAudio(); setPlayer({ open: true, kind: "stretch", routineId: r.id, startedAt: new Date().toISOString() }); }}
                >Start</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
