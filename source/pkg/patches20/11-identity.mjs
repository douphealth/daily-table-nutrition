// 15.20 · a written name becomes one food — for every food in the catalogue, in both languages, and never by guessing.
//
// The live resolver (photo-ingredient-identity) is strict in the right way: a name that two foods claim resolves to nobody, and a model's key
// that contradicts the name is sent to the person instead of being trusted. It only knew 74 foods. This gives it the catalogue's alias table
// (shipped once, in data.json) on top of its own Greek names, and teaches its form check the new pulses: a photo of DRIED kidney beans must
// never become "Cooked kidney beans".
// The home page and the pantry's typed list use the same table, and their diet lists are generated from the same source as the recipe contract.
import {FOODS, MEAT, SEAFOOD, ANIMAL, LEGACY_EXCLUSION_GROUPS} from '../gen/catalog.mjs';

const J = JSON.stringify;
const dry = FOODS.filter(f => ['dry-legume', 'lentil'].includes(f.group)).map(f => f.key);
const cooked = FOODS.filter(f => f.group === 'ready-legume' && f.key !== 'edamame').map(f => f.key);

export default {
  title: 'identity: one alias table for photo names and typed names; diet lists on the home page from the same source',
  apply(c) {
    const ID = 'assets/chunks/photo-ingredient-identity-15.19.0.js', JOURNEY = 'assets/chunks/photo-journey-15.19.0.js', HOME = 'assets/premium-home-15.19.0.js';

    c.edit(ID, "const DRY = new Set(['chickpeas','lentils','whiteBeans','giantBeans']);", 'const DRY = new Set(' + J(dry) + ');', {label: 'dried pulses'});
    c.edit(ID, "const COOKED = new Set(['chickpeasCooked','lentilsCooked','whiteBeansCooked','blackBeansCooked']);", 'const COOKED = new Set(' + J(cooked) + ');', {label: 'cooked pulses'});
    c.edit(ID, 'export function createPhotoIngredientResolver(labels) {', 'export function createPhotoIngredientResolver(labels, extraAliases = {}) {', {label: 'resolver signature'});
    c.edit(ID, 'const variants = [id,label,...(photoAliases[id] || [])];', 'const variants = [id,label,...(photoAliases[id] || []),...(Array.isArray(extraAliases?.[id]) ? extraAliases[id] : [])];', {label: 'resolver aliases'});
    c.edit(JOURNEY, 'createPhotoIngredientResolver($.foodLabels)', 'createPhotoIngredientResolver($.foodLabels,$.foodAliases||{})', {label: 'journey passes the alias table'});

    // home page + pantry typed list
    c.edit(HOME, "const names = [text, ...(greekAliases[id] || []), ...(englishAliases[id] || [])];",
      "const names = [text, ...(greekAliases[id] || []), ...(englishAliases[id] || []), ...(Array.isArray(catalog.foodAliases?.[id]) ? catalog.foodAliases[id] : [])];", {label: 'home alias table'});
    c.edit(HOME, "pescatarian: ['chicken','beef'],", 'pescatarian: ' + J(MEAT) + ',', {label: 'home pescatarian'});
    c.edit(HOME, "vegetarian: ['chicken','beef','fish','salmon','shrimp','tunaCanned'],", 'vegetarian: ' + J([...MEAT, ...SEAFOOD]) + ',', {label: 'home vegetarian'});
    c.editRe(HOME, /plant: \['chicken','beef','fish','salmon','shrimp','tunaCanned','egg',\s*'yogurt','milk','feta','hardcheese','mozzarella','honey','trahana'\]/g, 'plant: ' + J(ANIMAL), {label: 'home plant-only'});
    // The home page reads the saved kitchen straight from storage. A kitchen saved before this release that had a whole "leave out" group
    // ticked must block the group as it is now, exactly as the app's own filter does.
    c.edit(HOME, 'for (const id of savedSafety.foods) blocked.add(id);',
      'for (const id of savedSafety.foods) blocked.add(id);\n    for (const [group, old] of Object.entries(' + J(LEGACY_EXCLUSION_GROUPS) + ')) if (old.every(id => savedSafety.foods.has(id))) for (const id of catalog?.allergenIngredients?.[group] || []) blocked.add(id);',
      {label: 'home widen saved groups'});
    c.note(`form check: ${dry.length} dried / ${cooked.length} cooked pulses · home diet lists generated`);
  }
};
