// End-to-end test of My pantry "Start with a photo" on the 15.19+ page structure, with a scripted vision / recipe AI and a stubbed
// security widget (test server: serve.mjs --mock-ai). Asserts what a cook sees and what leaves the device, at one width and theme.
//   A  kitchen without restrictions: photo -> Find ingredients -> foods -> recipe
//   B  kitchen with peanuts + milk saved as allergens: the foods its rules remove are listed with the reason, and are never sent
// usage: node photo-e2e.mjs <baseUrl> <siteRoot(for seeding)> [width=390] [scheme=light]
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
import path from 'node:path';
const [base, siteRoot, wArg = '390', scheme = 'light'] = process.argv.slice(2);
const w = Number(wArg), h = w < 768 ? 844 : 900;
const GEMMA = '@cf/google/gemma-4-26b-a4b-it', SCOUT = '@cf/meta/llama-4-scout-17b-16e-instruct';
const item = name => ({name, form: 'raw', certainty: 'clear', evidence_kind: 'visual', evidence: 'Visible in the photo.', alternatives: []});
const script = async foods => { const obs = {scene: 'ingredients', quality: 'good', issues: [], items: foods.map(item)}; await fetch(base + '/__mock_models', {method: 'POST', body: JSON.stringify({[GEMMA]: {delay: 900, vision: obs}, [SCOUT]: {delay: 1100, vision: obs}})}); };
const PHOTO = path.join(siteRoot, 'assets/photos/chickpeaTahiniDip-1240.jpg');
const browser = await launch();
const results = [];
const check = (group, name, ok, detail = '') => { results.push({group, name, ok: !!ok, detail}); };
const state = page => page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('dtable:profiles:v1') || 'null');
  let key = 'dtable:workspace:v2'; if (r?.version === 1 && r.active && r.profiles?.some(p => p.id === r.active)) key += ':' + r.active;
  return JSON.parse(localStorage.getItem(key) || '{}');
});
const realErrors = page => page.__errors.filter(e => !/turnstile|favicon|net::ERR_ABORTED/i.test(e));

async function open(kind) {
  const seed = await buildSeed(siteRoot, kind); if (scheme === 'dark') seed.theme = 'dark';
  const {page, ctx} = await newPage(browser, {w, h, scheme, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
  const calls = [];
  page.on('request', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) calls.push({method: r.method(), path: u.pathname, body: r.postData() || ''}); });
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', r => r.fulfill({contentType: 'text/javascript', body: "window.turnstile={render(el,o){setTimeout(()=>o.callback('test-token:'+(o.action||'')),200);return 'w'+Math.random()},remove(){},reset(){},getResponse(){return 't'}};"}));
  await ctx.setExtraHTTPHeaders({'CF-Connecting-IP': '10.' + [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 250)).join('.')});
  await page.goto(base + '/pantry/', {waitUntil: 'networkidle'});
  await sleep(1000);
  return {page, ctx, calls};
}
const chipNames = page => page.evaluate(() => [...document.querySelectorAll('#photo-journey .pj-chips [data-pj-food]')].filter(c => c.offsetWidth).map(c => (c.querySelector('.pj-chip-name')?.childNodes[0]?.textContent || c.textContent).trim() + (c.getAttribute('aria-pressed') === 'true' ? '' : ' (off)')));
const journeyText = page => page.evaluate(() => (document.querySelector('#photo-journey')?.innerText || '').replace(/\s+/g, ' ').trim());

// ── A ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const G = 'A photo to recipe';
  await script(['tomato', 'cucumber', 'red onion', 'olives', 'feta', 'parsley', 'cherry tomatoes']);
  const {page, ctx, calls} = await open('fresh');
  // 1 the photo control is on the first screen
  const take = await page.evaluate(() => { const els = [...document.querySelectorAll('.dt-launch-options label, .dt-launch-options button, label[for="photo-camera"], label[for="photo-upload"]')].filter(e => e.offsetWidth && /photo/i.test(e.textContent)); if (!els.length) return null; const r = els[0].getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, text: els[0].textContent.trim().slice(0, 30)}; });
  check(G, 'a photo button is on the first screen, above the dock', take && take.top > 0 && take.bottom < take.vh - (w < 768 ? 96 : 0), JSON.stringify(take));
  // 2 choosing a photo sends nothing and brings "Find ingredients" into view
  await page.locator('input[type="file"]').first().setInputFiles(PHOTO);
  await sleep(2000);
  check(G, 'choosing a photo sends nothing to the server', !calls.some(c => c.method === 'POST'), calls.filter(c => c.method === 'POST').map(c => c.path).join(', '));
  const find = await page.evaluate(() => { const b = document.getElementById('photo-analyze'); if (!b || !b.offsetWidth) return null; const r = b.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, disabled: b.disabled, focused: document.activeElement === b, stage: document.body.dataset.pantryStage}; });
  check(G, '"Find ingredients" is enabled and on screen without scrolling', find && !find.disabled && find.top > 60 && find.bottom < find.vh - (w < 768 ? 96 : 0), JSON.stringify(find));
  check(G, 'the launch area is out of the way while a photo is open', await page.evaluate(() => { const e = document.querySelector('.dt-launch-options'); return !e || !e.offsetWidth; }));
  // 3 identifying: one status, one Cancel
  await page.locator('#photo-analyze').click();
  await sleep(500);
  const busy = await page.evaluate(() => { const vis = e => !!(e && e.offsetWidth && !e.closest('[hidden]')); const k = document.getElementById('photo-kitchen'); return {readout: vis(document.querySelector('.scan-readout')), cancels: [...k.querySelectorAll('button')].filter(b => vis(b) && /^cancel$/i.test(b.textContent.trim())).length, findVisible: vis(document.getElementById('photo-analyze')), scan: k.dataset.scan}; });
  check(G, 'while identifying: one Cancel, no duplicate status over the photo, no dead "Find ingredients"', busy.cancels === 1 && !busy.readout && !busy.findVisible, JSON.stringify(busy));
  // 4 the foods
  await page.waitForFunction(() => document.querySelector('#photo-journey:not([hidden]) [data-pj-food]'), {timeout: 30000}).catch(() => {});
  await sleep(1200);
  const chips = await chipNames(page);
  check(G, 'seven photo names become six foods (cherry tomatoes join tomato), all selected', JSON.stringify(chips) === JSON.stringify(['Tomato', 'Cucumber', 'Onion', 'Olives', 'Feta', 'Parsley']), chips.join(' | '));
  const t1 = await journeyText(page);
  check(G, 'the count line agrees with the chips', /6 selected · 6 identified/.test(t1) && !/left out/.test(t1.split('YOUR SELECTED FOODS')[0]), (t1.match(/\d+ food suggestions[^Y]*/) || [''])[0]);
  check(G, 'one photo analysis was requested, after the button', calls.filter(c => c.path === '/api/vision/analyze').length === 1);
  check(G, 'nothing is saved to the kitchen by identifying', ((await state(page)).pantry || []).length === 0, JSON.stringify((await state(page)).pantry));
  // 5 the recipe
  if (!/foods used/.test(t1)) {
    const go = page.locator('#photo-journey button:visible', {hasText: /create a recipe/i}).first();
    if (await go.count()) { await go.scrollIntoViewIfNeeded(); await go.click(); }
  }
  await page.waitForFunction(() => /\d+ of \d+ foods used/.test(document.querySelector('#photo-journey')?.innerText || '') && document.querySelector('#photo-journey .pj-steps li'), {timeout: 45000}).catch(() => {});
  await sleep(800);
  const t2 = await journeyText(page);
  check(G, 'the recipe uses all six foods and adds none', /6 of 6 foods used · nothing added/.test(t2), (t2.match(/\d+ of \d+ foods used[^A-Z]*/) || ['(no recipe)'])[0]);
  const gen = calls.filter(c => c.path === '/api/recipes/generate');
  let sent = []; try { sent = ((JSON.parse(gen.at(-1)?.body || '{}').input || {}).items || []).map(i => i.key).sort(); } catch {}
  check(G, 'the recipe request carries exactly the selected foods and no photo', gen.length >= 1 && JSON.stringify(sent) === JSON.stringify(['cucumber', 'feta', 'olives', 'onion', 'parsley', 'tomato']) && !/data:image|base64/.test(gen.at(-1)?.body || ''), sent.join(','));
  const steps = await page.evaluate(() => [...document.querySelectorAll('#photo-journey .pj-steps li')].map(li => ({lead: li.querySelector('.pj-step-lead')?.textContent.trim() || '', notes: li.querySelectorAll('.pj-step-notes > span').length, text: li.textContent.replace(/\s+/g, ' ').trim()})));
  check(G, 'every step leads with its action', steps.length >= 2 && steps.every(s => s.lead.length > 8), steps.map(s => s.lead.slice(0, 40)).join(' / '));
  check(G, 'a salad of raw foods is labelled no-cook and nothing is "cooked"', /No-cook/.test(t2) && !steps.some(s => /\b(boil|fry|saut|simmer|°C)\b/i.test(s.text)), steps.map(s => s.text.slice(0, 60)).join(' / '));
  check(G, 'feta and olives are set aside, not "cut into small pieces"', steps.some(s => /set aside[^.]*olives[^.]*feta|set aside[^.]*feta/i.test(s.text)) && !steps.some(s => /cut[^.]*(feta|olives)/i.test(s.text)));
  check(G, 'amounts are listed for every food', await page.evaluate(() => { const t = document.querySelector('#photo-journey')?.innerText || ''; return ['Tomato', 'Cucumber', 'Onion', 'Olives', 'Feta', 'Parsley'].every(n => new RegExp(n + '\\s+[\\d.]+ (g|ml|piece)').test(t)); }));
  check(G, 'still nothing saved to the kitchen', ((await state(page)).pantry || []).length === 0);
  check(G, 'no script errors', realErrors(page).length === 0, realErrors(page).slice(0, 3).join(' | '));
  await ctx.close();
}

// ── B ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const G = 'B kitchen with allergens';
  await script(['tomato', 'cucumber', 'red onion', 'olives', 'feta', 'peanut butter']);
  const {page, ctx, calls} = await open('allergic');
  await page.locator('input[type="file"]').first().setInputFiles(PHOTO);
  await sleep(2000);
  await page.locator('#photo-analyze').click();
  await page.waitForFunction(() => document.querySelector('#photo-journey:not([hidden]) [data-pj-food]'), {timeout: 30000}).catch(() => {});
  await sleep(1200);
  const chips = await chipNames(page);
  check(G, 'only the foods this kitchen allows can be selected', JSON.stringify(chips) === JSON.stringify(['Tomato', 'Cucumber', 'Onion']), chips.join(' | '));
  const left = await page.evaluate(() => [...document.querySelectorAll('#photo-journey .dt-left-out li')].filter(e => e.offsetWidth).map(li => li.querySelector('b')?.textContent.trim() + ' :: ' + li.querySelector('small')?.textContent.trim()));
  check(G, 'the three removed foods are listed', left.length === 3 && ['Olives', 'Feta', 'Peanut butter'].every(n => left.some(l => l.startsWith(n + ' ::'))), left.join(' | '));
  check(G, 'each one says which rule removed it', left.some(l => /^Feta :: Saved allergen for this kitchen: Milk/.test(l)) && left.some(l => /^Peanut butter :: Saved allergen for this kitchen: Peanuts/.test(l)) && left.some(l => /^Olives :: Packaged or compound food/.test(l)), left.join(' | '));
  const t1 = await journeyText(page);
  check(G, 'the count line accounts for all six suggestions', /6 food suggestions from your photo 3 selected · 3 identified · 3 left out/.test(t1), (t1.match(/\d+ food suggestions[^Y]*/) || [''])[0]);
  const box = await page.evaluate(() => { const e = document.querySelector('#photo-journey .dt-left-out'); if (!e) return null; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return {w: Math.round(r.width), overflow: e.scrollWidth > e.clientWidth + 1, link: e.querySelector('a')?.getAttribute('href'), bg: cs.backgroundColor}; });
  check(G, 'the note fits its card and links to the settings that own the rules', box && !box.overflow && box.link === '/settings/#recipe-preferences', JSON.stringify(box));
  if (!/foods used/.test(t1)) {
    const go = page.locator('#photo-journey button:visible', {hasText: /create a recipe/i}).first();
    if (await go.count()) { await go.scrollIntoViewIfNeeded(); await go.click(); }
  }
  await page.waitForFunction(() => /\d+ of \d+ foods used/.test(document.querySelector('#photo-journey')?.innerText || ''), {timeout: 45000}).catch(() => {});
  await sleep(600);
  const gen = calls.filter(c => c.path === '/api/recipes/generate');
  let sent = [], allergens = []; try { const bdy = JSON.parse(gen.at(-1)?.body || '{}').input || {}; sent = (bdy.items || []).map(i => i.key).sort(); allergens = bdy.allergens || []; } catch {}
  check(G, 'removed foods are never sent for a recipe; the allergens are', gen.length >= 1 && JSON.stringify(sent) === JSON.stringify(['cucumber', 'onion', 'tomato']) && allergens.includes('milk') && allergens.includes('peanuts'), sent.join(',') + ' | allergens ' + allergens.join(','));
  const t2 = await journeyText(page);
  check(G, 'the recipe contains none of them', /3 of 3 foods used/.test(t2) && !/\b(feta|peanut|olives)\b/i.test(t2.split('Exactly what goes in')[1]?.split('How this dish is made')[0] || 'feta'));
  check(G, 'no script errors', realErrors(page).length === 0, realErrors(page).slice(0, 3).join(' | '));
  await ctx.close();
}

let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  [${r.group}] ${r.name}${r.ok ? '' : '\n        - ' + r.detail}`); }
console.log(`\n[photo ${w}/${scheme}] ${results.length - failed} of ${results.length} checks passed`);
await browser.close();
process.exit(failed ? 1 : 0);
