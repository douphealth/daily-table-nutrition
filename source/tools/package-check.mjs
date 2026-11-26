// Package-integrity checks for a deployable site folder (run on the release folder AND on the unzipped upload ZIP).
// usage: node package-check.mjs <siteFolder>
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2]);
const walk = d => fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(root); const rel = f => path.relative(root, f).split(path.sep).join('/');
const has = p => fs.existsSync(path.join(root, p.replace(/^\//, '')));
const results = []; const check = (name, ok, detail = '') => { results.push({name, ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' - ' + detail : '')); };

// 1 required Cloudflare Pages files
for (const f of ['index.html', '404.html', '_worker.js', '_headers', '_redirects', '_routes.json', 'sw.js', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml'])
  check('required file ' + f, has(f));

// 2 service-worker precache entries exist
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const list = JSON.parse((sw.match(/const FILES=(\[.*?\]);/s) || [])[1] || '[]');
const missingPre = list.filter(u => { const p = u.split('?')[0]; return !has(p === '/' ? 'index.html' : p.endsWith('/') ? p + 'index.html' : p); });
// (the 15.7+ worker precaches the app shell, its scripts and styles and the data: 46-47 entries; the 15.6 worker listed 100+. Both are valid.)
check(`service-worker precache: ${list.length} entries all present`, list.length >= 40 && !missingPre.length, missingPre.slice(0, 5).join(', '));

// 3 local references in every HTML page resolve
const html = files.filter(f => f.endsWith('.html'));
let refs = 0; const broken = new Map();
const resolveRef = (from, ref) => {
  ref = ref.split('#')[0].split('?')[0]; if (!ref || /^(https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(ref)) return true;
  const abs = ref.startsWith('/') ? ref : '/' + path.posix.join(path.posix.dirname('/' + from), ref);
  const p = abs.replace(/^\//, '');
  return !p || has(p) && fs.statSync(path.join(root, p)).isFile() || has(p + '/index.html') || has(p + '.html');
};
const ROUTE_ONLY = new Set(['/cook/']); // dynamic route served from a real file
for (const f of html) {
  const t = fs.readFileSync(f, 'utf8'); const from = rel(f);
  for (const m of t.matchAll(/\b(?:href|src)="([^"]+)"/g)) { refs++; if (!resolveRef(from, m[1])) (broken.get(m[1]) || broken.set(m[1], []).get(m[1])).push(from); }
  for (const m of t.matchAll(/\bsrcset="([^"]+)"/g)) for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (!u) continue; refs++; if (!resolveRef(from, u)) (broken.get(u) || broken.set(u, []).get(u)).push(from); }
}
check(`${html.length} pages, ${refs} local references all resolve`, !broken.size, [...broken.keys()].slice(0, 5).join(', '));

// 4 recipe photos: every assignment has all six variants
const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/data.json'), 'utf8'));
const keys = [...new Set(Object.values(data.photoMap))];
const miss = []; for (const k of keys) for (const v of [`photos/${k}-480.jpg`, `photos/${k}-900.jpg`, `photos/${k}-1240.jpg`, `photos-webp/${k}-480.webp`, `photos-webp/${k}-900.webp`, `photos-webp/${k}-1240.webp`]) if (!has('assets/' + v)) miss.push(v);
check(`${Object.keys(data.photoMap).length} photo assignments, ${keys.length} photo sets, 6 variants each`, Object.keys(data.photoMap).length === 84 && !miss.length, miss.slice(0, 4).join(', '));

// 5 manifest icons and fonts
const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
check('manifest icons exist', (man.icons || []).every(i => has(i.src)), (man.icons || []).map(i => i.src).join(', '));
// fonts: every font a stylesheet references must ship, every shipped font must be referenced (the release decides WHICH fonts; 15.6.0 ships only Fraunces),
// and every preloaded font must be one a stylesheet actually uses (a preload of an unused font is wasted bandwidth)
{
  const cssText = files.filter(f => f.endsWith('.css')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const referenced = new Set([...cssText.matchAll(/url\((?:'|")?(\/assets\/fonts\/[^)'"]+\.woff2)/g)].map(m => m[1]));
  const shipped = files.filter(f => f.endsWith('.woff2')).map(f => '/' + rel(f));
  const preloaded = new Set(html.flatMap(f => [...fs.readFileSync(f, 'utf8').matchAll(/<link[^>]+as="font"[^>]+href="([^"]+)"/g)].map(m => m[1])));
  const missingFont = [...referenced].filter(u => !has(u)), unusedFont = shipped.filter(u => !referenced.has(u)), badPreload = [...preloaded].filter(u => !referenced.has(u));
  check(`fonts: ${referenced.size} referenced, all shipped; none unused; ${preloaded.size} preload(s) all used`, !missingFont.length && !unusedFont.length && !badPreload.length && (!shipped.length || has('assets/fonts/LICENSES.txt')),   // a release without font files (project rule since 15.5.1) needs no licence file
    [...missingFont.map(u => 'missing ' + u), ...unusedFont.map(u => 'unused ' + u), ...badPreload.map(u => 'preload unused ' + u)].join(', '));
}
check('food icon sprite exists', has('assets/icons/foods.svg'));

// 6 no test fixtures or dev leftovers shipped
const text = files.filter(f => /\.(js|html|json|css|mjs)$/.test(f));
const bad = []; for (const f of text) { const t = fs.readFileSync(f, 'utf8'); if (/__mock_vision|__MOCK_|test-site-key|test-secret|test-token/.test(t)) bad.push(rel(f)); }
check('no test fixtures in shipped files', !bad.length, bad.join(', '));
check('no source maps or .DS_Store/Thumbs.db', !files.some(f => /\.map$|\.DS_Store$|Thumbs\.db$/.test(f)));
check('no .worker-copy or node_modules', !files.some(f => /\.worker-copy|node_modules/.test(f)));

// 7 strict CSP: no inline style attributes or inline scripts in pages
const inlineStyle = html.filter(f => /\sstyle="/.test(fs.readFileSync(f, 'utf8')));
const inlineScript = html.filter(f => /<script(?![^>]*\bsrc=)[^>]*>[^<]/i.test(fs.readFileSync(f, 'utf8')) && !/application\/ld\+json/.test(fs.readFileSync(f, 'utf8').match(/<script(?![^>]*\bsrc=)[^>]*>/i)?.[0] || ''));
check('no inline style="" attributes in pages (CSP style-src self)', !inlineStyle.length, inlineStyle.slice(0, 3).map(rel).join(', '));
check('no inline executable scripts in pages (CSP script-src self)', !inlineScript.length, inlineScript.slice(0, 3).map(rel).join(', '));

// 8 release stamp consistent
const stale = text.filter(f => /14\.0\.0/.test(fs.readFileSync(f, 'utf8')) && !/\.json$/.test(f)).map(rel);
check('no stale 14.0.0 stamps in shipped code/pages', !stale.length, stale.slice(0, 4).join(', '));

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} package checks passed; ${files.length} files, ${(files.reduce((s, f) => s + fs.statSync(f).size, 0) / 1048576).toFixed(1)} MB`);
process.exit(failed ? 1 : 0);
