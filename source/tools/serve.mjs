// Local Cloudflare-Pages-like server for testing a built site folder.
// usage: node serve.mjs <siteRoot> <port> [--mock-ai]
// - applies _headers (incl. strict CSP) and _redirects exactly like Pages (simplified glob)
// - routes only /api/* through the REAL _worker.js (as _routes.json does)
// - --mock-ai: enables photo recognition with a TEST FIXTURE (fake AI binding + fake Turnstile verify).
//   The fixture lives only in this test harness; it is never shipped in the site.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import zlib from 'node:zlib';
const br = new Map();
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg)/;

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8788);
const mock = process.argv.includes('--mock-ai');
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.woff2':'font/woff2','.woff':'font/woff'};

const rd = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return ''; } };
const headerRules = []; // {re, headers:[[k,v]]}
{
  let cur = null;
  for (const line of rd('_headers').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { const pat = line.trim(); cur = {re: new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), headers: []}; headerRules.push(cur); }
    else if (cur) { const i = line.indexOf(':'); cur.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]); }
  }
}
const redirects = new Map();
for (const line of rd('_redirects').split(/\r?\n/)) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const [from, to, code] = t.split(/\s+/); if (from && to && !from.includes('*')) redirects.set(from, [to, Number(code || 302)]);
}

let worker = null;
const workerPath = path.join(root, '_worker.js');
if (fs.existsSync(workerPath)) {
  // _worker.js is an ES module without package.json "type": load through a data copy with .mjs
  const tmp = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '.worker-copy-' + port + '.mjs');
  fs.copyFileSync(workerPath, tmp);
  worker = (await import(pathToFileURL(tmp).href + '?t=' + Date.now())).default;
}

function resolveFile(p) {
  // Pages semantics: /dir/ -> dir/index.html ; /x -> x.html or redirect to /x/ if dir
  let rel = decodeURIComponent(p).replace(/^\/+/, '');
  const abs = f => path.join(root, f);
  const safe = f => path.resolve(abs(f)).startsWith(root);
  if (!safe(rel)) return null;
  if (p.endsWith('/')) { const f = rel + 'index.html'; return fs.existsSync(abs(f)) ? {file: abs(f)} : null; }
  if (fs.existsSync(abs(rel)) && fs.statSync(abs(rel)).isFile()) return {file: abs(rel)};
  if (fs.existsSync(abs(rel)) && fs.statSync(abs(rel)).isDirectory()) return {redirect: '/' + rel + '/'};
  if (fs.existsSync(abs(rel + '.html'))) return {file: abs(rel + '.html')};
  return null;
}

function applyHeaders(p, res, extra) {
  for (const r of headerRules) if (r.re.test(p)) for (const [k, v] of r.headers) res.setHeader(k, v);
  for (const [k, v] of Object.entries(extra || {})) res.setHeader(k, v);
}

const env = {
  ASSETS: {fetch: async req => {
    const u = new URL(req.url);
    const hit = resolveFile(u.pathname);
    if (hit?.file) return new Response(fs.readFileSync(hit.file), {headers: {'Content-Type': MIME[path.extname(hit.file).toLowerCase()] || 'application/octet-stream'}});
    return new Response('Not found', {status: 404});
  }}
};
if (mock) {
  env.PHOTO_RECOGNITION_ENABLED = 'true';
  env.TURNSTILE_SITE_KEY = 'test-site-key';
  env.TURNSTILE_SECRET_KEY = 'test-secret';
  // Scripted stand-in for Workers AI (test harness only; never shipped). Per-model behaviour via POST /__mock_models:
  //   {"<model id>": {delay, throw, code, vision, recipe, invalidFirst}}   calls are listed at GET /__mock_calls
  globalThis.__MOCK_CALLS__ = [];
  const mockPlan = req => { if (req.referencePlan) return JSON.parse(JSON.stringify(req.referencePlan)); const foods = req.items.map(i => i.key); return {status: 'recipe', style: 'salad', reason: 'ok', totalMinutes: 10, phases: [{action: 'prepare', foods, minutes: 5}, {action: 'toss', foods, minutes: 2}]}; };
  env.AI = {run: async (model, payload) => {
    const isRecipe = !!payload?.response_format?.json_schema?.properties?.phases;
    const script = globalThis.__MOCK_MODELS__?.[model] || {};
    const nth = globalThis.__MOCK_CALLS__.filter(c => c.model === model && c.kind === (isRecipe ? 'recipe' : 'vision')).length;
    globalThis.__MOCK_CALLS__.push({model, kind: isRecipe ? 'recipe' : 'vision', n: nth + 1, plain: !payload?.response_format});
    const delay = script.delay ?? globalThis.__MOCK_DELAY__ ?? 0;
    if (delay) await new Promise(r => setTimeout(r, delay));
    if (script.throw) throw Object.assign(new Error(script.throw), script.code ? {code: script.code} : {});
    if (isRecipe) {
      const req = JSON.parse(payload.messages[1].content);
      let out = script.recipe ?? globalThis.__MOCK_RECIPE__ ?? mockPlan(req);
      if (script.invalidFirst && nth === 0) { out = mockPlan(req); out.phases[1].foods = out.phases[1].foods.slice(0, -1); }
      return {response: JSON.stringify(out)};
    }
    return {response: JSON.stringify(script.vision ?? globalThis.__MOCK_VISION__ ?? {items: []})};
  }};
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
      // the test Turnstile stub encodes the widget action after a colon in the token ("test-token:recipe_ingredients")
      const action = String(JSON.parse(init.body).response).split(':')[1] || 'photo_ingredients';
      return new Response(JSON.stringify({success: true, hostname: globalThis.__LAST_HOST__ || 'localhost', action}), {headers: {'Content-Type': 'application/json'}});
    }
    return realFetch(url, init);
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost:' + port));
    globalThis.__LAST_HOST__ = u.hostname;
    if (u.pathname === '/__mock_vision' && mock && req.method === 'POST') {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); globalThis.__MOCK_DELAY__ = body.__delay || 0; delete body.__delay; globalThis.__MOCK_VISION__ = body; res.writeHead(204); return res.end();
    }
    if (u.pathname === '/__mock_models' && mock && req.method === 'POST') {
      const chunks = []; for await (const c of req) chunks.push(c);
      globalThis.__MOCK_MODELS__ = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); globalThis.__MOCK_CALLS__ = []; res.writeHead(204); return res.end();
    }
    if (u.pathname === '/__mock_calls' && mock && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(globalThis.__MOCK_CALLS__ || []));
    }
    if (u.pathname.startsWith('/api/') && worker) {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const r = await worker.fetch(new Request(u.href, {method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body}), env);
      res.statusCode = r.status; r.headers.forEach((v, k) => res.setHeader(k, v));
      applyHeaders(u.pathname, res); return res.end(Buffer.from(await r.arrayBuffer()));
    }
    const red = redirects.get(u.pathname);
    if (red) { res.writeHead(red[1], {Location: red[0]}); return res.end(); }
    const hit = resolveFile(u.pathname);
    if (hit?.redirect) { res.writeHead(308, {Location: hit.redirect + u.search}); return res.end(); }
    if (!hit) {
      const nf = path.join(root, '404.html');
      res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); applyHeaders(u.pathname, res);
      return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found');
    }
    const ext = path.extname(hit.file).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    applyHeaders(u.pathname, res);
    const stat = fs.statSync(hit.file);
    const ctype = String(res.getHeader('Content-Type') || '');
    if (/br/.test(req.headers['accept-encoding'] || '') && COMPRESSIBLE.test(ctype) && stat.size > 1024) {
      const key = hit.file + stat.mtimeMs;
      if (!br.has(key)) br.set(key, zlib.brotliCompressSync(fs.readFileSync(hit.file), {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 5}}));
      const body = br.get(key);
      res.setHeader('Content-Encoding', 'br'); res.setHeader('Vary', 'Accept-Encoding'); res.setHeader('Content-Length', body.length);
      if (req.method === 'HEAD') return res.end();
      return res.end(body);
    }
    res.setHeader('Content-Length', stat.size);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(hit.file).pipe(res);
  } catch (e) { res.statusCode = 500; res.end(String(e && e.stack || e)); }
});
server.listen(port, '127.0.0.1', () => console.log('serving', root, 'on http://127.0.0.1:' + port, mock ? '(mock-ai)' : ''));
