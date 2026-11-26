// 15.20 · typed foods: when a word is not one food, offer the foods it names, not the words it resembles.
//
// Measured by typing 162 everyday food words into My pantry, one at a time (work/tools/probe-words.mjs):
//   production recognised 70. "bread", "pasta", "cheese", "butter", "tuna", "oats", "beef", "tofu", "herbs" were all "Not recognized", mostly
//   with no suggestion at all. With the catalogue's alias table 143 are recognised. This patch is about the rest: a word such as "beans",
//   "oil", "nuts" or "pepper" really does name several foods, so it must stay a question; but the question was answered by spelling distance
//   alone, which offered "Beetroot / Pear / Peas" for "beans", "Salsa / Salt / Sausage" for "salad" and, with the larger catalogue, "Cream"
//   for "bread".
// Now a suggestion is, in this order:
//   1. a food whose label contains the typed word as a word      ("beans" → Green beans, Dried white beans …; "pepper" → Bell, Chili, Black)
//   2. a food whose label ends in it                             ("berries" → Blueberries, Strawberries …; "nuts" → Walnuts, Peanuts …)
//   3. a food with another name that contains or ends in it      ("salad" → Lettuce, Leafy greens)
//   4. only when none of those exists: a near spelling           ("tomatoe" → Tomato). Five-letter words now need one edit, not two.
// The closest kind of match answers alone; a looser kind is added only while fewer than three foods are on offer ("beef" offers minced
// beef and beef steak, not the beefsteak tomato).
// Nothing is ever chosen for the person: these are still buttons under "Review possible matches (not automatic)".
const NEW_FN = `function suggestionsFor(name) {
    const needle = normalize(foodToken(name).name);
    if (needle.length < 3 || needle.length > MAX_SEARCH) return [];
    const asWord = text => text !== needle && (' ' + text + ' ').includes(' ' + needle + ' ');
    const asEnding = text => needle.length >= 4 && text.split(' ').some(word => word !== needle && word.endsWith(needle));
    const order = Object.keys(catalog.foodLabels);
    const found = [];
    for (const [id, names] of foodSearchIndex || []) {
      const [own = '', ...others] = names;
      let score = 99;
      if (asWord(own)) score = 0;
      else if (asEnding(own)) score = 1;
      else if (others.some(asWord)) score = 2;
      else if (others.some(asEnding)) score = 3;
      else {
        const distance = Math.min(...names.map(x => editDistance(needle,x)));
        if (distance <= (needle.length <= 5 ? 1 : 2)) score = 10 + distance;
      }
      if (score < 99) found.push({id, distance:score});
    }
    found.sort((a,b)=>a.distance-b.distance||order.indexOf(a.id)-order.indexOf(b.id));
    const named = found.filter(item => item.distance < 10);
    if (!named.length) return found.slice(0, 3);
    // the closest kind of match answers; a looser kind is added only while fewer than three foods are on offer
    const picked = [];
    for (const item of named) {
      if (picked.length >= 5) break;
      if (picked.length >= 3 && item.distance !== picked[picked.length - 1].distance) break;
      picked.push(item);
    }
    return picked;
  }
`;
export default {
  title: 'typed foods: a word that names several foods is answered with those foods, not with look-alike spellings',
  apply(c) {
    const HOME = 'assets/premium-home-15.19.0.js';
    c.editRe(HOME, /function suggestionsFor\(name\) \{[\s\S]*?\n  \}\r?\n/g, () => NEW_FN, {label: 'suggestionsFor'});
    const t = c.read(HOME);
    for (const need of ['function editDistance(a, b)', 'foodSearchIndex.set(id, normalized)', 'const MAX_SEARCH', 'function foodToken(']) if (!t.includes(need)) throw new Error('typed list: expected helper not found: ' + need);
  }
};
