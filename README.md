# Workout

Personal training app: gym logging, guided stretching, progress. Installable web app (PWA), works offline, data stored only on the phone (IndexedDB) with manual backups.

- Plan: see the approved plan (milestones M0 to M6).
- Install and use: `GUIDE.md`.
- `npm run dev` · `npm test` (unit) · `npm run e2e` (WebKit full week, rest timer, offline) · `npm run contrast` (WCAG check of every colour pair) · `npm run build`
- Exercise visuals: `src/figures/` (rig, motion specs, checks). `node scripts/figure-report.mjs` runs every movement check; `node scripts/render3d.mjs [id ...]` re-renders the 3D loops (dev server on :5191).
- Content: `src/data/` (exercises, program, stretches). Research and sources: `research/`.
- Platform facts the code relies on (iOS wake lock, no vibration, share sheet, storage): `research/PLATFORM.md`.

General fitness information, not medical advice.
