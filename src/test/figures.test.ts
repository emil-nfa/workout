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
