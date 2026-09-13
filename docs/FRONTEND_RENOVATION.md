# Frontend renovation

## Design direction

Purple remains the brand color, as requested. The new visual system uses pale lavender surfaces, plum text, restrained purple actions, editorial serif headlines and quieter borders. Light and dark modes share the same hierarchy. Success, warning and destructive states retain semantic colors.

## Findings and changes

- The shipped homepage repeated its pitch across 18 sections. The studio now uses seven: introduction, process, tools, templates, pricing, FAQ and a closing invitation. The duplicate carousel, mock metrics, testimonials and repeated CTA bands are no longer in the page composition.
- Replaced the generic glow backdrop with a resume-led composition. Three.js draws decorative paper layers, GSAP stages the introduction, AOS introduces sections, and Framer Motion handles the resume interaction. The readable document is HTML. Reduced-motion and small-screen fallbacks remain usable without WebGL. GPU resources, observers and listeners are disposed on unmount; the scene stops rendering when settled, hidden or offscreen.
- Consolidated public navigation. Removed generic social-site links, the misleading newsletter signup promotion and duplicated pricing/product destinations. Mobile navigation closes after choosing a destination, and a skip link reaches the main landmark.
- Restored public template browsing instead of redirecting visitors to login. Added document-type filters, search, accurate counts and a clear no-results state. Customization still goes to the protected workspace. The backend public template endpoint already limits detail responses to active, approved templates.
- The template choice now survives the login redirect. Authenticated workspace and admin routes remain gated.
- Reorganized the user dashboard around recent resumes and applications, with profile completion and usage alongside them. Removed the static live-status badge, redundant header create action, duplicate inbox shortcut, notification preview and unconditional upgrade prompt. Secondary tools use disclosure navigation.
- Standardized shared cards, fields, buttons, sidebar, header and theme tokens across user and admin pages. The profile page uses the same system without a second animation initializer.
- Added explicit query-error/retry states to analytics, applications, billing, exports, referrals, notifications and cover letters. Added dashboard loading and dashboard/admin error boundaries, plus a designed not-found page.
- Improved form labels and page headings. Application rows link to details; duplicate status labels are removed; removal requires an in-app confirmation and reports failure. Billing actions disable while pending and invoice icon links have accessible labels.
- Renamed the job-description tool to Role insights where it was previously described as a resume score. Existing ATS functionality within the resume editor is preserved.
- Added a visual homepage editor for administrators: brand fields, expandable section forms, visibility controls, headings, descriptions and CTA fields. The advanced JSON editor is collapsed and schema-validated. Saving and publishing still use the existing backend workflow. Retired homepage sections do not render; public navigation is deliberately curated.
- The assistant loads only in the workspace, admin area and help center, reducing public-page clutter and unnecessary loading.
- Upgrading shipped homepage copy preserves independently authored descriptions, buttons, custom items and section visibility. No stored CMS content was published by this renovation.

## Verification

- Final production TypeScript check passed.
- Final production build passed: all route bundles compiled and 51 static pages generated.
- Final full-project ESLint check passed with no errors.
- `node --test scripts/studio-homepage.test.mjs`: three regression tests passed, covering shipped defaults, independently authored CMS fields, and unrelated sections.
- `node scripts/smoke-frontend.mjs`: twelve checks passed. Nine public pages return 200 with a main landmark and exactly one H1; dashboard/admin routes require login; customization return URLs preserve their query string.
- Browser checks: desktop and 390px mobile homepage, light/dark purple themes, no mobile horizontal overflow, public collection search and no-results recovery, CV filtering, template detail layout, and mobile menu opening/closing. No browser console errors were observed on the checked purple homepage.

## Verification limits

Signed-in user/admin interaction tests require a valid test session. No authenticated session was available in the preview browser. Protected-page data mutations, payments, exports and publishing were not executed. Shared route builds and authentication boundaries were checked; this is not a claim that every authenticated screen was visually exercised with live data.

Existing uncommitted work was preserved. Resume content rendering and backend business rules were not replaced by mock data.

## Route inventory (61 source pages)

The following source routes participate in the shared frontend design system. Dynamic record pages require an existing record and, where applicable, an authenticated session for visual verification.

- `/[slug]`
- `/admin/analytics`
- `/admin/announcements`
- `/admin/audit-log`
- `/admin/billing`
- `/admin/coupons`
- `/admin/exports`
- `/admin/feature-flags`
- `/admin/help-articles`
- `/admin/homepage`
- `/admin/invoices`
- `/admin/moderation`
- `/admin`
- `/admin/plans`
- `/admin/profile`
- `/admin/reports`
- `/admin/resumes`
- `/admin/security`
- `/admin/settings`
- `/admin/templates/[id]/edit`
- `/admin/templates/create`
- `/admin/templates`
- `/admin/tickets`
- `/admin/users/[id]`
- `/admin/users/invite`
- `/admin/users`
- `/dashboard/analytics`
- `/dashboard/applications/[id]`
- `/dashboard/applications`
- `/dashboard/ats`
- `/dashboard/billing`
- `/dashboard/cover-letters/[id]`
- `/dashboard/cover-letters`
- `/dashboard/exports`
- `/dashboard/notifications`
- `/dashboard/profile`
- `/dashboard/referrals`
- `/dashboard/resume/[id]/edit`
- `/dashboard/resume/create`
- `/dashboard/resumes/new`
- `/dashboard/resumes`
- `/dashboard/settings`
- `/dashboard/support`
- `/dashboard/templates`
- `/dashboard`
- `/forgot-password`
- `/help/[slug]`
- `/help`
- `/login/2fa`
- `/login/2fa/setup`
- `/login`
- `/`
- `/pricing`
- `/r/[slug]`
- `/register`
- `/reset-password`
- `/resume/[id]/edit`
- `/resume/create`
- `/templates/[id]`
- `/templates`
- `/verify-email`
