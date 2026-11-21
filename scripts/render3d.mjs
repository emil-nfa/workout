// Pre-renders the 3D mannequin loops: node scripts/render3d.mjs [id ...]
// Needs the dev server on :5191 (preview "workout-dev"). Writes public/figures3d/<id>.mp4, <id>.jpg, <id>-48.png.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["leg_press", "pallof", "reverse_pec"];
const FPS = 24;
const out = "public/figures3d";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 540, height: 540 } });
await page.goto("http://localhost:5191/render3d.html");
await page.waitForFunction(() => document.title === "ready");
for (const id of ids) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `r3d-${id}-`));
  const { period, tB } = await page.evaluate((i) => window.r3d.setup(i), id);
  const n = Math.round(period * FPS);
  const canvas = page.locator("#c");
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.r3d.frame(t), (i / n) * period);
    await canvas.screenshot({ path: path.join(tmp, `${String(i).padStart(4, "0")}.png`) });
  }
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(tmp, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", "-preset", "slow", "-movflags", "+faststart", path.join(out, `${id}.mp4`)]);
  // Poster (end position) and a small icon (96 px for sharp 48 px display).
  await page.evaluate((t) => window.r3d.frame(t), tB);
  const still = path.join(tmp, "still.png");
  await canvas.screenshot({ path: still });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", still, "-q:v", "4", path.join(out, `${id}.jpg`)]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", still, "-vf", "crop=iw*0.8:ih*0.8,scale=96:96:flags=lanczos", path.join(out, `${id}-48.png`)]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(id, n, "frames", (fs.statSync(path.join(out, `${id}.mp4`)).size / 1024).toFixed(0), "KB");
}
await browser.close();
