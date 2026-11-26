// 15.20 · a safe minimum temperature for every protein in the catalogue, and the strictest one for anything not listed.
//
// Production knows chicken, beef and shrimp and answers "63 °C / 145 °F" for every other food. The first catalogue release listed the new
// meats but kept that default, so a protein added later without touching this file would have been told the FISH temperature.
// Now (FoodSafety.gov, safe minimum internal temperatures):
//   · fin fish                                   63 °C / 145 °F
//   · beef, pork, lamb, veal, generic "meat"       71 °C / 160 °F  (the minced-meat value: the app cannot see whether a cut is whole or minced)
//   · poultry, and sausage and liver (either may be poultry), and ANYTHING ELSE   74 °C / 165 °F
// Shellfish are judged by appearance, not by a thermometer; that sentence is written in 40-recipe-credibility.mjs and never reaches this helper.
// The build fails if a raw protein in the catalogue is in none of the four lists.
import {FOODS} from '../gen/catalog.mjs';

const J = JSON.stringify;
export const FIN_FISH = ['fish', 'salmon', 'mackerel', 'trout', 'tunaSteak', 'halibut'];
export const RED_MEAT = ['beef', 'steak', 'pork', 'lamb', 'veal', 'meat', 'bacon'];
export const POULTRY_RULE = ['chicken', 'turkey', 'duck', 'sausage', 'liver'];
export const SHELLFISH = ['shrimp', 'squid', 'scallops', 'crab', 'mussels', 'clams'];

const WORKER_FROM = "const safety=key=>key==='chicken'?'74\\u00b0C / 165\\u00b0F':key==='beef'?'71\\u00b0C / 160\\u00b0F':key==='shrimp'?'opaque, pearly-white flesh throughout':'63\\u00b0C / 145\\u00b0F';";
const WORKER_TO = `const safety=key=>${J(FIN_FISH)}.includes(key)?'63\\u00b0C / 145\\u00b0F':${J(RED_MEAT)}.includes(key)?'71\\u00b0C / 160\\u00b0F':'74\\u00b0C / 165\\u00b0F';`;
const CLIENT_FROM = 'g=o=>o==="chicken"?"74\\xB0C / 165\\xB0F":o==="beef"?"71\\xB0C / 160\\xB0F":o==="shrimp"?"opaque, pearly-white flesh throughout":"63\\xB0C / 145\\xB0F"';
const CLIENT_TO = `g=o=>${J(FIN_FISH)}.includes(o)?"63\\xB0C / 145\\xB0F":${J(RED_MEAT)}.includes(o)?"71\\xB0C / 160\\xB0F":"74\\xB0C / 165\\xB0F"`;

export default {
  title: 'food safety: a temperature for every protein, and the strictest one for anything unlisted',
  apply(c) {
    const listed = new Set([...FIN_FISH, ...RED_MEAT, ...POULTRY_RULE, ...SHELLFISH]);
    const unlisted = FOODS.filter(f => f.group === 'protein' && !listed.has(f.key)).map(f => f.key);
    if (unlisted.length) throw new Error('a raw protein has no doneness rule: ' + unlisted.join(', '));
    for (const k of listed) if (!FOODS.some(f => f.key === k && f.group === 'protein')) throw new Error('doneness rule for something that is not a raw protein: ' + k);
    c.edit('_worker.js', WORKER_FROM, WORKER_TO, {label: 'worker safety'});
    c.edit('assets/chunks/chunk-ME7AO2VB.js', CLIENT_FROM, CLIENT_TO, {label: 'client safety'});
    c.note(`${FIN_FISH.length} fish at 63 °C · ${RED_MEAT.length} meats at 71 °C · ${POULTRY_RULE.length} at 74 °C (and any unlisted food) · ${SHELLFISH.length} shellfish by appearance`);
  }
};
