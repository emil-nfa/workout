import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach } from "vitest";
import { strToU8 } from "fflate";
import { WorkoutDB, newId } from "../db/db";
import { ensureSeeded } from "../db/settings";
import { buildBackup, parseBackup, restoreBackup } from "../logic/backup";

let n = 0;
const freshDb = () => new WorkoutDB(`test-${++n}`);

describe("backup", () => {
  let a: WorkoutDB;
  beforeEach(async () => {
    a = freshDb();
    await ensureSeeded(a);
  });

  it("seeds settings and the default program once", async () => {
    await ensureSeeded(a);
    expect(await a.settings.count()).toBe(1);
    expect(await a.programs.count()).toBe(1);
  });

  it("round-trips sessions, sets, stretch logs and photos into a fresh database", async () => {
    const sid = newId();
    await a.sessions.put({ id: sid, key: "A", programId: "default-v1", startedAt: "2026-11-21T10:00:00.000Z", status: "finished" });
    await a.sets.bulkPut([
      { id: newId(), sessionId: sid, exerciseId: "row_chest", slot: 0, order: 0, type: "working", weight: 40, reps: 10, done: true },
      { id: newId(), sessionId: sid, exerciseId: "row_chest", slot: 0, order: 1, type: "working", weight: 40, reps: 9, done: true, rir: 1, note: "grip slipped" },
    ]);
    await a.stretchLogs.put({ id: newId(), date: "2026-11-21", routine: "evening", startedAt: "2026-11-21T21:00:00.000Z", durationSec: 1200, completed: true });
    const pixel = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
    await a.machinePhotos.put({ id: "p1", exerciseId: "leg_press", blob: new Blob([pixel], { type: "image/jpeg" }), createdAt: "2026-11-21T10:00:00.000Z" });
    await a.settings.update("me", { bodyweightKg: 72 });

    const { zip } = await buildBackup(a);
    const b = freshDb();
    await ensureSeeded(b);
    const sum = await restoreBackup(zip, b);

    expect(sum).toMatchObject({ kind: "backup", sessions: 1, sets: 2, stretchLogs: 1, photos: 1 });
    expect((await b.sets.where("sessionId").equals(sid).toArray()).map((s) => s.reps).sort()).toEqual([10, 9].sort());
    expect((await b.settings.get("me"))?.bodyweightKg).toBe(72);
    const photo = await b.machinePhotos.get("p1");
    expect(photo?.exerciseId).toBe("leg_press");
    expect(new Uint8Array(await photo!.blob.arrayBuffer())).toEqual(pixel);
  });

  it("restore replaces existing data instead of merging", async () => {
    const { zip } = await buildBackup(a);
    const b = freshDb();
    await ensureSeeded(b);
    await b.sessions.put({ id: "old", key: "B", programId: "default-v1", startedAt: "2026-01-01T00:00:00.000Z", status: "finished" });
    await restoreBackup(zip, b);
    expect(await b.sessions.get("old")).toBeUndefined();
  });

  it("imports the v1 prototype shape and keeps current settings", async () => {
    const v1 = { hist: [{ d: "2026-11-18", s: "A", ex: { row_chest: [["40", "10"], ["40", "9"]], db_curl: [["", "12"]] } }], str: { "2026-11-18": { m: 1, n: 1 } } };
    const b = freshDb();
    await ensureSeeded(b);
    await b.settings.update("me", { bodyweightKg: 70 });
    const sum = await restoreBackup(strToU8(JSON.stringify(v1)), b);
    expect(sum).toMatchObject({ kind: "v1", sessions: 1, sets: 3, stretchLogs: 2 });
    const sets = await b.sets.toArray();
    expect(sets.find((s) => s.exerciseId === "db_curl")?.weight).toBeUndefined();
    expect(sets.filter((s) => s.exerciseId === "row_chest").map((s) => s.weight)).toEqual([40, 40]);
    expect((await b.settings.get("me"))?.bodyweightKg).toBe(70);
    expect(await b.programs.count()).toBe(1);
  });

  it("rejects files that are not backups with a readable message", () => {
    expect(() => parseBackup(strToU8("hello"))).toThrow(/not a backup/);
    expect(() => parseBackup(strToU8(JSON.stringify({ foo: 1 })))).toThrow(/not a backup/);
  });
});
