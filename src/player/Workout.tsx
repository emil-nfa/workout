import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronDown, MoreVertical, StickyNote } from "lucide-react";
import { db, newId, type LoggedSet, type SetType, type WorkoutSession } from "../db/db";
import { useApp } from "../state";
import { EXERCISE_BY_ID } from "../data/exercises";
import { WARMUPS } from "../data/program";
import type { LoadType, ProgramSession } from "../data/types";
import { afterTick, doingOrder, equivalents, exposuresFor, materialize, suggestionFor, swapSlot } from "../logic/workout";
import { DEFAULT_INCREMENT, perSide, type Exposure, type Suggestion } from "../logic/progression";
import { fmtClock } from "../logic/rotation";
import { useNow } from "./Player";
import { Numpad, type PadField } from "./Numpad";
import { RestBar, type RestState } from "./RestBar";
import { FinishFlow } from "./Finish";
import "./player.css";

const needsWeight = (t: LoadType) => t === "stack" || t === "dumbbell" || t === "plate" || t === "assisted" || t === "distance";
const fmt = (n?: number) => (n === undefined ? "" : Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));

interface SlotInfo { exerciseId: string; suggestion?: Suggestion; history: Exposure[] }

export function Workout({ session, ps }: { session: WorkoutSession; ps: ProgramSession }) {
  const { setPlayer, settings } = useApp();
  const now = useNow();
  const rows = useLiveQuery(() => db.sets.where("sessionId").equals(session.id).toArray(), [session.id]);
  const prefs = useLiveQuery(() => db.exercisePrefs.toArray());
  const rest = useLiveQuery(() => db.meta.get("rest"))?.value as RestState | undefined;
  const [info, setInfo] = useState<Record<number, SlotInfo>>({});
  const [pad, setPad] = useState<{ rowId: string; field: PadField } | null>(null);
  const [menu, setMenu] = useState<{ kind: "exercise"; slot: number } | { kind: "set"; rowId: string } | { kind: "swap"; slot: number } | { kind: "how"; exerciseId: string } | { kind: "session" } | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [finishing, setFinishing] = useState(false);
  const [warmDone, setWarmDone] = useState<Set<number>>(new Set());
  const toastTimer = useRef<number>();

  // Plan the rows (suggestions) once per session, and whenever a slot has none (after a swap).
  useEffect(() => { void materialize(session, ps); }, [session.id, ps, session.swaps]);

  // Suggestion + history per slot, for chips, PREVIOUS column and the +2.5 marker.
  const swapKey = JSON.stringify(session.swaps ?? {});
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<number, SlotInfo> = {};
      for (let i = 0; i < ps.slots.length; i++) {
        const exerciseId = session.swaps?.[i] ?? ps.slots[i].exerciseId;
        out[i] = {
          exerciseId,
          suggestion: await suggestionFor(session, ps.slots[i], exerciseId),
          history: await exposuresFor(exerciseId, session.id),
        };
      }
      if (alive) setInfo(out);
    })();
    return () => { alive = false; };
  }, [session.id, swapKey, ps]);

  const order = useMemo(() => (rows ? doingOrder(ps, rows) : []), [rows, ps]);
  const byId = useMemo(() => new Map((rows ?? []).map((r) => [r.id, r])), [rows]);
  const current = order.find((s) => !byId.get(s.rowId)?.done);

  if (!rows || !prefs) return null;
  const prefOf = (id: string) => prefs.find((p) => p.exerciseId === id);
  const plateMode = (id: string) => prefOf(id)?.loadMode ?? settings.plateMode;
  const restFor = (slot: number, exId: string) => prefOf(exId)?.restSec ?? ps.slots[slot].restSec;

  function showToast(text: string, undo?: () => void) {
    window.clearTimeout(toastTimer.current);
    setToast({ text, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }

  async function tick(r: LoggedSet) {
    const lt = EXERCISE_BY_ID[r.exerciseId]?.loadType ?? "stack";
    if (r.done) {
      await db.sets.update(r.id, { done: false, at: undefined });
      setExpanded((e) => new Set(e).add(r.slot));
      return;
    }
    // Missing a value we need: open the pad on it instead of logging nonsense.
    if (needsWeight(lt) && r.weight === undefined) return setPad({ rowId: r.id, field: "weight" });
    if (lt === "time" ? r.durationSec === undefined : lt === "distance" ? r.distanceM === undefined : r.reps === undefined)
      return setPad({ rowId: r.id, field: lt === "time" ? "time" : lt === "distance" ? "dist" : "reps" });

    const wasCurrent = current?.rowId === r.id;
    await db.sets.update(r.id, { done: true, at: new Date().toISOString() });
    const all = rows!.map((x) => (x.id === r.id ? { ...x, done: true } : x));
    const { next, rest: shouldRest } = afterTick(ps, rows!, r.id);
    const nextRow = next ? all.find((x) => x.id === next.rowId) : undefined;

    if (shouldRest && nextRow) {
      const total = restFor(r.slot, r.exerciseId);
      const nextEx = EXERCISE_BY_ID[nextRow.exerciseId];
      const setNo = all.filter((x) => x.slot === nextRow.slot && x.order <= nextRow.order && x.type !== "warmup").length;
      const label = nextRow.slot === r.slot ? `set ${setNo}` : nextEx?.name ?? "next";
      const val = nextRow.durationSec !== undefined ? `${nextRow.durationSec} s`
        : nextRow.weight !== undefined && nextRow.reps !== undefined ? `${fmt(nextRow.weight)} kg × ${nextRow.reps}`
        : nextRow.reps !== undefined ? `${nextRow.reps} reps` : "";
      const state: RestState = { endsAt: Date.now() + total * 1000, totalSec: total, defaultSec: total, exerciseId: r.exerciseId, nextLabel: label, nextValue: val };
      await db.meta.put({ key: "rest", value: state });
    } else if (!nextRow) {
      await db.meta.delete("rest");
    }

    showToast(`Set logged`, async () => { await db.sets.update(r.id, { done: false, at: undefined }); setExpanded((e) => new Set(e).add(r.slot)); });

    // Collapse + auto-scroll only when the LAST set of the current exercise is ticked.
    const slotDone = all.filter((x) => x.slot === r.slot).every((x) => x.done);
    if (wasCurrent && slotDone && nextRow && nextRow.slot !== r.slot) {
      setExpanded((e) => { const n = new Set(e); n.delete(r.slot); return n; });
      requestAnimationFrame(() => {
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById(`card-${nextRow.slot}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    }
  }

  async function addSet(slot: number, type: SetType = "working") {
    const slotRows = rows!.filter((x) => x.slot === slot).sort((a, b) => a.order - b.order);
    const last = slotRows.filter((x) => x.type === "working").pop() ?? slotRows[slotRows.length - 1];
    const exerciseId = info[slot]?.exerciseId ?? ps.slots[slot].exerciseId;
    if (type === "warmup") {
      // Warm-ups go first: shift the others down.
      await db.transaction("rw", db.sets, async () => {
        for (const x of slotRows) await db.sets.update(x.id, { order: x.order + 1 });
        await db.sets.put({ id: newId(), sessionId: session.id, exerciseId, slot, order: 0, type, weight: last?.weight ? Math.round(last.weight * 0.5 / 2.5) * 2.5 : undefined, reps: 8, done: false });
      });
      return;
    }
    await db.sets.put({ id: newId(), sessionId: session.id, exerciseId, slot, order: (slotRows.at(-1)?.order ?? -1) + 1, type, weight: last?.weight, reps: last?.reps, durationSec: last?.durationSec, distanceM: last?.distanceM, done: false });
  }

  const title = `${session.key} · ${ps.title}`;
  const elapsed = (now - +new Date(session.startedAt)) / 1000;
  const undone = rows.filter((r) => !r.done).length;

  if (finishing) return <FinishFlow session={session} ps={ps} undone={undone} onBack={() => setFinishing(false)} />;

  return (
    <div className="wk">
      <header className="wk-head">
        <button className="icon-btn" aria-label="Minimise workout" onClick={() => setPlayer({ open: false, kind: "workout" })}><ChevronDown aria-hidden /></button>
        <div className="title">{title}</div>
        <div className="clock" aria-label="Elapsed time">{fmtClock(elapsed)}</div>
        <button className="icon-btn" aria-label="Workout options" onClick={() => setMenu({ kind: "session" })}><MoreVertical aria-hidden /></button>
      </header>

      <details className="warm" open={!rows.some((r) => r.done)}>
        <summary>Warm-up · 7 min <span className="muted" style={{ marginLeft: "auto", fontWeight: 500 }}>{warmDone.size}/{WARMUPS[ps.kind].length}</span></summary>
        <ul>
          {WARMUPS[ps.kind].map((w, i) => (
            <li key={i}>
              <label>
                <input type="checkbox" checked={warmDone.has(i)} onChange={() => setWarmDone((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })} />
                <span className={warmDone.has(i) ? "done-txt" : ""}>{w}</span>
              </label>
            </li>
          ))}
        </ul>
      </details>

      {ps.slots.map((slot, i) => {
        const si = info[i];
        const exId = si?.exerciseId ?? slot.exerciseId;
        const ex = EXERCISE_BY_ID[exId];
        const lt = ex?.loadType ?? "stack";
        const slotRows = rows.filter((r) => r.slot === i).sort((a, b) => a.order - b.order);
        const allDone = slotRows.length > 0 && slotRows.every((r) => r.done);
        const collapsed = allDone && !expanded.has(i);
        const sug = si?.suggestion;
        const prevSets = si?.history[0]?.sets ?? [];
        const ssIndex = slot.superset ? ps.slots.filter((s, j) => s.superset === slot.superset && j <= i).length : 0;
        const tgt = slot.target ?? (slot.repMin === slot.repMax ? `${slot.repMin}` : `${slot.repMin}-${slot.repMax}`);
        const working = slotRows.filter((r) => r.type !== "warmup");
        const top = [...working].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0) || (b.reps ?? 0) - (a.reps ?? 0))[0];
        const perSideMode = lt === "plate" && plateMode(exId) === "perSide";
        const showW = (w?: number) => (w === undefined ? undefined : perSideMode ? perSide(w) : w);
        const kgHead = lt === "assisted" ? "Help" : lt === "bodyweight" ? "+kg" : perSideMode ? "kg/side" : lt === "dumbbell" ? "kg each" : "kg";
        const rowClass = lt === "time" ? "timed" : lt === "distance" ? "dist" : "";
        const swapped = exId !== slot.exerciseId;

        if (collapsed) {
          return (
            <section key={i} id={`card-${i}`} className="card collapsed">
              <button className="card-top" style={{ width: "100%", border: 0, background: "none", textAlign: "left", padding: 0 }} onClick={() => setExpanded((e) => new Set(e).add(i))} aria-label={`${ex?.name}: done, tap to open`}>
                <span className="thumb" aria-hidden><Check size={20} /></span>
                <span className="card-name">
                  <span className="l1">{ex?.name}</span><br />
                  <span className="sum">{working.length} sets · top {lt === "time" ? `${top?.durationSec ?? "-"} s` : `${fmt(showW(top?.weight)) || "BW"} × ${top?.reps ?? "-"}`}</span>
                </span>
              </button>
            </section>
          );
        }

        return (
          <section key={i} id={`card-${i}`} className="card" aria-label={ex?.name}>
            <div className="card-top">
              <button className="thumb" aria-label={`How to do ${ex?.name}`} onClick={() => setMenu({ kind: "how", exerciseId: exId })}>{ex?.group.slice(0, 4).toUpperCase()}</button>
              <div className="card-name">
                <div className="l1">
                  {slot.superset && <span className="ss-tag">{slot.superset.toUpperCase()}{ssIndex} </span>}
                  {ex?.name} <span className="tgt">· {sug?.sets ?? slot.sets} × {tgt}{slot.perSide ? "/side" : ""} · {fmtClock(restFor(i, exId))}</span>
                </div>
                <div className="fr">{ex?.fr}{swapped && <> · swapped from {EXERCISE_BY_ID[slot.exerciseId]?.name}</>}</div>
                <div className="meta">
                  {sug?.chip && <span className="chip focus">{sug.chip}</span>}
                  {session.deload && <span className="chip">Deload</span>}
                  {prefOf(exId)?.note && <span className="chip"><StickyNote size={12} aria-hidden /> note</span>}
                </div>
              </div>
              <button className="icon-btn" aria-label={`${ex?.name} options`} onClick={() => setMenu({ kind: "exercise", slot: i })}><MoreVertical aria-hidden /></button>
            </div>

            <div className="sets" role="table" aria-label={`${ex?.name} sets`}>
              <div className={`set-h ${rowClass}`} role="row">
                <span role="columnheader">Set</span><span role="columnheader">Previous</span>
                {lt === "time" ? <span role="columnheader">Sec</span> : <><span role="columnheader">{kgHead}</span><span role="columnheader">{lt === "distance" ? "m" : "Reps"}</span></>}
                <span role="columnheader"><Check size={14} aria-label="Done" /></span>
              </div>
              {slotRows.map((r) => {
                const workingNo = slotRows.filter((x) => x.type !== "warmup" && x.order <= r.order).length;
                const p = r.type === "warmup" ? undefined : prevSets[workingNo - 1];
                const isCur = current?.rowId === r.id;
                const sugStyle = !r.done && !r.edited;
                const delta = sugStyle && r.type === "working" && sug?.delta && sug.weight === r.weight ? sug.delta : 0;
                const prevTxt = p ? (lt === "time" ? `${p.durationSec ?? "-"} s` : lt === "distance" ? `${fmt(p.weight)} × ${p.distanceM ?? "-"} m` : `${fmt(showW(p.weight)) || "BW"} × ${p.reps ?? "-"}`) : "";
                const firstTime = !si?.history.length && workingNo === 1 && r.type === "working";
                return (
                  <div key={r.id} role="row" className={`set-r ${rowClass}${isCur ? " current" : ""}${r.done ? " done" : ""}`}>
                    <button className={`setno${r.type === "warmup" ? " w" : ""}`} aria-label={`Set ${workingNo}, ${r.type}. Change type`} onClick={() => setMenu({ kind: "set", rowId: r.id })}>
                      {r.type === "warmup" ? "W" : r.type === "drop" ? "D" : workingNo}
                    </button>
                    <span className={`prev${firstTime ? " hint" : ""}`} role="cell">{firstTime ? "~3 reps left" : prevTxt || "-"}</span>
                    {lt === "time" ? (
                      <ValCell value={r.durationSec} sug={sugStyle} onClick={() => setPad({ rowId: r.id, field: "time" })} label="seconds" />
                    ) : (
                      <>
                        <ValCell value={showW(r.weight)} sug={sugStyle} delta={delta && (perSideMode ? delta / 2 : delta)} onClick={() => setPad({ rowId: r.id, field: "weight" })} label={kgHead} empty={lt === "bodyweight" ? "BW" : "kg"} />
                        <ValCell value={lt === "distance" ? r.distanceM : r.reps} sug={sugStyle} onClick={() => setPad({ rowId: r.id, field: lt === "distance" ? "dist" : "reps" })} label={lt === "distance" ? "metres" : "reps"} empty="-" />
                      </>
                    )}
                    <button className={`tick${r.done ? " on" : ""}`} aria-pressed={r.done} aria-label={r.done ? "Logged. Tap to undo" : "Log this set"} onClick={() => tick(r)}>
                      <Check size={26} strokeWidth={2.6} aria-hidden />
                    </button>
                  </div>
                );
              })}
              <button className="add-set" onClick={() => addSet(i)}>+ Set</button>
            </div>
          </section>
        );
      })}

      <div style={{ padding: "var(--s5) 0" }}>
        <button className="btn primary big" onClick={() => setFinishing(true)}>Finish workout</button>
      </div>

      {pad && byId.get(pad.rowId) && (
        <Numpad
          row={byId.get(pad.rowId)!}
          rows={rows}
          field={pad.field}
          onField={(f) => setPad({ ...pad, field: f })}
          perSideMode={(() => { const r = byId.get(pad.rowId)!; return EXERCISE_BY_ID[r.exerciseId]?.loadType === "plate" && plateMode(r.exerciseId) === "perSide"; })()}
          increment={prefOf(byId.get(pad.rowId)!.exerciseId)?.incrementKg ?? DEFAULT_INCREMENT[EXERCISE_BY_ID[byId.get(pad.rowId)!.exerciseId]?.loadType ?? "stack"]}
          onClose={() => setPad(null)}
        />
      )}

      {rest && <RestBar rest={rest} now={now} />}
      {toast && (
        <div className="toast" role="status">
          {toast.text}
          {toast.undo && <button onClick={() => { toast.undo!(); setToast(null); }}>Undo</button>}
        </div>
      )}

      {menu && (
        <div className="scrim" onClick={() => setMenu(null)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <MenuBody menu={menu} session={session} ps={ps} rows={rows} info={info} setMenu={setMenu} addSet={addSet} onFinish={() => { setMenu(null); setFinishing(true); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ValCell({ value, sug, delta, onClick, label, empty = "-" }: { value?: number; sug: boolean; delta?: number; onClick: () => void; label: string; empty?: string }) {
  return (
    <button className={`val${sug ? " sug" : ""}`} onClick={onClick} aria-label={`${label}: ${value ?? "empty"}${sug ? ", suggested" : ""}. Edit`}>
      {value === undefined ? <span className="empty">{empty}</span> : <span className="n">{fmt(value)}</span>}
      {!!delta && delta > 0 && <span className="delta">+{fmt(delta)}</span>}
    </button>
  );
}

type Menu =
  | { kind: "exercise"; slot: number } | { kind: "set"; rowId: string } | { kind: "swap"; slot: number }
  | { kind: "how"; exerciseId: string } | { kind: "session" };

function MenuBody({ menu, session, ps, rows, info, setMenu, addSet, onFinish }: {
  menu: Menu; session: WorkoutSession; ps: ProgramSession; rows: LoggedSet[]; info: Record<number, SlotInfo>;
  setMenu: (m: Menu | null) => void; addSet: (slot: number, type?: SetType) => Promise<void>; onFinish: () => void;
}) {
  const { setPlayer } = useApp();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [note, setNote] = useState("");

  if (menu.kind === "session") {
    return (
      <div className="menu">
        <h3>Workout</h3>
        <button onClick={onFinish}>Finish workout</button>
        <button onClick={async () => { await db.sessions.update(session.id, { deload: !session.deload }); await db.sets.where("sessionId").equals(session.id).filter((r) => !r.done && !r.edited).delete(); setMenu(null); }}>
          {session.deload ? "Make it a normal session" : "Make it a deload (half the sets, easy)"}
        </button>
        {!confirmDiscard ? (
          <button className="danger" onClick={() => setConfirmDiscard(true)}>Discard workout</button>
        ) : (
          <button className="danger" onClick={async () => {
            await db.transaction("rw", db.sessions, db.sets, db.meta, async () => {
              await db.sets.where("sessionId").equals(session.id).delete();
              await db.sessions.update(session.id, { status: "discarded", endedAt: new Date().toISOString() });
              await db.meta.delete("rest");
            });
            setPlayer({ open: false });
          }}>Tap again to discard. Nothing is saved.</button>
        )}
        <button onClick={() => setMenu(null)}>Cancel</button>
      </div>
    );
  }

  if (menu.kind === "set") {
    const r = rows.find((x) => x.id === menu.rowId);
    if (!r) return null;
    const setType = async (type: SetType) => { await db.sets.update(r.id, { type }); setMenu(null); };
    return (
      <div className="menu">
        <h3>Set type</h3>
        <button onClick={() => setType("warmup")}>Warm-up (W): not counted in progress</button>
        <button onClick={() => setType("working")}>Working set</button>
        <button onClick={() => setType("drop")}>Drop set (D): lighter, straight after</button>
        <button className="danger" onClick={async () => { await db.sets.delete(r.id); setMenu(null); }}>Delete this set</button>
        <button onClick={() => setMenu(null)}>Cancel</button>
      </div>
    );
  }

  if (menu.kind === "how") {
    const e = EXERCISE_BY_ID[menu.exerciseId];
    return (
      <div>
        <h3 style={{ fontSize: "1.3rem" }}>{e.name}</h3>
        <p className="muted" style={{ marginTop: 0 }}>{e.fr}</p>
        <ol style={{ paddingLeft: "1.2em" }}>{e.how.map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}</ol>
        {!!e.cues.length && <p><b>Cues:</b> {e.cues.join(" ")}</p>}
        {!!e.avoid.length && <p><b>Avoid:</b> {e.avoid.join(" ")}</p>}
        <button className="btn big" onClick={() => setMenu(null)}>Close</button>
      </div>
    );
  }

  const slot = menu.slot;
  const exId = info[slot]?.exerciseId ?? ps.slots[slot].exerciseId;
  const ex = EXERCISE_BY_ID[exId];

  if (menu.kind === "swap") {
    const planned = ps.slots[slot].exerciseId;
    const options = equivalents(planned).filter((id) => id !== exId);
    return (
      <div className="menu">
        <h3>Swap {EXERCISE_BY_ID[planned]?.name}</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: "0.9rem" }}>Remembered for this slot next time. Logged sets stay.</p>
        {exId !== planned && <button onClick={async () => { await swapSlot(session, ps, slot, null); setMenu(null); }}>Back to {EXERCISE_BY_ID[planned]?.name}</button>}
        {options.map((id) => (
          <button key={id} onClick={async () => { await swapSlot(session, ps, slot, id); setMenu(null); }}>
            {EXERCISE_BY_ID[id].name} <span className="muted" style={{ fontSize: "0.85rem" }}>· {EXERCISE_BY_ID[id].fr}</span>
          </button>
        ))}
        <button onClick={() => setMenu(null)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="menu">
      <h3>{ex?.name}</h3>
      <button onClick={() => setMenu({ kind: "swap", slot })}>Swap exercise (machine taken)</button>
      <button onClick={() => setMenu({ kind: "how", exerciseId: exId })}>How to do it</button>
      <button onClick={async () => { await addSet(slot, "warmup"); setMenu(null); }}>Add a warm-up set</button>
      <div style={{ padding: "var(--s2) 0" }}>
        <label className="field">
          <span className="muted" style={{ fontSize: "0.85rem" }}>Note for this exercise (seat height, grip…)</span>
          <input defaultValue="" placeholder="e.g. seat 4, handles middle" onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="btn" style={{ marginTop: "var(--s2)", width: "100%" }} onClick={async () => {
          const pref = (await db.exercisePrefs.get(exId)) ?? { exerciseId: exId };
          await db.exercisePrefs.put({ ...pref, note: note.trim() || undefined }); setMenu(null);
        }}>Save note</button>
      </div>
      <button onClick={() => setMenu(null)}>Cancel</button>
    </div>
  );
}
