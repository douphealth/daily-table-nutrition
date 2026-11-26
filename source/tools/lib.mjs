import {chromium} from 'playwright-core';
export const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const VIEWPORTS = {320: [320, 700], 390: [390, 844], 430: [430, 932], 768: [768, 1024], 1024: [1024, 768], 1440: [1440, 900]};
export async function launch(opts = {}) {
  return chromium.launch({executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1', ...(opts.args || [])]});
}
export async function newPage(browser, {w = 390, h = 844, scheme = 'light', reduced = 'no-preference', mobile = w < 768, storage = null, base = '', dsf = 1} = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, colorScheme: scheme, reducedMotion: reduced, deviceScaleFactor: dsf, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'allow', permissions: []});
  if (storage) await ctx.addInitScript(([k, v]) => { try { if (!sessionStorage.getItem('__seeded')) { for (const [kk, vv] of Object.entries(k)) localStorage.setItem(kk, vv); sessionStorage.setItem('__seeded', '1'); } } catch {} }, [storage, null]);
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', e => page.__errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') page.__errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => page.__errors.push('requestfailed: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  return {page, ctx};
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
