// Proves that every rule which decides "may this household be offered this food?" thinks in the WHOLE catalogue, on both sides:
//   server recipe contract (_worker.js), browser recipe contract (chunk-ME7A…), the app's own filter (chunk-O3VE…), the data file's
//   "leave out" groups and the photo-name resolver.
// These are the rules that silently stayed at 74 foods in the first catalogue release.
// usage: node rules-test.mjs <siteFolder>
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const site = path.resolve(process.argv[2]);
const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(site, 'assets/data.json'), 'utf8'));
const version = fs.readFileSync(path.join(site, 'index.html'), 'utf8').match(/assets\/site\.js\?v=([\d.]+)/)[1];
const url = rel => pathToFileURL(path.join(site, rel)).href + '?v=' + version;

// ── server ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const tmp = path.join(here, '.worker-copy-rules.mjs');
fs.copyFileSync(path.join(site, '_worker.js'), tmp);
const worker = (await import(pathToFileURL(tmp).href + '?t=' + Date.now())).default;
const HOST = 'app.test';
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, init) => String(u).includes('turnstile/v0/siteverify')
  ? new Response(JSON.stringify({success: true, hostname: HOST, action: JSON.parse(init.body).response === 'recipe' ? 'recipe_ingredients' : 'photo_ingredients'}), {headers: {'Content-Type': 'application/json'}})
  : realFetch(u, init);
const chat = o => ({choices: [{message: {content: JSON.stringify(o)}, finish_reason: 'stop'}]});
const calls = [];
const env = {PHOTO_RECOGNITION_ENABLED: 'true', TURNSTILE_SITE_KEY: 'k', TURNSTILE_SECRET_KEY: 's', CF_RECIPE_TIMEOUT_MS: '1000', CF_RECIPE_DEADLINE_MS: '8000',
  AI: {run: async (model) => { calls.push(model); return chat({status: 'no_fit', style: 'salad', reason: 'test', totalMinutes: 0, phases: []}); }}};
let ipN = 0;
const BASE_INPUT = {items: [], servings: 2, maxMinutes: 30, equipment: 'hob', allowWater: true, slot: 'dinner', allergens: [], excluded: [], patterns: [], strictLabels: true};
const item = k => k === 'egg' ? {key: k, quantity: 2, unit: 'piece'} : {key: k, quantity: 100, unit: 'g'};
const quiet = console.log; console.log = (...a) => { if (!String(a[0]).startsWith('{"evt"')) quiet(...a); };   // the worker logs each recipe attempt
async function serverSays(items, extra = {}) {
  calls.length = 0;
  const input = {...BASE_INPUT, ...extra, items: items.map(item)};
  const res = await worker.fetch(new Request(`https://${HOST}/api/recipes/generate`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: `https://${HOST}`, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '7.7.' + (++ipN % 250) + '.' + (ipN % 199)}, body: JSON.stringify({input, token: 'recipe', consent: true, amountsConfirmed: true})}), env);
  const body = await res.json().catch(() => ({}));
  return {status: res.status, refused: res.status === 400 && calls.length === 0, message: body?.error?.message || body?.error?.detail || JSON.stringify(body).slice(0, 200)};
}

// ── browser modules, imported straight from the package ────────────────────────────────────────────────────────────────────────
const engine = await import(url('assets/chunks/chunk-ME7AO2VB.js'));
const core = await import(url('assets/chunks/chunk-O3VEKXW7.js'));
const identity = await import(url('assets/chunks/photo-ingredient-identity-' + (fs.existsSync(path.join(site, 'assets/chunks/photo-ingredient-identity-15.19.0.js')) ? '15.19.0' : version) + '.js'));
const validate = engine.b;                 // recipe contract: validateRecipeInput
const ALLERGEN = core.o;                   // allergen → foods
const allowed = core.z;                    // (recipe, state, opts) → may this household be offered it?
const prefs = core.R;                      // recipe preferences validator (widens saved groups)
const stateless = core.S;                  // (recipe, {diet, excluded}) → allowed without a saved kitchen
const browserSays = (items, extra = {}) => { try { validate({...BASE_INPUT, ...extra, items: items.map(item)}); return {refused: false, message: ''}; } catch (e) { return {refused: true, message: e.message}; } };
const stub = keys => ({id: 't', title: 't', slot: 'dinner', time: 10, steps: ['x'], ingredients: keys.map(k => ({key: k, amount: 1, unit: 'g'}))});
const kitchen = (o = {}) => ({recipePreferences: {diet: 'all', maxTime: 0, excluded: [], ...(o.prefs || {})}, daily: {allergens: [], strictLabels: true, stock: {}, substitutions: {}, flow: null, ...(o.daily || {})}, personalization: {}, pantry: []});

let pass = 0, fail = 0;
const T = async (name, fn) => { const bad = []; const t = (c, m = '') => { if (!c) bad.push(m); }; try { await fn(t); } catch (e) { bad.push('EXCEPTION ' + String(e.stack || e).split('\n').slice(0, 2).join(' | ')); } if (bad.length) { fail++; console.log('FAIL ' + name + '\n      - ' + bad.slice(0, 8).join('\n      - ')); } else { pass++; console.log('PASS ' + name); } };

await T('catalogue: the data file names every food, and every shipped recipe ingredient is still a known food', async t => {
  const keys = Object.keys(data.foodLabels);
  t(keys.length >= 269, 'foods: ' + keys.length);
  const used = new Set(data.recipes.flatMap(r => r.ingredients.map(i => i.key)));
  t([...used].every(k => data.foodLabels[k]), 'unknown recipe ingredient: ' + [...used].filter(k => !data.foodLabels[k]));
  t(Object.keys(data.foodAliases || {}).length === keys.length, 'alias table covers every food');
  const groupFoods = Object.values(data.foodGroups).flat();
  t(new Set(groupFoods).size === keys.length && groupFoods.length === keys.length, 'every food is in exactly one pantry group: ' + groupFoods.length + ' / ' + keys.length);
});

await T('allergens the live build relied on are all still linked (the first catalogue release had dropped five)', async t => {
  for (const [a, foods] of Object.entries({fish: ['fish', 'salmon', 'tunaCanned'], eggs: ['egg', 'trahana'], gluten: ['bread', 'pasta', 'pita', 'paximadi', 'trahana', 'couscous', 'tortilla', 'oats'], celery: ['celery'], milk: ['milk', 'yogurt', 'feta', 'hardcheese', 'mozzarella', 'trahana'], crustaceans: ['shrimp'], soy: ['tofu'], peanuts: ['peanutButter'], nuts: ['walnuts', 'almonds'], sesame: ['tahini']}))
    for (const k of foods) {
      t(ALLERGEN[a].includes(k), `app filter: ${k} is not linked to ${a}`);
      t(!allowed(stub([k, 'tomato']), kitchen({daily: {allergens: [a], strictLabels: false}}), {time: false}), `app filter offers ${k} with a saved ${a} allergen`);
      // trahana is refused by the quick builder for its preparation before the allergen is even looked at: any refusal without an AI call counts
      const s = await serverSays([k], {allergens: [a], strictLabels: false});
      t(s.refused && (k === 'trahana' || /hard exclusions/.test(s.message)), `server accepts ${k} with a saved ${a} allergen: ${s.status} ${s.message}`);
      const b = browserSays([k], {allergens: [a], strictLabels: false});
      t(b.refused && (k === 'trahana' || /hard exclusions/.test(b.message)), `browser contract accepts ${k} with ${a}: ${b.message}`);
    }
});

await T('new foods carry their allergen in all three places', async t => {
  for (const [a, k] of [['milk', 'butter'], ['milk', 'ghee'], ['milk', 'ricotta'], ['nuts', 'cashews'], ['nuts', 'pesto'], ['fish', 'anchovies'], ['fish', 'fishSauce'], ['crustaceans', 'crab'], ['molluscs', 'mussels'], ['soy', 'soySauce'], ['gluten', 'soySauce'], ['gluten', 'barley'], ['sesame', 'sesameOil'], ['eggs', 'mayonnaise'], ['mustard', 'mustard'], ['peanuts', 'peanuts'], ['celery', 'celeriac'], ['sulphites', 'driedApricots']]) {
    t(!allowed(stub([k]), kitchen({daily: {allergens: [a], strictLabels: false}}), {time: false}), `app filter offers ${k} with ${a}`);
    const s = await serverSays([k], {allergens: [a], strictLabels: false});
    t(s.refused && /hard exclusions/.test(s.message), `server accepts ${k} with ${a}: ${s.status} ${s.message}`);
    const b = browserSays([k], {allergens: [a], strictLabels: false});
    t(b.refused && /hard exclusions/.test(b.message), `browser contract accepts ${k} with ${a}: ${b.message}`);
  }
});

await T('food patterns mean what they say for every food, not only chicken and beef', async t => {
  const cases = {
    pescatarian: {no: ['chicken', 'beef', 'steak', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'sausage', 'ham', 'veal', 'liver', 'meat'], yes: ['salmon', 'shrimp', 'sardines', 'egg', 'feta', 'tofu']},
    vegetarian: {no: ['chicken', 'pork', 'ham', 'bacon', 'fish', 'salmon', 'tunaCanned', 'sardines', 'anchovies', 'shrimp', 'mussels', 'crab', 'fishSauce', 'oysterSauce'], yes: ['egg', 'feta', 'butter', 'honey', 'tofu', 'lentilsCooked']},
    plant: {no: ['chicken', 'ham', 'salmon', 'anchovies', 'egg', 'milk', 'yogurt', 'feta', 'butter', 'ghee', 'ricotta', 'mayonnaise', 'honey', 'pesto'], yes: ['tofu', 'tempeh', 'lentilsCooked', 'oliveOil', 'tahini', 'cashews', 'mapleSyrup']}
  };
  for (const [diet, {no, yes}] of Object.entries(cases)) {
    for (const k of no) {
      t(!allowed(stub([k]), kitchen({prefs: {diet}}), {time: false}), `app filter offers ${k} to a ${diet} kitchen`);
      t(!stateless(stub([k]), {diet}), `stateless filter offers ${k} to ${diet}`);
      const s = await serverSays([k], {patterns: [diet]});
      t(s.refused && /conflicts with the/.test(s.message), `server accepts ${k} for ${diet}: ${s.status} ${s.message}`);
      const b = browserSays([k], {patterns: [diet]});
      t(b.refused && /conflicts with the/.test(b.message), `browser contract accepts ${k} for ${diet}: ${b.message}`);
    }
    for (const k of yes) {
      t(allowed(stub([k]), kitchen({prefs: {diet}}), {time: false}), `app filter refuses ${k} for a ${diet} kitchen`);
      const b = browserSays([k], {patterns: [diet]});
      t(!/conflicts with the/.test(b.message), `browser contract refuses ${k} for ${diet}: ${b.message}`);
    }
  }
});

await T('strict label checks: the 17 shipped foods behave exactly as in production; a jar of cumin is not held back, a jar of pesto is', async t => {
  const strict = {allergens: ['lupin'], strictLabels: true};      // an allergen no food carries: only the label rule can refuse
  for (const k of ['oliveOil', 'honey', 'milk', 'yogurt', 'feta', 'oats', 'rice', 'quinoa', 'cumin', 'salt', 'vinegar', 'butter', 'sugar', 'paprika']) {
    const b = browserSays([k], strict);
    t(!/Strict label/.test(b.message), `browser holds back ${k}: ${b.message}`);
    const s = await serverSays([k], strict);
    t(!/Strict label/.test(s.message), `server holds back ${k}: ${s.message}`);
  }
  for (const k of ['bread', 'pasta', 'hardcheese', 'tofu', 'olives', 'chickpeasCooked', 'ketchup', 'sausage', 'stock', 'curryPowder', 'kidneyBeans', 'naan']) {
    const b = browserSays([k], strict);
    t(/Strict label/.test(b.message), `browser does not hold back ${k}: ${b.message}`);
    const s = await serverSays([k], strict);
    t(s.refused && /Strict label/.test(s.message), `server does not hold back ${k}: ${s.status} ${s.message}`);
    t(!allowed(stub([k]), kitchen({daily: {allergens: ['lupin'], strictLabels: true}}), {time: false}), `app filter offers ${k} under strict labels`);
  }
});

await T('a kitchen saved by an earlier release keeps its promise: a ticked "leave out" group covers the group as it is now', async t => {
  const legacyDairy = ['yogurt', 'milk', 'feta', 'hardcheese', 'trahana', 'mozzarella'];
  const widened = prefs({diet: 'all', maxTime: 0, excluded: legacyDairy}, data.foodLabels).excluded;
  for (const k of ['butter', 'ghee', 'ricotta', 'halloumi', 'kefir', 'cheese']) t(widened.includes(k), 'dairy group not widened to ' + k);
  t(!widened.includes('egg') && !widened.includes('salmon'), 'widening leaked into another group');
  const partial = prefs({diet: 'all', maxTime: 0, excluded: ['milk', 'feta']}, data.foodLabels).excluded;
  t(partial.length === 2, 'two individually excluded foods must stay two: ' + partial.length);
  const all = prefs({diet: 'all', maxTime: 0, excluded: Object.values(data.allergenIngredients).flat().filter((k, i, a) => a.indexOf(k) === i)}, data.foodLabels).excluded;
  t(all.length > 70, 'all nine groups can be saved together (' + all.length + ' foods); the old limit was 100 here and 70 in the contract');
  const s = await serverSays(['tomato', 'cucumber'], {excluded: all, equipment: 'no-cook'});
  t(!/Choose each known food once/.test(s.message) && s.status !== 400, 'server refuses a kitchen with every group ticked: ' + s.status + ' ' + s.message);
  const b = browserSays(['tomato', 'cucumber'], {excluded: all, equipment: 'no-cook'});
  t(!b.refused, 'browser contract refuses a kitchen with every group ticked: ' + b.message);
  for (const [g, foods] of Object.entries(data.allergenIngredients)) t(foods.length > 0 && foods.every(k => data.foodLabels[k]), 'group ' + g + ' names an unknown food');
});

await T('a written name becomes one food, in English and Greek, and never by guessing', async t => {
  const resolve = identity.createPhotoIngredientResolver(data.foodLabels, data.foodAliases);
  const R = (name, form = 'raw', extra = {}) => resolve({name, form, ...extra});
  for (const [name, key] of [['pork chops', 'pork'], ['pork', 'pork'], ['butter', 'butter'], ['red onion', 'onion'], ['cherry tomatoes', 'tomato'], ['grape tomatoes', 'tomato'], ['spring onions', 'scallion'], ['ginger', 'ginger'], ['cashews', 'cashews'], ['bok choy', 'bokChoy'], ['ντομάτα', 'tomato'], ['αυγά', 'egg'], ['κοτόπουλο', 'chicken'], ['Tomatoes', 'tomato'], ['onions', 'onion']])
    t(R(name) === key, `"${name}" → ${R(name)} (expected ${key})`);
  t(R('sprouts') === null, '"sprouts" is two foods and must be asked: ' + R('sprouts'));
  t(R('flatbread', 'packaged') === null, '"flatbread" is two foods and must be asked: ' + R('flatbread', 'packaged'));
  t(R('kidney beans', 'dried') === null, 'DRIED kidney beans must never become the cooked identity: ' + R('kidney beans', 'dried'));
  t(R('kidney beans', 'canned') === 'kidneyBeans', 'canned kidney beans: ' + R('kidney beans', 'canned'));
  t(R('dried chickpeas', 'cooked') === null, 'cooked form contradicts a dried identity');
  t(R('tomato', 'raw', {catalog: 'cucumber'}) === null, 'a model key that contradicts the name is sent to the person');
  t(R('mystery root') === null, 'an unknown name stays unknown');
});

fs.rmSync(tmp, {force: true});
console.log(`\n${pass}/${pass + fail} rule groups passed`);
process.exit(fail ? 1 : 0);
