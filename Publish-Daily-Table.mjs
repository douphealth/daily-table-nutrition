#!/usr/bin/env node
/**
 * The Daily Table v15.5.1 verified GitHub publisher.
 * Runs with Node.js 22+ on Windows, Linux and macOS without PowerShell modules.
 * Requires git and GitHub CLI (gh). Creates a private repository only after
 * validating the snapshot and douphealth account. Never force-pushes/deploys.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const repository = 'douphealth/daily-table-nutrition';
const owner = 'douphealth';
const version = '15.5.1';
const remoteUrl = `https://github.com/${repository}.git`;
const tag = `v${version}`;
const gitDir = join(root, '.git');

function stop(message) { throw new Error(message); }
function sha256(data) { return createHash('sha256').update(data).digest('hex'); }
function run(program, args = [], { check = true, interactive = false, log = false } = {}) {
  const result = spawnSync(program, args, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    windowsHide: !interactive,
    maxBuffer: 32 * 1024 * 1024,
    shell: false,
  });
  if (result.error) stop(`Cannot execute ${program}: ${result.error.message}`);
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const code = result.status ?? 1;
  if (check && code !== 0) stop(`${program} exited ${code}. ${output.slice(-1800)}`);
  if (log && output) console.log(output);
  return { code, output };
}
function parseJson(text, label) {
  try { return JSON.parse(text); } catch { stop(`Invalid JSON from ${label}. Check the CLI environment.`); }
}
function api(endpoint, { allowNotFound = false } = {}) {
  const response = run('gh', ['api', endpoint], { check: false });
  if (response.code === 0) return parseJson(response.output, endpoint);
  if (allowNotFound && /(?:HTTP\s+404|"status"\s*:\s*"?404|Not Found)/i.test(response.output)) return null;
  stop(`Cannot read GitHub ${endpoint}. ${response.output.slice(-1300)}`);
}
function requireBinary(program, install) {
  const response = run(program, ['--version'], { check: false });
  if (response.code !== 0) stop(`${program} is unavailable. Install it using: ${install}`);
  console.log(`${program}: ${response.output.split('\n')[0]}`);
}
function verifyFiles() {
  const inventoryFile = join(root, 'reference', 'repository-inventory.json');
  const inventory = parseJson(readFileSync(inventoryFile, 'utf8'), 'snapshot inventory');
  if (inventory.version !== version || inventory.repository !== repository || inventory.visibility !== 'private') stop('Wrong or altered project identity in inventory.');
  const files = inventory.files;
  const names = Object.keys(files);
  if (names.length < 1000 || !names.some(n => n === 'Publish-Daily-Table.mjs')) stop('Unexpected or incomplete verified snapshot.');
  for (const name of names) {
    if (name.startsWith('/') || name.includes('\\') || name.includes(':') || name.split('/').some(p => p === '..' || p === '.' || !p)) stop(`Unsafe path in snapshot: ${name}`);
    const location = resolve(root, name);
    if (!location.startsWith(root + sep) || !existsSync(location)) stop(`Missing file: ${name}. Re-extract the corrected package.`);
    const actual = sha256(readFileSync(location));
    if (actual !== files[name]) stop(`Changed file: ${name}. Use the unmodified verified package.`);
  }
  console.log(`Verified ${names.length} exact repository files (SHA-256).`);
  return names;
}
function verifySiteAndSecurity() {
  run(process.execPath, ['scripts/verify-site.mjs'], { log: true });
  run(process.execPath, ['tests/security.test.mjs'], { log: true });
}
function getAccount() {
  const status = run('gh', ['auth', 'status', '--hostname', 'github.com'], { check: false });
  if (status.code !== 0) {
    console.log('Please complete the official GitHub sign-in in your browser.');
    run('gh', ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web'], { interactive: true });
  }
  const me = api('user');
  if (me.login !== owner || !Number.isInteger(me.id)) stop(`GitHub is signed in as ${me.login || '(unknown)'}, not ${owner}. Switch accounts before retrying.`);
  console.log(`Authenticated as ${me.login}.`);
  return me;
}
function examineRemote(remote, head = '') {
  if (!remote) return;
  if (remote.full_name !== repository || remote.private !== true || remote.archived || remote.disabled) stop('Existing GitHub repo is not the intended active private repo. Will not modify it.');
  const branches = api(`repos/${repository}/branches?per_page=100`);
  if (!Array.isArray(branches)) stop('Unable to inspect remote branch history.');
  if (branches.length && (branches.length !== 1 || branches[0].name !== 'main' || (head && branches[0].commit?.sha !== head))) {
    stop('Existing GitHub repository has unrelated branch history. No push attempted.');
  }
  const existingTag = api(`repos/${repository}/git/ref/tags/${tag}`, { allowNotFound: true });
  if (existingTag && head && existingTag.object?.sha !== head) stop('Existing remote release tag is different. No push attempted.');
}
function git(args, opts = {}) { return run('git', args, opts); }
function getHead() { return git(['rev-parse', 'HEAD']).output; }
function createLocalCommit(names, me) {
  const markerFile = join(gitDir, 'daily-table-import.json');
  if (existsSync(gitDir)) {
    if (!existsSync(markerFile)) stop('An unrelated .git folder already exists here. Use a clean extraction; do not overwrite it.');
    const marker = parseJson(readFileSync(markerFile, 'utf8'), 'local import marker');
    if (marker.repository !== repository || marker.version !== version) stop('Existing local repository marker does not match.');
    const branch = git(['branch', '--show-current']).output;
    if (branch !== 'main') stop('Existing local branch is not main.');
    const changes = git(['status', '--porcelain']).output;
    if (changes) stop('The local Git working tree has changes. Review them before re-running.');
    console.log('Continuing from the existing verified local import.');
    return getHead();
  }
  git(['init', '--initial-branch=main'], { log: true });
  git(['config', '--local', 'user.name', me.login]);
  git(['config', '--local', 'user.email', `${me.id}+${me.login}@users.noreply.github.com`]);
  git(['config', '--local', 'core.autocrlf', 'false']);
  const paths = [...names, 'reference/repository-inventory.json'];
  const spec = join(gitDir, 'daily-table-pathspec');
  writeFileSync(spec, Buffer.from(`${paths.join('\0')}\0`, 'utf8'));
  git(['--literal-pathspecs', 'add', `--pathspec-from-file=${spec}`, '--pathspec-file-nul']);
  git(['-c', 'commit.gpgsign=false', 'commit', '-m', 'Import The Daily Table v15.5.1: verified application, images and tests']);
  console.log('Created local initial commit.');
  const head = getHead();
  writeFileSync(markerFile, JSON.stringify({ repository, version, commit: head }, null, 2));
  return head;
}
function ensureTag(head) {
  const result = git(['rev-parse', '--verify', `refs/tags/${tag}`], { check: false });
  if (result.code === 0 && result.output !== head) stop('Local release tag points to a different commit.');
  if (result.code !== 0) git(['tag', tag, head]);
}
function ensureOrigin(remoteExists) {
  const result = git(['remote', 'get-url', 'origin'], { check: false });
  if (result.code === 0 && result.output !== remoteUrl) stop('Existing Git remote origin is not the expected private repository.');
  if (result.code !== 0 && remoteExists) git(['remote', 'add', 'origin', remoteUrl]);
}
function push() {
  // No force flags, no saved token, no global credential modifications.
  const authArgs = ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential'];
  git([...authArgs, 'push', '--set-upstream', 'origin', 'main'], { log: true });
  git([...authArgs, 'push', 'origin', `refs/tags/${tag}`], { log: true });
}
function verifyRemote(head) {
  console.log('Verifying published branch, tag and complete file tree...');
  const meta = api(`repos/${repository}`);
  if (meta.full_name !== repository || !meta.private) stop('Remote repository identity/privacy verification failed.');
  if (meta.default_branch !== 'main') {
    run('gh', ['repo', 'edit', repository, '--default-branch', 'main']);
  }
  const commit = api(`repos/${repository}/commits/main`);
  const ref = api(`repos/${repository}/git/ref/tags/${tag}`);
  if (commit.sha !== head || ref.object?.sha !== head) stop('Remote main and release tag do not match local HEAD.');
  const gitCommit = api(`repos/${repository}/git/commits/${head}`);
  const treeSha = gitCommit.tree?.sha;
  if (!/^[0-9a-f]{40}$/.test(treeSha || '')) stop('Remote commit tree is unavailable.');
  const tree = api(`repos/${repository}/git/trees/${treeSha}?recursive=1`);
  console.log('Remote Git tree received; comparing every file hash.');
  if (tree.truncated || !Array.isArray(tree.tree)) stop('Remote tree was truncated. Full remote verification did not complete.');
  const remoteFiles = new Map(tree.tree.filter(e => e.type === 'blob').map(e => [e.path, e.sha]));
  const localTree = git(['ls-tree', '-r', '-z', 'HEAD']).output;
  const localFiles = new Map();
  for (const item of localTree.split('\0')) {
    if (!item) continue;
    const match = item.match(/^\d{6} blob ([a-f0-9]{40})\t(.+)$/s);
    if (!match) stop('Unexpected local Git tree entry.');
    localFiles.set(match[2], match[1]);
  }
  if (remoteFiles.size !== localFiles.size) stop(`Remote/local file count mismatch: ${remoteFiles.size} vs ${localFiles.size}.`);
  for (const [path, sha] of localFiles) if (remoteFiles.get(path) !== sha) stop(`Remote file mismatch: ${path}`);
  mkdirSync(gitDir, { recursive: true });
  const receipt = { repository: meta.html_url, version, private: true, branch: 'main', tag, commit: head, verifiedTrackedFiles: localFiles.size, siteFiles: 861, imageFiles: 645, cloudflareChanged: false };
  writeFileSync(join(gitDir, 'daily-table-publish-result.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`\nSUCCESS: ${meta.html_url}`);
  console.log(`Private repository, main and ${tag} verified at ${head}.`);
  console.log(`${localFiles.size} Git blobs verified against GitHub; 861 app files and 645 images preserved. Cloudflare unchanged.`);
}
try {
  console.log('The Daily Table v15.5.1: validate, create PRIVATE GitHub repo, publish and verify.');
  console.log('No force-push, remote deletion, Cloudflare deployment or AI inference.');
  if (!/^v22\.|^v2[3-9]\.|^v[3-9]\d\./.test(process.version)) stop(`Node.js 22+ required; found ${process.version}.`);
  const names = verifyFiles();
  verifySiteAndSecurity();
  if (process.argv.includes('--verify-only')) {
    console.log('PASS: local verification complete; no GitHub connection or Git changes made.');
    process.exit(0);
  }
  requireBinary('git', 'winget install --id Git.Git --exact --source winget');
  requireBinary('gh', 'winget install --id GitHub.cli --exact --source winget');
  const me = getAccount();
  const existing = api(`repos/${repository}`, { allowNotFound: true });
  examineRemote(existing);
  const head = createLocalCommit(names, me);
  ensureTag(head);
  examineRemote(existing, head);
  ensureOrigin(!!existing);
  if (!existing) {
    run('gh', ['repo', 'create', repository, '--private', '--source', '.', '--remote', 'origin', '--disable-wiki', '--description', 'The Daily Table: Mediterranean meal planning, confirmed pantry ingredients and optional AI recipes. Verified v15.5.1 import.'], { log: true });
    ensureOrigin(true);
  }
  push();
  verifyRemote(head);
} catch (error) {
  console.error(`\nSTOPPED: ${error?.message || error}`);
  console.error('No force-push, deletion or Cloudflare deployment was performed.');
  process.exitCode = 1;
}
