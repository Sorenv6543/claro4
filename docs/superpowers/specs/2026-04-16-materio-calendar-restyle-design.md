# Materio Calendar Restyle — Design

**Date:** 2026-04-16
**Branch:** `feature/materio-restyle`
**Scope:** `src/components/smart/shared/FullCalendar.vue` (month grid + event pills)

## Context

The current calendar wraps FullCalendar 4 with heavy domain decoration layered in over
time: emoji priority icons (🚨🔥⭐), emoji status badges (✅⏳), TURN/OUT overlay labels
positioned at the turn and checkout day columns with shimmer animations, hover-lift box
shadows, gradient top-edges on standard bookings, and drag-rotate feedback. The target
is the flat Materio calendar aesthetic: soft borders, a subtle primary-tinted today wash,
faded prev/next-month day numbers, and flat colored event pills that carry property name
+ guest name + a small check-in time chip — and nothing else.

The restyle is token-driven: a consolidated set of `--cal-*` CSS custom properties in
`src/styles/calendar-tokens.css` owns every non-event-color decision (grid borders, today
wash, day-number colors, event radius/padding/text color, completed-state dim + neutral
gray, time-chip styling). `FullCalendar.vue` consumes those tokens exclusively. Event
background/border continue to come from `property.color` inline via `calendarHelpers.ts`.

## Decisions

- **Decoration scope:** full-minimal — all emojis, TURN/OUT overlay badges + shimmers,
  gradients, box shadows, and hover-lift transforms are removed. No priority signaling
  in the event bar; priority lives in tooltips / detail views only.
- **Surfaces touched:** only the main `FullCalendar.vue`. The `OwnerMiniCalendar` is out
  of scope per user direction ("I'm not going to be using MiniCalendar").
- **Status signaling:** `completed` events render at 60% opacity AND shift to a neutral
  gray (ignoring `property.color`). `pending`/`confirmed`/`in_progress` all render solid
  in `property.color`. No strikethrough.
- **Event text content:** two-line — property short address on top, guest name below.
  Subtitle line is hidden in month-view day-grid (pills span multiple cells and a second
  line would break row alignment); shown in timegrid week/day views where the pill has
  vertical room. The title line always truncates with ellipsis.
- **Check-in time chip:** a small chip (e.g. `5p`) is rendered at the start of the first
  segment of any event that has a `checkin_time`, formatted in compact 12h notation
  (e.g. `15:00` → `3p`, `9:30` → `9:30a`).
- **Today cell:** 6% primary-tinted wash (`rgb(var(--v-theme-primary) / 0.06)`), softer
  than the current 10%. Matches the overall Materio-restyle palette.
- **Grid borders:** 8%-opacity on-surface lines replace the current bluish
  `rgba(100,140,180,0.2)`. Theme-aware; dark mode auto-adapts.
- **Day numbers:** prev/next-month cells use a muted 28%-opacity day-number color;
  current month cells use 72%.
- **Day-of-week header row:** uppercase, letter-spaced, small weight, muted color — a
  subtle label strip.
- **Border radius:** event pills use `2px` per the project-wide "no rounded-lg" rule.
- **Interaction feedback:** simplified. Hover uses `filter: brightness(1.05)` or a slight
  opacity bump — no transform. `.fc-event-dragging` uses `opacity: 0.75` only (no
  rotate); `.fc-event-mirror` uses `opacity: 0.6`.

## Architecture

### Files touched

- **`src/styles/calendar-tokens.css`** — rewritten. The old `--cal-turn-*` / `--cal-std-*`
  priority accent tokens are deleted; the new Materio tokens replace them. The `.fc-event.
  type-turn` priority-border rules are deleted — no consumer remains.
- **`src/components/smart/shared/FullCalendar.vue`** —
  - `renderEventContent` rewritten to emit the new two-line + time-chip markup;
    `getPriorityIcon` and `getStatusBadge` helpers deleted.
  - `handleEventDidMount`, `measureBadge`, `applyBadge`, and the `BadgeMeasurement`
    interface deleted (TURN/OUT badge overlay pipeline is gone).
  - Scoped `<style>` block rewritten to consume the new tokens. All gradient
    pseudo-elements, shimmer keyframes, hover-lift shadows, drag-rotate transforms, and
    `.booking-turn` / `.booking-standard` decorators are removed.
  - Unscoped `<style>` (for `viewMode === 'events'`) has its hex literals swapped to
    theme-mapped tokens (`success` / `warning` / `on-surface-variant`) and the
    `transition-highlight` scale+glow trimmed to a subtle ring.
- **`src/utils/calendarHelpers.ts`** — no change. Still emits `property.color` as
  `backgroundColor` / `borderColor` and the same `classNames` for status/type.

### Out of scope

- `OwnerMiniCalendar.vue` and its styles.
- `OwnerCalendarControls.vue`, `AdminCalendarControls.vue`, `CalendarNavPill.vue`.
- `useCalendarState`, `useOwnerCalendarState`, `useAdminCalendarState`.
- Business-logic composables, stores, routes, tests for calendar data flow.

## Token Surface

```css
/* src/styles/calendar-tokens.css */
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

## Grid styling rules

```css
.custom-calendar {
  --fc-border-color:     var(--cal-border);
  --fc-page-bg-color:    var(--cal-bg);
  --fc-today-bg-color:   var(--cal-today-bg);
}

:deep(.fc-daygrid-day-number)               { color: var(--cal-day-num); }
:deep(.fc-day-other .fc-daygrid-day-number) { color: var(--cal-day-num-muted); }
:deep(.fc-col-header-cell-cushion) {
  color: var(--cal-day-num-muted);
  font-weight: 500;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

## Event pill rules

```css
:deep(.fc-event) {
  border-radius:  var(--cal-event-radius);
  padding:        var(--cal-event-padding);
  font-weight:    var(--cal-event-font-weight);
  color:          var(--cal-event-text);
  box-shadow:     none !important;
  transition:     filter 0.15s ease, opacity 0.15s ease;
}

:deep(.fc-event:hover)   { filter: brightness(1.05); cursor: grab; }
:deep(.fc-event:active)  { cursor: grabbing; }
:deep(.fc-event-dragging){ opacity: 0.75 !important; }
:deep(.fc-event-mirror)  { opacity: 0.6 !important; }

.fc-event.status-completed {
  background-color: var(--cal-event-completed-bg) !important;
  border-color:     var(--cal-event-completed-bg) !important;
  opacity:          var(--cal-event-completed-opacity);
  text-decoration:  none;
}

.fc-event-content-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.fc-event-time-chip {
  background:    var(--cal-time-chip-bg);
  color:         var(--cal-time-chip-text);
  border-radius: var(--cal-time-chip-radius);
  padding:       0 4px;
  font-size:     0.65em;
  font-weight:   700;
  flex:          0 0 auto;
}
.fc-event-lines  { min-width: 0; flex: 1 1 auto; }
.fc-event-title    { font-size: 0.8rem; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fc-event-subtitle { font-size: 0.7rem; line-height: 1.1; opacity: 0.85; }

/* Hide subtitle when pill is tight */
:deep(.fc-daygrid-event) .fc-event-subtitle { display: none; }
:deep(.fc-timegrid-event) .fc-event-subtitle { display: block; }
```

`.fc-daygrid-event` subtitle hiding is a conservative default: month-view pills are
single-line (they stack vertically across many cells, so a second line would break
alignment). The `viewMode === 'events'` single-label pills and week/day views keep the
subtitle visible.

## `renderEventContent` rewrite

```ts
function renderEventContent (eventInfo) {
  // Events mode: IN · Property, single line
  if (props.viewMode === 'events') {
    const t = eventInfo.event.extendedProps.transitionType || 'in'
    const property = eventInfo.event.extendedProps.property as Property
    const label = `${t.toUpperCase()} · ${property ? formatPropertyAddress(property, 'short') : 'Property'}`
    return {
      html: `<div class="fc-event-content-wrapper transition-${escapeHtml(t)}">
               <div class="fc-event-lines"><div class="fc-event-title">${escapeHtml(label)}</div></div>
             </div>`,
    }
  }

  // Ranges mode: [time-chip?] property / guest
  const booking   = eventInfo.event.extendedProps.booking  as Booking
  const property  = eventInfo.event.extendedProps.property as Property
  const label     = property ? formatPropertyAddress(property, 'short') : 'Property'
  const guest     = booking.guest_name || ''
  // Use local-date slicing, not ISO/UTC — `booking.checkin_date` is a local yyyy-mm-dd.
  const segStart  = toLocalDateString(eventInfo.event.start)   // 'yyyy-mm-dd' in local tz
  const isFirst   = !!segStart && segStart === booking.checkin_date
  const timeChip  = (isFirst && booking.checkin_time) ? formatTimeChip(booking.checkin_time) : ''

  return {
    html: `
      <div class="fc-event-content-wrapper">
        ${timeChip ? `<span class="fc-event-time-chip">${escapeHtml(timeChip)}</span>` : ''}
        <div class="fc-event-lines">
          <div class="fc-event-title">${escapeHtml(label)}</div>
          ${guest ? `<div class="fc-event-subtitle">${escapeHtml(guest)}</div>` : ''}
        </div>
      </div>`,
  }
}

// Compact 12h formatter: '15:00' → '3p', '09:30' → '9:30a', '00:00' → '12a'
function formatTimeChip (hhmm: string): string { /* trivial */ }

// 'yyyy-mm-dd' in the user's local timezone (Date.toISOString() is UTC — unsafe).
function toLocalDateString (d: Date | null | undefined): string | null { /* trivial */ }
```

The `isFirst` check relies on `eventInfo.event.start` reflecting the segment start; for
multi-week events FullCalendar emits a distinct segment per row with its own `start`, so
the chip appears only on the top-left segment — which is the intended behavior.

## Deletions

- `getPriorityIcon`, `getStatusBadge` — local helpers, no external reference.
- `handleEventDidMount`, `measureBadge`, `applyBadge`, `BadgeMeasurement`.
- Scoped CSS: `.turn-event-badge` + `::after`, `.checkout-event-badge` + `::after`,
  `@keyframes turn-shimmer`, `@keyframes pulse`, `.booking-standard::before`,
  `.fc-event.booking-turn` bolded+border rules, `.status-pending` opacity rule,
  `.status-completed` strikethrough.
- `calendarOptions.eventDidMount` registration line.
- `calendar-tokens.css`: `--cal-turn-*`, `--cal-std-*`, and the `.fc-event.type-turn`
  priority-border rules.

## Events-mode color swap

```css
.fc-event.transition-in   { background-color: rgb(var(--v-theme-success))  !important;
                             border-color:     rgb(var(--v-theme-success))  !important; }
.fc-event.transition-turn { background-color: rgb(var(--v-theme-warning))  !important;
                             border-color:     rgb(var(--v-theme-warning))  !important; }
.fc-event.transition-out  { background-color: rgb(var(--v-theme-on-surface-variant)) !important;
                             border-color:     rgb(var(--v-theme-on-surface-variant)) !important; }
.fc-event.transition-highlight { box-shadow: 0 0 0 2px rgb(var(--v-theme-primary) / 0.6) !important; }
```

## Verification

- `pnpm build` must pass (strict `vue-tsc --noEmit`).
- `pnpm test:run` — no business-logic changes, but confirm nothing asserts on the deleted
  emoji/status markup.
- `pnpm dev` + Chrome DevTools screenshot at `/owner/calendar` and `/admin/calendar`:
  - month view renders flat pills, no emojis, no TURN/OUT badges, no shimmer, no
    hover-lift;
  - today cell has the primary-tinted wash;
  - prev/next-month day numbers are muted;
  - completed events render dim + neutral gray;
  - check-in time chip appears on the first segment of events that have a `checkin_time`;
  - dark mode still reads correctly.
- Drag + resize an event — feedback is simple opacity dim, no rotate, no shadow jump.

## Non-goals

- No changes to data flow, stores, composables, or business logic.
- No new components, no new props on `FullCalendar.vue`.
- No mobile-layout changes beyond what the new styles inherit.
- No change to the TURN/OUT badge semantics in any other surface (they're already absent
  elsewhere).
