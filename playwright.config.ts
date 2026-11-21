import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run in WebKit (closest to iPhone Safari) at the iPhone 17 Pro size.
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5193",
    viewport: { width: 402, height: 874 },
    hasTouch: true,
    acceptDownloads: true,
  },
  projects: [
    { name: "webkit", testIgnore: /offline/, use: { ...devices["Desktop Safari"], viewport: { width: 402, height: 874 }, hasTouch: true } },
    // Playwright's WebKit can't control service workers, so the offline test runs in Chromium against the real build.
    { name: "offline", testMatch: /offline/, use: { ...devices["Desktop Chrome"], viewport: { width: 402, height: 874 } } },
  ],
  webServer: [
    { command: "npx vite --base / --port 5193 --strictPort", port: 5193, reuseExistingServer: true, timeout: 60_000 },
    { command: "BASE=/ npx vite build --outDir dist-e2e && npx vite preview --base / --outDir dist-e2e --port 5194 --strictPort", port: 5194, reuseExistingServer: false, timeout: 180_000 },
  ],
});
