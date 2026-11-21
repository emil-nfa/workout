// Workout-session logic shared by the logging screen: history lookup, planned rows,
// the doing order (supersets interleave), and the finish summary. DB-aware but UI-free.
import { db, newId, type LoggedSet, type WorkoutDB, type WorkoutSession } from "../db/db";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { ProgramSession, Slot } from "../data/types";
import { DEFAULT_INCREMENT, RAMP_IN_SESSIONS, e1rm, suggest, type Exposure, type Suggestion } from "./progression";

/** Past exposures of an exercise (finished sessions only, working sets that were done), newest first. */
export async function exposuresFor(exerciseId: string, excludeSessionId?: string, d: WorkoutDB = db): Promise<Exposure[]> {
  const sets = await d.sets.where("exerciseId").equals(exerciseId).toArray();
  const ids = [...new Set(sets.map((s) => s.sessionId))].filter((id) => id !== excludeSessionId);
  const sessions = (await d.sessions.bulkGet(ids)).filter((s): s is WorkoutSession => !!s && s.status === "finished");
  return sessions
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((s) => ({
      date: s.startedAt,
      sets: sets
        .filter((x) => x.sessionId === s.id && x.done && x.type === "working")
        .sort((a, b) => a.order - b.order)
        .map((x) => ({ weight: x.weight, reps: x.reps, durationSec: x.durationSec, distanceM: x.distanceM })),
    }))
    .filter((e) => e.sets.length);
}

export async function finishedCount(d: WorkoutDB = db): Promise<number> {
  return d.sessions.where("status").equals("finished").count();
}

/** Exercise actually done in a slot: this session's swap, else the remembered swap for this slot, else the plan. */
export function slotExercise(session: WorkoutSession, slotIndex: number, slot: Slot): string {
  return session.swaps?.[slotIndex] ?? slot.exerciseId;
}

export async function suggestionFor(session: WorkoutSession, slot: Slot, exerciseId: string, d: WorkoutDB = db): Promise<Suggestion> {
  const ex = EXERCISE_BY_ID[exerciseId];
  const loadType = ex?.loadType ?? "stack";
  const pref = await d.exercisePrefs.get(exerciseId);
  const rampIn = (await finishedCount(d)) < RAMP_IN_SESSIONS;
  return suggest(
    { sets: slot.sets, repMin: slot.repMin, repMax: slot.repMax, loadType },
    await exposuresFor(exerciseId, session.id, d),
    { rampIn, deload: session.deload },
    pref?.incrementKg ?? DEFAULT_INCREMENT[loadType],
  );
}

function rowsFromSuggestion(sessionId: string, slotIndex: number, exerciseId: string, s: Suggestion): LoggedSet[] {
  const lt = EXERCISE_BY_ID[exerciseId]?.loadType;
  return s.reps.map((r, order) => ({
    id: newId(), sessionId, exerciseId, slot: slotIndex, order, type: "working",
    weight: s.weight,
    reps: lt === "time" || lt === "distance" ? undefined : r,
    durationSec: lt === "time" ? r : undefined,
    distanceM: lt === "distance" ? r : undefined,
    done: false,
  }));
}

/**
 * Creates the planned (unticked, suggested) rows for every slot that has none yet. Applies remembered swaps.
 * Safe to call twice at once (React dev mode does): calls are queued per session and the whole read-then-write
 * runs in one Dexie transaction.
 */
const inflight = new Map<string, Promise<void>>();
export function materialize(session: WorkoutSession, ps: ProgramSession, d: WorkoutDB = db): Promise<void> {
  const prev = inflight.get(session.id) ?? Promise.resolve();
  const run = prev.then(() => materializeNow(session, ps, d));
  inflight.set(session.id, run.catch(() => undefined));
  return run;
}

async function materializeNow(session: WorkoutSession, ps: ProgramSession, d: WorkoutDB): Promise<void> {
  await d.transaction("rw", d.sets, d.sessions, d.exercisePrefs, async () => {
    const fresh = (await d.sessions.get(session.id)) ?? session;
    if (fresh.status !== "active") return; // never plan sets on a finished or discarded session
    const existing = await d.sets.where("sessionId").equals(session.id).toArray();
    const swaps = { ...(fresh.swaps ?? {}) };
    let swapsChanged = false;
    const rows: LoggedSet[] = [];
    for (let i = 0; i < ps.slots.length; i++) {
      if (existing.some((r) => r.slot === i)) continue;
      const slot = ps.slots[i];
      if (swaps[i] === undefined) {
        const remembered = (await d.exercisePrefs.get(slot.exerciseId))?.swapTo?.[`${fresh.key}:${i}`];
        if (remembered && EXERCISE_BY_ID[remembered]) { swaps[i] = remembered; swapsChanged = true; }
      }
      const exId = swaps[i] ?? slot.exerciseId;
      rows.push(...rowsFromSuggestion(session.id, i, exId, await suggestionFor({ ...fresh, swaps }, slot, exId, d)));
    }
    if (rows.length) await d.sets.bulkPut(rows);
    if (swapsChanged) await d.sessions.update(session.id, { swaps });
  });
}

/** Swaps the exercise in a slot: drops its unticked rows, plans new ones, remembers the swap for next time. */
export async function swapSlot(session: WorkoutSession, ps: ProgramSession, slotIndex: number, toId: string | null, d: WorkoutDB = db): Promise<void> {
  const slot = ps.slots[slotIndex];
  const swaps = { ...(session.swaps ?? {}) };
  if (toId === null || toId === slot.exerciseId) delete swaps[slotIndex];
  else swaps[slotIndex] = toId;
  const exId = swaps[slotIndex] ?? slot.exerciseId;
  const pending = await d.sets.where("sessionId").equals(session.id).filter((r) => r.slot === slotIndex && !r.done).toArray();
  const pref = (await d.exercisePrefs.get(slot.exerciseId)) ?? { exerciseId: slot.exerciseId };
  const swapTo = { ...(pref.swapTo ?? {}) };
  if (swaps[slotIndex]) swapTo[`${session.key}:${slotIndex}`] = swaps[slotIndex];
  else delete swapTo[`${session.key}:${slotIndex}`];
  const updated = { ...session, swaps };
  const rows = rowsFromSuggestion(session.id, slotIndex, exId, await suggestionFor(updated, slot, exId, d));
  await d.transaction("rw", d.sets, d.sessions, d.exercisePrefs, async () => {
    await d.sets.bulkDelete(pending.map((r) => r.id));
    const doneCount = await d.sets.where("sessionId").equals(session.id).filter((r) => r.slot === slotIndex).count();
    await d.sets.bulkPut(rows.slice(doneCount).map((r, k) => ({ ...r, order: doneCount + k })));
    await d.sessions.update(session.id, { swaps });
    await d.exercisePrefs.put({ ...pref, swapTo });
  });
}

/** Equivalent exercises for "machine taken": same group, sharing a primary muscle, gym or both. */
export function equivalents(exerciseId: string): string[] {
  const e = EXERCISE_BY_ID[exerciseId];
  if (!e) return [];
  return Object.values(EXERCISE_BY_ID)
    .filter((x) => x.id !== e.id && x.loadType !== "none" && x.primary.some((m) => e.primary.includes(m)))
    .sort((a, b) => Number(b.group === e.group) - Number(a.group === e.group))
    .map((x) => x.id);
}

export interface Step { slot: number; rowId: string }

/**
 * The order sets are meant to be done in. Normal slots: their rows in order.
 * A superset (consecutive slots sharing a letter) interleaves: A1 set 1, A2 set 1, A1 set 2…
 */
export function doingOrder(ps: ProgramSession, rows: LoggedSet[]): Step[] {
  const bySlot = (i: number) => rows.filter((r) => r.slot === i).sort((a, b) => a.order - b.order);
  const out: Step[] = [];
  for (let i = 0; i < ps.slots.length; i++) {
    const g = ps.slots[i].superset;
    if (!g) { out.push(...bySlot(i).map((r) => ({ slot: i, rowId: r.id }))); continue; }
    const group: number[] = [];
    while (i < ps.slots.length && ps.slots[i].superset === g) group.push(i++);
    i--;
    const lists = group.map(bySlot);
    const n = Math.max(...lists.map((l) => l.length));
    for (let k = 0; k < n; k++) for (let j = 0; j < group.length; j++) if (lists[j][k]) out.push({ slot: group[j], rowId: lists[j][k].id });
  }
  return out;
}

/** After ticking `rowId`: the next undone step, and whether a rest should start (not between superset partners). */
export function afterTick(ps: ProgramSession, rows: LoggedSet[], rowId: string): { next?: Step; rest: boolean } {
  const order = doingOrder(ps, rows);
  const idx = order.findIndex((s) => s.rowId === rowId);
  const done = new Set(rows.filter((r) => r.done || r.id === rowId).map((r) => r.id));
  const next = order.slice(idx + 1).find((s) => !done.has(s.rowId)) ?? order.find((s) => !done.has(s.rowId));
  const cur = ps.slots[order[idx]?.slot ?? 0];
  const rest = !(next && cur?.superset && ps.slots[next.slot]?.superset === cur.superset && next.slot > order[idx].slot);
  return { next, rest };
}

export interface Summary {
  durationSec: number;
  sets: number;
  volumeKg: number;
  prs: { exerciseId: string; weight: number; reps: number }[];
}

export async function summarize(session: WorkoutSession, d: WorkoutDB = db): Promise<Summary> {
  const rows = (await d.sets.where("sessionId").equals(session.id).toArray()).filter((r) => r.done);
  const working = rows.filter((r) => r.type !== "warmup");
  const volumeKg = working.reduce((a, r) => a + (r.weight && r.reps && EXERCISE_BY_ID[r.exerciseId]?.loadType !== "assisted" ? r.weight * r.reps : 0), 0);
  const prs: Summary["prs"] = [];
  for (const exId of [...new Set(working.map((r) => r.exerciseId))]) {
    const lt = EXERCISE_BY_ID[exId]?.loadType;
    if (lt === "assisted" || lt === "time" || lt === "distance" || lt === "none") continue;
    const best = working.filter((r) => r.exerciseId === exId && r.weight && r.reps)
      .sort((a, b) => e1rm(b.weight!, b.reps!) - e1rm(a.weight!, a.reps!))[0];
    if (!best) continue;
    const past = (await exposuresFor(exId, session.id, d)).flatMap((e) => e.sets).filter((s) => s.weight && s.reps);
    if (!past.length) continue; // first time is not a record
    const pastBest = Math.max(...past.map((s) => e1rm(s.weight!, s.reps!)));
    if (e1rm(best.weight!, best.reps!) > pastBest + 1e-9) prs.push({ exerciseId: exId, weight: best.weight!, reps: best.reps! });
  }
  const end = session.endedAt ? +new Date(session.endedAt) : Date.now();
  return { durationSec: Math.round((end - +new Date(session.startedAt)) / 1000), sets: working.length, volumeKg: Math.round(volumeKg), prs };
}
