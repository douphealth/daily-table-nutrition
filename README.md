# The Daily Table

Mediterranean meal planning, pantry matching, optional photo recognition and ingredient-constrained recipe creation. Personal kitchens are browser-local; optional AI requests use the configured Cloudflare Worker with consent and security checks.

**Imported release: 15.5.1.** This repository preserves the complete verified application payload, not just a ZIP uploaded as an opaque file.

## Project contents

| Path | Purpose |
| --- | --- |
| `site/` | Complete prebuilt Cloudflare Pages deployment: 861 files, including 645 images |
| `site/assets/chunks/photo-journey-15.5.1.js` | Readable photo selection and immediate-recipe flow |
| `site/assets/site.js` | Shipped application bundle, including the corrected photo-save transaction |
| `site/_worker.js` | Shipped optional photo, recipe and security API Worker |
| `tests/` | Worker/security and fixture-backed browser regression tests |
| `scripts/` | Integrity checks, browser/HTTP tests and original snapshot reconstruction tools |
| `reference/` | Source/deployment hashes and original reconstruction manifest |
| `changes/`, `baseline/` | Focused v15.5-to-v15.5.1 repair sources and comparison baseline |
| `evidence/` | Supplied release evidence and locally rerunnable checks |

The original author's complete pre-bundle source project was not supplied. Unchanged modules remain their released bundles. This is an honest source-and-distribution snapshot, not a reconstructed framework project.

## Validate and run

Requires Node.js 22 or newer. No npm runtime dependencies or installation step are required for the Node tests.

```sh
npm test
```

This verifies every deployment file against its SHA-256 and executes 44 Worker/security checks with simulated external services. It does not call a paid AI model.

For a local static preview, using Python 3:

```sh
python -m http.server 8080 --directory site
```

Open `http://localhost:8080`. The Python server does not execute `_worker.js`; online photo/recipe APIs require the correctly configured Cloudflare environment. Do not interpret local static API failures as production verification.

Browser regression dependencies and commands:

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
npm run test:browser
npm run test:http
```

See `VALIDATION.md` for the original test boundaries. Tests use explicit infrastructure fixtures, not production AI accuracy measurements.

## Deployable release

`site/` is already built. Deploy only its contents using the existing project's established Cloudflare upload workflow. Do not upload this whole repository as the website.

The baseline deployment ZIP is `daily-table-v15.5.1-cloudflare-upload.zip`, SHA-256:

```text
c747526e0dabbd0d34234039c83f280d62b28597ade3a2b683a823e2610b03d4
```

All 861 `site/` files are verified byte-for-byte against it. Git attributes disable newline conversion to preserve these bytes on Windows.

There is intentionally **no automatic deployment workflow**, no new billing configuration, and no copied credentials. Creating or pushing this repository does not update Cloudflare. Read `UPGRADE.md` before a separate preview or production deployment.

## Initial GitHub publication

Run `Publish-Daily-Table.cmd` on Windows (or `node Publish-Daily-Table.mjs` from any terminal). The PowerShell wrapper forwards to the same Node publisher and **does not use `Get-FileHash`**. The publisher requires Git, GitHub CLI and Node.js 22+. Run `node Publish-Daily-Table.mjs --verify-only` for a GitHub-free integrity check. It authenticates through GitHub's browser flow when needed, verifies the account is `douphealth`, validates this snapshot, creates a **private** `douphealth/daily-table-nutrition` repository if absent, pushes `main` and `v15.5.1`, and compares the remote Git tree with every local tracked file.

It does not force-push, overwrite a different repository history, create a public repository, send credentials in chat, or deploy the app. An existing populated repository with a different commit stops the process for review. The repository is not remotely created until this publisher actually succeeds.

## Safety and rights

Allergens remain hard exclusions; dislikes affect ranking. Photo suggestions require human confirmation. AI recipe outputs remain validated. No hidden-allergen guarantee, invented nutrient value, medical prescription or perfect recognition claim is made.

Existing images retain their supplied credits and illustrative status; no new license or ownership claim is added. No new blanket open-source license has been chosen. Preserve third-party notices and review redistribution rights before making the repository public.

## Provenance

The exact editable snapshot was `daily-table-v15.5.1-source-and-tests.zip`, SHA-256:

```text
2c1938c96b9f0501431d0cb9cadfaacfa205bebe6e65897e15fcee09026d7cef
```

The original release README is retained at `docs/SOURCE-README.md`. Repository preparation changes only project documentation, validation and publication helpers; the application payload remains unchanged.
