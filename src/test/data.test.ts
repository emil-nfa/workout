import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRAM } from "../data/program";
import { STRETCH_ROUTINES } from "../data/stretches";
import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises";
import { estimateMinutes } from "../logic/rotation";

describe("content data", () => {
  it("every exercise the program and routines use exists", () => {
    const used = [...DEFAULT_PROGRAM.sessions.flatMap((s) => s.slots.map((x) => x.exerciseId)), ...STRETCH_ROUTINES.flatMap((r) => r.blocks.flatMap((b) => b.steps.map((x) => x.exerciseId)))];
    expect(used.filter((id) => !EXERCISE_BY_ID[id])).toEqual([]);
  });
  it("ids are unique and no UI text uses em or en dashes", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    const text = JSON.stringify([EXERCISES, DEFAULT_PROGRAM, STRETCH_ROUTINES]);
    expect(text).not.toMatch(/[–—]/);
  });
  it("every session fits in 60 minutes", () => {
    for (const s of DEFAULT_PROGRAM.sessions) expect(estimateMinutes(s.slots)).toBeLessThanOrEqual(60);
  });
  it("supersets are consecutive pairs", () => {
    for (const s of DEFAULT_PROGRAM.sessions) {
      const letters = s.slots.map((x) => x.superset).filter(Boolean) as string[];
      for (const l of new Set(letters)) {
        const idx = s.slots.map((x, i) => (x.superset === l ? i : -1)).filter((i) => i >= 0);
        expect(idx.length).toBe(2);
        expect(idx[1] - idx[0]).toBe(1);
      }
    }
  });
});

import { LEARN, GLOSSARY } from "../data/learn";
import { SOURCES } from "../data/sources";
describe("learn content", () => {
  it("every card cites sources that exist, and no dashes in the text", () => {
    for (const c of LEARN) for (const id of c.sources) expect(SOURCES[id], `${c.id}: ${id}`).toBeDefined();
    expect(JSON.stringify([LEARN, GLOSSARY])).not.toMatch(/[–—]/);
  });
  it("every exercise source id exists", () => {
    for (const e of EXERCISES) for (const id of e.sources ?? []) expect(SOURCES[id], `${e.id}: ${id}`).toBeDefined();
  });
});
