// What a created recipe SAYS. The step text is written by fixed templates that exist twice: in the worker and in the browser engine (which
// re-validates the server's plan and writes the text the cook reads). This test compiles thousands of plans on both sides and checks that
//   1. both sides write exactly the same recipe,
//   2. the wording fits the dish (no raw-meat warning without raw meat, no timer on a salad, doneness that matches the food),
//   3. nothing that compiled on the baseline stops compiling,
//   4. the two food-group blocks of a recipe ("to make it a fuller meal" and "what your ingredients cover") can never disagree.
// usage: node recipe-text-test.mjs <siteFolder> [baselineFolder]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const site = path.resolve(process.argv[2]), baseSite = process.argv[3] ? path.resolve(process.argv[3]) : null;
const here = path.dirname(fileURLToPath(import.meta.url));
const versionOf = dir => fs.readFileSync(path.join(dir, 'index.html'), 'utf8').match(/assets\/site\.js\?v=([\d.]+)/)[1];
const mod = (dir, rel) => import(pathToFileURL(path.join(dir, rel)).href + '?v=' + versionOf(dir));
const loadWorker = async (dir, tag) => { const tmp = path.join(here, `.worker-copy-text-${tag}.mjs`); fs.copyFileSync(path.join(dir, '_worker.js'), tmp); return import(pathToFileURL(tmp).href + '?t=' + Date.now()); };

const W = await loadWorker(site, 'new');
const engine = await mod(site, 'assets/chunks/chunk-ME7AO2VB.js');
const quality = await mod(site, 'assets/chunks/recipe-quality-15.19.0.js');
const FOODS = engine.a, compileBrowser = engine.e, balance = engine.f, notes = engine.g;
const keys = Object.keys(FOODS), group = k => FOODS[k].group;
const baseEngine = baseSite ? await mod(baseSite, 'assets/chunks/chunk-ME7AO2VB.js') : null;
const baseW = baseSite ? await loadWorker(baseSite, 'base') : null;

let seed = 20261126; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)];
const EQUIP = ['hob', 'oven', 'no-cook'], TIMES = [10, 15, 20, 30, 45, 60], SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
const request = (foods, s = {}, cat = FOODS) => ({items: foods.map(k => ({key: k, quantity: cat[k].suggested * 2, unit: cat[k].unit})), servings: 2, maxMinutes: 60, equipment: 'hob', allowWater: true, slot: 'dinner', allergens: [], excluded: [], patterns: [], strictLabels: false, ...s});

/** Plans with the worker's planner, then compiles on both sides. Returns null when the basket is blocked or unsupported. */
function create(foods, s, w = W, eng = engine, cat = FOODS) {
  const req = request(foods, s, cat);
  let input; try { input = w.validateRecipeInput(req); } catch { return null; }
  const r = w.planRecipe(input);
  if (r.blockers.length || r.plan.status !== 'recipe') return null;
  let server = null, browser = null, serverError = '', browserError = '';
  try { server = w.compileAIRecipe(r.plan, req); } catch (e) { serverError = e.message; }
  try { browser = eng.e(r.plan, req); } catch (e) { browserError = e.message; }
  return {foods, req, plan: r.plan, server, browser, serverError, browserError};
}

let pass = 0, fail = 0;
const T = (name, fn) => { const bad = []; const t = (c, m = '') => { if (!c) bad.push(m); }; let extra = ''; try { extra = fn(t) || ''; } catch (e) { bad.push('EXCEPTION ' + String(e.stack || e).split('\n').slice(0, 2).join(' | ')); } if (bad.length) { fail++; console.log('FAIL ' + name + '\n      - ' + [...new Set(bad)].slice(0, 10).join('\n      - ')); } else { pass++; console.log('PASS ' + name + (extra ? '  (' + extra + ')' : '')); } };

// ── the sweep ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const made = [];
for (const k of keys) for (const equipment of EQUIP) { const c = create([k], {equipment, allowWater: equipment === 'hob'}); if (c) made.push(c); }
for (let i = 0; i < 6000; i++) {
  const n = 2 + Math.floor(rnd() * 8), foods = [...new Set(Array.from({length: n}, () => pick(keys)))];
  const c = create(foods, {equipment: pick(EQUIP), allowWater: rnd() < 0.7, maxMinutes: pick(TIMES), slot: pick(SLOTS)});
  if (c) made.push(c);
}

T('server and browser write exactly the same recipe', t => {
  let both = 0, refusedBoth = 0;
  for (const c of made) {
    if (!c.server && !c.browser) { refusedBoth++; t(/too long|fewer foods/i.test(c.serverError), `${c.foods.join('+')}: the planner offered a plan its own validator refuses: "${c.serverError}"`); t(c.serverError === c.browserError, `${c.foods.join('+')}: refused differently: "${c.serverError}" / "${c.browserError}"`); continue; }
    t(!!c.server && !!c.browser, `${c.foods.join('+')}: one side refused: server "${c.serverError}" browser "${c.browserError}"`);
    if (!c.server || !c.browser) continue;
    both++;
    t(JSON.stringify(c.server.steps) === JSON.stringify(c.browser.steps), `${c.foods.join('+')}: step text differs\n        S: ${c.server.steps.find((s, i) => s !== c.browser.steps[i])}\n        B: ${c.browser.steps.find((s, i) => s !== c.server.steps[i])}`);
    t(c.server.title === c.browser.title && c.server.time === c.browser.time, `${c.foods.join('+')}: title or time differs`);
  }
  t(both > 2500, 'too few recipes compiled to mean anything: ' + both);
  return `${both} recipes compared, ${refusedBoth} refused by both for the same reason`;
});

const ok = made.filter(c => c.browser);
T('wording fits the dish', t => {
  for (const c of ok) {
    const text = c.browser.steps.join(' '), hasProtein = c.foods.some(k => group(k) === 'protein'), hasEgg = c.foods.includes('egg'), id = c.foods.join('+');
    t(/Do not wash raw meat/.test(text) === hasProtein, `${id}: raw-meat sentence ${hasProtein ? 'missing' : 'present without raw meat, poultry or fish'}`);
    t(/Keep raw egg/.test(text) === (hasEgg && !hasProtein), `${id}: raw-egg sentence wrong`);
    for (const s of c.browser.steps) {
      t(s.length <= 600, `${id}: a step is ${s.length} characters`);
      t(!/^(Gently toss|Mash) .*relying on the timer/.test(s), `${id}: a timer on a step that is not cooked: ${s.slice(-70)}`);
      t(!/confirm at least (opaque|.*shells)/.test(s), `${id}: thermometer asked to read an appearance: ${s.slice(0, 200)}`);
      t(!/  |\s$|^\s/.test(s), `${id}: stray whitespace in a step: "${s.slice(0, 60)}…${s.slice(-30)}"`);
      t(/[.!]$/.test(s), `${id}: a step does not end with a full stop: "…${s.slice(-40)}"`);
    }
  }
  return ok.length + ' recipes read';
});

const stepFor = (foods, s) => { const c = create(foods, s); if (!c || !c.browser) throw Error('could not create ' + foods.join('+') + ': ' + (c ? c.browserError : 'blocked')); return c.browser; };
T('doneness is the right test for the food (FoodSafety.gov safe minimum temperatures)', t => {
  const cooks = k => stepFor([k], {}).steps.find(s => s.startsWith('Cook '));
  for (const [k, re] of [['chicken', /74°C \/ 165°F/], ['turkey', /74°C \/ 165°F/], ['duck', /74°C \/ 165°F/], ['sausage', /74°C \/ 165°F/], ['liver', /74°C \/ 165°F/], ['beef', /71°C \/ 160°F/], ['steak', /71°C \/ 160°F/], ['pork', /71°C \/ 160°F/], ['lamb', /71°C \/ 160°F/], ['veal', /71°C \/ 160°F/], ['meat', /71°C \/ 160°F/],
    ['fish', /63°C \/ 145°F/], ['salmon', /63°C \/ 145°F/], ['trout', /63°C \/ 145°F/], ['mackerel', /63°C \/ 145°F/], ['tunaSteak', /63°C \/ 145°F/], ['halibut', /63°C \/ 145°F/],
    ['shrimp', /pearly-white and opaque/], ['squid', /pearly-white and opaque/], ['scallops', /pearly-white and opaque/], ['crab', /pearly-white and opaque/], ['mussels', /shells open; throw away any that stay closed/], ['clams', /shells open/], ['bacon', /crisp throughout/]]) {
    const s = cooks(k);
    t(!!s && re.test(s), `${k}: ${s}`);
    t(!!s && (/thermometer/.test(s) === /°C/.test(s) || k === 'bacon'), `${k}: thermometer and temperature must come together: ${s}`);
  }
  const everyProtein = keys.filter(k => group(k) === 'protein');
  for (const k of everyProtein) { const s = cooks(k); t(!!s && /(°C \/ \d+°F|opaque|shells open|crisp)/.test(s), `${k} has no doneness test: ${s}`); }
  return everyProtein.length + ' proteins, each with a doneness test';
});

T('a salad reads like a salad', t => {
  const r = stepFor(['tomato', 'cucumber', 'onion', 'olives', 'feta', 'parsley'], {equipment: 'hob', maxMinutes: 10, slot: 'lunch'});
  const text = r.steps.join(' ');
  t(r.steps.length === 2, 'expected prepare + toss, got ' + r.steps.length);
  t(!/raw meat|raw protein|timer|thermometer/.test(text), 'cooking boilerplate in a salad: ' + text);
  t(/^Wash hands and measure/.test(r.steps[0]) && /follow product preparation directions\.$/.test(r.steps[0]), 'prepare step: ' + r.steps[0]);
  t(/^Gently toss tomato, cucumber, onion, olives, feta and parsley in a clean bowl\./.test(r.steps[1]), 'toss step: ' + r.steps[1]);
  const herbOnly = stepFor(['parsley', 'feta'], {equipment: 'no-cook', allowWater: false});
  t(!/firm produce/.test(herbOnly.steps[0]), 'a bunch of parsley is not firm produce: ' + herbOnly.steps[0]);
  const berries = stepFor(['raspberries', 'yogurt'], {equipment: 'no-cook', allowWater: false, slot: 'breakfast'});
  t(!/firm produce/.test(berries.steps[0]), 'berries are not cut into even pieces: ' + berries.steps[0]);
  const firm = stepFor(['cucumber', 'feta'], {equipment: 'no-cook', allowWater: false});
  t(/Cut the remaining firm produce/.test(firm.steps[0]), 'cucumber is still cut: ' + firm.steps[0]);
  const how = notes(request(['tomato', 'cucumber', 'feta']), r.plan);
  t(how.some(l => /No cooking needed/.test(l)), 'the "how this dish is made" notes say no cooking: ' + how.join(' | '));
  t(notes(request(['bulgur', 'tomato']), stepFor(['bulgur', 'tomato'], {}).plan).some(l => /grain or bread/.test(l)), 'a new grain is recognised as a grain in the notes');
  return r.steps.map((s, i) => `\n        ${i + 1}. ${s}`).join('');
});

if (baseEngine) T('nothing that could be created on the live build stops being creatable', t => {
  const baseKeys = Object.keys(baseEngine.a);
  let n = 0, same = 0;
  for (let i = 0; i < 4000; i++) {
    const count = 1 + Math.floor(rnd() * 8), foods = [...new Set(Array.from({length: count}, () => pick(baseKeys)))];
    const s = {equipment: pick(EQUIP), allowWater: rnd() < 0.7, maxMinutes: pick(TIMES), slot: pick(SLOTS)};
    const before = create(foods, s, baseW, baseEngine, baseEngine.a);
    if (!before || !before.browser) continue;
    n++;
    const after = create(foods, s);
    t(!!after && !!after.browser, `${foods.join('+')} (${s.equipment}): created on the live build, not now: ${after ? after.browserError : 'blocked'}`);
    if (!after || !after.browser) continue;
    t(after.browser.steps.length === before.browser.steps.length && after.browser.title === before.browser.title && after.browser.time === before.browser.time, `${foods.join('+')}: title, time or number of steps changed`);
    t(after.browser.steps.every((x, j) => x.length <= before.browser.steps[j].length + 80), `${foods.join('+')}: a step grew by more than a sentence`);
    if (JSON.stringify(after.browser.steps) === JSON.stringify(before.browser.steps)) same++;
  }
  t(n > 900, 'too few baseline recipes: ' + n);
  return `${n} live-build recipes re-created; ${same} word for word, ${n - same} with the corrected wording`;
});

T('the two food-group blocks of a recipe cannot disagree', t => {
  let n = 0;
  const settings = slot => ({servings: 2, maxMinutes: 60, equipment: 'hob', allowWater: true, slot, allergens: [], excluded: [], patterns: [], strictLabels: false});
  for (let i = 0; i < 3000; i++) {
    const count = 1 + Math.floor(rnd() * 7), foods = [...new Set(Array.from({length: count}, () => pick(keys)))], slot = pick(SLOTS);
    let b; try { b = balance(foods, {settings: settings(slot), pantry: []}); } catch { continue; }
    n++;
    const q = quality.describeMealPattern(foods, {slot});
    const id = foods.join('+') + ' @' + slot;
    t(q.groups.protein === b.covered.protein.length > 0, `${id}: protein ${q.groups.protein} vs ${b.covered.protein}`);
    t(q.groups.grains === b.covered.starch.length > 0, `${id}: grains ${q.groups.grains} vs ${b.covered.starch}`);
    for (const gap of b.gaps) {
      if (gap.options.includes('protein') && gap.options.length === 1) t(!q.groups.protein, `${id}: "no protein yet" beside "protein foods: listed"`);
      if (gap.options.includes('starch') && gap.options.length === 1) t(!q.groups.grains, `${id}: "no grain or starch yet" beside "grains: listed"`);
      if (gap.options.includes('vegetables')) t(!q.groups.vegetables, `${id}: "no ${gap.label} yet" beside "vegetables: listed"`);
    }
  }
  const feta = quality.describeMealPattern(['tomato', 'cucumber', 'feta'], {slot: 'lunch'});
  t(feta.groups.vegetables && !feta.groups.protein && !feta.groups.grains, '32 g of feta is not the meal\'s protein: ' + JSON.stringify(feta.groups));
  const pork = quality.describeMealPattern(['pork', 'bokChoy', 'bulgur'], {slot: 'dinner'});
  t(pork.groups.vegetables && pork.groups.protein && pork.groups.grains, 'new foods are classified: ' + JSON.stringify(pork.groups));
  const fruit = quality.describeMealPattern(['banana', 'oats'], {slot: 'breakfast'});
  t(fruit.groups.vegetables && fruit.light, 'fruit counts at breakfast: ' + JSON.stringify(fruit));
  t(!quality.describeMealPattern(['banana', 'rice'], {slot: 'dinner'}).groups.vegetables, 'fruit is not a vegetable at dinner');
  return n + ' baskets compared';
});

console.log(`\n${pass}/${pass + fail} recipe-text groups passed`);
for (const f of fs.readdirSync(here)) if (/^\.worker-copy-text-/.test(f)) fs.rmSync(path.join(here, f));
process.exit(fail ? 1 : 0);
