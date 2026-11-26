// A returning visitor's upgrade from one release to the next, in a real browser with a real service worker and a real HTTP cache.
// One origin serves the OLD folder first (visitor opens pages, the worker installs, assets enter the HTTP cache for an hour, exactly as
// the site's own _headers say), then the SAME origin serves the NEW folder. Asserts: the update notice appears and can be tapped, the new
// release takes over, old caches are removed and the photo cache is kept, the kitchen is untouched, the icon sprite is the new one (not
// the hour-old cached copy), pages work offline afterwards, no script errors.
// usage: node sw-upgrade.mjs <oldSiteFolder> <newSiteFolder> [port=8899]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
const [oldRoot, newRoot, portArg = '8899'] = process.argv.slice(2);
const port = Number(portArg);
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml'};
let root = path.resolve(oldRoot);
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) { res.writeHead(503, {'content-type': 'application/json', 'cache-control': 'no-store'}); res.end('{"enabled":false}'); return; }
  let f = path.join(root, decodeURIComponent(u.pathname));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, {'content-type': 'text/html'}); res.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : 'not found'); return; }
  const cache = u.pathname === '/sw.js' ? 'no-cache' : u.pathname.startsWith('/assets/') ? 'public, max-age=3600, must-revalidate' : 'public, max-age=0, must-revalidate';
  res.writeHead(200, {'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': cache});
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(port, '127.0.0.1', r));
const base = `http://127.0.0.1:${port}`;
const ver = r => JSON.parse(fs.readFileSync(path.join(r, 'assets/data.json'), 'utf8')).build || (fs.readFileSync(path.join(r, 'sw.js'), 'utf8').match(/daily-table-v([\d.]+)/) || [])[1];
const swVer = r => (fs.readFileSync(path.join(r, 'sw.js'), 'utf8').match(/const CACHE='daily-table-v([\d.]+)/) || [])[1];
const OLD = swVer(oldRoot), NEW = swVer(newRoot);
const symbols = r => new Set([...fs.readFileSync(path.join(r, 'assets/icons/foods.svg'), 'utf8').matchAll(/<symbol[^>]*\bid="(f-[\w-]+)"/g)].map(m => m[1]));
const newIcon = [...symbols(newRoot)].find(id => !symbols(oldRoot).has(id));
const results = [];
const check = (name, ok, detail = '') => results.push({name, ok: !!ok, detail});

const browser = await launch();
const seed = await buildSeed(path.resolve(oldRoot, '..', 'v15'), 'populated');
const {page, ctx} = await newPage(browser, {w: 390, h: 844, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
const errors = () => page.__errors.filter(e => !/api\/|turnstile|favicon|net::ERR_ABORTED|503|ERR_INTERNET_DISCONNECTED|ERR_FAILED/i.test(e));

// ── the visitor uses the old release ──
await page.goto(base + '/', {waitUntil: 'networkidle'});
await page.evaluate(() => navigator.serviceWorker.ready);
await sleep(1500);
for (const p of ['/pantry/', '/today/', '/recipes/', '/recipes/greek-yogurt-oats-banana/']) { await page.goto(base + p, {waitUntil: 'networkidle'}); await sleep(500); }
const before = await page.evaluate(async () => ({controlled: !!navigator.serviceWorker.controller, caches: await caches.keys(), kitchen: localStorage.getItem('dtable:workspace:v2')?.length || 0, photos: (await (await caches.open((await caches.keys()).find(k => k.startsWith('daily-table-photos-')) || 'x')).keys()).length}));
check(`old release ${OLD} is installed and controls the page`, before.controlled && before.caches.some(k => k.includes('v' + OLD)), before.caches.join(', '));
const kitchenBefore = await page.evaluate(() => localStorage.getItem('dtable:workspace:v2'));

// ── the site is updated ──
root = path.resolve(newRoot);
await page.goto(base + '/today/', {waitUntil: 'networkidle'});
await page.waitForFunction(() => { const n = document.getElementById('update-note'); return n && !n.hidden; }, {timeout: 20000}).catch(() => {});
const note = await page.evaluate(() => { const n = document.getElementById('update-note'), b = document.getElementById('apply-update'); if (!n || n.hidden || !b) return null; const r = b.getBoundingClientRect(); return {text: n.innerText.replace(/\s+/g, ' ').trim().slice(0, 90), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top)}; });
check('the update notice appears on the next visit', !!note, JSON.stringify(note));
check('its button is a full-size tap target (at least 44 px tall)', note && note.h >= 44, JSON.stringify(note));
if (note) {
  await Promise.all([page.waitForNavigation({waitUntil: 'load', timeout: 20000}).catch(() => {}), page.locator('#apply-update').click()]);
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(2500);
}
const after = await page.evaluate(async id => {
  const keys = await caches.keys();
  const reg = await navigator.serviceWorker.getRegistration();
  const sprite = await fetch([...document.querySelectorAll('use')].map(u => (u.getAttribute('href') || '').split('#')[0]).find(h => h.includes('foods.svg')) || '/assets/icons/foods.svg').then(r => r.text()).catch(() => '');
  return {keys, waiting: !!reg?.waiting, active: reg?.active?.scriptURL || '', polish: !!document.querySelector('link[href*="polish-"]'), spriteHasNew: id ? sprite.includes('id="' + id + '"') : null, spriteURL: [...document.querySelectorAll('use')].map(u => u.getAttribute('href') || '').find(h => h.includes('foods.svg')) || '', noteHidden: document.getElementById('update-note')?.hidden !== false, kitchen: localStorage.getItem('dtable:workspace:v2')};
}, newIcon);
check(`the new release ${NEW} took over and no update is left waiting`, after.keys.some(k => k.includes('v' + NEW)) && !after.waiting && after.noteHidden, after.keys.join(', '));
check('the old release cache is removed', !after.keys.some(k => k.includes('v' + OLD + '-')), after.keys.join(', '));
check('downloaded recipe photos are kept', after.keys.some(k => k.startsWith('daily-table-photos-')) && before.caches.filter(k => k.startsWith('daily-table-photos-')).every(k => after.keys.includes(k)), after.keys.join(', '));
{
  // the app itself rewrites a few bookkeeping fields while pages are used (they are listed if they differ); everything a cook entered must be identical
  const diff = (x, y, trail = '') => { if (JSON.stringify(x) === JSON.stringify(y)) return []; if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x) && !Array.isArray(y)) return [...new Set([...Object.keys(x), ...Object.keys(y)])].flatMap(k => diff(x[k], y[k], trail ? trail + '.' + k : k)); return [trail + ': ' + JSON.stringify(x)?.slice(0, 60) + ' -> ' + JSON.stringify(y)?.slice(0, 60)]; };
  const changed = diff(JSON.parse(kitchenBefore || '{}'), JSON.parse(after.kitchen || '{}'));
  const BOOKKEEPING = /^(daily\.metrics|daily\.flow\.experience|personalization\.(seen|visits|last)|updatedAt|lastOpened|daily\.lastBackup|daily\.backupStarted)/;
  const real = changed.filter(c => !BOOKKEEPING.test(c));
  if (changed.length) console.log('   kitchen fields rewritten by the app during the visit: ' + changed.join(' ; ').slice(0, 600));
  check('everything the cook saved is unchanged (pantry, plan, favourites, allergens, settings)', (kitchenBefore || '').length > 500 && real.length === 0, real.join(' ; ').slice(0, 500));
}
check(`the icon sprite is the new one (has ${newIcon || 'no new icon'}), not the copy cached an hour ago`, newIcon ? after.spriteHasNew === true : true, after.spriteURL);
// the page really runs the new code
await page.goto(base + '/pantry/', {waitUntil: 'networkidle'}); await sleep(900);
const running = await page.evaluate(v => ({stamp: [...document.querySelectorAll('link[rel=stylesheet], script[src]')].map(e => e.getAttribute('href') || e.getAttribute('src')).filter(u => u.includes('?v=')).every(u => u.endsWith('?v=' + v)), polish: !!document.querySelector('link[href*="polish-' + v + '"]')}), NEW);
check('every script and style on the page is requested for the new release', running.stamp, JSON.stringify(running));
// ── offline afterwards ──
await ctx.setOffline(true);
const offline = [];
for (const p of ['/', '/pantry/', '/today/', '/recipes/greek-yogurt-oats-banana/']) {
  await page.goto(base + p, {waitUntil: 'load'}).catch(() => {});
  await sleep(700);
  const t = await page.evaluate(() => ({h1: document.querySelector('h1')?.innerText.trim().slice(0, 40) || '', len: document.querySelector('main')?.innerText.length || 0})).catch(() => ({h1: '', len: 0}));
  offline.push(`${p} ${t.len}`);
  if (t.len < 150) check('offline: ' + p + ' opens from the cache', false, JSON.stringify(t));
}
if (!results.some(r => r.name.startsWith('offline: '))) check('offline: home, pantry, today and an opened recipe still open', true, offline.join(' | '));
await ctx.setOffline(false);
check('no script errors during the upgrade', errors().length === 0, errors().slice(0, 4).join(' | '));

let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n        - ' + r.detail}`); }
console.log(`\n[upgrade ${OLD} -> ${NEW}] ${results.length - failed} of ${results.length} checks passed`);
await ctx.close(); await browser.close(); server.close();
process.exit(failed ? 1 : 0);
