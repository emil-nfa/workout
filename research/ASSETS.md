# Assets: exercise visuals, fonts, icons (licences)

Checked 21/11/2026 at the source (repository licence files, issue threads, the wger API, and the font files themselves).

## Exercise visuals

| Source | Licence (verified) | Where it is stated | What it means for us | Decision |
|---|---|---|---|---|
| **yuhonas/free-exercise-db** (JSON data) | Unlicense (public domain) | `LICENSE.md` and README of https://github.com/yuhonas/free-exercise-db | The exercise **text/JSON** can be used freely. | Text only as a cross-check; we write our own text. |
| free-exercise-db **images** | **Unknown** | Issue #2 (https://github.com/yuhonas/free-exercise-db/issues/2, 2023): the maintainer says he does not know where the images come from or whether they are royalty free, use at your own risk; a 2025 comment says they are not royalty free. Issue #12 (https://github.com/yuhonas/free-exercise-db/issues/12, 2024) points back to #2; no licence given. | No safe licence. | **Not used.** |
| **wger** exercise images | Mostly **CC-BY-SA 3.0** (licence id 1). The API also defines CC-BY-SA 4.0, CC0, CC-BY 4.0 and ODbL | https://wger.de/api/v2/license/?format=json and https://wger.de/api/v2/exerciseimage/?format=json (395 images; first 20 checked all licence 1, author mostly "Everkinetic", some with an empty author) | Must credit the author and licence with a link, and any changed image must stay CC-BY-SA. Two of the first 20 images have no author recorded. | **Supplement at most**, per-image credit stored next to each image; skip images with no author. Machine-specific coverage (Technogym / Hammer) **not verified**; most wger images are free weights. |
| wger software | AGPL-3.0-or-later; exercise data "Creative Commons, see individual entries" | https://github.com/wger-project/wger (`LICENSE.txt`, README) | We do not use its code. | n/a |
| **Disfigure** (boytchev) | **MIT** | `LICENSE` of https://github.com/boytchev/disfigure | Free to use with the copyright notice. Note: it describes itself as a library to rig non-rigged 3D models, not a ready human figure. | Candidate for 3D figures. |
| **mannequin.js** (boytchev) | **GPL-3.0** | README and `LICENSE` of https://github.com/boytchev/mannequin.js | Copyleft: if shipped in the app, the app's source must be offered under GPL-3.0. Fine if the repo is public and GPL-compatible; otherwise avoid. | Only if the whole app is OK being GPL-3.0; otherwise prefer Disfigure or the in-house 2D rig. |
| Gymvisual | Paid, credit required (from the background brief; not re-checked) | | Costs money. | Not used unless the user agrees to pay. |
| YouTube, Instagram, Technogym, Fitness Park sites, ExerciseDB (RapidAPI) | Not licensed for reuse | | | Not used. A YouTube **search** link is fine as a supplement. |

**Recommendation:** in-house figures (2D rig, or Disfigure in 3D) as the main visual, plus an in-house body map. wger images only as an optional extra with credits.

## Fonts

| Font | Licence (verified) | Evidence | Tabular figures (`tnum`) |
|---|---|---|---|
| **Barlow** | SIL Open Font License 1.1 | `OFL.txt` in https://github.com/jpt/barlow ("Copyright 2017 The Barlow Project Authors"); licence field in the font file `Barlow-Regular.ttf` from https://github.com/google/fonts/tree/main/ofl/barlow | **Yes.** GSUB features include `tnum` (and `pnum`). Default digits are proportional (the "1" is narrower), so turn tabular on with `font-variant-numeric: tabular-nums`. |
| **Barlow Condensed** | SIL Open Font License 1.1 | Licence field in `BarlowCondensed-Medium.ttf` from https://github.com/google/fonts/tree/main/ofl/barlowcondensed | **Yes**, same feature list as Barlow (`tnum` present, digits proportional by default). Good for timer and weight numbers with `tabular-nums`. No need for IBM Plex Mono. |
| **Newsreader** | SIL Open Font License 1.1 | README of https://github.com/productiontype/Newsreader; licence field in the variable font `Newsreader[opsz,wght].ttf` from https://github.com/google/fonts/tree/main/ofl/newsreader | **Yes**, `tnum` present; its default digits are already all the same width. |

How the `tnum` check was done: downloaded the Google Fonts TTFs and listed the GSUB feature tags and digit widths with fontTools 4.51 (21/11/2026).

**OFL obligations:** fonts can be self-hosted and bundled in the PWA. If the font files are redistributed (they are, inside the app), keep the copyright notice and the OFL text with them (for example `public/fonts/OFL.txt`). Do not sell the fonts on their own. No Reserved Font Name was declared in Barlow's OFL.txt; Newsreader's OFL.txt was not opened, so keep the original family names unmodified to be safe.

## Icons

| Library | Licence | Notes |
|---|---|---|
| **lucide** / lucide-react | **ISC** | `LICENSE` of https://github.com/lucide-icons/lucide. About 280 icons derived from Feather carry a separate **MIT** notice (Copyright Cole Bemis); keep both notices. No brand logos in the set. |

## Branding

No Fitness Park, Technogym or Hammer Strength logos or photos in the app. Naming machines in text ("Technogym Leg Curl") is fine.
