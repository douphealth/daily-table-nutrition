# Validation — release 15.20.0

Run on 2026-11-26 against the release folder (`site/` in this repository) and again on the upload ZIP extracted fresh (§6), served by a local server
that mirrors Cloudflare Pages (`_headers` CSP, `_redirects`, the real `_worker.js`, Brotli). Headless Chrome through Playwright 1.64,
axe-core 4.13, Lighthouse 12.8.

**The AI models and Cloudflare Turnstile are scripted stand-ins in every automated test.** The real Workers AI models and the real
Turnstile service were not exercised (no Cloudflare credentials on the build machine), so recognition accuracy, real latency and the
live security path are unverified. **Nothing was deployed by these tests.**

This report was written before deployment. The owner has since uploaded the package to production (see the status note in
`README.md`); that does not change what is and is not verified here. The "live" column is the package that was in production when
the tests ran, 15.19.0 (verified file by file against the site's own release manifest), run through the same test on the same machine.

## 1. Summary

| Area | 15.20.0 | Live 15.19.0, same test |
|---|---|---|
| Photo → foods → recipe (`photo-e2e.mjs`, 25 checks, 2 kitchens) at 390 light, 390 dark, 768 dark, 1440 light | **25 / 25** in all four | 10 / 25 at 390 light (see note) |
| Typed foods (`typed-test.mjs`: 85 everyday words, 16 ambiguous or misspelt, one mixed line) | **pass** | fail: 66 words not answered as expected |
| Site regression (`regress.mjs`, 19 flows, 67 checks) | **19 / 19** | 18 / 19 (see note) |
| Kitchen rules (`rules-test.mjs`: allergens, diets, strict labels, names in English and Greek) | **7 / 7** groups | not applicable (tests the larger catalogue) |
| Recipe wording (`recipe-text-test.mjs`) | **6 / 6** groups; server and browser write the same recipe in 2,936 of 2,936 cases | not applicable |
| Food names (`alias-regress.mjs`) | 207 names the live build resolves: **0 resolve differently**; 1,363 names of 269 foods through browser and server: **0 wrong** | — |
| Saved kitchens of earlier releases (`compat-test.mjs`) | **13 / 13**: every food key of v14, 15.6.3, 15.19.0 and v16 opens | — |
| Worker and security scenarios (`worker-test.mjs`) | **32 / 32** | 32 / 32 |
| Package integrity (`package-check.mjs`) | **22 / 22** (880 files, 58.7 MB) | 22 / 22 (879 files, 58.5 MB) |
| Accessibility (`axe.mjs`: 14 pages × light/dark × 390/1440 = 56 scans) | **0 violations** | 6 scans with violations, 16 nodes below 4.5 : 1 contrast |
| Responsive sweep (`sweep.mjs`: 10 pages × 6 widths × 2 themes = 120 combinations) | **0 findings** | 12 with findings (a 21 px tall link on Home) |
| Script and console errors on 15 pages (`page-errors.mjs`) | **none** | a 404 on the offline page (missing icon) |
| Returning visitor upgrade 15.19.0 → 15.20.0 (`sw-upgrade.mjs`, real service worker and HTTP cache) | **11 / 11** | — |
| The upload ZIP as delivered, extracted fresh | see §6 | — |

Notes on the live column:

- **10 / 25** — the photo test asserts the behaviour 15.20.0 introduces (photo button on the first screen, "Find ingredients" in view,
  one Cancel, six foods from seven names, the left-out list, step layout), so most of the failing checks are the defects listed in
  `CHANGELOG.md` §3 and §5, not regressions of live.
- **18 / 19** — the failing flow types "egg, tomato, spinach, feta, olive oil, bread" and expects recipe recommendations; on live none
  appear. Live does not recognise "bread"; I did not trace the exact cause further.

## 2. What the 25 photo checks cover

**A, a kitchen without restrictions:** a photo button is on the first screen above the dock · choosing a photo sends nothing to the
server · "Find ingredients" is enabled and on screen without scrolling · the launch area is out of the way · while identifying: one
Cancel, no duplicate status, no dead "Find ingredients" · seven photo names become six foods, all selected · the count line agrees
with the chips · exactly one analysis request, after the button · nothing saved to the kitchen · the recipe uses all six foods and
adds none · the recipe request carries exactly the selected foods and no photo · every step leads with its action · a raw salad is
labelled no-cook and nothing is "cooked" · feta and olives are set aside, not "cut into small pieces" · amounts for every food ·
still nothing saved · no script errors.

**B, a kitchen with milk and peanuts saved as allergens:** only allowed foods can be selected · the three removed foods are listed ·
each says which rule removed it · the count line accounts for all six suggestions · the note fits its card and links to the settings
that own the rules · removed foods are never sent for a recipe, the allergens are · the recipe contains none of them · no script errors.

Checked separately (`probe-cancel.mjs`): Cancel during a 6-second analysis is enabled, stops the request, returns "Find ingredients",
and the cancelled result does not come back.

## 3. Recipe wording

- The step text is written by fixed templates that exist twice (server and browser). 2,936 recipes compared: identical.
- 1,286 recipes that can be created on the live build were re-created: 63 word for word, 1,223 with the corrected wording, none lost.
- 24 raw proteins each have a doneness test: a temperature for meat, poultry and fin fish; appearance for shellfish.
- 3,000 ingredient baskets: the two food-group blocks of a recipe never disagree.

These are template and rule checks. **No recipe was cooked.** The app says on every created recipe that it is not kitchen-tested.

## 4. Lighthouse (local, Brotli; mobile = simulated slow 4G and 4× CPU)

| Page | Mobile perf 15.20.0 | Mobile perf live | Desktop perf 15.20.0 | Accessibility 15.20.0 (live) |
|---|---|---|---|---|
| `/` | **80–83** (6 runs) | 85–88 (6 runs) | 100 | 100 (97) |
| `/pantry/` | 94 | 90 | 100 | 100 (100) |
| `/recipes/` | 82 | 82 | 100 | 100 (100) |
| `/today/` | 95 | 94 | 100 | 100 (100) |
| Recipe page | 92 | 91 | 100 | 100 (100) |

Best Practices 100 on every page; SEO 100 except `/today/` (66, deliberately `noindex`); layout shift 0 (0.005 on desktop `/pantry/`).
Pages other than Home were measured once per build; single runs vary by about ±3 points.

**Home is about 4 points lower than live in Lighthouse's simulated score, and I could not fully explain why.** What was measured:

- The simulated largest-paint time is about 4.3 s on 15.20.0 against 3.5 s on live, in every one of the six runs.
- The *observed* largest-paint time in those same Lighthouse runs is earlier on 15.20.0: 507–555 ms against 639–646 ms.
- Measured directly under applied phone throttling (`probe-lcp.mjs`, 3 runs each): median 4.5 s on 15.20.0 against 5.4 s on live.
  Unthrottled (5 runs each): 0.52 s against 0.62 s.
- With the browser cache disabled, a first load transfers 337 KB in 20 requests against 314 KB in 19 on live (the larger catalogue,
  the icon sprite and one small stylesheet). Both figures count the recipe data twice; in normal use only live downloads it twice.
- Blocking the new stylesheet in 15.20.0 changes nothing. Blocking the home page's demo script on *live* moves live's simulated
  time to the same 4.4 s. Live fetches the recipe data twice under two addresses; 15.20.0 fetches it once. The simulation appears to
  reward the first arrangement, while the measured paint is earlier with the second.

So a visitor should not see a slower Home, but PageSpeed-style tools are likely to report a few points less for it. Mobile
performance remains below 95 on Home and Recipes, as on live.

## 5. Not done / not verified

- **No deployment**, no live-site PageSpeed run, no real device (iOS Safari, Android Chrome): headless Chrome with mobile emulation only.
- **Real Workers AI and real Turnstile were never exercised.** After deploying to a Preview: run "Test security only" (Processing
  details & crop) and identify a few real photos.
- Recognition accuracy is not measured and not claimed. The vision prompt now asks for a complete, specific list; whether the real
  models name more foods correctly because of it is untested.
- Recipes are not kitchen-tested (the app says so on each one). The 84 collection recipes are unchanged and carry no nutrition data.
- No font files are shipped (project rule since 15.5.1); headings use the device's serif.
- A rollback to 15.19.0 would make kitchens that saved one of the added foods unreadable until a larger-catalogue build returns;
  see `ROLLBACK.md`.
- Small things left as they are: typing "salad" offers Seasonal fruit first (it carries the name "fruit salad"); "tomato sauce"
  offers nothing because the catalogue has no such food.

## 6. The upload ZIP as delivered

`daily-table-v15.20.0-cloudflare-upload.zip` — 880 files, 50.9 MB, site at the ZIP root (`index.html`, `_worker.js`, `_headers`,
`_redirects`, `_routes.json`, `sw.js` …). SHA-256 `EC59B1D7C5B5AEBE67D903640DC27F4CFB6107DA454B175DD567733D3CC64F6B`.

Extracted into an empty folder and compared with the tested release folder: **880 of 880 files identical**. Then served from the
extracted folder:

| Test on the extracted ZIP | Result |
|---|---|
| Package integrity | 22 / 22 |
| Worker and security scenarios | 32 / 32 |
| Photo → foods → recipe at 390 light and 1440 dark | 25 / 25 both |
| Typed foods | pass |
| Saved kitchens of earlier releases | 13 / 13 |
| Site regression | 19 / 19 |
| Script and console errors on 15 pages | none |
| Upgrade 15.19.0 → the extracted ZIP | 11 / 11 |

## 7. Before and after

`boards\board-1-start-and-photo.png`, `board-2-identify-and-foods.png`, `board-3-recipe.png`, `board-4-allergen-kitchen.png`:
live 15.19.0 beside 15.20.0, same photo, same kitchen, 390 × 844.
