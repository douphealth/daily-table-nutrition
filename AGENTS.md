# The Daily Table

- The release snapshot in site/ is version 15.20.0. It must match reference/site-v15.20.0-manifest.json exactly; `npm test` checks this.
- site/ is a prebuilt distribution. The original author's pre-bundle source tree was never supplied. Changes are made as anchored patches (source/pkg/patches20/) applied by source/pkg/build.mjs to a shipped package. Do not invent a Vite/React build configuration, and do not hand-edit site/.
- Read README.md, UPGRADE.md and docs/ROLLBACK.md before changing code or deployment.
- After a build, replace site/ with the output, set the version in package.json, run `node scripts/write-manifest.mjs`, then `npm test`.
- Preserve all existing images, ingredient identities, saved kitchen data, exclusions, consent and server-side Turnstile checks. A release that removes foods from the catalogue locks the kitchens that saved them (docs/ROLLBACK.md).
- Never publish secrets, personal kitchen exports, private photos or font binaries. Keep real API secrets in Cloudflare, not this repository. This repository is public.
- Production is a Cloudflare Pages project updated by uploading a ZIP. A different Pages project builds each push to this repository as a preview of the repository root. A source push is not authorization to change Production, DNS, provider settings, billing, or security.
- Releases are also produced outside this repository. Before starting from site/, compare it with the build the production status endpoints report.
- Do not claim live AI accuracy or working production recognition from tests: every automated test uses simulated AI and security services.
