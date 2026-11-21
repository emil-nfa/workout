import { expect, test } from "@playwright/test";
import { finishWorkout, logAllSets, onboard, startNext } from "./helpers";

// A full fake week through the real interface: 4 sessions (A-D) with a swap, a superset, an unfinished finish,
// then the progression on the next A, a deload, a stretch run, a backup and a restore into a fresh phone.
test("a full week of training, then backup and restore", async ({ page, browser }) => {
  // No share sheet in a headless browser: exercise the download fallback (research/PLATFORM.md P3).
  await page.addInitScript(() => { Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true }); });
  await onboard(page);

  // A: log everything (first time: the app asks for each weight).
  await startNext(page);
  await expect(page.locator(".wk-head .title")).toHaveText(/A · Upper 1/);
  await expect(page.getByText("Find your weight").first()).toBeVisible();
  await logAllSets(page, "20");
  await finishWorkout(page);

  // B: lower day with the Pallof / dead bug superset.
  await startNext(page);
  await expect(page.locator(".wk-head .title")).toHaveText(/B · Lower 1/);
  await expect(page.locator(".ss-tag").first()).toHaveText(/A1/);
  await logAllSets(page, "30");
  await finishWorkout(page);

  // C: swap the assisted pull-up ("machine taken"), then log.
  await startNext(page);
  await expect(page.locator(".wk-head .title")).toHaveText(/C · Upper 2/);
  await page.getByRole("button", { name: "Assisted pull-up options" }).click();
  await page.getByRole("button", { name: /Swap exercise/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Lat pulldown/ }).click();
  await expect(page.getByText("swapped from Assisted pull-up")).toBeVisible();
  await logAllSets(page, "25");
  await finishWorkout(page);

  // D: only tick two sets, then finish: the app must ask, and keep only the ticked ones.
  await startNext(page);
  await expect(page.locator(".wk-head .title")).toHaveText(/D · Lower 2/);
  await logAllSets(page, "16", 2);
  await page.getByRole("button", { name: "Finish workout" }).last().click();
  await expect(page.getByText(/sets? not ticked/)).toBeVisible();
  await page.getByRole("button", { name: "Save only the ticked sets" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();

  // Next A: rows were all at the top of the range (12 reps), so the app says to add weight.
  await startNext(page);
  await expect(page.locator(".wk-head .title")).toHaveText(/A · Upper 1/);
  await expect(page.locator("#card-0 .chip.focus")).toHaveText("Add 2.5 kg");
  await expect(page.locator("#card-0 .val").first()).toContainText("22.5");
  // Make it a deload: half the sets, a deload chip.
  await page.getByRole("button", { name: "Workout options" }).click();
  await page.getByRole("button", { name: /Make it a deload/ }).click();
  await expect(page.locator("#card-0").getByText("Deload")).toBeVisible();
  await page.getByRole("button", { name: "Workout options" }).click();
  await page.getByRole("button", { name: "Discard workout" }).click();
  await page.getByRole("button", { name: /Tap again to discard/ }).click();

  // Stretch: run the 5-min fallback by skipping through it; it counts for the streak.
  await page.getByRole("button", { name: "Today" }).click();
  await page.getByRole("button", { name: "Stretch", exact: true }).click();
  await page.getByRole("button", { name: "Start" }).last().click();
  await expect(page.getByText("Get ready")).toBeVisible();
  await page.getByRole("button", { name: "Skip to the next move" }).click();
  await page.getByRole("button", { name: "Skip to the next move" }).click();
  await expect(page.getByText("Done", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText(/Streak 1 day$/i)).toBeVisible();

  // Journal: 4 workouts, 1 stretch.
  await page.getByRole("button", { name: "Journal" }).click();
  await expect(page.getByText(/· workout/)).toHaveCount(4);
  await expect(page.getByText(/Fallback stretch/)).toBeVisible();

  // Backup, then restore into a brand-new phone.
  await page.getByRole("button", { name: "Me" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Back up now" }).click();
  const file = await (await dl).path();
  await expect(page.getByText(/Last backup: today/)).toBeVisible();

  const fresh = await browser.newContext({ viewport: { width: 402, height: 874 } });
  const p2 = await fresh.newPage();
  await onboard(p2);
  await p2.getByRole("button", { name: "Me" }).click();
  await p2.locator('input[type="file"][accept*="zip"]').setInputFiles(file!);
  await p2.getByRole("button", { name: "Replace my data" }).click();
  await expect(p2.getByText(/Restored 5 workouts/)).toBeVisible();
  await p2.getByRole("button", { name: "Journal" }).click();
  await expect(p2.getByText(/· workout/)).toHaveCount(4);
  await fresh.close();
});
