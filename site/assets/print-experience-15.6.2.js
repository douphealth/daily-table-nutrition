/* The Daily Table 15.6.2 - route-safe, minimal-ink printing.
 * Never copies private user notes to a server; the print sheet exists in the DOM
 * only for the lifetime of the browser print operation. */
(() => {
  'use strict';
  let active = '';
  let cleaning = false;
  const root = document.documentElement;
  const $ = (selector) => document.querySelector(selector);
  function visible(element) {
    return !!element && !element.closest('[hidden]') && !!element.getClientRects().length;
  }
  function findPhotoRecipe() {
    const made = $('#photo-journey #pj-result');
    if (visible(made)) return made;
    const matched = $('#photo-journey #pj-instant-recipe');
    return visible(matched) ? matched : null;
  }
  function clean() {
    if (cleaning) return;
    cleaning = true;
    $('#dt-print-sheet')?.remove();
    root.removeAttribute('data-dt-print');
    active = '';
    cleaning = false;
  }
  function makePhotoSheet() {
    const source = findPhotoRecipe();
    if (!source) return false;
    $('#dt-print-sheet')?.remove();
    const sheet = document.createElement('section');
    sheet.id = 'dt-print-sheet';
    sheet.setAttribute('aria-label', 'Recipe ready for printing');
    const kicker = document.createElement('p');
    kicker.className = 'dt-print-kicker';
    kicker.textContent = 'THE DAILY TABLE  /  YOUR RECIPE';
    sheet.append(kicker);
    const copy = source.cloneNode(true);
    // The print copy is not interactive; remove duplicate IDs and all actions.
    for (const node of copy.querySelectorAll('[id]')) node.removeAttribute('id');
    copy.removeAttribute('id');
    for (const node of copy.querySelectorAll('button,select,input,textarea,.pj-result-actions,.pj-instant-actions,.pj-primary-cook,.pj-add-chip,.pj-dish-photo,.pj-dish-art,.pj-result-tag')) node.remove();
    for (const details of copy.querySelectorAll('details')) details.open = true;
    for (const link of copy.querySelectorAll('a')) {
      const text = document.createElement('span');
      text.textContent = link.textContent;
      link.replaceWith(text);
    }
    const portions = source.querySelector('[data-pj-preview-portions]');
    const portionsLabel = copy.querySelector('.pj-portions');
    if (portions && portionsLabel) portionsLabel.textContent = `Portions: ${portions.value}`;
    sheet.append(copy);
    const footer = document.createElement('p');
    footer.className = 'dt-print-footer';
    footer.textContent = 'Food identification and ingredient quantities require your review. Check labels, allergies, cross-contact and safe internal cooking temperatures. Times are estimates; no recipe is independently kitchen-tested.';
    sheet.append(footer);
    document.body.append(sheet);
    return true;
  }
  function selectTarget(wanted = '') {
    if (active) return;
    if (wanted === 'photo' || (!wanted && findPhotoRecipe())) {
      if (makePhotoSheet()) {
        active = 'photo';
        root.dataset.dtPrint = 'photo';
        return;
      }
    }
    const page = document.body.dataset.page || '';
    if (wanted || page) {
      active = wanted || page.split('/')[0] || 'page';
      root.dataset.dtPrint = active;
    }
  }
  // Capture occurs before the existing delegated onclick opens the print dialog.
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-pj="print"],#recipe-print,#shop-print,[data-dt-print]');
    if (!button) return;
    const wanted = button.hasAttribute('data-pj') ? 'photo' : button.getAttribute('data-dt-print') || '';
    selectTarget(wanted);
    if (button.hasAttribute('data-dt-print')) {
      event.preventDefault();
      window.print();
    }
  }, true);
  window.addEventListener('beforeprint', () => selectTarget());
  window.addEventListener('afterprint', clean);
  // On Safari the dialog can be dismissed without afterprint; visibility returns.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && active) window.setTimeout(clean, 500);
  });
  window.addEventListener('pagehide', clean);
  // Add unobtrusive printer access to the weekly plan, Today, and family view.
  function addPrintButton() {
    const page = document.body.dataset.page || '';
    if (!['weekly-plan/','today/','family-planner/'].includes(page)) return;
    const heading = document.querySelector('main .page-heading .heading-actions') || document.querySelector('main .page-heading') || document.querySelector('main h1')?.parentElement;
    if (!heading || heading.querySelector('[data-dt-print]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn secondary dt-print-action';
    button.dataset.dtPrint = page.split('/')[0];
    button.textContent = page === 'weekly-plan/' ? 'Print plan' : page === 'today/' ? 'Print today' : 'Print family overview';
    button.setAttribute('aria-label', `Print ${page.replace('/', '').replace('-', ' ')} without editing controls`);
    heading.append(button);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPrintButton, {once:true});
  else addPrintButton();
})();
