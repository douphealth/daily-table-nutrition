# The Daily Table 15.20.0 - deployment and rollback

## Correct upload

Use **daily-table-v15.20.0-cloudflare-upload.zip** (SHA-256 `ec59b1d7c5b5aebe67d903640dc27f4cfb6107da454b175dd567733d3cc64f6b`), or a ZIP of the contents of `site/`. It is the full app: the root contains index.html, _worker.js, _routes.json, _headers, _redirects, sw.js, manifest.webmanifest, assets and every page directory. 880 files, of which 645 are images.

Do not upload this repository, the `source/` folder or a source archive as the website.

## Before deployment

Keep the previous successful deployment available for rollback. Do not clear browser data, recreate the project, alter DNS or change hostnames to apply an update.

15.20.0 adds no environment variables. Keep the Workers AI binding, model choices, recognition and recipe flags, and Turnstile keys unchanged. The target hostname must already be authorized in the existing Turnstile widget; a release cannot change that.

## Preview first

Upload the ZIP as a Preview deployment of the production project. The expected `build` on `/api/vision/status` and `/api/recipes/status` is **15.20.0**. An enabled status means configuration exists; it is not a recognition or accuracy test. Preview and Production can need separate bindings and Turnstile hostname permissions.

On the Preview:

1. Open My pantry, choose a photo, press Find ingredients, create a recipe. This uses the real provider and may incur its normal charges. No automated test in this repository does this.
2. Under "Processing details & crop", run **Test security only**.
3. Save an allergen, repeat with a photo that contains that food, and check the "Left out for this kitchen" list.
4. Check a phone width, dark mode, and a kitchen saved by the previous release.

After the Preview is accepted, upload the same ZIP to Production. Returning visitors get the app's update notice; they do not need to clear storage.

## Rollback

Read `docs/ROLLBACK.md` first: returning to 15.19.0 locks the kitchens that saved one of the 195 foods 15.20.0 adds, until a build with the larger catalogue is live again. Their data is not deleted. Prefer fixing forward.

## Stored data

15.20.0 changes no stored data format. A kitchen saved by 15.19.0 or any earlier release opens unchanged, and kitchens that name foods of the October 270-food release open again (`source/tools/compat-test.mjs`, `source/tools/sw-upgrade.mjs`).
