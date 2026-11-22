import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

// No screen may be wider than the phone: horizontal overflow makes iOS shift fixed bars (the "bar jumps" bug).
for (const w of [360, 390, 402])
  test(`no sideways overflow at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 800 });
    await onboard(page);
    for (const tab of ["Today", "Journal", "Library", "Me"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      if (tab === "Journal") for (const v of ["History", "Progress"]) {
        await page.getByRole("button", { name: v, exact: true }).click();
        const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bar: document.querySelector(".tabbar")!.getBoundingClientRect().bottom }));
        expect(o.sw, `${tab}/${v}`).toBeLessThanOrEqual(o.cw);
      }
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(o.sw, tab).toBeLessThanOrEqual(o.cw);
    }
  });
