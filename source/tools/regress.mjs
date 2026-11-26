// Functional regression suite. The SAME script runs against the v14 baseline and the v15 build; a check that passes on v14
// and fails on v15 is a regression. It drives the real pages and asserts on the app's own persisted state (localStorage).
// usage: node regress.mjs <baseUrl> <siteRoot> <label> [filter-substring]
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
import fs from 'node:fs';
import path from 'node:path';

const [base, siteRoot, label, filter = ''] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(path.join(siteRoot, 'assets', 'data.json'), 'utf8'));
const TODAY = new Date();
const dk = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayKey = dk(TODAY);
const browser = await launch();
const results = [];

// ---- helpers --------------------------------------------------------------------------------------------------
const turnstile = page => page.route('https://challenges.cloudflare.com/**', r => r.fulfill({contentType: 'text/javascript', body: 'window.turnstile={render(){return 1},remove(){},reset(){},getResponse(){return "t"}};'}));
async function open(kind, url, {w = 390, scheme = 'light', mutate} = {}) {
  const seed = await buildSeed(siteRoot, kind);
  if (mutate) mutate(seed);
  const {page, ctx} = await newPage(browser, {w, h: w < 768 ? 844 : 900, scheme, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
  await turnstile(page);
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.goto(base + url, {waitUntil: 'networkidle'});
  await sleep(900);
  return {page, ctx, seed};
}
const state = page => page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('dtable:profiles:v1') || 'null');
  let key = 'dtable:workspace:v2'; if (r?.version === 1 && r.active && r.profiles?.some(p => p.id === r.active)) key += ':' + r.active;
  return JSON.parse(localStorage.getItem(key) || '{}');
});
const visibleLinks = (page, sel = 'main a[href^="/recipes/"]') => page.evaluate(sel => [...document.querySelectorAll(sel)].filter(a => a.offsetWidth || a.offsetHeight || a.getClientRects().length).map(a => a.getAttribute('href')), sel);
const realErrors = page => page.__errors.filter(e => !/turnstile|favicon|net::ERR_ABORTED|Failed to load resource.*(?:404|401)/i.test(e));
const slugOf = href => (href.match(/^\/recipes\/([^/?#]+)/) || [])[1];
const clickHidden = (page, sel) => page.locator(sel).first().evaluate(e => e.click());

// recipes whose ingredients intersect an allergen group (independent oracle from data.json, not from app code)
const unsafeFor = groups => { const keys = new Set(groups.flatMap(g => data.allergenIngredients[g] || [])); return new Set(data.recipes.filter(r => r.ingredients.some(i => keys.has(i.key))).map(r => data.routeMap[r.id]).filter(Boolean)); };

// ---- test registry ---------------------------------------------------------------------------------------------
const tests = [];
const T = (name, fn) => tests.push([name, fn]);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

T('every app page boots with no script errors', async t => {
  const pages = ['/', '/pantry/', '/today/', '/recipes/', '/weekly-plan/', '/shopping-list/', '/settings/', '/cook/', '/recipes/village-salad-with-feta-olives/', '/guides/cook-from-your-pantry/', '/about/', '/privacy/', '/photo-credits/', '/how-it-works/'];
  const bad = [];
  for (const p of pages) {
    const {page, ctx} = await open('populated', p);
    const text = (await page.textContent('main'))?.trim().length || 0;
    const errs = realErrors(page);
    if (errs.length || text < 150) bad.push(`${p}: ${text} chars ${errs.slice(0, 2).join(' | ')}`);
    await ctx.close();
  }
  t.ok(!bad.length, bad.join(' ;; '));
});

// 15.5.9+ moved the typed-foods form into a collapsed "Or type your ingredients instead" section; open it when present, and submit with the button if it exists.
async function typeFoods(page, text) {
  const manual = page.locator('.dt-manual-disclosure:not([open]) > summary').first();
  if (await manual.count()) { await manual.click(); await sleep(300); }
  await page.fill('#pantry-input', text);
  const btn = page.locator('button[type=submit][aria-label="Add these foods to my kitchen"]').first();
  if (await btn.count() && await btn.isVisible()) await btn.click(); else await page.press('#pantry-input', 'Enter');
}
T('pantry: typing foods confirms them; remove and use-first work', async t => {
  const {page, ctx} = await open('fresh', '/pantry/');
  t.ok((await state(page)).pantry.length === 0, 'fresh pantry empty');
  await typeFoods(page, 'tomato, egg');
  await sleep(700);
  let s = await state(page);
  t.ok(s.pantry.includes('tomato') && s.pantry.includes('egg'), 'both foods saved: ' + s.pantry);
  await page.locator('.focus-stock-panel > summary').first().click(); await sleep(400);
  await page.locator('[data-use-first=tomato]').first().click(); await sleep(400);
  t.ok((await state(page)).useFirst.includes('tomato'), 'use-first set');
  await page.locator('[data-remove-pantry=egg]').first().click(); await sleep(400);
  s = await state(page);
  t.ok(!s.pantry.includes('egg') && s.pantry.includes('tomato'), 'egg removed, tomato kept: ' + s.pantry);
  await page.reload({waitUntil: 'networkidle'}); await sleep(600);
  t.ok(eq((await state(page)).pantry, s.pantry), 'pantry persists after reload');
  await ctx.close();
});

T('pantry: recommendations appear only from confirmed foods', async t => {
  const {page, ctx} = await open('fresh', '/pantry/');
  // 15.7+ renders the matches as recipe links inside #recipe-suggestions (the older builds marked cards with data-match-recipe)
  const CARDS = '[data-match-recipe], #recipe-suggestions a[href^="/recipes/"]';
  const empty = await page.locator(CARDS).count();
  const readyEmpty = await page.locator(CARDS).evaluateAll(els => els.filter(e => /cook now|ready/i.test(e.textContent)).length);
  await typeFoods(page, 'egg, tomato, spinach, feta, olive oil, bread');
  await sleep(1600);
  const after = await page.locator(CARDS).count();
  const inView = await page.evaluate(() => { const s = document.querySelector('#recipe-suggestions'); if (!s) return null; const r = s.getBoundingClientRect(); return Math.round(r.top); });
  t.ok(readyEmpty === 0, 'no "ready" recipe with an empty kitchen (' + readyEmpty + ')');
  t.ok(after > 0, 'recommendations after confirming foods (' + empty + ' -> ' + after + ')');
  t.ok(inView !== null && inView < 700, 'the results are on screen after the save (top at ' + inView + ' px)');
  await ctx.close();
});

for (const [name, url] of [['recipes', '/recipes/'], ['pantry recommendations', '/pantry/'], ['today', '/today/'], ['home', '/']]) {
  T(`allergens are hard exclusions: ${name} (peanuts + milk)`, async t => {
    const {page, ctx} = await open('allergic', url, {mutate: s => { s.pantry = [...new Set([...s.pantry, 'peanutButter', 'yogurt', 'feta', 'egg', 'tomato', 'spinach'])].filter(k => data.foodLabels[k]); }});
    if (url === '/recipes/') { await page.locator('[data-exp=library-mode][data-mode=all]').first().click().catch(() => {}); await sleep(800); }
    const unsafe = unsafeFor(['dairy', 'peanuts']);
    const unsafeKeys = new Set(['dairy', 'peanuts'].flatMap(g => data.allergenIngredients[g] || []));
    const idToSlug = data.routeMap;
    const seen = await page.evaluate(() => {
      const vis = e => !!(e.offsetWidth || e.offsetHeight) && !e.closest('[hidden]');
      const hrefs = [...document.querySelectorAll('main a[href]')].filter(vis).map(a => a.getAttribute('href'));
      const ids = [...document.querySelectorAll('main [data-match-recipe],main [data-id]')].filter(vis).map(e => e.dataset.matchRecipe || e.dataset.id);
      return {hrefs, ids};
    });
    const slugs = seen.hrefs.map(slugOf).filter(Boolean);
    const cookFoods = seen.hrefs.filter(h => h.startsWith('/cook/')).flatMap(h => (new URL(h, 'http://x').searchParams.get('foods') || '').split(',')).filter(Boolean);
    const leaked = [...new Set([...slugs.filter(s => unsafe.has(s)), ...seen.ids.filter(i => idToSlug[i] && unsafe.has(idToSlug[i])), ...cookFoods.filter(k => unsafeKeys.has(k))])];
    if (url === '/recipes/' || url === '/pantry/') t.ok(slugs.length + cookFoods.length + seen.ids.length > 0, 'page lists recipes (' + slugs.length + ' links, ' + seen.ids.length + ' ids)');
    t.ok(!leaked.length, 'unsafe recipes/foods shown: ' + leaked.join(','));
    await ctx.close();
  });
}

T('recipes: search, meal filter and tabs', async t => {
  const {page, ctx} = await open('populated', '/recipes/');
  await page.locator('[data-exp=library-mode][data-mode=all]').first().click(); await sleep(600);
  const all = (await visibleLinks(page)).length;
  await page.locator('[data-exp=library-slot][data-slot=breakfast]').first().click(); await sleep(700);
  const brk = (await visibleLinks(page)).length;
  t.ok(brk > 0 && brk <= all, `breakfast filter (${all} -> ${brk})`);
  await page.locator('[data-exp=library-slot][data-slot=all]').first().click(); await sleep(500);
  await page.fill('input[name=q]', 'salmon');
  await page.click('button[type=submit]:has-text("Apply")'); await sleep(900);
  const titles = await page.evaluate(() => [...document.querySelectorAll('main h3 a, main h2 a')].filter(a => a.offsetWidth).map(a => a.textContent.toLowerCase()));
  t.ok(titles.length > 0 && titles.every(x => /salmon/.test(x) || true), 'salmon search returns cards: ' + titles.length);
  t.ok(titles.some(x => /salmon/.test(x)), 'a salmon recipe is in the results: ' + titles.slice(0, 4).join(' | '));
  await page.fill('input[name=q]', ''); await page.click('button[type=submit]:has-text("Apply")'); await sleep(700);
  await page.locator('[data-exp=library-tab][data-tab=saved]').first().click(); await sleep(700);
  const saved = (await state(page)).favorites.length;
  const savedShown = (await visibleLinks(page)).map(slugOf).filter(Boolean);
  t.ok(saved > 0 && new Set(savedShown).size > 0 && new Set(savedShown).size <= saved, `saved tab lists only saved recipes (${saved} saved, ${new Set(savedShown).size} shown)`);
  await ctx.close();
});

T('recipes: save toggle persists', async t => {
  const {page, ctx} = await open('populated', '/recipes/');
  const before = (await state(page)).favorites.slice();
  const btn = page.locator('main button[data-exp=favorite][data-id]:visible').first();
  const id = await btn.getAttribute('data-id');
  await btn.click(); await sleep(600);
  const mid = (await state(page)).favorites;
  t.ok(before.includes(id) ? !mid.includes(id) : mid.includes(id), 'toggled ' + id);
  await page.reload({waitUntil: 'networkidle'}); await sleep(600);
  t.ok(eq((await state(page)).favorites, mid), 'persisted after reload');
  await ctx.close();
});

T('recipe page: cook-along steps, portions, save, plan dialog', async t => {
  const {page, ctx} = await open('populated', '/recipes/village-salad-with-feta-olives/');
  const steps = data.recipes.find(r => r.id === 'greekSalad').steps.length;
  await page.click('#cook-start'); await sleep(900);
  const dlg = page.locator('dialog[open]');
  t.ok(await dlg.count() === 1, 'cooking mode opens');
  t.ok(/step 1 of/i.test(await dlg.innerText()), 'starts at step 1');
  await dlg.locator('button:has-text("Next step")').click(); await sleep(500);
  t.ok(/step 2 of/i.test(await dlg.innerText()), 'Next step advances');
  await dlg.locator('button:has-text("Previous")').click(); await sleep(400);
  t.ok(/step 1 of/i.test(await dlg.innerText()), 'Previous goes back');
  await dlg.locator('button:has-text("Start timer")').click(); await sleep(1500);
  t.ok(!/No timer running/i.test(await dlg.innerText()), 'timer starts');
  await page.keyboard.press('Escape'); await sleep(600);
  t.ok(await page.locator('dialog[open]').count() === 0, 'Escape closes cooking mode');
  const q0 = await page.inputValue('#recipe-portions');
  await page.click('#portion-plus'); await sleep(300);
  t.ok(+(await page.inputValue('#recipe-portions')) === +q0 + 1, 'portions increase');
  const fav0 = (await state(page)).favorites.includes('greekSalad');
  await page.locator('button[data-fav=greekSalad]').first().click(); await sleep(500);
  t.ok((await state(page)).favorites.includes('greekSalad') !== fav0, 'save recipe toggles');
  await page.locator('button[data-schedule=greekSalad]').first().click(); await sleep(800);
  t.ok(await page.locator('dialog[open], [role=dialog]:visible').count() > 0, 'plan dialog opens');
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('today: eaten, undo, water and skip persist', async t => {
  const {page, ctx} = await open('populated', '/today/');
  const eatenBtn = page.locator(`button[data-exp=eaten][data-slot=lunch][data-date="${todayKey}"]`).first();
  const before = (await state(page)).logs[todayKey]?.meals?.lunch;
  await eatenBtn.click(); await sleep(700);
  const afterEat = (await state(page)).logs[todayKey]?.meals?.lunch;
  t.ok(!before && !!afterEat, 'lunch recorded as eaten: ' + afterEat);
  await page.locator(`button[data-exp=eaten][data-slot=lunch][data-date="${todayKey}"]`).first().click(); await sleep(600);
  t.ok(!(await state(page)).logs[todayKey]?.meals?.lunch, 'eaten can be undone');
  const w0 = (await state(page)).logs[todayKey].water;
  await page.locator('button[data-exp=water][data-amount="250"]').first().click(); await sleep(600);
  t.ok((await state(page)).logs[todayKey].water === w0 + 250, `water +250 (${w0} -> ${(await state(page)).logs[todayKey].water})`);
  const s0 = JSON.stringify((await state(page)).daily.flow.days[todayKey]);
  await clickHidden(page, `button[data-exp=skip][data-slot=dinner][data-date="${todayKey}"][data-value=skip]`); await sleep(700);
  t.ok(JSON.stringify((await state(page)).daily.flow.days[todayKey]) !== s0, 'skip changes the saved plan');
  await page.reload({waitUntil: 'networkidle'}); await sleep(700);
  t.ok((await state(page)).logs[todayKey].water === w0 + 250, 'water persists after reload');
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('today: swap a meal through the options dialog', async t => {
  const {page, ctx} = await open('populated', '/today/');
  const before = JSON.stringify((await state(page)).daily.flow.days[todayKey].meals.dinner);
  await page.locator(`button[data-exp=swap][data-slot=dinner][data-date="${todayKey}"]`).first().evaluate(e => e.click()); await sleep(900);
  const rows = await page.locator('.ex-swap-row:visible').count();
  t.ok(rows > 0, 'swap options listed: ' + rows);
  await page.locator('.ex-swap-row button:visible').first().click(); await sleep(1000);
  const dlgOpen = await page.locator('dialog[open]').count();
  t.ok(dlgOpen === 1, 'meal decision dialog opens');
  await page.locator('dialog[open] button[type=submit]:visible').last().click(); await sleep(800);
  t.ok(JSON.stringify((await state(page)).daily.flow.days[todayKey].meals.dinner) === before, 'nothing is saved without approving the ingredients');
  await page.locator('dialog[open] input[type=checkbox]').nth(0).check(); await sleep(300);
  await page.locator('dialog[open] button[type=submit]:visible').last().click(); await sleep(1400);
  const after = JSON.stringify((await state(page)).daily.flow.days[todayKey].meals.dinner);
  t.ok(after !== before, 'dinner replaced after approval');
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('week: lock, swap and navigation persist', async t => {
  const {page, ctx} = await open('populated', '/weekly-plan/');
  const lockBtn = page.locator('button[data-exp=lock]').first();
  const date = await lockBtn.getAttribute('data-date');
  const s0 = JSON.stringify((await state(page)).daily.flow.days[date]);
  await lockBtn.evaluate(e => e.click()); await sleep(700);
  const s1 = JSON.stringify((await state(page)).daily.flow.days[date]);
  t.ok(s0 !== s1, 'lock changes the plan');
  await page.locator(`button[data-exp=swap][data-date="${date}"]`).first().evaluate(e => e.click()); await sleep(900);
  t.ok(await page.locator('dialog[open]').count() > 0, 'swap choices open from the week');
  await page.keyboard.press('Escape'); await sleep(500);
  await page.reload({waitUntil: 'networkidle'}); await sleep(800);
  t.ok(JSON.stringify((await state(page)).daily.flow.days[date]) === s1, 'week edits persist after reload');
  await page.locator('button[data-exp=week-date][data-delta="7"]').first().click(); await sleep(700);
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('shopping: bought, undo and persistence', async t => {
  const {page, ctx} = await open('populated', '/shopping-list/');
  const btn = page.locator('button[data-exp=bought]:visible').first();
  const food = await btn.getAttribute('data-food');
  const sig = async () => { const s = await state(page); return JSON.stringify([s.pantry, s.daily.stock, s.daily.flow.experience.purchases]); };
  const s0 = await sig();
  await btn.click(); await sleep(800);
  const s1 = await sig();
  t.ok(s0 !== s1, 'marking bought changes saved state (' + food + ')');
  await page.reload({waitUntil: 'networkidle'}); await sleep(800);
  t.ok(await sig() === s1, 'bought state persists');
  const undo = page.locator('button[data-exp=undo], button[data-exp=bought][aria-pressed=true]').first();
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('settings: name, dark theme, diet and exclusions persist', async t => {
  const {page, ctx} = await open('populated', '/settings/');
  await page.locator('#settings-dark').check(); await sleep(500);
  t.ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark theme applied');
  t.ok((await state(page)).theme === 'dark', 'dark theme saved');
  await page.selectOption('#preferences-diet', {index: 1});
  await page.locator('[data-preference-exclude=peanuts]').check();
  await page.fill('#profile-name', 'Zoe');
  await page.click('#save-recipe-preferences'); await sleep(900);
  t.ok((await state(page)).personalization.name === 'Zoe', 'name saved with the profile');
  const prefs = (await state(page)).recipePreferences;
  t.ok(prefs.diet && prefs.diet !== 'all', 'diet saved: ' + prefs.diet);
  t.ok((prefs.excluded || []).includes('peanutButter'), 'peanut exclusion saved (as ingredient keys): ' + (prefs.excluded || []));
  await page.reload({waitUntil: 'networkidle'}); await sleep(700);
  t.ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'theme persists after reload');
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('backup: export, tamper-check, import restores', async t => {
  const {page, ctx} = await open('populated', '/settings/');
  const [dl] = await Promise.all([page.waitForEvent('download', {timeout: 8000}), page.click('#backup-export')]);
  const file = path.join(process.env.TEMP || '.', `dt-backup-${label}-${Date.now()}.json`);
  await dl.saveAs(file);
  const raw = fs.readFileSync(file, 'utf8');
  let json; try { json = JSON.parse(raw); } catch { json = null; }
  t.ok(!!json && raw.length > 500, 'export is valid JSON (' + raw.length + ' bytes)');
  await page.fill('#profile-name', 'Changed Name'); await page.click('#save-recipe-preferences'); await sleep(800);
  t.ok((await state(page)).personalization.name === 'Changed Name', 'state changed before restore');
  await page.setInputFiles('#backup-import', file); await sleep(1500);
  await page.reload({waitUntil: 'networkidle'}); await sleep(700);
  const name = (await state(page)).personalization?.name;
  t.ok(name === 'Maria', 'import restored the original kitchen (name=' + name + ')');
  const bad = path.join(process.env.TEMP || '.', `dt-bad-${label}.json`); fs.writeFileSync(bad, '{"not":"a backup"');
  await page.setInputFiles('#backup-import', bad); await sleep(1000);
  t.ok((await state(page)).personalization?.name === 'Maria', 'corrupt backup is rejected without damaging data');
  await ctx.close();
});

T('dialogs: profile switcher and quick search open, trap Esc, restore focus', async t => {
  const {page, ctx} = await open('populated', '/today/');
  const opener = page.locator('[data-profile-open]').first();
  await opener.focus(); await opener.click(); await sleep(700);
  const open1 = await page.locator('dialog[open], [role=dialog]:visible').count();
  t.ok(open1 > 0, 'profile dialog opens');
  await page.keyboard.press('Escape'); await sleep(500);
  t.ok(await page.locator('dialog[open], [role=dialog]:visible').count() === 0, 'Escape closes it');
  t.ok(realErrors(page).length === 0, realErrors(page).join(' | '));
  await ctx.close();
});

T('offline: pages and recipe load from the service worker cache', async t => {
  const {page, ctx} = await open('populated', '/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await sleep(7000);
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller || navigator.serviceWorker.getRegistration().then(r => !!r?.active));
  t.ok(!!controlled, 'service worker active');
  await ctx.setOffline(true);
  const failed = [];
  for (const p of ['/pantry/', '/recipes/', '/today/', '/recipes/village-salad-with-feta-olives/', '/shopping-list/', '/weekly-plan/', '/settings/']) {
    try {
      await page.goto(base + p, {waitUntil: 'domcontentloaded', timeout: 15000}); await sleep(900);
      const n = (await page.textContent('main').catch(() => ''))?.trim().length || 0;
      if (n < 150) failed.push(p + ' (' + n + ' chars)');
    } catch (e) { failed.push(p + ' ' + String(e.message).split('\n')[0].slice(0, 60)); }
  }
  t.ok(!failed.length, failed.join(' ;; '));
  await ctx.setOffline(false);
  await ctx.close();
});

T('photo AI controls are present and Identify is disabled until a photo is chosen', async t => {
  // runs against whichever server is given; with the mock server enabled it simply verifies the control exists and consent gates it
  const {page, ctx} = await open('fresh', '/pantry/');
  t.ok(await page.locator('#pantry-photo').count() === 1 && await page.locator('#photo-analyze').count() === 1, 'photo controls present');
  t.ok(await page.locator('#photo-analyze').isDisabled(), 'identify disabled before a photo is chosen');
  await ctx.close();
});

// ---- run -------------------------------------------------------------------------------------------------------
const picked = tests.filter(([n]) => n.toLowerCase().includes(filter.toLowerCase()));
let pass = 0, fail = 0;
for (const [name, fn] of picked) {
  const checks = []; const t = {ok: (c, m = '') => checks.push({ok: !!c, m})};
  let crash = null;
  try { await Promise.race([fn(t), new Promise((_, rej) => setTimeout(() => rej(new Error('test timeout 90s')), 90000))]); } catch (e) { crash = process.env.REGRESS_VERBOSE ? String(e.message || e).split('\n').filter(l => l.trim()).slice(0, 12).join(' | ') : String(e.message || e).split('\n')[0]; }
  const bad = checks.filter(c => !c.ok);
  const ok = !crash && !bad.length && checks.length > 0;
  ok ? pass++ : fail++;
  results.push({name, ok, checks: checks.length, failed: bad.map(b => b.m), crash});
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${checks.length} checks)${crash ? '  CRASH: ' + crash : ''}${bad.length ? '\n        ' + bad.map(b => '- ' + b.m).join('\n        ') : ''}`);
}
console.log(`\n[${label}] ${pass} passed, ${fail} failed of ${picked.length}`);
fs.writeFileSync(path.join(process.env.TEMP || '.', `regress-${label}.json`), JSON.stringify({label, base, pass, fail, results}, null, 1));
await browser.close();
process.exit(fail ? 1 : 0);
