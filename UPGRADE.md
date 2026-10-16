# The Daily Table 15.5.1 - deployment and rollback

## Correct upload

Use **daily-table-v15.5.1-cloudflare-upload.zip**. This is the full app, not a patch, repair builder or source-only archive. The root contains index.html, _worker.js, _routes.json, _headers, _redirects, sw.js, manifest.webmanifest, assets and all existing page directories.

The deployment contains 861 files and is 54,793,070 bytes (54.79 MB decimal). It preserves all 645 original v15.5 image files and all original recipe/photo data.

## Before deployment

Export each important kitchen profile from the currently working site and keep the original v15.5 ZIP and previous successful deployment. Do not clear browser data, recreate the project, alter DNS or change hostnames to apply the update.

This repair has no new environment variables. Keep the working Workers AI binding, model choices, recognition/recipe flags and Turnstile keys unchanged. The target hostname must already be authorized in the existing Turnstile widget. A UI release cannot change account-level hostname authorization.

## Upload to Preview

Cloudflare -> Workers & Pages -> daily-table-nutrition -> Create a new deployment -> Preview -> upload the complete v15.5.1 deployment ZIP. Do not upload the source-and-tests ZIP. Cloudflare supports a ZIP containing the standalone _worker.js.

The expected /api/vision/status and /api/recipes/status build is **15.5.1**. API protocols remain unchanged. An enabled status only means configuration exists; it is not an inference or accuracy test. Preview and Production may require separate environment bindings and Turnstile hostname permissions.

## Focused acceptance check

1. Open Pantry in Preview, select a permitted food photo and run recognition. This uses the existing provider and may incur its normal charges. It was not performed by this repair.
2. Confirm a recognized food, or use Confirm clear foods after checking the clear observations. Nothing is preselected on recognition alone; uncertain/unknown/rejected/blocked items are not bulk-confirmed.
3. A matching recipe's ingredients and complete method should appear immediately under the selection. Do not click Save or type the foods again. If there is no exact recipe, any additional or omitted foods must be disclosed.
4. Optionally press Add these foods to my kitchen BELOW the recipe. Verify the button says Saved in your kitchen, selections remain checked, the same recipe stays visible and there is no move to manual entry. Reload and confirm that the foods are in the pantry.
5. Change portions and check quantities. Open Cook step by step. This does not automatically deduct stock or assert that the photo measured quantities.
6. For AI creation, open the optional AI choice, review the displayed batch amounts, portions and water/equipment choices, and explicitly request a recipe. Verify the full method appears before saving. Save & cook should go directly to the actual cooking interface. Changes to selection must invalidate stale drafts.
7. Test mobile, dark mode, excluded foods, cancellation and your existing saved kitchen records. Back up the new state before any rollback.

After preview acceptance, upload the same tested ZIP to Production on the same project and permanent hostname. Accept the app's update notice and reopen stale tabs rather than clearing storage.

## Rollback

Choose the previous successful Cloudflare deployment's rollback action. Keep the current and pre-upgrade kitchen exports separately. No persistent state schema was changed by this repair, but restoring an older backup overwrites later user edits; do not restore one unnecessarily or discard the only current export.

## Visual preservation

Every original image remains byte-identical. Four bundled font binaries are not included in this download; their face/preload/cache entries are removed and the existing device-local fallback font stacks are used. Typography can differ slightly. This is not a photo-removal release.

## Documentation

Cloudflare Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/ (checked 14 October 2026). This reference explains ZIP/standalone Worker support and Preview deployments; it does not establish this user's account configuration or successful live recognition.
