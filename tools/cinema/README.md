# Cinema tooling

Scripts that guard the scroll-driven CareerCinema story. Run them from
`profileai_frontend/`.

| Script | What it does | Needs |
| --- | --- | --- |
| `npm run test:cinema` | Compiles the pure libs with the project TypeScript: sampler invariants (resting poses at integer scene units, dense-sweep bounds/NaN guards, chapter cross-fade never blanks, dock counter monotonicity) and a structural PDF check of the scene-08 download (xref offsets, exact stream `/Length`, expected text, personalized-header + non-latin-name-fallback builds). | nothing |
| `npm run cinema:check` | Headless Chrome regression: scene index + deep-link hash at every rest pose, chapter narrative copy, rail jumps, gallery dots and arrow keys, accept/reject state, deep-link restore, auto-demo play/cancel, mid-story CTA window, the four scene-08 action rows, guest sheet header, scrubber hidden without `?scrub`, signed-in personalization via a mocked `/auth/me`, `?lang=bn` locale + pill persistence, and the world-fit scale at 1440×900 / 1920×1080 / 1024×800 / 1440×760 / 768×1024 / 844×390. Fails on any page console error. | dev server on `:3000` + Chrome |
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
