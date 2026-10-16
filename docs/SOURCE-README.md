# The Daily Table 15.5.1 - immediate photo recipes

Built from the user's exact `daily-table-v15.5-cloudflare-upload.zip`, not an older release. This is the editable deployable site plus the focused repair source, tests and evidence. The original author's pre-bundle source project was not supplied; unchanged application modules remain their original bundles.

## Main files

- `site/assets/chunks/photo-journey-15.5.1.js`: readable photo-selection and immediate-recipe journey.
- `site/assets/site.js`: original app bundle with a repaired photo-save transaction and cooking registration.
- `site/assets/app-v15.css`: retained visual theme plus responsive immediate-recipe styles.
- `site/`: complete Cloudflare deployable assets; upload the dedicated deployment ZIP, not this source archive.
- `changes/` and `reference/rebuild-manifest.json`: exact verified replacements/removals for the original v15.5 archive.
- `baseline/_worker.js`: original Worker reference for no-backend-change regression tests; no credentials.
- `tests/`: actual-site browser fixtures and Worker checks.

## Test

Node 22 was used. Python tests require `playwright`, `pillow` and `beautifulsoup4`, plus Chromium. The tests use simulated security, storage and AI responses: they incur no AI usage. Inspect `tests/fixture_support.py` for explicit fixture boundaries.

```sh
npm test
python scripts/test_browser.py
python scripts/check_http.py
```

`npm test` runs 44 Worker/security checks. The browser runner serially runs six bounded groups (134 assertions). Playwright must be able to start Chromium. Local HTTP checks only serve static bytes; they do not execute the Cloudflare Worker.

To reproduce the complete site from the original upload (rather than the supplied ready site):

```sh
python scripts/rebuild.py /path/to/daily-table-v15.5-cloudflare-upload.zip /path/to/new-output-directory
```

The original ZIP's SHA-256 is required. The script never overwrites an existing output directory, checks archive paths, and verifies all resulting payload hashes. `scripts/package.py` checks the current `site/` against that original ZIP and writes a complete Cloudflare upload.

No repository push, Cloudflare write, live inference or account-setting change is included. Read UPGRADE.md before rollout.
