# Claro Design System

**Claro** is a multi-tenant property-cleaning scheduler built for short-term-rental operations. It serves three roles from one codebase:

- **Property Owners** (30–40 users) — manage their own properties, bookings, and turnover schedules
- **Business Admin** (1 user) — system-wide operations, cleaner assignment, cross-client reporting
- **Cleaners** (10–20 users) — view assigned cleanings and daily schedules

The product is a Vue 3 + Vuetify 4 + Supabase PWA. Signature features: a **Turn Priority system** (same-day checkouts auto-flagged urgent), role-based code splitting, a master calendar with color-per-property event bars, and mobile-first layouts that degrade gracefully to dense desktop admin tables.

---

## Sources

This system was distilled from the following, all attached by the user:

- **Codebase:** `github.com/Sorenv6543/claro4@main` (private) — Vue 3 / Vuetify 4 / Pinia / Supabase / FullCalendar. Key files referenced:
  - `src/styles/tokens.css` — canonical design token file (colors, spacing, radii, shadows)
  - `src/plugins/vuetify.ts` — Vuetify theme + global component defaults
  - `src/styles/main.scss` — card shadow override, page-header pattern, micro-animations
  - `src/styles/variables.scss` — Vuetify SASS overrides (Inter, `$border-radius-root: 2px`)
  - `src/styles/calendar-tokens.css` — FullCalendar event styling
  - `CLAUDE.md` — elevation rules, component defaults, card-variant semantics, MDI icon usage
  - `public/pwa-icon.svg` — original (legacy "CleanSync" blue icon; brand has since evolved to "Claro" purple)
- **Screenshots:** 49 screenshots of the running app covering the Owner interface (Overview, Properties, Calendar, Bookings, Reports, Settings) and the Admin interface (Dashboard, All Properties, All Bookings, Users, Cleaners).

---

## Index

Root files:
- `README.md` — this file
- `colors_and_type.css` — CSS variables and semantic type/color rules; import this in any HTML mock
- `SKILL.md` — agent-skill manifest (cross-compatible with Agent Skills)
- `fonts/` — Inter 400/500/600 subset (loaded from Google Fonts CDN in `colors_and_type.css`)
- `assets/` — logo marks, PWA icon, property-color swatches
- `preview/` — design-system tab cards (atomic swatches, type specimens, components)
- `ui_kits/claro-owner/` — Owner interface UI kit (mobile + desktop)
- `ui_kits/claro-admin/` — Admin interface UI kit (desktop)

---

## Content Fundamentals

**Voice.** Direct, informative, sparing. Never marketing. Never cute. Headings name the thing ("My Properties", "All Bookings", "Today's Schedule"). Subheadings describe the scope in one short sentence ("Manage your rental properties and settings", "Manage all bookings across all properties and clients"). No taglines, no exclamation marks, no rhetorical questions.

**Person.** Owner surfaces use **"My" / "your"** ("My Properties", "Here is what is happening with your properties today."). Admin surfaces use **"All"** ("All Properties", "All Bookings", "Manage all cleaner profiles…"). That's the whole voice rule — inclusive for owners, system-level for admin.

**Casing.** Title Case on headings (H1/H2), Sentence case on body, `UPPERCASE` used sparingly for one thing only: time-of-day dividers on schedules (`MORNING`, `AFTERNOON`, `EVENING`). Never for section labels, never for buttons.

**Buttons & actions.** Verb + noun, Title Case: "Add Cleaner", "Add Property", "New Booking", "Generate Report". Single-word verbs for row-level actions: "View", "Edit", "Delete", "Assign", "Save", "Cancel".

**Status pills.** One word, Title Case: `Active`, `Inactive`, `Pending`, `Scheduled`, `In Progress`, `Done`, `Completed`, `High`, `Turn`, `Standard`, `Premium`, `Basic`, `Unassigned`. Destructive / alert uses exclamation iconography (`mdi-alert-circle`) not exclamation marks in copy.

**Empty / placeholder copy.** Honest and dated: "Photo management coming soon", "No upcoming bookings", "0 cleanings · 0 turns · All assigned ✓". The checkmark at the end of a clean state is a pattern.

**Units.** Dates as `Wed, Apr 22 → Sat, May 16`. Times as `11:00`, `3:00 PM` (12-hour in user-facing copy, 24-hour internally). Durations as `120 min` or `61min`. Bedroom/bath shorthand `2bd / 2ba`, `-bd / -ba` when unset.

**Emoji & illustrations.** No emoji in product copy. Never. Icons come from **Material Design Icons** exclusively (`mdi-*`). No hand-drawn illustration, no mascots, no stickers. Empty states use a single MDI glyph at low opacity + one line of text.

**Labels.** Short, lowercase-on-field-chrome convention per Material/Vuetify outlined inputs: `Checkin Date`, `Checkout Date`, `Checkin Time`, `Property`, `Guest Count`, `Notes`. Helper text explains the *role*, not the format: "When guests arrive", "When guests depart".

---

## Visual Foundations

**Brand color.** A single purple — `#7367F0` — carries everything. It's the wordmark, the primary button, the active nav item, the selected time chip, the avatar fill, the overview-hero gradient. The `-light` variant (`#9E95F5`) appears in tints (8–16% alpha) for selection states and active nav background. `-dark` (`#5E52EE`) is for hover/press on the primary button only. This is **Materio-derived violet**, not Vuetify default indigo.

**Neutrals.** Warm near-black text `#2E263D` (notice the purple tint — pairs with the brand), 50% for secondary, 28% for disabled. Divider `#E8E8E8`. Background `#F5F5F9` — not pure gray; there is a whisper of lilac in it. Surface `#FFFFFF`. The whole app feels warm, not cold-gray.

**Semantic palette.** Green `#28C76F`, Orange `#FF9F43`, Red `#EA5455`, Cyan `#00CFE8`. These are used *as chips and dots only* — never as large fills. The single exception is `turn-urgent` red, which can fill an urgent-turn card's header strip.

**Property colors (per-entity accents).** Five-color cycle from `PROPERTY_COLORS` in the codebase: indigo `#7367F0`, green `#28C76F`, purple `#9155FD` (distinct from brand), orange `#FF9F43`, red `#EA5455` — plus yellow `#FDD835` for calendar "OUT" events. Applied as a **2–4px left border** on list rows and as **event-bar fills** in the calendar. Never as the entire card background.

**Typography.** **Inter**, weights 400/500/600 only. No italics in UI. No weight above 600 (bold numeric data caps at 600). Wordmark is Inter 600 in primary purple at ~20px with slight letter-spacing. Headings are 600 + tight line-height (1.2). Data numerals use *tabular-nums*. No serif, no mono (except inside code blocks in docs, which are out of scope for product UI).

**Spacing scale.** `4 / 8 / 16 / 24 / 32` (xs/sm/md/lg/xl). `--claro-card-padding` is `24px` desktop, `16px` mobile. `--claro-section-gap` is `32px` desktop, `24px` mobile. **Cards never touch** — always `16px` minimum gap between.

**Radii.** `2px` on surfaces (cards, inputs, dialogs) — this is the single most distinctive visual choice. Square-ish, slightly softened. Pills (`9999px`) on chips, badges, and the primary/secondary Button variants (capsule buttons are the other signature). Avatars are perfect circles.

**Shadows / elevation.** Subtle, baseline. Every card gets `0 2px 10px rgba(0,0,0,.05)` — that's it. Hover lifts to `0 4px 18px rgba(115,103,240,.12)` (purple-tinted) with a `-1px` translate. Dialogs and menus use Vuetify's material elevation (12 / 6). **No heavy drop shadows anywhere.**

**Gradients.** Exactly one place: the Owner hero "Welcome back" card — a `135deg` purple gradient from `--claro-primary-light → primary → primary-dark`. Do not introduce gradient elsewhere. Everything else is flat fill.

**Backgrounds & imagery.** No full-bleed photography, no illustrations. Background is the flat `#F5F5F9` wash. Placeholder images (property photos, user avatars) use an MDI glyph on a tonal purple square. This is a utility app — content is the focal point, not hero visuals.

**Borders.** `1px solid #E8E8E8` on card interiors (between sections of a single card), dividers inside lists. Outlined input borders use `#E8E8E8` resting, `#7367F0` on focus. Colored left-borders on list rows = 3–4px solid in the property's assigned color.

**Hover / press.** Cards lift `-1px` + purple-tinted shadow (250ms ease). Buttons scale `0.97` on `:active` (150ms ease). List items get a `rgba(115,103,240,.06)` background fade-in (200ms). Chips lift `-1px`. No color changes on hover for buttons (elevation/shadow does the work). `prefers-reduced-motion` disables all of this — wrap every transition in the `@media` guard.

**Transparency & blur.** None. No glassmorphism. No backdrop-filter. Dialogs use a scrim (`rgba(0,0,0,.32)`) not a blur.

**Icons.** Material Design Icons (`@mdi/font`). Used at 20–24px in nav, 18–20px inside chips/buttons, 40–48px in empty states. Always monochrome — filled variants for active nav/avatars, outlined for inline row iconography.

**Layout rules.** Fixed top app bar (64px desktop, 56px mobile) with wordmark left + user menu right. Persistent left nav drawer (380px open / 72px collapsed) on desktop — becomes a temporary overlay drawer on mobile. Page content uses `--claro-content-padding: 24px` desktop / `12px` mobile. Stat-card rows are `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`. Data tables collapse to stacked cards below the `md` breakpoint.

**Density.** Inputs are `density="comfortable"` on desktop, `"compact"` on mobile. Row heights in data tables: 56px desktop, 64px mobile. Touch targets never below 44px.

**Tabs.** Underline-style with 2px purple bar under active tab label. No background fills, no pills. Active tab label goes purple + medium weight.

---

## Iconography

The system uses **Material Design Icons (MDI)** via `@mdi/font` exclusively. The Vuetify icon set alias is `mdi` and it's the default in `src/plugins/vuetify.ts`. Icons are always monochrome; the brand purple is used only for *active* states (selected nav, primary buttons, focused fields).

**Recommended icon set for mocks:**
- Link MDI from CDN: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">`
- Use as `<i class="mdi mdi-home"></i>`, size via CSS `font-size: 20px`

**Common icons observed in the app:**
- `mdi-view-dashboard-outline` — Overview
- `mdi-calendar-blank-outline` / `mdi-calendar-month-outline` — Calendar
- `mdi-clipboard-check-outline` — Check-ins & Turns
- `mdi-view-list-outline` — Bookings
- `mdi-home-variant-outline` — Properties
- `mdi-chart-bell-curve-cumulative` — Reports
- `mdi-account-circle-outline` — Users / Cleaners
- `mdi-cog-outline` — Settings
- `mdi-bell-outline` — Notifications
- `mdi-star-outline` — Favorites
- `mdi-weather-sunny` — Light/dark toggle
- `mdi-plus-circle-outline` — Add actions
- `mdi-pencil-circle-outline` — Edit
- `mdi-trash-can-outline` — Delete
- `mdi-eye-outline` — View
- `mdi-magnify` — Search
- `mdi-filter-variant` — Filters
- `mdi-autorenew` — Turns (circular, reads as rotation/turnover)
- `mdi-alert-circle` — Urgent / unassigned
- `mdi-account-plus-outline` — Add Cleaner
- `mdi-broom` — Cleaning (emoji substitute in empty states)
- `mdi-clock-outline` — Time
- `mdi-email-outline`, `mdi-shield-outline`, `mdi-domain`, `mdi-translate`, `mdi-web` — Settings / profile fields
- `mdi-arrow-left`, `mdi-chevron-down`, `mdi-chevron-right`, `mdi-dots-vertical` — Nav glyphs

**No emoji anywhere** in product copy — every glyph is an MDI. The one exception is the ✓ checkmark in the "All assigned ✓" status string, which is a unicode char, not an icon.

**SVG logos / marks.** See `assets/` — the "Claro" wordmark is type-only (Inter 600, `#7367F0`). There is no logomark yet; when one is added, it should be purple-tinted and rendered flat, matching the card aesthetic.

---

## Caveats / Substitutions

- **Inter** is loaded from Google Fonts CDN. The codebase uses `@fontsource/inter`; we match the same weights (400/500/600). No substitution.
- **MDI** is loaded from jsDelivr CDN at the same version as the codebase (`7.4.47`). No substitution.
- The legacy `public/pwa-icon.svg` in the codebase says "CleanSync" and uses blue `#1976d2` — this is **stale**; the product is branded "Claro" in purple `#7367F0`. The design system uses the current "Claro" brand.
