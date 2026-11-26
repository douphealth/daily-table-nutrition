// 15.20 · a drawing is not captioned as a photo.
// A recipe without its own photograph is shown as a drawn plate of its ingredients. One late pass in site.js rewrote EVERY picture caption to
// "Photo is illustrative", so the drawn plates on Home, Today and the weekly plan carried a caption about a photo that is not there
// (measured: 3 on Home, 1 on Today, 1 on the plan, with the populated test kitchen). Photographs keep their caption.
export default {
  title: 'drawn ingredient plates are captioned as an illustration, not as a photo',
  apply(c) {
    c.edit('assets/site.js',
      'n.closest(".recipe-ingredient-guide")||(n.textContent="Photo is illustrative",n.setAttribute("aria-hidden","true"))',
      'n.closest(".recipe-ingredient-guide")||(n.textContent=n.closest(".plate-media")?"Ingredient illustration":"Photo is illustrative",n.setAttribute("aria-hidden","true"))',
      {label: 'media caption pass'});
  }
};
