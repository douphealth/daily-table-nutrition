// Patch toolkit for building a release FROM A SHIPPED PACKAGE (instead of from v14). Every edit is an exact-string replacement with an expected match count: if the
// baseline drifts (a newer package, a different build), the patch FAILS LOUDLY instead of silently doing nothing or the wrong thing.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
export const walk = d => fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
export const TEXT_RE = /\.(html|js|mjs|css|json|txt|xml|webmanifest|svg|md)$/i;
export const isTextFile = f => TEXT_RE.test(f) || ['_headers', '_redirects'].includes(path.basename(f));

export class Ctx {
  constructor(root, assetsDir) { this.root = root; this.assetsDir = assetsDir; this.notes = []; this.touched = new Set(); }
  abs(rel) { return path.join(this.root, ...rel.split('/')); }
  exists(rel) { return fs.existsSync(this.abs(rel)); }
  read(rel) { return fs.readFileSync(this.abs(rel), 'utf8'); }
  write(rel, text) { fs.mkdirSync(path.dirname(this.abs(rel)), {recursive: true}); fs.writeFileSync(this.abs(rel), text); this.touched.add(rel); }
  asset(name) { return fs.readFileSync(path.join(this.assetsDir, name), 'utf8'); }
  /** Replace an exact string. `expect` = how many times it must occur (default 1). */
  edit(rel, from, to, {expect = 1, label = ''} = {}) {
    const text = this.read(rel);
    const n = text.split(from).length - 1;
    if (n !== expect) throw new Error(`patch anchor mismatch in ${rel}${label ? ' (' + label + ')' : ''}: found ${n}, expected ${expect}: ${JSON.stringify(from.slice(0, 110))}`);
    this.write(rel, text.split(from).join(typeof to === 'function' ? to() : to));
  }
  /** Replace with a regular expression (all matches); the number of matches must equal `expect`. */
  editRe(rel, re, to, {expect = 1, label = ''} = {}) {
    const text = this.read(rel);
    let n = 0;
    const out = text.replace(re, (...a) => { n++; return typeof to === 'function' ? to(...a) : to; });
    if (n !== expect) throw new Error(`patch regex mismatch in ${rel}${label ? ' (' + label + ')' : ''}: ${n} matches, expected ${expect}: ${re}`);
    this.write(rel, out);
  }
  copyBinary(srcAbs, destRel) { fs.mkdirSync(path.dirname(this.abs(destRel)), {recursive: true}); fs.copyFileSync(srcAbs, this.abs(destRel)); this.touched.add(destRel); }
  /** Apply an exact-string edit to every page (*.html); each page must contain the anchor exactly `perPage` times. Returns the page count. */
  editPages(from, to, {perPage = 1, label = ''} = {}) {
    let n = 0;
    for (const f of walk(this.root)) {
      if (!f.endsWith('.html')) continue;
      const rel = path.relative(this.root, f).split(path.sep).join('/');
      this.edit(rel, from, to, {expect: perPage, label: label + ' ' + rel});
      n++;
    }
    return n;
  }
  /** Every page of the package, as package-relative paths. */
  pages() { return walk(this.root).filter(f => f.endsWith('.html')).map(f => path.relative(this.root, f).split(path.sep).join('/')); }
  rename(from, to) {
    if (!this.exists(from)) throw new Error('rename: missing ' + from);
    if (this.exists(to)) throw new Error('rename: target exists ' + to);
    fs.mkdirSync(path.dirname(this.abs(to)), {recursive: true});
    fs.renameSync(this.abs(from), this.abs(to));
  }
  note(msg) { this.notes.push(msg); console.log('    ' + msg); }
}
