# Access and support page redesign

The approved designs are mounted on `/contact`, `/login`, `/register`,
`/forgot-password`, `/verify-email`, and `/help/cancel-or-refund`. The matching
`/reset-password` page also uses the puppet as requested.

The existing forms own account state, validation, API calls, OAuth, uploads,
consent, referral codes, OTP expiry and resend behavior. `AccessAuthScene` only
provides the surrounding layout. Contact retains its original request payload,
consent and honeypot. The published article remains the policy source.

## Artwork and rendering

`public/art/access-pages` contains twenty optimized WebP plates: five rooms,
two themes and two device framings, about 1.10 MiB in total. They contain physical
rooms, paper, folios, plinths, floors and reflections, never actionable UI or
policy text. `art-provenance.json` records the built-in imagegen prompts and
original paths outside the public asset directory.

The password pages use a small native WebGL2 character in
`createNativePuppet.ts`, driven by the springs in `AuthPuppet.tsx`. Rounded
geometry forms the head, ears, curved forelock, padded overalls and mittens.
Procedural fleece shading and a bounded point pass add fine surface pile and
soft edges. Large glossy eyes, diffuse pink cheeks, a stitched pocket, raised P
and domed buttons follow the supplied plush reference. No character bitmap,
external model or additional rendering library is loaded.

The rig retains its pointer, password, neck and hand reactions. The scene uses
four draw calls, shared geometry, reduced fibre density on phones and a drawing
buffer capped at 560 pixels high. Visible animation runs at up to 30 fps and
pauses offscreen or in a hidden tab. Reduced motion renders immediate state
cues. The character shares one intrinsic 3:4 stage with its room, contact shadow
and reflection. SVG remains visible during initialization or if WebGL is
unavailable. The first 3D frame completes on the GPU before the SVG is hidden.

`public-tones.ts` supplies room-specific light and dark canvas colors. The room
edges fade into that canvas; forms, navigation and footer inherit the same tone.
`PublicFooter`, `AuthSiteHeader`, and the shared `Navbar1` skin provide the public
identity. The full footer includes grouped navigation and a large decorative
ProfileAI imprint; account pages use its compact variant. The layout `Footer`
wrapper also uses this component, preserving configured brand and social copy.

Portrait mobile plates preserve the original 3:4 ratio. Compact contact and
billing heroes use the entire subject side of the source banner without another
cover resize. Native copy stacks above the scene at tablet sizes. Desktop hero
height accommodates the full 3:1 image. `contain` and intrinsic frames prevent
both direct image cropping and clipping by a shorter parent.

The puppet observes focus, `type`, and control geometry, never password values.
It follows the pointer outside password controls, covers both eyes for an active
masked field, and lowers its hands to look toward the active revealed field.
Register confirmation has an independent visibility state. Reset retains its
existing shared visibility state and exposes that control beside both fields.
Keyboard focus on an eye button retains the corresponding field's pose.
Reduced motion keeps the state cues and removes idle movement and travel.

The older ambient renderer is skipped on these exact routes. Other public
pages, the homepage and two-factor routes keep their existing behavior.

## Current checks

```powershell
node tools/access-pages/verify-plush-puppet.mjs --helper <path-to-cdp.mjs>
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/auth/AuthPuppet.tsx src/components/auth/createNativePuppet.ts tools/access-pages/verify-plush-puppet.mjs
```

The plush suite checks Login, Register and Reset password at desktop, tablet and
phone widths in both themes. It validates the composed 3D image against the
empty room, GPU errors, draw and buffer limits, mask/reveal behavior, offscreen
pause, reduced motion and visible fallbacks after GPU loss or unavailable
WebGL. Captures and results live in `../output/plush-puppet-2026-11-18`.

## Historical checks

From the frontend root, using the existing zero-dependency browser helper:

```powershell
node tools/access-pages/verify.mjs --helper <path-to-cdp.mjs>
node tools/access-pages/verify-puppet.mjs --helper <path-to-cdp.mjs>
node tools/access-pages/verify-fidelity.mjs --helper <path-to-cdp.mjs>
node tools/access-pages/capture-fidelity.mjs --helper <path-to-cdp.mjs>
node tools/access-pages/review-fidelity.mjs
node tools/access-pages/review.mjs
node tools/access-pages/verify-svg-brand.mjs --helper <path-to-cdp.mjs> --out ../output/svg-brand-refinement-2026-11-18/verified
node tools/access-pages/capture-svg-motion.mjs --helper <path-to-cdp.mjs>
node tools/access-pages/review-svg-brand.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src/components/auth/AccessAuthScene.tsx src/components/auth/AuthPuppet.tsx src/components/auth/createAuthPuppetScene.ts tools/access-pages
```

The main browser suite covers seven routes at 1440, 768 and 390 pixels in both
themes. It measures native text/placeholder
contrast, validates empty forms without API mutation, and exercises field focus,
visibility, confirmation precedence, keyboard controls, OTP structure, mobile
layout, reduced motion and unavailable WebGL. Focused follow-ups cover lazy
initialization, the reset confirmation control and readable disabled states.
The separate puppet check captures both gaze directions and validation remounts.
The fidelity suite covers eight widths from 320 to 1920 pixels, both themes and
landscape. It checks source aspect ratios, painted image bounds, clipping
ancestors, the shared character stage and native-copy separation. The repair
evidence is in `../output/access-fidelity-repair-2026-11-18`; its behavioral
run covers desktop and phone in both themes.

The original implementation evidence remains in
`../output/access-page-implementation-2026-11-18`; the repaired screenshots,
reports and comparison gallery are in `../output/access-fidelity-repair-2026-11-18`.
No real sign-in, account
creation, OTP delivery, contact submission, cancellation or refund is performed
by these checks.

The earlier SVG, room-tone and shared-brand review is
`../output/svg-brand-refinement-2026-11-18/index.html`. Its verified report covers
seven routes at 1440, 768 and 390 pixels in both themes; native SVG rendering,
head tracking, mask/reveal behavior, confirmation precedence, idle movement,
reduced motion, mobile navigation and shared chrome. Additional captures check
the header at 320 pixels. Earlier reports document earlier character renderers.
