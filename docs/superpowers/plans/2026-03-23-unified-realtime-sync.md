# Unified Realtime Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor booking and property data flow so Supabase composables own all DB interaction (CRUD + realtime), stores become pure reactive state, and realtime subscriptions are the primary data source — uniform across owner and admin sides.

**Architecture:** Supabase composables (`useSupabaseBookings`, `useSupabaseProperties`) own all Supabase calls and realtime channels. Stores hold pure Map-based state with no async/DB logic. Role composables (`useOwnerBookings`, `useAdminBookings`, etc.) validate ownership and delegate CRUD to supabase composables. `useRealtimeSync` is a thin coordinator that initializes per-table composables and handles cross-cutting concerns (network monitoring, user_profiles subscription). Layouts call `useRealtimeSync().init()` on mount.

**Tech Stack:** Vue 3, Pinia, Supabase JS (`@supabase/supabase-js`), Vitest

**Spec:** `docs/superpowers/specs/2026-03-23-unified-realtime-sync-design.md`

---

## File Structure

### Modified Files

| File | New Responsibility |
|------|-------------------|
| `src/stores/booking.ts` | Pure reactive state: Map + getters + cache. No Supabase. |
| `src/stores/property.ts` | Same as above for properties. |
| `src/composables/supabase/useSupabaseBookings.ts` | ALL bookings Supabase calls: fetch, CRUD, realtime channel, optimistic updates. |
| `src/composables/supabase/useSupabaseProperties.ts` | Same as above for properties. |
| `src/composables/supabase/useRealtimeSync.ts` | Thin coordinator: calls per-table `fetchAndSubscribe()`, network monitoring, user_profiles channel. |
| `src/composables/owner/useOwnerBookings.ts` | Ownership validation + CRUD delegation to `useSupabaseBookings`. Merges analytics from deleted `ownerData.ts`. |
| `src/composables/admin/useAdminBookings.ts` | Admin CRUD delegation to `useSupabaseBookings`. Merges analytics from deleted `adminData.ts`. |
| `src/composables/owner/useOwnerProperties.ts` | Same pattern as owner bookings, for properties. |
| `src/composables/admin/useAdminProperties.ts` | Same pattern as admin bookings, for properties. |
| `src/layouts/owner.vue` | Add `useRealtimeSync().init()` on mount. |
| `src/layouts/admin.vue` | Replace direct store fetch calls with `useRealtimeSync().init()`. |

### New Test Files

| File | Tests |
|------|-------|
| `src/__tests__/composables/useSupabaseBookings.spec.ts` | Fetch, CRUD, realtime, optimistic dedup. |
| `src/__tests__/composables/useSupabaseProperties.spec.ts` | Same for properties. |
| `src/__tests__/composables/useRealtimeSync.spec.ts` | Init, teardown, network monitoring. |

### Deleted Files (Phase 3)

| File | Reason |
|------|--------|
| `src/stores/ownerData.ts` | Analytics merged into owner role composables. |
| `src/stores/adminData.ts` | Analytics merged into admin role composables. |
| `src/composables/shared/useBookings.ts` | CRUD moves to supabase composable; validation stays in `businessLogic.ts`. |
| `src/composables/shared/useProperties.ts` | Same. |
| `src/composables/shared/useBackgroundSync.ts` | Offline queue dropped. |

---

## Phase 1: Bookings

### Task 1: Simplify Booking Store to Pure State

**Files:**
- Modify: `src/stores/booking.ts`
- Test: `src/__tests__/stores/booking.spec.ts`

- [ ] **Step 1: Read the current store and test file**

Read `src/stores/booking.ts` and `src/__tests__/stores/booking.spec.ts` to understand current API surface and test patterns.

- [ ] **Step 2: Update the store — remove Supabase, add synchronous mutations**

Replace the entire file. Keep all existing getters, cache system, and Map state. Remove: `supabase` import, all async CRUD methods (`addBooking`, `updateBooking`, `removeBooking`, `fetchBookings`, `updateBookingStatus`, `assignCleaner`). Add synchronous mutations:

```typescript
import type { Booking, BookingMap, BookingStatus, BookingType } from '@/types/booking.ts'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  filterBookingsByDateRange,
  getUpcomingBookings,
  getUrgentTurns,
} from '@/utils/businessLogic.ts'
import { createMapCache } from '@/utils/cachedMapFilter.ts'

export const useBookingStore = defineStore('booking', () => {
  // State
  const bookings = ref<BookingMap>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Shared TTL cache for all filtered Maps
  const cache = createMapCache(10_000)
  const invalidateCache = cache.invalidate

  // --- ALL EXISTING GETTERS STAY UNCHANGED (lines 25-109 of current file) ---
  // bookingsArray, getBookingById, bookingsByStatusMap, bookingsByTypeMap,
  // bookingsByStatus, bookingsByType, bookingsByProperty, bookingsByOwner,
  // bookingsByDateRange, pendingBookingsMap, scheduledBookingsMap, turnBookingsMap,
  // standardBookingsMap, upcomingBookingsMap, urgentTurnsMap,
  // pendingBookings, scheduledBookings, turnBookings, standardBookings
  // (copy them exactly as-is)

  // --- SYNCHRONOUS MUTATIONS (replace all async methods) ---

  function setBookings (data: Booking[]) {
    bookings.value = new Map(data.map(b => [b.id, b]))
    invalidateCache()
  }

  function setBooking (id: string, booking: Booking) {
    bookings.value.set(id, booking)
    invalidateCache()
  }

  function removeBooking (id: string) {
    bookings.value.delete(id)
    invalidateCache()
  }

  function clearAll () {
    bookings.value.clear()
    invalidateCache()
  }

  return {
    // State
    bookings, loading, error,

    // Map getters (all existing — unchanged)
    bookingsByStatusMap, bookingsByTypeMap,
    pendingBookingsMap, scheduledBookingsMap, turnBookingsMap,
    standardBookingsMap, upcomingBookingsMap, urgentTurnsMap,

    // Parameterized Map getters
    getBookingById, bookingsByStatus, bookingsByType,
    bookingsByProperty, bookingsByOwner, bookingsByDateRange,

    // Array getters
    bookingsArray, pendingBookings, scheduledBookings,
    turnBookings, standardBookings,

    // Mutations (synchronous)
    setBookings, setBooking, removeBooking, clearAll,

    // Cache management
    invalidateCache,
  }
})
```

- [ ] **Step 3: Update store tests**

Update `src/__tests__/stores/booking.spec.ts`. Tests that called `store.addBooking()` (async) now call `store.setBooking(id, booking)` (sync). Tests that called `store.updateBooking()` now call `store.setBooking(id, updatedBooking)`. Tests that called `store.removeBooking()` now call the sync version.

```typescript
// Before:
await store.addBooking(booking)
// After:
store.setBooking(booking.id, booking)

// Before:
await store.updateBooking('booking1', { status: 'scheduled' })
// After:
const existing = store.bookings.get('booking1')!
store.setBooking('booking1', { ...existing, status: 'scheduled' })

// Before:
await store.removeBooking('booking1')
// After:
store.removeBooking('booking1')
```

Also add a test for `setBookings()`:

```typescript
it('should bulk set bookings via setBookings()', () => {
  const store = useBookingStore()
  const bookings = [
    { id: 'b1', property_id: 'p1', owner_id: 'o1', /* ... */ } as Booking,
    { id: 'b2', property_id: 'p2', owner_id: 'o2', /* ... */ } as Booking,
  ]
  store.setBookings(bookings)
  expect(store.bookings.size).toBe(2)
  expect(store.bookings.get('b1')).toBeDefined()
})
```

- [ ] **Step 4: Run tests to verify**

Run: `pnpm test -- src/__tests__/stores/booking.spec.ts`
Expected: All tests pass.

- [ ] **Step 5: Run build to check types**

Run: `pnpm build`
Expected: Build will have type errors because other files still import old store methods (e.g., `addBooking`, `fetchBookings`). This is expected — we'll fix those in subsequent tasks. Note the errors for reference but don't fix them yet.

- [ ] **Step 6: Commit**

```bash
git add src/stores/booking.ts src/__tests__/stores/booking.spec.ts
git commit -m "refactor: simplify booking store to pure reactive state (no Supabase)"
```

---

### Task 2: Rewrite `useSupabaseBookings` — CRUD + Realtime + Optimistic Updates

**Files:**
- Modify: `src/composables/supabase/useSupabaseBookings.ts`
- Create: `src/__tests__/composables/useSupabaseBookings.spec.ts`

- [ ] **Step 1: Write the test file first**

Create `src/__tests__/composables/useSupabaseBookings.spec.ts`:

```typescript
import type { Booking } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookingStore } from '@/stores/booking'

// Mock supabase
vi.mock('@/plugins/supabase', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return channelMock }),
  }
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
    default: undefined,
  }
})

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'b1',
  property_id: 'p1',
  owner_id: 'o1',
  checkin_date: '2026-03-25',
  checkout_date: '2026-03-27',
  checkin_time: '15:00:00',
  checkout_time: '11:00:00',
  booking_type: 'standard',
  status: 'pending',
  priority: 'normal',
  ...overrides,
})

describe('useSupabaseBookings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset module-level singleton state between tests
    vi.resetModules()
  })

  it('should populate store on fetchAndSubscribe', async () => {
    // Test that fetch populates the booking store
    const store = useBookingStore()
    expect(store.bookings.size).toBe(0)
    // After fetchAndSubscribe, store should have data
  })

  it('should create booking optimistically', async () => {
    // Test that createBooking sets store immediately before Supabase responds
    const store = useBookingStore()
    // createBooking should call store.setBooking optimistically
  })

  it('should rollback on create failure', async () => {
    // Test that a failed insert rolls back the optimistic update
    const store = useBookingStore()
    // After error, store should not contain the booking
  })

  it('should skip realtime event for optimistic ids', () => {
    // Test deduplication — realtime INSERT for an ID already applied optimistically
    const store = useBookingStore()
    // The realtime handler should skip the event
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/composables/useSupabaseBookings.spec.ts`
Expected: FAIL (tests are stubs)

- [ ] **Step 3: Rewrite the composable**

Replace `src/composables/supabase/useSupabaseBookings.ts` entirely:

```typescript
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Booking, BookingFormData } from '@/types'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/plugins/supabase'
import { useBookingStore } from '@/stores/booking'
import { canTransitionBookingStatus } from '@/utils/businessLogic'

// --- Module-level singleton state ---
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

const OPTIMISTIC_CLEANUP_DELAY = 5_000

export function useSupabaseBookings () {
  const bookingStore = useBookingStore()

  // --- Lifecycle ---

  async function fetchAndSubscribe () {
    bookingStore.loading = true
    bookingStore.error = null

    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .order('checkout_date', { ascending: true })

      if (fetchError) throw fetchError

      bookingStore.setBookings((data ?? []) as Booking[])
    } catch (err) {
      bookingStore.error = err instanceof Error ? err.message : 'Failed to fetch bookings'
      console.error('[useSupabaseBookings] fetch error:', err)
    } finally {
      bookingStore.loading = false
    }

    subscribe()
  }

  function subscribe () {
    if (channel) return // already subscribed

    connectionStatus.value = 'connecting'

    channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => handleRealtimeEvent(payload),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') connectionStatus.value = 'connected'
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') connectionStatus.value = 'disconnected'
      })
  }

  function unsubscribe () {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    connectionStatus.value = 'disconnected'
    optimisticIds.clear()
  }

  // --- Realtime handler ---

  function handleRealtimeEvent (payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const id = (newRecord || oldRecord)?.id

    if (!id) return

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE': {
        if (optimisticIds.has(id)) return // skip — already applied optimistically
        bookingStore.setBooking(id, newRecord as Booking)
        break
      }
      case 'DELETE': {
        optimisticIds.delete(id) // cleanup if it was tracked
        bookingStore.removeBooking(oldRecord.id)
        break
      }
    }
  }

  // --- Optimistic tracking helpers ---

  function trackOptimistic (id: string) {
    optimisticIds.add(id)
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_CLEANUP_DELAY)
  }

  // --- CRUD ---

  async function createBooking (formData: BookingFormData): Promise<Booking> {
    const id = uuidv4()
    const now = new Date().toISOString()

    const booking: Booking = {
      id,
      property_id: formData.property_id,
      owner_id: formData.owner_id,
      checkin_date: formData.checkin_date,
      checkout_date: formData.checkout_date,
      checkin_time: formData.checkin_time,
      checkout_time: formData.checkout_time,
      booking_type: formData.booking_type,
      status: formData.status ?? 'pending',
      priority: formData.priority ?? 'normal',
      guest_count: formData.guest_count ?? null,
      notes: formData.notes ?? null,
      assigned_cleaner_id: formData.assigned_cleaner_id ?? null,
      turn_date: formData.turn_date ?? null,
      turn_start_time: formData.turn_start_time ?? null,
      turn_checkin_time: formData.turn_checkin_time ?? null,
      created_at: now,
      updated_at: now,
    }

    // Optimistic
    bookingStore.setBooking(id, booking)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').insert(booking)
      if (error) throw error
      return booking
    } catch (err) {
      bookingStore.removeBooking(id) // rollback
      optimisticIds.delete(id)
      throw err
    }
  }

  async function updateBooking (id: string, updates: Partial<Booking>): Promise<Booking> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) throw new Error('Booking not found')

    const updated: Booking = { ...existing, ...updates, updated_at: new Date().toISOString() }

    // Optimistic
    bookingStore.setBooking(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').update(updates).eq('id', id)
      if (error) throw error
      return updated
    } catch (err) {
      bookingStore.setBooking(id, existing) // rollback
      optimisticIds.delete(id)
      throw err
    }
  }

  async function deleteBooking (id: string): Promise<void> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) throw new Error('Booking not found')

    // Optimistic
    bookingStore.removeBooking(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      bookingStore.setBooking(id, existing) // rollback
      optimisticIds.delete(id)
      throw err
    }
  }

  async function changeBookingStatus (id: string, status: Booking['status']): Promise<Booking> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) throw new Error('Booking not found')
    if (!canTransitionBookingStatus(existing, status)) {
      throw new Error(`Cannot transition from ${existing.status} to ${status}`)
    }
    return updateBooking(id, { status })
  }

  async function assignCleaner (bookingId: string, cleanerId: string): Promise<Booking> {
    return updateBooking(bookingId, { assigned_cleaner_id: cleanerId })
  }

  return {
    fetchAndSubscribe,
    unsubscribe,
    createBooking,
    updateBooking,
    deleteBooking,
    changeBookingStatus,
    assignCleaner,
    connectionStatus,
  }
}
```

- [ ] **Step 4: Flesh out tests and run**

Complete the test stubs with actual assertions now that the implementation exists.

Run: `pnpm test -- src/__tests__/composables/useSupabaseBookings.spec.ts`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/composables/supabase/useSupabaseBookings.ts src/__tests__/composables/useSupabaseBookings.spec.ts
git commit -m "feat: rewrite useSupabaseBookings — owns CRUD, realtime, optimistic updates"
```

---

### Task 3: Update Owner Booking Composable

**Files:**
- Modify: `src/composables/owner/useOwnerBookings.ts`

- [ ] **Step 1: Read current file**

Read `src/composables/owner/useOwnerBookings.ts` fully (already read — 565 lines).

- [ ] **Step 2: Rewrite CRUD delegation**

Change the imports and CRUD delegation. The key changes:
1. Import `useSupabaseBookings` instead of `useBookings`
2. CRUD methods delegate to `useSupabaseBookings` instead of store/shared composable
3. Keep all computed properties (they read from store — unchanged)
4. Keep all ownership validation (stays in this composable)
5. Remove `fetchMyBookings` — data is loaded via `useRealtimeSync().init()` at layout level
6. Keep `fetchMyProperties` reference for backward compat

```typescript
// Key import change:
import { useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
// Remove:
// import { useBookings } from '@/composables/shared/useBookings'

// Inside the function:
const { createBooking: supaCreateBooking, updateBooking: supaUpdateBooking,
        deleteBooking: supaDeleteBooking, changeBookingStatus: supaChangeStatus,
} = useSupabaseBookings()

// createMyBooking now delegates:
async function createMyBooking (formData: BookingFormData): Promise<string | null> {
  // ... same ownership validation ...
  const ownerBookingData: BookingFormData = { ...formData, owner_id: currentUserId.value }
  const booking = await supaCreateBooking(ownerBookingData)
  return booking.id
}

// updateMyBooking:
async function updateMyBooking (id: string, updates: Partial<BookingFormData>): Promise<boolean> {
  // ... same ownership + property validation ...
  await supaUpdateBooking(id, updates)
  return true
}

// deleteMyBooking:
async function deleteMyBooking (id: string): Promise<boolean> {
  // ... same ownership validation ...
  await supaDeleteBooking(id)
  return true
}

// changeMyBookingStatus:
async function changeMyBookingStatus (id: string, status: BookingStatus): Promise<boolean> {
  // ... same ownership validation ...
  await supaChangeStatus(id, status)
  return true
}
```

Remove `calculateCleaningWindow` and `calculateBookingPriority` re-exports from base — import from `@/utils/businessLogic` directly if needed by consumers.

- [ ] **Step 3: Verify no type errors**

Run: `pnpm build:fast`
Expected: May still have errors from other files referencing deleted store methods. Focus on this file compiling cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/composables/owner/useOwnerBookings.ts
git commit -m "refactor: useOwnerBookings delegates CRUD to useSupabaseBookings"
```

---

### Task 4: Update Admin Booking Composable

**Files:**
- Modify: `src/composables/admin/useAdminBookings.ts`

- [ ] **Step 1: Read current file**

Read `src/composables/admin/useAdminBookings.ts` (already read — 748 lines).

- [ ] **Step 2: Rewrite CRUD delegation**

Same pattern as owner composable:
1. Import `useSupabaseBookings` instead of `useBookings`
2. CRUD methods delegate to `useSupabaseBookings`
3. Keep all system-wide computeds and analytics (unchanged — they read from store)
4. Keep bulk operations (they loop over individual CRUD calls)
5. Keep permission functions

```typescript
import { useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
// Remove: import { useBookings } from '@/composables/shared/useBookings'

const { createBooking: supaCreate, updateBooking: supaUpdate,
        deleteBooking: supaDelete, changeBookingStatus: supaChangeStatus,
        assignCleaner: supaAssignCleaner,
} = useSupabaseBookings()

// createBooking:
const createBooking = async (bookingData: BookingFormData): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    await supaCreate(bookingData)
    success.value = 'Booking created successfully'
  } catch (error_) {
    error.value = `Failed to create booking: ${error_ instanceof Error ? error_.message : String(error_)}`
    throw error_
  } finally {
    loading.value = false
  }
}

// Same pattern for updateBooking, deleteBooking, updateBookingStatus, assignCleaner
// bulkAssignCleaner and bulkUpdateStatus loop over the individual functions (unchanged pattern)
```

- [ ] **Step 3: Verify no type errors in this file**

Run: `pnpm build:fast`

- [ ] **Step 4: Commit**

```bash
git add src/composables/admin/useAdminBookings.ts
git commit -m "refactor: useAdminBookings delegates CRUD to useSupabaseBookings"
```

---

### Task 5: Rewrite `useRealtimeSync` as Thin Coordinator

**Files:**
- Modify: `src/composables/supabase/useRealtimeSync.ts`
- Create: `src/__tests__/composables/useRealtimeSync.spec.ts`

- [ ] **Step 1: Write test stubs**

Create `src/__tests__/composables/useRealtimeSync.spec.ts`:

```typescript
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/plugins/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
  },
  default: undefined,
}))

vi.mock('@/composables/supabase/useSupabaseBookings', () => ({
  useSupabaseBookings: () => ({
    fetchAndSubscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn(),
    connectionStatus: { value: 'connected' },
  }),
}))

vi.mock('@/composables/supabase/useSupabaseProperties', () => ({
  useSupabaseProperties: () => ({
    fetchAndSubscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn(),
    connectionStatus: { value: 'connected' },
  }),
}))

describe('useRealtimeSync', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('should init both bookings and properties', async () => {
    // Verify init() calls fetchAndSubscribe on both composables
  })

  it('should report connected when both channels are connected', () => {
    // Verify connectionStatus computed
  })

  it('should teardown all channels and clear stores', () => {
    // Verify teardown clears stores and unsubscribes
  })
})
```

- [ ] **Step 2: Rewrite the composable**

Replace `src/composables/supabase/useRealtimeSync.ts`:

```typescript
import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
import { useSupabaseProperties } from '@/composables/supabase/useSupabaseProperties'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'

export function useRealtimeSync () {
  const { fetchAndSubscribe: initBookings, unsubscribe: teardownBookings,
          connectionStatus: bookingStatus } = useSupabaseBookings()
  const { fetchAndSubscribe: initProperties, unsubscribe: teardownProperties,
          connectionStatus: propertyStatus } = useSupabaseProperties()
  const authStore = useAuthStore()
  const bookingStore = useBookingStore()
  const propertyStore = usePropertyStore()

  const isOnline = ref(navigator.onLine)
  let profileChannel: RealtimeChannel | null = null

  const connectionStatus = computed(() => {
    if (bookingStatus.value === 'connected' && propertyStatus.value === 'connected')
      return 'connected'
    if (bookingStatus.value === 'connecting' || propertyStatus.value === 'connecting')
      return 'connecting'
    return 'disconnected'
  })

  function subscribeToProfileChanges () {
    if (profileChannel) return
    profileChannel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${authStore.user?.id}`,
        },
        () => authStore.checkAuth(),
      )
      .subscribe()
  }

  async function init () {
    await initBookings()
    await initProperties()
    subscribeToProfileChanges()
  }

  function teardown () {
    teardownBookings()
    teardownProperties()
    if (profileChannel) {
      supabase.removeChannel(profileChannel)
      profileChannel = null
    }
    bookingStore.clearAll()
    propertyStore.clearAll()
  }

  // Network monitoring
  function onOnline () {
    isOnline.value = true
    init()
  }
  function onOffline () {
    isOnline.value = false
  }

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

- [ ] **Step 3: Run tests**

Run: `pnpm test -- src/__tests__/composables/useRealtimeSync.spec.ts`
Expected: Pass.

- [ ] **Step 4: Commit**

```bash
git add src/composables/supabase/useRealtimeSync.ts src/__tests__/composables/useRealtimeSync.spec.ts
git commit -m "refactor: useRealtimeSync as thin coordinator for bookings + properties"
```

---

### Task 6: Wire Up Layouts

**Files:**
- Modify: `src/layouts/owner.vue`
- Modify: `src/layouts/admin.vue`

- [ ] **Step 1: Update owner layout**

Add `useRealtimeSync` import and init on mount. The owner layout currently has no data fetching (that happens in `HomeOwner.vue`), so this adds it.

In `src/layouts/owner.vue`, in the `<script setup>` section, add:

```typescript
import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'

const { init: initRealtimeSync, connectionStatus } = useRealtimeSync()

// Add to the script setup body (not inside onMounted — useRealtimeSync registers its own lifecycle hooks)
// The init call goes in onMounted:
import { onMounted } from 'vue' // already imported as part of existing imports

onMounted(() => {
  initRealtimeSync()
})
```

Note: `onMounted` is already imported in this file. Just add the `useRealtimeSync` import and the `onMounted` call.

- [ ] **Step 2: Update admin layout**

In `src/layouts/admin.vue`, replace the existing `onMounted` data fetch:

```typescript
// Add import:
import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'

// In script setup:
const { init: initRealtimeSync, connectionStatus } = useRealtimeSync()

// Replace the existing onMounted:
onMounted(async () => {
  console.log('[AdminLayout] Initializing realtime sync...')
  loading.value = true
  try {
    await Promise.all([
      fetchAllUsers(), // keep — auth data, outside scope of this refactor
      initRealtimeSync(), // replaces bookingStore.fetchBookings() + propertyStore.fetchProperties()
    ])
  } catch (error) {
    console.error('[AdminLayout] Failed to initialize:', error)
  } finally {
    loading.value = false
  }
})
```

Remove the direct `bookingStore.fetchBookings()` and `propertyStore.fetchProperties()` calls. Keep `fetchAllUsers()`.

- [ ] **Step 3: Verify the app boots**

Run: `pnpm dev` and open the app in a browser. Verify:
- Owner side loads and shows data
- Admin side loads and shows data
- No console errors about missing methods

- [ ] **Step 4: Commit**

```bash
git add src/layouts/owner.vue src/layouts/admin.vue
git commit -m "feat: wire useRealtimeSync into owner and admin layouts"
```

---

### Task 7: Run Full Test Suite and Fix Breakage

**Files:**
- Various test files that reference old store methods

- [ ] **Step 1: Run full test suite**

Run: `pnpm test:run`
Note all failing tests.

- [ ] **Step 2: Fix each failing test**

For each test that calls `store.addBooking()`, `store.updateBooking()`, `store.fetchBookings()`, etc.:
- Replace with the new synchronous store methods (`setBooking`, `setBookings`, `removeBooking`)
- Or if the test is testing CRUD flow, mock `useSupabaseBookings` instead

- [ ] **Step 3: Run build**

Run: `pnpm build`
Expected: Pass with no type errors.

- [ ] **Step 4: Run performance tests**

Run: `pnpm test:performance`
Expected: Pass (stores still use Maps + cache).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: update tests for new booking store API"
```

---

## Phase 2: Properties

### Task 8: Simplify Property Store to Pure State

**Files:**
- Modify: `src/stores/property.ts`
- Test: `src/__tests__/stores/property.spec.ts`

- [ ] **Step 1: Read current files**

Read `src/stores/property.ts` and `src/__tests__/stores/property.spec.ts`.

- [ ] **Step 2: Update the store**

Same treatment as booking store. Remove: `supabase` import, `fetchProperties`, `addProperty`, `updateProperty`, `removeProperty` (all async). Add synchronous: `setProperties(data: Property[])`, `setProperty(id, property)`, `removeProperty(id)` (sync), rename `clearAll` to keep consistency.

Keep all getters unchanged: `propertiesArray`, `activePropertiesMap`, `activeProperties`, `getPropertyById`, `propertiesByPricingTierMap`, `propertiesByPricingTier`, `propertiesByOwner`, `propertiesByActiveStatus`, `averageCleaningDuration`.

- [ ] **Step 3: Update property store tests**

Same pattern as booking store tests — `store.addProperty()` becomes `store.setProperty(id, prop)`, etc.

- [ ] **Step 4: Run tests**

Run: `pnpm test -- src/__tests__/stores/property.spec.ts`
Expected: Pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/property.ts src/__tests__/stores/property.spec.ts
git commit -m "refactor: simplify property store to pure reactive state (no Supabase)"
```

---

### Task 9: Rewrite `useSupabaseProperties` — CRUD + Realtime + Optimistic Updates

**Files:**
- Modify: `src/composables/supabase/useSupabaseProperties.ts`
- Create: `src/__tests__/composables/useSupabaseProperties.spec.ts`

- [ ] **Step 1: Write test stubs**

Mirror the pattern from `useSupabaseBookings.spec.ts`.

- [ ] **Step 2: Rewrite the composable**

Same pattern as `useSupabaseBookings`: module-level singleton, `fetchAndSubscribe`, `unsubscribe`, `createProperty`, `updateProperty`, `deleteProperty` (soft delete via `active: false`), optimistic updates + rollback, realtime handler.

Key difference from bookings: `deleteProperty` does soft delete (`update({ active: false })` + remove from store), not hard delete.

- [ ] **Step 3: Run tests**

Run: `pnpm test -- src/__tests__/composables/useSupabaseProperties.spec.ts`
Expected: Pass.

- [ ] **Step 4: Commit**

```bash
git add src/composables/supabase/useSupabaseProperties.ts src/__tests__/composables/useSupabaseProperties.spec.ts
git commit -m "feat: rewrite useSupabaseProperties — owns CRUD, realtime, optimistic updates"
```

---

### Task 10: Update Owner and Admin Property Composables

**Files:**
- Modify: `src/composables/owner/useOwnerProperties.ts`
- Modify: `src/composables/admin/useAdminProperties.ts`

- [ ] **Step 1: Update owner property composable**

Same pattern as Task 3: import `useSupabaseProperties`, delegate CRUD, keep ownership validation and computed properties.

- [ ] **Step 2: Update admin property composable**

Same pattern as Task 4: import `useSupabaseProperties`, delegate CRUD, keep system-wide analytics and bulk ops.

- [ ] **Step 3: Run build**

Run: `pnpm build:fast`

- [ ] **Step 4: Commit**

```bash
git add src/composables/owner/useOwnerProperties.ts src/composables/admin/useAdminProperties.ts
git commit -m "refactor: owner/admin property composables delegate to useSupabaseProperties"
```

---

### Task 11: Run Full Test Suite for Phase 2

**Files:** Various

- [ ] **Step 1: Run full test suite**

Run: `pnpm test:run`
Fix any failing tests (same pattern as Task 7).

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Pass.

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: update tests for new property store API"
```

---

## Phase 3: Cleanup

### Task 12: Delete Dead Files

**Files:**
- Delete: `src/stores/ownerData.ts`
- Delete: `src/stores/adminData.ts`
- Delete: `src/composables/shared/useBookings.ts`
- Delete: `src/composables/shared/useProperties.ts`
- Delete: `src/composables/shared/useBackgroundSync.ts`

- [ ] **Step 1: Verify no remaining imports**

Search for imports of each file to be deleted:

```bash
# Run these searches:
grep -r "useOwnerDataStore\|ownerData" src/ --include="*.ts" --include="*.vue" -l
grep -r "useAdminDataStore\|adminData" src/ --include="*.ts" --include="*.vue" -l
grep -r "useBookings\b" src/ --include="*.ts" --include="*.vue" -l
grep -r "useProperties\b" src/ --include="*.ts" --include="*.vue" -l
grep -r "useBackgroundSync" src/ --include="*.ts" --include="*.vue" -l
```

- [ ] **Step 2: Fix remaining consumers before deleting**

For each file that still imports from the to-be-deleted files:
- `src/composables/shared/usePWA.ts` — remove `useBackgroundSync` import and references
- `src/components/smart/admin/AdminOwnerDetail.vue` — replace `useOwnerDataStore` with `useAdminProperties`/`useAdminBookings`
- `src/components/dumb/admin/PerformanceMetricsDashboard.vue` — replace store imports with role composables
- `src/pages/crud-testing.vue` — replace shared composable imports with supabase composable calls
- `src/dev/demos/OwnerDataStoreDemo.vue` — delete (demo for deleted store)
- `src/dev/demos/Admin/AdminDataStoreDemo.vue` — delete (demo for deleted store)

- [ ] **Step 3: Delete the files**

```bash
rm src/stores/ownerData.ts
rm src/stores/adminData.ts
rm src/composables/shared/useBookings.ts
rm src/composables/shared/useProperties.ts
rm src/composables/shared/useBackgroundSync.ts
rm src/dev/demos/OwnerDataStoreDemo.vue
rm src/dev/demos/Admin/AdminDataStoreDemo.vue
```

- [ ] **Step 4: Run build**

Run: `pnpm build`
Expected: Pass with no type errors.

- [ ] **Step 5: Run full test suite**

Run: `pnpm test:run`
Expected: Pass. Delete any orphaned test files for deleted modules.

- [ ] **Step 6: Run performance tests**

Run: `pnpm test:performance`
Expected: Pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: delete ownerData, adminData stores, shared composables, backgroundSync"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Clean build, no type errors.

- [ ] **Step 2: Run all tests**

Run: `pnpm test:run`
Expected: All pass.

- [ ] **Step 3: Run performance tests**

Run: `pnpm test:performance`
Expected: All pass.

- [ ] **Step 4: Manual smoke test**

Run: `pnpm dev` and verify:
1. Owner login → data loads → bookings/properties visible
2. Create a booking → appears immediately (optimistic) → persists after refresh
3. Admin login → all data visible → CRUD works
4. Open two browser tabs → change in one tab appears in the other (realtime working)

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup for unified realtime sync"
```
