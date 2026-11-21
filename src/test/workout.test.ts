import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { WorkoutDB, newId, type LoggedSet, type WorkoutSession } from "../db/db";
import { ensureSeeded } from "../db/settings";
import { DEFAULT_PROGRAM } from "../data/program";
import { afterTick, doingOrder, equivalents, materialize, summarize, swapSlot } from "../logic/workout";

let n = 0;
const A = DEFAULT_PROGRAM.sessions.find((s) => s.key === "A")!;
async function setup() {
  const d = new WorkoutDB(`wk-${++n}`);
  await ensureSeeded(d);
  const s: WorkoutSession = { id: newId(), key: "A", programId: DEFAULT_PROGRAM.id, startedAt: "2026-11-21T10:00:00.000Z", status: "active" };
  await d.sessions.put(s);
  return { d, s };
}
const rowsOf = (d: WorkoutDB, id: string) => d.sets.where("sessionId").equals(id).toArray();

describe("planning a session", () => {
  it("creates suggested rows once, even when called twice at the same time", async () => {
    const { d, s } = await setup();
    await Promise.all([materialize(s, A, d), materialize(s, A, d)]);
    const rows = await rowsOf(d, s.id);
    // ramp-in (no finished sessions yet): every slot capped at 2 sets
    expect(rows.length).toBe(A.slots.length * 2);
    expect(rows.every((r) => !r.done)).toBe(true);
  });

  it("uses last time's numbers to suggest today's weight", async () => {
    const { d, s } = await setup();
    const old: WorkoutSession = { id: "old", key: "A", programId: DEFAULT_PROGRAM.id, startedAt: "2026-11-17T10:00:00.000Z", status: "finished" };
    await d.sessions.put(old);
    await d.sets.bulkPut([0, 1].map((o) => ({ id: newId(), sessionId: "old", exerciseId: "row_chest", slot: 0, order: o, type: "working" as const, weight: 40, reps: 12, done: true })));
    await materialize(s, A, d);
    const row = (await rowsOf(d, s.id)).filter((r) => r.slot === 0);
    expect(row.map((r) => r.weight)).toEqual([42.5, 42.5]);
    expect(row.map((r) => r.reps)).toEqual([8, 8]);
  });
});

describe("doing order and rest", () => {
  const mk = (slot: number, order: number, done = false): LoggedSet => ({ id: `${slot}-${order}`, sessionId: "s", exerciseId: "x", slot, order, type: "working", done });
  const rows = [mk(4, 0), mk(4, 1), mk(5, 0), mk(5, 1), mk(6, 0), mk(6, 1)]; // slot 4 = face pull, 5+6 = superset a

  it("interleaves a superset: A1 set 1, A2 set 1, A1 set 2, A2 set 2", () => {
    expect(doingOrder(A, rows).map((s) => s.rowId)).toEqual(["4-0", "4-1", "5-0", "6-0", "5-1", "6-1"]);
  });
  it("no rest between superset partners, rest after the pair", () => {
    expect(afterTick(A, rows, "5-0")).toMatchObject({ rest: false, next: { rowId: "6-0" } });
    expect(afterTick(A, rows, "6-0")).toMatchObject({ rest: true, next: { rowId: "5-1" } });
  });
  it("normal exercise rests and moves to its next set", () => {
    expect(afterTick(A, rows, "4-0")).toMatchObject({ rest: true, next: { rowId: "4-1" } });
  });
});

describe("swap (machine taken)", () => {
  it("replaces the unticked rows, keeps ticked ones, and is remembered next time", async () => {
    const { d, s } = await setup();
    await materialize(s, A, d);
    const first = (await rowsOf(d, s.id)).filter((r) => r.slot === 0).sort((a, b) => a.order - b.order)[0];
    await d.sets.update(first.id, { done: true, weight: 40, reps: 10 });
    await swapSlot(s, A, 0, "cable_row", d);
    const slot0 = (await rowsOf(d, s.id)).filter((r) => r.slot === 0).sort((a, b) => a.order - b.order);
    expect(slot0[0]).toMatchObject({ exerciseId: "row_chest", done: true });
    expect(slot0.slice(1).every((r) => r.exerciseId === "cable_row" && !r.done)).toBe(true);
    expect((await d.exercisePrefs.get("row_chest"))?.swapTo?.["A:0"]).toBe("cable_row");

    const next: WorkoutSession = { id: newId(), key: "A", programId: DEFAULT_PROGRAM.id, startedAt: "2026-11-24T10:00:00.000Z", status: "active" };
    await d.sessions.put(next);
    await materialize(next, A, d);
    expect((await rowsOf(d, next.id)).filter((r) => r.slot === 0).every((r) => r.exerciseId === "cable_row")).toBe(true);
    expect((await d.sessions.get(next.id))?.swaps?.[0]).toBe("cable_row");
  });
  it("offers equivalents that share a main muscle", () => {
    const eq = equivalents("row_chest");
    expect(eq).toContain("cable_row");
    expect(eq).not.toContain("leg_press");
  });
});

describe("summary", () => {
  it("counts only done working sets and flags a PR against past sessions", async () => {
    const { d, s } = await setup();
    await d.sessions.put({ id: "old", key: "A", programId: DEFAULT_PROGRAM.id, startedAt: "2026-11-17T10:00:00.000Z", status: "finished" });
    await d.sets.put({ id: newId(), sessionId: "old", exerciseId: "chest_press", slot: 1, order: 0, type: "working", weight: 50, reps: 8, done: true });
    await d.sets.bulkPut([
      { id: newId(), sessionId: s.id, exerciseId: "chest_press", slot: 1, order: 0, type: "warmup", weight: 25, reps: 8, done: true },
      { id: newId(), sessionId: s.id, exerciseId: "chest_press", slot: 1, order: 1, type: "working", weight: 52.5, reps: 8, done: true },
      { id: newId(), sessionId: s.id, exerciseId: "row_chest", slot: 0, order: 0, type: "working", weight: 40, reps: 10, done: true },
      { id: newId(), sessionId: s.id, exerciseId: "row_chest", slot: 0, order: 1, type: "working", weight: 40, reps: 10, done: false },
    ]);
    const sum = await summarize({ ...s, endedAt: "2026-11-21T10:50:00.000Z" }, d);
    expect(sum).toMatchObject({ durationSec: 3000, sets: 2, volumeKg: 52.5 * 8 + 400 });
    expect(sum.prs).toEqual([{ exerciseId: "chest_press", weight: 52.5, reps: 8 }]); // row_chest is a first time: no PR
  });
});
