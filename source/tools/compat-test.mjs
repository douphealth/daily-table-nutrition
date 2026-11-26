// A kitchen saved by an EARLIER release must open in this one, and a kitchen that really is invalid must still be refused untouched.
//   1. a v16 kitchen with the two foods this catalogue retired (red onion, cherry tomatoes) plus foods only the big catalogue has
//   2. a kitchen holding EVERY food key of each earlier release
//   3. a kitchen with a key no release ever had: refused with the protective message, stored data not overwritten
// usage: node compat-test.mjs <baseUrl> <seedRoot> <earlierSite> [...earlierSite]
import fs from 'node:fs';
import path from 'node:path';
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
const [base, seedRoot, ...earlier] = process.argv.slice(2);
const b = await launch();
const results = [];
const check = (name, ok, detail = '') => results.push({name, ok: !!ok, detail});
const REFUSED = /Saved kitchen data could not be read|Saved data needs attention/;
async function open(seed, pages = ['/pantry/', '/today/', '/shopping-list/']) {
  const raw = JSON.stringify(seed);
  const {page, ctx} = await newPage(b, {w: 390, h: 844, storage: {'dtable:workspace:v2': raw}});
  const seen = [];
  for (const p of pages) {
    await page.goto(base + p, {waitUntil: 'networkidle'}); await sleep(800);
    seen.push(await page.evaluate(() => ({alerts: [...document.querySelectorAll('[role=alert], [role=status], .toast, .ui-toast')].filter(e => e.offsetWidth).map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '), main: document.querySelector('main')?.innerText.length || 0})));
  }
  const stored = await page.evaluate(() => localStorage.getItem('dtable:workspace:v2'));
  const errors = page.__errors.filter(e => !/favicon|turnstile|net::ERR_ABORTED/.test(e));
  await ctx.close();
  return {raw, stored, state: JSON.parse(stored || '{}'), refused: seen.some(s => REFUSED.test(s.alerts)), alerts: seen.map(s => s.alerts).filter(Boolean).join(' || ').slice(0, 300), errors};
}
const labels = dir => JSON.parse(fs.readFileSync(path.join(dir, 'assets/data.json'), 'utf8')).foodLabels;
const now = (await (await fetch(base + '/assets/data.json')).json()).foodLabels;   // the catalogue of the build under test

// 0 ── the migration function itself, taken from the shipped validator chunk ──
{
  const chunk = await (await fetch(base + '/assets/chunks/chunk-2SEECAFP.js')).text();
  const src = (chunk.match(/const DT_RETIRED_FOODS=[\s\S]*?(?=function A\(e,r\)\{)/) || [])[0];
  if (!src) check('the shipped validator carries the migration', false, 'dtRetiredFoods not found in chunk-2SEECAFP.js');
  else {
    const migrate = new Function(src + ';return dtRetiredFoods;')();
    const plain = {pantry: ['tomato', 'onion'], plans: {0: [['a', 'a', 'b', 'a']]}};
    check('a kitchen without retired foods is returned as the same object', migrate(plain) === plain);
    const out = migrate({
      pantry: ['redOnion', 'onion', 'tomatoCherry'],
      plans: {0: [['a', 'a', 'b', 'a']]},                                         // repeated recipe ids in a plan are data, not duplicates
      ownRecipes: [{id: 'x', steps: ['Slice the redOnion thinly.'], ingredients: [{key: 'onion', quantity: 50, unit: 'g'}, {key: 'redOnion', quantity: 30, unit: 'g'}, {key: 'tomatoCherry', quantity: 6, unit: 'piece'}, {key: 'feta', quantity: 40, unit: 'g'}]}],
      daily: {stock: {redOnion: {amount: 2}, onion: {amount: 5}, tomatoCherry: {amount: 9}}, pieceWeights: {tomatoCherry: 15}}
    });
    const ing = out.ownRecipes[0].ingredients;
    check('lists name each food once; a plan keeps its repeated recipes', JSON.stringify(out.pantry) === '["onion","tomato"]' && JSON.stringify(out.plans[0][0]) === '["a","a","b","a"]', JSON.stringify([out.pantry, out.plans[0][0]]));
    check('two ingredient lines that become one food are merged (same unit: amounts added)', JSON.stringify(ing) === JSON.stringify([{key: 'onion', quantity: 80, unit: 'g'}, {key: 'tomato', quantity: 6, unit: 'piece'}, {key: 'feta', quantity: 40, unit: 'g'}]), JSON.stringify(ing));
    check('a record that already exists under the current name wins; others move; written text is not touched', out.daily.stock.onion.amount === 5 && out.daily.stock.tomato.amount === 9 && !('redOnion' in out.daily.stock) && out.daily.pieceWeights.tomato === 15 && out.ownRecipes[0].steps[0] === 'Slice the redOnion thinly.', JSON.stringify(out.daily));
  }
}
// 1 ── the two retired foods, everywhere a food can be stored ──
{
  const seed = await buildSeed(seedRoot, 'populated');
  seed.pantry = [...new Set([...seed.pantry, 'onion', 'redOnion', 'tomatoCherry', 'parsley', 'pork'])];
  seed.useFirst = ['redOnion'];
  seed.daily.recent = ['redOnion', 'parsley', ...(seed.daily.recent || [])];
  seed.daily.staples = [...new Set([...(seed.daily.staples || []), 'tomatoCherry', 'tomato'])];
  const sample = Object.values(seed.daily.stock || {})[0] || {amount: 2, unit: 'piece', level: 'plenty'};
  seed.daily.stock = {...(seed.daily.stock || {}), redOnion: {...sample}, tomatoCherry: {...sample}};
  seed.recipePreferences = {...(seed.recipePreferences || {}), excluded: [...new Set([...(seed.recipePreferences?.excluded || [])])]};
  const r = await open(seed);
  const s = r.state, flat = JSON.stringify(s);
  check('a v16 kitchen with red onion and cherry tomatoes opens', !r.refused && r.errors.length === 0, r.alerts || r.errors.slice(0, 2).join(' | '));
  check('they are now onion and tomato, once each, with nothing else lost', !/"redOnion"|"tomatoCherry"/.test(flat) && ['onion', 'tomato', 'parsley', 'pork'].every(k => s.pantry?.includes(k)) && new Set(s.pantry).size === s.pantry.length && s.pantry.length === seed.pantry.length - 2 + (seed.pantry.includes('tomato') ? 0 : 1),
    `pantry ${seed.pantry.length} -> ${s.pantry?.length}; ${flat.match(/"(redOnion|tomatoCherry)"/g)?.join(',') || 'no retired key left'}`);
  check('use-first, recent, staples and stock follow', s.useFirst?.includes('onion') && s.daily?.recent?.[0] === 'onion' && s.daily?.staples?.includes('tomato') && !!s.daily?.stock?.onion && !!s.daily?.stock?.tomato, JSON.stringify({useFirst: s.useFirst, recent: s.daily?.recent?.slice(0, 3), stock: Object.keys(s.daily?.stock || {}).filter(k => /onion|tomato/i.test(k))}));
}
// 2 ── every food key of each earlier release ──
for (const dir of earlier) {
  const keys = Object.keys(labels(dir));
  const seed = await buildSeed(seedRoot, 'populated');
  seed.pantry = keys;
  const r = await open(seed, ['/pantry/', '/today/']);
  const unknown = (r.state.pantry || []).filter(k => !Object.hasOwn(now, k));
  check(`a kitchen holding all ${keys.length} foods of ${path.basename(dir)} opens (${(r.state.pantry || []).length} foods here)`, !r.refused && r.errors.length === 0 && unknown.length === 0 && (r.state.pantry || []).length >= keys.length - 2, r.alerts || unknown.join(',') || r.errors.slice(0, 2).join(' | '));
}
// 3 ── a kitchen that really is invalid is still refused, and left exactly as it was ──
{
  const seed = await buildSeed(seedRoot, 'populated');
  seed.pantry = [...seed.pantry, 'notAFoodOfAnyRelease'];
  const r = await open(seed, ['/pantry/']);
  check('an unknown food key is still refused with the protective message', r.refused, r.alerts);
  check('and the stored kitchen is not overwritten', r.stored === r.raw, `${r.raw.length} -> ${(r.stored || '').length} chars`);
}
let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n        - ' + r.detail}`); }
console.log(`\n[compat] ${results.length - failed} of ${results.length} checks passed`);
await b.close();
process.exit(failed ? 1 : 0);
