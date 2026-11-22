// Program view and editor: see the week, change sets / reps / rest, swap, reorder, add or remove exercises,
// or reset to the recommended program. Any edit marks the program as customised (app updates then leave it alone).
import { useState, useRef } from "react";
import { useEdgeBack } from "../lib/gestures";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { db, type StoredProgram } from "../db/db";
import { useApp } from "../state";
import { DEFAULT_PROGRAM } from "../data/program";
import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises";
import type { ProgramSession, Slot } from "../data/types";
import { estimateMinutes, fmtClock } from "../logic/rotation";

const RESTS = [45, 60, 75, 90, 120, 150, 180];
const LIFTS = EXERCISES.filter((e) => e.loadType !== "none" || ["dead_bug", "bird_dog"].includes(e.id));

export function ProgramEditor({ onBack }: { onBack: () => void }) {
  const { settings } = useApp();
  const program = useLiveQuery(() => db.programs.get(settings.activeProgramId), [settings.activeProgramId]);
  const [key, setKey] = useState<string>("A");
  const [confirmReset, setConfirmReset] = useState(false);
  const page = useRef<HTMLElement>(null);
  useEdgeBack(onBack, page);
  if (!program) return null;
  const ps = program.sessions.find((s) => s.key === key) ?? program.sessions[0];

  const save = (sessions: ProgramSession[]) => db.programs.put({ ...program, sessions, customized: true, updatedAt: new Date().toISOString() } as StoredProgram);
  const setSlots = (slots: Slot[]) => save(program.sessions.map((s) => (s.key === ps.key ? { ...s, slots } : s)));
  const patch = (i: number, p: Partial<Slot>) => setSlots(ps.slots.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i: number, d: -1 | 1) => { const a = [...ps.slots]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setSlots(a); };

  return (
    <article ref={page}>
      <button className="btn link" onClick={onBack} style={{ marginLeft: "calc(-1 * var(--s1))" }}>‹ Me</button>
      <h1>Your program</h1>
      <p className="lede">{program.customized ? "Edited by you. App updates won't change it." : "The recommended program from the research. Editing it is fine."}</p>
      <div className="seg" role="group" aria-label="Session">
        {program.sessions.map((s) => <button key={s.key} aria-pressed={s.key === ps.key} onClick={() => setKey(s.key)} aria-label={`Session ${s.key}, ${s.title}`}><span className="num">{s.key}</span></button>)}
      </div>
      <h2>{ps.key} · {ps.title} <span className="num muted" style={{ fontSize: "1rem" }}>about {estimateMinutes(ps.slots)} min</span></h2>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }} className="ruled">
        {ps.slots.map((s, i) => {
          const e = EXERCISE_BY_ID[s.exerciseId];
          return (
            <li key={`${s.exerciseId}-${i}`} style={{ padding: "var(--s3) 0" }}>
              <div style={{ display: "flex", gap: "var(--s2)", alignItems: "center" }}>
                <select aria-label="Exercise" value={s.exerciseId} onChange={(ev) => patch(i, { exerciseId: ev.target.value })} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1.5px solid var(--rule)", background: "var(--surface)", padding: "0 8px", fontWeight: 600 }}>
                  {LIFTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <button className="icon-btn" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={18} /></button>
                <button className="icon-btn" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === ps.slots.length - 1}><ArrowDown size={18} /></button>
                <button className="icon-btn" aria-label={`Remove ${e?.name}`} onClick={() => setSlots(ps.slots.filter((_, j) => j !== i))} style={{ color: "var(--danger)" }}><Trash2 size={18} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s2)", marginTop: "var(--s2)" }}>
                <label className="field"><span className="caps muted">Sets</span><input inputMode="numeric" value={s.sets} onChange={(ev) => patch(i, { sets: Math.max(1, Math.min(6, Number(ev.target.value) || 1)) })} /></label>
                <label className="field"><span className="caps muted">Reps from</span><input inputMode="numeric" value={s.repMin} onChange={(ev) => patch(i, { repMin: Number(ev.target.value) || 1 })} /></label>
                <label className="field"><span className="caps muted">to</span><input inputMode="numeric" value={s.repMax} onChange={(ev) => patch(i, { repMax: Number(ev.target.value) || 1 })} /></label>
                <label className="field"><span className="caps muted">Rest</span>
                  <select value={s.restSec} onChange={(ev) => patch(i, { restSec: Number(ev.target.value) })}>{RESTS.map((r) => <option key={r} value={r}>{fmtClock(r)}</option>)}</select>
                </label>
              </div>
              {s.superset && <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Superset {s.superset.toUpperCase()} with the {ps.slots[i + 1]?.superset === s.superset ? "next" : "previous"} exercise</p>}
            </li>
          );
        })}
      </ol>
      <button className="btn big" style={{ marginTop: "var(--s3)" }} onClick={() => setSlots([...ps.slots, { exerciseId: "face_pull", sets: 2, repMin: 10, repMax: 15, restSec: 60 }])}>+ Add an exercise</button>
      <div style={{ marginTop: "var(--s6)" }}>
        {!confirmReset ? (
          <button className="btn" onClick={() => setConfirmReset(true)}>Reset to the recommended program</button>
        ) : (
          <button className="btn danger" onClick={async () => { await db.programs.put({ ...DEFAULT_PROGRAM, updatedAt: new Date().toISOString() }); setConfirmReset(false); }}>Tap again: undo all my edits</button>
        )}
      </div>
    </article>
  );
}
