// 15.20 · My pantry: the photo is the first thing on the page, and choosing one moves the page to it.
//
// Measured on the live build at 390 × 844 (work/tools/layout-map.mjs):
//   · the FoodScan cross-promotion (256 px) sits ABOVE the page title; the three-step strip (196 px) sits above the photo card;
//     so "Take a photo" starts at y = 856 — below the fold and under the navigation dock;
//   · after a photo is chosen nothing moves: the preview and the "Find ingredients" button are rendered at y = 2040, under the typed-list
//     block, two and a half screens below the button that was just tapped;
//   · the cross-promotion stays above the results on every later stage.
// This patch changes the ORDER in the document (so it is the same for a screen reader), hides the launch area while a photo is being
// worked on (the later stages already do that), and scrolls to the photo when the stage changes.
const ASIDE_START = '<aside class="wrap gutf-contextual gutf-contextual--pantry"';
const PROMISE_START = '<div class="dt-outcome-promise" aria-label="Your cooking journey">';
const BEFORE_MANUAL = /<\/section>\s*<details class="dt-manual-disclosure" open>/g;
const FOLD = '<details class="dt-photo-fold flow-photo-fold scanner wrap" id="dt-photo-fold">';

const STAGE_SCRIPT = `
/* 15.20: a chosen photo is the page. The scanner owns the stage; this only follows it: when a photo starts being prepared the page moves to
   the photo card, when it is ready the "Find ingredients" button takes focus (no scrolling of its own), and "Remove photo" returns to the top. */
(()=>{
  'use strict';
  const body=document.body;
  let last=body.dataset.pantryStage||'start';
  const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toPhoto=()=>{
    const card=document.getElementById('photo-kitchen')||document.getElementById('dt-photo-fold');
    if(!card||!card.getClientRects().length)return;
    const header=document.querySelector('.site-header');
    const offset=header&&getComputedStyle(header).position!=='static'?header.getBoundingClientRect().height:0;
    scrollTo({top:Math.max(0,card.getBoundingClientRect().top+scrollY-offset-12),behavior:calm()?'auto':'smooth'});
  };
  new MutationObserver(()=>{
    const now=body.dataset.pantryStage||'start';
    if(now===last)return;
    const from=last;last=now;
    if(from==='start'&&now!=='recipe')requestAnimationFrame(toPhoto);
    if(now==='review')requestAnimationFrame(()=>{toPhoto();const go=document.getElementById('photo-analyze');if(go&&!go.disabled)go.focus({preventScroll:true});});
    if(now==='start')requestAnimationFrame(()=>scrollTo({top:0,behavior:'auto'}));
  }).observe(body,{attributes:true,attributeFilter:['data-pantry-stage']});
})();
/* 15.20: saved foods lead to their recipes. The confirmation reads "See the matching results below", but on a phone the results began
   about 380 px under the bottom of the screen (page at y = 815, results at y = 2042). After a save that re-renders the results, the page
   moves to them. Nothing moves when the save added nothing, and nothing is focused: the list field stays ready for more foods. */
(()=>{
  'use strict';
  const input=document.getElementById('pantry-input');
  const form=input&&input.closest('form');
  const results=document.getElementById('recipe-suggestions');
  if(!form||!results)return;
  const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('submit',event=>{
    if(event.target!==form)return;
    let changed=false,done=false;
    const watch=new MutationObserver(()=>{changed=true;});
    watch.observe(results,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    const go=()=>{
      if(done||!changed||!results.getClientRects().length||!results.querySelector('a[href*="/recipes/"]'))return;
      done=true;watch.disconnect();
      const header=document.querySelector('.site-header');
      const offset=header&&getComputedStyle(header).position!=='static'?header.getBoundingClientRect().height:0;
      const top=results.getBoundingClientRect().top;
      if(top>innerHeight*.45)scrollTo({top:Math.max(0,top+scrollY-offset-12),behavior:calm()?'auto':'smooth'});
    };
    for(const wait of [120,450,1100])setTimeout(()=>requestAnimationFrame(go),wait);
    setTimeout(()=>watch.disconnect(),2600);
  },true);
})();
`;

export default {
  title: 'pantry: photo card first, cross-promotion after it, and a chosen photo scrolls into view',
  apply(c) {
    const PAGE = 'pantry/index.html';
    let t = c.read(PAGE);
    const cut = (start, endTag) => {
      const i = t.indexOf(start);
      if (i < 0 || t.indexOf(start, i + 1) >= 0) throw new Error('pantry: anchor not unique: ' + start);
      const j = t.indexOf(endTag, i);
      if (j < 0) throw new Error('pantry: end not found for ' + start);
      const piece = t.slice(i, j + endTag.length);
      t = t.slice(0, i) + t.slice(j + endTag.length);
      return piece;
    };
    const insertBefore = (anchor, piece) => {
      const i = t.indexOf(anchor);
      if (i < 0 || t.indexOf(anchor, i + 1) >= 0) throw new Error('pantry: insertion anchor not unique: ' + anchor);
      t = t.slice(0, i) + piece + t.slice(i);
    };
    // 1. the three-step strip goes under the photo card (it explains the card; it must not push it off the screen)
    const promise = cut(PROMISE_START, 'Review amounts, steps and exclusions</span></div></div>');
    if ((t.match(BEFORE_MANUAL) || []).length !== 1) throw new Error('pantry: the photo card / typed-list boundary is not unique');
    t = t.replace(BEFORE_MANUAL, () => '</section> ' + promise + ' <details class="dt-manual-disclosure" open>');
    // 2. the cross-promotion goes after the whole launch section
    const aside = cut(ASIDE_START, '</aside>');
    insertBefore(FOLD, aside);
    c.write(PAGE, t);

    // 3. follow the stage
    const JS = 'assets/pantry-focus-15.19.0.js';
    const js = c.read(JS);
    if (js.includes('a chosen photo is the page')) throw new Error('pantry stage script already present');
    c.write(JS, js.replace(/\s*$/, '\n') + STAGE_SCRIPT);
  }
};
