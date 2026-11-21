import { expect, type Page } from "@playwright/test";

export async function onboard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue in the browser anyway" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Start training" }).click();
  await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
}

/** Ticks every remaining set of the open workout; types `kg` when the app asks for a first weight. */
export async function logAllSets(page: Page, kg = "20", limit = 80) {
  for (let i = 0; i < limit; i++) {
    const tick = page.locator(".set-r.current .tick");
    if ((await tick.count()) === 0) return;
    await tick.first().click();
    const pad = page.getByRole("dialog", { name: /Edit/ });
    if (await pad.isVisible().catch(() => false)) {
      for (const ch of kg) await pad.getByRole("button", { name: ch === "." ? "." : ch, exact: true }).click();
      await pad.getByRole("button", { name: "Done" }).click();
      await page.locator(".set-r.current .tick").first().click();
    }
  }
  if (limit >= 80) throw new Error("logAllSets did not finish");
}

export async function startNext(page: Page) {
  await page.getByRole("button", { name: "Today" }).click();
  await page.getByRole("button", { name: "Workout", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".wk-head")).toBeVisible();
}

export async function finishWorkout(page: Page) {
  await page.getByRole("button", { name: "Finish workout" }).last().click();
  const saveTicked = page.getByRole("button", { name: "Save only the ticked sets" });
  if (await saveTicked.isVisible().catch(() => false)) await saveTicked.click();
  await expect(page.getByText("Done", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
}
