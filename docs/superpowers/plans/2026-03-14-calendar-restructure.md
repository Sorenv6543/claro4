# Calendar Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix a broken calendar stack (dashboard fails to load), eliminate duplicate data access patterns, make `FullCalendar.vue` truly shared, and establish a single color system — in 5 independently-committable tasks.

**Architecture:** Three-layer hierarchy: `HomeOwner` (orchestration) → `OwnerCalendar` (owner shell) → `FullCalendar` (generic renderer). Data flows down as arrays from composables, interactions bubble up as events. FullCalendar is the navigation source of truth via `datesSet` callback.

**Tech Stack:** Vue 3 + TypeScript, FullCalendar 6 (`@fullcalendar/vue3`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`), Vitest, pnpm

**Spec:** `docs/superpowers/specs/2026-03-14-calendar-restructure-design.md`

---

## File Map

| File | Role | Task |
|------|------|------|
| `src/utils/calendarHelpers.ts` | Add `subtractOneDay` helper; export it | 1 |
| `src/__tests__/utils/calendarHelpers.spec.ts` | Add tests for `subtractOneDay` | 1 |
| `src/components/smart/shared/FullCalendar.vue` | Uncomment 4 broken functions | 1, 3, 4, 5 |
| `src/components/smart/owner/OwnerCalendar.vue` | Fix template/import bug; add `datesSet` | 1, 5 |
| `src/components/smart/owner/HomeOwner.vue` | Fix swapped dates; clean data access | 1, 2, 5 |
| `src/composables/shared/useCalendarState.ts` | Remove date-range filter; deprecate `bookingsToEvents` | 2, 5 |
| `src/components/smart/admin/AdminCalendar.vue` | Map→array conversion for FullCalendar props | 2 |
| `src/composables/admin/useAdminCalendarState.ts` | Convert bookings/properties to arrays | 2 |
| `src/styles/calendar-tokens.css` | New file: Vuetify token vars for event colors | 4 |

---

## Task 1: Critical Bug Fixes — Make the App Load

**Root cause:** `FullCalendar.vue` references 4 undefined symbols (`handleEventDrop`, `goToDate`, `changeView`, `refreshEvents`) — TypeScript fails to compile the module — Vite cannot serve the dynamic import — dashboard shows "Failed to fetch".

**Files:**
- Modify: `src/utils/calendarHelpers.ts`
- Modify: `src/__tests__/utils/calendarHelpers.spec.ts`
- Modify: `src/components/smart/shared/FullCalendar.vue:254,322–341,431–468,779–782`
- Modify: `src/components/smart/owner/OwnerCalendar.vue:14,74`
- Modify: `src/components/smart/owner/HomeOwner.vue:373–374,430–431,469–470`

---

- [ ] **Step 1.1: Write failing tests for `subtractOneDay`**

Open `src/__tests__/utils/calendarHelpers.spec.ts`. Add after the existing `describe` block:

```ts
describe('subtractOneDay', () => {
  it('subtracts one day from a YYYY-MM-DD string', () => {
    expect(subtractOneDay('2026-03-29')).toBe('2026-03-28')
  })

  it('handles month boundaries', () => {
    expect(subtractOneDay('2026-03-01')).toBe('2026-02-28')
  })

  it('handles year boundaries', () => {
    expect(subtractOneDay('2026-01-01')).toBe('2025-12-31')
  })
})
```

Also update the import at the top:
```ts
import { bookingToCalendarEvent, subtractOneDay } from '@/utils/calendarHelpers'
```

- [ ] **Step 1.2: Run the tests — expect them to fail**

```bash
pnpm test -- src/__tests__/utils/calendarHelpers.spec.ts
```

Expected: `subtractOneDay is not a function` (or similar import error)

- [ ] **Step 1.3: Add `subtractOneDay` to `src/utils/calendarHelpers.ts`**

After the `addOneDay` function (line 9), add and export:

```ts
/** Subtract one day from a YYYY-MM-DD string (reverses FullCalendar exclusive end offset on write-back). */
export function subtractOneDay(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}
```

> **UTC caveat:** `new Date('YYYY-MM-DD')` parses as UTC midnight. `toISOString()` returns UTC. In UTC-offset timezones (e.g. UTC-5), local midnight is the *previous* UTC date, so the result may be one day too early. The existing `addOneDay` has the same fragility. This is acceptable because Supabase stores dates as `YYYY-MM-DD` strings (no time component) and the dev server + CI both run in UTC. If timezone support is added in future, replace with local-date arithmetic: `new Date(y, m, d - 1)` and format manually.

- [ ] **Step 1.4: Run tests — expect them to pass**

```bash
pnpm test -- src/__tests__/utils/calendarHelpers.spec.ts
```

Expected: all 8 tests pass (5 existing + 3 new)

- [ ] **Step 1.5: Fix FullCalendar.vue — uncomment `goToDate`, `changeView`, `refreshEvents`**

In `src/components/smart/shared/FullCalendar.vue`, lines 431–468 are three commented-out functions. Uncomment all three by removing the `//` prefix from each line:

```ts
function goToDate(date: string | Date): void {
  if (!calendarRef.value) return
  try {
    const calendarApi = calendarRef.value.getApi()
    if (calendarApi && typeof calendarApi.gotoDate === 'function') {
      calendarApi.gotoDate(date)  // NOTE: FullCalendar API uses gotoDate (lowercase t)
    }
  } catch (error) {
    console.warn('Error going to date:', error)
  }
}

function changeView(viewName: string): void {
  if (!calendarRef.value) return
  try {
    const calendarApi = calendarRef.value.getApi()
    if (calendarApi && typeof calendarApi.changeView === 'function') {
      calendarApi.changeView(viewName)
    }
  } catch (error) {
    console.warn('Error changing view:', error)
  }
}

function refreshEvents(): void {
  if (!calendarRef.value) return
  try {
    const calendarApi = calendarRef.value.getApi()
    if (calendarApi && typeof calendarApi.refetchEvents === 'function') {
      calendarApi.refetchEvents()  // NOTE: FullCalendar API uses refetchEvents (not refreshEvents)
    }
  } catch (error) {
    console.warn('Error refreshing events:', error)
  }
}
```

- [ ] **Step 1.6: Fix FullCalendar.vue — restore `handleEventDrop`**

Lines 322–339 are a commented-out function with a missing closing `}`. Replace the entire comment block (lines 322–339) with a working implementation:

```ts
function handleEventDrop(dropInfo: EventDropArg): void {
  emit('event-drop', dropInfo)
}
```

(`EventDropArg` is already imported at line 24 from `@fullcalendar/core` — no import change needed.)

- [ ] **Step 1.7: Fix OwnerCalendar.vue — template handler name**

In `src/components/smart/owner/OwnerCalendar.vue` line 14, change:
```html
@event-resize="handleEventResizeDone"
```
to:
```html
@event-resize="handleEventResize"
```

- [ ] **Step 1.8: Fix OwnerCalendar.vue — add missing import**

In `src/components/smart/owner/OwnerCalendar.vue`, line 20 currently reads:
```ts
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
```

Add a second import line after it:
```ts
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
```

- [ ] **Step 1.9: Fix HomeOwner.vue — add `subtractOneDay` import**

In `src/components/smart/owner/HomeOwner.vue`, find the calendarHelpers import and add `subtractOneDay`:

```ts
import { bookingToCalendarEvent, subtractOneDay } from '@/utils/calendarHelpers'
```

(If `bookingToCalendarEvent` isn't currently imported there, check the actual import line and add `subtractOneDay` to it, or add a new import if calendarHelpers isn't imported at all.)

- [ ] **Step 1.10: Fix HomeOwner.vue — date-select handler (swapped fields)**

At `src/components/smart/owner/HomeOwner.vue` lines 372–374, the current code is:
```ts
const bookingData: Partial<BookingFormData> = {
  checkout_date: selectInfo.startStr,   // BUG: startStr assigned to checkout
  checkin_date: selectInfo.endStr,       // BUG: endStr assigned to checkin
```

Replace with (no `subtractOneDay` needed — for fresh selection, `endStr` IS the correct checkout date):
```ts
const bookingData: Partial<BookingFormData> = {
  checkin_date: selectInfo.startStr,
  checkout_date: selectInfo.endStr,
```

- [ ] **Step 1.11: Fix HomeOwner.vue — event-drop handler (swapped + offset)**

At lines 429–432, current code:
```ts
const result = await updateMyBooking(booking.id, {
  checkout_date: dropInfo.event.startStr,
  checkin_date: dropInfo.event.endStr || dropInfo.event.startStr,
```

Replace with (`subtractOneDay` reverses the `addOneDay` offset applied by `bookingToCalendarEvent`):
```ts
const result = await updateMyBooking(booking.id, {
  checkin_date: dropInfo.event.startStr,
  checkout_date: subtractOneDay(dropInfo.event.endStr || dropInfo.event.startStr),
```

- [ ] **Step 1.12: Fix HomeOwner.vue — event-resize handler (swapped + offset)**

At lines 468–471, current code:
```ts
const result = await updateMyBooking(booking.id, {
  checkout_date: resizeInfo.event.startStr,
  checkin_date: resizeInfo.event.endStr,
```

Replace with:
```ts
const result = await updateMyBooking(booking.id, {
  checkin_date: resizeInfo.event.startStr,
  checkout_date: subtractOneDay(resizeInfo.event.endStr || resizeInfo.event.startStr),
```

- [ ] **Step 1.13: Fix HomeOwner.vue — `handleUpdateBooking` (swapped fields, no offset)**

Find `handleUpdateBooking` (~line 532). This handler receives `data: { id: string, start: string, end: string }` from a form (not from FullCalendar event objects), so no `subtractOneDay` is needed — just swap the field names:

```ts
// Before (BUG — fields are swapped):
checkin_date: data.end,
checkout_date: data.start,

// After (CORRECT):
checkin_date: data.start,
checkout_date: data.end,
```

- [ ] **Step 1.14: Verify build passes**

```bash
pnpm build
```

Expected: no TypeScript errors. If errors remain, read the full error output and fix before continuing.

- [ ] **Step 1.15: Verify tests still pass**

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] **Step 1.16: Start dev server and verify dashboard loads**

```bash
pnpm dev
```

Navigate to `http://localhost:3000`. Log in as owner. Expected: dashboard loads, calendar renders, no "Failed to fetch" error in console.

- [ ] **Step 1.17: Commit**

```bash
git checkout -b fix/calendar-restructure
git add src/utils/calendarHelpers.ts \
        src/__tests__/utils/calendarHelpers.spec.ts \
        src/components/smart/shared/FullCalendar.vue \
        src/components/smart/owner/OwnerCalendar.vue \
        src/components/smart/owner/HomeOwner.vue
git commit -m "fix: restore commented-out calendar functions; fix swapped checkin/checkout dates

- Uncomment goToDate/changeView/refreshEvents in FullCalendar.vue (caused Failed to fetch)
- Restore handleEventDrop in FullCalendar.vue
- Fix @event-resize handler name mismatch in OwnerCalendar template
- Add missing EventResizeDoneArg import to OwnerCalendar
- Fix swapped checkin_date/checkout_date in select/drop/resize handlers
- Add subtractOneDay helper to calendarHelpers (reverses addOneDay offset on write-back)"
```

---

## Task 2: HomeOwner Data Flow — Remove Duplicate Store Access

**Why:** HomeOwner already imports `useOwnerBookings` and `useOwnerProperties`, but ALSO directly accesses `bookingStore` and `propertyStore`, building its own owner-filtered Maps. This duplicates composable work and bypasses the single source of truth. Remove the duplicate path.

**Files:**
- Modify: `src/components/smart/owner/HomeOwner.vue:146–147,226–293,709–763`
- Modify: `src/composables/shared/useCalendarState.ts:217–265,309–340`
- Modify: `src/components/smart/admin/AdminCalendar.vue` (prevent prop breakage)
- Modify: `src/components/smart/admin/useAdminCalendarState.ts` (if it passes Maps to FullCalendar)

---

- [ ] **Step 2.1: Read current `useCalendarState.filterBookings` implementation**

Read `src/composables/shared/useCalendarState.ts` lines 217–270 to understand which part filters by date range vs. by status/type. Note the exact lines to change.

- [ ] **Step 2.2: Remove date-range clause from `filterBookings`**

In `src/composables/shared/useCalendarState.ts`, `filterBookings` currently filters bookings to `dateRange.value`. Remove the date-range block (lines ~253–255 plus any surrounding `||` logic), keeping only the status/type visibility filters. The function should return all bookings that match the active status/type filters, regardless of date.

The function signature stays the same: `function filterBookings(bookings: Booking[]): Booking[]`

- [ ] **Step 2.3: Deprecate `bookingsToEvents` and clean up orphaned `dateRange` state in `useCalendarState`**

`bookingsToEvents` (line 309) is in the composable's public return. It cannot be deleted without a breaking change.

1. Add `/** @deprecated — event mapping moved to FullCalendar component props. Do not add new callers. */` JSDoc above the function.
2. Remove `bookingsToEvents` from the `return` object at the bottom of the composable.
3. Remove `dateRange` and `updateDateRange` from the `return` object (they are now orphaned).
4. Remove the two `uiStore.setFilter(...)` calls inside `updateDateRange()` (lines ~143–144):
   ```ts
   // DELETE these two lines from updateDateRange():
   uiStore.setFilter('dateRangeStart', start.toISOString())
   uiStore.setFilter('dateRangeEnd', end.toISOString())
   ```
   These were feeding the now-orphaned filter state. The `updateDateRange` function body can remain (it still updates the local `dateRange` ref, which `datesSet` in Task 5 will write to via `goToDate`), but it must not write stale values to the UI store.

> **Do not delete `dateRange`, `updateDateRange`, or `bookingsToEvents` function bodies yet** — only remove them from the return and remove the UI store writes. A follow-up can delete the bodies once confirmed no callers remain.

- [ ] **Step 2.4: Remove `ownerBookingsMap` and `ownerPropertiesMap` from HomeOwner**

In `src/components/smart/owner/HomeOwner.vue`:

1. Delete the two computed blocks (lines ~226–292: `ownerPropertiesMap` and `ownerBookingsMap`).
2. Delete the direct store imports for data access:
   ```ts
   // DELETE these two lines:
   const propertyStore = usePropertyStore()
   const bookingStore = useBookingStore()
   ```
   (Keep `useUIStore` — it's used for modal state.)
3. Replace `import { usePropertyStore } from '@/stores/property'` and `import { useBookingStore } from '@/stores/booking'` at the top with nothing (or remove from the import line if they share an import).

- [ ] **Step 2.5: Replace ownerBookingsMap/ownerPropertiesMap references throughout HomeOwner**

After removing those computeds, TypeScript will flag every reference. Fix each:

| Old reference | Replacement |
|---------------|-------------|
| `ownerBookingsMap.value.get(clickInfo.event.id)` | `myBookings.value.find(b => b.id === clickInfo.event.id)` |
| `ownerBookingsMap.value.has(booking.id)` | `myBookings.value.some(b => b.id === booking.id)` |
| `ownerPropertiesMap.value.has(propertyId)` | `myProperties.value.some(p => p.id === propertyId)` |
| `ownerPropertiesMap.value.has(propertyModalData.value.id)` | `myProperties.value.some(p => p.id === propertyModalData.value.id)` |
| `:properties="ownerPropertiesMap"` in template | `:properties="myProperties"` |
| `:bookings="ownerBookingsMap"` in template (if present) | `:bookings="ownerFilteredBookings"` |

- [ ] **Step 2.6: Add `ownerFilteredBookings` computed using composable**

In HomeOwner.vue script, replace the deleted filter logic with:
```ts
const ownerFilteredBookings = computed(() => filterBookings(myBookings.value))
```

- [ ] **Step 2.7: Replace `fetchProperties()` / `fetchBookings()` in `onMounted`**

`onMounted` currently calls `propertyStore.fetchProperties()` and `bookingStore.fetchBookings()`. Replace with composable fetch methods:
```ts
// Replace:
await Promise.all([propertyStore.fetchProperties(), bookingStore.fetchBookings()])
// With:
await Promise.all([fetchMyProperties(), fetchMyBookings()])
```

(These are already available from the `useOwnerBookings` and `useOwnerProperties` destructuring at the top of the component. If the names differ, check the composable return objects.)

- [ ] **Step 2.8: Update FullCalendar.vue prop types — Map → Array**

In `src/components/smart/shared/FullCalendar.vue`, the `Props` interface currently reads:
```ts
interface Props {
  bookings: Map<string, Booking>
  properties: Map<string, Property>
  loading?: boolean
}
```

Change to:
```ts
interface Props {
  bookings: Booking[]
  properties: Property[]
  loading?: boolean
}
```

Then update `calendarEvents` computed inside FullCalendar.vue — it currently calls `Array.from(props.bookings.values())`. Change to use the array directly:
```ts
const calendarEvents = computed(() => {
  return props.bookings.map(booking => {
    const property = props.properties.find(p => p.id === booking.property_id)
    // ... rest unchanged
  })
})
```

Also update any other Map-access patterns within FullCalendar.vue (`.get()`, `.has()`, `.values()`, `.size`) to use array equivalents.

- [ ] **Step 2.9: Update OwnerCalendar.vue prop types — Map → Array**

Same prop type change in `src/components/smart/owner/OwnerCalendar.vue`:
```ts
interface Props {
  bookings: Booking[]
  properties: Property[]
  loading?: boolean
  currentView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  currentDate?: Date
}
```

No logic change needed — OwnerCalendar passes props straight through to FullCalendar.

- [ ] **Step 2.10: Fix AdminCalendar.vue — prevent prop breakage**

`AdminCalendar.vue` currently passes `Map<string, Booking>` to FullCalendar. Now that FullCalendar expects `Booking[]`, add a conversion before the pass:

Read `src/components/smart/admin/AdminCalendar.vue` to find how it passes bookings/properties to FullCalendar, then add:
```ts
// Before passing to FullCalendar:
const calendarBookings = computed(() => Array.from(bookingsMap.value.values()))
const calendarProperties = computed(() => Array.from(propertiesMap.value.values()))
```

And update the template bindings to use these computed arrays.

- [ ] **Step 2.11: Verify build passes**

```bash
pnpm build
```

Expected: no TypeScript errors. If `ownerBookingsMap` or `ownerPropertiesMap` references remain, the build will tell you exactly where.

- [ ] **Step 2.12: Run tests**

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] **Step 2.13: Visual check — bookings still display**

```bash
pnpm dev
```

Navigate to owner dashboard. Verify bookings still appear on the calendar and property names are correct.

- [ ] **Step 2.14: Commit**

```bash
git add src/components/smart/owner/HomeOwner.vue \
        src/components/smart/shared/FullCalendar.vue \
        src/components/smart/owner/OwnerCalendar.vue \
        src/components/smart/admin/AdminCalendar.vue \
        src/composables/shared/useCalendarState.ts
git commit -m "refactor: remove duplicate store access from HomeOwner; props Map→Array

- HomeOwner now reads exclusively from useOwnerBookings/useOwnerProperties
- Remove ownerBookingsMap/ownerPropertiesMap computed duplicates
- Remove direct propertyStore/bookingStore data access
- filterBookings no longer clips by date range (FullCalendar handles viewport)
- FullCalendar/OwnerCalendar props changed from Map to Array
- AdminCalendar adapts Maps to arrays before passing to FullCalendar"
```

---

## Task 3: Make FullCalendar.vue Genuinely Shared

**Why:** `FullCalendar.vue` lives in `smart/shared/` but imports `useAuthStore` and renders `OwnerDayViewBottomSheet` — it's secretly owner-specific. Any future role (Admin, Cleaner) cannot reuse it without getting owner UI.

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue`
- Modify: `src/components/smart/owner/HomeOwner.vue` (receives moved state + BottomSheet)

---

- [ ] **Step 3.1: Move BottomSheet state and handlers from FullCalendar.vue to HomeOwner.vue**

In `src/components/smart/shared/FullCalendar.vue`, locate and move these to `HomeOwner.vue`:

```ts
// These refs move to HomeOwner:
const dayViewVisible = ref(false)
const selectedDate = ref<Date | null>(null)
const selectedDayBookings = ref<Booking[]>([])

// These handlers move to HomeOwner:
function handleViewBooking(booking: Booking): void { ... }
function handleEditBooking(booking: Booking): void { ... }
function handleCompleteBooking(booking: Booking): void { ... }
function handleAddBookingFromDayView(data: ...): void { ... }
```

- [ ] **Step 3.2: Add `day-view-open` emit to FullCalendar.vue**

FullCalendar.vue needs a way to tell HomeOwner "the user clicked +N more on this day". Add to the `Emits` interface:

```ts
(e: 'day-view-open', payload: { date: Date, bookings: Booking[] }): void
```

- [ ] **Step 3.3: Replace BottomSheet in FullCalendar.vue with emit**

In `FullCalendar.vue`, find `handleManualMoreLinkClick` (or wherever `dayViewVisible` is set to `true` and `selectedDayBookings` is populated). Replace the direct state mutation with an emit:

```ts
// Before:
selectedDayBookings.value = bookingsForDay
dayViewVisible.value = true

// After:
emit('day-view-open', { date: clickedDate, bookings: bookingsForDay })
```

- [ ] **Step 3.4: Remove OwnerDayViewBottomSheet from FullCalendar.vue template**

Delete the `<OwnerDayViewBottomSheet ... />` block from the template and remove its import.

- [ ] **Step 3.5: Remove `useAuthStore` from FullCalendar.vue**

Delete `import { useAuthStore } from '@/stores/auth'` and `const authStore = useAuthStore()`.

Remove the owner-id filter in `handleManualMoreLinkClick` (the `!currentUserId || booking.owner_id === currentUserId` check). FullCalendar already receives pre-filtered bookings from HomeOwner — no in-component owner check needed.

- [ ] **Step 3.6: Add OwnerDayViewBottomSheet to HomeOwner.vue**

Move the `<OwnerDayViewBottomSheet>` template block and its moved refs/handlers into HomeOwner.vue.

Listen for the `day-view-open` event from OwnerCalendar (which passes it through from FullCalendar):

```ts
function handleDayViewOpen(payload: { date: Date, bookings: Booking[] }): void {
  selectedDate.value = payload.date
  selectedDayBookings.value = payload.bookings
  dayViewVisible.value = true
}
```

Add `@day-view-open="handleDayViewOpen"` to the `<OwnerCalendar>` element in the template.

Also thread the `day-view-open` emit through OwnerCalendar.vue (it receives the event from FullCalendar and re-emits it up):

In OwnerCalendar.vue `Emits`:
```ts
(e: 'day-view-open', payload: { date: Date, bookings: Booking[] }): void
```

In OwnerCalendar.vue template: `@day-view-open="(p) => emit('day-view-open', p)"`

- [ ] **Step 3.7: Verify no owner imports remain in FullCalendar.vue**

```bash
grep -n "owner\|Owner\|auth\|Auth" src/components/smart/shared/FullCalendar.vue
```

Expected: no results (or only generic words that are not owner-domain imports).

- [ ] **Step 3.8: Build and test**

```bash
pnpm build && pnpm test:run
```

Expected: clean build, all tests pass. Fix any TypeScript errors before continuing.

- [ ] **Step 3.9: Visual check — bottom sheet still works**

```bash
pnpm dev
```

Click a "+N more" link on a day with multiple bookings. Verify the day view bottom sheet opens with correct bookings.

- [ ] **Step 3.10: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue \
        src/components/smart/owner/OwnerCalendar.vue \
        src/components/smart/owner/HomeOwner.vue
git commit -m "refactor: make FullCalendar.vue genuinely shared; move OwnerDayViewBottomSheet to HomeOwner

- Remove useAuthStore from FullCalendar.vue
- Remove OwnerDayViewBottomSheet from FullCalendar.vue
- FullCalendar emits day-view-open instead of managing bottom sheet state
- OwnerDayViewBottomSheet, dayViewVisible, selectedDayBookings moved to HomeOwner"
```

---

## Task 4: Color System — Vuetify Tokens

**Why:** ~40 hardcoded hex values across JS functions and 3 CSS files. Not responsive to dark mode. Duplicate `:deep()` blocks conflict with each other.

**Files:**
- Create: `src/styles/calendar-tokens.css`
- Modify: `src/components/smart/shared/FullCalendar.vue` (delete JS color functions; update CSS)
- Modify: `src/components/smart/owner/OwnerCalendar.vue` (delete duplicate CSS)
- Modify: `src/components/smart/owner/HomeOwner.vue` (delete duplicate CSS)
- Modify: `src/main.ts` or `src/plugins/vuetify.ts` (import the new CSS file)

---

- [ ] **Step 4.1: Check existing CSS in all three components**

Run:
```bash
grep -n "priority-urgent\|priority-high\|type-turn\|#d32f2f\|#ff9800\|#5c6bc0\|getEventColor\|getEventBorderColor" \
  src/components/smart/shared/FullCalendar.vue \
  src/components/smart/owner/OwnerCalendar.vue \
  src/components/smart/owner/HomeOwner.vue
```

Document every occurrence before making changes.

- [ ] **Step 4.2: Create `src/styles/calendar-tokens.css`**

```css
/* Calendar event color tokens — mapped to Vuetify 4 theme variables.
   Import this file once in main.ts. All calendar event colors read from here. */
:root {
  --cal-turn-urgent:   rgb(var(--v-theme-error));
  --cal-turn-high:     rgb(var(--v-theme-warning));
  --cal-turn-normal:   rgb(var(--v-theme-secondary));
  --cal-turn-low:      rgb(var(--v-theme-on-surface-variant, 128 128 128));

  --cal-std-urgent:    rgb(var(--v-theme-error));
  --cal-std-high:      rgb(var(--v-theme-warning));
  --cal-std-normal:    rgb(var(--v-theme-primary));
  --cal-std-low:       rgb(var(--v-theme-success));
}

/* FullCalendar event color classes — set via classNames in bookingToCalendarEvent */
.fc-event.type-turn.priority-urgent  { background-color: var(--cal-turn-urgent)  !important; border-color: var(--cal-turn-urgent)  !important; }
.fc-event.type-turn.priority-high    { background-color: var(--cal-turn-high)    !important; border-color: var(--cal-turn-high)    !important; }
.fc-event.type-turn.priority-normal  { background-color: var(--cal-turn-normal)  !important; border-color: var(--cal-turn-normal)  !important; }
.fc-event.type-turn.priority-low     { background-color: var(--cal-turn-low)     !important; border-color: var(--cal-turn-low)     !important; }

.fc-event.type-standard.priority-urgent { background-color: var(--cal-std-urgent) !important; border-color: var(--cal-std-urgent) !important; }
.fc-event.type-standard.priority-high   { background-color: var(--cal-std-high)   !important; border-color: var(--cal-std-high)   !important; }
.fc-event.type-standard.priority-normal { background-color: var(--cal-std-normal) !important; border-color: var(--cal-std-normal) !important; }
.fc-event.type-standard.priority-low    { background-color: var(--cal-std-low)    !important; border-color: var(--cal-std-low)    !important; }
```

> **Note:** Verify `--v-theme-on-surface-variant` exists in `src/plugins/vuetify.ts`. If missing, the fallback `128 128 128` will apply (grey).

- [ ] **Step 4.3: Import the token file**

In `src/main.ts`, add:
```ts
import '@/styles/calendar-tokens.css'
```

- [ ] **Step 4.4: Write failing tests for `classNames` in `bookingToCalendarEvent`** (TDD — test first)

In `src/__tests__/utils/calendarHelpers.spec.ts`, add before implementing:

```ts
describe('bookingToCalendarEvent classNames', () => {
  it('includes type class', () => {
    const event = bookingToCalendarEvent(makeBooking({ booking_type: 'turn' }), mockProperty)
    expect(event.classNames).toContain('type-turn')
  })

  it('includes priority class', () => {
    const event = bookingToCalendarEvent(makeBooking({ priority: 'urgent' }), mockProperty)
    expect(event.classNames).toContain('priority-urgent')
  })
})
```

- [ ] **Step 4.5: Run tests — expect them to fail**

```bash
pnpm test -- src/__tests__/utils/calendarHelpers.spec.ts
```

Expected: `classNames` tests fail (`Cannot read properties of undefined (reading 'includes')` or similar).

- [ ] **Step 4.6: Update `bookingToCalendarEvent` to emit class names**

In `src/utils/calendarHelpers.ts`, update `bookingToCalendarEvent`:

```ts
return {
  id: booking.id,
  title: ...,
  start: booking.checkin_date,
  end: addOneDay(booking.checkout_date),
  classNames: [
    `type-${booking.booking_type}`,
    `priority-${booking.priority}`,
  ],
  extendedProps: { ... },
}
```

Also add `classNames: string[]` to the `CalendarBookingEvent` interface.

- [ ] **Step 4.7: Run tests — expect them to pass**

```bash
pnpm test -- src/__tests__/utils/calendarHelpers.spec.ts
```

Expected: all tests pass including the 2 new classNames tests.

- [ ] **Step 4.8: Delete `getEventColor`, `getEventBorderColor`, `getEventTextColor` from FullCalendar.vue**

These JS color functions are now handled by CSS. Remove them and the `backgroundColor`, `borderColor`, `textColor` fields from the event objects in `calendarEvents` computed. The events will be styled purely by their `classNames`.

- [ ] **Step 4.9: Delete duplicate `:deep(.fc-event.priority-*)` CSS from OwnerCalendar.vue and HomeOwner.vue**

Remove the conflicting blocks identified in Step 4.1 from both components. The canonical styles are now in `calendar-tokens.css`.

- [ ] **Step 4.10: Run full tests**

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] **Step 4.11: Build and visual check**

```bash
pnpm build
pnpm dev
```

Verify events show correct colors. Test both light and dark mode (use Vuetify theme toggle if available).

- [ ] **Step 4.12: Commit**

```bash
git add src/styles/calendar-tokens.css \
        src/main.ts \
        src/utils/calendarHelpers.ts \
        src/__tests__/utils/calendarHelpers.spec.ts \
        src/components/smart/shared/FullCalendar.vue \
        src/components/smart/owner/OwnerCalendar.vue \
        src/components/smart/owner/HomeOwner.vue
git commit -m "refactor: replace hardcoded hex event colors with Vuetify theme tokens

- Add src/styles/calendar-tokens.css with CSS custom properties
- Delete getEventColor/getEventBorderColor/getEventTextColor JS functions
- bookingToCalendarEvent now emits type-* and priority-* classNames
- Remove duplicate :deep(.fc-event.priority-*) blocks from OwnerCalendar + HomeOwner"
```

---

## Task 5: calendarOptions Performance + Navigation Single Source of Truth

**Why:** `calendarOptions` is a `computed` — every booking change replaces the entire options object. Navigation has two paths that can drift. `console.log` calls remain throughout production code.

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue`
- Modify: `src/components/smart/owner/OwnerCalendar.vue` (add `datesSet` handler)
- Modify: `src/components/smart/owner/HomeOwner.vue` (remove dual navigation)

---

- [ ] **Step 5.1: Convert `calendarOptions` from `computed` to `reactive` in FullCalendar.vue**

In `src/components/smart/shared/FullCalendar.vue`, the current pattern is:
```ts
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [...],
  events: calendarEvents.value,
  height: mobileOptions.value.height,
  dayMaxEvents: mobileOptions.value.dayMaxEvents,
  // ... all options
}))
```

Replace with:
```ts
import { reactive, watch } from 'vue'  // add reactive if not already imported

const calendarOptions = reactive<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  // ... all static config (copy from the computed, but without .value accesses)
  events: [] as CalendarBookingEvent[],
  height: mobileOptions.value.height,
  dayMaxEvents: mobileOptions.value.dayMaxEvents,
  eventDisplay: mobileOptions.value.eventDisplay,
})

// Patch events slot only — FullCalendar does a source refresh, not full re-render
watch(calendarEvents, (events) => {
  calendarOptions.events = events
}, { immediate: true })

// Patch mobile-responsive fields when viewport changes
watch(mobileOptions, (opts) => {
  calendarOptions.height = opts.height
  calendarOptions.dayMaxEvents = opts.dayMaxEvents
  calendarOptions.eventDisplay = opts.eventDisplay
})
```

Do **not** remove `computed` from the vue import — `calendarEvents`, `mobileOptions`, and other computeds in the file still depend on it.

- [ ] **Step 5.2: Add `datesSet` handler to OwnerCalendar.vue**

FullCalendar fires `datesSet` whenever the displayed date range changes (navigation, view switch, initial load). This is how OwnerCalendar stays in sync with what FullCalendar is actually showing.

In `src/components/smart/owner/OwnerCalendar.vue`:

1. Add `DatesSetArg` to imports:
```ts
import type { DateSelectArg, DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
```

2. Add handler:
```ts
function handleDatesSet(arg: DatesSetArg): void {
  const date = arg.view.currentStart  // start of the current view period (first day visible)
  useCalendarStateInstance.goToDate(date)
  emit('date-change', date)
}
```

3. Import `useCalendarState` at the top of OwnerCalendar.vue:
```ts
import { useCalendarState } from '@/composables/shared/useCalendarState'
const { goToDate: calendarStateGoToDate } = useCalendarState()
```

4. Wire `datesSet` into the props passed to `<FullCalendar>`:

Pass `@dates-set="handleDatesSet"` in the OwnerCalendar template, OR add it to the calendarOptions (if FullCalendar accepts it as an option rather than an event). Given our setup, add it as an emit through FullCalendar.vue:

Add to FullCalendar.vue `Emits`:
```ts
(e: 'dates-set', arg: DatesSetArg): void
```

Add to FullCalendar.vue `calendarOptions`:
```ts
datesSet: (arg: DatesSetArg) => emit('dates-set', arg),
```

Then in OwnerCalendar.vue template: `@dates-set="handleDatesSet"`

- [ ] **Step 5.3: Fix HomeOwner navigation — remove dual path**

In `src/components/smart/owner/HomeOwner.vue`, `handlePrevious` currently calls BOTH the composable AND the calendar API:

```ts
// Current (two paths):
function handlePrevious(): void {
  prev()                          // updates composable state
  const calendarApi = calendarRef.value?.getApi?.()
  if (calendarApi) calendarApi.prev()
}
```

Replace with one path — OwnerCalendar handles the calendar API, `datesSet` updates the composable:

```ts
function handlePrevious(): void {
  calendarRef.value?.prev()  // OwnerCalendar.goToDate delegates to FullCalendar API
}

function handleNext(): void {
  calendarRef.value?.next()
}

function handleToday(): void {
  calendarRef.value?.goToDate(new Date())
}
```

Remove any remaining calls to `prev()`, `next()` from `useCalendarState` in HomeOwner — FullCalendar → `datesSet` → `useCalendarState.goToDate()` is now the single update path.

- [ ] **Step 5.4: Remove all production `console.log` calls**

```bash
grep -n "console\.log" \
  src/components/smart/shared/FullCalendar.vue \
  src/components/smart/owner/OwnerCalendar.vue \
  src/components/smart/owner/HomeOwner.vue
```

Delete every `console.log` line found. Keep any `console.warn` or `console.error` (these signal genuine problems).

- [ ] **Step 5.5: Build**

```bash
pnpm build
```

Expected: clean build. The `computed` → `reactive` change may surface type issues if any option value was typed incorrectly.

- [ ] **Step 5.6: Run full test suite including performance tests**

```bash
pnpm test:run
pnpm test:performance
```

Expected: all pass. Performance tests verify subscription cleanup — if they fail, check `onUnmounted` cleanup in any composable you modified.

- [ ] **Step 5.7: Visual check — navigation works, no drift**

```bash
pnpm dev
```

1. Click prev/next several times. Verify `formattedMonthYear` in the header updates correctly.
2. Navigate to a specific month — verify FullCalendar and header stay in sync.
3. Verify events render on navigation (reactive events patch is working).

- [ ] **Step 5.8: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue \
        src/components/smart/owner/OwnerCalendar.vue \
        src/components/smart/owner/HomeOwner.vue
git commit -m "perf: reactive calendarOptions; single-path navigation via datesSet; remove console.logs

- calendarOptions changed from computed to reactive (avoids full re-render on event changes)
- Mobile-responsive fields (height, dayMaxEvents) patched via watch
- FullCalendar datesSet drives useCalendarState.goToDate — no dual navigation path
- Remove all production console.log calls from three calendar components"
```

---

## Verification

After all 5 tasks are complete:

- [ ] `pnpm build` — no TypeScript errors
- [ ] `pnpm test:run` — all tests pass
- [ ] `pnpm test:performance` — no regressions
- [ ] Dashboard loads without console errors
- [ ] Drag-and-drop saves correct checkin/checkout dates
- [ ] Prev/next navigation keeps header and calendar in sync
- [ ] Calendar events use theme colors (test light + dark mode)
- [ ] No `console.log` in production code (only `console.warn`/`console.error`)
- [ ] `src/components/smart/shared/FullCalendar.vue` has no owner-specific imports

---

## Known Follow-Ups (not in scope)

- Delete orphaned `bookingsToEvents`, `dateRange`, `updateDateRange` bodies from `useCalendarState.ts` once confirmed no callers
- Admin calendar full refactor (same patterns, separate branch)
- Supabase realtime subscriptions in `useOwnerBookings` / `useOwnerProperties`
- `useCalendarState` filter UI (status/type toggles)
