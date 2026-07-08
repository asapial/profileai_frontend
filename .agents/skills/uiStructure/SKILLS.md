# Frontend UI Skill — Premium Purple Design System

## Purpose

Use this skill file when designing or implementing the frontend UI for the ProFile AI project. The goal is to create a premium, modern, polished web application with a consistent purple-based visual identity, full support for light mode and dark mode, and a clean user experience across public, user, and admin pages.

The UI must feel professional, trustworthy, fast, and suitable for an AI-powered resume and career platform.

---

## 1. Core UI Direction

### Design Personality

The interface should feel:

- Premium
- Modern
- Clean
- Professional
- AI-powered
- Trustworthy
- Smooth and polished
- Minimal but not empty
- Elegant without being overloaded

Avoid:

- Flat boring dashboards
- Too many random colors
- Heavy gradients everywhere
- Overcrowded layouts
- Inconsistent spacing
- Unclear buttons
- Low-contrast text
- Excessive animation
- Outdated card designs

---

## 2. Brand Color System

### Primary Brand Color

Use purple as the main brand identity.

Recommended primary purple:

```css
--primary: 262 83% 58%;
--primary-foreground: 0 0% 100%;
```

Suggested purple palette:

```css
--purple-50: 270 100% 98%;
--purple-100: 269 100% 95%;
--purple-200: 269 100% 90%;
--purple-300: 269 97% 78%;
--purple-400: 270 95% 68%;
--purple-500: 262 83% 58%;
--purple-600: 263 70% 50%;
--purple-700: 263 69% 42%;
--purple-800: 263 69% 34%;
--purple-900: 264 67% 24%;
--purple-950: 265 75% 14%;
```

### Accent Colors

Use accent colors only for meaning:

- Green: success, completed, verified
- Yellow or amber: warning, usage near limit
- Red: error, destructive action, failed payment
- Blue: information, neutral system notice
- Purple: primary actions, AI features, premium highlights

Do not use many accent colors on one screen unless they communicate clear meaning.

---

## 3. Light Mode Theme

Light mode should feel bright, soft, clean, and premium.

Recommended design:

- Background: very light gray or soft purple-tinted white
- Cards: pure white or near-white
- Borders: subtle gray/purple border
- Primary buttons: purple gradient or solid purple
- Secondary buttons: white with border
- Text: strong dark slate
- Muted text: gray/slate
- Shadows: soft and low opacity

Example theme tokens:

```css
:root {
  --background: 270 30% 98%;
  --foreground: 240 15% 10%;

  --card: 0 0% 100%;
  --card-foreground: 240 15% 10%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 15% 10%;

  --primary: 262 83% 58%;
  --primary-foreground: 0 0% 100%;

  --secondary: 270 40% 96%;
  --secondary-foreground: 263 60% 30%;

  --muted: 270 25% 95%;
  --muted-foreground: 240 5% 45%;

  --accent: 270 45% 94%;
  --accent-foreground: 263 70% 35%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --border: 270 20% 88%;
  --input: 270 20% 88%;
  --ring: 262 83% 58%;

  --radius: 1rem;
}
```

---

## 4. Dark Mode Theme

Dark mode should feel premium, elegant, and modern, not simply black.

Recommended design:

- Background: deep purple-black or dark navy-purple
- Cards: slightly lighter dark surface
- Borders: subtle purple/white opacity
- Primary actions: bright purple
- Text: near-white
- Muted text: soft gray/lavender
- Shadows: soft purple glow for important cards only

Example dark theme tokens:

```css
.dark {
  --background: 264 45% 7%;
  --foreground: 270 20% 96%;

  --card: 264 35% 10%;
  --card-foreground: 270 20% 96%;

  --popover: 264 35% 10%;
  --popover-foreground: 270 20% 96%;

  --primary: 270 95% 68%;
  --primary-foreground: 264 45% 8%;

  --secondary: 264 30% 16%;
  --secondary-foreground: 270 20% 92%;

  --muted: 264 25% 16%;
  --muted-foreground: 270 10% 70%;

  --accent: 264 35% 18%;
  --accent-foreground: 270 95% 80%;

  --destructive: 0 72% 55%;
  --destructive-foreground: 0 0% 100%;

  --border: 264 25% 22%;
  --input: 264 25% 22%;
  --ring: 270 95% 68%;
}
```

---

## 5. Theme Mode Requirement

The project must support both light mode and dark mode.

### Implementation Rules

Use class-based dark mode:

```ts
darkMode: "class"
```

Use a theme provider such as `next-themes`.

Required behavior:

- User can switch between Light, Dark, and System mode.
- Selected theme must persist after refresh.
- Theme toggle should be available in the main navbar/sidebar.
- Avoid hydration mismatch in Next.js by rendering theme-dependent UI only after mount where needed.
- All pages and components must be tested in both light and dark modes.

---

## 6. Typography System

Use a modern, readable font system.

Recommended fonts:

- Primary UI font: Inter, Geist Sans, or Plus Jakarta Sans
- Optional heading font: Plus Jakarta Sans or Sora
- Code/editor font: JetBrains Mono

Typography rules:

- Page title: large, bold, clear
- Section title: medium bold
- Body text: readable and not too small
- Muted text: only for secondary information
- Avoid too many font weights
- Keep line height comfortable

Suggested scale:

```txt
Hero title: 48px–72px
Page title: 32px–40px
Section title: 24px–28px
Card title: 18px–20px
Body text: 14px–16px
Small text: 12px–13px
```

---

## 7. Layout System

### Global Layout Rules

Use consistent spacing and alignment.

Recommended spacing:

```txt
Page horizontal padding:
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px–48px

Section vertical spacing:
- Public pages: 80px–120px
- Dashboard pages: 24px–40px
- Forms: 20px–32px
```

### Maximum Widths

Use controlled content widths:

```txt
Landing content: max-w-5xl (center)
Auth cards: max-w-md
Form pages: max-w-3xl
Dashboard content: max-w-5xl(center)
Editor layout: full width with split panels
Admin tables: full width with controlled padding
```

### Grid Rules

Use:

- 12-column grid on desktop
- 2-column layouts for editors, analytics, and settings pages
- 1-column layout on mobile
- Responsive cards for dashboard widgets

---

## 8. Visual Style

### Cards

Cards should look premium and clean.

Card rules:

- Rounded corners: 16px–24px
- Border: subtle
- Shadow: soft
- Padding: 20px–28px
- Background should adapt to light/dark mode
- Use hover lift only for clickable cards

Example card style:

```tsx
className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md"
```

### Glass Effect

Use glassmorphism carefully for hero areas, floating panels, and premium AI widgets.

Example:

```tsx
className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl"
```

Do not use glass effect on every card.

### Gradients

Use purple gradients for:

- Hero background
- Primary CTA
- AI feature badges
- Premium section highlights

Example:

```tsx
className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600"
```

Avoid using gradients for normal body text.

---

## 9. Button System

### Primary Button

Use for main actions:

- Create Resume
- Generate with AI
- Export PDF
- Start Free
- Upgrade Plan

Style:

```tsx
className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-violet-700"
```

### Secondary Button

Use for alternative actions:

- Preview
- Cancel
- View Templates
- Edit

### Destructive Button

Use for:

- Delete account
- Delete resume
- Disable public link
- Ban user

Always require confirmation for destructive actions.

### AI Action Button

AI-related buttons should have a small sparkle/magic icon and purple highlight.

Examples:

- Improve with AI
- Generate Summary
- Tailor to JD
- Rewrite Bullet
- Optimize to One Page

---

## 10. Navigation System

### Public Navigation

Required items:

- Logo
- Features
- Templates
- Pricing
- Help
- Login
- Get Started button
- Theme toggle

Design:

- Transparent navbar on landing hero
- Solid or blurred navbar after scroll
- Mobile hamburger menu

### User Sidebar

Required items:

- Dashboard
- My Resumes
- Create Resume
- Templates
- Cover Letters
- JD Analyzer
- Applications
- Notifications
- Referrals
- Billing
- Profile

Sidebar rules:

- Active route highlighted in purple
- Collapsible on desktop
- Drawer style on mobile
- Use icons with labels
- Show usage mini-progress near bottom

### Admin Sidebar

Required items:

- Admin Dashboard
- Users
- Templates
- Settings
- Analytics
- Reports
- Tickets
- Help Articles
- Plans
- Coupons
- Invoices
- Audit Log
- Feature Flags
- Announcements
- Security

Admin sidebar should feel more operational and data-focused.

---

## 11. Public Page UI Plan

### Landing Page

Sections:

1. Navbar
2. Hero section
3. Feature grid
4. How it works
5. Template showcase
6. AI advantage section
7. Pricing teaser
8. Testimonials
9. FAQ preview
10. Footer

Hero style:

- Purple gradient background
- Floating blurred orbs
- Main headline
- Short subtitle
- Two CTA buttons
- Resume preview mockup on the right
- AI score badge floating over mockup

Hero message example:

```txt
Build a job-winning resume with AI.
Create, tailor, score, and export a professional resume in minutes.
```

### Pricing Page

Use three polished cards:

- Free
- Pro
- Business

Highlight Pro plan with purple border and "Most Popular" badge.

### Help Page

Use:

- Search bar
- Category sidebar
- Article cards
- Clean article reading view

### Public Resume Page

Use minimal UI:

- Resume render
- Download PDF button
- Small ProFile AI branding
- No heavy navbar

---

## 12. User Dashboard UI Plan

Dashboard should give the user a clear overview.

Required sections:

1. Greeting header
2. Profile completeness meter
3. Usage cards
4. Quick action buttons
5. Recent resumes
6. Recent applications
7. Notification preview

Premium details:

- Use stat cards with soft gradients
- Use progress bars for limits
- Use purple AI badge for AI usage
- Use empty states with CTA

Example cards:

- Resumes Created
- AI Calls Used
- Average ATS Score
- Active Applications

---

## 13. Resume Creation Wizard UI Plan

The resume wizard should feel guided and simple.

Layout:

- Left: step progress
- Center: current step form
- Right: preview or help panel where useful

Steps:

1. Template selection
2. Document type
3. Personal information
4. AI generation input
5. Preview and edit
6. ATS check
7. Export

UI rules:

- Show progress clearly
- Disable next button until required fields are valid
- Use AI loading states with clear messages
- Never lose user input
- Show usage limit before AI generation

AI loading states:

```txt
Analyzing your profile...
Reading the job description...
Structuring resume sections...
Writing strong bullet points...
Finalizing your resume...
```

---

## 14. Resume Editor UI Plan

Use a split-screen editor.

Desktop layout:

- Left panel: editable sections
- Right panel: live resume preview

Mobile layout:

- Tabs: Edit / Preview / AI / Export

Required UI elements:

- Auto-save status
- Section reorder handles
- Rich text editor
- Improve with AI buttons
- ATS score panel
- Template switcher
- Color picker
- Font selector
- Export button
- Share public link toggle
- Version history dropdown

Important states:

- Saving
- Saved
- Unsaved changes
- AI generating
- Export processing
- Public link copied
- ATS score updated

---

## 15. Admin UI Plan

Admin pages must be clean, dense, and data-focused.

Admin dashboard:

- Metric cards
- Charts
- Activity feed
- Security alerts
- Quick actions

Admin tables:

- Search
- Filters
- Pagination
- Bulk actions
- Row actions
- Status badges

Status badge colors:

- Active: green
- Banned/Failed: red
- Pending: yellow
- Draft/Inactive: gray
- Admin/Premium: purple

Admin modals:

- Edit limits
- Confirm ban
- Delete user
- Force password reset
- Template preview
- Maintenance mode warning

---

## 16. Form Design Rules

All forms must follow these rules:

- Clear labels
- Helpful placeholders
- Field-level validation
- Error messages under fields
- Loading state on submit
- Success toast after save
- Disable submit while saving
- Keep spacing consistent
- Use Zod schema validation
- Use React Hook Form

Input style:

```tsx
className="rounded-xl border bg-background px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary"
```

Do not rely only on placeholder text as labels.

---

## 17. Table Design Rules

Use tables for admin and dense data pages.

Required table features:

- Search
- Filter
- Sort where useful
- Pagination
- Loading skeleton
- Empty state
- Row actions
- Bulk selection where needed

Table pages:

- Admin users
- Admin templates
- Admin invoices
- Admin audit log
- Admin coupons
- Admin reports
- My resumes table view
- Cover letters list

---

## 18. Modal and Drawer Rules

Use modals for focused confirmation or short forms.

Use drawers for:

- Report detail preview
- User detail quick view
- Resume analytics panel
- Mobile filters
- Support ticket detail on smaller screens

Confirmation modals are required for:

- Delete resume
- Delete cover letter
- Delete account
- Ban user
- Disable public link
- Enable maintenance mode
- Revoke API key
- Restore old template version

---

## 19. Loading, Empty, and Error States

Every page must have proper UI states.

### Loading State

Use skeletons, not blank screens.

### Empty State

Empty states must include:

- Friendly message
- Short explanation
- Clear CTA

Example:

```txt
No resumes yet.
Create your first AI-powered resume and start applying with confidence.
[Create Resume]
```

### Error State

Error states must include:

- What went wrong
- Recovery action
- Retry button where useful

Avoid raw technical errors in UI.

---

## 20. Accessibility Rules

Follow WCAG-friendly design.

Required:

- Keyboard navigation
- Visible focus states
- Proper color contrast
- Semantic HTML
- ARIA labels for icon-only buttons
- Form labels connected to inputs
- Dialog focus trap
- Escape closes modal
- Screen-reader friendly status messages

Do not use color alone to communicate status.

---

## 21. Animation and Microinteraction Rules

Use animation carefully.

Good uses:

- Button hover
- Card hover
- Modal open/close
- Toast entry
- AI loading sequence
- Page transition
- Progress bar movement

Avoid:

- Slow animations
- Too many moving elements
- Distracting backgrounds
- Animation on dense admin tables

Recommended tools:

- Framer Motion for page and component transitions
- CSS transitions for simple hover states

Animation duration:

```txt
Fast hover: 150ms
Modal transition: 200ms
Page transition: 250ms
AI loading animation: subtle loop
```

---

## 22. Component Library Plan

Use shadcn/ui as the base component system.

Required components:

- Button
- Card
- Badge
- Input
- Textarea
- Select
- Dialog
- Sheet
- Dropdown Menu
- Tabs
- Accordion
- Table
- Tooltip
- Toast/Sonner
- Progress
- Skeleton
- Avatar
- Separator
- Command/Search
- Calendar/Date Picker

Build custom components:

- ThemeToggle
- Logo
- AppSidebar
- AdminSidebar
- ResumePreview
- ResumeCard
- ATSScoreGauge
- UsageProgress
- AIActionButton
- TemplateCard
- PricingCard
- NotificationBell
- EmptyState
- ConfirmDialog
- StatCard
- SectionEditor
- Stepper
- FileUploadDropzone

---

## 23. Tailwind Configuration Guidelines

Use Tailwind tokens and CSS variables instead of hardcoded colors.

Required:

- Dark mode class strategy
- CSS variables for colors
- Consistent radius
- Container setup
- Custom box shadows
- Purple glow utilities if needed

Example shadow tokens:

```css
--shadow-soft: 0 10px 30px rgba(15, 23, 42, 0.08);
--shadow-purple: 0 20px 60px rgba(124, 58, 237, 0.25);
```

Avoid:

- Random hex colors inside components
- Repeated custom spacing values
- Inline styles unless absolutely necessary

---

## 24. Responsive Design Rules

Breakpoints:

- Mobile: 320px–767px
- Tablet: 768px–1023px
- Desktop: 1024px+
- Large desktop: 1280px+

Rules:

- All pages must work on mobile.
- Dashboard cards stack on mobile.
- Sidebar becomes drawer on mobile.
- Resume editor uses tabs on mobile.
- Tables become horizontally scrollable or card-based on mobile.
- Modals should fit small screens.

---

## 25. AI Feature UI Rules

AI features should be visually distinct but not gimmicky.

Use:

- Sparkle icon
- Purple accent
- Small explanation
- Loading sequence
- Result preview
- Apply / Reject actions

AI output should never silently replace user content.

Required AI interaction pattern:

1. User clicks AI action.
2. Show what will happen.
3. Generate result.
4. Show preview.
5. User chooses Apply, Regenerate, or Cancel.

---

## 26. Security-Related UI Rules

Security-sensitive actions must be clear.

For dangerous actions:

- Use red/destructive styling
- Require confirmation
- Explain consequence
- Ask for password or typed confirmation where needed

For account deletion:

- Show irreversible warning
- Require typed confirmation
- Require password
- Offer data export first

For admin actions:

- Show audit warning for impersonation, deletion, banning, role change, and maintenance mode.

---

## 27. Page-Level Design Checklist

Before a page is considered complete, verify:

- Light mode works
- Dark mode works
- Mobile layout works
- Loading state exists
- Empty state exists
- Error state exists
- Form validation exists
- Accessibility basics are handled
- Buttons have clear hierarchy
- Data actions have feedback
- Destructive actions have confirmation
- Colors use theme tokens
- No hardcoded random colors
- UI matches premium purple brand style

---

## 28. Recommended File Structure

Use this frontend structure:

```txt
apps/web/
  app/
    (public)/
    (auth)/
    (user)/
    (admin)/
  components/
    ui/
    layout/
    common/
    resume/
    templates/
    dashboard/
    admin/
    billing/
    forms/
  hooks/
  lib/
  stores/
  styles/
  types/
```

Suggested files:

```txt
components/layout/public-navbar.tsx
components/layout/user-sidebar.tsx
components/layout/admin-sidebar.tsx
components/common/theme-toggle.tsx
components/common/empty-state.tsx
components/common/confirm-dialog.tsx
components/resume/resume-preview.tsx
components/resume/section-editor.tsx
components/resume/ats-score-gauge.tsx
components/templates/template-card.tsx
components/dashboard/stat-card.tsx
components/admin/admin-data-table.tsx
```

---

## 29. Final UI Goal

The final product should look like a polished SaaS platform for AI-powered career tools.

The visual identity must be:

- Purple-first
- Premium
- Modern
- Responsive
- Clean
- Accessible
- Professional
- Consistent in light and dark mode

Every page should feel like it belongs to the same product.
Every feature should be easy to understand.
Every AI action should feel powerful but controlled.
Every admin action should feel safe, clear, and auditable.
