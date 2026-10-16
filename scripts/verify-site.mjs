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
const patchedGitBlobs = {
 'assets/chunks/photo-journey-15.5.1.js': '2f35b37fdf1c9052eb561c3e431e91d38bdb7298',
 'assets/app-v15.css': 'f5a02a367ff38e622962afc74795835b913f130e',
 'sw.js': '923dcd9eaf893a22ba39fcf7d054d5e5b9655848',
};

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
  if (patchedGitBlobs[name]) { const bytes=readFileSync(path); const gitSha=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'); assert.equal(gitSha,patchedGitBlobs[name],`Pantry patch file changed: ${name}`); } else assert.equal(hash, manifest.files[name], `Deployment file changed: ${name}`);
}
assert.equal(pkg.version, manifest.version, 'Project version drift');
assert.equal(files.length, 861);
assert.equal(files.filter(path => /\.(png|jpe?g|svg|webp|avif|gif|ico)$/i.test(path)).length, 645);
console.log(`PASS: v${manifest.version}; ${files.length} exact deployment files; ${manifest.imageCount} image files; no missing or changed bytes.`);
