import { describe, expect, it } from "vitest";
import { STRETCH_ROUTINES } from "../data/stretches";
import { advance, buildTimeline, jump, pause, remaining, resume, totalSeconds, READY_SEC } from "../logic/stretchPlan";

const evening = STRETCH_ROUTINES.find((r) => r.id === "evening")!;
const fallback = STRETCH_ROUTINES.find((r) => r.id === "fallback")!;

describe("stretch timeline", () => {
  it("hamstring PNF: hold 30 s, then 3 × (push 5 s, relax 25 s), right then left with a switch", () => {
    const tl = buildTimeline(fallback).filter((s) => s.exerciseId === "ham_strap");
    expect(tl.map((s) => `${s.kind}${s.dur}${s.side?.[0] ?? ""}`)).toEqual([
      "ready5", "hold30r", "push5r", "relax25r", "push5r", "relax25r", "push5r", "relax25r",
      "switch4l", "hold30l", "push5l", "relax25l", "push5l", "relax25l", "push5l", "relax25l",
    ]);
  });
  it("the evening routine lasts about 18-20 minutes including get-ready and switches", () => {
    const min = totalSeconds(buildTimeline(evening)) / 60;
    expect(min).toBeGreaterThan(17);
    expect(min).toBeLessThan(21);
  });
  it("rep-based moves wait for Done", () => {
    const tl = buildTimeline(STRETCH_ROUTINES[0]);
    expect(tl[1]).toMatchObject({ kind: "reps", dur: 0, reps: 8 });
  });
});

describe("player clock (timestamp based)", () => {
  const tl = buildTimeline(fallback);
  it("rolls over ended segments, e.g. after the phone was locked", () => {
    const { clock, started } = advance(tl, { seg: 0, segStartedAt: 0 }, (READY_SEC + 30 + 3) * 1000);
    expect(clock.seg).toBe(2); // ready -> hold -> push (3 s in)
    expect(started).toEqual([1, 2]);
    expect(remaining(tl, clock, (READY_SEC + 30 + 3) * 1000)).toBeCloseTo(2);
  });
  it("pause freezes the countdown and resume shifts it", () => {
    const c = pause({ seg: 1, segStartedAt: 0 }, 10_000);
    expect(remaining(tl, c, 50_000)).toBeCloseTo(20);
    const r = resume(c, 50_000);
    expect(remaining(tl, r, 50_000)).toBeCloseTo(20);
    expect(advance(tl, c, 99_000).clock.seg).toBe(1);
  });
  it("skip jumps to the next exercise's get-ready", () => {
    const c = jump(tl, { seg: 3, segStartedAt: 0 }, 100_000, 1);
    expect(tl[c.seg]).toMatchObject({ kind: "ready", exerciseId: "seated_pike" });
  });
});
