// Builds a release from a shipped package: baseline folder -> ordered patches -> version stamp -> module URLs -> service-worker precache
// -> publisher/SEO check -> release manifest.
// usage: node build.mjs --base <baseline folder> --out <out folder> --version 15.20.0 [--patches <dir>] [--base-version 15.19.0]
// The baseline is never modified. The patches live in one folder (one module each, applied in file-name order). Re-running on a NEWER baseline is
// the intended way to carry the work forward: any patch whose anchor drifted fails with the exact file and string, nothing is half-applied silently.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {Ctx, walk, isTextFile} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const base = path.resolve(arg('base')), out = path.resolve(arg('out')), VERSION = arg('version', '15.6.0');
const PATCH_DIR = path.resolve(arg('patches', path.join(here, 'patches')));
if (!base || !fs.existsSync(path.join(base, '_worker.js'))) { console.error('--base must be a release folder (contains _worker.js)'); process.exit(2); }
if (out === base || out.startsWith(base + path.sep)) { console.error('--out must not be inside the baseline'); process.exit(2); }
// The version that is being replaced is READ from what the baseline's pages actually request (the content manifest of the live line still says
// 15.6.4, so it cannot be trusted), or given explicitly.
const BASE_VERSION = arg('base-version', (() => {
  try { const m = fs.readFileSync(path.join(base, 'index.html'), 'utf8').match(/assets\/site\.js\?v=(\d+\.\d+\.\d+)/); if (m) return m[1]; } catch {}
  try { const m = JSON.parse(fs.readFileSync(path.join(base, 'assets/content-manifest.json'), 'utf8')); if (m.version) return String(m.version); } catch {}
  throw new Error('cannot read the baseline version; pass --base-version');
})());
const t0 = Date.now(), log = (...a) => console.log(...a);
const rel = f => path.relative(out, f).split(path.sep).join('/');

// 1 ---- copy the baseline ------------------------------------------------------------------------------------------------------------------------------------------
fs.rmSync(out, {recursive: true, force: true, maxRetries: 8, retryDelay: 250});   // Windows: a test server may briefly hold files
fs.cpSync(base, out, {recursive: true});
log(`1. baseline ${BASE_VERSION} copied: ${walk(out).length} files from ${base}`);

// 2 ---- patches ---------------------------------------------------------------------------------------------------------------------------------------------------------
const ctx = new Ctx(out, path.join(here, 'assets'));
ctx.version = VERSION; ctx.baseVersion = BASE_VERSION;
const patchFiles = fs.readdirSync(PATCH_DIR).filter(f => /^\d+.*\.mjs$/.test(f)).sort();
for (const f of patchFiles) {
  const mod = (await import(pathToFileURL(path.join(PATCH_DIR, f)).href)).default;
  log(`2. patch ${f}: ${mod.title}`);
  await mod.apply(ctx);
}

// 3 ---- version stamp (explicit contexts only: never a blanket replace, SVG path data contains digit runs like "15.5.5") ---------------------------------------------------------
let stamped = 0;
const esc = BASE_VERSION.replace(/\./g, '\\.');
const stampRules = [
  [new RegExp('\\?v=' + esc, 'g'), `?v=${VERSION}`],                              // asset cache-busting query on pages, the service worker list and scripts
  [/(assets\/data\.json\?v=)\d+\.\d+\.\d+/g, `$1${VERSION}`],                     // EVERY reader of the data file asks for the same URL (site.js asked for a stale one: two downloads per page)
  [new RegExp('(release-label">)v' + esc + '(<)', 'g'), `$1v${VERSION}$2`],       // visible release label
  [new RegExp('daily-table-v' + esc + '-', 'g'), `daily-table-v${VERSION}-`],     // service-worker shell cache name (the photo cache keeps its name: no image changed)
  [new RegExp("(build:')" + esc + "(')", 'g'), `$1${VERSION}$2`],                 // worker build tag on the status endpoints
  [new RegExp("(const build = ')" + esc + "(')", 'g'), `$1${VERSION}$2`],         // home / pantry preview build tag
  [new RegExp('("build":")' + esc + '(")', 'g'), `$1${VERSION}$2`],               // data file build tag
  [new RegExp('(engine v)' + esc, 'g'), `$1${VERSION}`],                          // "Photo recipe engine v…" receipt line
  [new RegExp('(Build )' + esc + '(?=[`\'" ])', 'g'), `$1${VERSION}`]             // security receipt text
];
for (const f of walk(out)) {
  if (!isTextFile(f)) continue;
  let t = fs.readFileSync(f, 'utf8'), u = t;
  for (const [re, to] of stampRules) u = u.replace(re, to);
  if (u !== t) { fs.writeFileSync(f, u); stamped++; }
}
log(`3. version stamped ${VERSION}: ${stamped} text files`);

// 3b ---- module URLs: every relative import asks for "?v=<this release>" -------------------------------------------------------------------------------------------------
// Script chunks keep their file names between releases while their content changes, and /assets/* may be served from the HTTP cache for an hour;
// the service worker then stores whatever it was given. A returning visitor could therefore run a new page with an old chunk. Giving every
// import the release in its URL makes each release's module graph a new set of URLs, and identical specifiers everywhere keep one instance per module.
let importFiles = 0, importCount = 0;
const IMPORT_RE = /((?:\bfrom|\bimport)\s*\(?\s*)(["'])(\.{1,2}\/[^"'?]+\.js)(?:\?v=[\w.]+)?\2/g;
for (const f of walk(path.join(out, 'assets'))) {
  if (!f.endsWith('.js')) continue;
  const t = fs.readFileSync(f, 'utf8');
  let n = 0;
  const u = t.replace(IMPORT_RE, (m, lead, quote, spec) => {
    if (!fs.existsSync(path.resolve(path.dirname(f), spec))) return m;   // not a module of this package (text inside a string, an example)
    n++; return `${lead}${quote}${spec}?v=${VERSION}${quote}`;
  });
  if (n && u !== t) { fs.writeFileSync(f, u); importFiles++; }
  importCount += n;
}
log(`3b. module URLs: ${importCount} imports in ${importFiles} files now request ?v=${VERSION}`);

// 3c ---- the food icon sprite is one file whose content grows with the catalogue; its URL carried no release ----------------------------------------------------------------
// /assets/* may come from the HTTP cache for an hour and the service worker keeps what it is given (cache-first, for the life of that release). A visitor who
// had opened the site within the hour before an update would keep the OLD sprite under the new worker: every food added since would have an empty icon.
// Every reference now names the release, so a new sprite is a new URL (same rule as the scripts and styles).
const SPRITE_RE = /(assets\/icons\/foods\.svg)(?:\?v=[\w.]+)?(#)/g;
let spriteRefs = 0;
for (const f of walk(out)) {
  if (!/\.(html|js)$/.test(f) || path.basename(f) === 'sw.js') continue;
  const t = fs.readFileSync(f, 'utf8');
  if (!t.includes('assets/icons/foods.svg')) continue;
  let n = 0;
  const u = t.replace(SPRITE_RE, (m0, file, hash) => { n++; return `${file}?v=${VERSION}${hash}`; });
  if (n) { fs.writeFileSync(f, u); spriteRefs += n; }
}
log(`3c. icon sprite: ${spriteRefs} references now request ?v=${VERSION}`);

// 4 ---- service worker: rebuild the precache list from what exists -------------------------------------------------------------------------------------------------------------
const swPath = path.join(out, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
const m = sw.match(/const FILES=(\[[\s\S]*?\]);/);
if (!m) throw new Error('sw.js FILES list not found');
const old = JSON.parse(m[1]);
const fileOf = p => { const f = p.split('?')[0]; return path.join(out, f === '/' ? 'index.html' : f.replace(/^\//, '')); };
const keptPaths = old.filter(p => fs.existsSync(fileOf(p)) && !p.split('?')[0].startsWith('/assets/chunks/') && !/\.(js|css)$/.test(p.split('?')[0]));
const have = new Set(keptPaths.map(p => p.split('?')[0]));
const add = [];
for (const f of walk(path.join(out, 'assets'))) {
  const r = '/' + rel(f), ext = path.extname(f).toLowerCase();
  const wanted = (['.js', '.css'].includes(ext) && !r.includes('/photos')) ? r + '?v=' + VERSION : (r.startsWith('/assets/fonts/') && ext === '.woff2') ? r : null;
  if (wanted && !have.has(r)) { add.push(wanted); have.add(r); }
}
const finalFiles = [...keptPaths, ...add].map(p => p.split('?')[0] === '/assets/icons/foods.svg' ? '/assets/icons/foods.svg?v=' + VERSION : p).sort();
sw = sw.replace(m[0], 'const FILES=' + JSON.stringify(finalFiles) + ';');
fs.writeFileSync(swPath, sw);
log(`4. service worker: ${keptPaths.length} pages/data kept, ${add.length} scripts/styles listed with ?v=${VERSION} -> ${finalFiles.length} precached (was ${old.length})`);

// 5 ---- publisher / SEO layer must still verify (13 checks) ---------------------------------------------------------------------------------------------------------------
const seo = path.resolve(here, '..', 'tools', 'dt_v15_3.mjs');
try { execFileSync(process.execPath, [seo, out, '--check'], {stdio: 'pipe'}); log('5. publisher / SEO layer: 13 / 13 checks pass'); }
catch (e) { throw new Error('SEO layer check failed:\n' + String(e.stdout || '') + String(e.stderr || '')); }

// 6 ---- release manifest: one sha256 per shipped file, in the format the live line publishes (so a deployment can be compared file by file) ------------------------------------
for (const f of fs.readdirSync(out)) if (/^release-manifest-.*\.json$/.test(f)) fs.rmSync(path.join(out, f));
const listed = walk(out).map(f => ({path: rel(f), bytes: fs.statSync(f).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')})).sort((a, b) => a.path < b.path ? -1 : 1);
const manifestName = `release-manifest-${VERSION}.json`;
fs.writeFileSync(path.join(out, manifestName), JSON.stringify({release: VERSION, source_release: BASE_VERSION, channel: 'PREVIEW_ONLY', file_count: listed.length + 1, files: listed}, null, 1));
log(`6. ${manifestName}: ${listed.length} files hashed`);

log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`);
