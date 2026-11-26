/* Pure ranking for a scanned set of foods. The user's selection, never the saved
   pantry, defines coverage. Incomplete matches may not become the first meal.
   15.6.1: at equal coverage a curated recipe ranks above one assembled by the app. */
export function rankPhotoRecipes(matches, selectedFoods) {
  const selected = [...new Set((selectedFoods || []).filter(Boolean))];
  if (!selected.length) return {primary:null, options:[], exact:[], extra:[], partial:[]};
  const seen = new Set();
  const scored = [];
  const list = [...(matches?.full || []), ...(matches?.part || []), ...(matches?.kitchen || []).map(recipe=>({recipe,local:true}))];
  for (const entry of list) {
    const recipe = entry?.recipe;
    if (!recipe?.id || seen.has(recipe.id) || !Array.isArray(recipe.ingredients)) continue;
    const ingredientKeys = new Set(recipe.ingredients.map(item=>item.key).filter(Boolean));
    const required = [...new Set(recipe.ingredients.filter(item=>!item.optional).map(item=>item.key).filter(Boolean))];
    const used = selected.filter(key=>ingredientKeys.has(key));
    if (!used.length) continue;
    const left = selected.filter(key=>!ingredientKeys.has(key));
    const missing = required.filter(key=>!selected.includes(key));
    const usesAll = left.length===0;
    const rank = usesAll ? (missing.length===0?0:1) : 2;
    seen.add(recipe.id);
    scored.push({...entry,recipe,used,left,missing,usedAll:usesAll,rank,local:!!entry.local});
  }
  scored.sort((a,b)=>a.rank-b.rank || (a.rank===2?b.used.length-a.used.length:0) || a.missing.length-b.missing.length || Number(!!a.local)-Number(!!b.local) || a.recipe.time-b.recipe.time || a.recipe.id.localeCompare(b.recipe.id));
  const exact=scored.filter(a=>a.rank===0), extra=scored.filter(a=>a.rank===1), partial=scored.filter(a=>a.rank===2);
  return {primary:exact[0]||extra[0]||null,options:scored,exact,extra,partial};
}

/** Required ingredients absent from the user's explicitly selected foods.
 * Optional recipe ingredients do not gate cooking; saved pantry stock is NOT assumed.
 * This is also used by the photo-result "Cook this" guard. */
export function requiredMissingFoods(recipe, selectedFoods) {
  const selected = new Set(Array.isArray(selectedFoods) ? selectedFoods.filter(Boolean) : []);
  const entries = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  return [...new Set(entries.filter(item => item && !item.optional && item.key).map(item => item.key))]
    .filter(key => !selected.has(key));
}
