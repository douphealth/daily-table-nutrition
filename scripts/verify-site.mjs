/** Verify the exact released deployment, without network access or inference. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const site = join(root, 'site');
const manifest = JSON.parse(readFileSync(join(root, 'reference/site-v15.5.1-manifest.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
function walk(dir) {
  return readdirSync(dir).sort().flatMap(name => {
    const path = join(dir, name), stat = lstatSync(path);
    assert(!stat.isSymbolicLink(), `Symlink not allowed: ${path}`);
    return stat.isDirectory() ? walk(path) : [path];
  });
}
const files = walk(site);
const actualNames = files.map(path => relative(site, path).split('\\').join('/')).sort();
assert.deepEqual(actualNames, Object.keys(manifest.files).sort(), 'Deployment file list changed');
for (const path of files) {
  const name = relative(site, path).split('\\').join('/');
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
  assert.equal(hash, manifest.files[name], `Deployment file changed: ${name}`);
}
assert.equal(pkg.version, manifest.version, 'Project version drift');
assert.equal(files.length, 861);
assert.equal(files.filter(path => /\.(png|jpe?g|svg|webp|avif|gif|ico)$/i.test(path)).length, 645);
console.log(`PASS: v${manifest.version}; ${files.length} exact deployment files; ${manifest.imageCount} image files; no missing or changed bytes.`);
