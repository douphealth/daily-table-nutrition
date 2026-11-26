// Rollback safety: a kitchen saved by the NEW build (with foods only the new catalogue knows) opened by the OLD build.
// Does the old build load it, ignore the unknown foods, or reject / reset the kitchen?
// usage: node probe-rollback.mjs <oldBaseUrl> <seedRoot> <newFoodKeys comma list>
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
const [base, siteRoot, keysArg] = process.argv.slice(2);
const extra = keysArg.split(',');
const b = await launch();
const seed = await buildSeed(siteRoot, 'populated');
const before = {pantry: seed.pantry.length, favorites: (seed.favorites || []).length, calendar: Object.keys(seed.daily.calendar || {}).length};
seed.pantry = [...seed.pantry, ...extra];
seed.daily.recent = [...extra, ...(seed.daily.recent || [])];
seed.daily.stock = {...(seed.daily.stock || {}), [extra[0]]: {amount: 1, unit: 'piece', level: 'plenty'}};
const {page, ctx} = await newPage(b, {w: 390, h: 844, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
page.on('dialog', d => { console.log('DIALOG:', d.message().slice(0, 200)); d.dismiss().catch(() => {}); });
for (const p of ['/', '/pantry/', '/today/', '/weekly-plan/', '/shopping-list/', '/settings/']) {
  await page.goto(base + p, {waitUntil: 'networkidle'}); await sleep(900);
  const r = await page.evaluate(() => {
    const raw = localStorage.getItem('dtable:workspace:v2'); let s = {}; try { s = JSON.parse(raw || '{}'); } catch {}
    const vis = e => !!(e.offsetWidth || e.offsetHeight) && !e.closest('[hidden]');
    return {pantry: (s.pantry || []).length, favorites: (s.favorites || []).length, calendar: Object.keys(s.daily?.calendar || {}).length, recent: (s.daily?.recent || []).slice(0, 3),
      keys: Object.keys(localStorage).filter(k => k.startsWith('dtable')).join(','),
      alerts: [...document.querySelectorAll('[role=alert], .recovery, [class*=recover], [class*=corrupt], .error, .toast, .ui-toast')].filter(vis).map(e => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 160)).filter(Boolean).slice(0, 3),
      mainLen: document.querySelector('main')?.innerText.length || 0, h1: document.querySelector('h1')?.innerText.trim().slice(0, 50) || ''};
  });
  console.log(p.padEnd(16), JSON.stringify(r));
}
console.log('seeded: ', JSON.stringify(before), '+', extra.join(','));
console.log('page errors:', page.__errors.filter(e => !/favicon|turnstile/.test(e)).slice(0, 6).join(' | ') || 'none');
await ctx.close(); await b.close();
