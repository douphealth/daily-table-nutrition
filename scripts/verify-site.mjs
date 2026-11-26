/** Verify that site/ is exactly the released deployment: same file list, same bytes. No network access, no inference.
 *  The expected hashes are reference/site-v<version>-manifest.json, where <version> is package.json's version. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const site = join(root, 'site');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifestPath = join(root, 'reference', `site-v${pkg.version}-manifest.json`);
assert(existsSync(manifestPath), `No manifest for package.json version ${pkg.version}: run node scripts/write-manifest.mjs after a release build`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const IMAGE_RE = /\.(png|jpe?g|svg|webp|avif|gif|ico)$/i;

function walk(dir) {
  return readdirSync(dir).sort().flatMap(name => {
    const path = join(dir, name), stat = lstatSync(path);
    assert(!stat.isSymbolicLink(), `Symlink not allowed: ${path}`);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(site);
const nameOf = path => relative(site, path).split('\\').join('/');
assert.deepEqual(files.map(nameOf).sort(), Object.keys(manifest.files).sort(), 'Deployment file list changed');
for (const path of files) {
  const name = nameOf(path);
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
  assert.equal(hash, manifest.files[name], `Deployment file changed: ${name}`);
}
assert.equal(pkg.version, manifest.version, 'Project version drift');
assert.equal(files.length, manifest.fileCount, 'File count drift');
assert.equal(files.filter(path => IMAGE_RE.test(path)).length, manifest.imageCount, 'Image count drift');

// The release must say the same version everywhere a visitor or the owner can read it.
const worker = readFileSync(join(site, '_worker.js'), 'utf8');
assert(worker.includes(`build:'${pkg.version}'`), 'Worker build tag does not match package.json');
assert(readFileSync(join(site, 'sw.js'), 'utf8').includes(`daily-table-v${pkg.version}-`), 'Service-worker cache name does not match package.json');
assert(readFileSync(join(site, 'index.html'), 'utf8').includes(`assets/site.js?v=${pkg.version}`), 'Home page does not request this release');
// Standing repository rule: no font binaries and no archives in the deployment.
assert.equal(files.filter(path => /\.(woff2?|ttf|otf|eot|zip)$/i.test(path)).length, 0, 'Font binary or archive found in site/');

console.log(`PASS: v${manifest.version}; ${files.length} exact deployment files; ${manifest.imageCount} image files; no missing or changed bytes.`);
