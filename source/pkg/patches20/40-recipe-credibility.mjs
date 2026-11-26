// 15.20 · a created recipe must read as if someone who cooks wrote it.
//
// Found by creating a recipe from a photo of tomato, cucumber, onion, olives, feta and parsley on the live build:
//   · step 1 of a meatless salad ended "Do not wash raw meat or poultry. Keep raw proteins … separate";
//   · the tossing step ended "Allow about 2 minutes; check the food rather than relying on the timer.";
//   · the header said "Hob & pan" above the line "No cooking needed";
//   · "Protein is missing." stood forty lines above "✓ Protein foods: listed" (two classifiers, one of which only knows the 74 old foods and
//     counts 32 g of feta as the meal's protein), and both blocks offered their own, different, suggestions;
//   · "Vegetables is missing.";
//   · every step was one unbroken paragraph of up to five sentences.
// Found by reading the same templates against the new catalogue:
//   · squid, mussels, clams, scallops and crab were told "Use a food thermometer to confirm at least opaque, pearly-white flesh … in the
//     thickest part" (only shrimp had the appearance wording);
//   · a bunch of parsley alone triggered "Cut the remaining firm produce into small, even pieces."
// The step text is written by fixed templates that exist twice (the worker and the browser engine, which re-validates and re-compiles the
// server's plan). Both copies get the SAME change, generated here from one description, so they cannot drift.
import {FOODS} from '../gen/catalog.mjs';
import {SHELLFISH} from './12-safety-temps.mjs';

const J = JSON.stringify;
const produce = FOODS.filter(f => ['veg', 'hard-veg', 'fruit'].includes(f.group));
/** Produce that is not "cut into small, even pieces": leaves and herbs, berries and other small or dried fruit, and the two that have their own sentence. */
const NO_CUT = [...new Set([
  'carrot', 'broccoli',
  ...produce.filter(f => ['herbs', 'greens'].includes(f.icon)).map(f => f.key),
  'lettuce', 'spinach', 'kale', 'beanSprouts', 'snowPeas', 'garlic', 'chives',
  'blueberries', 'strawberries', 'raspberries', 'blackberries', 'cranberries', 'gooseberries', 'grapes', 'cherries', 'raisins', 'prunes', 'dates', 'driedApricots', 'pomegranate', 'lychee', 'passionFruit'
])].filter(k => produce.some(f => f.key === k));

const BIVALVES = ['mussels', 'clams'], OPAQUE = SHELLFISH.filter(k => !BIVALVES.includes(k));
/** Source text of the doneness sentence for a cooked protein. `food` is the expression naming the food; `temp` the in-scope temperature helper. */
const doneness = (food, temp, q) =>
  `[${BIVALVES.map(k => q + k + q)}].includes(${food})?${q}Cook until the shells open; throw away any that stay closed.${q}`
  + `:[${OPAQUE.map(k => q + k + q)}].includes(${food})?${q}Cook until the flesh is pearly-white and opaque all the way through.${q}`
  + `:${food}===${q}bacon${q}?${q}Cook until browned and crisp throughout; a strip this thin cannot be checked with a thermometer.${q}`
  + `:${q}Use a food thermometer to confirm at least ${q}+${temp}(${food})+${q} in the thickest part.${q}`;

const STEP_HTML = `function stepHTML(text){const bits=String(text).split(/([.!?])\\s+(?=[A-Z])/),out=[];for(let i=0;i<bits.length;i+=2)out.push(bits[i]+(bits[i+1]||""));const lead=out.shift()||"";return \`<span class="pj-step-lead">\${p(lead)}</span>\`+(out.length?\`<span class="pj-step-notes">\${out.map(x=>\`<span>\${p(x)}</span>\`).join(" ")}</span>\`:"")}
    `;

const QUALITY_MODULE = `/** Food-group review for recipe previews.
 * 15.20: ONE vocabulary. The groups come from the recipe engine's own classifier (the one that writes "To make it a fuller meal"), so the two
 * blocks of a recipe can no longer disagree, and every food in the catalogue is classified (the list this file used to carry knew 74).
 * Ingredient identities are confirmed catalog IDs; no nutritional claims or automatic additions are made. User exclusions are rechecked at
 * display time.
 */
import {pillarsOf} from './chunk-ME7AO2VB.js';
const ADDITIONS = {
 vegetables: ['tomato','broccoli','spinach','carrot','cucumber'],
 protein: ['chickpeasCooked','lentilsCooked','tofu','egg','yogurt'],
 grains: ['quinoa','bread','oats','potato','rice']
};
export function describeMealPattern(items,{slot='lunch',isExcluded=()=>false}={}) {
 const names = Array.isArray(items) ? items.map(x=>typeof x==='string'?x:x?.key).filter(Boolean) : [];
 const selected = new Set(names);
 const has = pillar => [...selected].some(key=>pillarsOf(key).includes(pillar));
 const meal = ['lunch','dinner'].includes(slot);
 // breakfast and snacks: fruit stands where vegetables would, exactly as the engine's own rule for those meals says
 const groups = {vegetables: has('vegetables') || (!meal && has('fruit')), protein: has('protein'), grains: has('starch')};
 const lacking = meal?Object.entries(groups).filter(([,yes])=>!yes).map(([key])=>key):[];
 const suggestions=Object.fromEntries(lacking.map(group=>[group,ADDITIONS[group].filter(key=>!selected.has(key)&&!isExcluded(key)).slice(0,3)]));
 return {groups, lacking, suggestions, meal, light:!meal, scope:'food groups only; no nutrients, calories, portions or allergy clearance calculated'};
}
`;

export default {
  title: 'created recipes: steps that fit the dish, doneness by food, one food-group vocabulary, no-cook says no-cook',
  apply(c) {
    const W = '_worker.js', E = 'assets/chunks/chunk-ME7AO2VB.js', JN = 'assets/chunks/photo-journey-15.19.0.js', Q = 'assets/chunks/recipe-quality-15.19.0.js', STUDIO = 'assets/chunks/recipe-studio-ATRLWHA7.js';

    // ── worker ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    c.edit(W, 'function compileAIRecipe(raw,request){', 'const NO_CUT=new Set(' + J(NO_CUT) + ');\nfunction compileAIRecipe(raw,request){', {label: 'worker no-cut set'});
    c.edit(W, "return 'Wash hands and measure every listed ingredient for this batch. '+", "return ('Wash hands and measure every listed ingredient for this batch. '+", {label: 'worker prepare head'});
    c.edit(W, "'Do not wash raw meat or poultry. Keep raw proteins and their equipment separate from ready-to-eat food.';",
      "(p.foods.some(k=>group(k)==='protein')?'Do not wash raw meat or poultry. Keep raw proteins and their equipment separate from ready-to-eat food.':p.foods.includes('egg')?'Keep raw egg and anything it touches away from ready-to-eat food.':'')).trim();", {label: 'worker prepare tail'});
    c.edit(W, "produce.filter(k=>!['carrot','broccoli','blueberries','strawberries','greens','herbs','lettuce','spinach','kale'].includes(k)).length", 'produce.filter(k=>!NO_CUT.has(k)).length', {label: 'worker firm produce'});
    c.edit(W, 'no extra dressing, garnish, salt or oil is assumed.${time}`', 'no extra dressing, garnish, salt or oil is assumed.`', {label: 'worker toss'});
    c.edit(W, 'Use only the listed ingredients.${time}`', 'Use only the listed ingredients.`', {label: 'worker mash'});
    c.edit(W, "${p.foods[0]==='shrimp'?'Check for '+safety(p.foods[0])+'.':'Use a food thermometer to confirm at least '+safety(p.foods[0])+' in the thickest part.'}",
      '${' + doneness('p.foods[0]', 'safety', "'") + '}', {label: 'worker doneness'});

    // ── browser engine (the copy whose text is shown) ──────────────────────────────────────────────────────────────────────────────
    c.edit(E, '\nvar U=["skillet"', '\nvar NO_CUT=new Set(' + J(NO_CUT) + ');\nvar U=["skillet"', {label: 'engine no-cut set'});
    c.edit(E, 'return"Wash hands and measure every listed ingredient for this batch. "+', 'return("Wash hands and measure every listed ingredient for this batch. "+', {label: 'engine prepare head'});
    c.edit(E, '"Do not wash raw meat or poultry. Keep raw proteins and their equipment separate from ready-to-eat food."}',
      '(o.foods.some(k=>b(k)==="protein")?"Do not wash raw meat or poultry. Keep raw proteins and their equipment separate from ready-to-eat food.":o.foods.includes("egg")?"Keep raw egg and anything it touches away from ready-to-eat food.":"")).trim()}', {label: 'engine prepare tail'});
    c.edit(E, 'u.filter(k=>!["carrot","broccoli","blueberries","strawberries","greens","herbs","lettuce","spinach","kale"].includes(k)).length', 'u.filter(k=>!NO_CUT.has(k)).length', {label: 'engine firm produce'});
    c.edit(E, 'no extra dressing, garnish, salt or oil is assumed.${m}`', 'no extra dressing, garnish, salt or oil is assumed.`', {label: 'engine toss'});
    c.edit(E, 'Use only the listed ingredients.${m}`', 'Use only the listed ingredients.`', {label: 'engine mash'});
    c.edit(E, '${o.foods[0]==="shrimp"?"Check for "+g(o.foods[0])+".":"Use a food thermometer to confirm at least "+g(o.foods[0])+" in the thickest part."}',
      '${' + doneness('o.foods[0]', 'g', '"') + '}', {label: 'engine doneness'});
    // "Includes a grain or bread" knew eight foods
    c.edit(E, 'l.some(t=>["oats","quinoa","rice","pasta","couscous","bread","pita","tortilla"].includes(t))', 'l.some(t=>["grain","bread"].includes(_(t)))', {label: 'engine grain note'});
    // the classifier is shared with the food-group review
    c.edit(E, 'export{h as a,A as b,Y as c,J as d,ue as e,pe as f,he as g,be as h};', 'export{h as a,A as b,Y as c,J as d,ue as e,pe as f,he as g,be as h,D as pillarsOf};', {label: 'engine export classifier'});

    // ── one food-group vocabulary ─────────────────────────────────────────────────────────────────────────────────────────────────
    if (!c.read(Q).includes("protein: new Set(['egg','yogurt','milk','feta'")) throw new Error('recipe-quality module is not the 74-food classifier this patch replaces');
    c.write(Q, QUALITY_MODULE);

    // ── the photo flow's result ───────────────────────────────────────────────────────────────────────────────────────────────────
    c.edit(JN, 'function plateReview(ingredients,slot) {', STEP_HTML + 'function plateReview(ingredients,slot,brief) {', {label: 'journey step helper + brief review'});
    c.edit(JN, "const details=[['vegetables','Vegetables'],['protein','Protein foods'],['grains','Grains / starches']];",
      "const details=[['vegetables',review.light?'Vegetables or fruit':'Vegetables'],['protein','Protein foods'],['grains','Grains / starches']];", {label: 'journey group labels'});
    // the created recipe already offers "To make it a fuller meal" with one-tap additions; a second, different list under it is noise
    c.edit(JN, '${choices?`<details><summary>Ideas to round out this meal</summary>', '${choices&&!brief?`<details><summary>Ideas to round out this meal</summary>', {label: 'journey no second idea list'});
    c.edit(JN, '${plateReview(t.items,t.slot)}${aiTrustHTML(t)}', '${plateReview(t.items,t.slot,true)}${aiTrustHTML(t)}', {label: 'journey brief review on created recipes'});
    c.edit(JN, '<p><strong>${p(i.label.charAt(0).toUpperCase() + i.label.slice(1))}</strong> is missing.', '<p>No <strong>${p(i.label)}</strong> in this dish yet.', {label: 'journey gap wording'});
    c.edit(JN, 'c = s.steps.map(i => `<li>${p(i)}</li>`).join("")', 'c = s.steps.map(i => `<li>${stepHTML(i)}</li>`).join("")', {label: 'journey step layout'});
    c.edit(JN, ' min \\xB7 ${p(Z[t.equipment])}</p>', ' min \\xB7 ${p(Z[(e.phases||[]).some(ph=>!["prepare","toss","mash","assemble"].includes(ph.action))?t.equipment:"no-cook"])}</p>', {label: 'journey no-cook label'});

    // ── the recipe studio uses the same sentence ──────────────────────────────────────────────────────────────────────────────────────
    c.edit(STUDIO, '<strong>${u(n.label.charAt(0).toUpperCase()+n.label.slice(1))}</strong> is missing. ', 'No <strong>${u(n.label)}</strong> in this dish yet. ', {label: 'studio gap wording'});

    c.note(`${NO_CUT.length} foods are never "cut into small pieces" · doneness by food on both sides · food groups from one classifier`);
  }
};
