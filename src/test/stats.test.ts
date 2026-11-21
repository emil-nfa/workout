import { describe, expect, it } from "vitest";
import type { LoggedSet, WorkoutSession } from "../db/db";
import { activityByDay, e1rmSeries, personalBests, weekStart, weeklySets } from "../logic/stats";

const sess = (id: string, d: string, status: WorkoutSession["status"] = "finished"): WorkoutSession => ({ id, key: "A", programId: "p", startedAt: d, status });
const set = (sessionId: string, exerciseId: string, weight: number, reps: number, extra: Partial<LoggedSet> = {}): LoggedSet => ({ id: Math.random().toString(36), sessionId, exerciseId, slot: 0, order: 0, type: "working", weight, reps, done: true, ...extra });

describe("stats", () => {
  const sessions = [sess("s1", "2026-11-16T10:00:00"), sess("s2", "2026-11-18T10:00:00"), sess("x", "2026-11-19T10:00:00", "discarded")];
  const sets = [
    set("s1", "row_chest", 40, 10), set("s1", "row_chest", 40, 9), set("s1", "row_chest", 20, 8, { type: "warmup" }),
    set("s2", "row_chest", 42.5, 8), set("s2", "chest_press", 50, 8), set("x", "chest_press", 200, 10),
  ];
  it("week starts on Monday", () => {
    expect(weekStart(new Date("2026-11-21T12:00:00")).getDate()).toBe(16);
  });
  it("counts weekly hard sets: 1 for main muscles, 0.5 for helpers, no warm-ups, no discarded sessions", () => {
    const w = weeklySets(sets, sessions, new Date("2026-11-16T00:00:00"), new Date("2026-11-23T00:00:00"));
    expect(w.upperBack).toBe(3); // 3 working row sets
    expect(w.biceps).toBe(1.5);
    expect(w.chest).toBe(1); // the discarded 200 kg set doesn't count
  });
  it("e1RM series: best set per session, oldest first", () => {
    const s = e1rmSeries("row_chest", sets, sessions);
    expect(s.map((p) => p.label)).toEqual(["40 kg × 10", "42.5 kg × 8"]);
    expect(s[0].value).toBeCloseTo(53.3, 1);
  });
  it("personal bests ignore discarded sessions", () => {
    expect(personalBests(sets, sessions).find((b) => b.exerciseId === "chest_press")?.weight).toBe(50);
  });
  it("calendar marks workouts and stretches", () => {
    const a = activityByDay(sessions, [{ id: "l", date: "2026-11-18", routine: "evening", startedAt: "", durationSec: 1, completed: true }]);
    expect(a.get("2026-11-18")).toBe(3);
    expect(a.get("2026-11-16")).toBe(2);
    expect(a.has("2026-11-19")).toBe(false);
  });
});
