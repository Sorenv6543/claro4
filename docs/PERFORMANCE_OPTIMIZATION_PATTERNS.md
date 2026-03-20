# Performance Optimization Patterns

## Overview

Performance patterns implemented in the Property Cleaning Scheduler. This document covers what is **actually in the codebase**, not aspirational designs.

## 1. Map-Based Collections with TTL Cache

All stores use `Map<string, T>` instead of arrays for O(1) lookups. Filtered views (by status, type, owner, etc.) are cached with a shared TTL mechanism.

### Shared Cache Utility

**File:** `src/utils/cachedMapFilter.ts`

Extracts the duplicated cacheTimestamp/isCacheValid/invalidateCache pattern into a reusable primitive:

```typescript
import { createMapCache } from '@/utils/cachedMapFilter'

const cache = createMapCache(10_000) // 10s TTL

// Group a source Map by a key extractor → Map<K, Map<string, V>>
const byStatus = cache.cachedGroupBy(
  () => bookings.value,
  (booking) => booking.status
)

// Filter by predicate → Map<string, V>
const activeOnly = cache.cachedFilter(
  () => properties.value,
  (property) => property.active
)

// Parameterized filter (key) → Map<string, V>, each key cached separately
const byOwner = cache.cachedFilterBy(
  () => bookings.value,
  (booking, ownerId) => booking.owner_id === ownerId
)

cache.invalidate() // bust all cached maps
```

### Store Usage

| Store | File | TTL | Cached Filters |
|-------|------|-----|----------------|
| Booking | `src/stores/booking.ts` | 10s | byStatus, byType, byProperty, byOwner |
| Property | `src/stores/property.ts` | 10s | active, byPricingTier, byOwner |
| OwnerData | `src/stores/ownerData.ts` | 30s | ownerProperties, ownerBookings (array cache) |
| AdminData | `src/stores/adminData.ts` | 15s | ownerAnalytics, criticalAlerts |

### Optimistic Updates with Rollback

Booking and property stores apply changes immediately, then sync to Supabase. On failure, the original state is restored:

```typescript
// booking.ts pattern
const originalMap = new Map(bookings.value)
bookings.value.set(id, updated) // optimistic
try {
  await supabase.from('bookings').update(updates).eq('id', id)
  invalidateCache()
} catch {
  // rollback
  bookings.value.clear()
  originalMap.forEach((b, k) => bookings.value.set(k, b))
  invalidateCache()
}
```

## 2. Role-Based Subscription Filtering

**File:** `src/composables/supabase/useRealtimeSync.ts`

Supabase realtime subscriptions (bookings, properties, user_profiles) filter events by role:

- **Owner**: only processes events matching `owner_id`
- **Admin**: processes all events (no filtering)
- Optimistic update tracking prevents double-applying changes already applied locally

This is embedded in `useRealtimeSync`, not a separate composable.

## 3. Computed Property Caching

**File:** `src/composables/shared/useCachedComputed.ts`

Simple 10s TTL wrapper around Vue's `computed()`. Always calls the getter (to maintain Vue dependency tracking) but returns the cached value when within TTL.

```typescript
import { useCachedComputed } from '@/composables/shared/useCachedComputed'
const expensive = useCachedComputed(() => heavyCalculation(source.value))
```

**Note:** Not used in `useOwnerBookings` because TTL caching delays user-triggered mutations from appearing in the UI.

## 4. Background Sync (Offline Queue)

**File:** `src/composables/shared/useBackgroundSync.ts`

Queue-based offline sync with localStorage persistence and retry logic. Operations are queued when offline and processed when connectivity returns.

### Supported Operations
- `create_booking`, `update_booking`, `delete_booking`
- `create_property`, `update_property`, `delete_property`

### How It Works
1. Operations are added to a queue persisted in localStorage
2. When online, items are processed sequentially with up to 3 retries per item
3. Failed items beyond max retries are dropped
4. Auto-sync checks every 30 seconds and on `online` events

```typescript
const { queueOperation, processQueue, startAutoSync } = useBackgroundSync()

// Queue an operation (processes immediately if online)
queueOperation('create_booking', bookingData, userId, userRole)

// Start periodic auto-sync
startAutoSync()
```

All sync operations call Supabase directly (insert/update/delete). Property deletes are soft-deletes (set `active: false`).

## 5. Performance Monitoring

**File:** `src/composables/shared/usePerformanceMonitor.ts`

Tracks runtime metrics including:
- Component render counts and durations
- Subscription counts
- Memory usage estimates
- Network latency
- Cache hit rates
- Bundle load times

Performance thresholds:
- Max subscriptions: 50 (target 40)
- Max render time: 16ms (60fps)
- Min cache hit rate: 80%
- Max network latency: 300ms

Used in `useOwnerBookings` and `useAdminBookings` composables.

## 6. What Is NOT Implemented

These patterns were previously documented but do not exist in the codebase:

| Pattern | Status | Notes |
|---------|--------|-------|
| Battery optimization | Not implemented | No Battery API usage |
| Web Workers / BackgroundProcessor | Not implemented | No worker files exist |
| UpdateBatcher (render batching) | Not implemented | Updates are immediate |
| BatteryOptimizedNetworking | Not implemented | Standard fetch patterns used |
| BatteryOptimizedSync | Not implemented | useBackgroundSync handles offline only |
| OptimizedCollectionManager class | Not implemented | Replaced by createMapCache utility |
| useRoleBasedSubscriptions | Not implemented | Filtering lives in useRealtimeSync |
| useSmartDataFiltering | Not implemented | Query filtering done in composables directly |

These could be implemented if performance profiling shows a need, but for a 30-40 user app they represent unnecessary complexity.
