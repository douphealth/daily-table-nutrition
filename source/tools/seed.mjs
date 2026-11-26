// Builds populated app states, validated by the app's own validateState (core.js) and produced with the
// app's own planning functions (draftWeek/saveWeek), so every seed is a state the real app could reach.
// kinds: fresh | populated | allergic (peanut + dairy exclusions, vegetarian style)
import path from 'node:path';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export async function buildSeed(siteRoot, kind = 'populated', today = new Date()) {
  const assets = path.join(siteRoot, 'assets');
  const imp = f => import(pathToFileURL(path.join(assets, f)).href);
  const core = await imp('core.js');
  const data = JSON.parse(fs.readFileSync(path.join(assets, 'data.json'), 'utf8'));
  const s = core.defaultState();
  if (kind === 'fresh') return s;
  const dm = await imp('daily-model.js');
  const em = await imp('experience-model.js');
  const dk = core.dateKey(today);
  s.pantry = ['yogurt', 'oats', 'banana', 'walnuts', 'egg', 'tomato', 'cucumber', 'feta', 'olives', 'oliveOil', 'lemon', 'spinach', 'rice', 'chicken', 'lentils', 'potato'].filter(k => data.foodLabels[k]);
  s.useFirst = ['spinach', 'tomato'].filter(k => s.pantry.includes(k));
  s.favorites = data.recipes.filter((r, i) => i % 7 === 0).slice(0, 6).map(r => r.id);
  s.servings = 2;
  s.personalization = {name: 'Maria', mode: 'household', priority: 'use-pantry', configured: true};
  const plusDays = n => core.dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));
  s.daily.stock = {
    spinach: {amount: 120, unit: 'g', level: 'little', useBy: plusDays(2), location: 'fridge', opened: ''},
    tomato: {amount: 400, unit: 'g', level: 'plenty', useBy: plusDays(3), location: 'fridge', opened: ''}
  };
  if (kind === 'allergic') {
    s.daily.allergens = ['peanuts', 'milk'];
    s.recipePreferences = {diet: 'vegetarian', maxTime: 0, excluded: []};
  }
  s.daily.flow.configured = true;
  s.daily.flow.experience.quickStarted = true;
  // Save this week and next with the app's own planner.
  const mon = dm.monday(dk);
  for (const start of [mon, dm.addDays(mon, 7)]) {
    const draft = em.draftWeek(data, s, start, {examples: true});
    if (Object.values(draft.records).some(r => Object.keys(r.meals).length)) em.saveWeek(s, data, draft, {approveShopping: true});
  }
  // Record breakfast as eaten today, add water, extra shopping items.
  const todayPlan = s.daily.flow.days[dk];
  if (todayPlan?.meals?.breakfast) s.logs[dk] = {water: 750, meals: {breakfast: todayPlan.meals.breakfast.recipe}};
  else s.logs[dk] = {water: 750, meals: {}};
  s.custom = ['Sparkling water', 'Kitchen towels'];
  return core.validateState(JSON.parse(JSON.stringify(s)), data);
}
