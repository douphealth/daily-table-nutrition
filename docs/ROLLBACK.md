# Rolling back 15.20.0

15.20.0 is a static Cloudflare Pages upload. It changes no stored data format. A kitchen saved by 15.19.0 (or any earlier release)
opens in 15.20.0 unchanged; the upgrade test compares it field by field.

## Read this before rolling back

**A rollback to 15.19.0 locks some kitchens until the newer build returns.** This was measured, not assumed
(`source/tools/probe-rollback.mjs`):

- 15.19.0 knows 74 foods. It refuses to open a saved kitchen that names any other food and shows "Saved kitchen data could not be
  read. It has not been overwritten."
- So anyone who saved one of the 195 added foods (parsley, pork, bulgur …) under 15.20.0 would see that message on every page after a
  rollback. Their data is **not deleted or overwritten**; it opens again as soon as a build with the larger catalogue is live.
- The same thing already happened once: v16 (270 foods) was production on 19–20 October, then the 74-food line replaced it. Kitchens
  that saved a v16 food have been showing that message under 15.19.0. 15.20.0 opens them again.

If a rollback is needed anyway, prefer fixing forward (a 15.20.1 built from `source/pkg`) over returning to a 74-food build.

## To go back to 15.19.0

1. In Cloudflare Pages, open the project's **Deployments**, find the 15.19.0 deployment and choose **Rollback to this deployment**.
   The 15.19.0 package is not in this repository. The owner keeps an extracted copy that was verified file by file against the
   site's own release manifest (878 of 878); zip its contents to upload it again if the deployment is no longer listed.
2. Returning visitors get the update notice for the older build on their next visit, as with any release.

## Before production

Deploy to a **Preview** first. The automated tests use a scripted stand-in for the AI models and for the Cloudflare security check;
the real services cannot be reached from the build machine. On the Preview:

1. Open My pantry, choose a photo, press Find ingredients, create a recipe.
2. Under "Processing details & crop", run **Test security only**.
3. Save an allergen, repeat with a photo that contains that food, and check the "Left out for this kitchen" list.
