# Unified Realtime Sync Architecture

## Problem

The codebase has three parallel data paths for booking and property CRUD that overlap and compete:

1. **Store-direct** (`stores/booking.ts`, `stores/property.ts`) — stores make their own `supabase.from()` calls. This is what runs today.
2. **Supabase composables** (`composables/supabase/useSupabaseBookings.ts`, `useSupabaseProperties.ts`) — standalone composables with their own local refs and realtime subscriptions. Built but not connected to stores or UI.
3. **RealtimeSync orchestrator** (`composables/supabase/useRealtimeSync.ts`) — central realtime subscriber that pushes changes into stores. Built but commented out / never called.
4. **BackgroundSync** (`composables/shared/useBackgroundSync.ts`) — offline PWA queue with its own duplicate Supabase calls.

Additionally, two wrapper stores (`ownerData.ts`, `adminData.ts`) duplicate filtering logic already present in role composables (`useOwnerBookings`, `useAdminBookings`, etc.).

The result: ~11 `.from('bookings')` calls and ~10 `.from('properties')` calls scattered across stores, composables, and sync logic. Realtime is dead — everything relies on manual `fetchBookings()`/`fetchProperties()` on mount.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Realtime role | Primary data source — stores populated via realtime subscriptions + initial fetch | Single unified flow, no stale data |
| Supabase call ownership | Supabase composables own ALL DB interaction; stores become pure reactive state | Clean separation, testable stores |
| Subscription lifecycle | Layout-level init — owner/admin layouts call `init()` on mount, teardown on unmount/logout | Explicit, scoped to authenticated session |
| `useRealtimeSync` role | Thin coordinator — handles connection status and network monitoring, delegates table logic to per-table composables | Cross-cutting concerns in one place, table logic stays local |
| Optimistic updates | Keep optimistic updates, drop offline queue | App requires connectivity; offline queue adds complexity for a rare scenario |
| Role-aware layer | Role composables are the single layer — delete wrapper stores, merge their analytics | Eliminates duplication, composables are the natural Vue abstraction |
| Initial data load | Fetch first, then subscribe — sequential, no race conditions | Simple, predictable, full snapshot before listening for deltas |
| Migration strategy | Incremental (table-by-table) — bookings first, then properties, then cleanup | App stays working at every step |

## Architecture

### New Data Flow

```
                        +--- Realtime channel ---+
                        v                        |
Component -> Role Composable -> Supabase Composable -> Supabase
                                    |
                                    v (push state)
                                  Store (pure reactive state, no Supabase)
                                    ^
                              Component reads via Role Composable computeds
```

1. **Layout mounts** -> calls `useRealtimeSync().init()` -> which calls `useSupabaseBookings().fetchAndSubscribe()` and `useSupabaseProperties().fetchAndSubscribe()`
2. **Fetch** populates the store via `bookingStore.setBookings(data)`
3. **Realtime subscription** starts after fetch completes — INSERT/UPDATE/DELETE events push directly into the store
4. **CRUD operations** — component calls role composable (e.g., `createMyBooking()`) -> role composable validates ownership -> delegates to supabase composable (`createBooking()`) -> composable does optimistic store update + Supabase call -> rollback on error -> realtime event arrives and is deduplicated
5. **Logout** -> layout unmounts -> `useRealtimeSync().teardown()` unsubscribes all channels -> stores cleared

### Supabase Composable Design (per-table)

`useSupabaseBookings` as the template (properties mirrors it):

```typescript
// src/composables/supabase/useSupabaseBookings.ts
export function useSupabaseBookings() {
  // --- Lifecycle (called by useRealtimeSync) ---
  fetchAndSubscribe()    // fetch all -> populate store -> start channel
  unsubscribe()          // remove channel, cleanup

  // --- CRUD (called by role composables) ---
  createBooking(data: BookingFormData): Promise<Booking>
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking>
  deleteBooking(id: string): Promise<void>

  // --- State ---
  connectionStatus: Ref<'connecting' | 'connected' | 'disconnected'>
}
```

**Optimistic update flow (e.g., `createBooking`):**

1. Generate UUID, build full Booking object
2. `bookingStore.setBooking(id, booking)` — optimistic
3. Track id in `optimisticIds` Set
4. `await supabase.from('bookings').insert()`
5. On error -> `bookingStore.removeBooking(id)` — rollback
6. On success -> keep (realtime event arrives, sees id in `optimisticIds`, skips)
7. Remove id from `optimisticIds` after short delay

**Realtime handler:**

- INSERT: if id in `optimisticIds`, skip; else `bookingStore.setBooking(id, record)`
- UPDATE: if id in `optimisticIds`, skip; else `bookingStore.setBooking(id, record)`
- DELETE: `bookingStore.removeBooking(id)`

**Singleton pattern:** Module-level state (a `let channel` and `const optimisticIds = new Set()` declared outside the function body) so multiple components calling `useSupabaseBookings()` share the same channel and optimistic tracking. The function returns references to this shared state — it does not create new subscriptions on each call.

**Realtime filtering:** Supabase RLS policies already filter realtime events per-role at the database level (owners only receive their own data, admins receive all). No client-side `shouldIncludeBooking` / `shouldIncludeProperty` filtering is needed — that logic is removed.

### Store Simplification

Stores become pure reactive state containers:

```typescript
export const useBookingStore = defineStore('booking', () => {
  const bookings = ref<BookingMap>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // --- Mutations (synchronous, no Supabase) ---
  function setBookings(data: Booking[]) {
    bookings.value = new Map(data.map(b => [b.id, b]))
    invalidateCache()
  }
  function setBooking(id: string, booking: Booking) {
    bookings.value.set(id, booking)
    invalidateCache()
  }
  function removeBooking(id: string) {
    bookings.value.delete(id)
    invalidateCache()
  }
  function clear() {
    bookings.value.clear()
    invalidateCache()
  }

  // All existing computed getters stay unchanged.
  // Cache system (createMapCache with 10s TTL) stays as-is.
})
```

**Removed from stores:** All async methods with Supabase calls (`addBooking`, `updateBooking`, `fetchBookings`, etc.), all `supabase` imports, all optimistic update + rollback logic.

**Kept in stores:** Map-based state, all getters/computeds, cache system, `loading` and `error` refs.

### Role Composable Changes

Role composables change their CRUD delegation target from store to supabase composable, and absorb analytics from deleted wrapper stores.

```typescript
// useOwnerBookings — example
export function useOwnerBookings() {
  const bookingStore = useBookingStore()
  const authStore = useAuthStore()
  const { createBooking, updateBooking, deleteBooking } = useSupabaseBookings()

  // Reads: still from store (unchanged)
  const myBookings = computed(() =>
    bookingStore.bookingsArray.filter(b => b.owner_id === authStore.user?.id)
  )

  // CRUD: delegates to supabase composable (was: store)
  async function createMyBooking(formData: BookingFormData) {
    validateOwnership(formData)
    formData.owner_id = authStore.user!.id
    return createBooking(formData)
  }

  // Analytics: merged from ownerData.ts
  // ownerBookingStats, upcomingBookings, etc.
}
```

Admin composables follow the same pattern — no ownership checks, adds bulk operations and system metrics from `adminData.ts`.

### `useRealtimeSync` as Thin Coordinator

```typescript
export function useRealtimeSync() {
  const { fetchAndSubscribe: initBookings, unsubscribe: teardownBookings,
          connectionStatus: bookingStatus } = useSupabaseBookings()
  const { fetchAndSubscribe: initProperties, unsubscribe: teardownProperties,
          connectionStatus: propertyStatus } = useSupabaseProperties()

  const isOnline = ref(navigator.onLine)
  const connectionStatus = computed(() => {
    if (bookingStatus.value === 'connected' && propertyStatus.value === 'connected')
      return 'connected'
    if (bookingStatus.value === 'connecting' || propertyStatus.value === 'connecting')
      return 'connecting'
    return 'disconnected'
  })

  // --- user_profiles realtime (stays here, not per-table) ---
  // The existing useRealtimeSync subscribes to user_profiles UPDATE events
  // filtered to the current user. This subscription stays in the coordinator
  // because it's cross-cutting (triggers authStore.checkAuth() on role/profile
  // changes). It does NOT move to a per-table composable.
  function subscribeToProfileChanges() {
    supabase.channel('public:user_profiles')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${authStore.user?.id}`
      }, () => authStore.checkAuth())
      .subscribe()
  }

  async function init() {
    await initBookings()
    await initProperties()
    subscribeToProfileChanges()
  }

  function teardown() {
    teardownBookings()
    teardownProperties()
    supabase.removeChannel(profileChannel)
    bookingStore.clear()
    propertyStore.clear()
  }

  // Network monitoring: re-fetch + resubscribe on reconnect
  function onOnline() { isOnline.value = true; init() }
  function onOffline() { isOnline.value = false }

  onMounted(() => {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  })
  onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    teardown()
  })

  return { init, teardown, connectionStatus, isOnline }
}
```

### Layout Usage

```typescript
// src/layouts/owner.vue and src/layouts/admin.vue — identical
// IMPORTANT: useRealtimeSync() must be called during component setup (inside <script setup>),
// not inside an async callback, so its internal onMounted/onUnmounted hooks register correctly.
const { init, connectionStatus } = useRealtimeSync()
onMounted(() => init())
// teardown automatic via onUnmounted inside useRealtimeSync
```

## File Changes

### Modified (17 files)

| File | Change |
|------|--------|
| `src/stores/booking.ts` | Strip Supabase calls, keep pure state + getters + cache |
| `src/stores/property.ts` | Same treatment |
| `src/stores/user.ts` | Update imports from deleted `ownerData.ts`/`adminData.ts` to use role composables |
| `src/composables/supabase/useSupabaseBookings.ts` | Rewrite: owns all bookings CRUD + realtime + optimistic updates |
| `src/composables/supabase/useSupabaseProperties.ts` | Same treatment |
| `src/composables/supabase/useRealtimeSync.ts` | Rewrite: thin coordinator with network monitoring + user_profiles subscription |
| `src/composables/owner/useOwnerBookings.ts` | Delegate CRUD to supabase composable, merge analytics from `ownerData.ts` |
| `src/composables/owner/useOwnerProperties.ts` | Same treatment |
| `src/composables/admin/useAdminBookings.ts` | Delegate CRUD to supabase composable, merge analytics from `adminData.ts` |
| `src/composables/admin/useAdminProperties.ts` | Same treatment |
| `src/composables/shared/usePWA.ts` | Remove `useBackgroundSync` import and references |
| `src/layouts/owner.vue` | Add `useRealtimeSync().init()` on mount |
| `src/layouts/admin.vue` | Add `useRealtimeSync().init()` on mount, remove direct store fetch calls; keep `fetchAllUsers()` as-is (auth data, outside scope) |
| `src/components/smart/admin/AdminOwnerDetail.vue` | Replace `useOwnerDataStore` import with `useAdminBookings`/`useAdminProperties` |
| `src/components/dumb/admin/PerformanceMetricsDashboard.vue` | Replace `useOwnerDataStore`/`useAdminDataStore` imports with role composables |
| `src/dev/demos/OwnerDataStoreDemo.vue` | Update or delete — demo file for deleted store |
| `src/dev/demos/Admin/AdminDataStoreDemo.vue` | Update or delete — demo file for deleted store |

### Deleted (5 files)

| File | Reason |
|------|--------|
| `src/stores/ownerData.ts` | Analytics merged into owner role composables |
| `src/stores/adminData.ts` | Analytics merged into admin role composables |
| `src/composables/shared/useBookings.ts` | Validation stays in `businessLogic.ts`, CRUD moves to supabase composables |
| `src/composables/shared/useProperties.ts` | Same treatment |
| `src/composables/shared/useBackgroundSync.ts` | Offline queue dropped |

### Also Modified (consumer cleanup, Phase 3)

| File | Change |
|------|--------|
| `src/pages/crud-testing.vue` | Replace `useBookings`/`useProperties` (deleted shared composables) with supabase composable calls |

### Not Changed

- `src/stores/auth.ts` — keeps existing `useSupabaseAuth` delegation
- `src/stores/ui.ts` — unrelated
- `src/utils/businessLogic.ts` — pure functions, unchanged
- `src/router/guards.ts` — unchanged
- All dumb components (except those listed above) — unchanged

## Migration Order

### Phase 1: Bookings

1. Rewrite `useSupabaseBookings` — owns all bookings CRUD + realtime + optimistic updates
2. Simplify `booking.ts` — pure state, synchronous mutations only
3. Update `useOwnerBookings` and `useAdminBookings` — delegate CRUD to supabase composable
4. Wire up layouts — `useRealtimeSync().init()` on mount
5. Delete dead code from shared composables

### Phase 2: Properties

Repeat Phase 1 pattern for properties table.

### Phase 3: Cleanup

1. Delete `stores/ownerData.ts` and `stores/adminData.ts` (analytics already merged in Phase 1-2)
2. Delete `composables/shared/useBackgroundSync.ts`
3. Delete `composables/shared/useBookings.ts` and `composables/shared/useProperties.ts`
4. Update `stores/user.ts` — replace deleted store imports with role composables
5. Update `composables/shared/usePWA.ts` — remove `useBackgroundSync` import
6. Update `components/smart/admin/AdminOwnerDetail.vue` — replace `useOwnerDataStore`
7. Update `components/dumb/admin/PerformanceMetricsDashboard.vue` — replace deleted store imports
8. Update or delete `dev/demos/OwnerDataStoreDemo.vue` and `dev/demos/Admin/AdminDataStoreDemo.vue`
9. Update `pages/crud-testing.vue` — replace deleted shared composable imports

## Testing Strategy

### Unit Tests

**Supabase composables:**
- Fetch populates store correctly
- CRUD does optimistic update + rollback on error
- Realtime INSERT/UPDATE/DELETE push to store
- Optimistic deduplication (realtime event for already-applied change is skipped)

**Stores:**
- `setBookings()`, `setBooking()`, `removeBooking()`, `clear()` work correctly
- All existing getter tests pass unchanged

**Role composables:**
- Ownership validation blocks unauthorized CRUD
- Delegates to supabase composable correctly
- Analytics computeds return correct filtered data

### Integration Tests

- Layout mount -> `init()` -> store populated -> realtime subscription active
- CRUD from component -> optimistic update visible -> Supabase succeeds -> state correct
- CRUD from component -> Supabase fails -> rollback visible
- Network offline -> online -> re-fetch + resubscribe

### Existing Tests

- Performance tests (`pnpm test:performance`) should pass (stores still use Maps + cache)
- Tests mocking store methods need updating (async CRUD methods removed)
