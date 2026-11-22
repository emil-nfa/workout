import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LoggedSet, type WorkoutSession } from "../db/db";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { Muscle } from "../data/types";
import { fmtClock, localDate } from "../logic/rotation";
import { WEEKLY_TARGET, activityByDay, e1rmSeries, personalBests, weekStart, weeklySets } from "../logic/stats";
import { ActivityCalendar, LineChart, TargetBars } from "../components/Charts";
import { scrollTop } from "../lib/scroll";

const MUSCLE_LABEL: Partial<Record<Muscle, string>> = {
  lats: "Lats", upperBack: "Upper back", rearDelts: "Rear shoulders", chest: "Chest", frontDelts: "Front shoulders",
  sideDelts: "Side shoulders", biceps: "Biceps", triceps: "Triceps", quads: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", abs: "Abs",
};
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function Journal() {
  const [view, setView] = useState<"history" | "progress">("history");
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const sets = useLiveQuery(() => db.sets.toArray());
  const stretches = useLiveQuery(() => db.stretchLogs.toArray());
  const [open, setOpen] = useState<WorkoutSession | null>(null);
  if (!sessions || !sets || !stretches) return null;
  if (open) return <SessionDetail session={open} sets={sets.filter((s) => s.sessionId === open.id)} onBack={() => setOpen(null)} />;

  return (
    <>
      <h1>Journal</h1>
      <div className="seg" role="group" aria-label="View" style={{ margin: "var(--s4) 0 var(--s5)" }}>
        <button aria-pressed={view === "history"} onClick={() => setView("history")}>History</button>
        <button aria-pressed={view === "progress"} onClick={() => setView("progress")}>Progress</button>
      </div>
      {view === "history" ? <History sessions={sessions} sets={sets} stretches={stretches} onOpen={setOpen} /> : <Progress sessions={sessions} sets={sets} />}
    </>
  );
}

function History({ sessions, sets, stretches, onOpen }: { sessions: WorkoutSession[]; sets: LoggedSet[]; stretches: import("../db/db").StretchLog[]; onOpen: (s: WorkoutSession) => void }) {
  const finished = sessions.filter((s) => s.status === "finished");
  const items = [
    ...finished.map((s) => ({ at: s.startedAt, kind: "w" as const, s })),
    ...stretches.map((l) => ({ at: l.startedAt, kind: "s" as const, l })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <ActivityCalendar days={activityByDay(sessions, stretches)} />
      <h2>Sessions</h2>
      {!items.length && <p className="lede">Nothing yet. Finished workouts and stretch sessions show up here.</p>}
      <ul className="ruled" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it) =>
          it.kind === "w" ? (
            <li key={it.s.id}>
              <button className="row" style={{ width: "100%", border: 0, background: "none", textAlign: "left" }} onClick={() => { onOpen(it.s); scrollTop(); }}>
                <span className="num muted" style={{ width: "6.5em" }}>{day(it.at)}</span>
                <span className="grow"><b>{it.s.key}</b> · workout{it.s.deload ? " (deload)" : ""}<br /><span className="muted" style={{ fontSize: "0.85rem" }}>{(() => { const n = sets.filter((x) => x.sessionId === it.s.id && x.done && x.type !== "warmup").length; return `${n} set${n === 1 ? "" : "s"}`; })()}</span></span>
                <span className="num muted">{it.s.endedAt ? fmtClock((+new Date(it.s.endedAt) - +new Date(it.s.startedAt)) / 1000) : ""}</span>
              </button>
            </li>
          ) : (
            <li key={it.l.id} className="row">
              <span className="num muted" style={{ width: "6.5em" }}>{day(it.at)}</span>
              <span className="grow">{it.l.routine[0].toUpperCase() + it.l.routine.slice(1)} stretch{it.l.completed ? "" : " (partial)"}</span>
              <span className="num muted">{it.l.durationSec ? fmtClock(it.l.durationSec) : ""}</span>
            </li>
          ),
        )}
      </ul>
    </>
  );
}

function SessionDetail({ session, sets, onBack }: { session: WorkoutSession; sets: LoggedSet[]; onBack: () => void }) {
  const [edit, setEdit] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const done = sets.filter((s) => s.done).sort((a, b) => a.slot - b.slot || a.order - b.order);
  const groups = [...new Set(done.map((s) => s.slot))].map((slot) => done.filter((s) => s.slot === slot));
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));
  return (
    <article>
      <button className="btn link" onClick={onBack} style={{ marginLeft: "calc(-1 * var(--s1))" }}>‹ Journal</button>
      <h1>{session.key} · {day(session.startedAt)}</h1>
      <p className="lede">{session.endedAt ? `${fmtClock((+new Date(session.endedAt) - +new Date(session.startedAt)) / 1000)} · ` : ""}{done.filter((s) => s.type !== "warmup").length} working sets</p>
      <button className="btn" onClick={() => setEdit(!edit)} style={{ marginBottom: "var(--s3)" }}>{edit ? "Done editing" : "Edit numbers"}</button>
      {groups.map((g) => {
        const e = EXERCISE_BY_ID[g[0].exerciseId];
        return (
          <section key={g[0].slot}>
            <h2 style={{ marginTop: "var(--s4)" }}>{e?.name ?? g[0].exerciseId}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {g.map((x, i) => (
                  <tr key={x.id} style={{ borderTop: "1px solid var(--rule)" }}>
                    <td className="num muted" style={{ width: "2.5em", padding: "8px 0" }}>{x.type === "warmup" ? "W" : i + 1}</td>
                    {edit ? (
                      <>
                        <td><label className="sr-only" htmlFor={`w${x.id}`}>Weight</label><input id={`w${x.id}`} inputMode="decimal" defaultValue={x.weight ?? ""} onBlur={(ev) => db.sets.update(x.id, { weight: num(ev.target.value) })} style={{ width: "5em", minHeight: 40 }} /> kg</td>
                        <td><label className="sr-only" htmlFor={`r${x.id}`}>Reps</label><input id={`r${x.id}`} inputMode="numeric" defaultValue={x.reps ?? ""} onBlur={(ev) => db.sets.update(x.id, { reps: num(ev.target.value) })} style={{ width: "4em", minHeight: 40 }} /> reps</td>
                        <td><button className="btn link" style={{ color: "var(--danger)" }} onClick={() => db.sets.delete(x.id)}>Delete</button></td>
                      </>
                    ) : (
                      <td className="num" style={{ fontSize: "1.1rem" }}>{x.durationSec !== undefined ? `${x.durationSec} s` : `${x.weight ?? "BW"} kg × ${x.reps ?? "-"}`}{x.rir !== undefined ? <span className="muted"> · {x.rir} left</span> : null}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
      <div style={{ marginTop: "var(--s6)" }}>
        {!confirmDel ? (
          <button className="btn danger" onClick={() => setConfirmDel(true)}>Delete this workout</button>
        ) : (
          <button className="btn danger" onClick={async () => { await db.transaction("rw", db.sessions, db.sets, async () => { await db.sets.where("sessionId").equals(session.id).delete(); await db.sessions.delete(session.id); }); onBack(); }}>Tap again: delete for good</button>
        )}
      </div>
    </article>
  );
}

function Progress({ sessions, sets }: { sessions: WorkoutSession[]; sets: LoggedSet[] }) {
  const withData = useMemo(() => [...new Set(sets.filter((s) => s.done && s.weight && s.reps).map((s) => s.exerciseId))].filter((id) => EXERCISE_BY_ID[id]), [sets]);
  const [ex, setEx] = useState<string>("");
  const exId = ex || withData[0] || "";
  const series = exId ? e1rmSeries(exId, sets, sessions) : [];
  const wk = weekStart(new Date());
  const next = new Date(wk); next.setDate(wk.getDate() + 7);
  const weekly = weeklySets(sets, sessions, wk, next);
  const rows = (Object.entries(WEEKLY_TARGET) as [Muscle, number][]).map(([m, target]) => ({ label: MUSCLE_LABEL[m] ?? m, value: weekly[m] ?? 0, target }));
  const pbs = personalBests(sets, sessions).slice(0, 12);
  const bw = useLiveQuery(() => db.bodyweight.orderBy("date").toArray());
  const [kg, setKg] = useState("");

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Strength</h2>
      {withData.length ? (
        <>
          <div className="field" style={{ marginBottom: "var(--s3)" }}>
            <label htmlFor="ex">Exercise</label>
            <select id="ex" value={exId} onChange={(e) => setEx(e.target.value)}>{withData.map((id) => <option key={id} value={id}>{EXERCISE_BY_ID[id].name}</option>)}</select>
          </div>
          <LineChart points={series} unit="kg" title="Estimated max (best set per session)" />
          <p className="muted" style={{ fontSize: "0.85rem" }}>Estimated 1-rep max from your best set, for spotting the trend. Not a number to test.</p>
        </>
      ) : <p className="lede">Charts appear after your first logged sets.</p>}

      <h2>This week's hard sets</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.9rem" }}>Working sets per muscle (helpers count half), against the weekly target. Blue tick = target.</p>
      <TargetBars rows={rows} />

      <h2>Personal records</h2>
      {pbs.length ? (
        <ul className="ruled" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {pbs.map((b) => (
            <li key={b.exerciseId} className="row"><span className="chip pr">PR</span><span className="grow">{EXERCISE_BY_ID[b.exerciseId]?.name}</span><span className="num" style={{ fontSize: "1.1rem" }}>{b.weight} × {b.reps}</span></li>
          ))}
        </ul>
      ) : <p className="muted">None yet.</p>}

      <h2>Body weight (optional)</h2>
      <form onSubmit={async (e) => { e.preventDefault(); const v = Number(kg.replace(",", ".")); if (v > 30 && v < 250) { await db.bodyweight.put({ id: `bw-${localDate()}`, date: localDate(), kg: v }); setKg(""); } }} style={{ display: "flex", gap: "var(--s2)", alignItems: "end" }}>
        <div className="field" style={{ flex: 1 }}><label htmlFor="bw">Today, kg</label><input id="bw" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="e.g. 72.4" /></div>
        <button className="btn primary" type="submit">Save</button>
      </form>
      {bw && bw.length > 0 && <div style={{ marginTop: "var(--s3)" }}><LineChart points={bw.map((b) => ({ date: b.date, value: b.kg, label: `${b.kg} kg` }))} unit="kg" title="Body weight" /></div>}
    </>
  );
}
