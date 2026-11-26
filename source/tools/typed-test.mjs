// What My pantry makes of the words people type. Uses the page's own parser in a real browser: each word is typed alone and the preview is read.
//   · everyday words become the food they mean,
//   · words that name several foods stay a question, and the question offers those foods (never look-alike spellings),
//   · a typo is still caught, nonsense offers nothing.
// usage: node typed-test.mjs <baseUrl> <seedRoot>
import {launch, newPage, sleep} from './lib.mjs';
import {buildSeed} from './seed.mjs';
const [base, siteRoot] = process.argv.slice(2);

/** word → the food it must become */
const IS = {
  bread: 'Whole-grain bread', toast: 'Whole-grain bread', 'loaf of bread': 'Whole-grain bread', 'brown bread': 'Whole-grain bread', 'ψωμί': 'Whole-grain bread',
  yogurt: 'Greek yogurt', yoghurt: 'Greek yogurt', pasta: 'Whole-wheat pasta', spaghetti: 'Whole-wheat pasta', rice: 'Rice', 'brown rice': 'Rice',
  cheese: 'Cheese', cheddar: 'Hard cheese', parmesan: 'Hard cheese', butter: 'Butter', milk: 'Milk', eggs: 'Eggs', egg: 'Eggs',
  tuna: 'Canned tuna', oats: 'Rolled oats', oatmeal: 'Rolled oats', porridge: 'Rolled oats', pita: 'Whole-grain pita', tortilla: 'Whole-wheat tortillas', wrap: 'Whole-wheat tortillas',
  tomatoes: 'Tomato', 'cherry tomatoes': 'Tomato', 'red onion': 'Onion', onions: 'Onion', potatoes: 'Potato', carrots: 'Carrot', cucumbers: 'Cucumber', lemons: 'Lemon', apples: 'Apple', oranges: 'Orange',
  'red pepper': 'Bell pepper', peppers: 'Bell pepper', 'bell pepper': 'Bell pepper', chili: 'Chili pepper', 'black pepper': 'Black pepper',
  herbs: 'Fresh herbs', parsley: 'Parsley', basil: 'Basil', mint: 'Mint', dill: 'Dill', ginger: 'Ginger', leek: 'Leek', cabbage: 'Cabbage',
  fruit: 'Seasonal fruit', grapes: 'Grapes', lime: 'Lime', corn: 'Sweetcorn',
  chicken: 'Chicken', 'chicken breast': 'Chicken', mince: 'Minced beef', 'minced beef': 'Minced beef', steak: 'Beef steak', sirloin: 'Beef steak', pork: 'Pork', lamb: 'Lamb', turkey: 'Turkey', bacon: 'Bacon', sausage: 'Sausage', ham: 'Ham',
  fish: 'Fish', cod: 'Fish', salmon: 'Salmon', prawns: 'Shrimp', mussels: 'Mussels', sardines: 'Sardines', tofu: 'Firm tofu',
  cream: 'Cream', 'sour cream': 'Sour cream', flour: 'Flour', sugar: 'Sugar', salt: 'Salt', hummus: 'Hummus', rusk: 'Barley rusk', stock: 'Stock', 'tomato paste': 'Tomato paste',
  'ντομάτα': 'Tomato', 'φέτα': 'Feta', 'αυγά': 'Eggs', 'ελαιόλαδο': 'Olive oil', 'κοτόπουλο': 'Chicken'
};
/** word → stays a question; [foods that must be offered], [foods that must not] */
const ASK = {
  beans: [['Green beans'], ['Beetroot', 'Pear', 'Peas']],
  oil: [['Olive oil'], []],
  nuts: [['Pine nuts', 'Walnuts'], []],
  pepper: [['Bell pepper', 'Chili pepper', 'Black pepper'], ['Mint', 'Chili flakes']],
  beef: [['Minced beef', 'Beef steak'], ['Tomato']],
  chickpeas: [['Dried chickpeas', 'Cooked chickpeas (drained)'], []],
  lentils: [['Dried lentils', 'Cooked lentils (drained)'], []],
  'white beans': [['Dried white beans', 'Cooked white beans (drained)'], []],
  berries: [['Strawberries', 'Blueberries'], ['Cherries', 'Capers']],
  salad: [['Lettuce'], ['Salsa', 'Salt', 'Sausage']],
  seeds: [['Pumpkin seeds', 'Sesame seeds'], []],
  sprouts: [['Brussels sprouts', 'Bean sprouts'], []],
  tomatoe: [['Tomato'], []],
  brocoli: [['Broccoli'], []],
  'tomato sauce': [[], ['Ketchup']],
  xyzzyq: [[], ['*']]
};

const b = await launch();
const seed = await buildSeed(siteRoot, 'fresh');
const {page, ctx} = await newPage(b, {w: 430, h: 900, storage: {'dtable:workspace:v2': JSON.stringify(seed)}});
await page.goto(base + '/pantry/', {waitUntil: 'networkidle'});
await sleep(900);
const manual = page.locator('.dt-manual-disclosure:not([open]) > summary').first();
if (await manual.count()) { await manual.click(); await sleep(200); }
async function read(word) {
  await page.fill('#pantry-input', word);
  await sleep(130);
  return page.evaluate(() => {
    const host = document.getElementById('dt-manual-preview'); if (!host || host.hidden) return {known: [], unknown: false, offers: []};
    const text = host.innerText.replace(/\s+/g, ' ');
    const count = Number((text.match(/(\d+) recognized ingredient/) || [])[1] || 0);
    const names = count ? (host.querySelector('.dt-manual-preview-heading h3 + p')?.innerText || '').split('·').map(s => s.trim()).filter(Boolean) : [];
    return {known: names, unknown: /Not recognized/i.test(text), offers: [...host.querySelectorAll('[data-demo-suggest]')].map(x => x.innerText.replace(/^Use /i, '').trim())};
  });
}
const bad = [];
for (const [word, food] of Object.entries(IS)) {
  const r = await read(word);
  if (r.unknown || r.known.length !== 1 || r.known[0] !== food) bad.push(`"${word}" should be ${food}: got ${r.unknown ? 'not recognised' + (r.offers.length ? ', offered ' + r.offers.join(' / ') : '') : r.known.join(', ')}`);
}
const shown = [];
for (const [word, [must, never]] of Object.entries(ASK)) {
  const r = await read(word);
  shown.push(`${word} → ${r.offers.join(' / ') || '(nothing offered)'}`);
  if (!r.unknown) { bad.push(`"${word}" should stay a question: became ${r.known.join(', ')}`); continue; }
  for (const m of must) if (!r.offers.includes(m)) bad.push(`"${word}" should offer ${m}: offered ${r.offers.join(' / ') || 'nothing'}`);
  for (const n of never) if (n === '*' ? r.offers.length : r.offers.includes(n)) bad.push(`"${word}" must not offer ${n === '*' ? 'anything' : n}: offered ${r.offers.join(' / ')}`);
}
// several foods in one line, with a quantity and both separators
const many = await read('2 eggs, bread and tomatoes + feta, olive oil');
if (many.unknown || many.known.join('|') !== 'Eggs|Whole-grain bread|Tomato|Feta|Olive oil') bad.push('a mixed line should be five foods: ' + JSON.stringify(many));
console.log(shown.map(s => '   ' + s).join('\n'));
console.log(bad.length ? 'FAIL typed foods\n      - ' + bad.join('\n      - ') : `PASS typed foods: ${Object.keys(IS).length} everyday words become the right food, ${Object.keys(ASK).length} ambiguous or misspelt words are answered sensibly, a mixed line is read whole`);
console.log('page errors:', page.__errors.slice(0, 4).join(' | ') || 'none');
await ctx.close(); await b.close();
process.exit(bad.length || page.__errors.length ? 1 : 0);
