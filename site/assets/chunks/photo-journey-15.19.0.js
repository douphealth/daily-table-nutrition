import { $ as Me, M as qe, S as p, T as f, U as _, Y as Te } from "./chunk-MNNQ7WCU.js?v=15.20.0";
import { a as E, b as z, c as Ne, d as Re, e as G, f as He, g as Oe, h as X } from "./chunk-ME7AO2VB.js?v=15.20.0";
import { o as dtAllergenFoods, p as dtAllergenNames, $ as xe, T as ke, X as we, Y as Se, aa as Ae, ca as Ce, da as Ee, ea as Le, fa as Ie, z as $e } from "./chunk-O3VEKXW7.js?v=15.20.0";
import { rankPhotoRecipes, requiredMissingFoods } from "./photo-ranking-15.6.2.js?v=15.20.0";
import { createPhotoIngredientResolver } from "./photo-ingredient-identity-15.19.0.js?v=15.20.0";
import { resolveAndGuardPhotoRows } from "./photo-safety-15.19.0.js?v=15.20.0";
import { describeMealPattern } from "./recipe-quality-15.19.0.js?v=15.20.0";
var We = [10, 15, 20, 30, 45, 60], Ue = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" }, Z = { hob: "Hob & pan", oven: "Oven", "no-cook": "No-cook" }, pt = (j = new Date) => { let $ = j.getHours(); return $ < 5 ? "snack" : $ < 10 ? "breakfast" : $ < 15 ? "lunch" : $ < 23 ? "dinner" : "snack"; }, Fe = j => j.length < 2 ? j.join("") : j.slice(0, -1).join(", ") + " and " + j.at(-1), L = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function currentKitchenScope() { try {return JSON.parse(localStorage.getItem("dtable:profiles:v1")||"null")?.active || "default";} catch{return "unavailable";} }
function St({ scanner: j, data: $, getState: I, commit: ee, toast: O, recipeURL: te, hydrate: Pe = () => { }, base: q = "/", cookRecipe: se = () => { }, isDurable: Ye = () => !0, refresh: ne = () => { } }) {
    let b = document.querySelector("#photo-kitchen"), d = document.querySelector("#photo-journey");
    if (!b || !d || !j)
        return null;
    let x = e => $.foodLabels?.[e] || E[e]?.label || e, ae = e => x(e).toLowerCase(), w = [], N = !1, k = [], T = null, W = null, U = null, oe = 0, M = null, S = 0, y = { over: {}, amounts: {} }, l = { state: "idle" }, D = "dtable:journey:15.5.7", F = "dtable:journey:back:15.5.7", A = { get(e) { try {
            return sessionStorage.getItem(e);
        }
        catch {
            return null;
        } }, set(e, t) { try {
            sessionStorage.setItem(e, t);
        }
        catch { } }, del(e) { try {
            sessionStorage.removeItem(e);
        }
        catch { } } }, _e = () => { try {
        let e = JSON.parse(A.get(D) || "null");
        return e && e.scope === currentKitchenScope() && e.scene === "ingredients" && Date.now() - e.t < 6 * 36e5 && Array.isArray(e.foods) && e.foods.length ? e : null;
    }
    catch {
        return null;
    } }, ie = e => A.set(D, JSON.stringify({ t: Date.now(), scope: currentKitchenScope(), scene: m?"ingredients":j.result()?.scene, foods: e.map(t => ({ id: t.id, name: t.name, form: t.form, key: t.key || "", catalog: t.catalog || null, usable: t.usable, selected: t.selected, certainty: t.certainty, agreement: t.agreement, iconHTML: "" })) })), m = null, K = e => !!e && !!$.foodLabels?.[e] && !qe(e, I()), De = () => m ? m.map(e => ({ ...e, blocked: K(e.key || e.catalog), selected: e.selected && !K(e.key || e.catalog) })) : j.rows().map(e => { let t = null; try {
        t = Me({ name: e.name, form: e.form }, $.foodLabels);
    }
    catch { } let s = !!e.blocked || K(e.key || t); return { ...e, catalog: t, usable: !!(e.key || t), blocked: s, selected: e.selected && !s }; });
    // Exact multilingual catalog identity. Uncertain or contradictory preparation
    // states are left unresolved for the user instead of being silently guessed.
    const mapDetected = createPhotoIngredientResolver($.foodLabels,$.foodAliases||{});
    const baseRows = De;
    De = () => resolveAndGuardPhotoRows(baseRows(),mapDetected,K);
    function B(e) { if (!m) {
        j.setSelection(e);
        return;
    } for (let t of m) {
        let s = !!e(t.id, t.selected);
        s !== t.selected && (t.selected = s, s && !t.key && (t.key = t.catalog || ""));
    } ie(m), invalidateSelection(), P(); }
    let chosenRecipe = null, previewPortions = null, selectionStamp = "", saveNotice = "", editMode = false;
    let dismissedUnknown = new Set();
    const suggestions = new Map();
    const canonicalSelected = rows => [...new Set(rows.filter(row=>row.selected && row.key && !row.blocked).map(row=>row.key))];
    const snapshotKey = () => JSON.stringify({rows:De().map(row=>[row.id,row.key,row.selected,row.blocked,row.name,row.form]),manual:[...k].sort()});
    function invalidateSelection() {
        const stamp=snapshotKey();
        if(stamp===selectionStamp) return;
        selectionStamp=stamp; chosenRecipe=null; saveNotice="";
        if(l.state!=="idle") {S++; M?.abort();M=null;C();l={state:"idle"};}
    }
    let re = () => [...new Set(w.filter(e => e.selected && e.key).map(e => e.key))], Ke = () => w.filter(e => e.selected && !e.key), le = () => [...new Set([...re(), ...k])];
    function Be(e) { let t = I(), s = []; try {
        s = ke($, e, { includeUnmatched: !0, minUsed: 1, _state: t, slot: "all", focus: e });
    }
    catch {
        s = [];
    } let a = s.map(i => ({ ...i, used: e.filter(u => i.have.includes(u)), left: e.filter(u => !i.have.includes(u)), usedAll: e.every(u => i.have.includes(u)) })).filter(i => i.used.length > 0), n = a.filter(i => i.usedAll).sort((i, u) => i.missing.length - u.missing.length || i.recipe.time - u.recipe.time), r = Math.max(1, Math.min(e.length - 1, Math.ceil(e.length * .6))), c = a.filter(i => !i.usedAll && i.used.length >= r).sort((i, u) => u.used.length - i.used.length || i.missing.length - u.missing.length || i.recipe.time - u.recipe.time), h = []; try {
        h = we($, e, { useEvery: !0, _state: t, slot: "all" });
    }
    catch {
        h = [];
    } return { full: n, part: c, kitchen: h }; }
    // A deliberately small, reviewed local fallback for all-vegetable combinations.
    // This is never presented as AI output or as a nutritionally complete meal.
    function vegetableRecipe(selected) {
        const vegetables=new Set(["broccoli","potato","peas","sweetPotato","carrot","zucchini","cauliflower","greenBeans","mushroom","spinach","kale","pepper","eggplant","corn","tomato","onion"]);
        if(selected.length<2||selected.length>7||!selected.every(key=>vegetables.has(key)&&!K(key)))return null;
        const roots=selected.filter(key=>["potato","sweetPotato","carrot"].includes(key));
        const rest=selected.filter(key=>!roots.includes(key));
        const labels=keys=>Fe(keys.map(key=>x(key).toLowerCase()));
        const entries=selected.map(key=>({key,quantity:roots.includes(key)?110:["spinach","kale","onion"].includes(key)?55:85,unit:"g",optional:false}));
        const steps=[
          "Wash the vegetables thoroughly. Trim and cut everything into evenly sized, bite-size pieces. Keep the harder vegetables separate.",
          ...(roots.length?[`Place ${labels(roots)} in a covered pan with a shallow layer of water. Gently simmer for about 12–15 minutes, checking that the pieces are becoming tender.`]:[]),
          `Add ${labels(rest.length?rest:selected)}${roots.length?" to the pan":" to a covered pan with a shallow layer of water"}. Cook gently, checking regularly, until all vegetables are completely tender. Allow about 7–12 minutes for this stage; larger pieces take longer.`,
          ...(selected.includes("sweetPotato")?["When tender, take a spoonful of the sweet potato and mash it with a little hot cooking water to make a naturally creamy coating. Fold it gently through the vegetables."]:[]),
          "Drain away any excess cooking water carefully. Divide into portions and serve warm. No oils, salt or seasonings are assumed."
        ];
        const title=selected.includes("sweetPotato")?"Silky sweet potato & garden vegetable bowl":roots.length?"Warm garden vegetables with "+labels(roots):"Warm garden vegetable bowl";
        const recipe={id:"photo-vegetables-"+selected.slice().sort().join("-"),title,slot:"lunch",time:roots.length?30:20,ingredients:entries,steps,note:"Vegetable-focused dish. This is not necessarily a complete meal; for a main course, include an appropriate protein food if you have one. Cooking times are estimates."};
        return {recipe,used:selected.slice(),left:[],missing:[],usedAll:true,local:true,synthetic:true};
    }
    function Ve() { let e = I(), t = e.daily.flow, s = t.equipment || [], o = y.over.slot || (t.pantry?.slot && t.pantry.slot !== "all" ? t.pantry.slot : pt()), a = t.mealTimes?.[o] || 30, n = y.over.equipment || (s.includes("hob") ? "hob" : s.includes("oven") ? "oven" : "no-cook"), r = (t.eaters || []).filter(c => c.meals.includes(o)).reduce((c, h) => c + (Number(h.portions) || 0), 0); return { servings: y.over.servings || Math.min(12, Math.max(1, Math.round(r || e.servings || 2))), slot: o, maxMinutes: y.over.maxMinutes || [...We].reverse().find(c => c <= a) || 10, equipment: n, allowWater: "allowWater" in y.over ? y.over.allowWater : n === "hob" }; }
    function ce(e, t) { let s = I(), o = s.daily.flow, a = (o.eaters || []).filter(n => n.meals.includes(t.slot)); return { items: e.map(n => { let r = y.amounts[n]; return { key: n, quantity: r?.quantity > 0 ? r.quantity : Math.max(.01, Math.round(E[n].suggested * t.servings * 100) / 100), unit: r?.unit || E[n].unit }; }), servings: t.servings, maxMinutes: t.maxMinutes, equipment: t.equipment, allowWater: t.allowWater, slot: t.slot, allergens: [...new Set([...s.daily.allergens || [], ...a.flatMap(n => n.allergens)])], excluded: [...new Set([...s.recipePreferences.excluded || [], ...a.flatMap(n => n.excluded)])], patterns: [...new Set([s.recipePreferences.diet, o.pattern, ...a.map(n => n.pattern)].map(n => n === "all" ? "none" : n))], strictLabels: s.daily.strictLabels }; }
    function pe(e) { let t = Ve(), s = []; for (let a = 0; a < 4; a++) {
        let n = z(ce(e, t)), r = X(n);
        if (!r.length)
            return { request: n, eff: t, notes: s, blockers: [] };
        let c = r.find(i => i.fix)?.fix, h = !1;
        if (c && (c.equipment && c.equipment !== t.equipment && !y.over.equipment && (t = { ...t, equipment: c.equipment }, s.push(c.equipment === "hob" ? "using the hob" : "using the " + c.equipment), h = !0), c.allowWater === !0 && !t.allowWater && !("allowWater" in y.over) && (t = { ...t, allowWater: !0 }, s.push("cooking water on"), h = !0), c.maxMinutes && c.maxMinutes > t.maxMinutes && !y.over.maxMinutes && (t = { ...t, maxMinutes: c.maxMinutes }, s.push("up to " + c.maxMinutes + " min"), h = !0)), !h)
            return { request: n, eff: t, notes: s, blockers: r };
    } let o = z(ce(e, t)); return { request: o, eff: t, notes: s, blockers: X(o) }; }
    let Je = (settings, notes) => `${Ue[settings.slot]} / ${settings.servings} ${settings.servings===1?"portion":"portions"} / ${Z[settings.equipment]}${settings.allowWater?" + cooking water":""} / up to ${settings.maxMinutes} min${notes.length?" (changed so these foods can be cooked: "+notes.join(", ")+")":""}`;
    function dtWhyLeftOut(key) {
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
        return `<div class="dt-left-out" role="note" aria-label="Foods left out for this kitchen"><strong>Left out for this kitchen (${rows.length})</strong><ul>${rows.map(row=>{const key=row.key||row.catalog;return `<li><span class="dt-left-out-ic" aria-hidden="true">${_(key,"",q)}</span><span><b>${p(x(key))}</b><small>${p(dtWhyLeftOut(key))}</small></span></li>`;}).join("")}</ul><p>The app cannot see a label or cross-contact. To change these rules, open <a href="${p(q)}settings/#recipe-preferences">Settings, Food &amp; exclusions</a> or the allergen control at the top of the page.</p></div>`;
    }
    function Qe(row) {
        const key=row.key||row.catalog, blocked=row.blocked||row.disabled;
        const unsure=row.certainty!=="clear"||row.agreement==="single";
        const aria=`${row.name}, ${row.selected?"included":"left out"}${unsure?", uncertain suggestion; confirm only if you recognize it":""}${blocked?", unavailable for this kitchen":""}`;
        return `<button type="button" class="pj-chip ${row.selected?"is-on":""} ${!row.usable?"is-note":""} ${unsure?"is-unsure":""} ${blocked?"is-blocked":""}" aria-pressed="${row.selected}" ${blocked?'aria-disabled="true" data-blocked="true"':""} data-pj-food="${p(row.id)}" aria-label="${p(aria)}"><span class="pj-chip-ic" aria-hidden="true">${key?_(key,"",q):f("leaf")}</span><span class="pj-chip-name">${p(key?x(key):row.name)}${unsure?(row.selected?'<small>Selected by you</small>':'<small>Confirm if visible</small>'):""}</span><span class="pj-chip-tick" aria-hidden="true">${f("check")}</span></button>`;
    }
    function ue() {
        if(!re().length && !Ke().length) return "";
        const saved=re().length && re().every(key=>I().pantry.includes(key)) && !Ke().length;
        return `<footer class="pj-save-optional"><div><strong>Save foods for next time</strong><small>Optional — saving to your pantry does not generate a recipe.</small></div><button type="button" class="pj-link" data-pj="save-foods" ${(saved&&Ye())||l.state==="working"?"disabled":""}>${saved&&Ye()?"Saved in your kitchen":"Save foods (optional)"}</button>${saveNotice?`<p role="status">${p(saveNotice)}</p>`:""}</footer>`;
    }
    function V(match,index,kind="full") {
        const recipe=match.recipe; suggestions.set(recipe.id,match);
        const extras=match.missing||[];
        return `<button type="button" class="pj-card pj-recipe-choice ${recipe.id===chosenRecipe?"is-best":""}" data-pj-open="${p(recipe.id)}" aria-label="Read ${p(recipe.title)} here" aria-pressed="${recipe.id===chosenRecipe}">${Te(recipe,$,q,{sizes:"(max-width: 600px) 44vw, 240px"})}<span class="pj-card-body"><strong class="pj-card-title">${p(recipe.title)}</strong><span class="pj-need">${match.usedAll?"Uses all selected foods":"Leaves out "+Fe(match.left.map(ae))}${extras.length?" / needs "+Fe(extras.map(ae)):""}</span><span class="pj-time">About ${recipe.time} min</span></span></button>`;
    }
    const J=(title,subtitle,cards,classes="")=>cards.length?`<section class="pj-tier ${classes}"><div class="pj-tier-head"><h4>${title}</h4>${subtitle?`<span class="pj-sub">${subtitle}</span>`:""}</div><div class="pj-cards">${cards.join("")}</div></section>`:"";
    function displayAmount(quantity,unit) {
        const n=Math.round(quantity*100)/100;
        return `${n} ${unit==="piece"?(n===1?"piece":"pieces"):unit}`;
    }
    /* ---- 15.6.1: "How this was checked". Only statements the code can back; nothing is claimed that was not computed. ---------------------------------------------------- */
    function profileChecks(recipe, synthetic) {
        const s = I(), f = s.daily.flow, slot = Ve().slot, people = (f.eaters || []).filter(n => n.meals.includes(slot));
        const allergens = [...new Set([...(s.daily.allergens || []), ...people.flatMap(n => n.allergens || [])])];
        const excluded = [...new Set([...(s.recipePreferences?.excluded || []), ...people.flatMap(n => n.excluded || [])])];
        const diets = [...new Set([s.recipePreferences?.diet, f.pattern, ...people.map(n => n.pattern)].filter(v => v && v !== "all" && v !== "none"))];
        // The recipe is only offered when the app's own hard filter passes; it is re-run here so the statement is computed, not assumed. A template recipe is checked food by food.
        let safe = false;
        try { safe = synthetic ? recipe.ingredients.every(item => !K(item.key)) : !!$e(recipe, s, { slot: recipe.slot || slot, time: false }); } catch { safe = false; }
        return { allergens, excluded, diets, safe, count: allergens.length + excluded.length + diets.length };
    }
    function trustItems(c) {
        const named = [...c.allergens, ...c.excluded.map(ae), ...c.diets.map(d => d + " diet")];
        if (!c.safe) return `<li>Your saved exclusions could not be re-checked just now. Check every ingredient before cooking.</li>`;
        return c.count
            ? `<li class="is-ok"><strong>Checked against your saved ${Fe(named)}:</strong> no ingredient conflicts.</li>`
            : `<li><strong>No allergens or exclusions are saved for this kitchen,</strong> so nothing was filtered. <a href="${q}settings/">Add yours</a> and every recipe is filtered.</li>`;
    }
    function trustHTML(match, selected) {
        const recipe = match.recipe, c = profileChecks(recipe, !!match.synthetic);
        const used = match.used?.length ?? selected.length;
        const src = match.synthetic ? "A small, reviewed vegetable template written into the app (not AI)."
            : match.local ? "Built from your selected foods by the app's own recipe rules (not AI)."
            : /family-nutrition-os/.test(recipe.source || "") ? "The Daily Table collection, adapted from Family Nutrition OS."
            : "A Daily Table kitchen idea matched to your foods by the app's recipe rules.";
        return `<details class="pj-trust" aria-label="How this recipe was checked"><summary>Why this recipe? <small>Checks, sources &amp; safety</small></summary><ul>`
            + `<li class="is-ok"><strong>Your foods:</strong> ${match.usedAll ? `uses all ${selected.length} of your selected foods.` : `uses ${used} of your ${selected.length} selected foods; the rest are listed as left out above.`}</li>`
            + trustItems(c)
            + `<li><strong>Source:</strong> ${p(src)}</li>`
            + `<li><strong>Still your call:</strong> times and amounts are estimates, and this has not been independently kitchen-tested. Check labels and cross-contact, and cook proteins until fully done.</li>`
            + `</ul></details>`;
    }
    function aiTrustHTML(request) {
        const named = [...(request.allergens || []), ...(request.excluded || []).map(ae), ...(request.patterns || []).filter(v => v && v !== "none").map(d => d + " diet")];
        return `<details class="pj-trust" aria-label="How this recipe was checked"><summary>Why this recipe? <small>Checks, sources &amp; safety</small></summary><ul>`
            + `<li class="is-ok"><strong>Your foods:</strong> every one of the ${request.items.length} selected foods is used, and nothing else was added (checked by code, twice).</li>`
            + (named.length ? `<li class="is-ok"><strong>Your saved ${p(Fe(named))}</strong> were sent with the request and enforced by code.</li>` : `<li><strong>No allergens or exclusions are saved for this kitchen,</strong> so nothing was filtered. <a href="${q}settings/">Add yours</a>.</li>`)
            + `<li><strong>Method:</strong> the steps and food-safety temperatures come from fixed rules (FoodSafety.gov), not from the AI.</li>`
            + `<li><strong>Still your call:</strong> this has not been independently kitchen-tested. Check labels and cross-contact.</li>`
            + `</ul></details>`;
    }
    function stepHTML(text){const bits=String(text).split(/([.!?])\s+(?=[A-Z])/),out=[];for(let i=0;i<bits.length;i+=2)out.push(bits[i]+(bits[i+1]||""));const lead=out.shift()||"";return `<span class="pj-step-lead">${p(lead)}</span>`+(out.length?`<span class="pj-step-notes">${out.map(x=>`<span>${p(x)}</span>`).join(" ")}</span>`:"")}
    function plateReview(ingredients,slot,brief) {
        const review=describeMealPattern(ingredients,{slot,isExcluded:K});
        const details=[['vegetables',review.light?'Vegetables or fruit':'Vegetables'],['protein','Protein foods'],['grains','Grains / starches']];
        const badges=details.map(([group,label])=>`<span class="dt-food-group ${review.groups[group]?'is-present':'is-unconfirmed'}"><span aria-hidden="true">${review.groups[group]?'✓':'·'}</span> ${label}: ${review.groups[group]?'listed':'not listed'}</span>`).join('');
        const choices=review.lacking.map(group=>{const options=review.suggestions[group]||[];return options.length?`<li>${group==='protein'?'Protein food':group==='grains'?'Grains or starches':'Vegetables'}: ${p(Fe(options.map(ae)))} could be options if you have them and can safely eat them. They are <strong>not</strong> added automatically.</li>`:`<li>There is no ${p(group)} food in the confirmed ingredients. Consider a suitable addition if this is intended as a main meal.</li>`;}).join('');
        return `<section class="dt-plate-review" aria-label="Food group check"><div class="dt-plate-head"><span class="dt-plate-label">MEAL COMPOSITION</span><strong>What your ingredients cover</strong><p>Based only on listed food names — not a nutrition score, calorie estimate or guarantee of a healthy meal.</p></div><div class="dt-food-groups">${badges}</div>${choices&&!brief?`<details><summary>Ideas to round out this meal</summary><ul>${choices}</ul></details>`:''}</section>`;
    }
    function openGuidedSteps({title,steps,ingredients=[],context=''}) {
        if(!Array.isArray(steps)||!steps.length){O('No preparation steps are available for this recipe.');return;}
        const dialog=document.createElement('dialog');
        dialog.className='dt-guided-cook';
        dialog.setAttribute('aria-label','Guided recipe: '+title);
        let index=0;
        const paint=()=>{
            dialog.innerHTML=`<div class="dt-guided-shell"><div class="dt-guided-top"><span class="dt-plate-label">COOK AT YOUR OWN PACE</span><button class="dt-guided-close" type="button" data-guided="close" aria-label="Close guided recipe">×</button></div><h2>${p(title)}</h2><p class="dt-guided-context">${p(context||'Check ingredients and food safety before you start.')}</p><div class="dt-guided-progress" role="status">Step ${index+1} of ${steps.length}</div><div class="dt-guided-track" aria-hidden="true"><span style="width:${Math.round((index+1)/steps.length*100)}%"></span></div><p class="dt-guided-instruction" tabindex="-1">${p(steps[index])}</p><p class="dt-guided-caution">Wash produce, follow safe handling and cooking guidance for raw foods, and check labels for allergens. These steps are not independently kitchen-tested.</p><div class="dt-guided-actions"><button class="btn secondary" type="button" data-guided="previous" ${index===0?'disabled':''}>Previous</button><button class="btn primary" type="button" data-guided="next">${index===steps.length-1?'Finish review':'Next step →'}</button></div><button class="dt-guided-ingredients" type="button" data-guided="ingredients">${ingredients.length?'Show ingredients':'Back to recipe'}</button><div class="dt-guided-list" hidden>${ingredients.map(i=>`<div>${p(i)}</div>`).join('')}</div></div>`;
            dialog.querySelector('.dt-guided-instruction')?.focus({preventScroll:true});
        };
        dialog.addEventListener('click',event=>{const button=event.target.closest('[data-guided]');if(!button)return;const action=button.dataset.guided;
            if(action==='close'||(action==='next'&&index===steps.length-1)){dialog.close();return;}
            if(action==='ingredients'){const list=dialog.querySelector('.dt-guided-list');list.hidden=!list.hidden;button.textContent=list.hidden?'Show ingredients':'Hide ingredients';return;}
            index=Math.max(0,Math.min(steps.length-1,index+(action==='next'?1:-1)));paint();
        });
        dialog.addEventListener('close',()=>dialog.remove(),{once:true});
        document.body.append(dialog);paint();dialog.showModal();dialog.querySelector('.dt-guided-instruction')?.focus({preventScroll:true});
    }
    function instantRecipe(match,selected) {
        if(!match) return "";
        const recipe=match.recipe, portions=previewPortions||Ve().servings;
        const local=!!match.local;
        const required=[...new Set(recipe.ingredients.filter(item=>!item.optional).map(item=>item.key))];
        const additional=requiredMissingFoods(recipe,selected);
        const omitted=selected.filter(key=>!required.includes(key));
        const unresolved=Ke(); const context=unresolved.length?`This recipe uses the ${selected.length} confirmed, matched ${selected.length===1?"food":"foods"} only. Review ${Fe(unresolved.map(row=>row.name))} before including unidentified foods.`:omitted.length?`Uses ${match.used.length} of ${selected.length} selected foods. Leaves out ${Fe(omitted.map(ae))}.`:`Uses all ${selected.length} selected ${selected.length===1?"food":"foods"}.`;
        const availability=unresolved.length?"This preview is not the final recipe. Identify the remaining selected foods before cooking.":additional.length?`You will also need ${Fe(additional.map(ae))} to make it.`:"Check amounts and labels before cooking.";
        const steps=Array.isArray(recipe.steps)?recipe.steps:[];
        const url=local?Se(recipe,q):te(recipe.id);
        const illustration=`<div class="pj-dish-art" aria-hidden="true"><span class="pj-dish-art-glow"></span><span class="pj-dish-icon-row"><svg class="pj-bowl-illustration" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="#f9f4db" stroke="#e0c998" stroke-width="3"/><circle cx="60" cy="60" r="39" fill="#e7edce"/><path d="M30 70c14 10 46 13 61-1-4 21-15 29-30 29S36 90 30 70Z" fill="#266347"/><path d="M29 65c6-8 54-8 63 0-2 8-61 11-63 0Z" fill="#3e7c4b"/><path d="M44 51c-5-16 3-20 7-18 9 6 5 22 5 22" fill="#619649"/><path d="M72 50c8-18 18-13 17-5-1 10-15 16-21 18" fill="#7ea147"/><path d="M58 57c2-23-8-27-13-20-5 8 2 19 13 23" fill="#92a951"/><ellipse cx="49" cy="65" rx="8" ry="6" fill="#e5ab55"/><ellipse cx="77" cy="67" rx="8" ry="6" fill="#d0673e"/><circle cx="62" cy="57" r="8" fill="#b95030"/><circle cx="65" cy="55" r="2.5" fill="#ffca84"/><path d="M40 61c2 6 13 6 18 0M69 78c4-5 8-6 12-5" stroke="#e8d8a6" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></span></div>`; return `<article id="pj-instant-recipe" class="pj-instant" tabindex="-1" data-pj-recipe="${p(recipe.id)}">${match.synthetic?`<div class="pj-dish-top">${illustration}`:`<div class="pj-dish-top has-media"><figure class="pj-dish-photo">${Te(recipe,$,q,{sizes:"(max-width: 700px) 92vw, 320px"})}</figure>`}<div class="pj-dish-intro"><p class="pj-eyebrow">${match.synthetic?"Simple recipe from your vegetables":local?"From your selected ingredients · local recipe":"From the recipe collection"}</p><h3>${p(recipe.title)}</h3><div class="pj-recipe-meta"><span>${match.usedAll?"Uses all selected foods":"Alternative · leaves out "+Fe(match.left.map(ae))}</span><span>About ${recipe.time} min · estimate</span></div><p class="dt-recipe-proof">${match.missing?.length?`Needs ${match.missing.length} additional required ${match.missing.length===1?"food":"foods"}`:"Required foods selected"} · Review portions and labels</p></div></div></div><header class="pj-instant-head"><div><p class="pj-direct-reason">${p(context+" "+availability)}</p></div><label class="pj-portions">Portions<input data-pj-preview-portions type="number" min="1" max="12" step="1" value="${portions}" aria-label="Recipe portions"></label></header><div class="pj-primary-cook">${(additional.length||unresolved.length) ? `<div class="pj-missing-gate" role="status"><strong>Not ready to cook yet</strong><span>${unresolved.length?`Identify ${p(Fe(unresolved.map(row=>row.name)))} above before cooking. The recipe preview does not include these foods.`:`This recipe needs ${p(Fe(additional.map(ae)))}. Create a complete recipe from your confirmed foods instead.`}</span></div>${unresolved.length?`<button type="button" class="btn secondary" data-pj="edit-foods">Correct ingredient names</button>`:`<button type="button" class="btn primary pj-create-available" data-pj="create">${f("sparkle")} Create from my ingredients</button>`}` : `<button type="button" class="btn primary" data-pj="${match.synthetic?"cook-synthetic":"cook-existing"}" data-id="${p(recipe.id)}">${f("cook")} Cook this</button>`}</div><div class="pj-recipe-columns"><section><h4>Ingredients</h4><ul class="pj-ing">${recipe.ingredients.map(item=>`<li><span>${p(x(item.key))}${item.optional?(!selected.includes(item.key)?" (optional; not selected)":" (optional)"):""}</span><strong>${p(displayAmount(item.quantity*portions,item.unit))}</strong></li>`).join("")}</ul></section><section><h4>How to make it</h4><ol class="pj-steps">${steps.map(step=>`<li>${p(step)}</li>`).join("")}</ol></section></div>${plateReview(recipe.ingredients.filter(item=>selected.includes(item.key)),recipe.slot||Ve().slot)}${recipe.note?`<details class="pj-recipe-notes"><summary>Preparation notes</summary><p>${p(recipe.note)}</p></details>`:""}${trustHTML(match,selected)}<div class="pj-instant-actions">${!additional.length&&!unresolved.length&&profileChecks(recipe,!!match.synthetic).safe?`<button type="button" class="btn primary dt-guided-trigger" data-pj="guided-existing" data-id="${p(recipe.id)}">Follow steps one by one</button>`:""}<button type="button" class="btn secondary" data-pj="print">Print recipe</button>${match.synthetic?"":`<a class="pj-link" href="${p(url)}">Full recipe page</a>`}</div></article>`;
    }
    function ze(e, t) { if (!e.length)
        return `<article class="pj-create is-idle"><span class="pj-spark" aria-hidden="true">${f("sparkle")}</span><div><h3>Create a new recipe</h3><p>Tap the foods you have above. Then the app can build the best simple recipe with exactly those foods.</p></div></article>`; if (T && !T.enabled)
        return `<article class="pj-create is-idle"><span class="pj-spark" aria-hidden="true">${f("sparkle")}</span><div><h3>Create a new recipe</h3><p>AI recipe creation is not switched on for this site. The recipes above are made from your foods without it.</p></div></article>`; let s = !t.full.length && !t.kitchen.length, o = null, a = ""; try {
        o = pe(e);
    }
    catch (u) {
        a = u.message;
    } let n = e.map(u => `<li><span class="pj-mini-ic">${_(u, "", q)}</span>${p(x(u))}${k.includes(u) ? ` <button type="button" class="pj-x" data-pj-extra-off="${p(u)}" aria-label="Remove ${p(x(u))}">\xD7</button>` : ""}</li>`).join(""), r = s ? `Want a recipe using all ${e.length} selected foods?` : "Want another recipe?", c = `Create a recipe using <strong>all ${e.length} selected foods</strong>. Ingredient identities and supported cooking steps are checked before a draft is shown.`, h = o?.blockers?.length ? `<div class="pj-warn" role="alert">${o.blockers.map(u => `<p>${p(u.message)}</p>`).join("")}<small>Open "Amounts &amp; options" to change this, or leave out a food.</small></div>` : "", i = o?.eff; return `<article class="pj-create ${s ? "is-lead" : ""}" id="pj-create"><span class="pj-spark" aria-hidden="true">${f("sparkle")}</span><div class="pj-create-main"><p class="pj-eyebrow">${s ? "Built for your ingredients" : "Or make it new"}</p><h3>${p(r)}</h3><p>${c}</p><ul class="pj-create-foods">${n}</ul>${a ? `<div class="pj-warn" role="alert"><p>${p(a)}</p></div>` : ""}${h}${i ? `<p class="pj-settings-line" id="pj-settings-line">${p(Je(i, o.notes))}</p><p class="pj-batch-summary"><strong>Proposed batch:</strong> ${o.request.items.map(item=>p(x(item.key))+" "+p(displayAmount(item.quantity,item.unit))).join("; ")}</p>` : ""}<button type="button" class="btn primary pj-go" data-pj="create" ${a || o?.blockers?.length ? "disabled" : ""}>${f("sparkle")} Create a recipe with these foods</button><small class="pj-fine pj-consent-line">Creates a draft using the food names and estimated amounts above. Your photo is not sent for recipe creation.</small>${Ge(e, i)}</div></article>`; }
    function Ge(e, t) { if (!t)
        return ""; let s = (a, n, r) => `<option value="${a}" ${a === n ? "selected" : ""}>${r}</option>`, o = e.map(a => { let n = y.amounts[a], r = n?.quantity > 0 ? n.quantity : Math.max(.01, Math.round(E[a].suggested * t.servings * 100) / 100), c = n?.unit || E[a].unit, h = a === "egg" ? ["piece"] : ["milk", "oliveOil", "honey", "tahini", "peanutButter"].includes(a) ? ["g", "ml"] : ["rice", "quinoa", "oats", "pasta", "couscous", "lentils"].includes(a) ? ["g"] : ["g", "piece"]; return `<div class="pj-amt"><span>${p(x(a))}</span><input type="number" min="0.01" max="5000" step="any" value="${r}" data-pj-amt="${p(a)}" aria-label="${p(x(a))} total amount"><select data-pj-unit="${p(a)}" aria-label="${p(x(a))} unit">${h.map(i => s(i, c, i === "piece" ? "pieces" : i)).join("")}</select></div>`; }).join(""); return `<details class="pj-options"><summary>Amounts &amp; options</summary><div class="pj-options-grid"><label class="field">Portions<input type="number" min="1" max="12" step="1" value="${t.servings}" data-pj-set="servings"></label><label class="field">Meal<select data-pj-set="slot">${Object.entries(Ue).map(([a, n]) => s(a, t.slot, n)).join("")}</select></label><label class="field">Time<select data-pj-set="maxMinutes">${We.map(a => s(String(a), String(t.maxMinutes), "Up to " + a + " min")).join("")}</select></label><label class="field">Equipment<select data-pj-set="equipment">${Object.entries(Z).map(([a, n]) => s(a, t.equipment, n)).join("")}</select></label></div><label class="pj-check"><input type="checkbox" data-pj-set="allowWater" ${t.allowWater ? "checked" : ""}><span>Water may be used for cooking. No oil, salt or other food is added unless it is selected.</span></label><div class="pj-amts"><strong>Amounts for the whole batch</strong>${o}</div></details>`; }
    function Xe() { let { plan: e, request: t, current: s, meta: o, saved: a } = l, n = (() => { try {
        return He(t.items.map(i => i.key), { settings: t, pantry: I().pantry || [] });
    }
    catch {
        return null;
    } })(), r = n && n.gaps.length ? `<div class="pj-balance"><h5>To make it a fuller meal</h5>${n.gaps.map(i => `<p>No <strong>${p(i.label)}</strong> in this dish yet.${i.suggestions.length ? ` <span class="pj-add">${i.suggestions.slice(0, 3).map(u => `<button type="button" class="pj-add-chip" data-pj-extra="${p(u.key)}">+ ${p(u.label)} <small>${u.inPantry ? "you have this" : "to buy"}</small></button>`).join("")}</span>` : ""}</p>`).join("")}</div>` : n ? '<p class="pj-ok-line">' + f("check") + " Vegetable, protein and grain/starch food groups are listed. This is not a nutrient or portion analysis.</p>" : "", c = s.steps.map(i => `<li>${stepHTML(i)}</li>`).join(""), h = t.items.map(i => `<li><span>${p(x(i.key))}</span><strong>${i.quantity} ${i.unit === "piece" ? i.quantity === 1 ? "piece" : "pieces" : i.unit}</strong></li>`).join(""); return `<article class="pj-result" id="pj-result" tabindex="-1"><div class="pj-result-tag">${f("check")} ${t.items.length} of ${t.items.length} foods used \xB7 nothing added</div><p class="pj-eyebrow">${o.planner ? "Built by local cooking rules" : "AI-assisted recipe"} \xB7 review before cooking</p><h3 class="pj-result-title">${p(s.title)}</h3><p class="pj-result-meta">${t.servings} ${t.servings === 1 ? "portion" : "portions"} \xB7 about ${s.time} min \xB7 ${p(Z[(e.phases||[]).some(ph=>!["prepare","toss","mash","assemble"].includes(ph.action))?t.equipment:"no-cook"])}</p>${o.planner ? `<p class="pj-note">The AI's proposals did not pass the safety checks, so the app built this method from its supported cooking rules. Every food is still used and the same checks were applied.</p>` : ""}<div class="pj-two"><section><h4>Exactly what goes in</h4><ul class="pj-ing">${h}</ul></section><section><h4>How this dish is made</h4><ul class="pj-health">${Oe(t, e).map(i => `<li>${p(i)}</li>`).join("")}</ul></section></div>${r}<h4>How to make it</h4><ol class="pj-steps">${c}</ol>${plateReview(t.items,t.slot,true)}${aiTrustHTML(t)}<p class="pj-fine">An AI-assisted or rule-built recipe is a draft, not verified nutrition advice. Portions and times are estimates; food temperatures come from FoodSafety.gov, not the AI. Check allergens, product labels, preparation states, and storage. This recipe has not been independently kitchen-tested.</p><div class="pj-result-actions">${a ? `<a class="btn primary" href="${p(te(a))}">Open recipe</a><button type="button" class="btn secondary" data-pj="cook">${f("cook")} Cook this</button>` : `<button type="button" class="btn primary" data-pj="save-cook">${f("cook")} Save &amp; cook now</button><button type="button" class="btn secondary" data-pj="save">Save to my recipes</button>`}<button type="button" class="btn secondary dt-guided-trigger" data-pj="guided-created">Follow steps one by one</button><button type="button" class="btn secondary" data-pj="print">Print recipe</button><button type="button" class="btn text" data-pj="again">Change &amp; create again</button></div></article>`; }
    function de() { let e = [["security", "Quick security check"], ["ai", "Planning the cooking method"], ["verify", "Checking every food and step"]], t = e.findIndex(s => s[0] === l.phase); return `<article class="pj-working" id="pj-working" role="region" aria-label="Recipe creation progress"><span class="pj-pot" aria-hidden="true">${f("cook")}<i></i><i></i><i></i></span><h3>Creating your recipe</h3><p class="pj-progress-message" role="status" aria-live="polite">${l.phase === "security" ? "Verifying this browser. No recipe data has been sent yet." : l.phase === "ai" ? "The AI is proposing a cooking method. An app-checked fallback is available when supported." : "Validating every selected food, the equipment and the cooking steps."}</p><div class="dt-security-shell pj-shell" id="pj-security-shell" data-security-shell hidden><strong>Secure recipe check</strong><p id="pj-security-live" role="status">Loading the security check. Nothing has been sent yet.</p><div id="pj-security" class="pj-security"></div></div><ol class="pj-phases">${e.map((s, o) => `<li class="${o < t ? "done" : o === t ? "now" : ""}">${o < t ? f("check") : '<span class="pj-dot"></span>'} ${s[1]}</li>`).join("")}</ol><p class="pj-fine"><span id="pj-elapsed" aria-hidden="true">0 s</span> \xB7 Your selections stay unchanged until you save. If AI fails a check, an app-checked rule method is used when available. <button type="button" class="pj-link" data-pj="cancel">Cancel</button></p></article>`; }
    let renderBusy=false;
    function g() {
        if(renderBusy){P();return;}
        renderBusy=true;
        try { renderJourney(); } finally { renderBusy=false; }
    }
    function renderJourney() {
        const active=document.activeElement;
        const focusedId=d.contains(active)?active.dataset.pjFood:null;
        const focusedAction=d.contains(active)?active.dataset.pj:null;
        const focusedResolve=d.contains(active)?active.dataset.pjResolve:null;
        const extrasWereOpen=d.querySelector('.dt-detected-other')?.open;
        const editWasOpen=d.querySelector('.dt-ingredient-help')?.open;
        const addWasOpen=d.querySelector('.dt-add-missed')?.open;
        w=De();b.classList.toggle("pj-has-results",w.length>0);if(!m&&w.length)ie(w);
        const selected=le(),unknown=Ke(),image=m?"":j.previewURL();
        const matches=selected.length?Be(selected):{full:[],part:[],kitchen:[]};
        const ranked=rankPhotoRecipes(matches,selected);
        suggestions.clear();for(const candidate of ranked.options)suggestions.set(candidate.recipe.id,candidate);
        // A primary recipe must use EVERY selected food. Never promote a partial match.
        if(chosenRecipe&&!suggestions.has(chosenRecipe))chosenRecipe=null;
        const selectedChoice=chosenRecipe?suggestions.get(chosenRecipe):ranked.primary;
        const best=selectedChoice&&selectedChoice.usedAll?selectedChoice:null;
        let viable=best && best.missing.length<=2?best:null;
        if(!viable&&!unknown.length&&selected.length){const fallback=vegetableRecipe(selected);if(fallback){viable=fallback;suggestions.set(fallback.recipe.id,fallback);}}
        const safeRows=w.filter(row=>row.usable&&!row.blocked&&!row.disabled);
        const unclear=w.filter(row=>!row.usable||row.blocked||row.disabled||row.certainty!=="clear"||row.agreement==="single");
        const certain=safeRows.filter(row=>row.certainty==="clear"&&row.agreement!=="single");
        const maybe=w.filter(row=>!certain.includes(row));
        const includedRows=w.filter(row=>row.selected&&row.key&&!row.disabled&&!row.blocked);
        const otherRows=w.filter(row=>!row.selected&&row.key&&!row.disabled&&!row.blocked);
        const unresolvedRows=w.filter(row=>!row.key&&!row.disabled&&!row.blocked&&!dismissedUnknown.has(row.id));
        const leftOutRows=w.filter(row=>(row.blocked||row.disabled)&&(row.key||row.catalog));
        const selectedCount=selected.length;
        const status=unknown.length?`${selectedCount+unknown.length} selected · ${selectedCount} identified · ${unknown.length} need a name check.`:selectedCount?`${selectedCount} ${selectedCount===1?"ingredient":"ingredients"} selected. ${viable?"Recipe idea below.":"Ready to create a recipe using these foods."}`:"Choose any visible foods above to get a recipe.";
        // No unsupported automatic name choices: the user explicitly selects an exact catalog identity.
        const choicesFor=()=>Object.keys($.foodLabels).sort((a,b)=>x(a).localeCompare(x(b)));
        const needsFix=unresolvedRows.length?`<section class="dt-ingredient-resolution" aria-label="Review uncertain foods" role="region"><div class="dt-resolution-intro"><span class="dt-plate-label">OPTIONAL — FOOD NAME REVIEW</span><strong>${unresolvedRows.length} ${unresolvedRows.length===1?'food needs':'foods need'} a name check</strong><p>The photo suggestion is not treated as an ingredient until you identify it. Choose the exact food, or ignore it. No guessing or automatic substitutions.</p></div>${unresolvedRows.map(row=>`<div class="dt-resolve-row dt-review-food"><div class="dt-review-identity"><small>PHOTO SUGGESTION</small><strong>${p(row.name)}</strong><span>Not used in recipes yet</span></div><label>Which food is this?<select data-pj-resolve="${p(row.id)}" aria-label="Identify ${p(row.name)}"><option value="">Choose exact food (optional)</option>${choicesFor(row).map(key=>`<option value="${p(key)}">${p(x(key))}</option>`).join('')}</select></label><button type="button" class="pj-link dt-review-ignore" data-pj-ignore="${p(row.id)}">Ignore suggestion</button></div>`).join('')}<p class="dt-review-note">If a food is not in this catalog, you can use the manual ingredient entry instead. Unsupported foods are never silently substituted.</p></section>`:"";
        const method=l.state==='working'?de():l.state==='done'?Xe():viable?instantRecipe(viable,selected):"";
        const otherChoices=ranked.options.filter(item=>item.recipe.id!==viable?.recipe.id).slice(0,N?ranked.options.length:3);
        const create=selectedCount&&!unknown.length&&l.state==='idle'?ze(selected,matches):"";
        const mainResult=unknown.length ? `${method||`<div class="dt-pending-recipe"><strong>${selectedCount?`Your ${selectedCount} identified ${selectedCount===1?"food is":"foods are"} ready to plan.`:"Your selections are preserved."}</strong><p>Identify the ${unknown.length} unresolved ${unknown.length===1?"food":"foods"} above to include everything in one recipe. Or use only the ${selectedCount} identified ${selectedCount===1?"ingredient":"ingredients"}.</p>${selectedCount?`<button class="btn secondary" type="button" data-pj="use-known">Use only ${selectedCount} identified ${selectedCount===1?"food":"foods"}</button>`:""}</div>`}` : l.state==='idle'&&!viable?create:method;
        const optionalAI=l.state==='idle'&&viable&&create?`<details class="dt-ai-other"><summary>Want a freshly created AI recipe instead?</summary>${create}</details>`:"";
        d.innerHTML=`<section class="dt-scan-flow" aria-label="Recognized foods and your recipe">
            <header class="dt-scan-flow-head"><div class="dt-scan-photo">${image?`<img src="${p(image)}" alt="The photo you selected">`:f("camera")}</div>
            <div class="dt-scan-flow-title"><p class="dt-scan-kicker">YOUR INGREDIENTS</p><h2 id="pj-title" tabindex="-1">Choose what goes in.</h2><p>Tap any food to include or remove it. Your recipe updates automatically.</p></div><button class="dt-photo-restart" type="button" data-pj="restart" aria-label="Start over with another photo">New photo</button></header>
            <section class="dt-detected" aria-label="Detected ingredients"><div class="dt-found-head"><strong>${w.length} ${w.length===1?"food suggestion":"food suggestions"} from your photo</strong><small>${includedRows.length} selected · ${selectedCount} identified${unknown.length?` · ${unknown.length} to clarify`:""}${leftOutRows.length?` · ${leftOutRows.length} left out`:""}</small></div>
            ${includedRows.length?`<div class="dt-selected-foods-head">YOUR SELECTED FOODS</div><div class="pj-chips" role="group" aria-label="Foods included in your recipe">${includedRows.map(Qe).join("")}</div>`:""}
            ${needsFix}
            ${otherRows.length?`<details class="dt-detected-other" ${extrasWereOpen===true||(!includedRows.length&&extrasWereOpen!==false)?'open':""}><summary>Other suggestions (${otherRows.length}) <span>select only if you see them</span></summary><div class="pj-chips">${otherRows.map(Qe).join("")}</div></details>`:""}
            ${dtLeftOut(leftOutRows)}
            ${k.length?`<div class="dt-manual-choices" aria-label="Manually added ingredients"><strong>Added by you:</strong>${k.map(key=>`<span class="dt-manual-choice">${p(x(key))}<button type="button" data-pj-extra-off="${p(key)}" aria-label="Remove ${p(x(key))}">×</button></span>`).join("")}</div>`:""}
            <div class="dt-selected-status" role="status" aria-live="polite">${p(status)}</div>
            <details class="dt-add-missed" ${addWasOpen?'open':""}><summary>Missing a food? Add it yourself</summary><div class="dt-add-controls"><label>Ingredient <select data-pj-add-select aria-label="Choose a missed ingredient"><option value="">Choose an ingredient</option>${Object.entries($.foodLabels).filter(([key])=>!selected.includes(key)).sort((a,b)=>a[1].localeCompare(b[1])).map(([key,name])=>`<option value="${p(key)}">${p(name)}</option>`).join("")}</select></label><button type="button" class="btn secondary" data-pj="add-manual">Add to my recipe</button></div><small>Manually added foods are marked as your choice, not an AI detection.</small></details>
            </section>
            <section class="dt-recipe-focus" aria-label="Your recipe"><p class="dt-recipe-focus-kicker">${selectedCount?"YOUR RECIPE":"YOUR NEXT STEP"}</p>
            ${!selectedCount?'<div class="dt-no-selected">Select a food above and we will find a recipe for it.</div>':mainResult}
            ${optionalAI}
            ${selectedCount&&!viable&&ranked.options.length?`<details class="dt-other-recipes"><summary>Recipes that need extra ingredients</summary>${ranked.options.slice(0,3).map(item=>V(item,0)).join("")}</details>`:""}
            ${selectedCount&&viable&&otherChoices.length?`<details class="dt-other-recipes" ${N?'open':""}><summary>Other ideas (optional)</summary>${otherChoices.map(item=>V(item,0)).join("")}</details>`:""}
            </section>
            <footer class="dt-scan-footer"><p>Suggestions only. Check ingredient names, labels and quantities before cooking.</p>
            <details class="dt-ingredient-help" ${editWasOpen?'open':""}><summary>Fix a food name or save foods</summary><div class="dt-help-actions">${m?'':`<button type="button" class="pj-link" data-pj="edit">Correct names</button>`}${ue()}</div></details><div class="dt-release-version">Photo recipe engine v15.20.0</div></footer>
            </section>`;
        Pe(d);
        if(focusedResolve)d.querySelector(`[data-pj-resolve="${CSS.escape(focusedResolve)}"]`)?.focus({preventScroll:true});
        else if(focusedId)d.querySelector(`[data-pj-food="${CSS.escape(focusedId)}"]`)?.focus({preventScroll:true});
        else if(focusedAction)d.querySelector(`[data-pj="${CSS.escape(focusedAction)}"]`)?.focus({preventScroll:true});
        else if(active?.matches?.("[data-pj-preview-portions]"))d.querySelector("[data-pj-preview-portions]")?.focus({preventScroll:true});
    }
    let he = 0, P = () => { cancelAnimationFrame(he), he = requestAnimationFrame(g); };
    function Q() { return W || (W = fetch(q + "api/recipes/status", { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(1e4) }).then(e => e.ok ? e.json() : null).then(e => { T = e && e.version === "1.0.0" ? e : { enabled: !1 }; if(l.state!=="working")P(); }).catch(() => { T = { enabled: !1, unreachable: !0 }; if(l.state!=="working")P(); }), W); }
    async function Ze(e) { return Ie({ container: d.querySelector("#pj-security"), siteKey: T?.siteKey, action: "recipe_ingredients", isCurrent: () => e === S && l.state === "working", onState: t => { let s = d.querySelector("#pj-security-live"); s && (s.textContent = t === "interaction" ? "Please complete the visible security check below. Nothing has been sent yet." : t === "loading" ? "Loading the security check. Nothing has been sent yet." : "Checking this browser. Nothing has been sent yet."); } }); }
    function C() { clearInterval(U), U = null; let e = d.querySelector("#pj-security"); e && Le(e); }
    let me = e => { l.phase = e; let t = d.querySelector("#pj-working"); if (t) {
        let s = document.createElement("div");
        s.innerHTML = de(), t.replaceWith(s.firstElementChild), ge();
    } };
    function ge() { clearInterval(U); let e = () => { let t = d.querySelector("#pj-elapsed"); if (!t) return; const seconds = Math.floor((performance.now() - oe) / 1e3); t.textContent = seconds + " s elapsed"; if (seconds >= 20) { const live = d.querySelector(".pj-progress-message"); if(live && !live.dataset.slowNotice) { live.dataset.slowNotice="true"; live.textContent = l.phase === "security" ? "The security check is taking longer than usual. You can cancel and retry without losing your ingredients." : "The AI is taking longer than usual. The app will use its checked cooking rules if a valid AI proposal is unavailable."; } } }; e(), U = setInterval(e, 1e3); }
    function R(e, t) { C(), l = { state: "idle", error: e }, g(); let quick = d.querySelector(".pj-primary-cook .pj-create-available"), s = quick?.parentElement || d.querySelector("#pj-create .pj-create-main"); if (!s) {
        O(e); return;
    } let o = t && Ce(t), a = document.createElement("div"); a.className = "pj-warn", a.setAttribute("role", "alert"), a.innerHTML = "<p>" + p(e) + "</p>" + (t?.ownerAction ? "<p><strong>Site owner:</strong> in Cloudflare Turnstile, add <code>" + p(Ae()) + "</code> to the existing widget's Hostname Management and keep its matching site key and secret.</p>" : "") + (o && t.retryable !== !1 ? "<p><small>Tap Create a recipe to retry. Your foods and amounts are kept.</small></p>" : ""), (quick || s.querySelector(".pj-go"))?.before(a); }
    async function fe() { if (Ke().length) {O("Identify every selected food first. No ingredients were omitted.");return;} if (l.state === "working")
        return; let e = le(); if (!e.length)
        return; let t; try {
        t = pe(e);
    }
    catch (o) {
        R(o.message);
        return;
    } if (t.blockers.length) {
        R(t.blockers.map(blocker=>blocker.message).filter(Boolean).join(" ") || "These foods cannot be safely combined with your saved settings.");
        return;
    } if (!T?.enabled && (await Q(), !T?.enabled)) {
        R("AI recipe creation is not available right now. The recipes above still work.");
        return;
    } if (navigator.onLine === !1) {
        R("You are offline. Reconnect to create a new recipe.");
        return;
    } let s = ++S; l = { state: "working", phase: "security" }, oe = performance.now(), g(), ge(), d.querySelector("#pj-working")?.scrollIntoView({ block: "center", behavior: L() ? "instant" : "smooth" }); try {
        let o = await Ze(s);
        if (s !== S)
            return;
        me("ai"), M = new AbortController;
        let a = setTimeout(() => M?.abort(), 78e3), n, r;
        try {
            n = await fetch(q + "api/recipes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", credentials: "same-origin", signal: M.signal, body: JSON.stringify({ input: t.request, token: o, consent: !0, amountsConfirmed: !0 }) }), r = await n.json().catch(() => ({error:{code:"invalid_reply",message:"The recipe server returned an unreadable response. Retry without losing your ingredients."}}));
        }
        finally {
            clearTimeout(a);
        }
        if (s !== S)
            return;
        if (!n.ok)
            throw Ee(r, "The recipe service could not complete this request.", "recipe_ingredients");
        if (r?.version !== "1.0.0")
            throw Error("The recipe service returned an incompatible response.");
        me("verify");
        let c = Ne(r.plan, t.request);
        if (c.status === "no_fit") {
            C(), l = { state: "idle" }, g();
            let i = r.blockers && r.blockers.length ? r.blockers.map(u => u.message).join(" ") : Re(c);
            R(i);
            return;
        }
        let h = G(c, t.request);
        h.origin = { type: "ai-assisted", model: String(r.model || "configured-model").slice(0, 160), createdAt: new Date().toISOString(), foods: t.request.items.map(i => i.key), batchServings: t.request.servings, waterAllowed: t.request.allowWater, waterRequired: h.waterRequired, version: 1 }, C(), l = { state: "done", plan: c, request: t.request, current: h, meta: r, saved: null }, g(), d.querySelector("#pj-result")?.scrollIntoView({ block: "start", behavior: L() ? "instant" : "smooth" }), d.querySelector("#pj-result")?.focus({ preventScroll: !0 }), et();
    }
    catch (o) {
        if (s !== S)
            return;
        R((o.name === "AbortError" || o.name === "TimeoutError") ? "Recipe creation stopped or timed out. Nothing was saved. Try again in a moment." : o.message, o);
    } }
    function Y() { const wasWorking = l.state === "working"; S++, M?.abort(), M = null, C(), l = { state: "idle" }, g(); if(wasWorking) O("Cancelled. Your selected ingredients and amounts are unchanged; no recipe was saved."); }
    function be() { if (l.state !== "done" || l.saved)
        return l.saved; try {
        let e = G(l.plan, l.request), t = xe(), s = { id: t, title: e.title, time: e.time, ingredients: e.ingredients, steps: e.steps, mealTags: e.mealTags, origin: l.current.origin }, o = { ...s, slot: s.mealTags[0], tags: [], userCreated: !0 };
        if (!$e(o, I(), { slot: o.slot, time: !1 }))
            throw Error("This recipe conflicts with your current food or equipment settings.");
        return ee(a => { if (a.ownRecipes.length >= 100)
            throw Error("Your kitchen has reached its 100 personal-recipe limit."); a.ownRecipes.push(s), a.favorites = [...new Set([...a.favorites, t])]; }) ? (l.saved = t, g(), ne?.(), O(Ye() ? "Saved to your recipes." : "Kept for this session only: browser storage failed. Export your kitchen before leaving."), t) : null;
    }
    catch (e) {
        return O(e.message), null;
    } }
    function et() { if (L())
        return; let e = (l.request?.items || []).map(s => s.key); if (!e.length)
        return; let t = document.createElement("div"); t.className = "pj-burst", t.setAttribute("aria-hidden", "true"); for (let s = 0; s < 14; s++) {
        let o = document.createElement("span");
        o.className = "pj-bit b" + s % 7, o.innerHTML = _(e[s % e.length], "", q), t.append(o);
    } (d.querySelector("#pj-result") || d).append(t), setTimeout(() => t.remove(), 2600); }
    d.addEventListener("click", e => {
        if(e.target.closest('[data-pj="use-known"]')){
            const unknownIDs=new Set(w.filter(row=>row.selected&&!row.key).map(row=>row.id));
            if(!unknownIDs.size)return;
            if(l.state==="working")Y();
            B((id,selected)=>selected&&!unknownIDs.has(id));
            requestAnimationFrame(()=>d.querySelector("#pj-create")?.scrollIntoView({block:"start",behavior:L()?"instant":"smooth"}));
            return;
        }
        if(e.target.closest('[data-pj="add-manual"]')){
            const select=d.querySelector('[data-pj-add-select]');const key=select?.value;
            if(!key||!E[key]||K(key)){O(!key?"Choose an ingredient first.":"This food is excluded by your saved settings.");return;}
            if(!k.includes(key)&&!re().includes(key))k.push(key);
            chosenRecipe=null;invalidateSelection();g();
            d.querySelector('.dt-add-missed')?.setAttribute('open','');return;
        }
        const ignored=e.target.closest('[data-pj-ignore]');
        if(ignored){dismissedUnknown.add(ignored.dataset.pjIgnore);const id=ignored.dataset.pjIgnore;
            if(w.some(row=>row.id===id&&row.selected))B((row,selected)=>row===id?false:selected);
            else g();
            d.querySelector('.dt-ingredient-resolution select')?.focus({preventScroll:true});return;}
        const removePill=e.target.closest("[data-pj-remove]"); if(removePill){e.preventDefault();const id=removePill.dataset.pjRemove;if(l.state==="working")Y();if(l.state==="done")l={state:"idle"}; B((row,selected)=>row===id?false:selected);requestAnimationFrame(()=>{const next=d.querySelector("[data-pj=edit-foods]")||d.querySelector("[data-pj=all]");next?.focus({preventScroll:true});});return;}
        const recipeButton=e.target.closest('[data-pj-open]');
        if(recipeButton){e.preventDefault();chosenRecipe=recipeButton.dataset.pjOpen;g();d.querySelector('#pj-instant-recipe')?.focus({preventScroll:true});d.querySelector('#pj-instant-recipe')?.scrollIntoView({block:'start',behavior:L()?'instant':'smooth'});return;}
        let t = e.target.closest("[data-pj-food]"); if (t) {
        if (t.dataset.blocked === "true") {
            O(t.querySelector(".pj-chip-name")?.textContent + " is excluded by your settings.");
            return;
        }
        let n = t.dataset.pjFood;
        const clicked=w.find(row=>row.id===n);
        if(clicked&&!clicked.selected&&clicked.key&&(re().includes(clicked.key)||k.includes(clicked.key))){O(x(clicked.key)+" is already selected. It is counted only once.");return;}
        l.state === "working" && Y(), l.state === "done" && (l = { state: "idle" }), B((r, c) => r === n ? !c : c);
        return;
    } e.target.closest("a[href]") && A.set(F, String(Date.now())); let s = e.target.closest("[data-pj-extra]"); if (s) {
        let n = s.dataset.pjExtra;
        E[n] && !k.includes(n) && k.push(n), invalidateSelection(), g();
        return;
    } let o = e.target.closest("[data-pj-extra-off]"); if (o) {
        k = k.filter(n => n !== o.dataset.pjExtraOff), Y();
        return;
    } let a = e.target.closest("[data-pj]"); if (a)
        switch (a.dataset.pj) {
            case "edit-foods":{editMode=!editMode;g();requestAnimationFrame(()=>{const next=editMode?d.querySelector("#pj-basket [data-pj-food]"):d.querySelector("[data-pj=edit-foods]");next?.focus({preventScroll:true});if(editMode)d.querySelector("#pj-basket")?.scrollIntoView({block:"nearest",behavior:L()?"instant":"smooth"});});break;}
            case "all":
                {const clear=new Set(w.filter(row=>!row.blocked&&!row.disabled&&row.certainty==="clear"&&row.agreement!=="single"&&row.usable).map(row=>row.id));l.state === "working" && Y();B((id,selected)=>selected||clear.has(id));setTimeout(()=>{const next=d.querySelector("#pj-instant-recipe")||d.querySelector("#pj-create");if(next){next.scrollIntoView({block:"start",behavior:L()?"instant":"smooth"});if(next.matches("[tabindex]"))next.focus({preventScroll:true});}},100);}
                break;
            case "skip-unknown":
                {const uncertain=new Set(w.filter(row=>row.selected&&!row.key).map(row=>row.id)); if(uncertain.size)B((id,selected)=>selected&&!uncertain.has(id));setTimeout(()=>{const next=d.querySelector("#pj-instant-recipe")||d.querySelector("#pj-create");next?.scrollIntoView({block:"start",behavior:L()?"instant":"smooth"});},100);}break;
            case "none":
                l.state === "working" && Y(), B(() => !1), k = [];
                break;
            case "edit": {
                let n = b.dataset.journeyEdit === "on";
                n ? delete b.dataset.journeyEdit : b.dataset.journeyEdit = "on", a.textContent = n ? "Edit names" : "Hide details", n || b.querySelector("#photo-results")?.scrollIntoView({ block: "start", behavior: L() ? "instant" : "smooth" });
                break;
            }
            case "restart":
                m ? tt() : j.clear();
                break;
            case "more":
                N = !N, g();
                break;
            case "create":
                fe();
                break;
            case "print":
                window.print();
                break;
            case "cancel":
                Y();
                break;
            case "again":
                l = { state: "idle" }, g(), d.querySelector("#pj-create")?.scrollIntoView({ block: "center", behavior: L() ? "instant" : "smooth" });
                break;
            case "save":
                be();
                break;
            case "save-cook": {
                let n = be();
                n && setTimeout(() => se(n, l.request.servings), 150);
                break;
            }
            case "cook":
                se(l.saved, l.request.servings);
                break;
            case "cook-synthetic": {
                const match=suggestions.get(a.dataset.id);
                if(!match?.synthetic)return;
                if(!profileChecks(match.recipe,true).safe){O('Your food exclusions changed. Review the recipe again.');return;}
                const steps=match.recipe.steps||[];
                let i=0;
                const dialog=document.createElement("dialog");dialog.className="dt-local-cook";
                const paint=()=>{dialog.innerHTML=`<div class="dt-local-cook-body"><p class="dt-scan-kicker">COOKING YOUR RECIPE</p><h2>${p(match.recipe.title)}</h2><p class="dt-step-progress">Step ${i+1} of ${steps.length}</p><p class="dt-step-instruction" tabindex="-1">${p(steps[i])}</p><div class="dt-step-buttons"><button type="button" class="btn secondary" data-local-step="back" ${i===0?"disabled":""}>Previous</button><button type="button" class="btn primary" data-local-step="next">${i===steps.length-1?"Finish":"Next step"}</button><button type="button" class="pj-link" data-local-step="close">Close</button></div></div>`;};
                paint();dialog.addEventListener("click",event=>{const btn=event.target.closest("[data-local-step]");if(!btn)return;const action=btn.dataset.localStep;if(action==="close"||(action==="next"&&i===steps.length-1)){dialog.close();return;}i=Math.max(0,Math.min(steps.length-1,i+(action==="next"?1:-1)));paint();});
                dialog.addEventListener("close",()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();dialog.querySelector(".dt-step-instruction")?.focus({preventScroll:true});
                break;
            }
            case "guided-existing": {
                const match=suggestions.get(a.dataset.id);
                if(!match||requiredMissingFoods(match.recipe,le()).length||Ke().length||!profileChecks(match.recipe,!!match.synthetic).safe){O('This recipe needs more confirmed foods or a dietary review before guided cooking.');break;}
                const portions=previewPortions||Ve().servings;
                openGuidedSteps({title:match.recipe.title,steps:match.recipe.steps||[],ingredients:match.recipe.ingredients.map(item=>x(item.key)+' — '+displayAmount(item.quantity*portions,item.unit)),context:'Estimates only. Verify every ingredient and amount before cooking.'});break;
            }
            case "guided-created": {
                if(l.state!=="done"||!l.current||!l.request){O('Create and review a recipe before starting guided steps.');break;}
                openGuidedSteps({title:l.current.title,steps:l.current.steps||[],ingredients:l.request.items.map(item=>x(item.key)+' — '+displayAmount(item.quantity,item.unit)),context:'AI-assisted and app-checked draft. Confirm the quantities and safe cooking steps.'});break;
            }
            case "cook-existing": {
                const match=suggestions.get(a.dataset.id);
                if(match && $e(match.recipe,I(),{slot:match.recipe.slot,time:false})) se(match.recipe.id,previewPortions||Ve().servings,match.recipe);
                else O("Your profile changed. Review the matching recipes again.");
                break;
            }
            case "save-foods": {
                if(m) {
                    const foods=canonicalSelected(De());
                    if(!foods.length) {O("Select and identify a food first.");break;}
                    const ok=ee(state=>{state.pantry=[...new Set([...state.pantry,...foods])];});
                    if(ok) {saveNotice=Ye()?"Saved to your kitchen. Your recipe and selection are unchanged.":"Available in this session only. Export a backup before closing.";ne?.();O(saveNotice);g();}
                    break;
                }
                const result=j.saveFoods({toPantry:true,preserveSelection:true});
                if(result?.ok) {saveNotice=Ye()?(result.inventoryCount?"Saved to your kitchen. Your recipe and selection are unchanged.":"Saved as notes only; no inventory was inferred."):"Available in this session only. Export a backup before closing.";g();}
                break;
            }
        }
}), d.addEventListener("change", e => {
        const resolved=e.target.closest('[data-pj-resolve]');
        if(resolved){
            const key=resolved.value,id=resolved.dataset.pjResolve;
            if(!key||!E[key])return;
            if(K(key)){O("That food conflicts with your saved exclusions. Choose another or remove it.");resolved.value="";return;}
            const name=$.foodLabels[key]||E[key].label;
            if(m){const row=m.find(row=>row.id===id);if(row){row.name=name;row.key=key;row.catalog=key;row.usable=true;row.selected=true;}ie(m);invalidateSelection();g();return;}
            const row=[...b.querySelectorAll('.photo-food')].find(el=>el.dataset.item===id);
            if(!row){O("The previous scan is no longer available. Please rescan.");return;}
            const typed=row.querySelector('[data-food-name]'),exact=row.querySelector('[data-food-key]');
            if(typed)typed.value=name;
            const display=row.querySelector('.photo-food-name');if(display)display.textContent=name;
            row.dataset.suggestion='corrected';const quality=row.querySelector('.photo-certainty');if(quality){quality.className='photo-certainty corrected';quality.textContent='Confirmed by you';}
            if(exact){exact.value=key;exact.dispatchEvent(new Event('change',{bubbles:true}));}
            dismissedUnknown.delete(id);
            invalidateSelection();P();
            requestAnimationFrame(()=>{(d.querySelector(`[data-pj-food="${CSS.escape(id)}"]`)||d.querySelector('#pj-instant-recipe')||d.querySelector('#pj-create'))?.focus({preventScroll:true});});
            return;
        }
        if(e.target.matches('[data-pj-add-select]'))return;
        if(e.target.matches('[data-pj-preview-portions]')) {
            previewPortions=Math.min(12,Math.max(1,Math.round(Number(e.target.value)||1)));g();return;
        }
        let t = e.target.closest("[data-pj-set]"); if (t) {
        if(l.state!=="idle"){S++;M?.abort();C();l={state:"idle"};}
        let a = t.dataset.pjSet, n = t.type === "checkbox" ? t.checked : t.value;
        a === "servings" && (n = Math.min(12, Math.max(1, Math.round(Number(n) || 1)))), a === "maxMinutes" && (n = Number(n)), y.over[a] = n, a === "servings" && (y.amounts = {}), l = { state: "idle" }, g(), d.querySelector(".pj-options")?.setAttribute("open", "");
        return;
    } let s = e.target.closest("[data-pj-amt]"), o = e.target.closest("[data-pj-unit]"); if (s || o) {
        if(l.state!=="idle"){S++;M?.abort();C();l={state:"idle"};}
        let a = (s || o).dataset.pjAmt || (s || o).dataset.pjUnit, n = y.amounts[a] || {};
        s && (n.quantity = Number(s.value)), o && (n.unit = o.value), y.amounts[a] = n, l = { state: "idle" }, g(), d.querySelector(".pj-options")?.setAttribute("open", "");
    } }), document.addEventListener("dt:photo", e => { let t = e.detail?.type;         if (t === "results") {
            m=null;chosenRecipe=null;selectionStamp="";saveNotice="";editMode=false;dismissedUnknown.clear();
            M?.abort();M=null;N=false;k=[];l={state:"idle"};S++;C();
            delete b.dataset.journeyEdit;b.dataset.journey="on";d.hidden=false;
            const clear=new Set(De().filter(row=>!row.blocked&&!row.disabled&&row.usable&&row.certainty==="clear"&&row.agreement!=="single").map(row=>row.id));
            if(clear.size)j.setSelection((id,was)=>was||clear.has(id));
            document.body.dataset.pantryStage="recipe";g();Q();requestAnimationFrame(()=>{d.scrollIntoView({block:"start",behavior:L()?"instant":"smooth"});(d.querySelector("#pj-instant-recipe")||d.querySelector("#pj-create")||d.querySelector("#pj-title"))?.focus({preventScroll:true});});
        }
    else if (t === "selection" && b.dataset.journey === "on" && !m) {
        invalidateSelection(); P();
    }
    else
        (t === "reset" || t === "error") && !m && (S++, M?.abort(), C(), l = { state: "idle" }, k = [], delete b.dataset.journey, delete b.dataset.journeyEdit, b.classList.remove("pj-has-results"), d.hidden = !0, d.replaceChildren()); t === "results" && (m = null); });
    function tt() { document.body.dataset.pantryStage="start"; dismissedUnknown.clear(); m = null, A.del(D), A.del(F), S++, M?.abort(), C(), l = { state: "idle" }, k = [], delete b.dataset.journey, delete b.dataset.journeyEdit, b.classList.remove("pj-has-results"), d.hidden = !0, d.replaceChildren(), b.querySelector("#photo-drop")?.scrollIntoView({ block: "center", behavior: L() ? "instant" : "smooth" }); }
    function ye() { let e = Date.now() - Number(A.get(F) || 0); if (!(e >= 0 && e < 30 * 6e4))
        return; A.del(F); let t = _e(); !t || j.result() || (m = t.foods.map(s => ({ ...s, iconHTML: "", evidence: "", alternatives: [], disabled: !1 })), document.querySelector("#dt-photo-fold")?.setAttribute("open", ""), b.dataset.journey = "on", d.hidden = !1, document.body.dataset.pantryStage="recipe", g(), Q()); }
    return addEventListener("pageshow", e => { e.persisted && ye(); }), ye(), { render: g };
}
export { St as initPhotoJourney };
