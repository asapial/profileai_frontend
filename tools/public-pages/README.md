# Public page scenes

The five approved redesigns are isolated in `src/components/public` and mounted
only on `/templates`, `/pricing`, `/help`, `/privacy` and `/terms`. Shared account
navigation, article publication, API template loading, registration parameters
and dynamic legal content retain their existing sources.

## Artwork and native content

The rooms are imagegen background plates based on the approved mockups. Their
floors, architectural depth, paper/folder materials and reflections are part of
the artwork. Text, search, filters, prices, policy sections, template selection
and controls remain native HTML. The foreground A4 papers use real local catalog
renders or the existing sandboxed template renderer. Native paper/plinth depth
and restrained optical reflections complete the gallery and plan stage.

`public/art/public-pages` contains 20 WebP files: five rooms, two themes and two
device framings. Together they are about 874 KiB. `provenance.json` records the
full built-in imagegen prompts and preparation method. Originals remain in the
Codex generated-image folder; runtime code references workspace assets only.
There is no additional WebGL context or external image request on these pages.

The hero files have quiet regions for real copy. Neutral photographic reading
fields protect text where reflected studio light would otherwise lower contrast.
The rooms stay visible and maintain a continuous floor. Mobile layouts put the
help/policy still life below the copy instead of cropping objects behind text.

API catalog records keep their renderer and detail routes. If the public API is
empty or unavailable, existing project catalog designs appear as labelled
catalog previews. These use illustrative content; their action starts account
creation without pretending a cached sample is a live backend template ID.
Search, document/category filters, sort, shortlist, grid/list and modal previews
work with the selected source. Shortlists retain the existing device store.

Pricing reuses the original Free / Job Seeker / Career Pro data, monthly prices
0 / 299 / 599 BDT and annual prices 0 / 2990 / 5990 BDT. The full comparison,
Sprint Pass and original FAQ answers remain. Legal pages retain dynamic
overviews, all defined sections, original policy details, hero facts and choices.
This change does not revise prices, refund policy, entitlements or legal terms.

The older ambient background is skipped on these five exact routes; related
detail pages and the homepage retain their existing behavior. Gentle CSS entry
motion observes streamed and filtered content. The content is visible without
JavaScript and reduced-motion mode removes the travel.

## Reproduce preparation and checks

Use Node directly from the frontend root. The browser helper is the existing
zero-dependency CDP helper supplied by the design skill; no driver is installed.

```powershell
node tools/public-pages/prepare-assets.mjs <generated-art-manifest.json>
node tools/public-pages/verify.mjs --helper <path-to-cdp.mjs>
node tools/public-pages/verify-contrast.mjs --helper <path-to-cdp.mjs>
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/public
```

The browser suite visits all five pages at 1440, 768 and 390 pixels in both
themes. It checks real assets, paper proportions, overflow, typography, native
preview/focus behavior, catalog search, saved shortlists, billing/registration
parameters, FAQs, help search, live theme switching, mobile navigation, legal
anchors and reduced motion. Browser profiles are temporary and do not use the
user's personal browser data. It performs no purchase, registration or message.

The contrast suite temporarily removes the text paint, samples the actual pixels
beneath visible text and compares the real foreground against that backdrop.
It applies 4.5:1 for normal text and 3:1 for large text. This is focused visual
evidence, not a full accessibility conformance certification.

Design inspection retains the approved violet, physical shadow/reflection and
photographic reading-field exceptions. The approved help and legal layouts use
a small number of purposeful room images; the generic four-picture rule is
waived rather than filling reading pages with unrelated photography. No footage
or customer proof is invented. The remaining rubric warnings and critique are
recorded in the implementation notes with the actual screenshots and reports.

## Shared public identity

`PublicBrand.module.css` owns the navigation frame, compact account header and
public footer. The navbar frame uses its own module class so older global
`.studio-nav-shell` resets cannot erase its bevel and surface. Navigation links
share a thin connecting path and expose the current page. Session controls,
theme switching and the Radix mobile menu retain their existing behavior.

`BrandMonument.tsx` places the existing local SVG logo on a shaded circular
plinth with a floor reflection. It is static vector art, with no new bitmap,
WebGL or animation dependency. The full footer combines this object with the
display typeface already loaded by the app. Account pages use its compact form.

Actual light and dark captures at 1440, 768, 390 and 320 pixels are in
`../output/public-brand-design-2026-11-18`. Run
`node tools/public-pages/review-brand.mjs` to prepare the review gallery.
