// Lighthouse audits (mobile + desktop) against a locally served build, using the system Chrome.
// usage: node lh.mjs <baseUrl> <outJson> [mobile|desktop|both] [pages comma list]
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs';
const [base, outJson, mode = 'both', pagesArg] = process.argv.slice(2);
const pages = (pagesArg || '/,/pantry/,/recipes/,/today/,/weekly-plan/,/shopping-list/,/settings/,/recipes/greek-yogurt-oats-banana/').split(',');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = await chromeLauncher.launch({chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']});
const out = [];
for (const form of mode === 'both' ? ['mobile', 'desktop'] : [mode]) {
  for (const p of pages) {
    const flags = {port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']};
    const config = form === 'desktop' ? {extends: 'lighthouse:default', settings: {formFactor: 'desktop', screenEmulation: {mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false}, throttling: {rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0}}} : undefined;
    try {
      const r = await lighthouse(base + p, flags, config);
      const lhr = r.lhr, cat = k => Math.round((lhr.categories[k]?.score ?? 0) * 100);
      const a = lhr.audits;
      const row = {form, page: p, performance: cat('performance'), accessibility: cat('accessibility'), bestPractices: cat('best-practices'), seo: cat('seo'),
        fcp: Math.round(a['first-contentful-paint'].numericValue), lcp: Math.round(a['largest-contentful-paint'].numericValue), tbt: Math.round(a['total-blocking-time'].numericValue), cls: +(a['cumulative-layout-shift'].numericValue).toFixed(3), si: Math.round(a['speed-index'].numericValue),
        failed: Object.values(a).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual').map(x => x.id + ':' + x.score).slice(0, 14)};
      out.push(row);
      console.log(`${form.padEnd(7)} ${p.padEnd(42)} perf ${row.performance} a11y ${row.accessibility} bp ${row.bestPractices} seo ${row.seo} | FCP ${row.fcp} LCP ${row.lcp} TBT ${row.tbt} CLS ${row.cls} SI ${row.si}`);
      if (row.failed.length) console.log('   below 90:', row.failed.join(' '));
    } catch (e) { console.log(form, p, 'FAILED', String(e.message).slice(0, 160)); }
  }
}
await chrome.kill();
fs.writeFileSync(outJson, JSON.stringify(out, null, 1));
