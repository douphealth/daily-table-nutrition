# The Daily Table 15.5.1 - validation and change receipt

## Baseline and status

Prepared from the exact uploaded v15.5 ZIP. Baseline SHA-256: `1d7c49e27f223dc51c472e52afc5688de02a157b487e50a89a09506b4a877230`.
No Cloudflare or GitHub write, paid model request, provider setting change, private user record or DNS change was made. This is a locally verified software repair, not a live recognition benchmark.

## Root cause reproduced on the unmodified v15.5 site

The browser test confirmed that Add these foods to my kitchen **did save the selected foods** into the existing workspace. Its legacy save handler then unchecked every selected observation and emitted a new selection event. The photo journey consequently removed its recipe results and returned to the empty selection prompt. That made a successful save look like a detour to manual entry. The baseline evidence records the state before and after the click and zero selected rows after it.

## Changes

- A selected photo-food set immediately renders one actual recipe: ingredient amounts plus the entire method, with no Search, View or pantry-save prerequisite.
- Full-set collection matches and exact supported local templates take precedence. Near matches show additional ingredients and any selected foods they do not use. Unknown selected foods cannot be silently omitted to claim an exact recipe.
- Optional Add these foods to my kitchen uses the existing validated transaction and retains the selection, recipe and portions. Success is visible and repeat saves are disabled. Failure to persist keeps previous durable data and clearly says session-only rather than falsely claiming success.
- Confirm clear foods is an explicit user action. Clear canonical foods can be selected together; uncertain, unidentified, rejected or hard-excluded observations are not bulk-selected. Recognition itself now leaves all foods unchecked.
- Prepared-meal observations are not inferred as pantry ingredients. They can remain user-reviewed notes.
- Existing and local recipes open in the actual cooking engine even when the pantry has not been saved. Reading/cooking does not automatically deduct ingredients.
- The optional AI flow uses the same selection. Proposed batch amounts are shown before the explicit online-generation action. The entire returned method is displayed before save. Selection changes cancel/invalidate stale proposals. No automatic generation/retry/provider switch was added.
- Profile and scene scope prevent a saved photo-review selection from silently reopening in a different kitchen. No photo bytes are added to persistent state by this change.
- Responsive inline recipe layout, accessible portion control and keyboard-focus retention. The original app theme and all images are retained.

## Completed tests on final code

| Suite | Passed | Failed |
|---|---:|---:|
| Worker/security/recipe-contract paths | 44 | 0 |
| ai | 18 | 0 |
| flow | 23 | 0 |
| layout-desktop | 31 | 0 |
| layout-mobile | 31 | 0 |
| pages | 15 | 0 |
| safety | 16 | 0 |

**44 Worker/security checks and 134 Chromium assertions passed across six completed browser groups.** Each browser group recorded zero uncaught page exceptions. The layouts covered 320, 390, 430, 768, 1024 and 1440 CSS pixels, with light and dark modes in the photo journey. All seven main pages also passed fresh-state phone boot and overflow smoke checks. These are focused regressions, not a complete independent test of every pre-existing app feature.

One development parallel run stopped at the environment time limit; the desktop group was rerun alone to completion. Final `journey-*.json` reports, not incomplete logs, establish the passing counts.

## Preservation and structure

- 645 original image files, 52,997,608 bytes: all byte-identical. No original image removed, recompressed or replaced.
- All 84 original recipes, four starting menus, photo assignments, routes and data fields unchanged except build/version labels.
- Worker and shared security/AI studio logic unchanged except build/version labels. _headers, _routes.json and _redirects unchanged byte-for-byte.
- 19,110 local path-reference occurrences checked, zero missing files. There are 193 dynamic fragment targets that static HTML inspection cannot independently certify; browser flows exercise their relevant rendered targets.
- 11 shipped JavaScript files passed syntax checks. 260 precache entries exist; no API or private workspace responses were added to that static list.
- 857 locally served static files returned 200 and matched disk bytes. The static server does not execute the Cloudflare Worker.
- 861 deployment ZIP entries passed CRC and byte-for-byte comparison. Clean reconstruction from the original ZIP and the verified replacement set produced the same 861 payload files.
- A narrow configured credential-pattern scan checked 211 text files and found no matches. This is not a penetration test or complete secret audit.
- Four original webfont binaries are omitted; the original fallback font stacks remain. Their preloads, @font-face rules and cache references were removed. No other binary assets were changed.

## Evidence boundaries

The Chromium harness executes the actual shipped HTML/CSS/JavaScript and local images inside an in-memory document, with explicit local asset routing. It replaces storage, Turnstile, secure digest and AI responses and omits document CSP in that controlled harness. Actual image decoding, selection events, rendering, keyboard interactions, cancellation and client validation execute in Chromium. Worker tests independently use synthetic server-verification/model responses. Screenshots are visibly labeled simulated tests.

No live model inference, Turnstile account verification, actual provider latency, camera/HEIC device coverage, native durable storage, installed PWA upgrade, production CSP, full contrast/WCAG audit, screen-reader certification or human timing study was performed. The one-action confirmation path is an interaction fact in a successful simulated scan, not a promise about total scanning latency or all possible ingredient combinations.

Ingredient identities and validation are not photo-derived quantity measurements, allergy guarantees or food safety/quality certification. Existing photos remain illustrative; no new recipe is falsely given an unrelated dish photograph. Recipe times remain estimates. No nutrients or healthiest-recipe ranking were invented. AI generation remains optional and can return no supported recipe.

## Deployment artifact

File: `daily-table-v15.5.1-cloudflare-upload.zip`

Bytes: 54,793,070 (54.79 MB decimal)

SHA-256: `c747526e0dabbd0d34234039c83f280d62b28597ade3a2b683a823e2610b03d4`
