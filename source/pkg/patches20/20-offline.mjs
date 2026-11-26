// 15.20 · the offline page.
// The live page is a bare card: no icon links (the browser asks for /favicon.ico and logs a 404), no publisher credit (the one page of 194
// that fails the publisher check), and a single link. It is the page a cook sees with wet hands and no signal, so it should say what still
// works and offer the places that usually do.
const PAGE = v => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#2b4332"><title>You're offline | The Daily Table</title><link href="/assets/brand/favicon.svg" rel="icon" type="image/svg+xml"><link href="/assets/brand/favicon-32.png" rel="icon" sizes="32x32"><link href="/assets/brand/apple-touch-icon.png" rel="apple-touch-icon"><link rel="stylesheet" href="/assets/app-v15.css?v=${v}"><link rel="stylesheet" href="/assets/premium-home-${v}.css?v=${v}"><link rel="stylesheet" href="/assets/polish-15.20.0.css?v=${v}"></head><body data-page="offline"><main class="dt-offline-shell" id="main"><span class="dt-offline-mark" aria-hidden="true"><svg fill="none" viewBox="0 0 64 64"><rect fill="#2b4332" height="64" rx="20" width="64"></rect><path d="M15 35h34a17 17 0 0 1-34 0Z" fill="#f6f0df"></path><path d="M22 53h20" stroke="#f6f0df" stroke-linecap="round" stroke-width="3"></path><path d="M32 31c-1-12 5-20 16-20-1 12-8 18-16 20Z" fill="#c7d09d"></path><path d="m32 31 10-13" stroke="#2b4332" stroke-width="2"></path><circle cx="21" cy="23" fill="#d99570" r="5"></circle></svg></span><p class="dt-offline-kicker">The Daily Table</p><h1>You're offline.</h1><p>This page hasn't been opened on this device yet, so it can't be shown without a connection. Your saved kitchen, plan and shopping list stay on this device.</p><nav class="dt-offline-actions" aria-label="Pages that usually work offline"><a href="/">Home</a><a class="dt-offline-quiet" href="/recipes/">Recipes</a><a class="dt-offline-quiet" href="/today/">Today</a><a class="dt-offline-quiet" href="/shopping-list/">Shopping</a></nav><p class="dt-offline-note">Pages and recipes you have opened before are still available.</p><p class="footer-credit"><a href="https://gearuptofit.com/">A free tool from GearUpToFit</a></p></main></body></html>`;

export default {
  title: 'offline page: icons, publisher credit, and the pages that still work',
  apply(c) {
    const cur = c.read('offline/index.html');
    if (!cur.includes('class="dt-offline-shell"') || cur.length > 1200) throw new Error('offline page is not the bare card this patch replaces');
    // the page is written with the BASELINE version in its URLs; the version stamp step moves them with every other page
    c.write('offline/index.html', PAGE(c.baseVersion));
  }
};
