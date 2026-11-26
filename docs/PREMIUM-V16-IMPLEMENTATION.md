# The Daily Table: v16 reconciliation and premium UX execution specification

Status: **implementation guard and product requirements only; NOT a production deployment**.

## Release blocker

GitHub main carries an imported **15.5.1** dist snapshot (not the original pre-bundle source), while both live Cloudflare AI endpoints reported **16.0.0** on 20 October 2026. Never deploy the older `site/` to production. Use `node scripts/check-live-release.mjs` before any proposed release. Retrieve the exact Cloudflare v16 deployment artifact and reconstruct a maintainable build from the actual source if available. Preserve existing user storage and rollback snapshot.

## UX contract (implement against recovered v16 source)

1. **Homepage:** One clear promise: *Your ingredients. Your next great meal.* Show Take a photo and Enter ingredients as equally visible primary routes, a real clickable demo backed by an existing checked catalog recipe, and a three-stage example showing ingredients → confirmation → complete method. Preserve the existing forest/cream design language. Show no simulated AI accuracy, misleading ingredient photograph, or fabricated nutritional claims.
2. **Photo intake:** Dedicated `capture=environment` camera chooser on compatible mobile devices and independent library file picker. Explicitly say selection only previews locally; AI sends only after user initiates Identify Foods or separately opts into subsequent automatic identification. Allow retry/cancel, crop, HEIC conversion where supported, and accessible failure messages.
3. **Ingredient confirmation:** Each distinct ingredient appears as an editable, selectable chip, showing source and uncertainty. No unknown, hard-excluded, or prepared-dish ingredient auto-confirmation. A recognition vocabulary must not silently collapse fresh/cooked, generic/whole-grain, raw/dry variants. Greek/English aliases resolve to typed canonical IDs.
4. **Recipe:** Show the complete existing recipe in place immediately after selections; list used and missing ingredients. If none fits, one explicit Generate recipe action. Validate every ingredient ID, method action, equipment, allergens, quantities and raw protein doneness. Never claim clinical appropriateness, verified calories or taste. Always disclose rule-built versus AI-assisted recipe and whether ingredients are missing. Pantry save remains optional and must not clear the result.
5. **Profiles / synchronization:** Preserve browser-local kitchens. Cross-device sync is opt-in only, authenticated, access-controlled, encrypted in transit, with explicit import/export and collision handling. Do not silently migrate or overwrite local records. Treat `pages.dev` and the branded hostname as separate storage origins during migration.
6. **Trust:** Review existing 84 recipes for ingredient/method consistency, preparation state, estimated time, allergen exclusions and photo identity. Preserve honest image attribution and the disclosures of untested recipes. Add validated nutritional values only with ingredient database provenance and serving calculations.
7. **Navigation:** Replace confusing `Meal to review / Not yet saved` with action-oriented label. On Pantry keep photo and text entry visible before advanced preferences; collapse diagnostics and optional modeling controls, never essential safety constraints.
8. **Resilience:** Real-device test at 320, 375, 390, 768, 1024 and 1440 CSS px. Cover PWA update, offline, broken images, storage quota, camera permissions, low bandwidth and failed AI. Retain local backups and stop destructive reset behind confirmation.
9. **Operations:** Add anonymized, opt-in/consent-respecting funnel and failure metrics only if approved by privacy review. Track scan initiation, server success, food correction, recipe shown, first recipe cooked, latency, errors, estimated model usage. No photo or pantry payload in analytics. Implement per-IP/bot-aware server cost controls with practical privacy tradeoffs and daily provider budget alerts.

## Release acceptance gate

- Source commit maps to tested Cloudflare build and immutable preview deployment; no staging-to-production shortcut.
- Core photo journey passes with actual opt-in labeled photos including look-alike ingredients and negative/non-food images; distinguish model failure from human correction.
- Hard exclusions are never silently used; no unsaved data is described as synced.
- Desktop/mobile navigation, camera picker, recipe detail, grocery flow, backup/export/import and PWA update are manually exercised.
- Preserved original v16 state, link inventory and rollback deployment confirmed before any DNS, origin or storage changes.
- Run existing Node, Python/Playwright and HTTP checks only against the exact build; fixture tests must not be described as live model accuracy.

## Rollback

No production mutations in this branch. If the eventual release causes regressions, rollback the tested Cloudflare deployment; do not restore an obsolete local kitchen backup over newer records. Keep a read-only copy of the previous deployment and storage schema migration log.
