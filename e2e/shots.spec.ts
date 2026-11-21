import { test } from "@playwright/test";
import { logAllSets, onboard, startNext } from "./helpers";

// Screenshots of every main screen for visual review (not an assertion test). SHOTS=1 npx playwright test shots
const sizes = [{ w: 360, h: 740 }, { w: 402, h: 874 }];
for (const scheme of ["light", "dark"] as const)
  for (const { w, h } of sizes)
    test(`screens ${w}x${h} ${scheme}`, async ({ page }) => {
      test.skip(!process.env.SHOTS);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.setViewportSize({ width: w, height: h });
      const shot = (n: string) => page.screenshot({ path: `test-results/shots/${w}-${scheme}-${n}.png` });
      await page.goto("/");
      await shot("00-onboarding");
      await onboard(page);
      await shot("01-today");
      await startNext(page);
      await shot("02-workout");
      await logAllSets(page, "20", 3);
      await shot("03-rest");
      await page.locator(".set-r.current .val").first().click();
      await shot("04-numpad");
      await page.getByRole("dialog", { name: /Edit/ }).getByRole("button", { name: "Done" }).click();
      await page.getByRole("button", { name: "Finish workout" }).last().click();
      await shot("05-finish-ask");
      await page.getByRole("button", { name: "Save only the ticked sets" }).click();
      await shot("06-summary");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await page.getByRole("button", { name: "Stretch", exact: true }).click();
      await shot("07-stretch");
      await page.getByRole("button", { name: "Start" }).nth(1).click();
      await page.waitForTimeout(400);
      await shot("08-stretch-player");
      await page.getByRole("button", { name: "Minimise" }).click();
      await page.getByRole("button", { name: "Journal" }).click();
      await shot("09-journal");
      await page.getByRole("button", { name: "Progress", exact: true }).click();
      await shot("10-progress");
      await page.getByRole("button", { name: "Library" }).click();
      await shot("11-library");
      await page.getByRole("button", { name: /Chest-supported row/ }).first().click();
      await shot("12-exercise");
      await page.getByRole("button", { name: "‹ Library" }).click();
      await page.getByRole("button", { name: "Learn", exact: true }).click();
      await shot("13-learn");
      await page.getByRole("button", { name: "Me", exact: true }).click();
      await shot("14-me");
      await page.getByRole("button", { name: "See and edit your program" }).click();
      await shot("15-editor");
    });
