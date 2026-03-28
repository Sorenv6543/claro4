You are implementing Task 2: HomeOwner Data Flow — Remove Duplicate Store Access.

## Task Description

### Task 2: HomeOwner Data Flow — Remove Duplicate Store Access

**Why:** HomeOwner already imports `useOwnerBookings` and `useOwnerProperties`, but ALSO directly accesses `bookingStore` and `propertyStore`, building its own owner-filtered Maps. This duplicates composable work and bypasses the single source of truth. Remove the duplicate path.

**Files:**
- Modify: `src/components/smart/owner/HomeOwner.vue`
- Modify: `src/composables/shared/useCalendarState.ts`
- Modify: `src/components/smart/admin/AdminCalendar.vue`
- Modify: `src/components/smart/admin/useAdminCalendarState.ts` (if it passes Maps to FullCalendar)

---

**Step 2.1: Read current `useCalendarState.filterBookings` implementation**

Read `src/composables/shared/useCalendarState.ts` lines 217–270 to understand which part filters by date range vs. by status/type. Note the exact lines to change.

**Step 2.2: Remove date-range clause from `filterBookings`**

In `src/composables/shared/useCalendarState.ts`, `filterBookings` currently filters bookings to `dateRange.value`. Remove the date-range block (lines ~253–255 plus any surrounding `||` logic), keeping only the status/type visibility filters. The function should return all bookings that match the active status/type filters, regardless of date.

The function signature stays the same: `function filterBookings(bookings: Booking[]): Booking[]`

**Step 2.3: Deprecate `bookingsToEvents` and clean up orphaned `dateRange` state in `useCalendarState`**

`bookingsToEvents` (line 309) is in the composable's public return. It cannot be deleted without a breaking change.

1. Add `/** @deprecated — event mapping moved to FullCalendar component props. Do not add new callers. */` JSDoc above the function.
2. Remove `bookingsToEvents` from the `return` object at the bottom of the composable.
3. Remove `dateRange` and `updateDateRange` from the `return` object (they are now orphaned).
4. Remove the two `uiStore.setFilter(...)` calls inside `updateDateRange()` (around lines ~143–144):
   ```ts
   // DELETE these two lines from updateDateRange():
   uiStore.setFilter('dateRangeStart', start.toISOString())
   uiStore.setFilter('dateRangeEnd', end.toISOString())
   ```
   These were feeding the now-orphaned filter state. The `updateDateRange` function body can remain (it still updates the local `dateRange` ref), but it must not write stale values to the UI store.

> **Do not delete `dateRange`, `updateDateRange`, or `bookingsToEvents` function bodies yet** — only remove them from the return and remove the UI store writes. A follow-up can delete the bodies once confirmed no callers remain.

**Step 2.4: Remove `ownerBookingsMap` and `ownerPropertiesMap` from HomeOwner**

In `src/components/smart/owner/HomeOwner.vue`:

1. Delete the two computed blocks (`ownerPropertiesMap` and `ownerBookingsMap`).
2. Delete the direct store imports for data access:
   ```ts
   // DELETE these two lines:
   const propertyStore = usePropertyStore()
   const bookingStore = useBookingStore()
   ```
   (Keep `useUIStore` — it's used for modal state.)
3. Remove `import { usePropertyStore } from '@/stores/property'` and `import { useBookingStore } from '@/stores/booking'` at the top — but ONLY if they're not used elsewhere in the file. Run build to verify.

**Step 2.5: Replace ownerBookingsMap/ownerPropertiesMap references throughout HomeOwner**

After removing those computeds, TypeScript will flag every reference. Fix each:

| Old reference | Replacement |
|---------------|-------------|
| `ownerBookingsMap.value.get(clickInfo.event.id)` | `myBookings.value.find(b => b.id === clickInfo.event.id)` |
| `ownerBookingsMap.value.has(booking.id)` | `myBookings.value.some(b => b.id === booking.id)` |
| `ownerPropertiesMap.value.has(propertyId)` | `myProperties.value.some(p => p.id === propertyId)` |
| `ownerPropertiesMap.value.has(propertyModalData.value.id)` | `myProperties.value.some(p => p.id === propertyModalData.value.id)` |
| `:properties="ownerPropertiesMap"` in template | `:properties="myProperties"` |
| `:bookings="ownerBookingsMap"` in template (if present) | `:bookings="ownerFilteredBookings"` |

**Step 2.6: Add `ownerFilteredBookings` computed using composable**

In HomeOwner.vue script, replace the deleted filter logic with:
```ts
const ownerFilteredBookings = computed(() => filterBookings(myBookings.value))
```

**Step 2.7: Replace `fetchProperties()` / `fetchBookings()` in `onMounted`**

`onMounted` currently calls `propertyStore.fetchProperties()` and `bookingStore.fetchBookings()`. Replace with composable fetch methods.

Look at what `useOwnerBookings` and `useOwnerProperties` return — they may expose fetch methods. If they do, use those. If not, check whether the composables auto-fetch on mount internally — if so, just remove the manual fetch calls entirely.

**Step 2.8: Update FullCalendar.vue prop types — Map → Array**

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

**Step 2.9: Update OwnerCalendar.vue prop types — Map → Array**

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

**Step 2.10: Fix AdminCalendar.vue — prevent prop breakage**

`AdminCalendar.vue` currently passes `Map<string, Booking>` to FullCalendar. Now that FullCalendar expects `Booking[]`, add a conversion before the pass.

Read `src/components/smart/admin/AdminCalendar.vue` to find how it passes bookings/properties to FullCalendar, then add computed arrays:
```ts
const calendarBookings = computed(() => Array.from(bookingsMap.value.values()))
const calendarProperties = computed(() => Array.from(propertiesMap.value.values()))
```

And update the template bindings to use these computed arrays. Adapt to whatever the actual variable names are.

**Step 2.11: Verify build passes**

```bash
pnpm build
```

Expected: no TypeScript errors. If `ownerBookingsMap` or `ownerPropertiesMap` references remain, the build will tell you exactly where.

**Step 2.12: Run tests**

```bash
pnpm test:run
```

Expected: all tests pass.

**Step 2.13: Visual check note**

Do NOT start the dev server — the user will verify visually. Just confirm build + tests are green.

**Step 2.14: Commit**

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

## Context