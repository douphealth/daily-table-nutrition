// v16 ingredient knowledge base — the single source of truth for the recipe catalog, the photo-identification aliases and the food icons.
// Every entry: key, label, group, unit, suggested portion (per person), aliases (what a photo model or a person may call it), icon family.
// Groups are the cooking semantics the recipe engine already understands, so new foods inherit verified, tested cooking rules instead of new ones:
//   veg (steam / water-saute / roast / raw toss) · hard-veg (must be cooked) · fruit · protein (raw, must be cooked) · egg · grain (dry, must be cooked)
//   lentil (only the 'lentils' key) · bread · dairy · fat · finish (ready to eat) · ready-legume (cooked/canned) · dry-legume / complex (rejected by the quick builder)
// Aliases are deliberately generous: they exist to turn what a vision model or a person writes into ONE canonical identity. They are never used to invent food.

const F = (key, label, group, unit, suggested, icon, aliases, extra = {}) => ({key, label, group, unit, suggested, icon, aliases, ...extra});

export const FOODS = [
  // ── existing 74 (labels, groups, units and portions unchanged: every shipped recipe keeps working) ─────────────────────────────
  F('yogurt', 'Greek yogurt', 'dairy', 'g', 170, 'yogurt', ['greek yogurt', 'plain greek yogurt', 'yoghurt', 'greek yoghurt', 'plain yogurt', 'natural yogurt', 'strained yogurt', 'labneh'], {allergens: ['milk'], packaged: true}),
  F('oats', 'Rolled oats', 'grain', 'g', 50, 'oats', ['rolled oats', 'oats', 'oatmeal', 'porridge oats', 'oat flakes', 'jumbo oats'], {packaged: true}),
  F('banana', 'Banana', 'fruit', 'piece', 1, 'banana', ['banana', 'bananas', 'ripe banana', 'plantain banana']),
  F('walnuts', 'Walnuts', 'finish', 'g', 15, 'walnuts', ['walnut', 'walnuts', 'walnut halves', 'shelled walnuts'], {allergens: ['nuts']}),
  F('egg', 'Eggs', 'egg', 'piece', 2, 'egg', ['egg', 'eggs', 'chicken egg', 'chicken eggs', 'whole egg', 'whole eggs', 'beaten eggs', 'free range eggs'], {allergens: ['eggs']}),
  F('bread', 'Whole-grain bread', 'bread', 'g', 60, 'bread', ['whole-grain bread', 'whole grain bread', 'whole-wheat bread', 'whole wheat bread', 'wholemeal bread', 'brown bread', 'sliced bread', 'toast bread'], {allergens: ['gluten'], packaged: true}),
  F('tomato', 'Tomato', 'veg', 'g', 100, 'tomato', ['tomato', 'tomatoes', 'cherry tomato', 'cherry tomatoes', 'grape tomatoes', 'baby tomatoes', 'plum tomato', 'plum tomatoes', 'beefsteak tomato', 'vine tomato', 'vine tomatoes']),
  F('olives', 'Olives', 'finish', 'g', 15, 'olives', ['olive', 'olives', 'kalamata olives', 'green olives', 'black olives', 'pitted olives'], {packaged: true}),
  F('oliveOil', 'Olive oil', 'fat', 'ml', 10, 'oliveOil', ['olive oil', 'extra virgin olive oil', 'evoo', 'virgin olive oil'], {packaged: true}),
  F('fruit', 'Seasonal fruit', 'fruit', 'g', 150, 'fruit', ['seasonal fruit', 'mixed fruit', 'fruit salad', 'fresh fruit']),
  F('milk', 'Milk', 'dairy', 'ml', 200, 'milk', ['milk', 'whole milk', 'semi-skimmed milk', 'skimmed milk', 'cows milk', 'fresh milk'], {allergens: ['milk'], packaged: true}),
  F('spinach', 'Spinach', 'veg', 'g', 80, 'spinach', ['spinach', 'baby spinach', 'spinach leaves', 'fresh spinach']),
  F('feta', 'Feta', 'dairy', 'g', 32.5, 'feta', ['feta', 'feta cheese', 'greek feta'], {allergens: ['milk'], packaged: true}),
  F('cucumber', 'Cucumber', 'veg', 'g', 80, 'cucumber', ['cucumber', 'cucumbers', 'cucumber slices', 'english cucumber', 'persian cucumber']),
  F('lentils', 'Dried lentils', 'lentil', 'g', 95, 'lentils', ['dried lentils', 'dry lentils', 'uncooked lentils', 'red lentils', 'green lentils', 'brown lentils', 'puy lentils']),
  F('carrot', 'Carrot', 'veg', 'g', 60, 'carrot', ['carrot', 'carrots', 'baby carrots', 'grated carrot']),
  F('onion', 'Onion', 'veg', 'g', 30, 'onion', ['onion', 'onions', 'red onion', 'red onions', 'purple onion', 'yellow onion', 'white onion', 'brown onion', 'spanish onion']),
  F('chicken', 'Chicken', 'protein', 'g', 170, 'chicken', ['chicken', 'raw chicken', 'chicken breast', 'chicken breasts', 'chicken thigh', 'chicken thighs', 'chicken fillet', 'chicken fillets', 'chicken drumstick', 'chicken pieces']),
  F('potato', 'Potato', 'hard-veg', 'g', 200, 'potato', ['potato', 'potatoes', 'baby potatoes', 'new potatoes', 'russet potato', 'boiling potatoes']),
  F('lemon', 'Lemon', 'finish', 'piece', 0.25, 'lemon', ['lemon', 'lemons', 'lemon wedge', 'lemon juice', 'fresh lemon']),
  F('lettuce', 'Lettuce', 'veg', 'g', 80, 'lettuce', ['lettuce', 'romaine lettuce', 'romaine', 'cos lettuce', 'iceberg', 'iceberg lettuce', 'butterhead lettuce', 'salad leaves']),
  F('rice', 'Rice', 'grain', 'g', 75, 'rice', ['rice', 'dry rice', 'uncooked rice', 'white rice', 'long grain rice', 'basmati rice', 'jasmine rice', 'brown rice']),
  F('pepper', 'Bell pepper', 'veg', 'g', 60, 'pepper', ['bell pepper', 'bell peppers', 'red bell pepper', 'green bell pepper', 'yellow bell pepper', 'orange bell pepper', 'sweet pepper', 'capsicum']),
  F('fish', 'Fish', 'protein', 'g', 180, 'fish', ['fish', 'raw fish', 'white fish', 'fish fillet', 'fish fillets', 'cod', 'haddock', 'pollock', 'sea bass', 'tilapia']),
  F('greens', 'Leafy greens', 'veg', 'g', 175, 'greens', ['leafy greens', 'greens', 'mixed greens', 'salad greens', 'spring greens', 'collard greens', 'mustard greens']),
  F('giantBeans', 'Dried giant beans', 'dry-legume', 'g', 95, 'giantBeans', ['dried giant beans', 'giant beans', 'gigantes']),
  F('chickpeas', 'Dried chickpeas', 'dry-legume', 'g', 95, 'chickpeas', ['dried chickpeas', 'dry chickpeas', 'uncooked chickpeas', 'dried garbanzo beans']),
  F('whiteBeans', 'Dried white beans', 'dry-legume', 'g', 95, 'whiteBeans', ['dried white beans', 'dry white beans', 'dried cannellini beans']),
  F('celery', 'Celery', 'veg', 'g', 50, 'celery', ['celery', 'celery stalk', 'celery stalks', 'celery stick', 'celery sticks']),
  F('tomatoCanned', 'Canned tomatoes', 'finish', 'g', 150, 'tomatoCanned', ['canned tomatoes', 'tinned tomatoes', 'chopped tomatoes', 'tomato passata', 'passata', 'crushed tomatoes'], {packaged: true}),
  F('herbs', 'Fresh herbs', 'veg', 'g', 10, 'herbs', ['fresh herbs', 'herbs', 'mixed herbs', 'herb bunch', 'chopped herbs']),
  F('beef', 'Minced beef', 'protein', 'g', 160, 'beef', ['minced beef', 'ground beef', 'beef mince', 'mince', 'minced meat']),
  F('tahini', 'Tahini', 'fat', 'g', 15, 'tahini', ['tahini', 'sesame paste', 'tahini paste'], {allergens: ['sesame'], packaged: true}),
  F('honey', 'Honey', 'finish', 'g', 10, 'honey', ['honey', 'runny honey', 'clear honey'], {packaged: true}),
  F('mushroom', 'Mushrooms', 'veg', 'g', 100, 'mushroom', ['mushroom', 'mushrooms', 'button mushrooms', 'cremini mushrooms', 'chestnut mushrooms', 'white mushrooms', 'sliced mushrooms']),
  F('paximadi', 'Barley rusk', 'bread', 'piece', 1, 'paximadi', ['barley rusk', 'rusk', 'rusks', 'paximadi', 'paximadia'], {allergens: ['gluten'], packaged: true}),
  F('pasta', 'Whole-wheat pasta', 'grain', 'g', 95, 'pasta', ['whole-wheat pasta', 'whole wheat pasta', 'wholemeal pasta', 'pasta', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'rigatoni', 'linguine'], {allergens: ['gluten'], packaged: true}),
  F('zucchini', 'Zucchini', 'veg', 'g', 135, 'zucchini', ['zucchini', 'zucchinis', 'courgette', 'courgettes', 'baby marrow']),
  F('hardcheese', 'Hard cheese', 'dairy', 'g', 17.5, 'hardcheese', ['hard cheese', 'parmesan', 'parmigiano', 'pecorino', 'grana padano', 'grated cheese', 'cheddar', 'gouda', 'gruyere'], {allergens: ['milk'], packaged: true}),
  F('pita', 'Whole-grain pita', 'bread', 'piece', 1, 'pita', ['whole-grain pita', 'whole grain pita', 'pita', 'pitta', 'pita bread', 'pitta bread', 'flatbread'], {allergens: ['gluten'], packaged: true}),
  F('trahana', 'Trahana', 'complex', 'g', 80, 'trahana', ['trahana', 'tarhana'], {allergens: ['gluten', 'milk'], packaged: true}),
  F('avocado', 'Avocado', 'fruit', 'g', 80, 'avocado', ['avocado', 'avocados', 'avocado half', 'ripe avocado', 'sliced avocado']),
  F('blueberries', 'Blueberries', 'fruit', 'g', 100, 'blueberries', ['blueberry', 'blueberries', 'fresh blueberries']),
  F('broccoli', 'Broccoli', 'veg', 'g', 180, 'broccoli', ['broccoli', 'broccoli florets', 'broccoli head', 'tenderstem broccoli', 'broccolini']),
  F('artichoke', 'Artichoke', 'hard-veg', 'piece', 1, 'artichoke', ['artichoke', 'artichokes', 'globe artichoke', 'artichoke hearts']),
  F('garlic', 'Garlic', 'veg', 'g', 5, 'garlic', ['garlic', 'garlic clove', 'garlic cloves', 'clove of garlic', 'minced garlic', 'crushed garlic', 'garlic bulb']),
  F('chickpeasCooked', 'Cooked chickpeas (drained)', 'ready-legume', 'g', 150, 'chickpeasCooked', ['cooked chickpeas', 'canned chickpeas', 'tinned chickpeas', 'cooked garbanzo beans', 'chickpeas drained', 'garbanzo beans'], {packaged: true}),
  F('lentilsCooked', 'Cooked lentils (drained)', 'ready-legume', 'g', 150, 'lentilsCooked', ['cooked lentils', 'canned lentils', 'tinned lentils', 'ready lentils'], {packaged: true}),
  F('whiteBeansCooked', 'Cooked white beans (drained)', 'ready-legume', 'g', 150, 'whiteBeansCooked', ['cooked white beans', 'canned white beans', 'tinned white beans', 'canned cannellini beans', 'cooked cannellini beans', 'butter beans'], {packaged: true}),
  F('sweetPotato', 'Sweet potato', 'hard-veg', 'g', 200, 'sweetPotato', ['sweet potato', 'sweet potatoes', 'kumara', 'yam']),
  F('cauliflower', 'Cauliflower', 'veg', 'g', 200, 'cauliflower', ['cauliflower', 'cauliflower florets', 'cauliflower rice']),
  F('eggplant', 'Eggplant', 'hard-veg', 'g', 225, 'eggplant', ['eggplant', 'eggplants', 'aubergine', 'aubergines', 'brinjal']),
  F('kale', 'Kale', 'veg', 'g', 55, 'kale', ['kale', 'curly kale', 'lacinato kale', 'cavolo nero', 'tuscan kale']),
  F('greenBeans', 'Green beans', 'hard-veg', 'g', 125, 'greenBeans', ['green beans', 'green bean', 'string beans', 'french beans', 'runner beans']),
  F('peas', 'Peas', 'veg', 'g', 100, 'peas', ['peas', 'green peas', 'garden peas', 'frozen peas', 'sweet peas']),
  F('corn', 'Sweetcorn', 'veg', 'g', 90, 'corn', ['sweetcorn', 'sweet corn', 'corn', 'corn on the cob', 'corn kernels', 'maize']),
  F('apple', 'Apple', 'fruit', 'g', 100, 'apple', ['apple', 'apples', 'red apple', 'green apple', 'gala apple', 'granny smith']),
  F('orange', 'Orange', 'fruit', 'piece', 1, 'orange', ['orange', 'oranges', 'navel orange', 'blood orange']),
  F('strawberries', 'Strawberries', 'fruit', 'g', 110, 'strawberries', ['strawberry', 'strawberries', 'fresh strawberries']),
  F('salmon', 'Salmon', 'protein', 'g', 150, 'salmon', ['salmon', 'raw salmon', 'salmon fillet', 'salmon fillets', 'salmon steak']),
  F('shrimp', 'Shrimp', 'protein', 'g', 150, 'shrimp', ['shrimp', 'shrimps', 'prawn', 'prawns', 'raw shrimp', 'raw prawns', 'king prawns'], {allergens: ['crustaceans']}),
  F('tunaCanned', 'Canned tuna', 'finish', 'g', 90, 'tunaCanned', ['canned tuna', 'tinned tuna', 'tuna', 'tuna in oil', 'tuna in water', 'tuna chunks'], {allergens: ['fish'], packaged: true}),
  F('mozzarella', 'Mozzarella', 'dairy', 'g', 55, 'mozzarella', ['mozzarella', 'mozzarella cheese', 'fresh mozzarella', 'buffalo mozzarella', 'mini mozzarella'], {allergens: ['milk'], packaged: true}),
  F('quinoa', 'Quinoa', 'grain', 'g', 70, 'quinoa', ['quinoa', 'dry quinoa', 'uncooked quinoa', 'quinoa grains'], {packaged: true}),
  F('couscous', 'Couscous', 'grain', 'g', 70, 'couscous', ['couscous', 'dry couscous', 'instant couscous'], {allergens: ['gluten'], packaged: true}),
  F('tortilla', 'Whole-wheat tortillas', 'bread', 'piece', 1, 'tortilla', ['whole-wheat tortilla', 'whole wheat tortilla', 'whole-wheat tortillas', 'whole wheat tortillas', 'tortilla', 'tortillas', 'wrap', 'wraps'], {allergens: ['gluten'], packaged: true}),
  F('tofu', 'Firm tofu', 'finish', 'g', 150, 'tofu', ['tofu', 'firm tofu', 'bean curd', 'pressed tofu'], {allergens: ['soy'], packaged: true}),
  F('blackBeansCooked', 'Cooked black beans (drained)', 'ready-legume', 'g', 150, 'blackBeansCooked', ['cooked black beans', 'canned black beans', 'tinned black beans', 'black beans'], {packaged: true}),
  F('almonds', 'Almonds', 'finish', 'g', 10, 'almonds', ['almond', 'almonds', 'flaked almonds', 'whole almonds', 'blanched almonds'], {allergens: ['nuts']}),
  F('peanutButter', 'Peanut butter', 'fat', 'g', 15, 'peanutButter', ['peanut butter', 'peanutbutter', 'crunchy peanut butter', 'smooth peanut butter'], {allergens: ['peanuts'], packaged: true}),
  F('scallion', 'Scallion (spring onion)', 'veg', 'g', 25, 'scallion', ['scallion', 'scallions', 'spring onion', 'spring onions', 'green onion', 'green onions', 'salad onion', 'salad onions', 'bunch of scallions']),
  F('radish', 'Radish', 'veg', 'g', 70, 'radish', ['radish', 'radishes', 'red radish', 'daikon', 'daikon radish', 'white radish', 'breakfast radish']),
  F('chiliPepper', 'Chili pepper', 'finish', 'g', 5, 'chiliPepper', ['chili pepper', 'chilli pepper', 'chili', 'chilli', 'chilies', 'chillies', 'red chili', 'green chili', 'fresh chili', 'chili peppers', 'birds eye chili', 'cayenne pepper']),
  F('jujube', 'Fresh jujube', 'fruit', 'g', 50, 'jujube', ['jujube', 'jujubes', 'red date', 'red dates', 'chinese date', 'chinese dates', 'fresh jujube']),

  // ── herbs, aromatics and salad vegetables ─────────────────────────────────────────────────────────────────────────────────────
  F('parsley', 'Parsley', 'veg', 'g', 10, 'herbs', ['parsley', 'flat-leaf parsley', 'flat leaf parsley', 'curly parsley', 'fresh parsley', 'chopped parsley']),
  F('cilantro', 'Cilantro (coriander leaves)', 'veg', 'g', 10, 'herbs', ['cilantro', 'coriander', 'fresh coriander', 'coriander leaves', 'coriander leaf', 'chinese parsley', 'dhania']),
  F('dill', 'Dill', 'veg', 'g', 8, 'herbs', ['dill', 'fresh dill', 'dill fronds', 'dill weed']),
  F('mint', 'Mint', 'veg', 'g', 8, 'herbs', ['mint', 'fresh mint', 'mint leaves', 'peppermint']),
  F('basil', 'Basil', 'veg', 'g', 8, 'herbs', ['basil', 'fresh basil', 'basil leaves', 'thai basil', 'sweet basil']),
  F('thyme', 'Thyme', 'veg', 'g', 5, 'herbs', ['thyme', 'fresh thyme', 'thyme sprigs', 'lemon thyme']),
  F('rosemary', 'Rosemary', 'veg', 'g', 5, 'herbs', ['rosemary', 'fresh rosemary', 'rosemary sprigs']),
  F('oregano', 'Oregano', 'veg', 'g', 4, 'herbs', ['oregano', 'fresh oregano', 'dried oregano']),
  F('sage', 'Sage', 'veg', 'g', 4, 'herbs', ['sage', 'fresh sage', 'sage leaves']),
  F('bayLeaf', 'Bay leaf', 'finish', 'g', 1, 'herbs', ['bay leaf', 'bay leaves', 'laurel leaf', 'laurel leaves']),
  F('chives', 'Chives', 'veg', 'g', 5, 'herbs', ['chives', 'fresh chives', 'chopped chives']),
  F('ginger', 'Ginger', 'veg', 'g', 10, 'ginger', ['ginger', 'fresh ginger', 'ginger root', 'ginger piece', 'grated ginger', 'ginger knob']),
  F('leek', 'Leek', 'veg', 'g', 80, 'leek', ['leek', 'leeks', 'sliced leek']),
  F('shallot', 'Shallot', 'veg', 'g', 30, 'shallot', ['shallot', 'shallots', 'banana shallot']),
  F('cabbage', 'Cabbage', 'veg', 'g', 120, 'cabbage', ['cabbage', 'white cabbage', 'green cabbage', 'savoy cabbage', 'shredded cabbage']),
  F('redCabbage', 'Red cabbage', 'veg', 'g', 120, 'cabbage', ['red cabbage', 'purple cabbage']),
  F('napaCabbage', 'Napa cabbage', 'veg', 'g', 120, 'cabbage', ['napa cabbage', 'chinese cabbage', 'wombok']),
  F('bokChoy', 'Bok choy', 'veg', 'g', 120, 'cabbage', ['bok choy', 'pak choi', 'pak choy', 'bok choi', 'chinese chard']),
  F('arugula', 'Arugula (rocket)', 'veg', 'g', 60, 'greens', ['arugula', 'rocket', 'rucola', 'wild rocket', 'arugula leaves']),
  F('watercress', 'Watercress', 'veg', 'g', 50, 'greens', ['watercress', 'watercress leaves']),
  F('chard', 'Chard', 'veg', 'g', 120, 'greens', ['chard', 'swiss chard', 'silverbeet', 'rainbow chard']),
  F('asparagus', 'Asparagus', 'veg', 'g', 120, 'asparagus', ['asparagus', 'asparagus spears', 'green asparagus']),
  F('fennel', 'Fennel', 'veg', 'g', 120, 'fennel', ['fennel', 'fennel bulb', 'finocchio', 'anise']),
  F('beetroot', 'Beetroot', 'hard-veg', 'g', 120, 'beetroot', ['beetroot', 'beet', 'beets', 'red beet']),
  F('turnip', 'Turnip', 'hard-veg', 'g', 150, 'turnip', ['turnip', 'turnips', 'swede', 'rutabaga']),
  F('parsnip', 'Parsnip', 'hard-veg', 'g', 150, 'parsnip', ['parsnip', 'parsnips']),
  F('celeriac', 'Celeriac', 'hard-veg', 'g', 150, 'celeriac', ['celeriac', 'celery root', 'turnip rooted celery'], {allergens: ['celery']}),
  F('pumpkin', 'Pumpkin', 'hard-veg', 'g', 200, 'pumpkin', ['pumpkin', 'pumpkin cubes', 'squash', 'butternut squash', 'butternut', 'winter squash']),
  F('brusselsSprouts', 'Brussels sprouts', 'hard-veg', 'g', 150, 'brusselsSprouts', ['brussels sprouts', 'brussel sprouts', 'sprouts']),
  F('okra', 'Okra', 'veg', 'g', 100, 'okra', ['okra', 'ladies fingers', 'bhindi']),
  F('snowPeas', 'Snow peas', 'veg', 'g', 80, 'peas', ['snow peas', 'mangetout', 'sugar snap peas', 'snap peas']),
  F('edamame', 'Edamame', 'ready-legume', 'g', 100, 'edamame', ['edamame', 'edamame beans', 'soy beans cooked'], {allergens: ['soy']}),
  F('beanSprouts', 'Bean sprouts', 'veg', 'g', 80, 'beanSprouts', ['bean sprouts', 'sprouts', 'mung bean sprouts', 'alfalfa sprouts']),
  F('shiitake', 'Shiitake mushrooms', 'veg', 'g', 80, 'mushroom', ['shiitake', 'shiitake mushrooms', 'dried shiitake']),
  F('oysterMushroom', 'Oyster mushrooms', 'veg', 'g', 80, 'mushroom', ['oyster mushrooms', 'oyster mushroom']),
  F('portobello', 'Portobello mushrooms', 'veg', 'g', 100, 'mushroom', ['portobello', 'portobello mushrooms', 'portobello mushroom', 'large flat mushrooms']),
  F('pumpkinSeeds', 'Pumpkin seeds', 'finish', 'g', 10, 'pumpkinSeeds', ['pumpkin seeds', 'pepitas', 'pumpkin seed']),
  F('sunflowerSeeds', 'Sunflower seeds', 'finish', 'g', 10, 'sunflowerSeeds', ['sunflower seeds', 'sunflower seed']),
  F('sesameSeeds', 'Sesame seeds', 'finish', 'g', 5, 'sesameSeeds', ['sesame seeds', 'sesame seed', 'toasted sesame'], {allergens: ['sesame']}),
  F('chiaSeeds', 'Chia seeds', 'finish', 'g', 10, 'chiaSeeds', ['chia seeds', 'chia seed', 'chia']),
  F('flaxSeeds', 'Flax seeds', 'finish', 'g', 10, 'flaxSeeds', ['flax seeds', 'flaxseed', 'linseed', 'linseeds', 'ground flax']),
  F('hempSeeds', 'Hemp seeds', 'finish', 'g', 10, 'hempSeeds', ['hemp seeds', 'hemp hearts', 'hemp seed']),
  F('poppySeeds', 'Poppy seeds', 'finish', 'g', 4, 'poppySeeds', ['poppy seeds', 'poppy seed']),

  // ── fruit ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  F('pear', 'Pear', 'fruit', 'g', 120, 'pear', ['pear', 'pears', 'ripe pear']),
  F('peach', 'Peach', 'fruit', 'g', 120, 'peach', ['peach', 'peaches', 'ripe peach']),
  F('nectarine', 'Nectarine', 'fruit', 'g', 120, 'peach', ['nectarine', 'nectarines']),
  F('plum', 'Plum', 'fruit', 'g', 100, 'plum', ['plum', 'plums', 'red plum']),
  F('apricot', 'Apricot', 'fruit', 'g', 100, 'apricot', ['apricot', 'apricots', 'fresh apricots']),
  F('cherries', 'Cherries', 'fruit', 'g', 100, 'cherries', ['cherry', 'cherries', 'sweet cherries']),
  F('grapes', 'Grapes', 'fruit', 'g', 100, 'grapes', ['grape', 'grapes', 'red grapes', 'green grapes', 'black grapes']),
  F('watermelon', 'Watermelon', 'fruit', 'g', 150, 'watermelon', ['watermelon', 'watermelon slices', 'melon wedge']),
  F('melon', 'Melon', 'fruit', 'g', 150, 'melon', ['melon', 'cantaloupe', 'honeydew', 'rockmelon', 'muskmelon']),
  F('pineapple', 'Pineapple', 'fruit', 'g', 120, 'pineapple', ['pineapple', 'pineapple chunks', 'pineapple slices']),
  F('mango', 'Mango', 'fruit', 'g', 120, 'mango', ['mango', 'mangoes', 'ripe mango', 'mango chunks']),
  F('papaya', 'Papaya', 'fruit', 'g', 120, 'papaya', ['papaya', 'pawpaw', 'papaya chunks']),
  F('kiwi', 'Kiwi', 'fruit', 'g', 100, 'kiwi', ['kiwi', 'kiwis', 'kiwifruit', 'kiwi fruit']),
  F('fig', 'Fig', 'fruit', 'g', 80, 'fig', ['fig', 'figs', 'fresh figs']),
  F('dates', 'Dates', 'fruit', 'g', 40, 'dates', ['date', 'dates', 'medjool dates', 'dried dates']),
  F('raisins', 'Raisins', 'fruit', 'g', 30, 'raisins', ['raisin', 'raisins', 'sultanas', 'golden raisins']),
  F('prunes', 'Prunes', 'fruit', 'g', 40, 'prunes', ['prune', 'prunes', 'dried plums']),
  F('driedApricots', 'Dried apricots', 'fruit', 'g', 40, 'apricot', ['dried apricots', 'dried apricot']),
  F('pomegranate', 'Pomegranate', 'fruit', 'g', 100, 'pomegranate', ['pomegranate', 'pomegranate seeds', 'pomegranate arils']),
  F('grapefruit', 'Grapefruit', 'fruit', 'piece', 0.5, 'grapefruit', ['grapefruit', 'pink grapefruit', 'grapefruit half']),
  F('lime', 'Lime', 'finish', 'piece', 0.25, 'lime', ['lime', 'limes', 'lime juice', 'lime wedge']),
  F('tangerine', 'Tangerine', 'fruit', 'piece', 1, 'orange', ['tangerine', 'tangerines', 'clementine', 'clementines', 'mandarin', 'mandarins', 'satsuma']),
  F('persimmon', 'Persimmon', 'fruit', 'g', 120, 'persimmon', ['persimmon', 'persimmons', 'sharon fruit', 'kaki']),
  F('passionFruit', 'Passion fruit', 'fruit', 'g', 60, 'passionFruit', ['passion fruit', 'passionfruit', 'maracuja']),
  F('guava', 'Guava', 'fruit', 'g', 120, 'guava', ['guava', 'guavas']),
  F('lychee', 'Lychee', 'fruit', 'g', 100, 'lychee', ['lychee', 'lychees', 'litchi']),
  F('coconut', 'Coconut', 'fruit', 'g', 50, 'coconut', ['coconut', 'fresh coconut', 'coconut chunks', 'desiccated coconut', 'coconut flakes']),
  F('raspberries', 'Raspberries', 'fruit', 'g', 100, 'raspberries', ['raspberry', 'raspberries']),
  F('blackberries', 'Blackberries', 'fruit', 'g', 100, 'blackberries', ['blackberry', 'blackberries']),
  F('cranberries', 'Cranberries', 'fruit', 'g', 80, 'cranberries', ['cranberry', 'cranberries', 'dried cranberries']),
  F('gooseberries', 'Gooseberries', 'fruit', 'g', 100, 'gooseberries', ['gooseberry', 'gooseberries']),

  // ── meat, fish and seafood ───────────────────────────────────────────────────────────────────────────────────────────────────
  F('turkey', 'Turkey', 'protein', 'g', 160, 'turkey', ['turkey', 'turkey breast', 'turkey mince', 'ground turkey', 'turkey thigh', 'raw turkey']),
  F('lamb', 'Lamb', 'protein', 'g', 150, 'lamb', ['lamb', 'lamb chops', 'lamb mince', 'ground lamb', 'lamb leg', 'raw lamb']),
  F('pork', 'Pork', 'protein', 'g', 150, 'pork', ['pork', 'pork chop', 'pork chops', 'pork loin', 'pork tenderloin', 'raw pork']),
  F('bacon', 'Bacon', 'protein', 'g', 40, 'bacon', ['bacon', 'bacon rashers', 'bacon strips', 'smoked bacon', 'pancetta']),
  F('ham', 'Ham', 'finish', 'g', 50, 'ham', ['ham', 'sliced ham', 'cooked ham', 'prosciutto'], {packaged: true}),
  F('sausage', 'Sausage', 'protein', 'g', 100, 'sausage', ['sausage', 'sausages', 'chorizo', 'salami', 'frankfurter'], {packaged: true}),
  F('duck', 'Duck', 'protein', 'g', 150, 'duck', ['duck', 'duck breast', 'duck leg', 'raw duck']),
  F('veal', 'Veal', 'protein', 'g', 150, 'veal', ['veal', 'veal escalope', 'raw veal']),
  // A steak is not mince: the first catalogue release sent "steak" to "Minced beef", and a recipe title then read "Minced beef skillet".
  F('steak', 'Beef steak', 'protein', 'g', 170, 'meat', ['steak', 'steaks', 'beef steak', 'raw steak', 'sirloin', 'sirloin steak', 'ribeye', 'rib eye steak', 'rump steak', 'fillet steak', 'beef strips', 'stewing beef', 'diced beef', 'beef chunks']),
  F('liver', 'Liver', 'protein', 'g', 120, 'liver', ['liver', 'chicken liver', 'lamb liver', 'calf liver']),
  F('sardines', 'Sardines', 'finish', 'g', 90, 'sardines', ['sardines', 'canned sardines', 'tinned sardines'], {allergens: ['fish'], packaged: true}),
  F('anchovies', 'Anchovies', 'finish', 'g', 20, 'anchovies', ['anchovies', 'anchovy', 'anchovy fillets', 'canned anchovies'], {allergens: ['fish'], packaged: true}),
  F('mackerel', 'Mackerel', 'protein', 'g', 150, 'mackerel', ['mackerel', 'mackerel fillet', 'raw mackerel'], {allergens: ['fish']}),
  F('trout', 'Trout', 'protein', 'g', 150, 'trout', ['trout', 'rainbow trout', 'trout fillet'], {allergens: ['fish']}),
  F('tunaSteak', 'Fresh tuna', 'protein', 'g', 150, 'tunaSteak', ['fresh tuna', 'tuna steak', 'raw tuna', 'tuna loin'], {allergens: ['fish']}),
  F('halibut', 'Halibut', 'protein', 'g', 160, 'fish', ['halibut', 'halibut fillet'], {allergens: ['fish']}),
  F('squid', 'Squid', 'protein', 'g', 150, 'squid', ['squid', 'calamari', 'squid rings', 'raw squid'], {allergens: ['molluscs']}),
  F('mussels', 'Mussels', 'protein', 'g', 200, 'mussels', ['mussels', 'fresh mussels', 'raw mussels'], {allergens: ['molluscs']}),
  F('clams', 'Clams', 'protein', 'g', 180, 'clams', ['clams', 'fresh clams'], {allergens: ['molluscs']}),
  F('scallops', 'Scallops', 'protein', 'g', 120, 'scallops', ['scallops', 'scallop', 'raw scallops'], {allergens: ['molluscs']}),
  F('crab', 'Crab', 'protein', 'g', 120, 'crab', ['crab', 'crab meat', 'crab sticks'], {allergens: ['crustaceans']}),
  F('tempeh', 'Tempeh', 'finish', 'g', 120, 'tempeh', ['tempeh', 'fermented soy'], {allergens: ['soy'], packaged: true}),
  F('seitan', 'Seitan', 'finish', 'g', 120, 'seitan', ['seitan', 'wheat protein', 'wheat gluten'], {allergens: ['gluten'], packaged: true}),

  // ── dairy ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  F('ricotta', 'Ricotta', 'dairy', 'g', 60, 'ricotta', ['ricotta', 'ricotta cheese'], {allergens: ['milk'], packaged: true}),
  F('creamCheese', 'Cream cheese', 'dairy', 'g', 30, 'creamCheese', ['cream cheese', 'philadelphia', 'soft cheese'], {allergens: ['milk'], packaged: true}),
  F('cottageCheese', 'Cottage cheese', 'dairy', 'g', 100, 'cottageCheese', ['cottage cheese'], {allergens: ['milk'], packaged: true}),
  F('sourCream', 'Sour cream', 'dairy', 'g', 30, 'sourCream', ['sour cream', 'creme fraiche', 'soured cream'], {allergens: ['milk'], packaged: true}),
  F('heavyCream', 'Cream', 'dairy', 'g', 40, 'heavyCream', ['cream', 'heavy cream', 'double cream', 'single cream', 'whipping cream'], {allergens: ['milk'], packaged: true}),
  F('butter', 'Butter', 'fat', 'g', 10, 'butter', ['butter', 'salted butter', 'unsalted butter'], {allergens: ['milk'], packaged: true}),
  F('ghee', 'Ghee', 'fat', 'g', 10, 'ghee', ['ghee', 'clarified butter'], {allergens: ['milk'], packaged: true}),
  F('paneer', 'Paneer', 'dairy', 'g', 80, 'paneer', ['paneer', 'indian cheese'], {allergens: ['milk'], packaged: true}),
  F('halloumi', 'Halloumi', 'dairy', 'g', 80, 'halloumi', ['halloumi', 'halloumi cheese', 'grilling cheese'], {allergens: ['milk'], packaged: true}),
  F('brie', 'Brie', 'dairy', 'g', 40, 'brie', ['brie', 'camembert', 'soft ripened cheese'], {allergens: ['milk'], packaged: true}),
  F('blueCheese', 'Blue cheese', 'dairy', 'g', 30, 'blueCheese', ['blue cheese', 'gorgonzola', 'roquefort', 'stilton'], {allergens: ['milk'], packaged: true}),
  F('kefir', 'Kefir', 'dairy', 'g', 150, 'kefir', ['kefir', 'drinking yogurt'], {allergens: ['milk'], packaged: true}),
  F('buttermilk', 'Buttermilk', 'dairy', 'g', 150, 'buttermilk', ['buttermilk'], {allergens: ['milk'], packaged: true}),
  F('plantMilk', 'Plant milk', 'finish', 'g', 200, 'plantMilk', ['plant milk', 'oat milk', 'almond milk', 'soy milk', 'soya milk', 'coconut milk drink', 'rice milk'], {packaged: true}),

  // ── grains, breads and noodles ───────────────────────────────────────────────────────────────────────────────────────────────
  F('bulgur', 'Bulgur', 'grain', 'g', 75, 'bulgur', ['bulgur', 'bulghur', 'cracked wheat', 'burghul'], {allergens: ['gluten'], packaged: true}),
  F('barley', 'Barley', 'grain', 'g', 75, 'barley', ['barley', 'pearl barley', 'pot barley'], {allergens: ['gluten'], packaged: true}),
  F('farro', 'Farro', 'grain', 'g', 75, 'farro', ['farro', 'spelt', 'spelt grains', 'emmer'], {allergens: ['gluten'], packaged: true}),
  F('millet', 'Millet', 'grain', 'g', 70, 'millet', ['millet', 'millet grains']),
  F('buckwheat', 'Buckwheat', 'grain', 'g', 70, 'buckwheat', ['buckwheat', 'buckwheat groats', 'kasha']),
  F('polenta', 'Polenta (cornmeal)', 'grain', 'g', 75, 'polenta', ['polenta', 'cornmeal', 'corn meal', 'maize meal']),
  F('noodles', 'Noodles', 'grain', 'g', 80, 'noodles', ['noodles', 'egg noodles', 'rice noodles', 'soba noodles', 'udon', 'ramen noodles', 'vermicelli'], {allergens: ['gluten'], packaged: true}),
  F('riceNoodles', 'Rice noodles', 'grain', 'g', 80, 'riceNoodles', ['rice noodles', 'rice vermicelli', 'pad thai noodles'], {packaged: true}),
  F('gnocchi', 'Gnocchi', 'grain', 'g', 150, 'gnocchi', ['gnocchi', 'potato gnocchi'], {allergens: ['gluten'], packaged: true}),
  F('flour', 'Flour', 'grain', 'g', 60, 'flour', ['flour', 'plain flour', 'all purpose flour', 'white flour'], {allergens: ['gluten'], packaged: true}),
  F('breadcrumbs', 'Breadcrumbs', 'finish', 'g', 30, 'breadcrumbs', ['breadcrumbs', 'bread crumbs', 'panko', 'panko breadcrumbs'], {allergens: ['gluten'], packaged: true}),
  F('sourdough', 'Sourdough bread', 'bread', 'g', 60, 'sourdough', ['sourdough', 'sourdough bread', 'sour dough'], {allergens: ['gluten'], packaged: true}),
  F('baguette', 'Baguette', 'bread', 'g', 60, 'baguette', ['baguette', 'french bread', 'french stick', 'ciabatta', 'focaccia'], {allergens: ['gluten'], packaged: true}),
  F('bagel', 'Bagel', 'bread', 'piece', 1, 'bagel', ['bagel', 'bagels'], {allergens: ['gluten'], packaged: true}),
  F('naan', 'Naan', 'bread', 'piece', 1, 'naan', ['naan', 'naan bread', 'flatbread', 'chapati', 'roti'], {allergens: ['gluten'], packaged: true}),
  F('crackers', 'Crackers', 'bread', 'g', 30, 'crackers', ['crackers', 'cracker', 'crispbread', 'water biscuits'], {allergens: ['gluten'], packaged: true}),
  F('ryeBread', 'Rye bread', 'bread', 'g', 60, 'ryeBread', ['rye bread', 'dark rye', 'pumpernickel'], {allergens: ['gluten'], packaged: true}),

  // ── legumes and pulses (ready to eat) ────────────────────────────────────────────────────────────────────────────────────────
  F('kidneyBeans', 'Cooked kidney beans', 'ready-legume', 'g', 150, 'kidneyBeans', ['kidney beans', 'cooked kidney beans', 'canned kidney beans', 'red kidney beans'], {packaged: true}),
  F('pintoBeans', 'Cooked pinto beans', 'ready-legume', 'g', 150, 'pintoBeans', ['pinto beans', 'cooked pinto beans', 'canned pinto beans'], {packaged: true}),
  F('navyBeans', 'Cooked navy beans', 'ready-legume', 'g', 150, 'navyBeans', ['navy beans', 'haricot beans', 'cooked haricot beans', 'baked beans'], {packaged: true}),
  F('favaBeans', 'Cooked fava beans', 'ready-legume', 'g', 150, 'favaBeans', ['fava beans', 'broad beans', 'cooked broad beans'], {packaged: true}),
  F('mungBeans', 'Cooked mung beans', 'ready-legume', 'g', 150, 'mungBeans', ['mung beans', 'moong beans', 'cooked mung beans'], {packaged: true}),
  F('blackEyedPeas', 'Cooked black-eyed peas', 'ready-legume', 'g', 150, 'blackEyedPeas', ['black eyed peas', 'black-eyed peas', 'cowpeas'], {packaged: true}),

  // ── nuts, seeds and nut butters ──────────────────────────────────────────────────────────────────────────────────────────────
  F('cashews', 'Cashews', 'finish', 'g', 15, 'cashews', ['cashew', 'cashews', 'cashew nuts'], {allergens: ['nuts']}),
  F('pistachios', 'Pistachios', 'finish', 'g', 15, 'pistachios', ['pistachio', 'pistachios', 'pistachio nuts', 'shelled pistachios'], {allergens: ['nuts']}),
  F('hazelnuts', 'Hazelnuts', 'finish', 'g', 15, 'hazelnuts', ['hazelnut', 'hazelnuts', 'filberts'], {allergens: ['nuts']}),
  F('pecans', 'Pecans', 'finish', 'g', 15, 'pecans', ['pecan', 'pecans', 'pecan nuts'], {allergens: ['nuts']}),
  F('pineNuts', 'Pine nuts', 'finish', 'g', 10, 'pineNuts', ['pine nuts', 'pignoli', 'pignolias'], {allergens: ['nuts']}),
  F('brazilNuts', 'Brazil nuts', 'finish', 'g', 15, 'brazilNuts', ['brazil nuts', 'brazil nut'], {allergens: ['nuts']}),
  F('peanuts', 'Peanuts', 'finish', 'g', 20, 'peanuts', ['peanut', 'peanuts', 'roasted peanuts', 'salted peanuts'], {allergens: ['peanuts']}),
  F('almondButter', 'Almond butter', 'fat', 'g', 15, 'almondButter', ['almond butter'], {allergens: ['nuts'], packaged: true}),

  // ── oils, sauces, condiments and pantry ──────────────────────────────────────────────────────────────────────────────────────
  F('sesameOil', 'Sesame oil', 'fat', 'g', 5, 'sesameOil', ['sesame oil', 'toasted sesame oil'], {allergens: ['sesame'], packaged: true}),
  F('coconutOil', 'Coconut oil', 'fat', 'g', 10, 'coconutOil', ['coconut oil'], {packaged: true}),
  F('sunflowerOil', 'Sunflower oil', 'fat', 'g', 10, 'sunflowerOil', ['sunflower oil', 'vegetable oil', 'rapeseed oil', 'canola oil', 'neutral oil'], {packaged: true}),
  F('avocadoOil', 'Avocado oil', 'fat', 'g', 10, 'avocadoOil', ['avocado oil'], {packaged: true}),
  F('soySauce', 'Soy sauce', 'finish', 'g', 10, 'soySauce', ['soy sauce', 'soya sauce', 'light soy sauce', 'dark soy sauce'], {allergens: ['soy', 'gluten'], packaged: true}),
  F('tamari', 'Tamari', 'finish', 'g', 10, 'soySauce', ['tamari', 'gluten free soy sauce'], {allergens: ['soy'], packaged: true}),
  F('fishSauce', 'Fish sauce', 'finish', 'g', 8, 'fishSauce', ['fish sauce', 'nam pla'], {allergens: ['fish'], packaged: true}),
  F('oysterSauce', 'Oyster sauce', 'finish', 'g', 10, 'oysterSauce', ['oyster sauce'], {allergens: ['molluscs'], packaged: true}),
  F('vinegar', 'Vinegar', 'finish', 'g', 10, 'vinegar', ['vinegar', 'white vinegar', 'apple cider vinegar', 'red wine vinegar', 'rice vinegar'], {packaged: true}),
  F('balsamicVinegar', 'Balsamic vinegar', 'finish', 'g', 10, 'balsamicVinegar', ['balsamic vinegar', 'balsamic'], {packaged: true}),
  F('mustard', 'Mustard', 'finish', 'g', 8, 'mustard', ['mustard', 'dijon mustard', 'wholegrain mustard', 'yellow mustard'], {allergens: ['mustard'], packaged: true}),
  F('ketchup', 'Ketchup', 'finish', 'g', 15, 'ketchup', ['ketchup', 'tomato ketchup', 'tomato sauce'], {packaged: true}),
  F('mayonnaise', 'Mayonnaise', 'finish', 'g', 15, 'mayonnaise', ['mayonnaise', 'mayo', 'aioli'], {allergens: ['eggs'], packaged: true}),
  F('hummus', 'Hummus', 'finish', 'g', 50, 'hummus', ['hummus', 'houmous', 'humus'], {allergens: ['sesame'], packaged: true}),
  F('pesto', 'Pesto', 'finish', 'g', 20, 'pesto', ['pesto', 'basil pesto', 'green pesto'], {allergens: ['milk', 'nuts'], packaged: true}),
  F('salsa', 'Salsa', 'finish', 'g', 40, 'salsa', ['salsa', 'tomato salsa', 'pico de gallo'], {packaged: true}),
  F('tomatoPaste', 'Tomato paste', 'finish', 'g', 20, 'tomatoPaste', ['tomato paste', 'tomato puree', 'concentrated tomato'], {packaged: true}),
  F('sunDriedTomatoes', 'Sun-dried tomatoes', 'finish', 'g', 20, 'sunDriedTomatoes', ['sun dried tomatoes', 'sun-dried tomatoes', 'dried tomatoes'], {packaged: true}),
  F('capers', 'Capers', 'finish', 'g', 8, 'capers', ['capers', 'caper berries'], {packaged: true}),
  F('pickles', 'Pickles', 'finish', 'g', 30, 'pickles', ['pickles', 'pickled cucumber', 'gherkins', 'dill pickles'], {packaged: true}),
  F('sauerkraut', 'Sauerkraut', 'finish', 'g', 40, 'sauerkraut', ['sauerkraut', 'fermented cabbage'], {packaged: true}),
  F('kimchi', 'Kimchi', 'finish', 'g', 40, 'kimchi', ['kimchi', 'kimchee'], {allergens: ['fish'], packaged: true}),
  F('miso', 'Miso', 'finish', 'g', 15, 'miso', ['miso', 'miso paste', 'white miso'], {allergens: ['soy'], packaged: true}),
  F('nori', 'Nori', 'finish', 'g', 3, 'nori', ['nori', 'seaweed', 'nori sheets', 'seaweed sheets'], {packaged: true}),
  F('coconutMilk', 'Coconut milk', 'finish', 'g', 100, 'coconutMilk', ['coconut milk', 'canned coconut milk', 'coconut cream'], {packaged: true}),
  F('stock', 'Stock', 'finish', 'g', 200, 'stock', ['stock', 'broth', 'vegetable stock', 'chicken stock', 'bouillon'], {packaged: true}),
  F('mapleSyrup', 'Maple syrup', 'finish', 'g', 15, 'mapleSyrup', ['maple syrup', 'maple'], {packaged: true}),
  F('sugar', 'Sugar', 'finish', 'g', 8, 'sugar', ['sugar', 'white sugar', 'caster sugar', 'granulated sugar'], {packaged: true}),
  F('brownSugar', 'Brown sugar', 'finish', 'g', 8, 'brownSugar', ['brown sugar', 'muscovado', 'demerara'], {packaged: true}),
  F('salt', 'Salt', 'finish', 'g', 2, 'salt', ['salt', 'sea salt', 'table salt', 'kosher salt', 'flaky salt'], {packaged: true}),
  F('blackPepper', 'Black pepper', 'finish', 'g', 1, 'blackPepper', ['black pepper', 'peppercorns', 'ground pepper', 'cracked pepper'], {packaged: true}),
  F('paprika', 'Paprika', 'finish', 'g', 2, 'paprika', ['paprika', 'sweet paprika', 'smoked paprika'], {packaged: true}),
  F('cumin', 'Cumin', 'finish', 'g', 2, 'cumin', ['cumin', 'cumin seeds', 'ground cumin', 'jeera'], {packaged: true}),
  F('corianderSeed', 'Coriander seed', 'finish', 'g', 2, 'corianderSeed', ['coriander seed', 'coriander seeds', 'ground coriander', 'dhania powder'], {packaged: true}),
  F('cinnamon', 'Cinnamon', 'finish', 'g', 2, 'cinnamon', ['cinnamon', 'cinnamon stick', 'ground cinnamon'], {packaged: true}),
  F('nutmeg', 'Nutmeg', 'finish', 'g', 1, 'nutmeg', ['nutmeg', 'ground nutmeg'], {packaged: true}),
  F('cardamom', 'Cardamom', 'finish', 'g', 1, 'cardamom', ['cardamom', 'cardamom pods', 'ground cardamom'], {packaged: true}),
  F('cloves', 'Cloves', 'finish', 'g', 1, 'cloves', ['cloves', 'ground cloves', 'whole cloves'], {packaged: true}),
  F('saffron', 'Saffron', 'finish', 'g', 0.1, 'saffron', ['saffron', 'saffron threads'], {packaged: true}),
  F('chiliFlakes', 'Chili flakes', 'finish', 'g', 1, 'chiliFlakes', ['chili flakes', 'chilli flakes', 'red pepper flakes', 'crushed chili'], {packaged: true}),
  F('curryPowder', 'Curry powder', 'finish', 'g', 4, 'curryPowder', ['curry powder', 'madras curry powder'], {packaged: true}),
  F('garamMasala', 'Garam masala', 'finish', 'g', 3, 'garamMasala', ['garam masala'], {packaged: true}),
  F('turmeric', 'Turmeric', 'finish', 'g', 2, 'turmeric', ['turmeric', 'ground turmeric', 'haldi'], {packaged: true}),
  F('zaatar', 'Za\'atar', 'finish', 'g', 4, 'zaatar', ['zaatar', 'za\'atar', 'zatar'], {allergens: ['sesame'], packaged: true}),
  F('sumac', 'Sumac', 'finish', 'g', 3, 'sumac', ['sumac'], {packaged: true}),
  F('garlicPowder', 'Garlic powder', 'finish', 'g', 2, 'garlicPowder', ['garlic powder', 'granulated garlic'], {packaged: true}),
  F('onionPowder', 'Onion powder', 'finish', 'g', 2, 'onionPowder', ['onion powder', 'granulated onion'], {packaged: true}),
  F('vanilla', 'Vanilla', 'finish', 'g', 2, 'vanilla', ['vanilla', 'vanilla extract', 'vanilla essence'], {packaged: true}),
  F('cocoa', 'Cocoa powder', 'finish', 'g', 8, 'cocoa', ['cocoa', 'cocoa powder', 'cacao powder'], {packaged: true}),
  F('darkChocolate', 'Dark chocolate', 'finish', 'g', 15, 'darkChocolate', ['dark chocolate', 'chocolate', 'chocolate chips', 'cacao nibs'], {allergens: ['milk'], packaged: true}),
  F('nutritionalYeast', 'Nutritional yeast', 'finish', 'g', 5, 'nutritionalYeast', ['nutritional yeast', 'nooch'], {packaged: true}),

  // ── honest generic identities: a photo can show "meat" without proving which animal, and pretending otherwise would be a guess ───────────
  F('meat', 'Meat', 'protein', 'g', 150, 'meat', ['meat', 'raw meat', 'raw meat pieces', 'pieces of raw meat', 'diced meat', 'meat pieces', 'chopped meat', 'pieces of meat', 'stewing meat', 'meat chunks', 'raw meat chunks', 'sliced meat']),
  F('cheese', 'Cheese', 'dairy', 'g', 40, 'cheese', ['cheese', 'cheese slices', 'melting cheese', 'sliced cheese'], {allergens: ['milk'], packaged: true}),
];

// ── 15.20 corrections ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Found when this catalogue was compared with the allergen map the live 74-food build ships: the first catalogue release had dropped five
// allergen links that production relies on (fish on "fish" and "salmon", egg on trahana, gluten on oats, celery on celery). They are restored
// here, in the source, together with links for new foods that commonly carry an allergen. Every addition only ever BLOCKS more: nothing is removed.
const ALLERGEN_ADD = {
  fish: ['fish'], salmon: ['fish'], trahana: ['eggs'], oats: ['gluten'], celery: ['celery'],
  naan: ['milk'], noodles: ['eggs'], kimchi: ['crustaceans'], plantMilk: ['soy', 'nuts', 'gluten'], stock: ['celery'], mayonnaise: ['mustard'],
  driedApricots: ['sulphites'], raisins: ['sulphites'], vinegar: ['sulphites'], balsamicVinegar: ['sulphites'], sunDriedTomatoes: ['sulphites'], pickles: ['sulphites']
};
for (const f of FOODS) if (ALLERGEN_ADD[f.key]) f.allergens = [...new Set([...(f.allergens || []), ...ALLERGEN_ADD[f.key]])];

// One name must mean one food. Where a general food and a specific food both claimed a name, the specific food keeps it; a name that is
// genuinely ambiguous ("sprouts", "flatbread") belongs to nobody, so it is asked instead of guessed.
// Cherry tomatoes and red onions are deliberately NOT foods of their own: production resolves both names to "tomato" and "onion", every
// collection recipe is written for those two, and a separate identity would make a photo of cherry tomatoes match none of them.
const ALIAS_DROP = {
  noodles: ['rice noodles'],
  // anise is a spice, not the fennel bulb; "tomato sauce" is ketchup in some kitchens and passata in others
  fennel: ['anise'], ketchup: ['tomato sauce'],
  brusselsSprouts: ['sprouts'], beanSprouts: ['sprouts'], pita: ['flatbread'], naan: ['flatbread']
};
for (const f of FOODS) if (ALIAS_DROP[f.key]) f.aliases = f.aliases.filter(a => !ALIAS_DROP[f.key].includes(a));

// The words people actually type. Measured by typing 162 everyday food words into My pantry: production recognised 70 of them; "bread",
// "yogurt", "toast" and "fruit" were not names of anything, because only the qualified label ("Whole-grain bread", "Greek yogurt") was.
// A plain word is given to a food only where the catalogue has one food it can mean; "beans", "oil", "nuts", "pepper" and "lentils" stay
// unresolved on purpose and are answered with a short list to choose from.
const ALIAS_ADD = {
  bread: ['bread', 'toast', 'loaf of bread', 'slice of bread', 'bread slices', 'ψωμί'],
  yogurt: ['yogurt'], oats: ['porridge'], fruit: ['fruit', 'fruits'],
  pepper: ['red pepper', 'green pepper', 'yellow pepper', 'orange pepper', 'peppers']
};
for (const f of FOODS) if (ALIAS_ADD[f.key]) f.aliases = [...new Set([...f.aliases, ...ALIAS_ADD[f.key]])];
for (const k of [...Object.keys(ALIAS_DROP), ...Object.keys(ALIAS_ADD)]) if (!FOODS.some(f => f.key === k)) throw new Error('catalogue: alias rule for an unknown food: ' + k);

export const CATALOG = Object.fromEntries(FOODS.map(f => [f.key, f]));

/** The 74 identities every earlier release shipped. Their behaviour must not change: saved kitchens, plans and the 84 recipes depend on them. */
export const BASE_KEYS = new Set(FOODS.slice(0, 74).map(f => f.key));

/** EU-14 allergen → foods. Key order is the order the app has always used. */
export const ALLERGENS = (() => {
  const out = {milk: [], eggs: [], fish: [], crustaceans: [], soy: [], peanuts: [], nuts: [], sesame: [], gluten: [], celery: [], mustard: [], lupin: [], molluscs: [], sulphites: []};
  for (const f of FOODS) for (const a of f.allergens || []) out[a].push(f.key);
  return out;
})();

// Diet classes. A food pattern is a promise about what will never be suggested, so the lists are explicit and reviewed, not inferred from a
// cooking group: ham is "ready to eat" for the cook and still meat for a vegetarian.
export const MEAT = ['chicken', 'beef', 'steak', 'turkey', 'lamb', 'pork', 'bacon', 'sausage', 'duck', 'veal', 'liver', 'meat', 'ham'];
export const SEAFOOD = ['fish', 'salmon', 'shrimp', 'tunaCanned', 'mackerel', 'trout', 'tunaSteak', 'halibut', 'squid', 'mussels', 'clams', 'scallops', 'crab', 'sardines', 'anchovies', 'fishSauce', 'oysterSauce', 'kimchi'];
/** Not for a plant-only list: meat, seafood, anything carrying the milk or egg allergen, and honey. */
export const ANIMAL = [...new Set([...MEAT, ...SEAFOOD, ...ALLERGENS.milk, ...ALLERGENS.eggs, 'honey'])];

/** The nine "leave out" groups offered in Settings and on the home page. `wheat` is the gluten list without oats (oats are handled by the
 *  gluten allergen and the gluten-free pattern, exactly as before). */
export const EXCLUSION_GROUPS = {
  dairy: ALLERGENS.milk, egg: ALLERGENS.eggs, nuts: ALLERGENS.nuts, sesame: ALLERGENS.sesame, fish: ALLERGENS.fish,
  wheat: ALLERGENS.gluten.filter(k => k !== 'oats'), shellfish: [...ALLERGENS.crustaceans, ...ALLERGENS.molluscs], soy: ALLERGENS.soy, peanuts: ALLERGENS.peanuts
};
/** What those groups contained in every release up to 15.19.0. A saved kitchen that had a whole group ticked is widened to the new list. */
export const LEGACY_EXCLUSION_GROUPS = {
  dairy: ['yogurt', 'milk', 'feta', 'hardcheese', 'trahana', 'mozzarella'], egg: ['egg'], nuts: ['walnuts', 'almonds'], sesame: ['tahini'], fish: ['fish', 'salmon', 'tunaCanned'],
  wheat: ['bread', 'pasta', 'pita', 'paximadi', 'trahana', 'couscous', 'tortilla'], shellfish: ['shrimp'], soy: ['tofu'], peanuts: ['peanutButter']
};

// "Strict label checks": with an allergen saved, a food whose pack can hide ingredients is not offered until the label is read. The 74 shipped
// foods keep exactly the membership they have in production; new foods are listed by hand: compound or processed products only. A jar of
// cumin or a bottle of vinegar is one ingredient and is not held back.
const BASE_STRICT = 'bread pasta pita paximadi trahana couscous tortilla peanutButter hardcheese tomatoCanned tunaCanned tofu chickpeasCooked whiteBeansCooked lentilsCooked blackBeansCooked olives'.split(' ');
const NEW_STRICT = 'sourdough baguette bagel naan crackers ryeBread breadcrumbs noodles gnocchi seitan tempeh plantMilk ham bacon sausage sardines anchovies soySauce tamari fishSauce oysterSauce mustard ketchup mayonnaise hummus pesto salsa pickles kimchi miso stock curryPowder garamMasala zaatar darkChocolate kidneyBeans pintoBeans navyBeans favaBeans mungBeans blackEyedPeas almondButter cheese tomatoPaste coconutMilk sauerkraut capers'.split(' ');
export const STRICT_LABEL = [...BASE_STRICT, ...NEW_STRICT];
/** A photo cannot prove what is inside a pack: these are confirmed from the label. Shipped foods keep their production membership. */
const BASE_LABEL = 'feta yogurt bread pita pasta milk oliveOil honey tahini trahana tomatoCanned tunaCanned mozzarella quinoa couscous tortilla tofu peanutButter'.split(' ');
export const LABEL_REQUIRED = [...BASE_LABEL, ...FOODS.filter(f => !BASE_KEYS.has(f.key) && f.packaged).map(f => f.key)];

for (const list of [MEAT, SEAFOOD, STRICT_LABEL, LABEL_REQUIRED, ...Object.values(LEGACY_EXCLUSION_GROUPS)]) for (const k of list) if (!CATALOG[k]) throw new Error('catalogue: unknown food in a derived list: ' + k);
