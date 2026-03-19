# Calendar Restructure Design

**Date:** 2026-03-14
**Scope:** `FullCalendar.vue`, `OwnerCalendar.vue`, `HomeOwner.vue` + supporting composables
**Branch:** `fix/calendar-restructure`

---

## Problem Statement

The calendar stack is currently broken (dashboard fails to load) and has accumulated five categories of issues:

1. **Critical runtime bugs** — app does not load; several functions referenced but not defined
2. **Violation of composable layer** — HomeOwner duplicates owner-filtering logic already in `useOwnerBookings` / `useOwnerProperties`
3. **Shared component has owner-specific concerns** — `FullCalendar.vue` (in `smart/shared/`) imports `useAuthStore` and renders `OwnerDayViewBottomSheet`
4. **Dual navigation state** — calendar position driven by both `useCalendarState` and direct `calendarApi` calls; can drift
5. **Color system fragmentation** — ~40 hardcoded hex values spread across JS functions and 3 CSS files; not responsive to Vuetify theme

---

## Design

### 1. Component Hierarchy

**Before:**

```
HomeOwner.vue
  └─ OwnerCalendar.vue        ← pure pass-through, no real responsibility
       └─ FullCalendar.vue    ← shared but contains owner auth + OwnerDayViewBottomSheet
```

**After:**

```
HomeOwner.vue                       ← business logic only: CRUD, modals, data wiring
  ├─ OwnerCalendar.vue              ← owner calendar shell: navigation API, owner CSS, resize/drop
  │    └─ FullCalendar.vue          ← truly generic: renders events, emits raw interactions only
  └─ OwnerDayViewBottomSheet.vue    ← moves here (out of FullCalendar)
```

**FullCalendar.vue** (`smart/shared`) becomes genuinely shared:

- No `useAuthStore` import
- No `OwnerDayViewBottomSheet`
- No owner-id filtering in `handleManualMoreLinkClick`
- Emits raw FullCalendar interactions upstream; zero business logic
- When `handleManualMoreLinkClick` fires a "+N more" click, it emits `day-view-open` with `{ date, bookings }` — OwnerCalendar passes this up to HomeOwner where the BottomSheet lives

**State moving out of FullCalendar.vue alongside OwnerDayViewBottomSheet:**

- `dayViewVisible` ref
- `selectedDate` ref
- `selectedDayBookings` ref
- All five BottomSheet event handlers (`handleViewBooking`, `handleEditBooking`, `handleCompleteBooking`, `handleAddBookingFromDayView`)
  These move to HomeOwner.vue.

**OwnerCalendar.vue** gets a real job:

- Holds `calendarRef` and exposes `prev()`, `next()`, `goToDate()`, `changeView()` that call the calendar API directly
  > **API naming note:** FullCalendar's method is `calendarApi.gotoDate(date)` (lowercase `t`). OwnerCalendar's exposed wrapper may be named `goToDate` (camelCase), but internally must call `calendarApi.gotoDate()`.
- Owns the `datesSet` callback → emits `date-change` upstream so HomeOwner can update `formattedMonthYear`
- Handles properly-typed `eventResize` — fix is to align template `@event-resize="handleEventResize"` with the function name `handleEventResize` (not rename the function to `handleEventResizeDone`)
- Owner-specific CSS lives here (pulse animations, priority border overrides)

**HomeOwner.vue** becomes orchestration-only:

- No direct store access for data
- No inline ownership filtering
- Calls composables for all data and CRUD
- Passes arrays (not Maps) down to OwnerCalendar

### 2. Data Flow & Business Logic

The composable layer is the single source of truth for owner-scoped data. HomeOwner must use it.

**Data flow:**

```
useOwnerBookings.myBookings   ──► filterBookings (status/type only) ──► OwnerCalendar ──► FullCalendar
useOwnerProperties.myProperties ─────────────────────────────────────► OwnerCalendar ──► FullCalendar
```

**Changes in HomeOwner.vue:**

- Delete `ownerBookingsMap`, `ownerPropertiesMap`, `ownerFilteredBookings` computed properties
- Delete `isOwnerAuthenticated` computed (composables return empty when unauthenticated)
- Delete direct `propertyStore` / `bookingStore` imports for data access
- Delete manual `fetchProperties()` / `fetchBookings()` calls in `onMounted` — use composable fetch methods
- Replace with:
  ```ts
  const { myBookings, createMyBooking, updateMyBooking, deleteMyBooking } =
    useOwnerBookings();
  const { myProperties, createMyProperty, updateMyProperty, deleteMyProperty } =
    useOwnerProperties();
  const ownerFilteredBookings = computed(() =>
    filterBookings(myBookings.value),
  );
  ```

**Component prop interface change:**

- FullCalendar and OwnerCalendar accept `Booking[]` and `Property[]` (not `Map<string, T>`)
- Composables already return arrays; no conversion needed
- `bookingToCalendarEvent` in `calendarHelpers.ts` receives the property looked up via `properties.find(p => p.id === booking.property_id)` inside FullCalendar

> **⚠️ Downstream impact on AdminCalendar.vue:** Changing FullCalendar's props from `Map` to arrays will break `AdminCalendar.vue`, which currently passes raw `Map<string, Booking>` from `bookingStore.bookings`. Admin calendar is out of scope for this branch, but the prop interface change must be forward-compatible: either (a) FullCalendar accepts both forms via overloaded props, or (b) `AdminCalendar.vue` is updated in the same commit to convert Maps to arrays before passing. Approach (b) is simpler. See Files Touched.

**`useCalendarState.filterBookings` scope:**

- Applies status/type visibility toggles only (pending, completed, turn, standard)
- Date-range filter is **removed** from `filterBookings` — FullCalendar handles viewport; all bookings are always passed in
- Removing date-range filter makes `dateRange`, `updateDateRange()`, and the `dateRange`-related UI store writes (`setFilter('dateRangeStart', ...)`) orphaned dead state — these should be cleaned up from `useCalendarState` in the same commit

**`bookingsToEvents()` in `useCalendarState.ts`:**

- This function is part of the composable's public return (line 376) — it is NOT dead code and cannot be deleted without a breaking change
- It also contains a bug (swapped checkin/checkout dates: line 328 `start: booking.checkout_date`)
- Action: deprecate by removing from the return object but keep the function body temporarily; file a follow-up to delete once confirmed no callers remain. Do NOT silently delete.

**`useOwnerBookings.myBookings` note:**

- Already filtered by `owner_id` via `useCachedComputed` — no additional owner check needed in HomeOwner

### 3. calendarOptions Performance + Navigation Single Source of Truth

**calendarOptions — from computed to reactive:**

Current pattern (re-creates entire options object on every booking change):

```ts
const calendarOptions = computed<CalendarOptions>(() => ({ ..., events: calendarEvents.value }))
```

New pattern (patches only the events slot):

```ts
const calendarOptions = reactive<CalendarOptions>({
  plugins: [...],
  // ...all static config
  events: [],
  // mobile-responsive fields below — handled by separate watches (see note)
  eventDisplay: mobileOptions.value.eventDisplay,
  height: mobileOptions.value.height,
  dayMaxEvents: mobileOptions.value.dayMaxEvents,
})

// Events update — incremental FullCalendar diff, not full re-render
watch(calendarEvents, (events) => {
  calendarOptions.events = events
}, { immediate: true })

// Mobile options update — must also patch reactively
watch(mobileOptions, (opts) => {
  calendarOptions.eventDisplay = opts.eventDisplay
  calendarOptions.height = opts.height
  calendarOptions.dayMaxEvents = opts.dayMaxEvents
})
```

> **Note:** `mobileOptions` is already a `ref` updated by the viewport resize callback. The `watch` above ensures FullCalendar gets patched when mobile layout changes, just as events are patched. Without this watch, mobile height and event display would freeze at mount-time values.

FullCalendar performs an incremental event diff instead of a full re-render.

**Navigation — single path (FullCalendar as source of truth):**

Current (two paths, can drift):

```ts
function handlePrevious() {
  prev(); // composable state
  calendarApi.prev(); // also drives calendar
}
```

New (one path):

```
User clicks prev/next (HomeOwner header)
  → calls calendarRef.value.prev() (OwnerCalendar exposes this — direct calendarApi call)
  → FullCalendar fires datesSet callback
  → OwnerCalendar's datesSet handler calls useCalendarState.goToDate(date) AND emits date-change
  → HomeOwner.formattedMonthYear re-computes from useCalendarState.currentDate
  → useCalendarState.dateRange also updates via updateDateRange() (for any future date-range consumers)
```

`useCalendarState.prev()` / `next()` are **not** called from HomeOwner for navigation.
HomeOwner **does not** hold a local `currentDate` ref — it reads `currentDate` from `useCalendarState` directly.
The `datesSet` handler must call `useCalendarState.goToDate(date)` to keep the composable state in sync with what FullCalendar is actually displaying.

### 4. Color System — Vuetify Theme Tokens

**Current:** ~40 hardcoded hex values in:

- `getEventColor()` / `getEventBorderColor()` / `getEventTextColor()` in FullCalendar.vue (JS)
- `:deep(.fc-event.type-*)` CSS in FullCalendar.vue
- `:deep(.fc-event.priority-*)` CSS in OwnerCalendar.vue
- `:deep(.fc-event.priority-*)` CSS in HomeOwner.vue

**New:** Single token file + class-based CSS:

`src/styles/calendar-tokens.css`:

```css
:root {
  --cal-turn-urgent: rgb(var(--v-theme-error));
  --cal-turn-high: rgb(var(--v-theme-warning));
  --cal-turn-normal: rgb(var(--v-theme-secondary));
  --cal-turn-low: rgb(var(--v-theme-on-surface-variant, 128 128 128));
  --cal-std-urgent: rgb(var(--v-theme-error));
  --cal-std-high: rgb(var(--v-theme-warning));
  --cal-std-normal: rgb(var(--v-theme-primary));
  --cal-std-low: rgb(var(--v-theme-success));
}
```

> **Note:** `--v-theme-on-surface-variant` exists in Vuetify 4 (Material Design 3 token). The fallback value `128 128 128` guards against any environment where the token is absent. Verify against `src/plugins/vuetify.ts` theme definition before shipping.

JS color functions replaced with CSS class-based approach:

- `classNames` on each event already includes `type-{bookingType}-{priority}`
- CSS handles the color via those classes using the token vars
- `getEventColor()`, `getEventBorderColor()` functions deleted from FullCalendar.vue
- Dark mode handled automatically via Vuetify's theme CSS variable system

Duplicate `:deep(.fc-event.priority-*)` blocks in OwnerCalendar.vue and HomeOwner.vue are deleted — they conflict with each other and with FullCalendar.vue's own rules.

### 5. Critical Bug Fixes

All bugs to fix, in priority order:

| #   | File                     | Bug                                                                                                                                                                                                                                                                                               | Fix                                                                                                                                                                                                        |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | FullCalendar.vue:322–341 | `handleEventDrop` comment block is missing its closing `}`, corrupting the parse scope. Additionally `defineExpose` at line 779 references `goToDate`, `changeView`, `refreshEvents` which are all commented out → ReferenceError on first render → "Failed to fetch dynamically imported module" | Close the comment block properly; uncomment/rewrite the three navigation methods. `refreshEvents` wraps `calendarApi.refetchEvents()`; `goToDate(date)` wraps `calendarApi.gotoDate(date)` (lowercase `t`) |
| 2   | OwnerCalendar.vue:14     | Template `@event-resize="handleEventResizeDone"` — function is named `handleEventResize` → runtime TypeError                                                                                                                                                                                      | Fix the **template** to match the function: `@event-resize="handleEventResize"`                                                                                                                            |
| 3   | OwnerCalendar.vue:74     | `EventResizeDoneArg` used as a type parameter but not imported in **this file** → TypeScript build error                                                                                                                                                                                          | Add `import type { EventResizeDoneArg } from '@fullcalendar/interaction'` to OwnerCalendar.vue                                                                                                             |
| 4   | FullCalendar.vue:254     | `eventDrop: handleEventDrop as any` — `handleEventDrop` is entirely commented out → drag-and-drop silently broken                                                                                                                                                                                 | Uncomment or implement `handleEventDrop`. Type the argument as `EventDropArg` — import from `@fullcalendar/core` (not `@fullcalendar/interaction`)                                                         |
| 5   | HomeOwner.vue:372        | `checkout_date: selectInfo.startStr` — checkin/checkout swapped in date-select handler                                                                                                                                                                                                            | `checkin_date: selectInfo.startStr`, `checkout_date: selectInfo.endStr`                                                                                                                                    |
| 6   | HomeOwner.vue:430        | `checkout_date: dropInfo.event.startStr` — swapped in drop handler. Additionally: `calendarHelpers.bookingToCalendarEvent` adds one day to checkout (`addOneDay`), so `event.endStr` is checkout+1. Write-back must subtract one day: `checkout_date: subtractOneDay(dropInfo.event.endStr)`      | `checkin_date: dropInfo.event.startStr`, `checkout_date: subtractOneDay(dropInfo.event.endStr)`                                                                                                            |
| 7   | HomeOwner.vue:469        | Same swap + same `addOneDay` offset issue in resize handler                                                                                                                                                                                                                                       | Same fix as #6                                                                                                                                                                                             |
| 8   | HomeOwner.vue:540        | `handleUpdateBooking` — same swap (this one does not come from a calendar event so no `addOneDay` offset applies; just swap field names)                                                                                                                                                          | `checkin_date: data.start`, `checkout_date: data.end`                                                                                                                                                      |
| 9   | useCalendarState.ts:328  | `bookingsToEvents`: `start: booking.checkout_date, end: booking.checkin_date` — dates swapped. Also part of public return so cannot be silently deleted                                                                                                                                           | Remove from composable's return object; add `@deprecated` JSDoc comment; leave function body for now                                                                                                       |
| 10  | All three components     | Production `console.log` throughout                                                                                                                                                                                                                                                               | Remove all; keep `console.warn`/`console.error` only                                                                                                                                                       |

> **`subtractOneDay` helper:** Add to `calendarHelpers.ts` alongside existing `addOneDay`:
>
> ```ts
> function subtractOneDay(dateString: string): string {
>   const date = new Date(dateString);
>   date.setDate(date.getDate() - 1);
>   return date.toISOString().split("T")[0];
> }
> ```

---

## Out of Scope

- **Realtime subscriptions** — Supabase channel not yet implemented; architecture leaves the correct seam (data access in composables) for adding it later as a one-file change per composable
- **Admin calendar full refactor** — same patterns apply but separate work item; `AdminCalendar.vue` gets minimal changes only (Map→array conversion for FullCalendar props)
- **`useCalendarState` filter UI** — status/type toggles exist in composable but no UI; not added here
- **`OwnerDayViewBottomSheet` internal changes** — only moved, not modified

---

## Implementation Sequence (5 commits)

| Commit | Scope                                                                                                                                        | Success Criterion                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1      | Fix all 10 bugs in the table above; add `subtractOneDay` to calendarHelpers                                                                  | `pnpm build` passes; dashboard loads; drag/drop saves correct dates  |
| 2      | HomeOwner uses composables for data; inline filtering deleted; `AdminCalendar.vue` Map→array adapter                                         | Owner bookings/properties display correctly; admin calendar unbroken |
| 3      | FullCalendar genuinely shared; OwnerDayViewBottomSheet + its state moves to HomeOwner                                                        | No owner imports in `smart/shared/FullCalendar.vue`                  |
| 4      | Color system: JS color functions deleted, CSS token file added, duplicate CSS blocks removed                                                 | Calendar events themed correctly in light + dark mode                |
| 5      | `calendarOptions` reactive pattern + mobile watches; navigation single path via `datesSet`; `dateRange` orphan cleanup; console.logs removed | `pnpm test:run` + `pnpm test:performance` green                      |

---

## Files Touched

| File                                             | Change Type                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `src/components/smart/shared/FullCalendar.vue`   | Major refactor                                                                                                  |
| `src/components/smart/owner/OwnerCalendar.vue`   | Moderate refactor                                                                                               |
| `src/components/smart/owner/HomeOwner.vue`       | Major refactor                                                                                                  |
| `src/components/smart/admin/AdminCalendar.vue`   | Minor — Map→array conversion for FullCalendar props                                                             |
| `src/composables/shared/useCalendarState.ts`     | Remove date-range filter from `filterBookings`; deprecate `bookingsToEvents`; remove orphaned `dateRange` state |
| `src/composables/admin/useAdminCalendarState.ts` | Minor — convert bookings/properties to arrays before passing to FullCalendar                                    |
| `src/styles/calendar-tokens.css`                 | New file                                                                                                        |
| `src/utils/calendarHelpers.ts`                   | Add `subtractOneDay` helper; export it                                                                          |
| `src/router/guards.ts`                           | No change needed (already correct)                                                                              |
| `src/composables/owner/useOwnerBookings.ts`      | No change                                                                                                       |
| `src/composables/owner/useOwnerProperties.ts`    | No change                                                                                                       |
