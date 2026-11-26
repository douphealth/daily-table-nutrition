// Automated responsive sweep: for each page x width, record horizontal overflow, clipped/overlapping text risks,
// tap-target sizes, console errors; optionally save screenshots. Exit code 1 if any hard failure.
// usage: node sweep.mjs <baseUrl> <siteRoot> <outDir|-> <light|dark> [state=populated] [widths=320,390,430,768,1024,1440]
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
import fs from 'node:fs';
const [base, siteRoot, outDir, scheme = 'light', kind = 'populated', widthsArg = '320,390,430,768,1024,1440'] = process.argv.slice(2);
const widths = widthsArg.split(',').map(Number);
const pages = ['/', '/pantry/', '/recipes/', '/today/', '/weekly-plan/', '/shopping-list/', '/settings/', '/recipes/greek-yogurt-oats-banana/', '/about/', '/404-test-page/'];
if (outDir !== '-') fs.mkdirSync(outDir, {recursive: true});
const seed = await buildSeed(siteRoot, kind);
if (scheme === 'dark') seed.theme = 'dark';
const b = await launch();
let hard = 0;
const rows = [];
for (const w of widths) {
  const h = w < 768 ? (w === 320 ? 700 : 844) : w === 768 ? 1024 : 900;
  const {page, ctx} = await newPage(b, {w, h, scheme, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
  for (const p of pages) {
    await page.goto(base + p, {waitUntil: 'networkidle'});
    await sleep(900);
    const r = await page.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const over = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!el.getClientRects().length) continue;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.visibility === 'hidden') continue;
        const cd = el.closest('details:not([open])'); if (cd && !el.closest('summary')) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // ignore content inside intentional horizontal scrollers
        let p = el.parentElement, scroller = false;
        while (p && p !== document.body) { const ps = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(ps.overflowX) && p.scrollWidth > p.clientWidth + 1) { scroller = true; break; } p = p.parentElement; }
        if (!scroller && (r.right > vw + 1 || r.left < -1)) over.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
      }
      const small = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,summary,[role=button]')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const cd = el.closest('details:not([open])'); return !(cd && !el.closest('summary')) && cs.display !== 'inline' && r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.height < 24 || r.width < 24) && !el.closest('[hidden]') && !el.closest('.sr-only') && !el.classList.contains('skip') && !(el.matches('input[type=checkbox],input[type=radio]') && el.closest('label')); }).map(el => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
      return {scrollW: de.scrollWidth, vw, over: [...new Set(over)].slice(0, 6), small: [...new Set(small)].slice(0, 5)};
    });
    const doc = r.scrollW > r.vw + 1;
    if (doc) hard++;
    const errs = page.__errors.filter(e => !/404|favicon|turnstile/i.test(e));
    if (errs.length) hard++;
    rows.push(`${String(w).padStart(4)} ${p.padEnd(40)} ${doc ? 'DOC-OVERFLOW(' + r.scrollW + '>' + r.vw + ') ' : ''}${r.over.length ? 'over:' + r.over.join(',') + ' ' : ''}${r.small.length ? 'small:' + r.small.join(',') + ' ' : ''}${errs.length ? 'ERR:' + errs[0].slice(0, 80) : ''}`.trimEnd());
    page.__errors.length = 0;
    if (outDir !== '-') await page.screenshot({path: `${outDir}/${p === '/' ? 'home' : p.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${w}-${scheme}.png`, fullPage: true});
  }
  await ctx.close();
}
await b.close();
const issues = rows.filter(r => /DOC-OVERFLOW|over:|small:|ERR:/.test(r));
console.log(`checked ${widths.length * pages.length} page/width combos, ${issues.length} with findings, ${hard} hard failures`);
console.log(issues.join('\n'));
process.exit(hard ? 1 : 0);
