import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { WorkoutDB, newId } from "../db/db";
import { exportCsv, exportObsidianZip } from "../logic/exports";

describe("exports", async () => {
  const d = new WorkoutDB(`ex-${Date.now()}`);
  await d.sessions.bulkPut([
    { id: "s1", key: "A", programId: "p", startedAt: "2026-11-21T10:00:00.000Z", endedAt: "2026-11-21T10:52:00.000Z", status: "finished" },
    { id: "s2", key: "B", programId: "p", startedAt: "2026-11-22T10:00:00.000Z", status: "discarded" },
  ]);
  await d.sets.bulkPut([
    { id: newId(), sessionId: "s1", exerciseId: "row_chest", slot: 0, order: 0, type: "working", weight: 40, reps: 10, done: true, note: 'seat 4, "high"' },
    { id: newId(), sessionId: "s1", exerciseId: "row_chest", slot: 0, order: 1, type: "working", weight: 40, reps: 9, done: false },
    { id: newId(), sessionId: "s2", exerciseId: "leg_press", slot: 0, order: 0, type: "working", weight: 80, reps: 10, done: true },
  ]);
  it("CSV: done sets of finished sessions only, quoted safely", async () => {
    const csv = await exportCsv(d);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Chest-supported row");
    expect(lines[1]).toContain('"seat 4, ""high"""');
  });
  it("Obsidian: one note per finished workout with front matter and a set table", async () => {
    const files = unzipSync(await exportObsidianZip(d));
    const names = Object.keys(files);
    expect(names).toEqual(["Workout log/2026-11-21 A.md"]);
    const md = strFromU8(files[names[0]]);
    expect(md).toMatch(/^---\ndate: 2026-11-21\ntype: workout/);
    expect(md).toContain("| 1 | 40 | 10 |");
    expect(md).toContain("minutes: 52");
  });
});
