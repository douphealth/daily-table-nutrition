// Lists every NAME the live package resolves to a food (browser photo table + server alias table) that the new package resolves differently.
// usage: node alias-regress.mjs <liveSite> <newSite>
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [live, next] = process.argv.slice(2).map(p => path.resolve(p));
const norm = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
function tables(site) {
  const out = new Map();
  const add = (name, key, src) => { const n = norm(name); if (!n) return; if (!out.has(n)) out.set(n, new Map()); out.get(n).set(src, key); };
  const w = fs.readFileSync(path.join(site, '_worker.js'), 'utf8');
  const a = w.indexOf('const safeAliases = '), b = w.indexOf('const photoAliases', a);
  const safe = new Function('return ' + w.slice(a + 'const safeAliases = '.length, b).trim().replace(/;$/, ''))();
  for (const [k, list] of Object.entries(safe)) for (const n of list) add(n, k, 'server');
  const m = fs.readFileSync(path.join(site, 'assets/chunks/chunk-MNNQ7WCU.js'), 'utf8');
  const i = m.indexOf(',me={') + 4, j = m.indexOf(';Object.assign(me,{', i), k2 = m.indexOf('});var ge=new Map', j);
  const me = new Function('return ' + m.slice(i, j))(); Object.assign(me, new Function('return ' + m.slice(j + ';Object.assign(me,'.length, k2 + 1))());
  for (const [k, list] of Object.entries(me)) for (const n of list) add(n, k, 'browser');
  const data = JSON.parse(fs.readFileSync(path.join(site, 'assets/data.json'), 'utf8'));
  for (const [k, label] of Object.entries(data.foodLabels)) { add(label, k, 'label'); add(k, k, 'label'); }
  return {out, data};
}
const L = tables(live), N = tables(next);
const idFile = fs.readdirSync(path.join(next, 'assets/chunks')).find(f => f.startsWith('photo-ingredient-identity'));
const v = fs.readFileSync(path.join(next, 'index.html'), 'utf8').match(/site\.js\?v=([\d.]+)/)[1];
const {createPhotoIngredientResolver} = await import(pathToFileURL(path.join(next, 'assets/chunks', idFile)).href + '?v=' + v);
const resolve = createPhotoIngredientResolver(N.data.foodLabels, N.data.foodAliases || {});
let bad = 0;
for (const [name, srcs] of L.out) {
  const liveKeys = [...new Set(srcs.values())];
  if (liveKeys.length !== 1) continue;                         // live itself disagreed
  const liveKey = liveKeys[0];
  const serverNew = N.out.get(name)?.get('server'), browserNew = N.out.get(name)?.get('browser');
  const client = resolve({name, form: 'unknown', catalog: browserNew || undefined});
  const byName = resolve({name, form: 'unknown'});
  if (serverNew !== undefined && serverNew !== liveKey) { bad++; console.log(`server : "${name}" was ${liveKey}, now ${serverNew}`); }
  if (client !== liveKey && byName !== liveKey) { bad++; console.log(`browser: "${name}" was ${liveKey}, now ${client} (by name: ${byName}, photo table: ${browserNew})`); }
}
console.log(`${L.out.size} live names checked, ${bad} resolve differently`);

// ── part 2: every name the NEW package ships (labels + alias table + the browser's own photo table) reaches exactly its own food ─────────
let wrong = 0, total = 0;
const ownNames = new Map();
for (const [k, label] of Object.entries(N.data.foodLabels)) ownNames.set(k, new Set([label, ...(N.data.foodAliases?.[k] || [])]));
const serverByName = new Map();
for (const [name, srcs] of N.out) if (srcs.has('server')) serverByName.set(name, srcs.get('server'));
for (const [k, names] of ownNames) for (const raw of names) {
  total++;
  const name = norm(raw);
  const hint = N.out.get(name)?.get('browser');
  const got = resolve({name: raw, form: 'unknown', catalog: hint || undefined});
  if (got !== k) { wrong++; console.log(`new    : "${raw}" should be ${k}, browser gives ${got} (photo table: ${hint})`); }
  if (serverByName.get(name) !== k) { wrong++; console.log(`new    : "${raw}" should be ${k}, server gives ${serverByName.get(name)}`); }
}
console.log(`${total} names of ${ownNames.size} foods checked through browser + server, ${wrong} wrong`);
process.exit(bad || wrong ? 1 : 0);
