// Is the one Cancel button usable while a photo is being identified? Reads its state at several moments of a 6-second analysis, then
// presses it and checks that the request stops and the page returns to a usable state.
// usage: node probe-cancel.mjs <baseUrl> <seedRoot> [width=390] [outPng]
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
import path from 'node:path';
const [base, siteRoot, wArg = '390', out = ''] = process.argv.slice(2);
const w = Number(wArg), h = w < 768 ? 844 : 900;
const GEMMA = '@cf/google/gemma-4-26b-a4b-it', SCOUT = '@cf/meta/llama-4-scout-17b-16e-instruct';
const item = name => ({name, form: 'raw', certainty: 'clear', evidence_kind: 'visual', evidence: 'Visible in the photo.', alternatives: []});
const obs = items => ({scene: 'ingredients', quality: 'good', issues: [], items});
await fetch(base + '/__mock_models', {method: 'POST', body: JSON.stringify({[GEMMA]: {delay: 6000, vision: obs(['tomato', 'feta'].map(item))}, [SCOUT]: {delay: 6000, vision: obs(['tomato', 'feta'].map(item))}})});
const b = await launch();
const seed = await buildSeed(siteRoot, 'fresh');
const {page, ctx} = await newPage(b, {w, h, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', r => r.fulfill({contentType: 'text/javascript', body: "window.turnstile={render(el,o){setTimeout(()=>o.callback('test-token:'+(o.action||'')),250);return 'w'+Math.random()},remove(){},reset(){},getResponse(){return 't'}};"}));
await ctx.setExtraHTTPHeaders({'CF-Connecting-IP': '10.9.' + (1 + Math.floor(Math.random() * 250)) + '.9'});
await page.goto(base + '/pantry/', {waitUntil: 'networkidle'});
await sleep(900);
await page.locator('input[type="file"]').first().setInputFiles(path.join(siteRoot, 'assets/photos/chickpeaTahiniDip-1240.jpg'));
await sleep(1600);
await page.locator('#photo-analyze').click();
const state = () => page.evaluate(() => ['scan-preview-cancel', 'photo-cancel'].map(id => { const el = document.getElementById(id); if (!el) return id + ': absent'; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); const shown = r.width > 2 && r.height > 2 && cs.display !== 'none' && cs.visibility !== 'hidden'; return `${id}: ${shown ? 'shown' : 'not shown'}${el.disabled ? ' DISABLED' : ''}${el.getAttribute('aria-disabled') === 'true' ? ' aria-disabled' : ''} opacity ${cs.opacity} bg ${cs.backgroundColor} color ${cs.color} pointer-events ${cs.pointerEvents} y=${Math.round(r.top)}`; }).join('\n     '));
for (const ms of [350, 1200, 2500]) { await sleep(ms === 350 ? 350 : ms === 1200 ? 850 : 1300); console.log(`at ${ms} ms:\n     ` + await state()); if (ms === 1200 && out) await page.screenshot({path: out}); }
const before = await page.evaluate(() => ({stage: document.body.dataset.pantryStage, scan: document.querySelector('#photo-kitchen')?.dataset.scan || ''}));
const cancel = page.locator('#scan-preview-cancel:visible, #photo-cancel:visible').first();
let clicked = true; try { await cancel.click({timeout: 4000}); } catch (e) { clicked = false; console.log('  click failed: ' + e.message.split('\n')[0]); }
await sleep(1200);
const after = await page.evaluate(() => ({stage: document.body.dataset.pantryStage, scan: document.querySelector('#photo-kitchen')?.dataset.scan || '', find: (el => el ? {shown: el.getBoundingClientRect().height > 2, disabled: el.disabled} : null)(document.getElementById('photo-analyze')), chips: document.querySelectorAll('#photo-journey:not([hidden]) .pj-chip').length, status: [...document.querySelectorAll('[role="status"], [aria-live]')].map(e => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 3)}));
console.log('before cancel:', JSON.stringify(before), '| clicked:', clicked);
console.log('after cancel :', JSON.stringify(after));
await sleep(6500);
console.log('7 s later    : chips', await page.evaluate(() => document.querySelectorAll('#photo-journey:not([hidden]) .pj-chip').length), '(0 = the cancelled analysis did not come back) | page errors:', errors.length ? errors.join(' | ') : 'none');
await ctx.close(); await b.close();
