import { $ as Me, M as qe, S as p, T as f, U as _, Y as Te } from "./chunk-MNNQ7WCU.js";
import { a as E, b as z, c as Ne, d as Re, e as G, f as He, g as Oe, h as X } from "./chunk-ME7AO2VB.js";
import { $ as xe, T as ke, X as we, Y as Se, aa as Ae, ca as Ce, da as Ee, ea as Le, fa as Ie, z as $e } from "./chunk-O3VEKXW7.js";
var We = [10, 15, 20, 30, 45, 60], Ue = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" }, Z = { hob: "Hob & pan", oven: "Oven", "no-cook": "No-cook" }, pt = (j = new Date) => { let $ = j.getHours(); return $ < 10 ? "breakfast" : $ < 15 ? "lunch" : $ < 21 ? "dinner" : "snack"; }, Fe = j => j.length < 2 ? j.join("") : j.slice(0, -1).join(", ") + " and " + j.at(-1), L = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function currentKitchenScope() { try {return JSON.parse(localStorage.getItem("dtable:profiles:v1")||"null")?.active || "default";} catch{return "unavailable";} }
function St({ scanner: j, data: $, getState: I, commit: ee, toast: O, recipeURL: te, hydrate: Pe = () => { }, base: q = "/", cookRecipe: se = () => { }, isDurable: Ye = () => !0, refresh: ne = () => { } }) {
    let b = document.querySelector("#photo-kitchen"), d = document.querySelector("#photo-journey");
    if (!b || !d || !j)
        return null;
    let x = e => $.foodLabels?.[e] || E[e]?.label || e, ae = e => x(e).toLowerCase(), w = [], N = !1, k = [], T = null, W = null, U = null, oe = 0, M = null, S = 0, y = { over: {}, amounts: {} }, l = { state: "idle" }, D = "dtable:journey:15.5.1", F = "dtable:journey:back:15.5.1", A = { get(e) { try {
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
    const baseRows = De;
    De = () => baseRows().map(row => {
        const scene=m?"ingredients":j.result()?.scene;
        return scene && scene!=="ingredients" ? {...row,key:"",catalog:null,usable:false} : row;
    });
    function B(e) { if (!m) {
        j.setSelection(e);
        return;
    } for (let t of m) {
        let s = !!e(t.id, t.selected);
        s !== t.selected && (t.selected = s, s && !t.key && (t.key = t.catalog || ""));
    } ie(m), invalidateSelection(), P(); }
    let chosenRecipe = null, previewPortions = null, selectionStamp = "", saveNotice = "";
    const suggestions = new Map();
    const canonicalSelected = rows => [...new Set(rows.filter(row=>row.selected && row.key && !row.blocked).map(row=>row.key))];
    const snapshotKey = () => JSON.stringify(De().map(row=>[row.id,row.key,row.selected,row.blocked,row.name,row.form]));
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
    let Je = (settings, notes) => `${Ue[settings.slot]} / ${settings.servings} ${settings.servings===1?"portion":"portions"} / ${Z[settings.equipment]}${settings.allowWater?" + cooking water":""} / up to ${settings.maxMinutes} min${notes.length?" ("+notes.join(", ")+")":""}`;
    function Qe(row) {
        const key=row.key||row.catalog, blocked=row.blocked||row.disabled;
        const unsure=row.certainty!=="clear"||row.agreement==="single";
        const aria=`${row.name}, ${row.selected?"included":"left out"}${unsure?", uncertain suggestion; confirm only if you recognize it":""}${blocked?", unavailable for this kitchen":""}`;
        return `<button type="button" class="pj-chip ${row.selected?"is-on":""} ${!row.usable?"is-note":""} ${unsure?"is-unsure":""} ${blocked?"is-blocked":""}" aria-pressed="${row.selected}" ${blocked?'aria-disabled="true" data-blocked="true"':""} data-pj-food="${p(row.id)}" aria-label="${p(aria)}"><span class="pj-chip-ic" aria-hidden="true">${key?_(key,"",q):f("leaf")}</span><span class="pj-chip-name">${p(row.name)}${unsure?'<small>Check this food</small>':""}</span><span class="pj-chip-tick" aria-hidden="true">${f("check")}</span></button>`;
    }
    function ue() {
        if(!re().length && !Ke().length) return "";
        const saved=re().length && re().every(key=>I().pantry.includes(key)) && !Ke().length;
        return `<footer class="pj-save-optional"><div><strong>Keep these foods for next time</strong><small>Optional. Your recipes are already available above.</small></div><button type="button" class="pj-link" data-pj="save-foods" ${(saved&&Ye())||l.state==="working"?"disabled":""}>${saved&&Ye()?"Saved in your kitchen":"Add these foods to my kitchen"}</button>${saveNotice?`<p role="status">${p(saveNotice)}</p>`:""}</footer>`;
    }
    function V(match,index,kind="full") {
        const recipe=match.recipe; suggestions.set(recipe.id,match);
        const extras=match.missing||[];
        return `<button type="button" class="pj-card pj-recipe-choice ${recipe.id===chosenRecipe?"is-best":""}" data-pj-open="${p(recipe.id)}" aria-label="Read ${p(recipe.title)} here" aria-pressed="${recipe.id===chosenRecipe}">${Te(recipe,$,q,{sizes:"(max-width: 600px) 44vw, 240px"})}<span class="pj-card-body"><strong class="pj-card-title">${p(recipe.title)}</strong><span class="pj-need">${match.usedAll?"Uses all selected foods":"Uses "+match.used.length+" selected foods"}${extras.length?" / needs "+extras.length+" more":""}</span><span class="pj-time">About ${recipe.time} min</span></span></button>`;
    }
    const J=(title,subtitle,cards,classes="")=>cards.length?`<section class="pj-tier ${classes}"><div class="pj-tier-head"><h4>${title}</h4>${subtitle?`<span class="pj-sub">${subtitle}</span>`:""}</div><div class="pj-cards">${cards.join("")}</div></section>`:"";
    function displayAmount(quantity,unit) {
        const n=Math.round(quantity*100)/100;
        return `${n} ${unit==="piece"?(n===1?"piece":"pieces"):unit}`;
    }
    function instantRecipe(match,selected) {
        if(!match) return "";
        const recipe=match.recipe, portions=previewPortions||Ve().servings;
        const local=!!match.local;
        const required=[...new Set(recipe.ingredients.filter(item=>!item.optional).map(item=>item.key))];
        const additional=required.filter(key=>!selected.includes(key));
        const omitted=selected.filter(key=>!required.includes(key));
        const context=omitted.length?`Uses ${match.used.length} of ${selected.length} selected foods. Leaves out ${Fe(omitted.map(ae))}.`:`Uses all ${selected.length} selected ${selected.length===1?"food":"foods"}.`;
        const availability=additional.length?`Also requires ${Fe(additional.map(ae))} beyond the foods you selected. Add them before cooking.`:"No other listed foods required. Check amounts before cooking.";
        const steps=Array.isArray(recipe.steps)?recipe.steps:[];
        const url=local?Se(recipe,q):te(recipe.id);
        return `<article id="pj-instant-recipe" class="pj-instant" tabindex="-1" data-recipe-id="${p(recipe.id)}"><header class="pj-instant-head"><div><p class="pj-eyebrow">${local?"Quick recipe / local template":"From your recipe collection"}</p><h3>${p(recipe.title)}</h3><p class="pj-direct-reason">${p(context+" "+availability)}</p><p class="pj-fine">About ${recipe.time} min / estimate, not a tested cooking time</p></div><label class="pj-portions">Portions<input data-pj-preview-portions type="number" min="1" max="12" step="1" value="${portions}" aria-label="Recipe portions"></label></header><div class="pj-recipe-columns"><section><h4>Ingredients</h4><ul class="pj-ing">${recipe.ingredients.map(item=>`<li><span>${p(x(item.key))}${item.optional?" (optional)":""}</span><strong>${p(displayAmount(item.quantity*portions,item.unit))}</strong></li>`).join("")}</ul><small class="pj-fine">Recipe amounts, not quantities measured from your photo.</small></section><section><h4>How to make it</h4><ol class="pj-steps">${steps.map(step=>`<li>${p(step)}</li>`).join("")}</ol></section></div>${recipe.note?`<details class="pj-recipe-notes"><summary>Preparation notes</summary><p>${p(recipe.note)}</p></details>`:""}<div class="pj-instant-actions"><button type="button" class="btn primary" data-pj="cook-existing" data-id="${p(recipe.id)}">${f("cook")} Cook step by step</button><a class="pj-link" href="${p(url)}">Full recipe page</a></div></article>`;
    }
    function ze(e, t) { if (!e.length)
        return `<article class="pj-create is-idle"><span class="pj-spark" aria-hidden="true">${f("sparkle")}</span><div><h3>Create a new recipe</h3><p>Tap the foods you have above. Then the app can build the best simple recipe with exactly those foods.</p></div></article>`; if (T && !T.enabled)
        return `<article class="pj-create is-idle"><span class="pj-spark" aria-hidden="true">${f("sparkle")}</span><div><h3>Create a new recipe</h3><p>AI recipe creation is not switched on for this site. The recipes above are made from your foods without it.</p></div></article>`; let s = !t.full.length && !t.kitchen.length, o = null, a = ""; try {
        o = pe(e);
    }
    catch (u) {
        a = u.message;
    } let n = e.map(u => `<li><span class="pj-mini-ic">${_(u, "", q)}</span>${p(x(u))}${k.includes(u) ? ` <button type="button" class="pj-x" data-pj-extra-off="${p(u)}" aria-label="Remove ${p(x(u))}">\xD7</button>` : ""}</li>`).join(""), r = s ? `No existing recipe uses all ${e.length} of your foods together.` : "Want something new?", c = `Create a recipe using <strong>all ${e.length} selected foods</strong>. Ingredient identities and supported cooking steps are checked before a draft is shown.`, h = o?.blockers?.length ? `<div class="pj-warn" role="alert">${o.blockers.map(u => `<p>${p(u.message)}</p>`).join("")}<small>Open "Amounts &amp; options" to change this, or leave out a food.</small></div>` : "", i = o?.eff; return `<article class="pj-create ${s ? "is-lead" : ""}" id="pj-create"><span class="pj-spark" aria-hidden="true">${f("sparkle")}</span><div class="pj-create-main"><p class="pj-eyebrow">${s ? "No match? No problem" : "Or make it new"}</p><h3>${p(r)}</h3><p>${c}</p><ul class="pj-create-foods">${n}</ul>${a ? `<div class="pj-warn" role="alert"><p>${p(a)}</p></div>` : ""}${h}${i ? `<p class="pj-settings-line" id="pj-settings-line">${p(Je(i, o.notes))}</p><p class="pj-batch-summary"><strong>Proposed batch:</strong> ${o.request.items.map(item=>p(x(item.key))+" "+p(displayAmount(item.quantity,item.unit))).join("; ")}</p>` : ""}<button type="button" class="btn primary pj-go" data-pj="create" ${a || o?.blockers?.length ? "disabled" : ""}>${f("sparkle")} Create my recipe</button><small class="pj-fine">By pressing Create, I approve the displayed recipe amounts and online processing of these selected food names and amounts, never my photo. Provider usage may apply. Edit the proposed batch below; it is not a stock measurement.</small>${Ge(e, i)}</div></article>`; }
    function Ge(e, t) { if (!t)
        return ""; let s = (a, n, r) => `<option value="${a}" ${a === n ? "selected" : ""}>${r}</option>`, o = e.map(a => { let n = y.amounts[a], r = n?.quantity > 0 ? n.quantity : Math.max(.01, Math.round(E[a].suggested * t.servings * 100) / 100), c = n?.unit || E[a].unit, h = a === "egg" ? ["piece"] : ["milk", "oliveOil", "honey", "tahini", "peanutButter"].includes(a) ? ["g", "ml"] : ["rice", "quinoa", "oats", "pasta", "couscous", "lentils"].includes(a) ? ["g"] : ["g", "piece"]; return `<div class="pj-amt"><span>${p(x(a))}</span><input type="number" min="0.01" max="5000" step="any" value="${r}" data-pj-amt="${p(a)}" aria-label="${p(x(a))} total amount"><select data-pj-unit="${p(a)}" aria-label="${p(x(a))} unit">${h.map(i => s(i, c, i === "piece" ? "pieces" : i)).join("")}</select></div>`; }).join(""); return `<details class="pj-options"><summary>Amounts &amp; options</summary><div class="pj-options-grid"><label class="field">Portions<input type="number" min="1" max="12" step="1" value="${t.servings}" data-pj-set="servings"></label><label class="field">Meal<select data-pj-set="slot">${Object.entries(Ue).map(([a, n]) => s(a, t.slot, n)).join("")}</select></label><label class="field">Time<select data-pj-set="maxMinutes">${We.map(a => s(String(a), String(t.maxMinutes), "Up to " + a + " min")).join("")}</select></label><label class="field">Equipment<select data-pj-set="equipment">${Object.entries(Z).map(([a, n]) => s(a, t.equipment, n)).join("")}</select></label></div><label class="pj-check"><input type="checkbox" data-pj-set="allowWater" ${t.allowWater ? "checked" : ""}><span>Water may be used for cooking. No oil, salt or other food is added unless it is selected.</span></label><div class="pj-amts"><strong>Amounts for the whole batch</strong>${o}</div></details>`; }
    function Xe() { let { plan: e, request: t, current: s, meta: o, saved: a } = l, n = (() => { try {
        return He(t.items.map(i => i.key), { settings: t, pantry: I().pantry || [] });
    }
    catch {
        return null;
    } })(), r = n && n.gaps.length ? `<div class="pj-balance"><h5>To make it a fuller meal</h5>${n.gaps.map(i => `<p><strong>${p(i.label.charAt(0).toUpperCase() + i.label.slice(1))}</strong> is missing.${i.suggestions.length ? ` <span class="pj-add">${i.suggestions.slice(0, 3).map(u => `<button type="button" class="pj-add-chip" data-pj-extra="${p(u.key)}">+ ${p(u.label)} <small>${u.inPantry ? "you have this" : "to buy"}</small></button>`).join("")}</span>` : ""}</p>`).join("")}</div>` : n ? '<p class="pj-ok-line">' + f("check") + " A complete meal: vegetables, protein and a whole grain or starch are covered.</p>" : "", c = s.steps.map(i => `<li>${p(i)}</li>`).join(""), h = t.items.map(i => `<li><span>${p(x(i.key))}</span><strong>${i.quantity} ${i.unit === "piece" ? i.quantity === 1 ? "piece" : "pieces" : i.unit}</strong></li>`).join(""); return `<article class="pj-result" id="pj-result" tabindex="-1"><div class="pj-result-tag">${f("check")} ${t.items.length} of ${t.items.length} foods used \xB7 nothing added</div><p class="pj-eyebrow">${o.planner ? "Built by local cooking rules" : "AI-assisted recipe"} \xB7 review before cooking</p><h3 class="pj-result-title">${p(s.title)}</h3><p class="pj-result-meta">${t.servings} ${t.servings === 1 ? "portion" : "portions"} \xB7 about ${s.time} min \xB7 ${p(Z[t.equipment])}</p>${o.planner ? `<p class="pj-note">The AI's proposals did not pass the safety checks, so the app built this method from its supported cooking rules. Every food is still used and the same checks were applied.</p>` : ""}<div class="pj-two"><section><h4>Exactly what goes in</h4><ul class="pj-ing">${h}</ul></section><section><h4>How this dish is made</h4><ul class="pj-health">${Oe(t, e).map(i => `<li>${p(i)}</li>`).join("")}</ul></section></div>${r}<h4>How to make it</h4><ol class="pj-steps">${c}</ol><p class="pj-fine">Food temperatures come from FoodSafety.gov, not the AI. This recipe has not been independently kitchen-tested. Check product labels and storage yourself.</p><div class="pj-result-actions">${a ? `<a class="btn primary" href="${p(te(a))}">Open recipe</a><button type="button" class="btn secondary" data-pj="cook">${f("cook")} Cook step by step</button>` : `<button type="button" class="btn primary" data-pj="save-cook">${f("cook")} Save &amp; cook now</button><button type="button" class="btn secondary" data-pj="save">Save to my recipes</button>`}<button type="button" class="btn text" data-pj="again">Change &amp; create again</button></div></article>`; }
    function de() { let e = [["security", "Quick security check"], ["ai", "Planning the cooking method"], ["verify", "Checking every food and step"]], t = e.findIndex(s => s[0] === l.phase); return `<article class="pj-working" id="pj-working" role="status" aria-live="polite"><span class="pj-pot" aria-hidden="true">${f("cook")}<i></i><i></i><i></i></span><h3>Creating your recipe</h3><div class="dt-security-shell pj-shell" id="pj-security-shell" data-security-shell hidden><strong>Secure recipe check</strong><p id="pj-security-live" role="status">Loading the security check. Nothing has been sent yet.</p><div id="pj-security" class="pj-security"></div></div><ol class="pj-phases">${e.map((s, o) => `<li class="${o < t ? "done" : o === t ? "now" : ""}">${o < t ? f("check") : '<span class="pj-dot"></span>'} ${s[1]}</li>`).join("")}</ol><p class="pj-fine"><span id="pj-elapsed">0 s</span> \xB7 If an answer fails a check, the app corrects it or builds the method from its supported cooking rules. <button type="button" class="pj-link" data-pj="cancel">Cancel</button></p></article>`; }
    function g() {
        const active=document.activeElement;
        const restoreFood=d.contains(active)?active.dataset.pjFood:null;
        const restoreAction=d.contains(active)?active.dataset.pj:null;
        const restoreAmounts=d.contains(active)&&active.matches('[data-pj-preview-portions]');
        const wasOptions=d.querySelector('.pj-options')?.open;
        const wasAI=d.querySelector('.pj-ai-option')?.open; const wasAlternatives=d.querySelector('.pj-alternatives')?.open;
        w=De(); b.classList.toggle("pj-has-results",w.length>0); if(!m&&w.length) ie(w);
        const selected=le(), unknown=Ke(), image=m?"":j.previewURL();
        const matches=selected.length&&!unknown.length?Be(selected):{full:[],part:[],kitchen:[]};
        const locals=matches.kitchen.map(recipe=>({recipe,used:selected,left:[],missing:[],usedAll:true,local:true}));
        const precise=matches.full.filter(match=>match.recipe.ingredients.filter(item=>!item.optional).every(item=>selected.includes(item.key)));
        const candidates=[...precise,...locals,...matches.full.filter(match=>!precise.includes(match)),...matches.part];
        suggestions.clear(); for(const match of candidates) if(!suggestions.has(match.recipe.id)) suggestions.set(match.recipe.id,match);
        if(!suggestions.has(chosenRecipe)) chosenRecipe=candidates[0]?.recipe.id||null;
        const best=suggestions.get(chosenRecipe);
        const total=suggestions.size;
        const unknownNotice=unknown.length?`<div class="pj-notice is-warn" role="status"><p>Identify ${p(Fe(unknown.map(row=>row.name)))} before an exact recipe can use your whole selection. No selected food is silently dropped.</p><button class="pj-link" data-pj="edit" type="button">Correct food names</button></div>`:"";
        const status=!selected.length&&!unknown.length?"Select a food or use the clear suggestions. Nothing enters your pantry automatically.":unknown.length?"Some selected foods still need identification. Only recognized foods can become an exact recipe.":`${selected.length} ${selected.length===1?"food":"foods"} confirmed. ${best?"Recipe shown below; check quantities before cooking.":"No complete local match. Explore AI creation below."}`;
        const choices=[...suggestions.values()].filter(match=>match.recipe.id!==chosenRecipe);
        const eligibleCount=w.filter(row=>!row.blocked&&!row.disabled&&row.certainty==='clear'&&row.agreement!=='single'&&row.usable&&!row.selected).length; const eligible=eligibleCount>0;
        const method=l.state==='working'?de():l.state==='done'?Xe():instantRecipe(best,selected);
        const create=selected.length&&!unknown.length&&l.state==='idle'?ze(selected,matches):"";
        const fullSet=!!precise.length||!!locals.length; const ai=best&&fullSet?`<details class="pj-ai-option" ${wasAI||wasOptions?'open':""}><summary>Want a new AI-assisted recipe using exactly these foods?</summary>${create}</details>`:create;
        d.innerHTML=`<aside class="pj-basket" aria-label="Selected photo foods"><header class="pj-head"><div class="pj-thumb">${image?`<img src="${p(image)}" alt="Your selected photo">`:""}</div><div class="pj-headcopy"><p class="pj-eyebrow">PHOTO REVIEW / CHOOSE WHAT YOU SEE</p><h2 id="pj-title" tabindex="-1">Your ingredients. Your next meal.</h2><p class="pj-sub">Confirm only foods you recognize; a full recipe appears immediately. Nothing is saved automatically.</p></div></header><div class="pj-confirm-first">${eligible?`<button class="btn primary pj-confirm-all" type="button" data-pj="all">${selected.length?`Include ${eligibleCount} more clear ${eligibleCount===1?"food":"foods"}`:`Use ${eligibleCount} clear ${eligibleCount===1?"food":"foods"} &amp; show a recipe`} ${f("arrow")}</button>`:`<p class="pj-confirmed-note" role="status">${selected.length?f("check")+" Your selection is ready. Change any food below to update the recipe.":"Check any uncertain foods individually; none was added automatically."}</p>`}</div><div class="pj-chips" role="group" aria-label="Foods found in your photo">${w.map(Qe).join("")}</div><div class="pj-chip-actions"><button class="pj-link" type="button" data-pj="none">Clear</button>${m?"":'<button class="pj-link" type="button" data-pj="edit">Edit names</button>'}<button class="pj-link" type="button" data-pj="restart">New photo</button></div><p class="pj-selection-status" role="status" aria-live="polite" aria-atomic="true">${p(status)}</p>${unknownNotice}</aside><div class="pj-results">${!selected.length&&!unknown.length?'<p class="pj-empty">Your recipe will appear here as soon as you confirm a food. No pantry save is needed.</p>':""}${l.state==='idle'&&!fullSet?ai:""}${method}${l.state==='idle'&&fullSet?ai:""}${choices.length?`<details class="pj-alternatives" ${N||wasAlternatives?"open":""}><summary>${choices.length} other ${choices.length===1?"recipe":"recipes"} / includes near matches</summary>${J("Choose another recipe","Extra or unused foods are shown",choices.slice(0,N?choices.length:6).map((match,index)=>V(match,index,match.local?"kitchen":match.usedAll?"full":"part")))}${choices.length>6?`<button class="pj-link" type="button" data-pj="more">${N?"Show fewer":"Show all "+choices.length}</button>`:""}</details>`:""}${ue()}</div>`;
        Pe(d);
        if(wasOptions)d.querySelector('.pj-options')?.setAttribute('open','');
        if(restoreFood)d.querySelector(`[data-pj-food="${CSS.escape(restoreFood)}"]`)?.focus({preventScroll:true});
        else if(restoreAmounts)d.querySelector('[data-pj-preview-portions]')?.focus({preventScroll:true});
        else if(restoreAction)d.querySelector(`[data-pj="${CSS.escape(restoreAction)}"]`)?.focus({preventScroll:true});
    }
    let he = 0, P = () => { cancelAnimationFrame(he), he = requestAnimationFrame(g); };
    function Q() { return W || (W = fetch(q + "api/recipes/status", { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(1e4) }).then(e => e.ok ? e.json() : null).then(e => { T = e && e.version === "1.0.0" ? e : { enabled: !1 }; if(l.state!=="working")P(); }).catch(() => { T = { enabled: !1, unreachable: !0 }; if(l.state!=="working")P(); }), W); }
    async function Ze(e) { return Ie({ container: d.querySelector("#pj-security"), siteKey: T?.siteKey, action: "recipe_ingredients", isCurrent: () => e === S && l.state === "working", onState: t => { let s = d.querySelector("#pj-security-live"); s && (s.textContent = t === "interaction" ? "Please complete the visible security check below. Nothing has been sent yet." : t === "loading" ? "Loading the security check. Nothing has been sent yet." : "Checking this browser. Nothing has been sent yet."); } }); }
    function C() { clearInterval(U), U = null; let e = d.querySelector("#pj-security"); e && Le(e); }
    let me = e => { l.phase = e; let t = d.querySelector("#pj-working"); if (t) {
        let s = document.createElement("div");
        s.innerHTML = de(), t.replaceWith(s.firstElementChild), ge();
    } };
    function ge() { clearInterval(U); let e = () => { let t = d.querySelector("#pj-elapsed"); t && (t.textContent = Math.floor((performance.now() - oe) / 1e3) + " s"); }; e(), U = setInterval(e, 1e3); }
    function R(e, t) { C(), l = { state: "idle", error: e }, g(); let s = d.querySelector("#pj-create .pj-create-main"); if (!s)
        return; let o = t && Ce(t), a = document.createElement("div"); a.className = "pj-warn", a.setAttribute("role", "alert"), a.innerHTML = "<p>" + p(e) + "</p>" + (t?.ownerAction ? "<p><strong>Site owner:</strong> in Cloudflare Turnstile, add <code>" + p(Ae()) + "</code> to the existing widget's Hostname Management and keep its matching site key and secret.</p>" : "") + (o && t.retryable !== !1 ? "<p><small>Tap Create my recipe to retry. Your foods and amounts are kept.</small></p>" : ""), s.querySelector(".pj-go")?.before(a); }
    async function fe() { if (Ke().length) {O("Identify every selected food first. No ingredients were omitted.");return;} if (l.state === "working")
        return; let e = le(); if (!e.length)
        return; let t; try {
        t = pe(e);
    }
    catch (o) {
        R(o.message);
        return;
    } if (t.blockers.length) {
        g();
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
        let a = setTimeout(() => M?.abort(), 11e4), n, r;
        try {
            n = await fetch(q + "api/recipes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", credentials: "same-origin", signal: M.signal, body: JSON.stringify({ input: t.request, token: o, consent: !0, amountsConfirmed: !0 }) }), r = await n.json();
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
        R(o.name === "AbortError" ? "Recipe creation stopped or timed out. Nothing was saved. Try again in a moment." : o.message, o);
    } }
    function Y() { S++, M?.abort(), M = null, C(), l = { state: "idle" }, g(); }
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
        const recipeButton=e.target.closest('[data-pj-open]');
        if(recipeButton){e.preventDefault();chosenRecipe=recipeButton.dataset.pjOpen;g();d.querySelector('#pj-instant-recipe')?.focus({preventScroll:true});d.querySelector('#pj-instant-recipe')?.scrollIntoView({block:'start',behavior:L()?'instant':'smooth'});return;}
        let t = e.target.closest("[data-pj-food]"); if (t) {
        if (t.dataset.blocked === "true") {
            O(t.querySelector(".pj-chip-name")?.textContent + " is excluded by your settings.");
            return;
        }
        let n = t.dataset.pjFood;
        l.state === "working" && Y(), l.state === "done" && (l = { state: "idle" }), B((r, c) => r === n ? !c : c);
        return;
    } e.target.closest("a[href]") && A.set(F, String(Date.now())); let s = e.target.closest("[data-pj-extra]"); if (s) {
        let n = s.dataset.pjExtra;
        E[n] && !k.includes(n) && k.push(n), l = { state: "idle" }, g();
        return;
    } let o = e.target.closest("[data-pj-extra-off]"); if (o) {
        k = k.filter(n => n !== o.dataset.pjExtraOff), Y();
        return;
    } let a = e.target.closest("[data-pj]"); if (a)
        switch (a.dataset.pj) {
            case "all":
                {const clear=new Set(w.filter(row=>!row.blocked&&!row.disabled&&row.certainty==="clear"&&row.agreement!=="single"&&row.usable).map(row=>row.id));l.state === "working" && Y();B((id,selected)=>selected||clear.has(id));setTimeout(()=>{const next=d.querySelector("#pj-instant-recipe")||d.querySelector("#pj-create");if(next){next.scrollIntoView({block:"start",behavior:L()?"instant":"smooth"});if(next.matches("[tabindex]"))next.focus({preventScroll:true});}},100);}
                break;
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
            case "cook-existing": {
                const match=suggestions.get(a.dataset.id);
                if(match && $e(match.recipe,I(),{slot:match.recipe.slot,time:false})) se(match.recipe.id,previewPortions||Ve().servings,match.recipe);
                else O("Your profile changed. Review the matching recipes again.");
                break;
            }
            case "save-foods": {
                if(m) {
                    const foods=canonicalSelected(De());
                    if(!foods.length) {O("Confirm at least one recognized food first.");break;}
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
    } }), document.addEventListener("dt:photo", e => { let t = e.detail?.type; if (t === "results")
            m=null, chosenRecipe=null, selectionStamp="", saveNotice="", M?.abort(), M=null, N = !1, k = [], l = { state: "idle" }, S++, C(), delete b.dataset.journeyEdit, b.dataset.journey = "on", d.hidden = !1, g(), Q(), requestAnimationFrame(() => { d.scrollIntoView({ block: "start", behavior: L() ? "instant" : "smooth" }), d.querySelector("#pj-title")?.focus({ preventScroll: !0 }); });
    else if (t === "selection" && b.dataset.journey === "on" && !m) {
        invalidateSelection(); P();
    }
    else
        (t === "reset" || t === "error") && !m && (S++, M?.abort(), C(), l = { state: "idle" }, k = [], delete b.dataset.journey, delete b.dataset.journeyEdit, b.classList.remove("pj-has-results"), d.hidden = !0, d.replaceChildren()); t === "results" && (m = null); });
    function tt() { m = null, A.del(D), A.del(F), S++, M?.abort(), C(), l = { state: "idle" }, k = [], delete b.dataset.journey, delete b.dataset.journeyEdit, b.classList.remove("pj-has-results"), d.hidden = !0, d.replaceChildren(), b.querySelector("#photo-drop")?.scrollIntoView({ block: "center", behavior: L() ? "instant" : "smooth" }); }
    function ye() { let e = Date.now() - Number(A.get(F) || 0); if (!(e >= 0 && e < 30 * 6e4))
        return; A.del(F); let t = _e(); !t || j.result() || (m = t.foods.map(s => ({ ...s, iconHTML: "", evidence: "", alternatives: [], disabled: !1 })), document.querySelector("#dt-photo-fold")?.setAttribute("open", ""), b.dataset.journey = "on", d.hidden = !1, g(), Q()); }
    return addEventListener("pageshow", e => { e.persisted && ye(); }), ye(), { render: g };
}
export { St as initPhotoJourney };
