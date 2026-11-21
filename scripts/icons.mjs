// Renders public/favicon.svg to the PNG icons iOS and the manifest need (run once; output committed).
import { chromium } from "@playwright/test";
import fs from "node:fs";
const svg = fs.readFileSync("public/favicon.svg", "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [["apple-touch-icon.png", 180, 0], ["icon-192.png", 192, 0], ["icon-512.png", 512, 0], ["icon-maskable-512.png", 512, 0.1]]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - 2 * pad));
  await page.setContent(`<body style="margin:0;background:#0E0E0E;display:grid;place-items:center;height:${size}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</body>`);
  await page.screenshot({ path: `public/${name}` });
}
await browser.close();
console.log("icons written");
