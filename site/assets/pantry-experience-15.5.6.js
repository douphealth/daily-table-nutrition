/* Progressive one-screen photo-to-recipe presentation. Never submits photos or AI requests. */
if (document.body.dataset.page === 'pantry/') {
  const fold = document.querySelector('#dt-photo-fold');
  const root = document.querySelector('#pantry-start');
  const back = document.querySelector('#dt-photo-exit');
  const sync = () => document.body.classList.toggle('dt-scanning', Boolean(fold?.open));
  fold?.addEventListener('toggle', sync);
  sync();
  back?.addEventListener('click', () => {
    if (!fold) return;
    fold.open = false;
    sync();
    root?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    document.querySelector('#flow-open-photo')?.focus({preventScroll:true});
  });
  // The previously large upload drop becomes a compact preview after a photo is chosen.
  // This is presentation only; the existing scanner still validates and submits requests.
  const preview = document.querySelector('#photo-preview-wrap');
  const lab = document.querySelector('#photo-kitchen');
  const syncPhoto = () => lab?.classList.toggle('dt-has-photo', Boolean(preview && !preview.hidden));
  if (preview) new MutationObserver(syncPhoto).observe(preview, {attributes:true,attributeFilter:['hidden']});
  syncPhoto();
  // The existing scanner handles file selection, privacy consent, verification and recognition.
  for (const id of ['pantry-photo','photo-camera']) {
    const input = document.getElementById(id);
    input?.addEventListener('change', () => {
      if (!input.files?.length) return;
      if (fold) fold.open = true;
      sync();
      const lab=document.querySelector('#photo-kitchen');
      lab?.scrollIntoView({block:'start',behavior:'instant'});
    });
  }
}
