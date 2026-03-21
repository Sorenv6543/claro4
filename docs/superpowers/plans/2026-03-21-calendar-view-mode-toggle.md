# Calendar View Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Ranges/Events toggle that switches the owner calendar between full booking spans and single-day transition events (IN, TURN, OUT).

**Architecture:** New `bookingToTransitionEvents()` function in calendarHelpers.ts produces 1-3 single-day events per booking. FullCalendar switches event source based on a `viewMode` prop threaded from a singleton composable through the component chain. Pill toggle in the owner app bar controls the mode.

**Tech Stack:** Vue 3, Vuetify 4 (`v-btn-toggle`), FullCalendar, Pinia

**Spec:** `docs/superpowers/specs/2026-03-21-calendar-view-mode-toggle-design.md`

---

### Task 1: Add viewMode state to useCalendarState

**Files:**
- Modify: `src/composables/shared/useCalendarState.ts:12-28,265-298`

- [ ] **Step 1: Add viewMode ref to singleton state block**

In `src/composables/shared/useCalendarState.ts`, after line 28 (`const selectedPropertyIds = ...`), add:

```typescript
const viewMode = ref<'ranges' | 'events'>('ranges')
```

- [ ] **Step 2: Add setViewMode function**

Inside the `useCalendarState()` function body (after `setCalendarView`, around line 53), add:

```typescript
  function setViewMode(mode: 'ranges' | 'events') {
    viewMode.value = mode
  }
```

- [ ] **Step 3: Expose viewMode and setViewMode in return object**

In the return object (line 265), add to the "State" section:

```typescript
    viewMode,
```

And to the "Calendar navigation" section:

```typescript
    setViewMode,
```

- [ ] **Step 4: Verify build passes**

Run: `pnpm build:fast`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/composables/shared/useCalendarState.ts
git commit -m "feat: add viewMode state to useCalendarState composable"
```

---

### Task 2: Add bookingToTransitionEvents and tests

**Files:**
- Modify: `src/utils/calendarHelpers.ts:19-34,67`
- Modify: `src/__tests__/utils/calendarHelpers.spec.ts`

- [ ] **Step 1: Add transitionType to CalendarBookingEvent interface**

In `src/utils/calendarHelpers.ts`, update the `extendedProps` type in `CalendarBookingEvent` (line 25-33). Add `transitionType` as an optional field:

```typescript
export interface CalendarBookingEvent {
  id: string
  title: string
  start: string
  end: string
  classNames: string[]
  extendedProps: {
    booking: Booking
    property: Property | undefined
    bookingType: string
    status: string
    priority: string
    guestCount: number | null | undefined
    notes: string | null | undefined
    transitionType?: 'in' | 'turn' | 'out'
  }
}
```

- [ ] **Step 2: Write tests for bookingToTransitionEvents**

In `src/__tests__/utils/calendarHelpers.spec.ts`, add a new `describe` block after the existing `subtractOneDay` tests. Update the import on line 2 to include `bookingToTransitionEvents`:

```typescript
import { bookingToCalendarEvent, subtractOneDay, bookingToTransitionEvents } from '@/utils/calendarHelpers'
```

Add these tests:

```typescript
describe('bookingToTransitionEvents', () => {
  it('produces IN and OUT for a standard booking', () => {
    const events = bookingToTransitionEvents(makeBooking(), mockProperty)
    expect(events).toHaveLength(2)
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('out')
  })

  it('produces IN, TURN, and OUT for a turn booking', () => {
    const events = bookingToTransitionEvents(
      makeBooking({ booking_type: 'turn', turn_date: '2026-03-22' }),
      mockProperty,
    )
    expect(events).toHaveLength(3)
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('turn')
    expect(events[2].extendedProps.transitionType).toBe('out')
  })

  it('skips OUT when turn_date equals checkout_date', () => {
    const events = bookingToTransitionEvents(
      makeBooking({ booking_type: 'turn', turn_date: '2026-03-28', checkout_date: '2026-03-28' }),
      mockProperty,
    )
    expect(events).toHaveLength(2)
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('turn')
  })

  it('suffixes IDs correctly', () => {
    const events = bookingToTransitionEvents(
      makeBooking({ id: 'abc123', booking_type: 'turn', turn_date: '2026-03-22' }),
      mockProperty,
    )
    expect(events[0].id).toBe('abc123-in')
    expect(events[1].id).toBe('abc123-turn')
    expect(events[2].id).toBe('abc123-out')
  })

  it('sets each event to a single day', () => {
    const events = bookingToTransitionEvents(makeBooking(), mockProperty)
    // IN event: start=checkin, end=checkin+1
    expect(events[0].start).toBe('2026-03-19')
    expect(events[0].end).toBe('2026-03-20')
    // OUT event: start=checkout, end=checkout+1
    expect(events[1].start).toBe('2026-03-28')
    expect(events[1].end).toBe('2026-03-29')
  })

  it('includes transition-event class on all events', () => {
    const events = bookingToTransitionEvents(makeBooking(), mockProperty)
    events.forEach(e => {
      expect(e.classNames).toContain('transition-event')
    })
  })

  it('includes correct type-specific class', () => {
    const events = bookingToTransitionEvents(
      makeBooking({ booking_type: 'turn', turn_date: '2026-03-22' }),
      mockProperty,
    )
    expect(events[0].classNames).toContain('transition-in')
    expect(events[1].classNames).toContain('transition-turn')
    expect(events[2].classNames).toContain('transition-out')
  })

  it('includes title with transition label and property', () => {
    const events = bookingToTransitionEvents(makeBooking(), mockProperty)
    expect(events[0].title).toContain('IN')
    expect(events[0].title).toContain('434 ggg')
  })

  it('populates extendedProps with booking fields for type compatibility', () => {
    const events = bookingToTransitionEvents(makeBooking(), mockProperty)
    const ep = events[0].extendedProps
    expect(ep.booking).toBeDefined()
    expect(ep.property).toBeDefined()
    expect(ep.bookingType).toBe('standard')
    expect(ep.status).toBe('pending')
    expect(ep.priority).toBe('normal')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/utils/calendarHelpers.spec.ts`
Expected: FAIL — `bookingToTransitionEvents` is not exported.

- [ ] **Step 4: Implement bookingToTransitionEvents**

In `src/utils/calendarHelpers.ts`, add after the `bookingToCalendarEvent` function (after line 67):

```typescript
/**
 * Convert a Booking to 1-3 single-day FullCalendar events representing
 * key transitions: IN (checkin), TURN (if applicable), OUT (checkout).
 * Used in "events" view mode.
 */
export function bookingToTransitionEvents(
  booking: Booking,
  property: Property | undefined
): CalendarBookingEvent[] {
  const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  const events: CalendarBookingEvent[] = []

  const baseExtendedProps = {
    booking,
    property,
    bookingType: booking.booking_type,
    status: booking.status,
    priority: booking.priority,
    guestCount: booking.guest_count,
    notes: booking.notes,
  }

  // IN event — always present (on checkin_date)
  events.push({
    id: `${booking.id}-in`,
    title: `IN · ${propertyLabel}`,
    start: booking.checkin_date,
    end: addOneDay(booking.checkin_date),
    classNames: ['transition-event', 'transition-in'],
    extendedProps: { ...baseExtendedProps, transitionType: 'in' as const },
  })

  // TURN event — only if turn_date exists
  if (booking.turn_date) {
    events.push({
      id: `${booking.id}-turn`,
      title: `TURN · ${propertyLabel}`,
      start: booking.turn_date,
      end: addOneDay(booking.turn_date),
      classNames: ['transition-event', 'transition-turn'],
      extendedProps: { ...baseExtendedProps, transitionType: 'turn' as const },
    })
  }

  // OUT event — on checkout_date (skip if same as turn_date)
  if (booking.checkout_date !== booking.turn_date) {
    events.push({
      id: `${booking.id}-out`,
      title: `OUT · ${propertyLabel}`,
      start: booking.checkout_date,
      end: addOneDay(booking.checkout_date),
      classNames: ['transition-event', 'transition-out'],
      extendedProps: { ...baseExtendedProps, transitionType: 'out' as const },
    })
  }

  return events
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/utils/calendarHelpers.spec.ts`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/calendarHelpers.ts src/__tests__/utils/calendarHelpers.spec.ts
git commit -m "feat: add bookingToTransitionEvents for events view mode"
```

---

### Task 3: FullCalendar component — viewMode prop and event switching

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue:44-92,191-264,311-403,533-618`

- [ ] **Step 1: Add viewMode prop**

In `src/components/smart/shared/FullCalendar.vue`, update the Props interface (line 44) and defaults (line 64):

```typescript
  interface Props {
    bookings: Booking[]
    properties: Property[]
    loading?: boolean
    viewMode?: 'ranges' | 'events'
  }
```

```typescript
  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    viewMode: 'ranges',
  })
```

- [ ] **Step 2: Add bookingToTransitionEvents import**

Update the import from calendarHelpers (find the existing `bookingToCalendarEvent` import) to also include `bookingToTransitionEvents`:

```typescript
  import { bookingToCalendarEvent, bookingToTransitionEvents } from '@/utils/calendarHelpers'
```

- [ ] **Step 3: Update calendarEvents computed**

Replace the `calendarEvents` computed (lines 73-92) with:

```typescript
  const calendarEvents = computed(() => {
    const propertyMap = new Map(props.properties.map(p => [p.id, p]))

    if (props.viewMode === 'events') {
      return props.bookings.flatMap(booking => {
        const property = propertyMap.get(booking.property_id)
        return bookingToTransitionEvents(booking, property).map(event => ({
          ...event,
          editable: false,
          startEditable: false,
          durationEditable: false,
          overlap: true,
        }))
      })
    }

    return props.bookings.map(booking => {
      const property = propertyMap.get(booking.property_id)
      const base = bookingToCalendarEvent(booking, property)

      return {
        ...base,
        editable: true,
        startEditable: true,
        durationEditable: true,
        overlap: true,
        classNames: [
          ...base.classNames,
          `booking-${booking.booking_type}`,
          `status-${booking.status}`,
        ],
      }
    })
  })
```

- [ ] **Step 4: Guard handleEventDidMount for events mode**

In the `handleEventDidMount` function (around line 242), add an early return at the top:

```typescript
  function handleEventDidMount (info: { event: { extendedProps: Record<string, unknown> }, el: HTMLElement }) {
    if (props.viewMode === 'events') return

    const booking = info.event.extendedProps?.booking as Booking | undefined
    // ... rest unchanged
```

- [ ] **Step 5: Add simplified renderEventContent for events mode**

In `renderEventContent` (line 311), add an early return for events mode before the existing logic:

```typescript
  function renderEventContent (eventInfo: {
    event: {
      title: string
      extendedProps: {
        booking: Booking
        property: Property
        transitionType?: 'in' | 'turn' | 'out'
      }
    }
  }) {
    // Events mode: simplified label-only rendering
    if (props.viewMode === 'events') {
      const transitionType = eventInfo.event.extendedProps.transitionType || 'in'
      const label = transitionType.toUpperCase()
      const booking = eventInfo.event.extendedProps.booking as Booking
      const property = eventInfo.event.extendedProps.property as Property
      const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Property'

      return {
        html: `
        <div class="fc-event-content-wrapper transition-${transitionType}">
          <div class="fc-event-title">${label} · ${propertyLabel}</div>
          <div class="fc-event-subtitle">${booking.status.toUpperCase()}</div>
        </div>
        `,
      }
    }

    // Ranges mode: existing logic below...
    const booking = eventInfo.event.extendedProps.booking as Booking
    // ... rest unchanged
```

- [ ] **Step 6: Add click highlight for events mode**

In `handleEventClick` (around line 286), add highlight logic after the emit:

```typescript
  function handleEventClick (clickInfo: EventClickArg): void {
    eventLogger.logEvent(
      'FullCalendar',
      'HomeOwner',
      'eventClick',
      { id: clickInfo.event.id },
      'emit',
    )

    emit('event-click', clickInfo)

    // In events mode, highlight related transition events
    if (props.viewMode === 'events') {
      const bookingId = clickInfo.event.extendedProps?.booking?.id
      if (bookingId && calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        const relatedEvents = calendarApi.getEvents()
          .filter((e: { extendedProps?: { booking?: { id: string } } }) =>
            e.extendedProps?.booking?.id === bookingId
          )
        relatedEvents.forEach((e: { setProp: (key: string, val: string[]) => void, classNames: string[] }) => {
          const original = [...e.classNames]
          e.setProp('classNames', [...e.classNames, 'transition-highlight'])
          setTimeout(() => {
            e.setProp('classNames', original)
          }, 2000)
        })
      }
    }
  }
```

- [ ] **Step 7: Update handleManualMoreLinkClick for events mode**

In `handleManualMoreLinkClick` (line 533), update the booking filtering logic. Replace lines 601-615:

```typescript
    const dayBookings: Booking[] = []

    if (props.viewMode === 'events') {
      // Events mode: match bookings that have a transition on this exact date
      for (const booking of props.bookings) {
        const hasTransition =
          booking.checkin_date === dateAttr ||
          booking.turn_date === dateAttr ||
          booking.checkout_date === dateAttr
        if (hasTransition) {
          dayBookings.push(booking)
        }
      }
    } else {
      // Ranges mode: existing range-overlap logic
      for (const booking of props.bookings) {
        const checkoutDate = new Date(booking.checkout_date)
        const checkinDate = new Date(booking.checkin_date)
        const bookingStartsOnDate = checkinDate.toDateString() === clickedDateStr
        const bookingSpansDate = clickedDate >= checkinDate && clickedDate <= checkoutDate
        const dateMatches = bookingStartsOnDate || bookingSpansDate
        if (dateMatches) {
          dayBookings.push(booking)
        }
      }
    }
```

- [ ] **Step 8: Verify build passes**

Run: `pnpm build:fast`
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "feat: add viewMode prop to FullCalendar with events mode support"
```

---

### Task 4: Transition event CSS

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue` (scoped styles section, end of file)

- [ ] **Step 1: Add transition event styles**

At the end of the `<style scoped>` block in `FullCalendar.vue` (before the closing `</style>` tag), add:

```css
/* ── Events view mode: transition event styles ── */
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

- [ ] **Step 2: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "feat: add transition event CSS for events view mode"
```

---

### Task 5: Thread viewMode prop through OwnerCalendar and HomeOwner

**Files:**
- Modify: `src/components/smart/owner/OwnerCalendar.vue:34-40`
- Modify: `src/components/smart/owner/HomeOwner.vue:18-31,287-312`

- [ ] **Step 1: Add viewMode prop to OwnerCalendar**

In `src/components/smart/owner/OwnerCalendar.vue`, update the Props interface (line 34):

```typescript
  interface Props {
    bookings: Booking[]
    properties: Property[]
    loading?: boolean
    currentView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
    currentDate?: Date
    viewMode?: 'ranges' | 'events'
  }
```

- [ ] **Step 2: Pass viewMode to FullCalendar in OwnerCalendar template**

Find the `<FullCalendar>` component in the template of `OwnerCalendar.vue` and add the `viewMode` prop. The template should pass it through:

```vue
        <FullCalendar
          ...existing props...
          :view-mode="viewMode"
          ...existing event handlers...
        />
```

- [ ] **Step 3: Update HomeOwner to pass viewMode**

In `src/components/smart/owner/HomeOwner.vue`, destructure `viewMode` from the composable. Find the existing destructuring of `useCalendarState()` (around line 140) and add `viewMode`:

```typescript
  const {
    currentView,
    currentDate,
    filterBookings,
    setCalendarView,
    viewMode,
  } = useCalendarState()
```

Then update the `<OwnerCalendar>` component in the template (line 18) to pass it:

```vue
        <OwnerCalendar
          ref="calendarRef"
          :bookings="ownerFilteredBookings"
          :current-date="currentDate"
          :current-view="currentView"
          :loading="loading"
          :properties="myProperties"
          :view-mode="viewMode"
          @create-booking="handleCreateBookingFromCalendar"
          ...rest of event handlers...
        />
```

- [ ] **Step 4: Fix handleEventClick to use extendedProps.booking**

In `src/components/smart/owner/HomeOwner.vue`, update `handleEventClick` (line 287). Replace the fallback lookup (line 306) to use `extendedProps.booking` which works for both modes:

```typescript
  function handleEventClick (clickInfo: EventClickArg): void {
    eventLogger.logEvent(
      'FullCalendar',
      'HomeOwner',
      'eventClick',
      { id: clickInfo.event.id },
      'receive',
    )

    // Check if this is an edit event from the bottom sheet
    const extendedProps = clickInfo.event.extendedProps
    if (extendedProps && extendedProps.isEdit && extendedProps.booking) {
      const booking = extendedProps.booking as Booking
      uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
      return
    }

    // Use extendedProps.booking (works for both ranges and events mode)
    const booking = extendedProps?.booking as Booking | undefined
    if (booking && myBookings.value.some(b => b.id === booking.id)) {
      uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
    } else {
      console.warn('Cannot edit booking not owned by current user')
    }
  }
```

- [ ] **Step 5: Verify build passes**

Run: `pnpm build:fast`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/smart/owner/OwnerCalendar.vue src/components/smart/owner/HomeOwner.vue
git commit -m "feat: thread viewMode prop through OwnerCalendar and HomeOwner"
```

---

### Task 6: Add pill toggle to owner layout

**Files:**
- Modify: `src/layouts/owner.vue:62-88,199`

- [ ] **Step 1: Destructure viewMode from useCalendarState**

In `src/layouts/owner.vue`, find where `useCalendarState()` is called and destructure `viewMode`. Look for the existing destructuring (the file already imports `useCalendarState` and uses `calendarState`). Add `viewMode` to whatever destructuring pattern exists, or access it via `calendarState.viewMode`.

If it uses `const calendarState = useCalendarState()`, add a separate destructure:

```typescript
const { viewMode } = useCalendarState()
```

Note: since `useCalendarState` is a singleton, calling it again returns the same refs.

- [ ] **Step 2: Add v-btn-toggle to template**

In the template, find the `<template v-if="isCalendarPage">` block that contains the view switcher dropdown (around line 62). Add the pill toggle **before** the existing `<v-menu>`:

```vue
      <template v-if="isCalendarPage">
        <!-- View mode toggle (Ranges / Events) -->
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="compact"
          rounded="pill"
          color="primary"
          class="mr-2"
        >
          <v-btn value="ranges" size="small" class="text-none">Ranges</v-btn>
          <v-btn value="events" size="small" class="text-none">Events</v-btn>
        </v-btn-toggle>

        <!-- Existing view type dropdown (Month/Week/Day/List) -->
        <v-menu location="bottom end">
          ...existing menu...
        </v-menu>
      </template>
```

- [ ] **Step 3: Verify the toggle renders**

Run: `pnpm dev`
Navigate to `http://localhost:3000/owner/dashboard`. Confirm the pill toggle appears in the app bar next to the Month dropdown.

- [ ] **Step 4: Verify toggle switches modes**

Click "Events" — calendar should switch to showing single-day IN/TURN/OUT events.
Click "Ranges" — calendar should return to multi-day booking bars with badges.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/owner.vue
git commit -m "feat: add Ranges/Events pill toggle to owner app bar"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test:run`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Build completes with no type errors.

- [ ] **Step 3: Run performance tests**

Run: `pnpm test:performance`
Expected: All performance tests pass.

- [ ] **Step 4: Manual verification**

Open `http://localhost:3000/owner/dashboard` and verify:
1. Pill toggle shows "Ranges" / "Events" in app bar
2. Ranges mode: multi-day bars with TURN/OUT badges (unchanged)
3. Events mode: single-day IN (green), TURN (orange), OUT (grey) events
4. Click a transition event → booking dialog opens + related events highlight for 2s
5. Events are not draggable/resizable in events mode
6. "+N more" link works correctly in both modes
7. View switcher (Month/Week/Day/List) works in both modes
