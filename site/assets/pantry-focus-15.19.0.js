/* Distinct native camera and upload actions; the scanner still owns validation,
   metadata stripping, Turnstile and AI requests. Do not duplicate provider code. */
(()=>{'use strict';
function bind(){
  for(const [entryId,scannerId] of [['dt-focus-camera','photo-camera'],['dt-focus-upload','pantry-photo']]){
    const entry=document.getElementById(entryId),scanner=document.getElementById(scannerId);
    if(!entry||!scanner)continue;
    entry.addEventListener('change',()=>{
      if(!entry.files?.length)return;
      try {
        // Some mobile browsers cannot construct or assign DataTransfer. Keep the
        // selected input intact on failure and offer the native scanner picker.
        if(typeof DataTransfer !== 'function')throw Error('File transfer unavailable');
        const chosen=new DataTransfer();
        for(const file of entry.files)chosen.items.add(file);
        scanner.files=chosen.files;
        scanner.dispatchEvent(new Event('change',{bubbles:true}));
        entry.value='';
      }catch(error){
        document.body.dataset.pantryStage='review';
        const status=document.getElementById('photo-status');
        if(status){status.textContent='This browser cannot transfer the selected photo. Use the scanner photo chooser below; no AI request was made.';status.hidden=false;status.dataset.tone='error';}
        document.querySelector('#dt-photo-fold')?.setAttribute('open','');
        scanner.closest('label')?.scrollIntoView?.({block:'center',behavior:'auto'});
      }
    });
  }
  // The scanner owns its lifecycle. This listener only updates the presentation.
  document.addEventListener('dt:photo',event=>{
    const type=event.detail?.type;
    if(type==='results')document.body.dataset.pantryStage='recipe';
    else if(type==='reset')document.body.dataset.pantryStage='start';
    else if(type==='error')document.body.dataset.pantryStage='problem';
  });
  // The scanner, not a secondary timer, owns preparation and analysis states.
  // A selected image is only local preview; never mask the Identify control or
  // visually claim that an AI request was sent during local preparation.
  for(const id of ['photo-cancel','scan-preview-cancel'])document.getElementById(id)?.addEventListener('click',()=>setTimeout(()=>{if(document.body.dataset.pantryStage==='analyzing')document.body.dataset.pantryStage='problem';},0));
  // Guard against a stale browser restore that hides the only entry points.
  if(!document.body.dataset.pantryStage)document.body.dataset.pantryStage='start';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

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
