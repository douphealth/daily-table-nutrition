// 15.20 · the ingredient knowledge base, restored onto the live build and wired into EVERY rule that decides what a food is.
//
// Production (15.19.0) names 74 foods. The knowledge base (268 foods now) that shipped as v16 on 2026-10-19 was lost when the 15.7 → 15.19 line was
// deployed, so a photo of seven ingredients again produces dead ends. This patch puts it back, and closes the gaps the first catalogue release
// left open: it had only been wired into the recipe contract, so the app's own filters (saved allergens, "leave out" groups, vegetarian /
// pescatarian / plant-only) still thought in 74 foods and would have let pork through a pescatarian list and butter through a dairy exclusion.
// Everything below is generated from ONE source (gen/catalog.mjs); nothing about the 74 shipped foods changes.
import fs from 'node:fs';
import {FOODS, ALLERGENS, MEAT, SEAFOOD, ANIMAL, EXCLUSION_GROUPS, LEGACY_EXCLUSION_GROUPS, STRICT_LABEL, LABEL_REQUIRED} from '../gen/catalog.mjs';
import {ICONS, FAMILY} from '../gen/icons.mjs';

const existingIcons = new Set('tomato tomatoCanned cucumber carrot onion garlic potato sweetPotato lemon orange apple banana strawberries blueberries avocado broccoli cauliflower eggplant zucchini pepper mushroom spinach kale lettuce greens celery greenBeans peas corn artichoke herbs egg milk yogurt feta hardcheese mozzarella tahini honey oliveOil olives walnuts almonds peanutButter oats rice quinoa couscous trahana pasta bread pita tortilla paximadi lentils chickpeas giantBeans whiteBeans chickpeasCooked lentilsCooked whiteBeansCooked blackBeansCooked tofu chicken beef fish salmon shrimp tunaCanned fruit scallion radish chiliPepper jujube'.split(' '));
const GROUPS = {Produce: ['veg', 'hard-veg', 'fruit'], 'Meat & seafood': ['protein'], 'Dairy & eggs': ['dairy', 'egg'], 'Grains & bakery': ['grain', 'bread'], 'Pantry & legumes': ['fat', 'finish', 'ready-legume', 'dry-legume', 'complex', 'lentil']};
const key = k => /^[a-zA-Z][a-zA-Z0-9]*$/.test(k) ? k : JSON.stringify(k);
const q = s => JSON.stringify(s);
const J = JSON.stringify;
const FISH_AND_MEAT = [...MEAT, ...SEAFOOD];

export default {
  title: 'ingredient knowledge base: ' + FOODS.length + ' foods in the contract, the filters, the diets, the labels and the icons',
  apply(c) {
    const W = '_worker.js', ENGINE = 'assets/chunks/chunk-ME7AO2VB.js', CORE = 'assets/chunks/chunk-O3VEKXW7.js';

    // ── 1. worker: recipe contract catalogue ─────────────────────────────────────────────────────────────────────────────────────
    const workerCatalog = 'const RECIPE_FOODS = Object.freeze({' + FOODS.map(f => `${q(f.key)}:{${q('label')}:${q(f.label)},${q('group')}:${q(f.group)},${q('unit')}:${q(f.unit)},${q('suggested')}:${f.suggested}}`).join(',') + '});';
    const w = c.read(W);
    const wStart = w.indexOf('const RECIPE_FOODS = Object.freeze(');
    if (wStart < 0) throw new Error('worker catalogue anchor missing');
    c.write(W, w.slice(0, wStart) + workerCatalog + w.slice(w.indexOf('});', wStart) + 3));

    // ── 2. worker: what a model may call each food ─────────────────────────────────────────────────────────────────────────────
    const aliasObj = {};
    for (const f of FOODS) aliasObj[f.key] = [...new Set([f.label, ...f.aliases])];
    const w2 = c.read(W);
    const aStart = w2.indexOf('const safeAliases = {'), aEnd = w2.indexOf('const photoAliases', aStart);
    if (aStart < 0 || aEnd < 0) throw new Error('worker alias anchor missing');
    c.write(W, w2.slice(0, aStart) + 'const safeAliases = ' + J(aliasObj) + ';\n' + w2.slice(aEnd));

    // ── 3. worker: what a photo may prove ──────────────────────────────────────────────────────────────────────────────────────
    const readyCooked = FOODS.filter(f => f.group === 'ready-legume').map(f => f.key);
    const produceRaw = FOODS.filter(f => ['veg', 'hard-veg', 'fruit'].includes(f.group)).map(f => f.key);
    const rawRequired = FOODS.filter(f => ['protein', 'egg', 'grain', 'lentil'].includes(f.group)).map(f => f.key);
    c.editRe(W, /const labelRequired = new Set\(\[[^\]]*\]\);/g, 'const labelRequired = new Set(' + J(LABEL_REQUIRED) + ');', {label: 'labelRequired'});
    c.editRe(W, /const readyCooked = new Set\(\[[^\]]*\]\);/g, 'const readyCooked = new Set(' + J(readyCooked) + ');', {label: 'readyCooked'});
    c.editRe(W, /const produceRaw = new Set\(\[[^\]]*\]\);/g, 'const produceRaw = new Set(' + J(produceRaw) + ');', {label: 'produceRaw'});
    c.editRe(W, /const rawRequired = new Set\(\[[^\]]*\]\);/g, 'const rawRequired = new Set(' + J(rawRequired) + ');', {label: 'rawRequired'});

    // ── 4. worker: allergens, strict labels, diets, planner timings ───────────────────────────────────────────────────────────────
    c.editRe(W, /const ALLERGEN_MAP=\{[^\n]*?\};/g, 'const ALLERGEN_MAP=' + J(ALLERGENS) + ';', {label: 'worker allergens'});
    c.editRe(W, /const PACKAGED=new Set\('[^']*'\.split\(' '\)\);/g,
      'const DIET_MEAT=new Set(' + J(MEAT) + ');\nconst DIET_FISH_MEAT=new Set(' + J(FISH_AND_MEAT) + ');\nconst DIET_ANIMAL=new Set(' + J(ANIMAL) + ');\nconst PACKAGED=new Set(' + J(STRICT_LABEL) + ');', {label: 'worker strict labels + diet sets'});
    c.edit(W, "(['protein','egg','dairy'].includes(group(i.key))||['honey','tunaCanned'].includes(i.key))", '(DIET_ANIMAL.has(i.key))', {label: 'worker plant-only rule'});
    c.edit(W, "(group(i.key)==='protein'||i.key==='tunaCanned')", '(DIET_FISH_MEAT.has(i.key))', {label: 'worker vegetarian rule'});
    c.edit(W, "['chicken','beef'].includes(i.key)", 'DIET_MEAT.has(i.key)', {label: 'worker pescatarian rule'});
    // nine "leave out" groups can now name 94 foods; the contract accepted 70
    c.edit(W, 'function ids(xs,max=70)', 'function ids(xs,max=400)', {label: 'worker exclusion limit'});

    // The validator refuses a grain step under 5 minutes and a raw-protein step under 8 (a floor that also binds AI plans), so no planner time
    // may be lower: the first catalogue release gave squid and scallops 6 and gnocchi 3, and none of them could be turned into a recipe.
    const grainMin = {rice: 18, quinoa: 15, pasta: 12, couscous: 5, oats: 5, bulgur: 12, barley: 25, farro: 20, millet: 15, buckwheat: 12, polenta: 10, noodles: 6, riceNoodles: 5, gnocchi: 5, flour: 5};
    const proteinMin = {chicken: 15, beef: 12, steak: 10, fish: 10, salmon: 10, shrimp: 8, turkey: 15, lamb: 14, pork: 14, duck: 18, veal: 12, liver: 10, bacon: 8, sausage: 12, mackerel: 10, trout: 10, tunaSteak: 8, halibut: 12, squid: 8, mussels: 8, clams: 8, scallops: 8, crab: 8};
    const vegMin = {potato: 20, sweetPotato: 20, eggplant: 12, greenBeans: 8, corn: 8, peas: 6, mushroom: 8, beetroot: 20, turnip: 15, parsnip: 15, celeriac: 15, pumpkin: 18, brusselsSprouts: 12, artichoke: 20};
    for (const [k, v] of Object.entries(grainMin)) if (v < 5) throw new Error('grain minutes under the validator floor: ' + k);
    for (const [k, v] of Object.entries(proteinMin)) if (v < 8) throw new Error('protein minutes under the validator floor: ' + k);
    c.editRe(W, /const PL_GRAIN_MIN = \{[^}]*\};/g, 'const PL_GRAIN_MIN = ' + J(grainMin) + ';', {label: 'grain minutes'});
    c.editRe(W, /const PL_PROTEIN_MIN = \{[^}]*\};/g, 'const PL_PROTEIN_MIN = ' + J(proteinMin) + ';', {label: 'protein minutes'});
    c.editRe(W, /const PL_VEG_MIN = \{[^}]*\};/g, 'const PL_VEG_MIN = ' + J(vegMin) + ';', {label: 'vegetable minutes'});

    const liquid = ['milk', 'oliveOil', 'honey', 'tahini', 'peanutButter', 'sesameOil', 'coconutOil', 'sunflowerOil', 'avocadoOil', 'soySauce', 'tamari', 'fishSauce', 'oysterSauce', 'vinegar', 'balsamicVinegar', 'mapleSyrup', 'stock', 'coconutMilk', 'plantMilk', 'heavyCream', 'buttermilk', 'kefir'];
    c.editRe(W, /\['milk','oliveOil','honey','tahini','peanutButter'\]\.includes\(i\.key\)/g, 'LIQUID_KEYS.has(i.key)', {label: 'worker ml allowlist'});
    c.edit(W, 'const PACKAGED=new Set(', 'const LIQUID_KEYS=new Set(' + J(liquid) + ');\nconst PACKAGED=new Set(', {label: 'liquid keys'});

    // ── 5. browser recipe engine: the same catalogue and the same rules, so both sides always agree ──────────────────────────────────
    const clientCatalog = 'var h=Object.freeze({' + FOODS.map(f => `${key(f.key)}:{label:${q(f.label)},group:${q(f.group)},unit:${q(f.unit)},suggested:${f.suggested}}`).join(',') + '});';
    const ch = c.read(ENGINE);
    if (!ch.startsWith('var h=Object.freeze(')) throw new Error('client catalogue anchor missing');
    c.write(ENGINE, clientCatalog + ch.slice(ch.indexOf('});') + 3));
    c.editRe(ENGINE, /T=\{milk:\[[^\]]*\],eggs:\[[^\]]*\],fish:\[[^\]]*\],crustaceans:\[[^\]]*\],soy:\[[^\]]*\],peanuts:\[[^\]]*\],nuts:\[[^\]]*\],sesame:\[[^\]]*\],gluten:\[[^\]]*\],celery:\[[^\]]*\],mustard:\[\],lupin:\[\],molluscs:\[\],sulphites:\[\]\}/g,
      'T=' + J(ALLERGENS), {label: 'engine allergens'});
    c.editRe(ENGINE, /V=new Set\("[^"]*"\.split\(" "\)\)/g, 'V=new Set(' + J(STRICT_LABEL) + ')', {label: 'engine strict labels'});
    c.editRe(ENGINE, /\["milk","oliveOil","honey","tahini","peanutButter"\]\.includes\(t\.key\)/g, 'LIQUID.has(t.key)', {label: 'engine ml allowlist'});
    c.edit(ENGINE, 'var U=["skillet"', 'var LIQUID=new Set(' + J(liquid) + '),DIET_MEAT=new Set(' + J(MEAT) + '),DIET_FISH_MEAT=new Set(' + J(FISH_AND_MEAT) + '),DIET_ANIMAL=new Set(' + J(ANIMAL) + ');\nvar U=["skillet"', {label: 'engine liquid + diet sets'});
    c.edit(ENGINE, '(["protein","egg","dairy"].includes(b(t.key))||["honey","tunaCanned"].includes(t.key))', '(DIET_ANIMAL.has(t.key))', {label: 'engine plant-only rule'});
    c.edit(ENGINE, '(b(t.key)==="protein"||t.key==="tunaCanned")', '(DIET_FISH_MEAT.has(t.key))', {label: 'engine vegetarian rule'});
    c.edit(ENGINE, '["chicken","beef"].includes(t.key)', 'DIET_MEAT.has(t.key)', {label: 'engine pescatarian rule'});
    c.edit(ENGINE, 'function S(e,n=70){', 'function S(e,n=400){', {label: 'engine exclusion limit'});
    c.editRe(ENGINE, /var se=\{rice:18,quinoa:15,pasta:12,couscous:5,oats:5\},re=\{chicken:15,beef:12,fish:10,salmon:10,shrimp:8\},ne=\{potato:20,sweetPotato:20,eggplant:12,greenBeans:8,corn:8,peas:6,mushroom:8\}/g,
      'var se=' + J(grainMin) + ',re=' + J(proteinMin) + ',ne=' + J(vegMin), {label: 'engine planner minutes'});
    const legumeKeys = FOODS.filter(f => f.group === 'ready-legume').map(f => f.key).concat(['lentils', 'chickpeas', 'whiteBeans', 'giantBeans']);
    c.editRe(ENGINE, /F=new Set\(\[[^\]]*\]\)/g, 'F=new Set(' + J(legumeKeys) + ')', {label: 'legume pillar'});
    c.editRe(ENGINE, /Q=new Set\(\[[^\]]*\]\)/g, 'Q=new Set(' + J(['tofu', 'tempeh', 'seitan', 'tunaCanned', 'sardines', 'yogurt', 'mozzarella', 'ricotta', 'cottageCheese', 'paneer', 'halloumi', 'edamame']) + ')', {label: 'protein pillar'});
    c.editRe(ENGINE, /X=new Set\(\[[^\]]*\]\)/g, 'X=new Set(' + J(FOODS.filter(f => f.group === 'fat').map(f => f.key).concat(['avocado', 'walnuts', 'almonds', 'cashews', 'pistachios', 'hazelnuts', 'pecans', 'pineNuts', 'peanuts', 'brazilNuts', 'olives'])) + ')', {label: 'fat pillar'});

    // ── 6. the app's own filter (every screen asks it "may this household eat this?") ────────────────────────────────────────────
    c.editRe(CORE, /ee=Object\.freeze\(\{milk:\[[^)]*\}\)/g, 'ee=Object.freeze(' + J(ALLERGENS) + ')', {label: 'core allergens'});
    c.editRe(CORE, /Fe=new Set\(\[[^\]]*\]\)/g, 'Fe=new Set(' + J(STRICT_LABEL) + ')', {label: 'core strict labels'});
    c.editRe(CORE, /Le=new Set\(\[[^\]]*\]\)/g, 'Le=new Set(' + J(ANIMAL) + ')', {label: 'core plant-only'});
    c.editRe(CORE, /Be=new Set\(\[[^\]]*\]\)/g, 'Be=new Set(' + J(FISH_AND_MEAT) + '),DT_MEAT=new Set(' + J(MEAT) + ')', {label: 'core vegetarian + meat set'});
    c.edit(CORE, '["chicken","beef"].includes(m)', 'DT_MEAT.has(m)', {expect: 2, label: 'core pescatarian rule + ingredient tag'});
    c.editRe(CORE, /et=new Set\(\[[^\]]*\]\)/g, 'et=new Set(' + J(ANIMAL) + ')', {label: 'core plant-only (stateless)'});
    c.edit(CORE, 'tt=new Set(["chicken","beef"])', 'tt=new Set(' + J(MEAT) + ')', {label: 'core pescatarian (stateless)'});
    c.editRe(CORE, /nt=new Set\(\[[^\]]*\]\)/g, 'nt=new Set(' + J(FISH_AND_MEAT) + ')', {label: 'core vegetarian (stateless)'});
    // A kitchen saved by an earlier release that had a whole "leave out" group ticked (all of that group's foods excluded) is widened to the
    // group as it is now. The saved list only ever grows, and it is recomputed every time the kitchen is read, so it cannot be forgotten.
    c.edit(CORE, 'function Bt(e,n){',
      'var DT_OLD_GROUPS=' + J(LEGACY_EXCLUSION_GROUPS) + ',DT_GROUPS=' + J(EXCLUSION_GROUPS) + ';function DT_WIDEN(x,n){var s=new Set(x);for(var g in DT_OLD_GROUPS)if(DT_OLD_GROUPS[g].every(function(k){return s.has(k)}))for(var k of DT_GROUPS[g])Object.hasOwn(n,k)&&s.add(k);return[...s]}function Bt(e,n){', {label: 'core widen helper'});
    c.edit(CORE, 'e.excluded.length>100', 'e.excluded.length>400', {label: 'core exclusion limit'});
    c.edit(CORE, 'excluded:[...new Set(e.excluded)]', 'excluded:DT_WIDEN(e.excluded,n)', {label: 'core widen saved groups'});

    // ── 7. pantry labels, groups, "leave out" groups and the shared alias table ────────────────────────────────────────────────────────
    const dataPath = c.abs('assets/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const [g, old] of Object.entries(LEGACY_EXCLUSION_GROUPS)) {
      const shipped = data.allergenIngredients[g];
      if (!shipped || J([...shipped].sort()) !== J([...old].sort())) throw new Error('data.json exclusion group "' + g + '" is not what this patch expects');
    }
    data.foodLabels = Object.fromEntries(FOODS.map(f => [f.key, f.label]));
    data.foodGroups = Object.fromEntries(Object.entries(GROUPS).map(([g, groups]) => [g, FOODS.filter(f => groups.includes(f.group)).map(f => f.key)]));
    data.allergenIngredients = EXCLUSION_GROUPS;
    // one alias table for every place that turns a written name into a food (photo results, typed lists): never repeated in a script
    data.foodAliases = Object.fromEntries(FOODS.map(f => [f.key, [...new Set(f.aliases)]]));
    fs.writeFileSync(dataPath, J(data));
    c.touched.add('assets/data.json');

    // ── 8. icons: one drawing per family, one alias per food ─────────────────────────────────────────────────────────────────────
    const svgPath = c.abs('assets/icons/foods.svg');
    let svg = fs.readFileSync(svgPath, 'utf8');
    const missing = FOODS.filter(f => !existingIcons.has(f.key) && !svg.includes(`id="f-${f.key}"`));
    const usedFamilies = [...new Set(missing.map(f => FAMILY[f.key]))].filter(fam => !svg.includes(`id="f-${fam}"`));
    const newSymbols = usedFamilies.filter(fam => ICONS[fam]).map(fam => `<symbol id="f-${fam}" viewBox="0 0 64 64">${ICONS[fam]}</symbol>`).join('\n');
    const aliases = missing.map(f => `<symbol id="f-${f.key}" viewBox="0 0 64 64"><use href="#f-${FAMILY[f.key]}"/></symbol>`).join('\n');
    svg = svg.replace('</svg>', newSymbols + '\n' + aliases + '\n</svg>');
    fs.writeFileSync(svgPath, svg);
    c.touched.add('assets/icons/foods.svg');

    c.note(`${FOODS.length} foods · allergens ${Object.values(ALLERGENS).flat().length} links · meat ${MEAT.length} · seafood ${SEAFOOD.length} · not plant-only ${ANIMAL.length} · strict-label ${STRICT_LABEL.length} · ${missing.length} new icons`);
  }
};
