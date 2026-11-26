# The Daily Table

Mediterranean meal planning, pantry matching, optional photo recognition and ingredient-constrained recipe creation. Personal kitchens are browser-local; optional AI requests use the configured Cloudflare Worker with consent and security checks.

**Release in `site/`: 15.20.0.** It is the production package 15.19.0 plus the anchored patches in `source/pkg/patches20/`.

**Status on 2026-11-26.** The production site reported build 15.20.0 on its status endpoints, and 41 of 41 key files (pages, scripts, styles, data, service worker) fetched from it matched `site/` byte for byte. Production is a Cloudflare Pages project that is updated by uploading a ZIP; nothing in this repository deploys to it.

## Project contents

| Path | Purpose |
| --- | --- |
| `site/` | Complete prebuilt Cloudflare Pages deployment: 880 files, including 645 images |
| `source/pkg/build.mjs` | The build: a shipped package in, ordered patches, release stamp, service-worker list, release manifest out |
| `source/pkg/patches20/` | The 15.20.0 patches, one concern each, with the measured defect in the header of each file |
| `source/pkg/gen/` | The ingredient knowledge base (`catalog.mjs`: 269 foods, names, allergens, diets) and the food icons |
| `source/pkg/assets/` | Readable sources that the patches insert (`polish.css`) |
| `source/tools/` | Tests and measurement scripts |
| `reference/site-v15.20.0-manifest.json` | SHA-256 of every file in `site/`, and of the upload ZIP |
| `scripts/` | `verify-site.mjs` (integrity check) and `write-manifest.mjs` |
| `docs/` | `CHANGELOG.md`, `VALIDATION.md`, `ROLLBACK.md`, before/after boards |

The 15.7 to 15.19 releases were made as edits to the shipped bundle and uploaded directly, so the shipped package is their only source. The pipeline here therefore starts from a shipped package and fails loudly, naming the file and the string, if the code a patch touches has moved.

## Validate

Requires Node.js 22 or newer. No installation step.

```sh
npm test
```

This checks every file in `site/` against its SHA-256 (880 files), then runs 22 package checks, 7 kitchen-rule groups (allergens, diets, strict labels, names in English and Greek) and 5 recipe-text groups. It calls no network service and no AI model.

The Worker and security scenarios need one image library:

```sh
cd source/tools && npm ci && cd ../..
npm run test:worker
```

That runs 32 scenarios against `site/_worker.js` with simulated AI and security services.

The browser suites (photo to recipe, typed foods, site flows, accessibility, responsive sweep, upgrade from the previous release) are in `source/tools/` and are driven by `run-audit.ps1`. They need Google Chrome, the dependencies above, and two inputs that are not in this repository: the 15.19.0 package and an unbundled 15.5.0 build that the tests use to seed kitchens (`source/v15/`). They were run on these exact bytes before the import; the results, and what they do not cover, are in `docs/VALIDATION.md`. They were not re-run from this repository layout.

## Rebuild

Put the 15.19.0 package (879 files) in a folder outside `site/`, then:

```sh
node source/pkg/build.mjs --base <15.19.0 folder> --out <new folder> --version 15.20.0 --patches source/pkg/patches20
```

Run from this layout, that produced 880 of 880 files identical to `site/`. Do not build into, or from inside, the output folder.

## Deploy

`site/` is already built. Upload only its contents. Do not upload this whole repository as the website.

The upload ZIP is `daily-table-v15.20.0-cloudflare-upload.zip`, SHA-256:

```text
ec59b1d7c5b5aebe67d903640dc27f4cfb6107da454b175dd567733d3cc64f6b
```

All 880 `site/` files are byte-identical to its contents. Git attributes disable newline conversion to keep those bytes on Windows. Read `UPGRADE.md` and `docs/ROLLBACK.md` before a deployment or a rollback.

## What a push to this repository does

A second Cloudflare Pages project, `the-daily-table-nutrition`, is connected to this repository. It builds every pushed branch and publishes the **repository root**, so the app appears there under `/site/` next to these documents. That copy is not the production site and is not a tested deployment. A push is not authorization to change Production, DNS, provider settings, billing or security.

## What is not verified

Every automated test uses scripted stand-ins for the AI models and for Cloudflare Turnstile. Recognition accuracy, real latency and the live security path are not measured by anything in this repository. No recipe was cooked. See `docs/VALIDATION.md` for the full list.

## Safety and rights

Allergens remain hard exclusions; dislikes affect ranking. Photo suggestions require human confirmation. AI recipe outputs remain validated. No hidden-allergen guarantee, invented nutrient value, medical prescription or perfect recognition claim is made.

Existing images retain their supplied credits and illustrative status; no new license or ownership claim is added. No blanket open-source license has been chosen. Preserve third-party notices and review redistribution rights.

## History

The first import, 15.5.1, with its repair sources, evidence and tests, is at tag `v15.5.1`. Until this release the `main` branch held that import plus three later commits to the pantry photo flow. The 15.7 to 15.19 production releases were never committed to it; 15.20.0 replaces `site/` with the lineage that was in production.
