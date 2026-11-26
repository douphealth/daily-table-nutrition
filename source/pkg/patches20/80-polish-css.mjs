// 15.20 · one stylesheet for this release's fixes and refinements, linked last on every page.
// The live styles are five minified layers written by different sessions; editing them in place is how earlier regressions happened. Everything
// this release changes visually lives in assets/polish-15.20.0.css (source: pkg/assets/polish.css), each rule scoped to the page or component
// it corrects and commented with the measured defect it fixes.
export default {
  title: 'polish stylesheet linked last on every page',
  apply(c) {
    // The source carries the measured reason for every rule; visitors get the rules without the commentary (the file is render-blocking).
    const source = c.asset('polish.css');
    const shipped = '/* The Daily Table 15.20.0: fixes and refinements (source and reasons: pkg/assets/polish.css) */\n' + source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim() + '\n';
    if ((shipped.match(/\{/g) || []).length !== (source.replace(/\/\*[\s\S]*?\*\//g, '').match(/\{/g) || []).length || (shipped.match(/\{/g) || []).length !== (shipped.match(/\}/g) || []).length) throw new Error('polish.css: braces do not balance after removing comments');
    c.write('assets/polish-15.20.0.css', shipped);
    c.note(`polish.css ${source.length} -> ${shipped.length} bytes shipped`);
    let n = 0;
    for (const f of c.pages()) {
      const t = c.read(f);
      if (t.includes('polish-15.20.0.css')) { n++; continue; }      // the offline page already links it
      const i = t.indexOf('</head>');
      if (i < 0) throw new Error('no </head> in ' + f);
      c.write(f, t.slice(0, i) + `<link href="/assets/polish-15.20.0.css?v=${c.baseVersion}" rel="stylesheet"/>` + t.slice(i));
      n++;
    }
    c.note(`linked on ${n} pages`);
  }
};
