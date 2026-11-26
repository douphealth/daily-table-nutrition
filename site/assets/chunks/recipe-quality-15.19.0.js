/** Food-group review for recipe previews.
 * 15.20: ONE vocabulary. The groups come from the recipe engine's own classifier (the one that writes "To make it a fuller meal"), so the two
 * blocks of a recipe can no longer disagree, and every food in the catalogue is classified (the list this file used to carry knew 74).
 * Ingredient identities are confirmed catalog IDs; no nutritional claims or automatic additions are made. User exclusions are rechecked at
 * display time.
 */
import {pillarsOf} from './chunk-ME7AO2VB.js?v=15.20.0';
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
