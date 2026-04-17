# Materio Design System Import + Dashboard Refresh

**Date:** 2026-04-15
**Status:** Approved
**Approach:** Hybrid (C) — Atomics + Page compositions in parallel phases

## Goals

1. Import Materio component patterns into the pen file (`design/materio-vuetify.lib.pen`) as reusable atomic components
2. Compose dashboard widgets from those atomics
3. Create two full page compositions: Owner Dashboard and Property Timeline
4. All components use existing pen file variables (`$--primary`, `$--foreground`, `$--card`, `$--radius-sm`, etc.) — no new token work needed
5. Light theme only

## References

Prioritized Materio reference files in `UI/materio/`:

| Reference | Path | Relevance |
|-----------|------|-----------|
| Card Advance | `pages/cards-card-advance` | Dashboard widgets, stat cards, progress lists |
| Card Basic | `pages/cards-card-basic` | Core card layouts |
| Card Actions | `pages/cards-card-actions` | Collapse/refresh/remove patterns |
| Academy Dashboard | `dashboards/academy` | Dashboard grid layout, welcome banner, data tables |
| Timeline | `components/timeline` (also `UI/owner/timeline`) | Booking/cleaning activity feeds |
| Tabs | `components/tabs` (also `UI/owner/tabs`) | Settings page, section navigation |
| Form Layouts | `forms/form-layouts` | Owner/admin forms |
| Form Wizard | `forms/form-wizard-numbered` | Multi-step flows |
| Form Validation | `forms/form-validation` | Error state patterns |
| Switch | `forms/switch` | Notification/settings toggles |
| Property Listing Wizard | `wizard-examples/property-listing` | Property onboarding flow |
| Icons | `pages/icons` | Icon reference grid |

Additional reference: `C:\Users\Soren\Downloads\claro4-property-timeline.html` — HTML prototype for the Property Timeline page (layout/interaction reference only, not color reference).

## Constraints

- Light theme only — current Materio palette (`$--primary` = `#7367F0`)
- All components use semantic pen variables — no hardcoded hex colors
- Representative variant set per component (not exhaustive Materio showcases)
- Components go in existing `design/materio-vuetify.lib.pen`
- Follow existing pen file patterns (reusable components, naming conventions)

---

## Phase 1a: Core Atomic Components

Eight reusable components. Each shows representative variants side by side.

### 1. Button
- **Flat**: primary fill, white text (default)
- **Outlined**: primary border, primary text, transparent bg
- **Tonal**: light primary background, primary text
- **Icon-only**: circular, icon centered
- Two sizes: small (32px height) and default (36px height)

### 2. Card
- **Elevated**: `$--card` bg, shadow (existing pattern)
- **Tonal**: light colored bg, no shadow
- **Outlined**: `$--card` bg, border stroke, no shadow
- Each ~200px wide with title + body text

### 3. Avatar
- Row of 5 color fills: primary, success, warning, error, info — each with 2-letter initials
- One tonal variant (light bg, colored text)
- Two sizes: 32px and 40px

### 4. Chip
Booking status set:
- **Pending**: warning tonal
- **Scheduled**: info tonal
- **In Progress**: primary tonal
- **Completed**: success tonal
- **Cancelled**: grey, strikethrough text
- **Property badge**: chip with color dot prefix

### 5. Badge
Avatar with small red notification circle (count number inside).

### 6. Tabs
- **Pill-style**: existing in pen file (`ww45l`, `DdLLg`, `pWK2O`) — reuse
- **Underline-style**: new — standard `v-tabs` look with bottom border on active tab

### 7. Progress
- **Linear**: thin bar, 65% filled, primary on grey track, rounded ends
- **Circular**: 40px diameter ring, percentage number centered, primary stroke on grey track

### 8. Switch
- **Off**: grey track, white thumb left
- **On**: primary track, white thumb right
- Pill-shaped track (18px tall, 36px wide)

---

## Phase 1b: Dashboard Widgets

Five composed widgets built from Phase 1a atomics.

### 1. Stat Card with Icon
- ~200px wide card
- Left: tonal avatar (40px) with icon
- Right: large stat value (24px, semibold) + label below (13px, muted)
- Four semantic color variants (primary, success, warning, error)
- Reference: Materio academy dashboard stat pills

### 2. Welcome Banner
- Full-width card, light primary tinted background
- Left side: greeting ("Welcome back, {name}!"), subtitle, 2-3 inline stat pills
- Right side: optional decorative element or illustration placeholder
- Reference: Materio academy dashboard welcome banner

### 3. Progress List Card
- Card with title header
- List of 3-4 items: avatar/icon (32px) + label + linear progress bar + percentage text
- Dividers between items
- Reference: Materio academy "Assignment Progress" section

### 4. Activity Timeline Card
- Card with title header
- Vertical timeline: 3-4 items with colored dots, timestamp, description, optional chip
- Domain-adapted: "Check-out at 412 Ocean Blvd", "Turn completed at 88 Desert Rose Ct"
- Reference: Materio timeline component + `UI/owner/timeline`

### 5. Data Table Card
- Card with title + search field in header
- Compact table: 4-5 rows
- Columns: property name (with color dot), next event type, date, status chip
- Reference: Materio academy "Courses you are taking" table

---

## Phase 1c: Owner Dashboard Page Composition

Full-page layout in 12-column grid pattern.

### Row 1 (8 + 4 cols)
- **Welcome Banner** (8 cols): greeting, subtitle, stat pills (Turns Today, Check-outs, Occupancy %)
- **Period Stat Card** (4 cols): circular progress ring showing "This Week" completion rate

### Row 2 (3 + 3 + 3 + 3 cols)
Four **Stat Cards**: Active Properties (primary), Upcoming Turns (warning), This Week's Check-ins (success), Unassigned Cleanings (error)

### Row 3 (6 + 6 cols)
- **Activity Timeline Card** (left): recent booking/cleaning events
- **Progress List Card** (right): cleaning completion per property

### Row 4 (12 cols)
- **Data Table Card** (full width): "Upcoming Events" with property, event type, date, status, cleaner

### Design Notes
- Grid gap: 24px (matching `v-row` gutters)
- All cards: `$--card` background with existing shadow
- Page sits inside existing owner layout (nav drawer + app bar already in pen file)
- Total page width: ~1100px content area (inside 1440px viewport with sidebar)

---

## Phase 2a: Timeline-Specific Atomics

Four additional components for the Property Timeline page.

### 1. Event Card
- ~250px wide card
- 3px colored top border: red (checkout), green (checkin), orange (turn)
- Header: uppercase type label (colored) + time (right-aligned, muted)
- Body: status chip + priority dot (6px, colored) + guest count + assigned indicator
- Three variants: checkout, checkin, turn

### 2. Property Selector Chip
- Sidebar list item
- Color dot (10px) + street name + city/bed/bath meta
- Optional event badge pill (TURN/OUT/IN) — colored by type
- Selected state: offset bg + border + checkmark visible
- Unselected: transparent, checkmark hidden

### 3. Cleaning Window Card
- Full-width inline banner
- Warning-tinted background (`$--color-warning` highlight)
- Left: broom icon + "Cleaning Window" label
- Right: time range text ("10:00 → 14:00")
- Rounded corners, subtle border

### 4. Timeline Spine Elements
- Vertical line: 2px, `$--divider` color
- Event dots: 12px circles, colored by event type, 2px white border
- Date label pills: rounded-full, muted bg + border, centered text
- "Today" variant: primary highlight bg + primary text + primary border

---

## Phase 2b: Property Timeline Page Composition

Full-page layout matching the HTML prototype structure with Materio light theme.

### Split Layout
- **Sidebar** (280px fixed, left): property selector
- **Main area** (flexible, right): toolbar + timeline feed

### Sidebar — Property Selector
- Header: "Properties" label (uppercase, muted) + All/None buttons
- Scrollable list of Property Selector Chips (5 sample properties)
- Color dots match property colors from the prototype

### Main — Toolbar
- Horizontal bar, pinned to top, border-bottom
- Left: "Window" label + pill button group (3d / **7d** / 2w / 4w)
- Center: "Merge turns" label + switch
- Right: legend dots (Check-in green, Check-out red, Turn orange)

### Main — Timeline Feed
One block per selected property:

- **Property header**: color square (12px) + street name (semibold) + city/type meta + stat pills
- **Date groups**: date pill centered on spine
- **Event rows**: 3-column grid
  - Left column: checkout Event Cards
  - Center: spine line + colored dot
  - Right column: checkin Event Cards
- **Turn rows**: turn-out card left + orange dot + turn-in card right
- **Cleaning window**: full-width Cleaning Window Card below turn rows
- **Empty state**: centered icon + title + description when no properties selected

### Detail Panel (slide-in)
- 400px wide, slides from right edge
- Header: type badge + priority dot, property name, city
- Sections with muted uppercase labels:
  - **Booking Window**: checkout date/time + checkin date/time + status chip + priority
  - **Cleaning Window** (turns only): time range, duration, pricing tier
  - **Property Info**: type, bed/bath, tier
  - **Notes**: italic text block or "No notes" placeholder
- Close button (top-right), dark overlay behind panel

### Design Notes
- Light theme: white cards on light grey background
- Semantic color variables throughout
- Sidebar hidden on mobile (single-column layout)
- Reuses existing pen file sidebar pattern

---

## Phase 3: Remaining Atomics (Future)

Not in scope for this spec. To be filled in later:
- Text field, Select, Textarea (form input variants)
- Alert (tonal variants by color)
- Dialog (modal pattern)
- Form wizard stepper (numbered + icon variants)
- Expansion panel
- Pagination
- Snackbar
- Tooltip
- Menu
- List item variants

---

## Pen File Organization

All new components go in `design/materio-vuetify.lib.pen`:

- Atomic components placed as individual reusable nodes near the existing component area
- Dashboard widgets placed as reusable nodes, referencing atomics via `ref` instances
- Page compositions placed as top-level frames at empty canvas positions
- Naming convention: `mat{Component}{Variant}` for atomics (e.g., `matBtnFlat`, `matCardTonal`), `dash{Widget}` for dashboard widgets (e.g., `dashStatCard`), page frames named descriptively (`ownerDashboard`, `propertyTimeline`)

## Git Strategy

Follows existing `feature/materio-restyle` branch conventions:
- One commit per visual unit
- Prefixes: `wrapper:` for atomics, `restyle:` for page compositions
- Commit after each sub-phase completes
