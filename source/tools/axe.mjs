// axe-core accessibility scan across pages x themes x widths (WCAG 2.1 A/AA + best practices).
// usage: node axe.mjs <baseUrl> <seedRoot> [state=populated] [pages comma list]
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
import {AxeBuilder} from '@axe-core/playwright';
const [base, seedRoot, kind = 'populated', pagesArg] = process.argv.slice(2);
const pages = (pagesArg || '/,/pantry/,/recipes/,/today/,/weekly-plan/,/shopping-list/,/settings/,/recipes/greek-yogurt-oats-banana/,/about/,/how-it-works/,/guides/cook-from-your-pantry/,/privacy/,/photo-credits/,/404-test/').split(',');
const b = await launch();
const seed = await buildSeed(seedRoot, kind);
const totals = new Map();
let pagesWithViolations = 0, scans = 0;
for (const scheme of ['light', 'dark']) {
  for (const w of [390, 1440]) {
    const s = {...seed, theme: scheme};
    const {page, ctx} = await newPage(b, {w, h: w < 768 ? 844 : 900, scheme, storage: {'dtable:workspace:v2': JSON.stringify(s)}});
    for (const p of pages) {
      await page.goto(base + p, {waitUntil: 'networkidle'}); await sleep(900);
      const r = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
      scans++;
      if (r.violations.length) pagesWithViolations++;
      for (const v of r.violations) {
        const key = v.id + ' [' + v.impact + ']';
        if (!totals.has(key)) totals.set(key, {help: v.help, nodes: 0, where: new Set(), sample: []});
        const t = totals.get(key); t.nodes += v.nodes.length; t.where.add(`${p}@${w}/${scheme}`);
        for (const n of v.nodes.slice(0, 2)) if (t.sample.length < 4) t.sample.push(n.target.join(' ') + ' :: ' + (n.any[0]?.message || n.all[0]?.message || n.none[0]?.message || '').slice(0, 140));
      }
    }
    await ctx.close();
  }
}
await b.close();
console.log(`axe scans: ${scans}, with violations: ${pagesWithViolations}, distinct rules: ${totals.size}`);
for (const [k, t] of totals) { console.log(`\n${k}  ${t.help}  nodes=${t.nodes}  on ${[...t.where].slice(0, 4).join(', ')}${t.where.size > 4 ? ' +' + (t.where.size - 4) : ''}`); for (const s of t.sample) console.log('   ' + s); }
process.exit(totals.size ? 1 : 0);
