# The Daily Table

- The release snapshot in site/ is version 15.5.1. It must initially match reference/site-v15.5.1-manifest.json exactly.
- This is an imported deployable distribution plus focused repair sources, not the original author's complete pre-bundle source tree. Do not invent a Vite/React build configuration.
- Read docs/SOURCE-README.md and UPGRADE.md before changing code or deployment.
- Run npm test. Browser tests require Python, Playwright, Pillow, Beautiful Soup, and Chromium; their infrastructure is explicitly simulated.
- Preserve all existing images, ingredient identities, saved kitchen data, exclusions, consent and server-side Turnstile checks.
- Never publish secrets, personal kitchen exports, private photos or font binaries. Keep real API secrets in Cloudflare, not this repository.
- No automatic Cloudflare deployment is configured. A source push is not authorization to change Production, DNS, provider settings, billing, or security.
- Do not claim live AI accuracy or working production recognition from fixture-based tests.
