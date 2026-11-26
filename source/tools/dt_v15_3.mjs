// The Daily Table 15.2.0 -> 15.3.0 release patch.
//   1. every canonical / og / schema / sitemap / robots / llms.txt URL moves from the pages.dev host to
//      https://daily-table.gearuptofit.com
//   2. llms.txt recipe links use the final slugs (the legacy ids only 301)
//   3. visible, crawlable attribution to GearUpToFit: footer line on every page, one sentence on the About page,
//      parentOrganization / publisher in the home page JSON-LD, a Publisher section in llms.txt
// It edits a RELEASE folder (the unzipped Cloudflare upload) in place. Idempotent. Run the project's own
// tools/bump-version.mjs afterwards (15.2.0 -> 15.3.0) so the ?v= stamps, service-worker cache names and the
// visible release label move together.
//
// usage: node dt_v15_3.mjs <releaseRoot> [--dry] [--check]
//   --dry    report what would change, write nothing
//   --check  only run the verification suite (exit 1 on any failure)
import fs from 'node:fs';
import path from 'node:path';

const FROM = 'https://daily-table-nutrition.pages.dev';
const TO = 'https://daily-table.gearuptofit.com';
const MAIN = 'https://gearuptofit.com/';
const MAIN_ORG = { '@type': 'Organization', '@id': 'https://gearuptofit.com/#organization', name: 'Gear Up to Fit', url: MAIN };
const CREDIT = `<p class="footer-credit"><a href="${MAIN}">A free tool from GearUpToFit</a></p>`;
const ABOUT_ANCHOR = 'The Daily Table is a douphealth cooking and meal-planning project.';
const ABOUT_ADD = ` It is published as a free tool on <a href="${MAIN}">GearUpToFit</a>.`;
const CSS_MARK = '/* gutf-attribution */';
const CSS_ADD = `\n${CSS_MARK}\n.footer-credit{margin:10px 0 0;font-size:var(--fs-sm)}\n.footer-credit a{display:inline-flex;align-items:center;min-height:32px;color:var(--hero-text);opacity:.86;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}\n.footer-credit a:hover{opacity:1}\n.footer-credit a:focus-visible{outline:2px solid var(--champ-300);outline-offset:3px;border-radius:4px}\n`;
const PUBLISHER_MD = `## Publisher\n- [GearUpToFit](${MAIN}): the site that publishes The Daily Table. It also hosts [nutrition guides](${MAIN}nutrition/) and [fitness calculators](${MAIN}calculators/).\n\n`;

const args = process.argv.slice(2);
const root = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const dry = args.includes('--dry');
const checkOnly = args.includes('--check');
if (!fs.existsSync(path.join(root, 'index.html')) || !fs.existsSync(path.join(root, '_worker.js'))) {
  console.error('not a Daily Table release folder (index.html / _worker.js missing): ' + root);
  process.exit(2);
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const rel = (f) => path.relative(root, f).split(path.sep).join('/');
const TEXT = /\.(html|xml|txt|json|webmanifest|js|css|svg|mjs)$/i;
const isText = (f) => TEXT.test(f) || ['_headers', '_redirects'].includes(path.basename(f));
const read = (f) => fs.readFileSync(f, 'utf8');
const write = (f, t) => { if (!dry) fs.writeFileSync(f, t); };
const files = walk(root);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
// legacy recipe id path -> final slug path, from _redirects ("/recipes/oats/ /recipes/greek-yogurt-oats-banana/ 301")
function loadLegacy() {
  const map = new Map();
  for (const line of read(path.join(root, '_redirects')).split(/\r?\n/)) {
    const m = line.trim().match(/^(\/recipes\/[A-Za-z0-9]+\/)\s+(\/recipes\/[a-z0-9-]+\/)\s+301$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}
const log = [];
const note = (m) => { log.push(m); console.log(m); };

// ------------------------------------------------------------------------------------------------ patch
function patch() {
  // 1. host swap (the host occurs only in html / xml / txt / json; refuse to touch anything else silently)
  let swapped = 0, hits = 0;
  const kinds = {};
  for (const f of files) {
    if (!isText(f)) continue;
    const t = read(f);
    if (!t.includes(FROM)) continue;
    const ext = path.extname(f).toLowerCase() || path.basename(f);
    if (!['.html', '.xml', '.txt', '.json'].includes(ext)) throw new Error('unexpected host reference in ' + rel(f));
    const n = t.split(FROM).length - 1;
    write(f, t.split(FROM).join(TO));
    swapped++; hits += n; kinds[ext] = (kinds[ext] || 0) + 1;
  }
  note(`host swap: ${hits} references in ${swapped} files ${JSON.stringify(kinds)}`);

  // 2. llms.txt: legacy recipe ids -> final slugs (from _redirects), then the Publisher section
  const llmsPath = path.join(root, 'llms.txt');
  let llms = read(llmsPath);
  const legacy = new Map();
  for (const [from, to] of loadLegacy()) legacy.set(from.split('/')[2], to);
  let remapped = 0;
  llms = llms.replace(new RegExp(`\\]\\(${TO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/recipes/([^/)]+)/\\)`, 'g'), (all, id) => {
    if (legacy.has(id)) { remapped++; return `](${TO}${legacy.get(id)})`; }
    return all;
  });
  note(`llms.txt: ${remapped} legacy recipe links -> final slugs`);
  if (!llms.includes('## Publisher')) {
    const marker = '## Sources, standards and limits';
    if (!llms.includes(marker)) throw new Error('llms.txt anchor missing: ' + marker);
    llms = llms.replace(marker, PUBLISHER_MD + marker);
    note('llms.txt: Publisher section added');
  }
  write(llmsPath, llms);

  // 3a. footer credit on every page, directly after the focus-trust paragraph
  let credited = 0;
  for (const f of htmlFiles) {
    let t = read(f);
    if (t.includes('class="footer-credit"')) continue;
    const re = /(<p class="focus-trust">.*?<\/p>)/s;
    if (!re.test(t)) throw new Error('focus-trust paragraph missing in ' + rel(f));
    t = t.replace(re, `$1${CREDIT}`);
    write(f, t);
    credited++;
  }
  note(`footer credit: added to ${credited} pages`);

  // 3b. About page sentence
  const aboutPath = path.join(root, 'about', 'index.html');
  let about = read(aboutPath);
  if (!about.includes(ABOUT_ADD)) {
    if (about.split(ABOUT_ANCHOR).length !== 2) throw new Error('About anchor not found exactly once');
    about = about.replace(ABOUT_ANCHOR, ABOUT_ANCHOR + ABOUT_ADD);
    write(aboutPath, about);
    note('about: attribution sentence added');
  }

  // 3c. home JSON-LD: WebSite.publisher -> Organization, Organization.parentOrganization -> GearUpToFit
  const homePath = path.join(root, 'index.html');
  let home = read(homePath);
  const ldRe = /<script type="application\/ld\+json">(.*?)<\/script>/s;
  const m = home.match(ldRe);
  if (!m) throw new Error('home JSON-LD block missing');
  const ld = JSON.parse(m[1]);
  const graph = ld['@graph'];
  const site = graph.find((n) => n['@type'] === 'WebSite');
  const org = graph.find((n) => n['@type'] === 'Organization');
  if (!site || !org) throw new Error('home JSON-LD WebSite/Organization node missing');
  if (!org.parentOrganization) {
    org.parentOrganization = MAIN_ORG;
    site.publisher = { '@id': org['@id'] };
    home = home.replace(ldRe, () => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
    write(homePath, home);
    note('home JSON-LD: publisher + parentOrganization added');
  }

  // 3d. stylesheet
  const cssPath = path.join(root, 'assets', 'app-v15.css');
  const css = read(cssPath);
  if (!css.includes(CSS_MARK)) { write(cssPath, css.replace(/\s*$/, '') + CSS_ADD); note('css: .footer-credit rules appended'); }
}

// ------------------------------------------------------------------------------------------------ verify
function verify() {
  const results = [];
  const check = (name, ok, detail = '') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' - ' + detail : '')); };

  // no pages.dev host left anywhere in any text file
  const left = files.filter((f) => isText(f) && read(f).includes(FROM)).map(rel);
  check('no pages.dev host left in any shipped text file', !left.length, left.slice(0, 5).join(', '));

  // canonical + og:url on every indexable page. The release also ships one page per legacy recipe id
  // (/recipes/<id>/); _redirects 301s those, and their canonical must be the final slug URL.
  const legacyMap = loadLegacy();
  const pagePath = (f) => {
    const r = rel(f);
    const p = r === 'index.html' ? '/' : '/' + r.replace(/index\.html$/, '');
    return legacyMap.get(p) || p;
  };
  const badCanon = [], badOg = [];
  let indexable = 0;
  for (const f of htmlFiles) {
    const t = read(f);
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(t) || /<meta[^>]+content="[^"]*noindex[^"]*"[^>]+name="robots"/i.test(t)) continue;
    const c = t.match(/<link[^>]+rel="canonical"[^>]*>/i);
    if (!c) { if (rel(f) !== '404.html') badCanon.push(rel(f) + ' (missing)'); continue; }
    indexable++;
    const href = (c[0].match(/href="([^"]+)"/) || [])[1];
    if (href !== TO + pagePath(f)) badCanon.push(`${rel(f)} -> ${href}`);
    const og = (t.match(/<meta[^>]+property="og:url"[^>]*>/i) || [''])[0].match(/content="([^"]+)"/);
    if (og && og[1] !== href) badOg.push(`${rel(f)} og:url ${og[1]}`);
  }
  check(`canonical equals ${TO}<path> on all ${indexable} indexable pages`, !badCanon.length, badCanon.slice(0, 4).join(' | '));
  check('og:url equals canonical wherever present', !badOg.length, badOg.slice(0, 4).join(' | '));

  // sitemap
  const sm = read(path.join(root, 'sitemap.xml'));
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const smBad = locs.filter((u) => !u.startsWith(TO + '/'));
  const smMissing = locs.filter((u) => { const p = u.slice(TO.length); return !fs.existsSync(path.join(root, p.replace(/^\//, ''), 'index.html')) && !(p === '/' && fs.existsSync(path.join(root, 'index.html'))); });
  check(`sitemap: ${locs.length} URLs, all on ${TO}, all backed by a page`, locs.length > 80 && !smBad.length && !smMissing.length && new Set(locs).size === locs.length, [...smBad, ...smMissing].slice(0, 3).join(', '));

  // robots
  check('robots.txt declares the subdomain sitemap', read(path.join(root, 'robots.txt')).includes(`Sitemap: ${TO}/sitemap.xml`));

  // llms.txt
  const llms = read(path.join(root, 'llms.txt'));
  const llmsUrls = [...llms.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]).filter((u) => u.startsWith(TO));
  const llmsDead = llmsUrls.filter((u) => { const p = u.slice(TO.length).split('#')[0]; return !fs.existsSync(path.join(root, p.replace(/^\//, ''), 'index.html')); });
  check(`llms.txt: ${llmsUrls.length} own URLs all resolve to a real page (no legacy ids)`, llmsUrls.length > 80 && !llmsDead.length, llmsDead.slice(0, 3).join(', '));
  check('llms.txt names the publisher', llms.includes('## Publisher') && llms.includes(MAIN));

  // attribution
  const noCredit = htmlFiles.filter((f) => (read(f).match(/class="footer-credit"/g) || []).length !== 1).map(rel);
  check(`footer credit present exactly once on all ${htmlFiles.length} pages`, !noCredit.length, noCredit.slice(0, 3).join(', '));
  check('About page links to GearUpToFit', read(path.join(root, 'about', 'index.html')).includes(ABOUT_ADD));
  const css = read(path.join(root, 'assets', 'app-v15.css'));
  check('stylesheet carries the .footer-credit rules', css.includes(CSS_MARK) && css.includes('.footer-credit a'));

  // every JSON-LD block parses; home graph links to the main site
  let ldBlocks = 0; const ldBad = [];
  for (const f of htmlFiles) for (const m of read(f).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) { ldBlocks++; try { JSON.parse(m[1]); } catch { ldBad.push(rel(f)); } }
  check(`all ${ldBlocks} JSON-LD blocks parse`, !ldBad.length, ldBad.slice(0, 3).join(', '));
  try {
    const g = JSON.parse(read(path.join(root, 'index.html')).match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
    const org = g.find((n) => n['@type'] === 'Organization'), site = g.find((n) => n['@type'] === 'WebSite');
    check('home JSON-LD: Organization.parentOrganization -> main site, WebSite.publisher -> Organization', org?.parentOrganization?.['@id'] === MAIN_ORG['@id'] && site?.publisher?.['@id'] === org['@id'] && org['@id'].startsWith(TO));
  } catch (e) { check('home JSON-LD graph', false, String(e.message)); }

  // untouched on purpose
  check('_headers, _redirects, _routes.json, _worker.js untouched by this patch (no pages.dev host in them)', ['_headers', '_redirects', '_routes.json', '_worker.js'].every((n) => !read(path.join(root, n)).includes(FROM)));

  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  return failed === 0;
}

if (!checkOnly) { patch(); console.log(dry ? '\n[dry run: nothing written]' : '\npatch applied'); }
if (!dry) process.exit(verify() ? 0 : 1);
