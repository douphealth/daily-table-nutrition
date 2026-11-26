#!/usr/bin/env node
/**
 * Read-only production release preflight.
 * Never deploy the repository snapshot when it trails the live API build.
 * Usage: node scripts/check-live-release.mjs [origin]
 */
import { readFile } from 'node:fs/promises';

const origin = new URL(process.argv[2] || 'https://daily-table.gearuptofit.com/');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const local = String(pkg.version);
const routes = ['/api/vision/status', '/api/recipes/status'];
const statuses = [];

for (const route of routes) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(new URL(route, origin), {
      redirect: 'error', signal: controller.signal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const build = String(data.build || '');
    if (!/^\d+\.\d+\.\d+/.test(build)) throw new Error('missing or invalid build version');
    statuses.push({ route, build, enabled: data.enabled === true });
  } catch (err) {
    console.error('RELEASE CHECK FAILED:', route, err.message);
    process.exitCode = 2;
  } finally {
    clearTimeout(timeout);
  }
}

if (statuses.length !== routes.length) process.exit(2);
for (const entry of statuses) console.log(entry.route + ': live=' + entry.build + ', enabled=' + entry.enabled);
const versions = new Set(statuses.map(entry => entry.build));
if (versions.size !== 1) {
  console.error('BLOCK: production API endpoints disagree on build version.');
  process.exit(2);
}
const live = statuses[0].build;
const parts = version => version.split(/[.-]/).slice(0, 3).map(Number);
const a = parts(local), b = parts(live);
let cmp = 0;
for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) { cmp = Math.sign(a[i] - b[i]); break; } }
if (cmp < 0) {
  console.error('BLOCK: repository v' + local + ' is older than production v' + live + '. Recover production source before attempting deployment.');
  process.exit(3);
}
if (cmp > 0) {
  console.error('CAUTION: repository v' + local + ' is newer than production v' + live + '. Preview and acceptance testing required.');
  process.exit(4);
}
console.log('Version match (' + local + '). This is NOT proof of matching file hashes or feature readiness.');
