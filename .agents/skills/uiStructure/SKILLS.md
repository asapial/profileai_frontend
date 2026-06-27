---
name: profileai-ui
description: Color tokens, component patterns, layout structure, and UI rules for ProFile AI. Use this skill before writing any frontend component, page, or style in the ProFile AI Next.js project.
---

# ProFile AI — UI & Color Skill

Read this before writing any component, page, layout, or style file in the ProFile AI project. Every visual decision must trace back to a rule in this document.

---

## 1. DESIGN IDENTITY

ProFile AI is a **dark-first, AI-powered resume SaaS**. The visual language should feel:

- **Professional** — trustworthy enough for job seekers to trust their career data to it
- **Intelligent** — AI tools feel considered, not bolted on
- **Calm** — no loud gradients, no excessive motion, no rainbow palettes

The signature element is the **floating orb bubble system** — semi-transparent purple spheres layered on dark navy backgrounds. They appear on every dark section and are the single most recognizable visual motif of the product.

**Personality in one sentence:** Dark navy structure, light purple intelligence, white clarity.

---

## 2. COLOR TOKENS

Always use CSS custom properties. Never hardcode hex in component files.

### Light Mode (`:root`)
```css
:root {
  --color-bg-page:      #f8faff;
  --color-bg-card:      #ffffff;
  --color-bg-surface:   #f3f4f6;
  --color-border:       #e5e7eb;
  --color-text-primary: #1a1a2e;
  --color-text-body:    #4b5563;
  --color-text-muted:   #9ca3af;
  --color-accent:       #a78bfa;
  --color-accent-hover: #7c3aed;
  --color-badge-bg:     #ede9fe;
  --color-badge-text:   #5b21b6;
  --color-cta-text:     #ffffff;
  --color-nav-bg:       #1a1a2e;
  --color-footer-bg:    #16213e;
  --grad-hero: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  --grad-cta:  linear-gradient(135deg, #a78bfa, #7c3aed);
  --grad-bar:  linear-gradient(90deg,  #a78bfa, #c4b5fd);
}
```

### Dark Mode (`.dark`)
```css
.dark {
  --color-bg-page:      #0d0d1a;
  --color-bg-card:      #1e1e2e;
  --color-bg-surface:   #13131f;
  --color-border:       #2e2e4e;
  --color-text-primary: #f1f5f9;
  --color-text-body:    #94a3b8;
  --color-text-muted:   #475569;
  --color-accent:       #c4b5fd;
  --color-accent-hover: #a78bfa;
  --color-badge-bg:     #2d1f5e;
  --color-badge-text:   #c4b5fd;
  --color-cta-text:     #1a1a2e;
  --color-nav-bg:       #13131f;
  --color-footer-bg:    #13131f;
  --grad-hero: linear-gradient(135deg, #0d0d1a, #13131f, #1a2a4a);
  --grad-cta:  linear-gradient(135deg, #c4b5fd, #a78bfa);
  --grad-bar:  linear-gradient(90deg,  #c4b5fd, #a78bfa);
}
```

### Quick Swap Reference
| Token | Light | Dark |
|---|---|---|
| Page bg | `#f8faff` | `#0d0d1a` |
| Card bg | `#ffffff` | `#1e1e2e` |
| Surface | `#f3f4f6` | `#13131f` |
| Border | `#e5e7eb` | `#2e2e4e` |
| Text primary | `#1a1a2e` | `#f1f5f9` |
| Text body | `#4b5563` | `#94a3b8` |
| Text muted | `#9ca3af` | `#475569` |
| Accent | `#a78bfa` | `#c4b5fd` |
| Accent hover | `#7c3aed` | `#a78bfa` |
| Badge bg | `#ede9fe` | `#2d1f5e` |
| Badge text | `#5b21b6` | `#c4b5fd` |
| CTA text | `#ffffff` | `#1a1a2e` |

### Tailwind Extension
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy:   { deep: '#1a1a2e', mid: '#16213e', ocean: '#0f3460' },
        purple: { light: '#a78bfa', deep: '#7c3aed', pale: '#c4b5fd',
                  tint: '#ede9fe', dark: '#2d1f5e', badge: '#5b21b6' },
        dark:   { page: '#0d0d1a', surface: '#13131f', card: '#1e1e2e',
                  border: '#2e2e4e', blue: '#1a2a4a' },
      },
    },
  },
};
```

---

## 3. TYPOGRAPHY

```
Display / Hero headings  → Inter or Geist, 700, tracking-tight
Section headings (h2)    → Inter, 600, normal tracking
Card headings (h3/h4)    → Inter, 500
Body copy                → Inter, 400, leading-relaxed
Muted / meta text        → Inter, 400, color: --color-text-muted
Code / hex values        → Fira Code or JetBrains Mono, 400
```

**Scale (rem):**
```
Hero h1    → text-4xl / text-5xl  (2.25–3rem)
Section h2 → text-2xl / text-3xl  (1.5–1.875rem)
Card h3    → text-xl              (1.25rem)
Body       → text-base / text-sm  (1rem / 0.875rem)
Muted      → text-xs / text-sm    (0.75–0.875rem)
```

**Rules:**
- Dark section headings: always `#ffffff` or `rgba(255,255,255,.85)` — never a colored token.
- Light section headings: `--color-text-primary` (`#1a1a2e`).
- Never mix font families within a single component.
- Badge / pill labels: always `text-xs font-medium`.

---

## 4. SECTION LAYOUT & RHYTHM

Pages follow a strict alternating background pattern. **Never break this order.**

```
[DARK  — navy gradient]  Hero
[LIGHT — white        ]  Features
[GRAY  — off-white    ]  Team / Portfolio / About
[DARK  — navy solid   ]  Stats / Counter
[LIGHT — white        ]  Pricing
[GRAY  — blue tint    ]  Testimonials
[DARK  — midnight     ]  Footer
```

### Section Background Map
| Section | Light mode bg | Dark mode bg |
|---|---|---|
| Hero | `--grad-hero` | `--grad-hero` (dark values) |
| Features | `#ffffff` | `#13131f` |
| Team / Portfolio | `#f3f4f6` | `#1e1e2e` |
| Stats counter | `#1a1a2e` | `#1a2a4a` |
| Pricing | `#ffffff` | `#13131f` |
| Testimonials | `#f8faff` | `#0d0d1a` |
| Footer | `#16213e` | `#13131f` |

**Navbar:** always `#1a1a2e` in both light and dark modes — it never goes light.  
**Admin sidebar:** always `#1a1a2e` in both modes.

### Section Base Classes (Tailwind)
```tsx
// Dark section
<section className="bg-navy-deep dark:bg-dark-page py-20 px-6 relative overflow-hidden">

// Light section
<section className="bg-white dark:bg-dark-surface py-20 px-6">

// Gray/surface section
<section className="bg-gray-100 dark:bg-dark-card py-20 px-6">
```

---

## 5. FLOATING ORB SYSTEM (SIGNATURE ELEMENT)

Every dark section must include the orb layer. Use `position: absolute` on orbs, `position: relative overflow-hidden` on the parent section.

### Orb Colors
| Orb type | Light mode | Dark mode |
|---|---|---|
| Large orb | `rgba(167,139,250,.22)` | `rgba(196,181,253,.15)` |
| Medium orb | `rgba(124,58,237,.18)` | `rgba(167,139,250,.12)` |
| Small orb | `rgba(167,139,250,.10)` | `rgba(167,139,250,.08)` |
| Navy orb | `rgba(15,52,96,.55)` | `rgba(15,52,96,.40)` |

### Orb Component Pattern
```tsx
// OrbLayer.tsx — include in every dark section
export const OrbLayer = () => (
  <>
    <div className="orb orb-large"  style={{ top:'-60px',  right:'80px'  }} />
    <div className="orb orb-medium" style={{ bottom:'40px', right:'32px' }} />
    <div className="orb orb-small"  style={{ top:'40px',   left:'60%'   }} />
  </>
);
```

```css
/* globals.css */
.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: float 8s ease-in-out infinite;
}
.orb-large  { width: 180px; height: 180px; background: rgba(167,139,250,.22); }
.orb-medium { width:  80px; height:  80px; background: rgba(124, 58,237,.18); }
.orb-small  { width:  40px; height:  40px; background: rgba(167,139,250,.10); }

@keyframes float {
  0%, 100% { transform: translateY(0px);   }
  50%       { transform: translateY(-16px); }
}

@media (prefers-reduced-motion: reduce) {
  .orb { animation: none; }
}
```

---

## 6. COMPONENT PATTERNS

### 6.1 Primary CTA Button
```tsx
<button className="
  bg-gradient-to-br from-purple-light to-purple-deep
  text-white dark:text-navy-deep
  px-6 py-3 rounded-lg font-medium text-sm
  hover:opacity-90 transition-opacity
  focus-visible:ring-2 focus-visible:ring-purple-light
">
  Generate Resume
</button>
```
- Never use a flat solid color for primary CTA — always `--grad-cta`.
- CTA text in light mode: `#ffffff`. In dark mode: `#1a1a2e`.

### 6.2 Outline Button
```tsx
<button className="
  border border-purple-light/40 text-[--color-text-primary]
  px-6 py-3 rounded-lg font-medium text-sm
  hover:bg-purple-tint dark:hover:bg-purple-dark
  transition-colors
">
  Browse Templates
</button>
```

### 6.3 AI Badge / Pill
```tsx
<span className="
  bg-[--color-badge-bg] text-[--color-badge-text]
  text-xs font-medium px-3 py-1 rounded-full
">
  AI
</span>
```
- All status labels, tags, feature indicators use this exact pattern.

### 6.4 ATS Score Bar
```tsx
<div className="flex items-center gap-3">
  <div className="flex-1 h-1.5 rounded-full bg-[--color-badge-bg] overflow-hidden">
    <div
      className="h-full rounded-full"
      style={{ width: `${score}%`, background: 'var(--grad-bar)' }}
    />
  </div>
  <span className="text-sm font-medium text-[--color-accent-hover]">
    {score}%
  </span>
</div>
```

### 6.5 Feature / Resume Card
```tsx
<div className="
  bg-[--color-bg-card] border border-[--color-border]
  rounded-xl p-5
  hover:shadow-md transition-shadow
">
  <div className="w-9 h-9 rounded-full bg-[--color-badge-bg]
    flex items-center justify-center mb-3">
    <Icon className="text-[--color-accent-hover]" size={16} />
  </div>
  <h3 className="text-base font-medium text-[--color-text-primary] mb-1">
    Title
  </h3>
  <p className="text-sm text-[--color-text-body]">Description</p>
</div>
```

### 6.6 Pricing Card (Dark)
```tsx
<div className="
  bg-navy-mid dark:bg-dark-card
  rounded-2xl p-6 relative overflow-hidden
">
  {/* decorative orb */}
  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full
    bg-purple-light/20 pointer-events-none" />
  <p className="text-xs text-white/40 mb-1">Plan name</p>
  <p className="text-3xl font-medium text-[--color-accent]">
    $29 <span className="text-sm font-normal text-white/30">/mo</span>
  </p>
  <ul className="mt-4 space-y-2">
    {features.map(f => (
      <li className="flex gap-2 text-sm text-white/65">
        <span className="text-[--color-accent]">✓</span> {f}
      </li>
    ))}
  </ul>
  <button className="mt-5 w-full bg-[--grad-cta] text-[--color-cta-text]
    py-2.5 rounded-lg font-medium text-sm">
    Get Started
  </button>
</div>
```

### 6.7 Input Field
```tsx
<input className="
  w-full bg-[--color-bg-surface] border border-[--color-border]
  text-[--color-text-primary] placeholder:text-[--color-text-muted]
  rounded-lg px-4 py-2.5 text-sm
  focus:outline-none focus:border-[--color-accent]
  focus:ring-2 focus:ring-[--color-accent]/25
  transition-colors
" />
```

### 6.8 Avatar / Initials
```tsx
<div className="
  w-9 h-9 rounded-full
  bg-[--color-badge-bg] text-[--color-badge-text]
  flex items-center justify-center
  text-sm font-medium border border-[--color-border]
">
  JD
</div>
```

---

## 7. NAVBAR & SIDEBAR

```
Navbar:
  bg: #1a1a2e (both modes, fixed)
  logo text: #ffffff, font-semibold
  links: rgba(255,255,255,.7), hover → #ffffff
  active link: --color-accent
  height: 64px, sticky top-0, z-50
  border-bottom on scroll: rgba(255,255,255,.1)

Admin Sidebar:
  bg: #1a1a2e (both modes, fixed)
  width: 240px, fixed left, full height
  nav items: text rgba(255,255,255,.6), py-2.5 px-4 rounded-lg
  active item: bg --color-badge-bg, text --color-accent
  icon: 18px, mr-3
```

---

## 8. SPACING & RADIUS SYSTEM

```
Section padding    → py-20 px-6 (desktop) / py-14 px-4 (mobile)
Card padding       → p-5 (small) / p-6 (regular) / p-8 (large)
Card radius        → rounded-xl (16px) standard · rounded-2xl (24px) pricing
Button radius      → rounded-lg (8px)
Badge/pill radius  → rounded-full
Input radius       → rounded-lg (8px)
Avatar radius      → rounded-full
Modal radius       → rounded-2xl (24px)

Gap between cards  → gap-6 (desktop) / gap-4 (mobile)
Section max-width  → max-w-6xl mx-auto
```

---

## 9. DARK MODE SETUP

```tsx
// app/layout.tsx — wrap html with class toggle
<html lang="en" className={theme}>   {/* 'dark' or '' */}
  <body>...</body>
</html>
```

```tsx
// Toggle button
const toggleTheme = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
};
```

```ts
// tailwind.config.js
darkMode: 'class'   // mandatory — never 'media'
```

---

## 10. AGENT ENFORCEMENT RULES

### MUST DO
- ✅ Use CSS custom property tokens (`var(--color-*)`) in all component styles.
- ✅ Apply `--grad-cta` on every primary action button.
- ✅ Apply `--grad-bar` on every progress bar and ATS score fill.
- ✅ Include `<OrbLayer />` in every dark section.
- ✅ Use `--color-badge-bg` + `--color-badge-text` for every badge, pill, and tag.
- ✅ Follow the section rhythm: dark → white → gray → dark.
- ✅ Keep Navbar and Admin Sidebar bg `#1a1a2e` in both modes.
- ✅ Add `overflow-hidden` and `relative` on any section containing orbs.
- ✅ Use `focus-visible:ring-2 ring-[--color-accent]` on all interactive elements.
- ✅ Respect `prefers-reduced-motion` — disable orb animation.

### MUST NOT
- ❌ Never hardcode hex values (`#a78bfa`) directly in JSX/TSX or CSS.
- ❌ Never use `#e84393` or any pink value anywhere.
- ❌ Never use a flat color for a primary CTA button.
- ❌ Never apply light-mode badge tokens in dark mode (or vice versa).
- ❌ Never let the Navbar go light in light mode — it stays dark always.
- ❌ Never break the section alternating rhythm.
- ❌ Never skip the orb layer on dark sections.
- ❌ Never use `darkMode: 'media'` in Tailwind config.

### WHEN IN DOUBT
| Question | Answer |
|---|---|
| What accent color? | `var(--color-accent)` |
| Text on dark bg? | `#f1f5f9` |
| Text on light bg? | `#1a1a2e` |
| What badge style? | `--color-badge-bg` fill + `--color-badge-text` text |
| Primary action? | `--grad-cta` gradient button |
| Progress fill? | `--grad-bar` |
| New dark section? | Add `<OrbLayer />` + `overflow-hidden relative` |
| Icon bg in card? | `--color-badge-bg` circle, icon in `--color-accent-hover` |
| Unknown section bg (dark mode)? | `#13131f` |
| Unknown section bg (light mode)? | `#ffffff` |

---

*ProFile AI UI Skill · v1.0 · XeOne Bubbles · Navy + Light Purple · Light & Dark Mode*