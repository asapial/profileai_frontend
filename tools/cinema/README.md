# Cinema tooling

Scripts that guard the scroll-driven CareerCinema story. Run them from
`profileai_frontend/`.

## Current homepage presentation

- Scene 3 uses the approved layered neural graph: 8 evidence inputs, three
  intermediate layers, and 6 resume outputs (40 neurons, 273 connections).
  Selecting an input or output traces its source and updates the evidence detail.
  Keyboard selection is supported; phones use a source picker and a vertical
  graph so labels retain their readable size.
- The graph samples the existing chips, mesh and output anchors in screen space.
  Its geometry follows scroll in both directions. Labels appear after the
  neurons settle, and the output nodes return to the alignment cards in scene 4.
  The reading layout remains available for reduced-motion visitors.
- Scene 4 keeps the approved five evidence cards and one Job description panel.
  Four curved, port-anchored routes show supported matches; the missing-evidence
  requirement has no route. Card/requirement selection updates the source detail.
  The graph's output anchors become the card ports during the handoff. The
  panel enters after those cards start forming, and the scene retires into the
  tailoring workbench. Portrait phones use an evidence selector above
  the same five-row job panel. No match percentage or hiring prediction is shown.
- Scene 5 uses the approved tailoring workbench: original wording and two source
  evidence rows on the left, a compact AI node, and an evidence-highlighted
  suggestion on the right. Accept/reject keeps the existing preview behavior.
  The alignment cards converge into source evidence while its job panel becomes
  the suggestion surface. Both directions share the same scroll clock. Phones
  stack the workbench; short portrait screens switch between the original and
  evidence in a compact input selector, leaving the review actions readable.
- Scene 6 uses seven unchanged catalog layouts on a live reflective floor.
  Kinship, Gridline, Harbor, Orbit, Apex, Editorial Cut and Oblique share the
  same illustrative Frontend Engineer content. Named choices, arrow keys,
  touch swipes and a compact native selector all choose the actual document.
  The choice carries into assembly. Accepting the preceding AI suggestion
  updates the preview wording; rejecting it preserves the original.
- The suggestion panel and selected paper share one scroll clock and matching
  screen-space bounds. Side papers fan out as the floor appears; reversing
  scroll reverses the handoff. Gallery exit converges on the assembly paper.
- Three.js loads near the gallery and draws only when something changes.
  A native HTML/CSS gallery keeps the floor and mirrored papers available
  when WebGL cannot initialize. Paper images stay light in either theme;
  the room, lighting, controls and selection colors follow the active theme.
- Scene 7 uses the approved assembly composition: five source cards on the
  left, the selected catalog resume in the center, and one live progress panel.
  Source status, progress, traveling content and section highlights share the
  scroll sampler. At the resting scene, two sections are placed and Projects
  is arriving; all five finish before the next scene. Inspection never changes
  the completion counter.
- Gallery and assembly share one WebGL canvas, paper and reflective floor.
  A camera move keeps the document grounded as the other gallery papers leave.
  The actual A4 HTML supplies each section's bounds in a script-free isolated
  frame. Both the page and its mirror reveal those exact sections. HTML/CSS
  retains the paper, floor and mirrored fallback without WebGL.
- Phones use a labeled section selector and one compact progress panel.
  Tablet status sits below the paper. Native keyboard inspection, reverse
  scrolling, personal/accepted wording and all seven layouts are retained.
- Scene 8 keeps the same selected paper and live mirror, and raises a round
  physical dais beneath the completed A4 resume. The camera settles lower as
  the source cards become the review checks and download actions. The paper,
  podium and floor share one reversible scroll clock; no second document is
  crossfaded into the scene.
- The final preview uses solid light/dark review and export panels. Enlarge
  preview opens a native modal with an unwarped 210:297 A4 page, keyboard focus
  containment and Escape/close focus restoration. Change template returns to
  the actual gallery. The four existing output actions remain available;
  smaller screens use a compact export panel next to or below the podium.
- The real paper plane and downloaded illustrative PDF are both A4
  (210 × 297 mm). The homepage PDF keeps its existing text-based sample
  content; the on-screen catalog preview keeps the selected layout and any
  accepted wording. The WebGL fallback retains a raised cylinder, paper,
  reflective floor and the same native controls.
- The first reading section, "Your words. Your evidence.", uses the approved
  claim/source inspector and three principles. A measured SVG connects the
  highlighted metric to its native source disclosure; View source opens the
  existing illustrative quote and moves keyboard focus to it. Phones and
  tablets keep their normal reading height. Both themes use solid, readable
  panels, with violet floor traces carrying the cinema's visual language.
- That section rises into the final fading floor with a short background
  blend. The film's scroll allocation and shared room stay unchanged. Reverse
  scrolling restores the same composition; reduced-motion reading keeps
  zero overlap and no entrance animation.

- Nine reading environments continue that visual language through the footer.
  Workspace has four keyboard-selectable stages, the product workbench has
  three inspectable views, and the narrative carries the same evidence into
  the next conversation. The reading gallery shows actual Kinship, Orbit and
  Editorial Cut A4 assets, with a matching personalized catalog preview at
  the closing CTA. Plan prices/allowances, existing routes and authentication
  behavior are retained. The duplicate "What's included." table is removed;
  the three original pricing plans remain. FAQ uses the native
  Radix accordion. Solid light/dark panels and restrained scroll entrances
  share ReadingSections.module.css; reduced motion keeps all content visible.
- Each section has its own theme-aware native scenery: archival source papers,
  a blue neural floor, a graphite inspection desk, teal journey contours, a
  fluted template studio, three pricing platforms, folded FAQ paper, a round
  closing dais, and a dimensional wordmark over a satin network horizon.
  SectionEnvironment uses locally rendered physical 3D rooms: a perspective
  camera, studio lighting, shadow maps, beveled solids and a planar mirror.
  Each room has independent light/dark and portrait plates. The UI remains
  native HTML; the reading zone adds no runtime canvas or animation loop.
  Rectangular pricing platforms and the closing cylinder are transparent 3D
  renders sized to the actual cards/paper. Quiet ink fields and edge masks
  protect captions and join the rooms without flattening the visible floor.
- The first five cinema scenes now retain a visible physical floor. Their
  backgrounds use the existing scroll clock in both directions; the graph
  has a quieter violet room so a second network does not cross its labels.
  Gallery, assembly and export share a live beveled arch, fluting, studio
  light and reflected architecture inside the existing WebGL renderer.
  The existing HTML fallback retains the rendered studio when WebGL fails.

- The cinema and reading sections use solid, coordinated light/dark surfaces,
  readable text, and flat controls. Sphere shading and the cinema floor retain
  the depth cues of the 3D story.
- The reading sections show source evidence, workflow rows, resume examples,
  plans, FAQ, and a closing resume preview. Sample content is illustrative.
- Static sections keep their natural heights. Scroll-linked entrances move
  individual heading/content groups without fading text or changing the page
  height as sections enter the viewport.
- Home navigation and the mobile sheet share the same theme colors. These
  overrides are scoped to the homepage.
- Earlier implementation notes below are historical. The corner controls,
  progress dots, scene numbers, decorative bridge, glass cards, and static
  section `content-visibility` placeholders are no longer part of the page.

Check the reading section at desktop, tablet and phone sizes, in both themes:

```text
node tools/cinema/verify-trust.mjs --helper <path/to/cdp.mjs> --out ../tmp/trust-review --all
node tools/cinema/verify-reading.mjs --helper <path/to/cdp.mjs> --out ../tmp/reading-review --all
node tools/cinema/verify-depth.mjs --helper <path/to/cdp.mjs> --out ../tmp/depth-review
node tools/cinema/render-environments.mjs --helper <path/to/cdp.mjs>
```

The harness checks text contrast, clipping, route alignment after resizing,
native keyboard disclosure/focus, real scroll handoffs in both directions,
shared-canvas continuity and reduced motion. The source remains the existing
illustrative Lighthouse excerpt; no report download or backend link is added.
The trust harness checks the first environment at seven viewport sizes in both
themes (14 section views). The reading harness checks the other eight at those
sizes (112 section views), plus keyboard tabs, FAQ, image loading, full-width
background placement, nine distinct environments, removal of the comparison
table, unchanged plan prices, existing guest routes and reduced motion.
Headlines use actual glyph rows;
padded accordion headers are not mistaken for multiple lines of text.

The depth harness checks all eight cinema scenes on desktop and portrait
phone in both themes (32 resting views), plus 36 forward/reverse transition
samples. It decodes the active physical plate and checks the last three
scenes' live studio/reflection. The artwork generator rebuilds the 44 WebP
plates/platforms under public/art/environments-v2, with a source inventory.
These are only backgrounds and physical props; no text or controls are baked
into the room plates. Existing illustrative catalog papers supply the source
archive textures; the actual UI templates remain separate selectable papers.

| Script | What it does | Needs |
| --- | --- | --- |
| `npm run test:cinema` | Compiles the pure libs with the project TypeScript: sampler invariants (resting poses at integer scene units, dense-sweep bounds/NaN guards, chapter cross-fade never blanks, dock counter monotonicity) and a structural PDF check of the scene-08 download (xref offsets, exact stream `/Length`, expected text, personalized-header + non-latin-name-fallback builds). | nothing |
| `npm run cinema:check` | Headless Chrome regression: scene index + deep-link hash at every rest pose, chapter narrative copy, rail jumps, named catalog choices and arrow keys, accept/reject state, deep-link restore, auto-demo play/cancel, mid-story CTA window, the four scene-08 action rows, guest sheet header, scrubber hidden without `?scrub`, signed-in personalization via a mocked `/auth/me`, `?lang=bn` locale + pill persistence, and the world-fit scale at 1440×900 / 1920×1080 / 1024×800 / 1440×760 / 768×1024 / 844×390. Fails on any page console error. | dev server on `:3000` + Chrome |
| `npm run cinema:shots` | Writes review JPEGs (`.cinema-shots/sceneNN.jpg`) plus a DOM probe log for every scene. | dev server on `:3000` + Chrome |

`node tools/cinema/audit-responsive.mjs --out .cinema-audit --overflow|--zones --sizes 390x844,768x1024,…`
reports horizontal-overflow offenders per viewport (visible elements whose rect leaves
the frame) and, with `--zones`, writes one JPEG per product-zone selector (trust,
workspace, allowances, pricing, faq, bottom CTA, footer) per viewport.

Options (both browser scripts): `--url`, `--w`, `--h`, `--theme dark|light`,
`--scene N` (repeatable), `--chrome <path>` (defaults to the standard Windows
Chrome install), `--port`.

When retiming the story, keep scene rests on integer scene units — the sampler
test enforces it. `regression.mjs` expects the page at `/` to be the story
landing page; pass `--url` for anything else.

To refresh the gallery from the project's catalog, run
`node tools/cinema/sync-template-showcase.mjs`, followed by
`node tools/cinema/render-template-assets.mjs`. The first snapshots the seven
HTML/CSS layouts with SHA-256 hashes; the second renders their cacheable PNGs
using installed Chrome (`CHROME_PATH` overrides the default). Production does
not need a running backend to show the gallery. Personal previews use the same
catalog layouts and escaped shared interpolator. The text-based illustrative
PDF download now uses A4 media dimensions.

To audit the final podium scene, run
`node tools/cinema/verify-preview.mjs --helper <cdp.mjs> --out <directory> --all --park`.
The compatible CDP helper is provided by the design-taste-frontend skill.
This checks both themes at nine viewport sizes plus EN/BN cases, text contrast,
clipping and collisions, live reflections, native modal keyboard behavior and
the enlarged page's A4 ratio. `--fallback --park` disables WebGL. `--smoke`
uses real scrolling and checks the handoff, all seven choices, accepted text,
Change template, share feedback and the downloaded PDF's physical A4 size.
`--park` uses the existing development scrubber for repeatable static poses;
it does not substitute for the native scrolling checks.

## Story controls added in the P1 pass

- **Auto-demo** — the hero's "Play the story" button scrolls the whole story in
  ~42s; any wheel/touch/pointer/key input cancels it.
- **Mid-story CTA** — a "Start free" pill that only exists while scenes 4–6 hold.
- **Scene-08 actions** — "Download PDF" builds a real one-page PDF client-side
  (`src/lib/resume-pdf.ts`, no dependencies); "Share resume" uses the native
  share sheet or copies the deep link; the app rows route to `/register`.
- **Quality tiers** — the loop tracks a frame-time EMA and sets
  `data-quality="lite"` on the stage when frames run past ~26ms, dropping
  particles/blur/backdrop-filter (never content). Throttled background frames
  (>120ms) are ignored so a background tab can't demote the visuals.
- **Dev scrubber** — open the page with `?scrub` in development to park the
  story on any scene unit and inspect any mid-transition frame.
- **Analytics** — story events go through `src/lib/analytics.ts` to
  `POST /api/analytics/events` (`career_story_*`: scene_view, template_select,
  review_decision, cta_click, download, share, demo, quality, locale).

## P2: personalization, mobile lite, story i18n

- **i18n** — `src/lib/story-i18n.ts` holds the `STORY_COPY` tree (en + bn).
  Film chrome, chapter narratives, captions and narration switch; in-world
  sample documents stay in English. `?lang=en|bn` wins once without
  persisting; the language pill persists to `profileai:story-locale`
  (localStorage) and is tracked as `career_story_locale`. The cinema root
  carries `lang` for a11y; bn numerals (০১–০৮) come from `bengaliDigits`.
- **Personalization** — `src/lib/story-identity.ts` mirrors the navbar's
  `["current-user"]` react-query, guests keep the illustrative identity.
  Signed-in: sheet header name/email, hero note, scene-08 status variants,
  share title/text and the downloadable PDF
  (`downloadResume(identity)` in `src/lib/resume-pdf.ts`; non-WinAnsi names
  fall back to a placeholder).
- **Mobile film + lite** — the film renders on phones as well (no width gate;
  only `prefers-reduced-motion` swaps to the reading layout). World-fit gains
  phone steps (≤719 → 0.6, ≤479 → 0.32), the ≤899 step (0.68) and short-window
  caps (≤520 → 0.62, ≤430 → 0.55) stay. Touch pointer parallax is ignored, and
  cells that report `maxTouchPoints > 1` or start below 900px wide boot into
  `data-quality="lite"`; the frame-time EMA can still promote them.

## P3a: scroll speed pass

- `RUNWAY = SCENE_COUNT + 2` (was +4): the story scrolls 25% faster with two
  breathing viewports.
- `MOTION.driveTau` 150ms → 90ms: the camera answers scroll input sooner.
- Global `scroll-behavior: smooth` dropped (`src/styles/base.css`); smoothness
  stays only where code asks (the story's `jumpTo`).
- Per-frame budget: the film rect is cached (document-space top + height via
  `ResizeObserver`, no layout read per frame), particles 28 → 18, ambience
  blur 64px → 46px (32px lite), panel `backdrop-filter` only while
  `data-live="1"`, `.stage { contain: layout paint }`,
  `.world { will-change: transform }`.

## P3b: handoff + reading-zone pass

- **A1 exit** — over the film's final scene unit the world scales back ~12%
  and lifts while `data-exit="1"` fades the persistent chrome (rail, meta row,
  skip link, ambience). Resting poses and the regression probes at p=7 are
  untouched; scrolling back re-runs everything.
- **A2 floor bridge** — `.static-zone::after` continues the cinema floor: a
  horizon line up top with a purple wash fading over one viewport height.
- **A3 entrances** — where `animation-timeline: view()` exists, reading-zone
  sections rise with scroll linkage and reverse on scroll-up; elsewhere they
  simply render. `story-page--reduced` and reduced-motion skip it.
- **A4 spine** — `StoryProgress.tsx` fixes a right-edge rail with the page
  progress fill, eight chapter ticks and one tick per reading-zone section
  (labels come from each section's own `<h2>`). It goes dormant while the film
  is alive, because the cinema rail owns that edge.
- **A6 CTA path** — `BottomCtaAndFooter` reuses the story identity: signed-in
  visitors see their name on the preview sheet and route to `/resume/create`;
  guests see Alex Morgan and route to `/register`.
- **B5/B6** — `content-visibility: auto` + `contain-intrinsic-size` on the
  static-zone sections; `PricingSection`, `FaqSection`, `BottomCtaAndFooter`
  split into their own chunks via `next/dynamic` (SSR stays on for SEO).
- **B7** — regression grew to 104 checks: 1:1 scroll behavior, the exit
  handoff both ways, C-V + view() timing, bridge, spine tick count, guest CTA
  route, and the personalized bottom-CTA path. A5 (rail extension) stays
  deliberately skipped — the cinema rail plus spine already cover navigation.

`tools/cinema/.build/` and `.cinema-shots/` are throwaway artifacts and are
git-ignored.

## Scene clarity and compact composition

- Corner metadata, the language pill in the film, pause/skip controls, chapter
  numbers and the page progress dots have been removed. Language selection
  remains in the reduced-motion reading layout and through `?lang=en|bn`.
- Evidence nodes turn into cards through scroll-owned material values rather
  than timed CSS fades. Reversing scroll reverses the same transformation.
- Each scene transition has more scroll travel. The camera uses less tilt,
  parallax and ambient drift, while solid surfaces keep text distinct in both
  light and dark themes.
- Portrait phones use `sampleCompactPose` and `COMPACT_CAMERA_KEYS` to reframe
  the same objects. Cards, review panels and output actions stay inside the
  viewport; the selected template remains available through the carousel.
- Assembly blocks stay visible until arrival, and the section count advances
  when a block reaches the document. Lines retire with their connected objects.
- `verify-samplers.mjs` checks compact poses, material ranges and docking order.
  Capture and browser regression read scroll allocation from the scene source
  and account for the film's document offset.

## Copy pass: SaaS wording + chrome

The landing page read like a case study in places; the chrome now speaks
product. Navbar (≥900px) shows Product / Pricing / FAQ links that smooth-scroll
into `#static-zone`, `#pricing-title`, `#faq-title` (the numbered story pill is
gone; the brand may ellipsize but the CTA never truncates). The film meta row
keeps the locale pill and moves the skip link to its right edge (no more
floating pill, no `01 / 08` counter); the right rail is dots + hover labels
only. Scene badges and the reading layout keep their 01–08 numerals — those are
part of the reference stage art. Trust cards, FAQ triggers and the tailoring
panel kickers lost their decorative numbers (“01 / Your words” → “Your words”,
etc.); kickers renamed (“TRUTH & CONTROL” → “WHY PROFILEAI”, “CAREER STUDIO” →
“PLANS AT A GLANCE”, “YOUR NEXT CHAPTER” → “GET STARTED”), heading “Monthly
allowances.” → “What's included.”, bridge “FROM CAREER STORY TO CAREER
SYSTEM” → “THE PRODUCT”, footer columns “THE STUDIO / THE DETAILS” → “PRODUCT /
COMPANY”, hero CTAs “Build my resume / See how it works / Play the tour”. bn
copy mirrors all of it; the meta row hides its “ProfileAI /” prefix under 520px
so the row stays one line.

## Responsive hardening

- Allowances switch to the stacked-card layout at ≤780px (was ≤620), so
  landscape phones and small tablets never get a sideways-scrolling table.
- New `@media (max-height: 540px)` compresses the film chrome (chapter top,
  smaller h2/badge, hidden hero note, smaller rail buttons, tighter meta row,
  caption/gallery/mid-CTA raised) — landscape phones and short windows no
  longer stack the CTA on the meta row or push the rail under the navbar.
- Navbar CTA is `white-space: nowrap; flex: none`; the brand truncates first.

## Scene-fidelity pass (structure, not color)

- Floating bokeh spheres (screen-space `.bokeh` layer, 6 blurred-glass balls,
  drifting; disabled at lite quality) add the reference stages' background
  depth.
- Scene 8: the finished sheet stands on a glowing plinth (`.pedestal`, visible
  only at `data-scene="7"`, fades on exit) and the action panel gains a
  PDF/DOC/in file-tile row.
- Scene 2: camera parked 70px further right and the “Experience” node pulled
  in, so the outer cluster orbs/labels sit inside the frame at 1440.

## Live assembly visual verification

Run the local acceptance harness with the zero-dependency CDP helper supplied
by the installed design-taste-frontend skill:

```text
node tools/cinema/verify-assembly.mjs --helper <path/to/design-taste-frontend/scripts/lib/cdp.mjs> --out ../tmp/assembly-review
node tools/cinema/verify-assembly.mjs --helper <path/to/cdp.mjs> --out ../tmp/assembly-layouts --all --park
node tools/cinema/verify-assembly.mjs --helper <path/to/cdp.mjs> --out ../tmp/assembly-fallback --fallback --park
```

The normal run exercises real scroll handoffs, all seven templates, native
section inspection and accepted text. --park uses the existing development
scrubber to inspect exact static scene poses at every viewport; the developer
toolbar alone is hidden for those screenshots. The source/region/progress
checks and judging thresholds remain unchanged. --all covers nine English
viewport sizes in both themes, plus Bengali desktop and short phone.

The gallery/assembly remains an illustrative homepage story. It does not
change backend assembly, stored resumes, or the existing text-based PDF export.
