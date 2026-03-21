# Calendar View Mode Toggle Design

**Date:** 2026-03-21
**Scope:** Add a Ranges/Events toggle to the owner calendar that switches between full booking spans and single-day transition events (IN, TURN, OUT).

## Overview

The owner calendar currently shows each booking as a multi-day bar spanning checkin→checkout, with TURN and OUT badges overlaid at specific day columns. This feature adds a second view mode — "Events" — that shows only the key transitions (IN, TURN, OUT) as distinct single-day events in their own calendar cells.

A pill toggle in the app bar switches between the two modes.

## View Modes

### Ranges Mode (default, current behavior)
- Each booking renders as a multi-day bar from `checkin_date` to `checkout_date`
- TURN and OUT badges overlay the bar at the appropriate day columns via `placeBadge`
- Shimmer animations on badges (existing)

### Events Mode (new)
- Each booking is split into 1-3 single-day events:
  - **IN** (green, `#43a047`) — on `checkin_date`, always present
  - **TURN** (orange, `#e65100`) — on `turn_date`, only if it exists
  - **OUT** (blue-grey, `#546e7a`) — on `checkout_date`, skipped if same as `turn_date`
- No multi-day bars, no badge overlays, no shimmer animations
- Clicking any transition event opens the booking detail dialog AND highlights all related events for that booking (2s highlight with box-shadow pulse)

## State Management

Add `viewMode` ref to `useCalendarState.ts` (existing singleton composable):

```typescript
const viewMode = ref<'ranges' | 'events'>('ranges')

function setViewMode(mode: 'ranges' | 'events') {
  viewMode.value = mode
}
```

Default is `'ranges'`. State is shared across layout/components via the singleton.

## Event Transformation

New function `bookingToTransitionEvents()` in `src/utils/calendarHelpers.ts`:

```typescript
function bookingToTransitionEvents(
  booking: Booking,
  property: Property | undefined
): CalendarBookingEvent[] {
  const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  const events: CalendarBookingEvent[] = []

  // IN event — always present
  events.push({
    id: `${booking.id}-in`,
    title: `IN · ${propertyLabel}`,
    start: booking.checkin_date,
    end: addOneDay(booking.checkin_date),
    classNames: ['transition-event', 'transition-in'],
    extendedProps: { booking, property, transitionType: 'in' },
  })

  // TURN event — only if turn_date exists
  if (booking.turn_date) {
    events.push({
      id: `${booking.id}-turn`,
      title: `TURN · ${propertyLabel}`,
      start: booking.turn_date,
      end: addOneDay(booking.turn_date),
      classNames: ['transition-event', 'transition-turn'],
      extendedProps: { booking, property, transitionType: 'turn' },
    })
  }

  // OUT event — skip if same day as turn
  if (booking.checkout_date !== booking.turn_date) {
    events.push({
      id: `${booking.id}-out`,
      title: `OUT · ${propertyLabel}`,
      start: booking.checkout_date,
      end: addOneDay(booking.checkout_date),
      classNames: ['transition-event', 'transition-out'],
      extendedProps: { booking, property, transitionType: 'out' },
    })
  }

  return events
}
```

IDs are suffixed with `-in`, `-turn`, `-out` so FullCalendar treats them as distinct events. Related events are found by matching `booking.id` in `extendedProps`.

**Type compatibility:** The `CalendarBookingEvent` interface requires `extendedProps` to include `bookingType`, `status`, `priority`, `guestCount`, and `notes`. Transition events must conform to this shape — populate these fields from the booking object:

```typescript
extendedProps: {
  booking,
  property,
  transitionType: 'in',  // new field
  bookingType: booking.booking_type,
  status: booking.status,
  priority: booking.priority,
  guestCount: booking.guest_count,
  notes: booking.notes,
},
```

Add `transitionType?: 'in' | 'turn' | 'out'` as an optional field to `CalendarBookingEvent['extendedProps']`.

## FullCalendar Component Changes

### New prop
```typescript
interface Props {
  bookings: Booking[]
  properties: Property[]
  loading?: boolean
  viewMode?: 'ranges' | 'events'
}
```

### calendarEvents computed
Switches between `bookingToCalendarEvent` (ranges) and `bookingToTransitionEvents` (events) based on `viewMode` prop. In events mode, set `editable: false`, `startEditable: false`, `durationEditable: false` on each event to prevent drag/drop/resize (moving a single transition event would corrupt booking dates).

### handleEventDidMount
Early return when `viewMode === 'events'` — no badge placement needed.

### renderEventContent
In events mode, render a simplified layout: just the transition label (IN/TURN/OUT) and property name. Skip the priority icons, status badges, and other range-mode decorations that rely on the full booking bar context.

### handleEventClick
In events mode, after opening the dialog, find all events sharing the same `booking.id` and add a `transition-highlight` class for 2 seconds, then remove it.

### handleManualMoreLinkClick
In events mode, filter by exact date match (event starts on clicked date) instead of range overlap.

## Styling

Added to `FullCalendar.vue` scoped styles:

```css
:deep(.transition-event) {
  border-radius: 6px !important;
  font-weight: 700;
  border: none !important;
}

:deep(.transition-in) {
  background: #43a047 !important;
  color: white !important;
}

:deep(.transition-turn) {
  background: #e65100 !important;
  color: white !important;
}

:deep(.transition-out) {
  background: #546e7a !important;
  color: white !important;
}

:deep(.transition-highlight) {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.6) !important;
  transform: scale(1.05);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
```

Colors match existing domain palette: green (success/checkin), orange (turn-urgent), blue-grey (checkout badge).

## Toggle Control

Pill toggle in owner app bar (`src/layouts/owner.vue`), next to existing view switcher dropdown. Uses `v-btn-toggle` with `mandatory`, `rounded="pill"`, `density="compact"`:

```vue
<v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="pill" color="primary" class="mr-2">
  <v-btn value="ranges" size="small" class="text-none">Ranges</v-btn>
  <v-btn value="events" size="small" class="text-none">Events</v-btn>
</v-btn-toggle>
```

Visible only on calendar page (`isCalendarPage` computed, already exists).

## Prop Threading

`viewMode` flows: `useCalendarState()` → `HomeOwner.vue` → `OwnerCalendar.vue` → `FullCalendar.vue`

## Event Click in Events Mode

`HomeOwner.vue`'s `handleEventClick` currently looks up the booking via `myBookings.value.find(b => b.id === clickInfo.event.id)`. In events mode, event IDs are suffixed (`{bookingId}-in`, etc.), so this lookup must use `extendedProps.booking` instead:

```typescript
const booking = clickInfo.event.extendedProps?.booking as Booking | undefined
```

This works for both modes since `extendedProps.booking` is always the full booking object.

## Files Modified

| File | Changes |
|------|---------|
| `src/composables/shared/useCalendarState.ts` | Add `viewMode` ref + `setViewMode()`, expose in return |
| `src/utils/calendarHelpers.ts` | Add `bookingToTransitionEvents()`, export |
| `src/components/smart/shared/FullCalendar.vue` | Add `viewMode` prop, switch `calendarEvents`, skip badges in events mode, click highlight, transition event CSS |
| `src/components/smart/owner/OwnerCalendar.vue` | Accept + pass through `viewMode` prop |
| `src/components/smart/owner/HomeOwner.vue` | Pass `viewMode` to `OwnerCalendar`, fix click handler to use `extendedProps.booking` |
| `src/layouts/owner.vue` | Add `v-btn-toggle` pill in app bar |

## Toggle Binding

In `owner.vue`, destructure `viewMode` from `useCalendarState()` so `v-model` binds directly to the ref:

```typescript
const { viewMode } = useCalendarState()
```

## Testing

Add tests for `bookingToTransitionEvents` in `src/__tests__/utils/calendarHelpers.spec.ts`:
- Standard booking → produces IN + OUT (2 events)
- Turn booking → produces IN + TURN + OUT (3 events)
- Turn booking where `turn_date === checkout_date` → produces IN + TURN (2 events, OUT skipped)
- Event IDs are correctly suffixed
- `transitionType` is set correctly in `extendedProps`

## Verification

- `pnpm build` must pass
- `pnpm test:run` must pass
- Toggle switches between Ranges and Events modes
- Events mode shows IN (green), TURN (orange), OUT (grey) as single-day events
- Clicking a transition event opens booking dialog and highlights related events
- Ranges mode unchanged from current behavior
