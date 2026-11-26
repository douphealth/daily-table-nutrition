// Observed (not simulated) paint times of a page under phone-like throttling: slow 4G (150 ms latency, 1.6 Mbps) and a 4x slower CPU.
// Fresh profile, service worker blocked, cache disabled. Prints FCP, LCP (time, element), when the hero image element entered the DOM,
// and when each start-up request finished, so two builds can be compared line by line.
// usage: node probe-lcp.mjs <url> [runs=3] [width=390] [height=844] [phone|none]
import {launch, sleep} from './lib.mjs';
const [url, runs = '3', w = '390', h = '844', throttle = 'phone'] = process.argv.slice(2);
const browser = await launch();
const out = [];
for (let i = 0; i < Number(runs); i++) {
  const ctx = await browser.newContext({viewport: {width: Number(w), height: Number(h)}, isMobile: true, hasTouch: true, deviceScaleFactor: 2, serviceWorkers: 'block'});
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const S = window.__p = {lcp: 0, lcpEl: '', fcp: 0, heroAt: 0, longTasks: []};
    new PerformanceObserver(l => { for (const e of l.getEntries()) { S.lcp = Math.round(e.startTime); S.lcpEl = e.element ? e.element.tagName.toLowerCase() + '.' + String(e.element.className).split(/\s+/)[0] + ' ' + (e.url || '').split('/').pop() : '?'; } }).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') S.fcp = Math.round(e.startTime); }).observe({type: 'paint', buffered: true});
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) S.longTasks.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({type: 'longtask', buffered: true}); } catch {}
    const look = () => { if (!S.heroAt && document.querySelector('.home-hero img, .home-hero .food-photo, .ex-home-hero img')) S.heroAt = Math.round(performance.now()); };
    document.addEventListener('DOMContentLoaded', () => { look(); new MutationObserver(look).observe(document.documentElement, {subtree: true, childList: true}); });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
  if (throttle !== 'none') { await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8}); await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4}); }
  await page.goto(url, {waitUntil: 'load', timeout: 90000});
  await sleep(5000);
  const p = await page.evaluate(() => ({...window.__p, res: performance.getEntriesByType('resource').map(r => [r.name.replace(location.origin, '').split('?')[0].split('/').slice(-1)[0], Math.round(r.startTime), Math.round(r.responseEnd)])}));
  out.push(p);
  const lt = p.longTasks.filter(t => t[0] < p.lcp);
  console.log(`run ${i + 1}: FCP ${p.fcp}  LCP ${p.lcp} (${p.lcpEl})  hero element in DOM at ${p.heroAt}  long tasks before LCP: ${lt.length}, ${lt.reduce((a, t) => a + t[1], 0)} ms`);
  if (i === 0) console.log('   requests (start-end ms): ' + p.res.sort((a, b) => a[2] - b[2]).map(r => `${r[0]} ${r[1]}-${r[2]}`).join(' | '));
  await ctx.close();
}
const med = k => out.map(o => o[k]).sort((a, b) => a - b)[Math.floor(out.length / 2)];
console.log(`median: FCP ${med('fcp')}  LCP ${med('lcp')}  hero in DOM ${med('heroAt')}`);
await browser.close();
