/**
 * v15.17: conservative photo -> catalog resolver.
 * Identical ingredient names may be resolved across languages; ambiguous foods
 * are NEVER guessed. The scanner still owns consent and user confirmation.
 */
export const photoAliases = Object.freeze({
  egg:['eggs','αυγο','αυγα','αυγό','αυγά'],
  tomato:['tomatoes','ντομάτα','ντοματα','ντομάτες','ντοματες','τομάτα'],
  rice:['ρύζι','ρυζι'], yogurt:['yoghurt','γιαούρτι','γιαουρτι'],
  carrot:['carrots','καρότο','καροτο','καρότα','καροτα'],
  oats:['rolled oats','βρώμη','βρωμη','νιφάδες βρώμης','νιφαδες βρωμης'],
  chicken:['chicken breast','chicken breasts','chicken thighs','κοτόπουλο','κοτοπουλο'],
  banana:['bananas','μπανάνα','μπανανα','μπανάνες','μπανανες'],
  bread:['whole grain bread','whole-grain bread','ψωμί ολικής','ψωμι ολικης'],
  tahini:['ταχίνι','ταχινι'], spinach:['σπανάκι','σπανακι'],
  feta:['φέτα','φετα'], avocado:['αβοκάντο','αβοκαντο'],
  oliveOil:['olive oil','ελαιόλαδο','ελαιολαδο'],
  cucumber:['αγγούρι','αγγουρι','αγγούρια','αγγουρια'],
  onion:['onions','κρεμμύδι','κρεμμυδι','κρεμμύδια','κρεμμυδια'],
  lemon:['λεμόνι','λεμονι','λεμόνια','λεμονια'],
  potato:['potatoes','πατάτα','πατατα','πατάτες','πατατες'],
  garlic:['σκόρδο','σκορδο'], fish:['ψάρι','ψαρι'],
  salmon:['σολομός','σολομος'], walnuts:['καρύδια','καρυδια'],
  olives:['ελιές','ελιες'], milk:['γάλα','γαλα'],
  lettuce:['μαρούλι','μαρουλι'], pepper:['bell peppers','sweet pepper','πιπεριά','πιπερια','πιπεριές','πιπεριες'],
  greens:['χόρτα','χορτα','φυλλώδη λαχανικά','φυλλωδη λαχανικα'],
  scallion:['scallions','spring onion','spring onions','green onion','green onions','φρέσκο κρεμμυδάκι','φρεσκο κρεμμυδακι'],
  radish:['radishes','red radish','red radishes','ραπανάκι','ραπανακι','ραπανάκια','ραπανακια'],
  chiliPepper:['chili','chilli','chilli pepper','hot pepper','hot peppers','καυτερή πιπεριά','καυτερη πιπερια'],
  jujube:['jujubes','chinese date','chinese dates','τζίτζιφο','τζιτζιφο'],
  sweetPotato:['sweet potatoes','γλυκοπατάτα','γλυκοπατατα'],
  peas:['green peas','garden peas','αρακάς','αρακας'],
  mushroom:['mushrooms','μανιτάρια','μανιταρια','μανιτάρι','μανιταρι'],
  zucchini:['courgette','courgettes','κολοκυθάκι','κολοκυθακι','κολοκυθάκια','κολοκυθακια'],
  eggplant:['aubergine','aubergines','μελιτζάνα','μελιτζανα','μελιτζάνες','μελιτζανες'],
  cauliflower:['κουνουπίδι','κουνουπιδι'], broccoli:['μπρόκολο','μπροκολο'],
  greenBeans:['φασολάκια','φασολακια'], corn:['sweet corn','καλαμπόκι','καλαμποκι'],
  apple:['apples','μήλο','μηλο','μήλα','μηλα'], orange:['πορτοκάλι','πορτοκαλι'],
  strawberries:['strawberry','φράουλες','φραουλες','φράουλα','φραουλα'],
  shrimp:['shrimps','prawns','prawn','γαρίδες','γαριδες'],
  tunaCanned:['canned tuna','tinned tuna','τόνος κονσέρβα','τονος κονσερβα'],
  mozzarella:['μοτσαρέλα','μοτσαρελα'], quinoa:['κινόα','κινοα'],
  couscous:['κους κους'], tofu:['firm tofu','τόφου','τοφου'],
  almonds:['αμύγδαλα','αμυγδαλα'], peanutButter:['peanut butter','φυστικοβούτυρο','φυστικοβουτυρο'],
  chickpeasCooked:['cooked chickpeas','boiled chickpeas','canned chickpeas','cooked garbanzo beans','βρασμένα ρεβίθια','βρασμενα ρεβιθια','μαγειρεμένα ρεβίθια','μαγειρεμενα ρεβιθια'],
  chickpeas:['dried chickpeas','dry chickpeas','ξερά ρεβίθια','ξερα ρεβιθια','ξηρά ρεβίθια','ξηρα ρεβιθια'],
  lentilsCooked:['cooked lentils','boiled lentils','βρασμένες φακές','βρασμενες φακες'],
  lentils:['dried lentils','dry lentils','ξηρές φακές','ξηρες φακες'],
  whiteBeansCooked:['cooked white beans','boiled white beans','βρασμένα λευκά φασόλια','βρασμενα λευκα φασολια'],
  whiteBeans:['dried white beans','dry white beans','ξερά λευκά φασόλια','ξερα λευκα φασολια'],
  blackBeansCooked:['cooked black beans','boiled black beans','βρασμένα μαύρα φασόλια','βρασμενα μαυρα φασολια'],
  tomatoCanned:['canned tomatoes','tinned tomatoes','ντομάτα κονσέρβα','ντοματα κονσερβα'],
  giantBeans:['dried giant beans','ξεροί γίγαντες','ξεροι γιγαντες'],
  fruit:['seasonal fruit','εποχιακό φρούτο','εποχιακα φρουτα','φρούτο εποχής'],
  celery:['σέλινο','σελινο'],
  herbs:['φρέσκα μυρωδικά','φρεσκα μυρωδικα','fresh mixed herbs'],
  beef:['minced beef','ground beef','μοσχαρίσιος κιμάς','μοσχαρισιος κιμας'],
  honey:['μέλι','μελι'],
  paximadi:['κριθαρένιο παξιμάδι','κριθαρενιο παξιμαδι'],
  pasta:['whole wheat pasta','whole-wheat pasta','ζυμαρικά ολικής','ζυμαρικα ολικης'],
  hardcheese:['σκληρό τυρί','σκληρο τυρι'],
  pita:['whole grain pita','whole-grain pita','πίτα ολικής','πιτα ολικης'],
  trahana:['τραχανάς','τραχανας'],
  blueberries:['μύρτιλα','μυρτιλα'],
  artichoke:['αγκινάρα','αγκιναρα','αγκινάρες','αγκιναρες'],
  kale:['λαχανίδα','λαχανιδα'],
  tortilla:['whole wheat tortilla','whole-wheat tortilla','τορτίγια ολικής','τορτιγια ολικης']
});

/** Keeps Greek letters and digits; only strips combining diacritics and punctuation. */
export function normalizePhotoName(value) {
  return String(value ?? '').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N} ]/gu,' ')
    .replace(/\s+/g,' ').trim();
}

const DRY = new Set(["lentils","giantBeans","chickpeas","whiteBeans"]);
const COOKED = new Set(["chickpeasCooked","lentilsCooked","whiteBeansCooked","blackBeansCooked","kidneyBeans","pintoBeans","navyBeans","favaBeans","mungBeans","blackEyedPeas"]);
const PREPARED = new Set([...COOKED,'tomatoCanned','tunaCanned']);
function compatibleForm(key, form) {
  const f = String(form ?? 'unknown').toLowerCase();
  if (f === 'dried' && PREPARED.has(key)) return false;
  if ((f === 'cooked' || f === 'canned') && DRY.has(key)) return false;
  if (f === 'raw' && PREPARED.has(key)) return false;
  return true;
}

export function createPhotoIngredientResolver(labels, extraAliases = {}) {
  if (!labels || typeof labels !== 'object') throw Error('Food catalog unavailable');
  const valid = key => typeof key === 'string' && Object.prototype.hasOwnProperty.call(labels,key) ? key : null;
  const lookup = new Map();
  for (const [id, label] of Object.entries(labels)) {
    const variants = [id,label,...(photoAliases[id] || []),...(Array.isArray(extraAliases?.[id]) ? extraAliases[id] : [])];
    for (const value of variants) {
      const word = normalizePhotoName(value);
      if (!word) continue;
      if (!lookup.has(word)) lookup.set(word,id);
      else if (lookup.get(word) !== id) lookup.set(word,null); // fail closed on ambiguity
    }
  }
  return row => {
    if (!row || typeof row !== 'object') return null;
    const explicit = valid(row.key) || valid(row.catalog);
    const named = valid(lookup.get(normalizePhotoName(row.name)));
    // Two contradicting AI identity signals must trigger human review rather
    // than silently resolving to the model-provided key.
    if (explicit && named && explicit !== named) return null;
    const guess = explicit || named;
    return valid(guess) && compatibleForm(guess,row.form) ? guess : null;
  };
}
