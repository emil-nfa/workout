import { describe, expect, it } from "vitest";
import { deloadDue, e1rm, platesPerSide, perSide, fromPerSide, suggest, type Exposure } from "../logic/progression";

const ex = (weight: number | undefined, reps: number[], date = "2026-11-20"): Exposure => ({ date, sets: reps.map((r) => ({ weight, reps: r })) });
const row = { sets: 3, repMin: 8, repMax: 12, loadType: "stack" as const };

describe("double progression", () => {
  it("first time: no weight, find your weight, 3 in reserve", () => {
    const s = suggest(row, []);
    expect(s).toMatchObject({ action: "first", rir: 3, chip: "Find your weight" });
    expect(s.weight).toBeUndefined();
    expect(s.reps).toEqual([12, 12, 12]);
  });

  it("all sets at the top of the range: add the smallest step and restart at the bottom", () => {
    const s = suggest(row, [ex(40, [12, 12, 12])]);
    expect(s).toMatchObject({ action: "add", weight: 42.5, delta: 2.5, chip: "Add 2.5 kg" });
    expect(s.reps).toEqual([8, 8, 8]);
  });

  it("one set short of the top: hold the weight and beat each set by one rep", () => {
    const s = suggest(row, [ex(40, [12, 11, 9])]);
    expect(s).toMatchObject({ action: "hold", weight: 40, delta: 0, chip: "Beat 12 reps" });
    expect(s.reps).toEqual([12, 12, 10]);
  });

  it("below the range once: hold, not drop", () => {
    const s = suggest(row, [ex(40, [9, 7, 6]), ex(37.5, [12, 12, 12], "2026-11-17")]);
    expect(s.action).toBe("hold");
    expect(s.weight).toBe(40);
  });

  it("below the range two exposures in a row at the same weight: drop about 10 %", () => {
    const s = suggest(row, [ex(40, [9, 7, 6]), ex(40, [8, 7, 7], "2026-11-17")]);
    expect(s).toMatchObject({ action: "drop", weight: 36.25, chip: "Drop to 36.25 kg" });
    expect(s.delta).toBeCloseTo(-3.75);
  });

  it("uses the per-exercise increment (dumbbells jump 2 kg)", () => {
    const s = suggest({ ...row, loadType: "dumbbell" }, [ex(14, [12, 12, 12])]);
    expect(s).toMatchObject({ weight: 16, chip: "Add 2 kg" });
  });
});

describe("assisted machine (lower = harder)", () => {
  const pull = { sets: 3, repMin: 6, repMax: 10, loadType: "assisted" as const };
  it("top of range: reduce assistance", () => {
    expect(suggest(pull, [ex(30, [10, 10, 10])])).toMatchObject({ action: "less-help", weight: 25, delta: -5, chip: "Less help: 25 kg" });
  });
  it("down to zero: try with no help", () => {
    expect(suggest(pull, [ex(5, [10, 10, 10])])).toMatchObject({ weight: 0, chip: "Try no help" });
  });
  it("two misses: more assistance", () => {
    expect(suggest(pull, [ex(30, [5, 4, 4]), ex(30, [5, 5, 4], "2026-11-17")])).toMatchObject({ action: "more-help", weight: 35 });
  });
});

describe("phases", () => {
  it("ramp-in: at most 2 sets, 3 reps in reserve, progression still applies", () => {
    const s = suggest(row, [ex(40, [12, 12])], { rampIn: true });
    expect(s).toMatchObject({ sets: 2, rir: 3, action: "add", weight: 42.5 });
  });
  it("deload: half the sets rounded up, same weight, bottom of the range", () => {
    const s = suggest(row, [ex(40, [12, 12, 12])], { deload: true });
    expect(s).toMatchObject({ action: "deload", sets: 2, weight: 40, rir: 3 });
    expect(s.reps).toEqual([8, 8]);
  });
  it("deload is due after 8 weeks", () => {
    expect(deloadDue("2026-09-20T00:00:00Z", new Date("2026-11-21T00:00:00Z"))).toBe(true);
    expect(deloadDue("2026-10-20T00:00:00Z", new Date("2026-11-21T00:00:00Z"))).toBe(false);
    expect(deloadDue(undefined)).toBe(false);
  });
});

describe("other load types", () => {
  it("bodyweight: beat reps, then add a small weight at the top", () => {
    const pu = { sets: 2, repMin: 8, repMax: 20, loadType: "bodyweight" as const };
    expect(suggest(pu, [ex(undefined, [15, 12])])).toMatchObject({ action: "hold", chip: "Beat 15 reps" });
    expect(suggest(pu, [ex(undefined, [20, 20])])).toMatchObject({ action: "add", weight: 2.5 });
  });
  it("time-based: aim 5 s longer, capped at the top", () => {
    const plank = { sets: 2, repMin: 20, repMax: 40, loadType: "time" as const };
    const s = suggest(plank, [{ date: "x", sets: [{ durationSec: 30 }, { durationSec: 25 }] }]);
    expect(s).toMatchObject({ action: "hold", chip: "Aim 35 s" });
    expect(s.reps).toEqual([35, 35]);
  });
  it("mobility moves get no suggestion", () => {
    expect(suggest({ sets: 1, repMin: 8, repMax: 8, loadType: "none" }, []).action).toBe("none");
  });
});

describe("plate-loaded per side", () => {
  it("converts total and per side", () => {
    expect(perSide(90)).toBe(45);
    expect(fromPerSide(42.5)).toBe(85);
  });
  it("finds the plates for one side, biggest first", () => {
    expect(platesPerSide(42.5)).toEqual({ plates: [25, 15, 2.5], remainder: 0 });
    expect(platesPerSide(47.5).plates).toEqual([25, 20, 2.5]);
    expect(platesPerSide(1).remainder).toBe(1);
  });
  it("a +5 kg total step on a plate machine = +2.5 kg per side", () => {
    const s = suggest({ sets: 3, repMin: 8, repMax: 12, loadType: "plate" }, [ex(80, [12, 12, 12])]);
    expect(s.weight).toBe(85);
    expect(perSide(s.weight!)).toBe(42.5);
  });
});

describe("estimated max", () => {
  it("Epley", () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(60, 10)).toBeCloseTo(80);
  });
});
