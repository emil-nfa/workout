import { expect, test } from "@playwright/test";
import { onboard, startNext } from "./helpers";

// The rest countdown is computed from timestamps, so after the phone sleeps (time jumps) it is still right.
test("rest timer survives a jump in time (screen locked)", async ({ page }) => {
  await page.clock.install();
  await onboard(page);
  await startNext(page);
  const tick = page.locator(".set-r.current .tick").first();
  await tick.click(); // first time: the numpad opens for the weight
  const pad = page.getByRole("dialog", { name: /Edit/ });
  await pad.getByRole("button", { name: "2", exact: true }).click();
  await pad.getByRole("button", { name: "0", exact: true }).click();
  await pad.getByRole("button", { name: "Done" }).click(); // logs the set too
  await expect(page.locator(".rest .big")).toHaveText(/^2:00|^1:59/);
  await page.clock.fastForward(70_000);
  await expect(page.locator(".rest .big")).toHaveText(/^0:5[0-9]/);
  await page.clock.fastForward(60_000);
  await expect(page.locator(".rest .big")).toHaveText("Go");
});
