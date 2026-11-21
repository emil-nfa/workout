// Screenshots the flat-style contact strip (default view) for each motion: node scripts/sheet-shots.mjs <outDir> [id ...]
import { chromium } from "@playwright/test";
const [outDir, ...rest] = process.argv.slice(2);
const ids = rest.length ? rest : ["leg_press", "pallof", "reverse_pec"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1350, height: 900 }, deviceScaleFactor: 1 });
for (const id of ids) {
  await page.goto(`http://localhost:5191/bakeoff.html?sheet=1&id=${id}`);
  await page.waitForSelector(".sheetrow svg");
  await page.locator(".sheetrow").first().screenshot({ path: `${outDir}/2d-${id}.png` });
}
await browser.close();
