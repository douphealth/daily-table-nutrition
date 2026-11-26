// Opens pages of a build and reports page errors / console errors (optionally with a populated kitchen and a session snapshot). usage: node page-errors.mjs <baseUrl> <siteRoot> <kind> <path> [<path>...]
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
const [base, siteRoot, kind, ...paths] = process.argv.slice(2);
const browser = await launch();
const seed = await buildSeed(siteRoot, kind);
const {page, ctx} = await newPage(browser, {w: 390, h: 844, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 400)); });
for (const p of paths) {
  const n = errs.length;
  await page.goto(base + p, {waitUntil: 'networkidle'}); await sleep(900);
  console.log(`${errs.length - n ? 'ERR ' : 'ok  '} ${p}${errs.length - n ? '\n     ' + errs.slice(n).join('\n     ') : ''}`);
}
await browser.close();
