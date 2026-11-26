# The Daily Table 15.20.0 — what changed and why

Built on the live production package **15.19.0** (verified byte-for-byte against the live site's own release manifest, 878 of 878 files).
Every change is a small, anchored patch on top of that package (`source/pkg/patches20/`); the build stops if the live code it touches has moved.
This file was written before deployment. The owner has since uploaded the package to production (see the status note in `README.md`);
below, "live" means the release it replaced, 15.19.0.

Each item below names the defect as it was measured on the live build, then what 15.20.0 does.

## 1. The ingredient knowledge base (74 → 269 foods)

The 270-food catalogue shipped as v16 on 19 October and was lost when the 15.7 → 15.19 line went live. Production knew 74 foods again.

- **269 foods, 1,094 names** (English and Greek, singular and plural, everyday words such as "bread", "mince", "prawns").
- The catalogue now feeds **every** rule that decides what a food is, from one source: the recipe contract on the server and in the
  browser, saved allergens, the "leave out" groups, vegetarian / pescatarian / plant-only, the strict-label list, and the icons.
  The first catalogue release had only reached the recipe contract; the filters still thought in 74 foods.
- **295 food icons** (was 74). No food is shown as a bare dot.
- Nothing about the 74 foods production already had changes: 207 names the live build resolves were re-checked, 0 resolve differently.

## 2. Safe temperatures for every protein

Production named a temperature for chicken, beef and shrimp and answered "63 °C / 145 °F" for every other food, including pork and lamb.

- Fin fish 63 °C, beef / pork / lamb / veal 71 °C (the minced-meat value, because the app cannot see the cut), poultry 74 °C.
- Anything not listed gets the strictest value, 74 °C. The build fails if a raw protein in the catalogue is in no list.
- Shellfish are judged by appearance (opaque flesh, opened shells), never by a thermometer.

## 3. My pantry — start with a photo

Measured at 390 × 844 on the live build:

| Defect on live | 15.20.0 |
|---|---|
| "Take a photo" started at y = 856, under the fold and the navigation dock. A cross-promotion and a three-step strip came first. | The photo card is the first thing on the page; the promotion follows it. |
| After choosing a photo nothing moved. The preview and "Find ingredients" were at y = 2040, two and a half screens down. | The page moves to the photo; "Find ingredients" is on screen and focused. |
| While identifying: the status twice (once cut off as "AI is identifying visible ingred…"), two Cancel buttons, a disabled "Find ingredients", and the real progress steps under the dock. | One status line, one Cancel, the progress steps in view. |
| A kitchen with allergens saved: the heading said "6 food suggestions", three chips were shown, and feta, peanut butter and olives were gone with no explanation. | "3 selected · 3 identified · 3 left out", and a list "Left out for this kitchen" that names the rule for each food. |
| Seven names from a photo became dead ends ("parsley", "cherry tomatoes", "red onion" were unknown or duplicates). | Seven names become six foods; cherry tomatoes join tomato, red onion joins onion. |

The rules themselves did not change. Olives are left out by the existing option "also exclude compound / packaged ingredients with
unverified labels", which is on by default once an allergen is saved; the page now says so instead of dropping the food silently.

## 4. My pantry — typing foods

Measured by typing 162 everyday food words one at a time:

- Production recognised **70**. "bread", "pasta", "cheese", "butter", "tuna", "oats", "beef", "tofu" and "herbs" were "Not recognized".
- 15.20.0 recognises **143**. The rest are words that really name several foods ("beans", "oil", "nuts", "pepper"), and they stay a question.
- That question used to be answered by spelling distance: "beans" offered Beetroot / Pear / Peas, "salad" offered Salsa / Salt / Sausage.
  It now offers the foods the word names: "beans" → giant beans, white beans, green beans, black beans; "pepper" → bell, chili, black.
  A near spelling is offered only when nothing is named ("tomatoe" → Tomato). Nothing is chosen for the person.
- After "Save foods to my kitchen" the page said "See the matching results below" while the results started about 380 px under the
  bottom of the screen. The page now moves to them.
- With six typed foods saved, the results tab read "Best matches (42)" directly above "20 recipe ideas use your foods". The tab counted
  every ranked candidate; the list shows the ones that use a saved food. The tab now counts the list it opens.

## 5. A created recipe reads as if a cook wrote it

Found by creating a recipe from tomato, cucumber, onion, olives, feta and parsley on the live build:

- Step 1 of a meatless salad ended "Do not wash raw meat or poultry." — removed unless the recipe has raw meat or poultry.
- The tossing step ended "Allow about 2 minutes; check the food rather than relying on the timer." — no timer on a no-cook step.
- The header said "Hob & pan" above "No cooking needed" — a no-cook recipe is labelled No-cook.
- "Protein is missing." stood forty lines above "✓ Protein foods: listed". Two classifiers disagreed; there is now one.
- Squid, mussels, clams, scallops and crab were told to use a food thermometer "to confirm at least opaque, pearly-white flesh".
  They now get the appearance wording shrimp already had.
- A bunch of parsley alone triggered "Cut the remaining firm produce into small, even pieces." 38 foods are never "cut into pieces".
- Every step was one paragraph of up to five sentences. Each step now leads with its action; the rest are short notes under it.

The step text is produced by fixed templates that exist twice (server and browser). Both are generated from one description and
compared over thousands of plans: they write the same recipe.

## 6. Saved kitchens always open

The app refuses a saved kitchen that names a food it does not know, and shows "Saved kitchen data could not be read. It has not been
overwritten." That protects against corrupt data. It also has a cost that was live in production:

- v16 (270 foods) was production on 19–20 October. When the 74-food line replaced it, every kitchen that had saved one of the added
  foods became unreadable. Measured on 15.19.0 with parsley, pork and bulgur in the pantry: the message appears on every page.
  15.20.0 knows those foods again, so those kitchens open.
- Two v16 foods, "Red onion" and "Cherry tomatoes", are folded into Onion and Tomato in this catalogue so that they match the
  collection's recipes. A kitchen that saved them is migrated when it is read: the pantry, use-first list, recent foods, staples, stock
  and recipe ingredients all follow, with no duplicates. This happens in the one validator every kitchen passes through (stored data,
  another tab, an imported backup, a household transfer).
- A kitchen that names a food no release ever had is still refused and left exactly as it was.
- The build now fails if a later catalogue drops a food key of any earlier release without mapping it.

## 7. Upgrading and offline

- The food-icon sprite grew from 74 to 295 icons but its address carried no release. A visitor who had opened the site within the hour
  before an update would have kept the old sprite under the new service worker: blank icons for every new food, until the next release.
  Every reference now names the release.
- Every page preloaded the recipe data as `data.json?v=15.19.0` while the app fetched `data.json?v=15.6.4`, so a first visit downloaded
  it twice (26 KB each, compressed). Both now use the release's address: one download.
- "Apply" in the update notice — the control every returning visitor must tap to receive a release — measured 81 × 22 px. It is 44 px tall.
- The offline page was a bare card with one link, a missing icon (a 404 in the log) and no publisher credit. It now says what still
  works and links Home, Recipes, Today and Shopping.

## 8. Text that could not be read, and small controls

axe-core found 16 nodes on 5 elements below the 4.5 : 1 contrast minimum:

- My pantry, dark theme: the saved-allergens line was ivory text on a light card, **1.05 : 1** (invisible). Now 8 : 1, and its
  "Edit" link 10 : 1 on the same card.
- Home, dark theme: two section labels at 2.85 and 2.89. Home, light theme: two small labels at 3.96 and 4.31.
- A link on Home was 21 px tall; it is 44 px.

## 9. Polish

- Drawn ingredient plates were captioned "Photo is illustrative". They are captioned "Ingredient illustration"; photographs keep their caption.
- Shopping on a phone: "Dates & range" and its value each broke over two lines. The value now sits under the label.
- The kitchen strip on a phone cut its last pill mid-word. It fades out at the edge, which also shows that the strip scrolls.
- Moving between pages: where the browser supports it (Chrome 126+, Safari 18.2+), the old page cross-fades into the new one instead of
  flashing. Ignored elsewhere; off for people who ask for reduced motion.

## Left as it is, on purpose

- **No font files.** The project rule since 15.5.1 is that font binaries are not published. The styles still name Fraunces and Inter
  first, so headings render in the device's Georgia or serif and text in the system sans. This is the largest remaining visual gap;
  restoring Fraunces is one small patch if the rule changes.
- **The 84 collection recipes** are unchanged. They carry no nutrition data, so none is shown.
- **The allergen and strict-label rules** are unchanged; only their visibility changed.
- **Mobile Lighthouse** is not at 95, and Home reads about 4 points lower than live in the simulated score while its measured paint
  is earlier; see VALIDATION.md §4.
