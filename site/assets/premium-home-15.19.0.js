/* The Daily Table 15.16: real catalog, explicit ingredient selection, no hidden writes.
 * Existing AI / pantry security / local state are deliberately NOT overridden.
 */
(() => {
  'use strict';
  const build = '15.20.0';
  const HANDOFF_KEY = 'daily-table:demo-handoff:v1';
  const HANDOFF_MS = 5 * 60 * 1000;
  // A same-tab transfer must never silently land in another person's kitchen.
  function activeKitchenId() {
    try {
      const raw = localStorage.getItem('dtable:profiles:v1');
      if (!raw) return 'default';
      const list = JSON.parse(raw);
      const id = list?.active;
      if ((id === 'default' || /^p-[a-z0-9-]{8,60}$/.test(id)) &&
          Array.isArray(list.profiles) && list.profiles.some(p=>p?.id === id)) return id;
    } catch { /* Invalid profile list: do not transfer */ }
    return null;
  }
  const home = document.body.dataset.page === 'home';
  const pantry = document.body.dataset.page === 'pantry/' || document.body.dataset.page === 'pantry';
  if (!home && !pantry) return;

  const examples = [
    { id: 'bananaToast', label: '5-minute snack' },
    { id: 'scramble', label: 'Greek breakfast' },
    { id: 'chickpeaAvocadoSalad', label: 'Fresh lunch' }
  ];
  const featured = ['egg', 'tomato', 'rice', 'yogurt', 'carrot', 'chickpeasCooked', 'oats',
    'chicken', 'banana', 'bread', 'tahini', 'spinach', 'feta', 'avocado', 'oliveOil'];
  const greekAliases = {
    egg: ['αυγο', 'αυγα'], tomato: ['ντοματα', 'τοματα', 'ντοματες'],
    rice: ['ρυζι'], yogurt: ['γιαουρτι'], carrot: ['καροτο', 'καροτα'],
    oats: ['βρωμη', 'νιφαδες βρωμης'], chicken: ['κοτοπουλο'],
    banana: ['μπανανα', 'μπανανες'], bread: ['ψωμι ολικης', 'ψωμι ολικης αλεσης'],
    tahini: ['ταχινι'], spinach: ['σπανακι'], feta: ['φετα'],
    avocado: ['αβοκαντο'], oliveOil: ['ελαιολαδο'],
    cucumber: ['αγγουρι'], onion: ['κρεμμυδι'], lemon: ['λεμονι'],
    potato: ['πατατα', 'πατατες'], garlic: ['σκορδο'],
    fish: ['ψαρι'], salmon: ['σολομος'],
    walnuts: ['καρυδια', 'καρυδι'], olives: ['ελιες', 'ελια'],
    fruit: ['φρουτο εποχης', 'εποχιακα φρουτα'], milk: ['γαλα'],
    lettuce: ['μαρουλι'], pepper: ['πιπερια'], greens: ['χορτα', 'φυλλωδη λαχανικα'],
    giantBeans: ['ξεροι γιγαντες', 'γιγαντες ξεροι'],
    lentils: ['ξηρες φακες', 'ξερες φακες'],
    lentilsCooked: ['βρασμενες φακες', 'μαγειρεμενες φακες'],
    chickpeas: ['ξερα ρεβιθια', 'ξηρα ρεβιθια'],
    chickpeasCooked: ['βρασμενα ρεβιθια', 'μαγειρεμενα ρεβιθια'],
    whiteBeans: ['ξερα λευκα φασολια'],
    whiteBeansCooked: ['βρασμενα λευκα φασολια'],
    blackBeansCooked: ['βρασμενα μαυρα φασολια'],
    celery: ['σελινο'], tomatoCanned: ['ντοματα κονσερβα', 'κονσερβα ντοματας'],
    herbs: ['φρεσκα μυρωδικα', 'μυρωδικα'], beef: ['μοσχαρισιος κιμας', 'κιμας μοσχαρισιος'],
    honey: ['μελι'], mushroom: ['μανιταρια', 'μανιταρι'],
    paximadi: ['κριθαρενιο παξιμαδι'], pasta: ['ζυμαρικα ολικης', 'μακαρονια ολικης'],
    zucchini: ['κολοκυθακι', 'κολοκυθακια'], hardcheese: ['σκληρο τυρι'],
    pita: ['πιτα ολικης'], trahana: ['τραχανας', 'τραχανα'],
    blueberries: ['μυρτιλα'], broccoli: ['μπροκολο'], artichoke: ['αγκιναρα'],
    sweetPotato: ['γλυκοπατατα'], cauliflower: ['κουνουπιδι'],
    eggplant: ['μελιτζανα', 'μελιτζανες'], kale: ['λαικινατο', 'λαχανο kale'],
    greenBeans: ['φασολακια'], peas: ['αρακας'], corn: ['γλυκο καλαμποκι'],
    apple: ['μηλο', 'μηλα'], orange: ['πορτοκαλι'],
    strawberries: ['φραουλες', 'φραουλα'], shrimp: ['γαριδες', 'γαριδα'],
    tunaCanned: ['τονος κονσερβα', 'κονσερβα τονου'],
    mozzarella: ['μοτσαρελα'], quinoa: ['κινοα'], couscous: ['κους κους'],
    tortilla: ['τορτιγια ολικης'], tofu: ['σφιχτο τοφου', 'τοφου σφιχτο'],
    almonds: ['αμυγδαλα', 'αμυγδαλο'], peanutButter: ['φυστικοβουτυρο'],
    scallion: ['φρεσκο κρεμμυδακι', 'φρεσκα κρεμμυδακια'],
    radish: ['ραπανακι', 'ραπανακια'], chiliPepper: ['καυτερη πιπερια'],
    jujube: ['φρεσκο τζιτζιφο', 'τζιτζιφο'],
  };
  const englishAliases = { egg: ['egg', 'eggs'], tomato: ['tomatoes'],
    yogurt: ['yoghurt'], carrot: ['carrots'], banana: ['bananas'],
    oliveOil: ['olive oil'], onion: ['onions'], potato: ['potatoes'],
    garlic: ['garlic cloves'], oats: ['rolled oats'], spinach: ['spinach leaves'],
    chickpeasCooked: ['cooked chickpeas', 'boiled chickpeas', 'canned chickpeas'],
    lentilsCooked: ['cooked lentils', 'boiled lentils', 'canned lentils'],
    whiteBeansCooked: ['cooked white beans', 'boiled white beans', 'canned white beans'],
    blackBeansCooked: ['cooked black beans', 'boiled black beans', 'canned black beans'],
    tomatoCanned: ['tinned tomatoes', 'canned tomato', 'tinned tomato'],
    scallion: ['spring onion', 'spring onions'],
    pepper: ['bell peppers', 'sweet pepper'],
    tofu: ['firm tofu'],
    eggplant: ['aubergine', 'aubergines'],
    zucchini: ['courgette', 'courgettes'],
    corn: ['sweet corn'],
    shrimp: ['prawns', 'prawn'],
    mushroom: ['mushroom'],
    pasta: ['whole wheat pasta'],
    tortilla: ['whole wheat tortillas'] };
  const allergens = { dairy: 'Dairy', egg: 'Eggs', nuts: 'Tree nuts',
    peanuts: 'Peanuts', sesame: 'Sesame', fish: 'Fish', shellfish: 'Shellfish',
    wheat: 'Wheat / gluten cereals', soy: 'Soy' };
  // Saved dietary styles are ingredient-list filters, NOT allergy diagnoses or
  // certifications about packaged foods, cross-contact, cookware or serving size.
  const styleBlocked = {
    pescatarian: ["chicken","beef","steak","turkey","lamb","pork","bacon","sausage","duck","veal","liver","meat","ham"],
    vegetarian: ["chicken","beef","steak","turkey","lamb","pork","bacon","sausage","duck","veal","liver","meat","ham","fish","salmon","shrimp","tunaCanned","mackerel","trout","tunaSteak","halibut","squid","mussels","clams","scallops","crab","sardines","anchovies","fishSauce","oysterSauce","kimchi"],
    'gluten-free': ['oats'], // Core app explicitly excludes oats for this food pattern.
    plant: ["chicken","beef","steak","turkey","lamb","pork","bacon","sausage","duck","veal","liver","meat","ham","fish","salmon","shrimp","tunaCanned","mackerel","trout","tunaSteak","halibut","squid","mussels","clams","scallops","crab","sardines","anchovies","fishSauce","oysterSauce","kimchi","yogurt","milk","feta","hardcheese","trahana","mozzarella","ricotta","creamCheese","cottageCheese","sourCream","heavyCream","butter","ghee","paneer","halloumi","brie","blueCheese","kefir","buttermilk","naan","pesto","darkChocolate","cheese","egg","noodles","mayonnaise","honey"]
  };
  const styleLabels = { pescatarian:'Pescatarian ingredient list',
    vegetarian:'Vegetarian ingredient list', plant:'Plant-only ingredient list',
    'gluten-free':'Gluten-free ingredient list (oats excluded)',
    'dairy-free':'Dairy-free ingredient list' };
  const acceptedSavedDiets = new Set(['all',...Object.keys(styleBlocked)]);
  const acceptedEaterPatterns = new Set(['all','mediterranean',...Object.keys(styleBlocked),'dairy-free','gluten-free']);
  const safe = input => String(input ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const validId = id => typeof id === 'string' && /^[A-Za-z][A-Za-z0-9]*$/.test(id);
  const validSlug = slug => typeof slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(slug);
  const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, ' ');

  let catalog = null;
  const chosen = new Set(['banana', 'bread', 'tahini']);
  const exclusions = new Set();
  let showAll = false;
  let search = '';
  let portions = 1;
  let activeRecipe = null;
  let lastFeedback = '';
  let nameLookup = null;
  let foodSearchIndex = null;
  let candidateCache = { key: '', items: [] };
  let starterValidated = false;
  let boundPantryInput = null;
  let boundPantryForm = null;
  const allowedGroups = new Set(Object.keys(allergens));
  const MAX_FOODS = 24;
  const MAX_TYPED_CHARS = 1200;
  // Read-only projection of saved, device-local restrictions. These are NEVER
  // written or loosened by the homepage or transient Pantry preview.
  const savedGroupAliases = {
    milk:'dairy', dairy:'dairy', eggs:'egg', egg:'egg',
    nuts:'nuts', 'tree-nuts':'nuts', 'tree nuts':'nuts',
    peanuts:'peanuts', peanut:'peanuts', sesame:'sesame',
    fish:'fish', shellfish:'shellfish', crustaceans:'shellfish',
    wheat:'wheat', gluten:'wheat', 'gluten cereals':'wheat',
    soy:'soy', soya:'soy'
  };
  let savedSafety = { groups:new Set(), foods:new Set(), styles:new Set(), softFoods:new Set(), simple:false, maxTime:0, problem:'' };
  let savedSafetyFingerprint = '';
  // Large browser-local kitchens may contain full schedules. Avoid parsing a
  // multi-kilobyte workspace on every keystroke if its stored value is unchanged.
  let cachedSafetyStorage = { profiles:null, key:null, raw:null };
  function readSavedSafety() {
    const result = { groups:new Set(), foods:new Set(), styles:new Set(), softFoods:new Set(), simple:false, maxTime:0, problem:'' };
    try {
      let active = 'default';
      const listRaw = localStorage.getItem('dtable:profiles:v1');
      if (listRaw) {
        const list = JSON.parse(listRaw);
        if (!list || typeof list.active !== 'string' ||
          !Array.isArray(list.profiles) || !list.profiles.some(p => p.id === list.active))
          throw Error('Unreadable profile selection');
        active = list.active;
      }
      if (active !== 'default' && !/^p-[a-z0-9-]{8,60}$/.test(active))
        throw Error('Invalid profile selection');
      const workspaceKey = 'dtable:workspace:v2' + (active === 'default' ? '' : ':' + active);
      const raw = localStorage.getItem(workspaceKey);
      if (cachedSafetyStorage.profiles === listRaw && cachedSafetyStorage.key === workspaceKey &&
          cachedSafetyStorage.raw === raw) return savedSafety;
      cachedSafetyStorage = { profiles:listRaw, key:workspaceKey, raw };
      if (!raw) return result;
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object' || Array.isArray(state))
        throw Error('Unreadable saved kitchen');
      const daily = state.daily || {};
      const flow = daily.flow || {};
      if (!flow || typeof flow !== 'object' || Array.isArray(flow))
        throw Error('Saved household settings are malformed');
      const prefs = state.recipePreferences || {};
      if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs))
        throw Error('Saved recipe preferences are malformed');
      if (prefs.excluded != null && !Array.isArray(prefs.excluded))
        throw Error('Saved food exclusions are malformed');
      for (const id of prefs.excluded || []) {
        if (typeof id !== 'string' || !catalog?.foodLabels?.[id])
          throw Error('Saved food exclusion cannot be matched to this catalog');
        result.foods.add(id);
      }
      const diet = prefs.diet == null ? 'all' : prefs.diet;
      if (typeof diet !== 'string' || !acceptedSavedDiets.has(diet))
        throw Error('Saved dietary style cannot be safely matched');
      if (diet !== 'all') result.styles.add(diet);
      // Main app's family routine stores the HOUSEHOLD pattern separately from
      // the quick recipe style. Both constraints must apply to every preview.
      const householdPattern = flow.pattern == null ? 'all' : flow.pattern;
      if (typeof householdPattern !== 'string' || !acceptedEaterPatterns.has(householdPattern))
        throw Error('Saved household food pattern cannot be safely matched');
      if (styleBlocked[householdPattern]) result.styles.add(householdPattern);
      if (householdPattern === 'dairy-free') { result.groups.add('dairy'); result.styles.add('dairy-free'); }
      if (householdPattern === 'gluten-free') {
        result.groups.add('wheat');
        result.styles.add('gluten-free');
      }
      const complexity = flow.skill == null ? 'any' : flow.skill;
      if (complexity !== 'any' && complexity !== 'simple')
        throw Error('Saved cooking complexity cannot be safely matched');
      result.simple = complexity === 'simple';
      // Dislikes are SOFT preferences, not hard exclusions: prioritize recipes
      // with fewer disliked foods without incorrectly promising exclusion.
      const addSoftFoods = list => {
        if (list == null) return;
        if (!Array.isArray(list)) return; // malformed optional preferences are ignored
        for (const id of list) if (typeof id === 'string' && catalog.foodLabels[id])
          result.softFoods.add(id);
      };
      addSoftFoods(flow.dislikes);
      if (prefs.maxTime != null && prefs.maxTime !== '') {
        const minutes = Number(prefs.maxTime);
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 360)
          throw Error('Saved recipe time preference is malformed');
        result.maxTime = minutes;
      }
      if (daily.allergens != null && !Array.isArray(daily.allergens))
        throw Error('Saved allergen settings are malformed');
      const eaters = flow.eaters || [];
      if (!Array.isArray(eaters)) throw Error('Saved eater settings are malformed');
      const named = [...(daily.allergens || [])];
      for (const eater of eaters) {
        if (!eater || typeof eater !== 'object' ||
            (eater.allergens != null && !Array.isArray(eater.allergens)) ||
            (eater.excluded != null && !Array.isArray(eater.excluded)))
          throw Error('Saved eater restrictions are malformed');
        named.push(...(eater.allergens || []));
        const pattern = eater.pattern == null ? 'all' : eater.pattern;
        if (typeof pattern !== 'string' || !acceptedEaterPatterns.has(pattern))
          throw Error('Saved family food pattern cannot be safely matched');
        if (styleBlocked[pattern]) result.styles.add(pattern);
        if (pattern === 'dairy-free') { result.groups.add('dairy'); result.styles.add('dairy-free'); }
        if (pattern === 'gluten-free') {
          result.groups.add('wheat');
          result.styles.add('gluten-free');
        }
        addSoftFoods(eater.dislikes);
        for (const id of eater.excluded || []) {
          if (typeof id !== 'string' || !catalog?.foodLabels?.[id])
            throw Error('Saved food exclusion cannot be matched to this catalog');
          result.foods.add(id);
        }
      }
      for (const group of named) {
        if (typeof group !== 'string') throw Error('Saved allergen category is malformed');
        const key = savedGroupAliases[normalize(group)];
        if (!key || !allowedGroups.has(key))
          throw Error('Saved allergen category cannot be safely matched');
        result.groups.add(key);
      }
    } catch {
      // Fail closed for recipe preview rather than silently ignoring restrictions.
      result.problem = 'Saved kitchen restrictions could not be verified. Open Settings, review them, and use the original kitchen workflow before relying on recipe suggestions.';
    }
    return result;
  }
  function refreshSavedSafety() {
    const next = readSavedSafety();
    const fingerprint = [...next.groups].sort().join(',') + '/' +
      [...next.foods].sort().join(',') + '/' + [...next.styles].sort().join(',') +
      '/' + [...next.softFoods].sort().join(',') + '/' + next.simple +
      '/' + next.maxTime + '/' + next.problem;
    if (fingerprint !== savedSafetyFingerprint) candidateCache.key = '';
    savedSafety = next;
    savedSafetyFingerprint = fingerprint;
  }
  function combinedGroups() { return new Set([...exclusions, ...savedSafety.groups]); }
  function savedSafetyNotice() {
    if (savedSafety.problem) return ''; // A single contextual alert renders in the recipe panel.
    const foodCount = savedSafety.foods.size;
    const parts = [];
    if (savedSafety.groups.size) parts.push('allergen/ingredient groups: ' +
      [...savedSafety.groups].map(g=>allergens[g]).join(', '));
    if (foodCount) parts.push(foodCount + ' individually excluded food' + (foodCount===1?'':'s'));
    if (savedSafety.styles.size) parts.push('food styles: ' +
      [...savedSafety.styles].map(s=>styleLabels[s]).join(', '));
    if (savedSafety.simple) parts.push('simple methods: at most 8 foods and 8 steps');
    if (savedSafety.softFoods.size) parts.push('soft dislikes ranked lower: ' +
      [...savedSafety.softFoods].slice(0,8).map(label).join(', ') +
      (savedSafety.softFoods.size > 8 ? ' and others' : ''));
    if (savedSafety.maxTime) parts.push('listed time up to ' + savedSafety.maxTime +
      ' minute' + (savedSafety.maxTime===1?'':'s') + ' (advance preparation may take longer)');
    return parts.length ? '<p class="dt-demo-profile-lock" role="status">Saved kitchen preferences applied: ' +
      safe(parts.join('; ')) + '. These cannot be loosened in the preview. <a href="/settings/">Review kitchen settings</a>.</p>' : '';
  }
  const advancePrep = {
    appleAlmondOvernightOats: 'Refrigerate the oats for at least 4 hours or overnight. The listed 5 minutes are hands-on time, not time to eat.',
    gigantes: 'Soak dried giant beans overnight, then pre-cook until tender before the 50-minute recipe stage.',
    revithia: 'Soak dried chickpeas overnight, then pre-cook until tender before the 55-minute recipe stage.',
    fasolada: 'Dried white beans require soaking and thorough pre-cooking before the listed 50-minute stage.'
  };
  const MAX_SEARCH = 140;
  const splitFoodNames = text => String(text || '')
    .replace(/^\s*(?:(?:i\s+have|i['’]ve\s+got|my\s+(?:kitchen|fridge)\s+has)|(?:έχω|εχω|διαθέτω|διαθετω))\s*[:,-]?\s*/iu, '')
    .split(/[,;\n\r]+|\s+(?:and|και|&|with|με)\s+|\s*\+\s*|\s+\/\s+/gi)
    .map(item => item.trim()).filter(Boolean);
  // Quantity prefixes are recognized for NAME MATCHING ONLY. We never claim
  // that typed quantities update pantry stock, recipe nutrition or portions.
  const amountUnit = '(?:pieces?|pcs?|eggs?|g|gr|grams?|kg|kilograms?|ml|l|litres?|liters?|cups?|tsp|tbsp|τεμ|τεμαχια|γραμμαρια|γρ|κιλα)';
  const amountPrefix = new RegExp('^(\\d{1,4}(?:\\.\\d{1,2})?)(?:\\s*(' + amountUnit + ')\\s+|\\s+)(.+)$', 'iu');
  function foodToken(fragment) {
    const cleaned = String(fragment || '').trim().replace(/^[•*\-]\s+/, '').replace(/[.!?]+$/, '').trim();
    const frac = cleaned.match(/^(\d{1,2})\/(\d{1,2})\s+(?:(cups?|tsp|tbsp|g|gr|kg|ml|l|grams?|liters?|λιτρα|γρ|γραμμαρια)\s+)?(.+)$/iu);
    if (frac) return { name: frac[4].trim(), quantity: frac[1] + '/' + frac[2] + (frac[3] ? ' ' + frac[3] : ''),
      invalid: Number(frac[2])===0 || Number(frac[1])===0 };
    const compact = cleaned.match(/^(\d{1,4}(?:\.\d{1,2})?)(g|gr|kg|ml|l)\s+(.+)$/iu);
    if (compact) return { name:compact[3].trim(), quantity:compact[1] + compact[2], invalid:Number(compact[1]) <= 0 };
    const match = cleaned.match(amountPrefix);
    if (match) return { name: match[3].trim(), quantity: match[1] + (match[2] ? ' ' + match[2] : ''),
      invalid: Number(match[1]) <= 0 };
    const wordCount = cleaned.match(/^(one|two|three|four|δύο|δυο|τρία|τρια|τέσσερα|τεσσερα)\s+(.+)$/iu);
    if (wordCount) return { name: wordCount[2].trim(), quantity: wordCount[1], invalid:false };
    const article = cleaned.match(/^(a|an|μια|μία|ενα|ένα|ενας|ένας)\s+(.+)$/iu);
    return article ? { name: article[2].trim(), quantity: article[1] } : { name: cleaned, quantity: '' };
  }


  const label = id => catalog?.foodLabels?.[id] || id;
  const recipeById = id => catalog?.recipes?.find(recipe => recipe.id === id);
  function names(ids) { return ids.map(label); }
  function uniqueIngredients(recipe) { return [...new Set(recipe.ingredients.map(i => i.key))]; }
  function activeForbiddenKeys() {
    const blocked = new Set();
    for (const group of combinedGroups()) for (const food of catalog?.allergenIngredients?.[group] || []) blocked.add(food);
    for (const id of savedSafety.foods) blocked.add(id);
    for (const [group, old] of Object.entries({"dairy":["yogurt","milk","feta","hardcheese","trahana","mozzarella"],"egg":["egg"],"nuts":["walnuts","almonds"],"sesame":["tahini"],"fish":["fish","salmon","tunaCanned"],"wheat":["bread","pasta","pita","paximadi","trahana","couscous","tortilla"],"shellfish":["shrimp"],"soy":["tofu"],"peanuts":["peanutButter"]})) if (old.every(id => savedSafety.foods.has(id))) for (const id of catalog?.allergenIngredients?.[group] || []) blocked.add(id);
    for (const style of savedSafety.styles) {
      for (const id of styleBlocked[style] || []) blocked.add(id);
    }
    return blocked;
  }
  function candidates(selection) {
    if (!selection.length || !catalog || savedSafety.problem) return [];
    const key = [...selection].sort().join('|') + '/' + [...combinedGroups()].sort().join('|') +
      '/' + [...savedSafety.foods].sort().join('|') + '/' +
      '/' + [...savedSafety.styles].sort().join('|') + '/' +
      [...savedSafety.softFoods].sort().join('|') + '/' + savedSafety.simple +
      '/' + savedSafety.maxTime;
    if (key === candidateCache.key) return candidateCache.items;
    const selected = new Set(selection), blocked = activeForbiddenKeys();
    if (selection.some(id => blocked.has(id))) return [];
    const items = catalog.recipes.map(recipe => {
      if (savedSafety.maxTime && Number(recipe.time) > savedSafety.maxTime) return null;
      const keys = uniqueIngredients(recipe);
      if (savedSafety.simple && (keys.length > 8 || (recipe.steps?.length || 0) > 8)) return null;
      if (keys.some(id => blocked.has(id))) return null;
      const used = keys.filter(id => selected.has(id));
      if (!used.length) return null;
      const missing = keys.filter(id => !selected.has(id));
      const unused = selection.filter(id => !keys.includes(id));
      const ratio = used.length / keys.length;
      const disliked = keys.filter(id=>savedSafety.softFoods.has(id));
      const score = (!missing.length ? 300 : 0) + (!unused.length ? 75 : 0) +
        used.length * 36 + ratio * 100 - missing.length * 24 - unused.length * 13 -
        (recipe.time || 30) * .08 - disliked.length * 220;
      return { recipe, keys, used, missing, unused, disliked, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title));
    candidateCache = { key, items };
    return items;
  }
  function formatAmount(quantity, count) {
    const n = Number(quantity) * count;
    return Number.isFinite(n) ? new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(n) : '—';
  }
  function amountUnitLabel(quantity, count, unit) {
    const value = Number(quantity) * count;
    return unit === 'piece' && Number.isFinite(value) && value !== 1 ? 'pieces' : (unit || '');
  }
  function routeFor(recipe) {
    const slug = catalog?.routeMap?.[recipe.id];
    return validSlug(slug) ? '/recipes/' + slug + '/' : '/recipes/';
  }
  function recipeView(item, count = 1, { full = true, handoff = true, alternatives = [] } = {}) {
    const r = item.recipe, photoId = catalog?.photoMap?.[r.id];
    const art = catalog?.illustrationMap?.[r.id];
    const prep = advancePrep[r.id] || '';
    const picture = validId(photoId) ? `/assets/photos-webp/${encodeURIComponent(photoId)}-480.webp` : '';
    const fallback = typeof art === 'string' && /^assets\/[a-zA-Z0-9/_.-]+$/.test(art) ? '/' + art : '';
    const state = item.missing.length === 0 ?
      (item.unused.length ? 'All recipe foods selected · some selected foods unused' : 'All recipe ingredient names selected') :
      `${item.missing.length} more recipe ingredient${item.missing.length === 1 ? '' : 's'} needed`;
    const rows = r.ingredients.map(ing => {
      const selected = item.used.includes(ing.key);
      return `<li class="dt-demo-ingredient ${selected ? 'is-selected' : 'is-missing'}"><span>${safe(label(ing.key))}</span><span class="dt-demo-quantity">${safe(formatAmount(ing.quantity, count))} ${safe(amountUnitLabel(ing.quantity, count, ing.unit))}</span><span class="dt-demo-ingredient-state">${selected ? 'Selected' : 'Not selected'}</span></li>`;
    }).join('');
    const steps = Array.isArray(r.steps) ? r.steps.map(step => `<li>${safe(step)}</li>`).join('') : '';
    const alternativesMarkup = alternatives.length > 1 ?
      `<div class="dt-demo-alternatives" role="group" aria-label="Other catalog recipes"><p>Other matching recipes</p>${alternatives.filter(x => x.recipe.id !== r.id).slice(0, 2).map(x =>
        `<button type="button" data-demo-recipe="${safe(x.recipe.id)}">${safe(x.recipe.title)} <small>${x.missing.length ? x.missing.length + ' unselected' : 'all recipe foods selected'}</small></button>`).join('')}</div>` : '';
    return `<article class="dt-demo-recipe">
      ${picture ? `<div class="dt-demo-image"><img src="${picture}" data-fallback="${safe(fallback)}" width="480" height="320" loading="lazy" decoding="async" alt="Illustrative food photograph; not a verified image of ${safe(r.title)}"><span class="dt-demo-image-label">ILLUSTRATIVE PHOTO</span></div>` : ''}
      <div class="dt-demo-preview-content"><p class="dt-demo-result-type">REAL RECIPE FROM OUR COLLECTION</p>
      <h3>${safe(r.title)}</h3><div class="dt-demo-metadata"><span>${safe(r.time)} min ${prep ? 'excluding advance preparation*' : 'estimate*'}</span><span>${r.ingredients.length} listed ingredients</span></div>
      ${prep ? `<p class="dt-demo-advance-prep"><strong>Plan ahead:</strong> ${safe(prep)}</p>` : ''}
      <p class="dt-demo-match" role="status"><strong>${safe(state)}.</strong> ${item.missing.length ? 'Not selected: ' + safe(names(item.missing).join(', ')) + '.' : 'Check the quantities before cooking.'}</p>
      ${item.unused.length ? `<p class="dt-demo-unused">Your other selected foods not used here: ${safe(names(item.unused).join(', '))}.</p>` : ''}
      ${item.disliked?.length ? `<p class="dt-demo-soft-note">Soft preference: this recipe uses ${safe(names(item.disliked).join(', '))}. These foods are not hard exclusions; other options are ranked higher where possible.</p>` : ''}
      ${full ? `<div class="dt-demo-cooking"><h4>Ingredients · ${count} reference ${count === 1 ? 'portion' : 'portions'}</h4><ul class="dt-demo-ingredients">${rows}</ul><h4>Complete cooking method</h4><ol class="dt-demo-method">${steps}</ol></div>` : ''}
      <p class="dt-demo-boundary">*Original time estimate; not independently kitchen-tested. Matching names does not prove available quantities, allergy safety or edible condition. Check labels and use appropriate food temperatures.</p>
      <div class="dt-demo-result-actions"><a class="btn primary" href="${routeFor(r)}">${item.missing.length ? 'View recipe & needed ingredients' : 'Read full recipe & method'}</a>${item.missing.length ? `<button class="dt-demo-copy" type="button" data-demo-copy="${safe(r.id)}">Copy ${item.missing.length} unselected food names</button>` : ''}${handoff ? `<a class="dt-demo-handoff" href="/pantry/?entry=manual#pantry-input" data-demo-handoff>Continue with my foods →</a>` : ''}</div>
      ${alternativesMarkup}</div></article>`;
  }
  function blockedSelection(selection) {
    const forbidden = activeForbiddenKeys();
    return selection.filter(id => forbidden.has(id));
  }
  function installPhotoFallback(root) {
    root.querySelectorAll('img[data-fallback]').forEach(img => img.addEventListener('error', () => {
      const fallback = img.getAttribute('data-fallback');
      img.removeAttribute('data-fallback');
      if (fallback) img.src = fallback;
      else { img.hidden = true; }
    }));
  }
  function matchingFoods() {
    const needle = normalize(search.slice(0, MAX_SEARCH));
    return Object.keys(catalog.foodLabels).filter(id =>
      (chosen.has(id) || !needle || foodSearchIndex.get(id).some(entry=>entry.includes(needle))) &&
      (showAll || needle || featured.includes(id) || chosen.has(id)));
  }
  function countSearchHits() {
    const needle = normalize(search.slice(0, MAX_SEARCH));
    return Object.keys(catalog.foodLabels).filter(id =>
      !needle || foodSearchIndex.get(id).some(entry=>entry.includes(needle))).length;
  }
  function searchCountLabel() {
    const count = countSearchHits();
    return `${count} matching ingredient ${count === 1 ? 'name' : 'names'} · selected foods stay visible`;
  }
  function foodButtons(ids) {
    return ids.map(id => `<button class="dt-demo-chip" type="button" data-demo-food="${safe(id)}" aria-pressed="${chosen.has(id)}"><span class="dt-demo-check" aria-hidden="true">${chosen.has(id) ? '✓' : '+'}</span>${safe(label(id))}</button>`).join('') || '<p class="dt-demo-no-foods">No food names found. Try a different search.</p>';
  }
  function updateSearchChips() {
    const root = document.getElementById('dt-premium-demo');
    const foodBox = root?.querySelector('.dt-demo-foods');
    if (!foodBox) return;
    const matches = matchingFoods();
    foodBox.innerHTML = foodButtons(matches);
    foodBox.classList.toggle('is-expanded', !!search || showAll);
    const count = root.querySelector('.dt-demo-search-count');
    if (count) count.textContent = search ? searchCountLabel() : '';
  }
  function chooseCompatibleStarter() {
    if (starterValidated || !catalog) return;
    starterValidated = true;
    if (savedSafety.problem) { chosen.clear(); return; }
    const forbidden = activeForbiddenKeys();
    const suitable = r => {
      const foods = uniqueIngredients(r);
      return foods.length > 0 && foods.length <= 12 &&
        !foods.some(id=>forbidden.has(id)) &&
        (!savedSafety.maxTime || Number(r.time) <= savedSafety.maxTime) &&
        (!savedSafety.simple || (foods.length <= 8 && (r.steps?.length || 0) <= 8));
    };
    if (![...chosen].some(id=>forbidden.has(id))) return;
    const preferred = examples.map(e=>recipeById(e.id)).filter(Boolean);
    const match = [...preferred, ...catalog.recipes].find(r=>suitable(r) &&
      !advancePrep[r.id] && Number(r.time) <= 30);
    chosen.clear();
    if (match) {
      for (const id of uniqueIngredients(match)) chosen.add(id);
      activeRecipe = match.id;
      lastFeedback = 'Your saved kitchen preferences are active. Showing a compatible example; no foods were saved.';
    } else lastFeedback = 'Your saved kitchen preferences are active. Choose ingredients to find a compatible recipe.';
  }
  function renderHome({ focus = null, keepSafetyOpen = false } = {}) {
    const root = document.getElementById('dt-premium-demo');
    if (!root || !catalog) return;
    refreshSavedSafety();
    chooseCompatibleStarter();
    const selection = [...chosen];
    const bad = blockedSelection(selection);
    const options = candidates(selection);
    if (!options.some(item => item.recipe.id === activeRecipe)) activeRecipe = options[0]?.recipe.id || null;
    const candidate = options.find(item => item.recipe.id === activeRecipe) || null;
    const filteredFoods = matchingFoods();
    const forbiddenPresetFoods = activeForbiddenKeys();
    const presets = examples.filter(item => recipeById(item.id)).map(item => {
      const recipe = recipeById(item.id), ids = uniqueIngredients(recipe);
      const incompatible = ids.some(id => forbiddenPresetFoods.has(id)) ||
        (savedSafety.simple && (ids.length > 8 || (recipe.steps?.length || 0) > 8)) ||
        (savedSafety.maxTime && Number(recipe.time) > savedSafety.maxTime) || !!savedSafety.problem;
      const selected = ids.length === chosen.size && ids.every(id => chosen.has(id));
      return `<button class="dt-demo-preset" type="button" data-demo-example="${item.id}" aria-pressed="${selected}" ${incompatible ? 'disabled title="Conflicts with saved kitchen preferences"' : ''}>${safe(item.label)}${incompatible ? ' · unavailable' : ''}</button>`;
    }).join('');
    const chips = foodButtons(filteredFoods);
    const groups = Object.entries(allergens).filter(([key]) => Array.isArray(catalog.allergenIngredients?.[key]));
    const filters = groups.map(([key, name]) => `<label class="dt-demo-exclusion"><input type="checkbox" data-demo-exclusion="${key}" ${combinedGroups().has(key) ? 'checked' : ''} ${savedSafety.groups.has(key) ? 'disabled aria-label="'+safe(name)+' (required by saved kitchen)"' : ''}>${safe(name)}${savedSafety.groups.has(key) ? ' · saved' : ''}</label>`).join('');
    let content = `<div class="dt-demo-empty"><h3>No ingredient selected</h3><p>Choose a food to see genuine recipes from the collection.</p></div>`;
    if (savedSafety.problem) content = `<div class="dt-demo-empty" role="alert"><h3>Saved allergy settings need review</h3><p>${safe(savedSafety.problem)}</p></div>`;
    else if (bad.length) content = `<div class="dt-demo-empty" role="alert"><h3>Selected foods conflict with your kitchen preferences</h3><p>${safe(names(bad).join(', '))} conflicts with an allergen exclusion, food style or other saved restriction. Remove the food to explore compatible recipes.</p></div>`;
    else if (candidate) content = recipeView(candidate, portions, { alternatives: options.slice(0, 3) });
    else if (selection.length) content = `<div class="dt-demo-empty"><h3>No compatible catalog recipe</h3><p>None of the existing ${catalog.recipes.length} recipes fits this selection and your saved kitchen preferences${savedSafety.maxTime ? ' (including the listed '+savedSafety.maxTime+'-minute limit)' : ''}. Try another combination or continue with your foods in the Pantry.</p><a data-demo-handoff href="/pantry/?entry=manual#pantry-input" class="btn secondary">Continue with my foods</a></div>`;
    root.innerHTML = `<div class="dt-demo-top"><div><p class="dt-demo-overline">INTERACTIVE · REAL RECIPES</p><h2 id="premium-demo-heading">Real ingredients. <em>Real recipes, right here.</em></h2><p>Select ingredients and get actual measured recipes and cooking steps. No account, AI request or kitchen write occurs in this demo.</p></div><span class="dt-demo-total">${catalog.recipes.length} real catalog recipes</span></div>
      <div class="dt-demo-layout"><div class="dt-demo-controls"><p class="dt-demo-step">01 / START WITH A COMBINATION</p><div class="dt-demo-presets" role="group" aria-label="Try an existing recipe's ingredients">${presets}</div>
      <label class="dt-demo-search-label" for="dt-demo-search">Or search ingredients · English or Greek</label><input id="dt-demo-search" class="dt-demo-search" type="search" maxlength="${MAX_SEARCH}" placeholder="e.g. spinach / σπανάκι" value="${safe(search)}" autocomplete="off" spellcheck="false"><p class="dt-demo-search-count" role="status" aria-live="polite">${search ? searchCountLabel() : ''}</p>
      <p class="dt-demo-step">02 / CHOOSE WHAT YOU WANT TO USE</p><div class="dt-demo-foods ${showAll || search ? 'is-expanded' : ''}" role="group" aria-label="Select ingredient names">${chips}</div>
      <button class="dt-demo-show-all" type="button" data-demo-all aria-expanded="${showAll}">${showAll ? 'Show common foods' : `Browse all ${Object.keys(catalog.foodLabels).length} ingredient names`} →</button>
      <div class="dt-demo-summary"><strong>${selection.length} selected ${selection.length > 12 ? '(too many)' : ''}</strong><span>${selection.length ? safe(names(selection).join(' · ')) : 'Choose an ingredient to begin.'}</span></div>
      <div class="dt-demo-options"><label>Reference portions <select data-demo-portions aria-label="Reference portions for recipe preview">${[1,2,3,4,5,6].map(n => `<option value="${n}" ${portions === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${savedSafetyNotice()}<details class="dt-demo-safety" ${combinedGroups().size || keepSafetyOpen ? 'open' : ''}><summary>Ingredient allergen restrictions ${combinedGroups().size ? '(' + combinedGroups().size + ')' : '(optional)'}</summary><div class="dt-demo-exclusions">${filters}</div><p>Saved device restrictions are enforced and cannot be removed here. Additional preview filters are temporary; neither replaces product-label or cross-contact checks.</p></details></div>
      ${lastFeedback ? `<p class="dt-demo-feedback" role="status">${safe(lastFeedback)}</p>` : ''}</div>
      <div class="dt-demo-preview" aria-label="Catalog recipe preview">${content}<p class="dt-demo-copy-status" role="status" aria-live="polite"></p></div></div>
      <p class="dt-demo-footer">Ready for your own foods? <a href="/pantry/?entry=camera#dt-focus-heading">Take a photo</a>, <a href="/pantry/?entry=upload#dt-focus-heading">upload one</a> or <a href="/pantry/?entry=manual#pantry-input">enter ingredients</a>. Your personal restrictions must be checked again in the actual cooking flow.</p>`;
    installPhotoFallback(root);
    if (focus) {
      const el = focus.type === 'search' ? root.querySelector('#dt-demo-search') :
        focus.type === 'food' ? root.querySelector(`[data-demo-food="${focus.id}"]`) :
        focus.type === 'example' ? root.querySelector(`[data-demo-example="${focus.id}"]`) :
        focus.type === 'all' ? root.querySelector('[data-demo-all]') :
        focus.type === 'recipe' ? root.querySelector(`[data-demo-recipe="${focus.id}"]`) :
        focus.type === 'exclusion' ? root.querySelector(`[data-demo-exclusion="${focus.id}"]`) :
        focus.type === 'portions' ? root.querySelector('[data-demo-portions]') : null;
      if (el || focus.type !== 'search') {
        (el || root.querySelector('#dt-demo-search'))?.focus({ preventScroll: true });
        if (focus.type === 'search' && typeof focus.cursor === 'number') {
          try { el.setSelectionRange(focus.cursor, focus.cursor); } catch { /* unsupported input */ }
        }
      }
    }
  }
  function createLookup() {
    nameLookup = new Map();
    foodSearchIndex = new Map();
    for (const [id, text] of Object.entries(catalog.foodLabels)) {
      const names = [text, ...(greekAliases[id] || []), ...(englishAliases[id] || []), ...(Array.isArray(catalog.foodAliases?.[id]) ? catalog.foodAliases[id] : [])];
      const normalized = [...new Set(names.map(normalize).filter(Boolean))];
      foodSearchIndex.set(id, normalized);
      for (const norm of normalized) {
        // Do not silently resolve ambiguous cross-ingredient synonyms.
        if (!nameLookup.has(norm)) nameLookup.set(norm, id);
        else if (nameLookup.get(norm) !== id) nameLookup.set(norm, null);
      }
    }
  }
  function parseNames(text) {
    const known = [], unknown = [], quantified = [];
    const all = splitFoodNames(text);
    const chunks = all.slice(0, MAX_FOODS);
    for (const chunk of chunks) {
      const token = foodToken(chunk);
      if (token.quantity) quantified.push(chunk);
      const id = !token.invalid && nameLookup?.get(normalize(token.name));
      if (!id) unknown.push(chunk);
      else if (!known.includes(id)) known.push(id);
    }
    return { known, unknown, quantified, truncated: all.length > MAX_FOODS, chunks };
  }
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const previous = Array.from({ length:b.length + 1 }, (_,i)=>i);
    const current = Array(b.length + 1).fill(0);
    for (let i=1;i<=a.length;i++) {
      current[0]=i;
      for (let j=1;j<=b.length;j++) current[j]=Math.min(
        previous[j]+1,current[j-1]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
      for (let j=0;j<=b.length;j++) previous[j]=current[j];
    }
    return previous[b.length];
  }
  function suggestionsFor(name) {
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
  function replaceTypedFood(input, oldName, newName) {
    const names = splitFoodNames(input.value);
    const position = names.findIndex(name => normalize(name)===normalize(oldName));
    if (position < 0) return;
    const token = foodToken(names[position]);
    names[position] = (token.quantity ? token.quantity + ' ' : '') + newName;
    input.value = names.join(', ');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus({preventScroll:true});
  }
  function renderManualPreview({ focusExclusion = null } = {}) {
    const input = document.getElementById('pantry-input');
    const host = document.getElementById('dt-manual-preview');
    if (!catalog || !input || !host) return;
    refreshSavedSafety();
    if (input.value.length > MAX_TYPED_CHARS) {
      host.hidden = false;
      host.innerHTML = `<p class="dt-demo-profile-warning" role="alert">Your entry is ${input.value.length} characters long. Use at most ${MAX_TYPED_CHARS} characters and review each ingredient before saving. Nothing has been saved.</p>`;
      return;
    }
    if (!input.value.trim()) { host.hidden = true; host.replaceChildren(); return; }
    const { known, unknown, quantified, truncated } = parseNames(input.value);
    const conflicts = blockedSelection(known);
    const selected = conflicts.length ? [] : candidates(known);
    const exact = selected.filter(item => item.missing.length === 0);
    const best = exact[0] || selected[0];
    const filters = Object.entries(allergens).filter(([key])=>Array.isArray(catalog.allergenIngredients[key]))
      .map(([key,name])=>`<label class="dt-manual-exclusion"><input type="checkbox" data-manual-exclusion="${key}" ${combinedGroups().has(key)?'checked':''} ${savedSafety.groups.has(key)?'disabled aria-label="'+safe(name)+' (required by saved kitchen)"':''}>${safe(name)}${savedSafety.groups.has(key)?' · saved':''}</label>`).join('');
    const help = unknown.slice(0,5).map(name=>{
      const list = suggestionsFor(name);
      return list.length ? `<li><span>${safe(name)}:</span> ${list.map(item=>`<button type="button" data-demo-suggest="${safe(item.id)}" data-demo-unknown="${safe(name)}">Use ${safe(label(item.id))}</button>`).join(' ')}</li>` : '';
    }).filter(Boolean).join('');
    host.hidden = false;
    host.innerHTML = `<div class="dt-manual-preview-heading"><p class="dt-demo-step">INSTANT RECIPE PREVIEW · NOTHING SAVED</p>
      <h3>${known.length} recognized ingredient ${known.length === 1 ? 'name' : 'names'}</h3>
      ${known.length ? `<p>${safe(names(known).join(' · '))}</p>` : ''}
      ${truncated ? `<p class="dt-demo-unrecognized" role="alert">Only the first ${MAX_FOODS} ingredient entries were reviewed. Shorten the list to check the rest.</p>` : ''}
      ${unknown.length ? `<p class="dt-demo-unrecognized" role="status">Not recognized: ${safe(unknown.join(', '))}. Separate foods with commas, "+", "and" or "και". We never silently guess.</p>` : ''}
      ${quantified.length ? `<p class="dt-demo-quantity-notice" role="status"><strong>Amounts in your text:</strong> ${safe(quantified.join(', '))}. We recognize food names only. <strong>These counts and weights are not transferred into saved pantry quantities or recipe portions.</strong> Check the amounts in your kitchen after saving.</p>` : ''}
      ${help ? `<div class="dt-manual-suggestions"><strong>Review possible matches (not automatic)</strong><ul>${help}</ul></div>` : ''}
      ${known.length && !unknown.length && !truncated && normalize(input.value) !== normalize(names(known).join(', ')) ? `<button type="button" class="dt-manual-canonical" data-demo-normalize>Use exact recipe-catalog names for saving</button>` : ''}</div>
      ${savedSafetyNotice()}<details class="dt-manual-safety" ${combinedGroups().size||focusExclusion?'open':''}><summary>Ingredient allergen restrictions ${combinedGroups().size?'('+combinedGroups().size+')':'(optional)'}</summary><div class="dt-manual-exclusions">${filters}</div><p>Saved device restrictions are enforced. Additional preview filters are temporary. Always check product labels and cross-contact.</p></details>
      ${savedSafety.problem ? `<div class="dt-manual-blocked" role="alert"><strong>Saved restrictions must be reviewed.</strong><p>${safe(savedSafety.problem)}</p></div>` :
        conflicts.length ? `<div class="dt-manual-blocked" role="alert"><strong>Selection conflicts with saved kitchen preferences or your preview filters.</strong><p>${safe(names(conflicts).join(', '))} is excluded by an allergen, individual food restriction or dietary style. No recipe suggested until you review it.</p></div>` :
        best ? `<div class="dt-manual-preview-recipe"><strong>${best.missing.length ? 'Closest catalog recipe · unselected foods needed' : 'All recipe food names entered · quantities unverified'}</strong>
      <h4>${safe(best.recipe.title)}</h4><p>${best.missing.length ? 'Not entered: ' + safe(names(best.missing).join(', ')) : 'Check required quantities before cooking.'}</p><details><summary>Read ingredients and complete method without saving</summary>${recipeView(best, 1, { handoff: false, alternatives: [] })}</details></div>` :
        `<p class="dt-demo-unrecognized">${known.length ? 'No compatible catalog recipe uses the recognized foods under these preview filters. Try another combination.' : 'Enter food names to find a real recipe.'}</p>`}
      <p class="dt-demo-boundary">A name-only preview cannot verify quantities, food condition, full allergens or cross-contact. ${unknown.length ? 'Review unrecognized names before saving.' : 'To save foods, use the existing form button; nothing here saves automatically.'}</p>`;
    installPhotoFallback(host);
    if (focusExclusion) host.querySelector(`[data-manual-exclusion="${focusExclusion}"]`)?.focus({preventScroll:true});
  }
  // The original pantry submit handler splits ONLY at commas. The preview supports
  // Greek/English conjunctions. Canonicalize on explicit Save, before the original
  // handler, so previewed foods really become the saved foods, not a phantom match.
  // Unknown names must be reviewed rather than silently discarded during a partial save.
  function saveFeedback(message) {
    const form = document.getElementById('pantry-form');
    if (!form) return;
    let note = document.getElementById('dt-save-feedback');
    if (!note || !form.contains(note)) {
      note = document.createElement('p');
      note.id = 'dt-save-feedback';
      note.className = 'dt-save-feedback';
      note.setAttribute('role', 'alert');
      const submit = form.querySelector('[type="submit"]');
      const inlineGroup = submit?.closest('.input-with-button');
      if (inlineGroup && form.contains(inlineGroup)) inlineGroup.after(note);
      else if (submit) submit.after(note);
      else form.append(note);
    }
    note.textContent = message;
    note.hidden = !message;
  }
  function guardPantrySave(event) {
    const input = document.getElementById('pantry-input');
    if (!catalog || !input || !input.value.trim()) return;
    refreshSavedSafety();
    if (input.value.length > MAX_TYPED_CHARS) {
      event.preventDefault(); event.stopImmediatePropagation();
      saveFeedback(`Nothing was saved. Shorten your entry to ${MAX_TYPED_CHARS} characters.`);
      input.focus({preventScroll:true}); return;
    }
    const parsed = parseNames(input.value);
    let warning = savedSafety.problem ? 'Nothing was saved. Saved kitchen restrictions could not be verified; review Settings first.' : '';
    if (!warning && parsed.truncated) warning = `Nothing was saved. Your list exceeds ${MAX_FOODS} entries; shorten it and review every food.`;
    else if (!warning && parsed.unknown.length) warning = `Nothing was saved. Review these unrecognized names first: ${parsed.unknown.slice(0, 5).join(', ')}${parsed.unknown.length > 5 ? '…' : ''}. Choose a suggested food when appropriate.`;
    else if (!warning && !parsed.known.length) warning = 'Nothing was saved. Enter at least one recognized food.';
    else if (!warning) {
      const forbidden = blockedSelection(parsed.known);
      if (forbidden.length) warning = `Nothing was saved. Your saved kitchen restrictions or temporary preview filters exclude: ${names(forbidden).join(', ')}. Review Settings or remove the conflicting food first.`;
    }
    if (warning) {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveFeedback(warning);
      input.focus({preventScroll:true});
      return;
    }
    const canonical = names(parsed.known).join(', ');
    // Existing persistence validates against the same catalog; leave that code intact.
    input.value = canonical;
    saveFeedback('');
    setTimeout(() => { if (input.isConnected) renderManualPreview(); }, 0);
  }
  function bindHome() {
    const root = document.getElementById('dt-premium-demo');
    if (!root || root.dataset.premiumBound) return;
    root.dataset.premiumBound = 'yes';
    root.removeAttribute('aria-live'); // Do not re-announce the entire control tree.
    root.addEventListener('click', event => {
      const t = event.target.closest('[data-demo-example],[data-demo-food],[data-demo-all],[data-demo-recipe],[data-demo-handoff],[data-demo-copy]');
      if (!t) return;
      lastFeedback = '';
      if (t.dataset.demoCopy) {
        const matching = candidates([...chosen]).find(item=>item.recipe.id===t.dataset.demoCopy);
        if (!matching || !matching.missing.length) return;
        const shopping = names(matching.missing).join('\n');
        const note = root.querySelector('.dt-demo-copy-status');
        if (note) note.textContent = 'List available to copy: ' + names(matching.missing).join(', ');
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(shopping).then(() => {
          if (note && note.isConnected) note.textContent = 'Copied unselected ingredient names to clipboard.';
        }).catch(() => { if (note && note.isConnected) note.textContent = 'Clipboard permission denied. Select the ingredient names above to copy them.'; });
        return;
      }
      if (t.dataset.demoExample && recipeById(t.dataset.demoExample)) {
        chosen.clear(); for (const id of uniqueIngredients(recipeById(t.dataset.demoExample))) chosen.add(id);
        activeRecipe = t.dataset.demoExample;
        renderHome({ focus: { type: 'example', id: t.dataset.demoExample } });
      } else if (t.dataset.demoFood && catalog.foodLabels[t.dataset.demoFood]) {
        const id = t.dataset.demoFood;
        if (chosen.has(id)) chosen.delete(id);
        else if (chosen.size >= 12) lastFeedback = 'You can preview up to 12 ingredient names. Deselect one first.';
        else chosen.add(id);
        activeRecipe = null;
        renderHome({ focus: { type: 'food', id } });
      } else if ('demoAll' in t.dataset) {
        showAll = !showAll;
        renderHome({ focus: { type: 'all' } });
      } else if (t.dataset.demoRecipe && recipeById(t.dataset.demoRecipe)) {
        activeRecipe = t.dataset.demoRecipe;
        renderHome({ focus: { type: 'recipe', id: t.dataset.demoRecipe } });
      } else if ('demoHandoff' in t.dataset) {
        if (chosen.size) try { sessionStorage.setItem(HANDOFF_KEY,
          JSON.stringify({ ids: [...chosen], exclude: [...exclusions],
            profile: activeKitchenId(), created: Date.now() })); } catch { /* optional */ }
      }
    });
    root.addEventListener('input', event => {
      if (event.target.id !== 'dt-demo-search') return;
      search = event.target.value.slice(0, MAX_SEARCH);
      updateSearchChips(); // Search changes only the chips, not the whole recipe/method DOM.
    });
    root.addEventListener('change', event => {
      const t = event.target;
      if (t.matches('[data-demo-exclusion]') && catalog.allergenIngredients[t.dataset.demoExclusion] && !savedSafety.groups.has(t.dataset.demoExclusion)) {
        t.checked ? exclusions.add(t.dataset.demoExclusion) : exclusions.delete(t.dataset.demoExclusion);
        activeRecipe = null; renderHome({ focus: { type: 'exclusion', id: t.dataset.demoExclusion }, keepSafetyOpen: true });
      }
      if (t.matches('[data-demo-portions]')) {
        const n = Number(t.value);
        if (Number.isInteger(n) && n >= 1 && n <= 6) portions = n;
        renderHome({ focus: { type: 'portions' } });
      }
    });
    if (catalog) renderHome();
  }
  function applyHandoff() {
    let handoff;
    try { const raw = sessionStorage.getItem(HANDOFF_KEY); sessionStorage.removeItem(HANDOFF_KEY);
      handoff = raw ? JSON.parse(raw) : null; } catch { return; }
    if (!handoff || !Array.isArray(handoff.ids) || !Number.isFinite(handoff.created) ||
      Date.now() < handoff.created || Date.now() - handoff.created > HANDOFF_MS) return;
    // Fail closed: handoff from another household profile or an older schema
    // must never silently inject ingredients into this active kitchen.
    if (!handoff.profile || handoff.profile !== activeKitchenId()) {
      const form = document.getElementById('pantry-form');
      if (form) {
        const note = document.createElement('p');
        note.id = 'dt-handoff-note'; note.className = 'dt-handoff-note';
        note.setAttribute('role','status');
        note.textContent = 'The active kitchen profile changed. For privacy, those example ingredients were not transferred. Please choose them again.';
        form.after(note);
      }
      return;
    }
    const ids = [...new Set(handoff.ids)].filter(id => validId(id) && catalog.foodLabels[id]).slice(0, 12);
    const input = document.getElementById('pantry-input');
    if (!ids.length || !input) return;
    // Never overwrite a draft typed while the recipe catalog was loading.
    // The transient home handoff is less important than existing user input.
    if (input.value.trim()) {
      const form = input.closest('form');
      let note = document.getElementById('dt-handoff-note');
      if (!note && form) {
        note = document.createElement('p');
        note.id='dt-handoff-note';note.className='dt-handoff-note';
        note.setAttribute('role','status');form.after(note);
      }
      if (note) note.textContent = 'Your already typed ingredients were preserved. The homepage example was not inserted. Nothing was saved or lost.';
      return;
    }
    // Only import transient allergen filters when the matching ingredient
    // handoff is actually accepted. Existing drafts must remain unchanged.
    exclusions.clear();
    if (Array.isArray(handoff.exclude)) for (const key of handoff.exclude) {
      if (allowedGroups.has(key) && Array.isArray(catalog.allergenIngredients[key])) exclusions.add(key);
    }
    candidateCache.key = '';
    const disclosure = document.querySelector('.dt-manual-disclosure');
    if (disclosure) disclosure.open = true;
    input.value = names(ids).join(', ');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    let note = document.getElementById('dt-handoff-note');
    if (!note) { note = document.createElement('p'); note.id = 'dt-handoff-note'; note.className = 'dt-handoff-note'; note.setAttribute('role','status');
      input.closest('form')?.after(note); }
    note.textContent = 'Your chosen ingredients' + (exclusions.size ? ' and ' + exclusions.size + ' preview exclusion(s)' : '') + ' were transferred for review, not saved. Your stored kitchen settings were not changed.';
  }
  function handlePantryEntry() {
    const target = new URL(location.href).searchParams.get('entry');
    if (!['manual', 'camera', 'upload'].includes(target)) return;
    if (target === 'manual') document.querySelector('.dt-manual-disclosure')?.setAttribute('open', '');
    else {
      const id = target === 'camera' ? 'dt-focus-camera' : 'dt-focus-upload';
      const input = document.getElementById(id);
      input?.closest('label')?.classList.add('dt-entry-highlight');
      input?.closest('label')?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    try { const url = new URL(location.href); url.searchParams.delete('entry');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash); } catch { /* optional */ }
  }
  function bindPantry() {
    const form = document.getElementById('pantry-form');
    const input = document.getElementById('pantry-input');
    if (!form || !input || !catalog) return;
    const button = form.querySelector('[type=submit]');
    if (button) button.textContent = 'Save foods to my kitchen';
    let host = document.getElementById('dt-manual-preview');
    if (!host) {
      host = document.createElement('section'); host.id = 'dt-manual-preview';
      host.className = 'dt-manual-preview'; host.setAttribute('aria-label', 'Recipes from typed ingredient names');
      host.hidden = true; form.after(host);
    }
    if (input !== boundPantryInput) {
      boundPantryInput = input;
      input.dataset.premiumBound = '1';
      input.addEventListener('input', () => { saveFeedback(''); renderManualPreview(); });
    }
    if (form !== boundPantryForm) {
      boundPantryForm = form;
      // Capture fires before the original bubble-phase legacy submit handler.
      form.addEventListener('submit', guardPantrySave, { capture: true });
    }
    if (host.dataset.premiumBound !== '1') {
      host.dataset.premiumBound = '1';
      host.addEventListener('click', event => {
        const input = document.getElementById('pantry-input');
        if (!input) return;
        const suggestion = event.target.closest('[data-demo-suggest]');
        if (suggestion && catalog.foodLabels[suggestion.dataset.demoSuggest]) {
          replaceTypedFood(input, suggestion.dataset.demoUnknown, label(suggestion.dataset.demoSuggest));
          return;
        }
        if (!event.target.closest('[data-demo-normalize]')) return;
        const resolved = parseNames(input.value);
        if (!resolved.known.length || resolved.unknown.length || resolved.truncated) return;
        input.value = names(resolved.known).join(', ');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus({ preventScroll: true });
      });
      host.addEventListener('change', event => {
        const t = event.target;
        if (!t.matches('[data-manual-exclusion]') || !allowedGroups.has(t.dataset.manualExclusion) || savedSafety.groups.has(t.dataset.manualExclusion)) return;
        t.checked ? exclusions.add(t.dataset.manualExclusion) : exclusions.delete(t.dataset.manualExclusion);
        candidateCache.key='';
        renderManualPreview({ focusExclusion: t.dataset.manualExclusion });
      });
    }
    applyHandoff();
    renderManualPreview();
  }
  function catalogError() {
    if (home) {
      const root = document.getElementById('dt-premium-demo');
      if (root) {
        root.innerHTML = '<p role="alert">Recipe preview could not load. Your stored kitchen has not changed.</p><button class="btn secondary" type="button" data-retry-catalog>Retry recipe preview</button> <a class="btn primary" href="/recipes/">Browse recipe collection</a>';
        root.querySelector('[data-retry-catalog]')?.addEventListener('click', loadData, {once:true});
      }
    }
    if (pantry) {
      const form = document.getElementById('pantry-form');
      if (form) {
        let note = document.getElementById('dt-catalog-error');
        if (!note) { note = document.createElement('div'); note.id='dt-catalog-error';note.className='dt-save-feedback'; form.after(note); }
        note.innerHTML = '<p role="alert">Live recipe preview is unavailable. Use comma-separated ingredient names in the original Pantry form, or retry below. Your kitchen is not reset.</p><button type="button" class="btn secondary" data-retry-catalog>Retry recipe preview</button>';
        note.querySelector('[data-retry-catalog]')?.addEventListener('click', loadData, {once:true});
      }
    }
  }
  async function loadData() {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 10000);
    try {
      const response = await fetch(`/assets/data.json?v=${build}`, { cache: 'default', signal: controller.signal });
      if (!response.ok) throw Error('Catalog unavailable');
      const data = await response.json();
      if (!Array.isArray(data.recipes) || data.recipes.length < 1 || !data.foodLabels ||
        !data.routeMap || !data.allergenIngredients) throw Error('Incomplete catalog');
      catalog = data;
      document.getElementById('dt-catalog-error')?.remove();
      createLookup();
      if (home) { bindHome(); renderHome(); }
      if (pantry) bindPantry();
    } catch { catalogError(); }
    finally { clearTimeout(timeout); }
  }
  function ready() {
    if (home) {
      const root = document.getElementById('dt-premium-demo');
      if (root) bindHome();
      const main = document.getElementById('main');
      if (main) new MutationObserver(() => {
        const demo = document.getElementById('dt-premium-demo');
        if (demo && !demo.dataset.premiumBound) bindHome();
      }).observe(main, { childList: true, subtree: true });
    }
    if (pantry) {
      handlePantryEntry();
      const main = document.getElementById('main');
      if (main) new MutationObserver(() => {
        const input = document.getElementById('pantry-input');
        if (catalog && input && (input !== boundPantryInput || !document.getElementById('dt-manual-preview'))) bindPantry();
      }).observe(main, { childList:true, subtree:true });
    }
    window.addEventListener('storage', event => {
      if (event.key === 'dtable:profiles:v1' || event.key === null ||
          (event.key && event.key.startsWith('dtable:workspace:v2'))) {
        candidateCache.key='';
        if (home && catalog) renderHome();
        if (pantry && catalog) renderManualPreview();
      }
    });
    loadData();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
