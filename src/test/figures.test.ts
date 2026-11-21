import { describe, expect, it } from "vitest";
import { MOTIONS } from "../figures/motions";
import { runChecks } from "../figures/checks";

describe.each(Object.keys(MOTIONS))("motion %s", (id) => {
  it("passes every automatic check", () => {
    const res = runChecks(MOTIONS[id]);
    const failed = res.filter((r) => !r.ok).map((r) => `${r.name}: ${r.detail}`);
    expect(failed).toEqual([]);
  });
});

import fs from "node:fs";
import { FIGURE_IDS } from "../figures/ids";
import { EXERCISES } from "../data/exercises";
import { DEFAULT_PROGRAM } from "../data/program";
import { STRETCH_ROUTINES } from "../data/stretches";

describe("figure assets", () => {
  it("every motion has its video, poster and icon, and the id list matches", () => {
    expect([...FIGURE_IDS].sort()).toEqual(Object.keys(MOTIONS).sort());
    for (const id of FIGURE_IDS) for (const f of [`${id}.mp4`, `${id}.jpg`, `${id}-48.png`]) expect(fs.existsSync(`public/figures3d/${f}`), f).toBe(true);
  });
  it("every exercise used by the program or the stretch routines has a figure", () => {
    const used = new Set([...DEFAULT_PROGRAM.sessions.flatMap((s) => s.slots.map((x) => x.exerciseId)), ...STRETCH_ROUTINES.flatMap((r) => r.blocks.flatMap((b) => b.steps.map((x) => x.exerciseId)))]);
    expect([...used].filter((id) => !FIGURE_IDS.has(id))).toEqual([]);
    expect(EXERCISES.filter((e) => !FIGURE_IDS.has(e.id)).map((e) => e.id)).toEqual(["neck_side"]);
  });
});
