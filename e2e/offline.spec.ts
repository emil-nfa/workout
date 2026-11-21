import { expect, test } from "@playwright/test";

// Load the built app once with signal, then go offline (the basement) and use it.
test.use({ baseURL: "http://localhost:5194" });
test("works offline after one visit", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready).active);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Continue in the browser anyway" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Start training" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".wk-head")).toBeVisible();
  // The exercise loop plays offline too (fetched whole from the precache).
  await page.locator("#card-0 .thumb").click();
  await expect(page.locator("video")).toHaveAttribute("src", /^blob:/);
});
