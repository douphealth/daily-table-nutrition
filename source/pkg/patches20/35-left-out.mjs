// 15.20 · My pantry: a food the kitchen's rules leave out is shown, with the reason.
//
// Measured on the live build (work/tools/probe-blocked.mjs), kitchen with peanuts + milk saved as allergens, photo of tomato, cucumber,
// red onion, olives, feta and peanut butter:
//   the heading read "6 food suggestions from your photo", the line under it "3 selected · 3 identified", and three chips were shown.
//   Feta, peanut butter AND olives were gone, with nothing on the page that said so or why. Feta and peanut butter are the saved
//   allergens. Olives are left out by the "also exclude compound / packaged ingredients with unverified labels" option, which is on
//   by default once any allergen is saved: a deliberate, careful rule, but one nobody would guess from a missing chip.
// The chip renderer still knows how to draw a blocked chip (15.5); the 15.7 layout filters blocked rows out of every list it renders.
// Now those foods are listed under the chips as "Left out for this kitchen", each with the rule that removed it, and the count line
// says how many. No rule changes: the same function decides what is allowed (the reason is derived by asking it again).
const J = 'assets/chunks/photo-journey-15.19.0.js';

const HELPERS = `function dtWhyLeftOut(key) {
        try {
            const s=I(),daily=s.daily||{},flow=daily.flow||{},eaters=flow.eaters||[],prefs=s.recipePreferences||{};
            const patterns=[prefs.diet,flow.pattern,...eaters.map(e=>e.pattern)];
            const allergens=[...new Set([...(daily.allergens||[]),...eaters.flatMap(e=>e.allergens||[]),...(patterns.includes("dairy-free")?["milk"]:[]),...(patterns.includes("gluten-free")?["gluten"]:[])])];
            const hit=allergens.filter(a=>(dtAllergenFoods[a]||[]).includes(key)).map(a=>dtAllergenNames[a]||a);
            if(hit.length)return (hit.length===1?"Saved allergen for this kitchen: ":"Saved allergens for this kitchen: ")+Fe(hit)+".";
            if([...(prefs.excluded||[]),...eaters.flatMap(e=>e.excluded||[])].includes(key))return "It is on this kitchen's excluded foods.";
            if(allergens.length&&daily.strictLabels!==false&&qe(key,{...s,daily:{...daily,strictLabels:false}}))return "Packaged or compound food. With an allergen saved, foods whose label cannot be read from a photo are left out.";
            if(patterns.includes("plant"))return "It does not fit the plant-only food style saved for this kitchen.";
            if(patterns.includes("vegetarian"))return "It does not fit the vegetarian food style saved for this kitchen.";
            if(patterns.includes("pescatarian"))return "It does not fit the pescatarian food style saved for this kitchen.";
        } catch { }
        return "It does not fit the allergens, exclusions or food style saved for this kitchen.";
    }
    function dtLeftOut(rows) {
        if(!rows.length)return "";
        return \`<div class="dt-left-out" role="note" aria-label="Foods left out for this kitchen"><strong>Left out for this kitchen (\${rows.length})</strong><ul>\${rows.map(row=>{const key=row.key||row.catalog;return \`<li><span class="dt-left-out-ic" aria-hidden="true">\${_(key,"",q)}</span><span><b>\${p(x(key))}</b><small>\${p(dtWhyLeftOut(key))}</small></span></li>\`;}).join("")}</ul><p>The app cannot see a label or cross-contact. To change these rules, open <a href="\${p(q)}settings/#recipe-preferences">Settings, Food &amp; exclusions</a> or the allergen control at the top of the page.</p></div>\`;
    }
    `;

export default {
  title: 'pantry: foods the kitchen rules leave out are listed with the reason',
  apply(c) {
    // the allergen map and its display names come from the same module the rule itself uses
    c.edit(J, 'import { $ as xe, T as ke, X as we,', 'import { o as dtAllergenFoods, p as dtAllergenNames, $ as xe, T as ke, X as we,', {label: 'import allergen map'});
    c.edit(J, 'function Qe(row) {', HELPERS + 'function Qe(row) {', {label: 'helpers'});
    c.edit(J, "const unresolvedRows=w.filter(row=>!row.key&&!row.disabled&&!row.blocked&&!dismissedUnknown.has(row.id));",
      "const unresolvedRows=w.filter(row=>!row.key&&!row.disabled&&!row.blocked&&!dismissedUnknown.has(row.id));\n        const leftOutRows=w.filter(row=>(row.blocked||row.disabled)&&(row.key||row.catalog));", {label: 'leftOutRows'});
    c.edit(J, '${unknown.length?` · ${unknown.length} to clarify`:""}</small>', '${unknown.length?` · ${unknown.length} to clarify`:""}${leftOutRows.length?` · ${leftOutRows.length} left out`:""}</small>', {label: 'count line'});
    c.edit(J, '${k.length?`<div class="dt-manual-choices"', '${dtLeftOut(leftOutRows)}\n            ${k.length?`<div class="dt-manual-choices"', {label: 'left-out block'});
    // the export names this patch relies on must be the allergen map and its names
    const o3 = c.read('assets/chunks/chunk-O3VEKXW7.js');
    if (!/\bee as o\b/.test(o3) || !/\bSt as p\b/.test(o3) || !o3.includes('St={milk:"Milk / dairy"')) throw new Error('left-out: the shared chunk no longer exports the allergen map as o / p');
  }
};
