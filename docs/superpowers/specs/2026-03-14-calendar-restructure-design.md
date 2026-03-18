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

**OwnerCalendar.vue** gets a real job:
- Holds `calendarRef` and exposes `prev()`, `next()`, `goToDate()`, `changeView()` that call the calendar API directly
- Owns the `datesSet` callback → emits `date-change` upstream so HomeOwner can update `formattedMonthYear`
- Handles properly-typed `eventResize` (fix the `handleEventResizeDone` typo)
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
  const { myBookings, createMyBooking, updateMyBooking, deleteMyBooking } = useOwnerBookings()
  const { myProperties, createMyProperty, updateMyProperty, deleteMyProperty } = useOwnerProperties()
  const ownerFilteredBookings = computed(() => filterBookings(myBookings.value))
  ```

**Component prop interface change:**
- FullCalendar and OwnerCalendar accept `Booking[]` and `Property[]` (not `Map<string, T>`)
- Composables already return arrays; no conversion needed
- `bookingToCalendarEvent` in `calendarHelpers.ts` receives the property looked up via array `.find()` inside FullCalendar

**`useCalendarState.filterBookings` scope:**
- Applies status/type visibility toggles only (pending, completed, turn, standard)
- Does NOT filter by date range — FullCalendar handles viewport; all bookings are always passed in
- `bookingsToEvents()` in `useCalendarState.ts` is deleted (dead code; dates were also swapped)

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
  // ...all static config (never changes)
  events: [],
})

watch(calendarEvents, (events) => {
  calendarOptions.events = events
}, { immediate: true })
```

FullCalendar performs an incremental event diff instead of a full re-render.

**Navigation — single path:**

Current (two paths, can drift):
```ts
function handlePrevious() {
  prev()             // composable state
  calendarApi.prev() // also drives calendar
}
```

New (one path — FullCalendar is the navigation source of truth):
```
User clicks prev/next (HomeOwner header)
  → calls calendarRef.value.prev() (OwnerCalendar exposes this)
  → FullCalendar fires datesSet callback
  → datesSet emits date-change upstream
  → HomeOwner updates currentDate from event
  → formattedMonthYear re-computes
```

`useCalendarState.prev()` / `next()` are not called from HomeOwner for navigation. `currentDate` in the composable is updated reactively from `datesSet`, not imperatively.

### 4. Color System — Vuetify Theme Tokens

**Current:** ~40 hardcoded hex values in:
- `getEventColor()` / `getEventBorderColor()` / `getEventTextColor()` in FullCalendar.vue (JS)
- `:deep(.fc-event.type-*)` CSS in FullCalendar.vue
- `:deep(.fc-event.priority-*)` CSS in OwnerCalendar.vue
- `:deep(.fc-event.priority-*)` CSS in HomeOwner.vue

**New:** Single token file + JS reads from theme:

`src/styles/calendar-tokens.css`:
```css
:root {
  --cal-turn-urgent:    rgb(var(--v-theme-error));
  --cal-turn-high:      rgb(var(--v-theme-warning));
  --cal-turn-normal:    rgb(var(--v-theme-secondary));
  --cal-turn-low:       rgb(var(--v-theme-on-surface-variant));
  --cal-std-urgent:     rgb(var(--v-theme-error));
  --cal-std-high:       rgb(var(--v-theme-warning));
  --cal-std-normal:     rgb(var(--v-theme-primary));
  --cal-std-low:        rgb(var(--v-theme-success));
}
```

JS color functions replaced with CSS class-based approach:
- `classNames` on each event already includes `type-{bookingType}-{priority}`
- CSS handles the color via those classes using the token vars
- `getEventColor()`, `getEventBorderColor()` functions deleted
- Dark mode handled automatically via Vuetify's theme CSS variable system

Duplicate `:deep(.fc-event.priority-*)` blocks in OwnerCalendar.vue and HomeOwner.vue are deleted — they conflict with each other and with FullCalendar.vue's own rules anyway.

### 5. Critical Bug Fixes

All bugs to fix, in priority order:

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | FullCalendar.vue:779 | `defineExpose({ goToDate, changeView, refreshEvents })` — all three commented out → ReferenceError on render → "Failed to fetch" | Uncomment / rewrite the three navigation methods |
| 2 | OwnerCalendar.vue:14 | Template calls `handleEventResizeDone` but function is `handleEventResize` → TypeError | Rename function to `handleEventResizeDone` |
| 3 | OwnerCalendar.vue:74 | `EventResizeDoneArg` used as type but not imported → build error | Add import from `@fullcalendar/interaction` |
| 4 | FullCalendar.vue:254 | `eventDrop: handleEventDrop as any` — `handleEventDrop` is commented out → silent undefined | Uncomment or implement `handleEventDrop` |
| 5 | HomeOwner.vue:372 | `checkout_date: selectInfo.startStr` — start/end swapped in date-select handler | `checkin_date: selectInfo.startStr`, `checkout_date: selectInfo.endStr` |
| 6 | HomeOwner.vue:430 | `checkout_date: dropInfo.event.startStr` — start/end swapped in drop handler | `checkin_date: dropInfo.event.startStr`, `checkout_date: dropInfo.event.endStr` |
| 7 | HomeOwner.vue:469 | Same swap in resize handler | Same fix |
| 8 | HomeOwner.vue:540 | Same swap in `handleUpdateBooking` | Same fix |
| 9 | useCalendarState.ts:328 | `bookingsToEvents`: `start: booking.checkout_date, end: booking.checkin_date` — swapped | Delete function entirely (unused dead code) |
| 10 | guards.ts | Deprecated `next(value)` callback pattern throughout | Return values instead: `return '/auth/login'` etc. |
| 11 | All three components | Production `console.log` throughout | Remove all; keep `console.warn`/`console.error` only |

---

## Out of Scope

- **Realtime subscriptions** — Supabase channel not yet implemented; architecture leaves the correct seam (data access in composables) for adding it later as a one-file change per composable
- **Admin calendar** — same patterns apply but separate work item
- **`useCalendarState` filter UI** — status/type toggles exist in composable but no UI; not added here
- **`OwnerDayViewBottomSheet` internal changes** — only moved, not modified

---

## Implementation Sequence (5 commits)

| Commit | Scope | Success Criterion |
|--------|-------|-------------------|
| 1 | Fix all 11 bugs in the table above | `pnpm build` passes; dashboard loads |
| 2 | HomeOwner uses composables for data; inline filtering deleted | Owner bookings/properties display correctly |
| 3 | FullCalendar genuinely shared; OwnerDayViewBottomSheet moves to HomeOwner | No owner imports in `smart/shared/FullCalendar.vue` |
| 4 | Color system: JS functions deleted, CSS token file added | Calendar events themed correctly in light + dark |
| 5 | `calendarOptions` reactive pattern; navigation single path; dead console.logs removed | `pnpm test:run` + `pnpm test:performance` green |

---

## Files Touched

| File | Change Type |
|------|-------------|
| `src/components/smart/shared/FullCalendar.vue` | Major refactor |
| `src/components/smart/owner/OwnerCalendar.vue` | Moderate refactor |
| `src/components/smart/owner/HomeOwner.vue` | Major refactor |
| `src/composables/shared/useCalendarState.ts` | Delete `bookingsToEvents`; remove date-range filter |
| `src/router/guards.ts` | Fix deprecated `next()` pattern |
| `src/styles/calendar-tokens.css` | New file |
| `src/utils/calendarHelpers.ts` | No change (already correct) |
| `src/composables/owner/useOwnerBookings.ts` | No change |
| `src/composables/owner/useOwnerProperties.ts` | No change |
