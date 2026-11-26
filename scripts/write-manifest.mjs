/** Writes reference/site-v<version>-manifest.json: one SHA-256 per file in site/. Run it once per release, after site/ is final.
 *  usage: node scripts/write-manifest.mjs [--archive <upload.zip name> --archive-sha256 <hex>] [--baseline <version> --baseline-files <n>]
 *  The version is read from package.json. Nothing is uploaded or deployed. */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const site = join(root, 'site');
const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
export const IMAGE_RE = /\.(png|jpe?g|svg|webp|avif|gif|ico)$/i;

function walk(dir) {
  return readdirSync(dir).sort().flatMap(name => {
    const path = join(dir, name), stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Symlink not allowed: ${path}`);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

const files = {};
let bytes = 0;
for (const path of walk(site)) {
  const data = readFileSync(path);
  bytes += data.length;
  files[relative(site, path).split('\\').join('/')] = createHash('sha256').update(data).digest('hex');
}
const names = Object.keys(files).sort();
const manifest = {
  version: pkg.version,
  deploymentArchive: arg('archive'),
  deploymentArchiveSHA256: arg('archive-sha256') ? arg('archive-sha256').toLowerCase() : null,
  builtFrom: arg('baseline') ? { release: arg('baseline'), fileCount: Number(arg('baseline-files')) || null } : null,
  fileCount: names.length,
  imageCount: names.filter(n => IMAGE_RE.test(n)).length,
  totalBytes: bytes,
  files: Object.fromEntries(names.map(n => [n, files[n]]))
};
mkdirSync(join(root, 'reference'), { recursive: true });
const out = join(root, 'reference', `site-v${pkg.version}-manifest.json`);
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${relative(root, out)}: ${manifest.fileCount} files, ${manifest.imageCount} images, ${bytes} bytes`);
