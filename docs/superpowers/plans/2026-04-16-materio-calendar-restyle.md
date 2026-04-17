# Materio Calendar Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the month-view calendar (`FullCalendar.vue`) to match the flat Materio reference — soft grid borders, primary-tinted today wash, faded prev/next-month day numbers, and flat colored event pills with property + guest text and a small check-in time chip. Remove all emoji decorations, TURN/OUT overlay badges, shimmer animations, gradient pseudo-elements, hover-lift shadows, and drag-rotate feedback.

**Architecture:** Token-driven. A single file (`src/styles/calendar-tokens.css`) owns every non-event-color visual decision (grid borders, today wash, day-number colors, event pill radius/padding/text color, completed-state dim + neutral gray, time-chip styling). `FullCalendar.vue` consumes those tokens exclusively. Event background/border still come from `property.color` inline via `calendarHelpers.ts` — unchanged. No new components, no new props. This is a subtractive change: most of the diff is deletions of decoration that was layered on over time.

**Tech Stack:** Vue 3 + Vuetify 4, FullCalendar 4 (`@fullcalendar/vue3` + `dayGridPlugin` / `timeGridPlugin` / `interactionPlugin`), CSS custom properties scoped to `:root`.

**Spec:** `docs/superpowers/specs/2026-04-16-materio-calendar-restyle-design.md`

---

## File map

**Modify:**
- `src/styles/calendar-tokens.css` — rewrite the whole file
- `src/components/smart/shared/FullCalendar.vue` — rewrite scoped `<style>` block; update unscoped `<style>` block; simplify `renderEventContent`; delete `getPriorityIcon`, `getStatusBadge`, `handleEventDidMount`, `measureBadge`, `applyBadge`, `BadgeMeasurement` interface; remove `eventDidMount` registration from `calendarOptions`; add small helpers `formatTimeChip` and `toLocalDateString`

**Out of scope — do not touch:**
- `src/utils/calendarHelpers.ts`
- `src/App.vue` (contains dead `.fc-event.turn-booking-event` / `.urgent-event` / `.standard-booking-event` rules that match no emitted class names; leave them alone)
- `src/styles/responsive.scss` (contains `:deep(.fc-event)` size/spacing overrides that don't affect the restyle's visual intent)
- `src/components/dumb/owner/OwnerMiniCalendar.vue` and any other calendar surfaces

---

## Task 1: Rewrite `calendar-tokens.css`

**Files:**
- Modify: `src/styles/calendar-tokens.css` (complete rewrite)

- [ ] **Step 1: Replace the entire file contents**

Replace `src/styles/calendar-tokens.css` with:

```css
/* Calendar design tokens — Materio flat style.
   Imported once in main.ts. FullCalendar.vue consumes these exclusively
   for grid chrome, event pills, completed-state, and the time chip.
   Event background/border still come from property.color (inline, set by calendarHelpers.ts). */
:root {
  /* Grid */
  --cal-border:                    rgb(var(--v-theme-on-surface) / 0.08);
  --cal-bg:                        rgb(var(--v-theme-surface));
  --cal-today-bg:                  rgb(var(--v-theme-primary) / 0.06);
  --cal-day-num:                   rgb(var(--v-theme-on-surface) / 0.72);
  --cal-day-num-muted:             rgb(var(--v-theme-on-surface) / 0.28);

  /* Event pill */
  --cal-event-radius:              2px;
  --cal-event-text:                #fff;
  --cal-event-padding:             4px 8px;
  --cal-event-font-weight:         500;

  /* Status */
  --cal-event-completed-bg:        rgb(var(--v-theme-on-surface) / 0.28);
  --cal-event-completed-opacity:   0.6;

  /* Time chip */
  --cal-time-chip-bg:              rgb(0 0 0 / 0.18);
  --cal-time-chip-text:            #fff;
  --cal-time-chip-radius:          2px;
}
```

Nothing else in this file. The old `--cal-turn-*` / `--cal-std-*` priority tokens and the `.fc-event.type-turn { border-left: ... }` rules are deleted — no consumer remains after Task 3.

- [ ] **Step 2: Verify CSS loads without syntax errors**

Run: `pnpm build:fast`
Expected: Build succeeds. If CSS parse fails, check for stray characters after the paste.

- [ ] **Step 3: Commit**

```bash
git add src/styles/calendar-tokens.css
git commit -m "restyle(calendar): rewrite calendar-tokens.css to Materio flat token set

Replaces priority accent tokens and type-turn border rules with a
consolidated surface for grid chrome (border, today wash, day-number
colors), event pills (radius, padding, text color, font weight),
completed-state (dim + neutral gray), and time chip. All values
derive from Vuetify theme tokens so dark mode auto-adapts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Rewrite scoped `<style>` block in `FullCalendar.vue`

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue` — the `<style scoped>` block starting at line 783

- [ ] **Step 1: Replace the entire scoped style block**

In `src/components/smart/shared/FullCalendar.vue`, replace the contents of the `<style scoped>` block (from `.calendar-container { ... }` down through the final `@media (min-width: 960px) { ... }` rule, i.e. the entire block starting at line 783 and ending before `</style>`) with:

```css
.calendar-container {
  height: 100%;
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.custom-calendar {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 1;
  min-height: 0;

  /* Bridge calendar-tokens.css into FullCalendar's CSS variable system */
  --fc-border-color:     var(--cal-border);
  --fc-page-bg-color:    var(--cal-bg);
  --fc-today-bg-color:   var(--cal-today-bg);
  --fc-button-bg-color:         rgb(var(--v-theme-primary));
  --fc-button-border-color:     rgb(var(--v-theme-primary));
  --fc-button-hover-bg-color:   rgb(var(--v-theme-primary));
  --fc-button-active-bg-color:  rgb(var(--v-theme-primary));
}

/* Hide empty FullCalendar toolbar — controls are in the app bar */
:deep(.fc-header-toolbar) {
  display: none !important;
}

/* Day-of-week header row — subtle label strip */
:deep(.fc-col-header-cell-cushion) {
  color: var(--cal-day-num-muted);
  font-weight: 500;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

/* Day numbers — current month vs prev/next month */
:deep(.fc-daygrid-day-number) {
  color: var(--cal-day-num);
  font-weight: 500;
  text-decoration: none;
}
:deep(.fc-day-other .fc-daygrid-day-number) {
  color: var(--cal-day-num-muted);
}

/* Event pill — flat colored bar, tokenised */
:deep(.fc-event) {
  border-radius: var(--cal-event-radius) !important;
  padding:       var(--cal-event-padding);
  font-weight:   var(--cal-event-font-weight);
  color:         var(--cal-event-text);
  box-shadow:    none !important;
  transition:    filter 0.15s ease, opacity 0.15s ease;
}
:deep(.fc-event:hover)    { filter: brightness(1.05); cursor: grab; }
:deep(.fc-event:active)   { cursor: grabbing; }
:deep(.fc-event-dragging) { opacity: 0.75 !important; }
:deep(.fc-event-mirror)   { opacity: 0.6 !important; }

/* Completed bookings: dim + neutral gray (overrides inline property.color) */
:deep(.fc-event.status-completed) {
  background-color: var(--cal-event-completed-bg) !important;
  border-color:     var(--cal-event-completed-bg) !important;
  opacity:          var(--cal-event-completed-opacity);
  text-decoration:  none;
}

/* Event content layout */
.fc-event-content-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.fc-event-time-chip {
  background:     var(--cal-time-chip-bg);
  color:          var(--cal-time-chip-text);
  border-radius:  var(--cal-time-chip-radius);
  padding:        0 4px;
  font-size:      0.65em;
  font-weight:    700;
  line-height:    1.4;
  flex:           0 0 auto;
}
.fc-event-lines    { min-width: 0; flex: 1 1 auto; }
.fc-event-title    { font-size: 0.8rem; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fc-event-subtitle { font-size: 0.7rem; line-height: 1.1; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Month-view pills are single-line — hide the subtitle; timegrid (week/day) keeps it */
:deep(.fc-daygrid-event) .fc-event-subtitle  { display: none; }
:deep(.fc-timegrid-event) .fc-event-subtitle { display: block; }

/* Force hide any FullCalendar popovers/tooltips */
:deep(.fc-popover),
:deep(.fc-more-popover),
:deep(.fc-popover-header),
:deep(.fc-popover-body),
:deep(.fc-popover-close) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Mobile viewport fixes — unchanged from prior version */
@media (max-width: 959px) {
  .calendar-container {
    position: relative;
    height: calc(
      100vh - 56px - 60px - env(safe-area-inset-top) -
        env(safe-area-inset-bottom) - 20px
    ) !important;
    min-height: 400px;
    max-height: calc(100vh - 100px);
  }
  .custom-calendar {
    position: relative;
    height: 100% !important;
    width: 100% !important;
  }
  :deep(.fc)              { height: 100% !important; width: 100% !important; }
  :deep(.fc-view-harness) { height: 100% !important; width: 100% !important; }
  :deep(.fc-scroller) {
    height: 100% !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.fc-daygrid-body)      { min-height: 300px; }
  :deep(.fc-daygrid-day-frame) { min-height: 40px; }
  :deep(.fc-event) {
    margin: 1px 0;
    font-size: 0.75rem;
  }
}

@media (min-width: 960px) {
  :deep(.fc-event) {
    font-size: 0.75rem !important;
    min-height: 22px !important;
    margin: 1px 0 !important;
  }
  :deep(.fc-event-title)    { font-size: 0.75rem !important; line-height: 1.1 !important; }
  :deep(.fc-event-subtitle) { font-size: 0.65rem !important; line-height: 1 !important; }
  :deep(.fc-daygrid-day-frame) { min-height: 120px !important; }
}
```

Deleted in this rewrite: `.turn-event-badge` + `::after` + `@keyframes turn-shimmer`, `.checkout-event-badge` + `::after`, `.fc-event.booking-turn` bold/border-width rule, `.fc-event.booking-standard` + `::before` gradient edge, `.fc-event:hover` transform/box-shadow, `.fc-event-dragging` rotate, `.fc-event-mirror` rotate, `@keyframes pulse`, `.fc-event.status-pending` opacity, `.fc-event.status-completed` strikethrough, `.fc-event-content-wrapper { padding: 2px }`.

- [ ] **Step 2: Run type check + dev build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 3: Browser visual check**

Start dev server: `pnpm dev`
Open `/owner/calendar` in Chrome. Expected:
- Grid borders are soft and low-contrast.
- Today cell has a subtle primary-tinted wash.
- Prev/next-month day numbers are noticeably muted.
- Day-of-week header row reads as uppercase small-caps-style labels.
- Event pills are flat (no shadow, no gradient edge, no shimmer).
- Hovering an event slightly brightens it; cursor is `grab`.
- Dragging an event dims it to ~75% opacity with no rotation.

Take a screenshot for the commit notes.

- [ ] **Step 4: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "restyle(calendar): flatten grid + event pills, consume new tokens

Scoped style block rewritten to read from the Materio calendar-tokens
surface. Soft border, primary-tinted today wash, muted prev/next-month
day numbers, uppercase label header row. Event pills are flat: no
box-shadow, no hover-lift transform, no drag-rotate. Completed status
dims to neutral gray + 60% opacity. Deletes shimmer keyframes,
TURN/OUT badge CSS, gradient pseudo-elements, and booking-type decorators.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Update unscoped `<style>` block in `FullCalendar.vue`

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue` — the unscoped `<style>` block at the end of the file (currently lines 1095–1131)

- [ ] **Step 1: Replace the unscoped style block**

Replace the entire unscoped `<style>` block (everything between `<style>` with no attribute and the closing `</style>` at end-of-file) with:

```css
/* Unscoped: FullCalendar renders event DOM outside Vue's scoping.
   viewMode === 'events' events (IN / TURN / OUT) use theme-mapped colors. */
.fc-event.transition-event {
  border-radius: var(--cal-event-radius, 2px) !important;
  font-weight: 600;
  border: none !important;
  color: #fff !important;
}

.fc-event.transition-in {
  background-color: rgb(var(--v-theme-success)) !important;
  border-color:     rgb(var(--v-theme-success)) !important;
}

.fc-event.transition-turn {
  background-color: rgb(var(--v-theme-warning)) !important;
  border-color:     rgb(var(--v-theme-warning)) !important;
}

.fc-event.transition-out {
  background-color: rgb(var(--v-theme-on-surface-variant)) !important;
  border-color:     rgb(var(--v-theme-on-surface-variant)) !important;
}

.fc-event.transition-highlight {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary) / 0.6) !important;
  transition: box-shadow 0.3s ease;
}
```

Deleted from this block: the `scale(1.05)` transform on `transition-highlight`, the hex literal colors `#43a047` / `#e65100` / `#546e7a`, and the `--fc-event-bg-color` / `--fc-event-border-color` per-class overrides (redundant — the theme-mapped `background-color` + `border-color` with `!important` covers it).

- [ ] **Step 2: Browser visual check (events mode)**

Navigate to `/owner/calendar` and toggle the view-mode switch to "Events" (it's on the mobile nav pill or the calendar controls bar depending on viewport). Expected:
- IN pills: solid theme success green, no hex-tint shift between light/dark mode.
- TURN pills: theme warning orange.
- OUT pills: theme on-surface-variant gray.
- Click a booking's IN pill — related TURN/OUT pills get a subtle 2px primary-colored ring (no scale bump).

- [ ] **Step 3: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "restyle(calendar): swap events-mode hex literals to theme tokens

IN/TURN/OUT transition events now use theme success/warning/on-surface-variant
instead of hex literals, so dark mode reads correctly and the palette stays
aligned with the rest of the restyle. transition-highlight trims the scale
bump to just a primary-colored ring.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Simplify `renderEventContent` and remove badge-overlay pipeline

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue` — the `<script setup>` block

- [ ] **Step 1: Update the FullCalendar import to include `EventContentArg`**

Find the import line for `@fullcalendar/core` (currently lines 12–18):

```ts
import type {
  CalendarOptions,
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
} from '@fullcalendar/core'
```

Replace with:

```ts
import type {
  CalendarOptions,
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from '@fullcalendar/core'
```

- [ ] **Step 2: Delete the badge-overlay pipeline**

Delete the entire block from `interface BadgeMeasurement { ... }` through the end of `handleEventDidMount` (currently lines 221–292). That covers:
- The `BadgeMeasurement` interface
- `function measureBadge (...)`
- `function applyBadge (...)`
- `function handleEventDidMount (...)`
- Any comments between them describing badge positioning

After deletion, the line immediately following the deletion should be the `// Event handlers` comment above `handleDateSelect`.

- [ ] **Step 3: Remove `eventDidMount` registration from `calendarOptions`**

In `calendarOptions` (the `reactive({ ... })` block), find the line:

```ts
eventDidMount: handleEventDidMount,
```

Delete that line.

- [ ] **Step 4: Delete `getPriorityIcon` and `getStatusBadge` helpers**

In `renderEventContent`, delete the nested `const getPriorityIcon = ...` and `const getStatusBadge = ...` arrow functions (currently lines 388–447), and the lines that call them (`const priorityIcon = ...` and `const statusBadge = ...`).

- [ ] **Step 5: Add two small formatting helpers above `renderEventContent`**

Immediately before the `function renderEventContent (...)` declaration, add:

```ts
// 'yyyy-mm-dd' in the user's local timezone. Date.toISOString() is UTC — unsafe here
// because booking.checkin_date is stored as a local yyyy-mm-dd string.
function toLocalDateString (d: Date | null | undefined): string | null {
  if (!d) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Compact 12h label for the event start-time chip. '15:00' → '3p', '09:30' → '9:30a', '00:00' → '12a'
function formatTimeChip (hhmm: string | null | undefined): string | null {
  if (!hhmm) return null
  const [hStr, mStr] = hhmm.split(':')
  const h = Number.parseInt(hStr, 10)
  const m = Number.parseInt(mStr, 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const period = h < 12 ? 'a' : 'p'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}
```

- [ ] **Step 6: Replace the body of `renderEventContent`**

Replace the entire `renderEventContent` function (currently lines 356–470) with:

```ts
function renderEventContent (eventInfo: EventContentArg) {
  // Events mode: single-line "IN · Property" pill
  if (props.viewMode === 'events') {
    const transitionType = (eventInfo.event.extendedProps?.transitionType as string | undefined) || 'in'
    const label = transitionType.toUpperCase()
    const property = eventInfo.event.extendedProps?.property as Property | undefined
    const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Property'

    return {
      html: `
        <div class="fc-event-content-wrapper transition-${escapeHtml(transitionType)}">
          <div class="fc-event-lines">
            <div class="fc-event-title">${escapeHtml(label)} · ${escapeHtml(propertyLabel)}</div>
          </div>
        </div>
      `,
    }
  }

  // Ranges mode: optional time chip + property name + optional guest name
  const booking = eventInfo.event.extendedProps?.booking as Booking | undefined
  const property = eventInfo.event.extendedProps?.property as Property | undefined
  if (!booking) {
    return { html: '' }
  }

  const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Property'
  const guest = (booking.guest_name || '').trim()

  const segStartLocal = toLocalDateString(eventInfo.event.start)
  const isFirstSegment = !!segStartLocal && segStartLocal === booking.checkin_date
  const timeChip = isFirstSegment ? formatTimeChip(booking.checkin_time) : null

  const chipHtml = timeChip ? `<span class="fc-event-time-chip">${escapeHtml(timeChip)}</span>` : ''
  const subtitleHtml = guest ? `<div class="fc-event-subtitle">${escapeHtml(guest)}</div>` : ''

  return {
    html: `
      <div class="fc-event-content-wrapper">
        ${chipHtml}
        <div class="fc-event-lines">
          <div class="fc-event-title">${escapeHtml(propertyLabel)}</div>
          ${subtitleHtml}
        </div>
      </div>
    `,
  }
}
```

- [ ] **Step 7: Type-check**

Run: `pnpm build:fast`
Expected: Build succeeds. If `EventContentArg` is not exported, fall back to the loose inline type used before — the logic is type-narrowed on `extendedProps` reads anyway.

- [ ] **Step 8: Run the existing tests**

Run: `pnpm test:run`
Expected: Pass. `src/__tests__/utils/calendarHelpers.spec.ts` asserts on `bookingToCalendarEvent` output, not on rendered markup, so it should be unaffected. If any test asserts on emoji or TURN/OUT badge markup, flag it — such assertions are testing the wrong thing for this feature and should be updated to reflect the new markup.

- [ ] **Step 9: Browser visual check (ranges mode)**

Navigate to `/owner/calendar` in ranges mode. Expected:
- Event pills show property short address as the main label, no emoji prefix.
- Events with a `checkin_time` show a small chip (e.g. `3p`) at the start of the first segment only. Multi-week events do not repeat the chip on subsequent week-row segments.
- Events with a `guest_name` show it as a second line in week/day timegrid views; month view stays single-line (subtitle hidden by CSS).
- No TURN overlay badge, no OUT overlay badge, no shimmer animation.
- Completed bookings render as a dim neutral-gray pill regardless of property color.

Navigate to `/admin/calendar` and confirm same behavior.

- [ ] **Step 10: Drag/resize sanity check**

Drag an event to a new date. Expected: the drag mirror is a faded copy of the pill (no rotation, no shadow jump), and on drop the booking updates normally (no regression in existing `event-drop` handler).

Resize an event. Expected: resize works, pill stays flat during resize.

- [ ] **Step 11: Dark mode check**

Toggle the app to dark mode (via the theme picker / settings). Expected: borders, today wash, day-number colors, and completed-state gray all read correctly. Event text (`#fff`) stays legible on property colors.

- [ ] **Step 12: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "restyle(calendar): simplify event content, remove badge overlay pipeline

renderEventContent now emits a minimal two-line pill: property short
address on top, guest name on the subtitle line (hidden in month view),
with an optional compact time chip at the start of the first segment
when checkin_time is set. Deletes getPriorityIcon, getStatusBadge, and
the entire handleEventDidMount → measureBadge → applyBadge pipeline
that positioned TURN/OUT overlay badges. Adds formatTimeChip and
toLocalDateString helpers (local-tz date slicing — Date.toISOString()
would have misidentified the first segment across DST / tz boundaries).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Final verification

**Files:** None (pure verification)

- [ ] **Step 1: Full type-checked build**

Run: `pnpm build`
Expected: `vue-tsc --noEmit` passes; Vite build produces the owner + admin bundles without warnings about removed symbols.

- [ ] **Step 2: Full test suite**

Run: `pnpm test:run`
Expected: All tests pass. If any test fails asserting on deleted emoji/badge markup, update that test to assert on the new markup (property label present, no emoji prefix) — that's in-scope cleanup.

- [ ] **Step 3: Compare against reference screenshot**

Open `/owner/calendar` in Chrome (month view, ranges mode). Visual checklist against the Materio reference:
- Grid borders soft and low-contrast ✓
- Today cell has primary-tinted wash ✓
- Prev/next-month days faded ✓
- Event pills flat with 2px radius ✓
- No emojis anywhere in pill content ✓
- No TURN/OUT overlay badges ✓
- No shimmer animation ✓
- No hover-lift or drag-rotate ✓
- Completed bookings dim + neutral gray ✓
- Time chip on first segment when checkin_time exists ✓

- [ ] **Step 4: Branch completeness check**

Run: `git log --oneline feature/materio-restyle ^main | head -10`
Expected: Four new commits from this plan on top of the existing branch, each with a `restyle(calendar):` prefix.

No commit step for this task — it's verification only. If any step fails, fix inline and amend the appropriate earlier commit rather than adding a fixup commit (this branch prefers one commit per visual unit per the git strategy memo).
