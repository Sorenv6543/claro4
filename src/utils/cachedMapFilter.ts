import { computed, type ComputedRef, ref, type Ref } from 'vue'

/**
 * Shared TTL-based cache for filtered Map computeds.
 *
 * Every store (booking, property, ownerData, adminData) duplicates
 * the same cacheTimestamp / isCacheValid / invalidateCache plumbing.
 * This utility extracts that into a single reusable primitive.
 *
 * Each cached computed tracks its own last-updated timestamp so that
 * one computed recomputing does not mask staleness in another.
 *
 * Usage:
 *   const cache = createMapCache(10_000)                  // 10s TTL
 *   const byStatus = cache.cachedGroupBy(                 // returns ComputedRef<Map>
 *     () => bookings.value,                               // source Map
 *     (booking) => booking.status                          // key extractor
 *   )
 *   cache.invalidate()                                    // bust all cached maps
 */

export interface MapCache {
  /** Invalidate all cached maps managed by this cache instance. */
  invalidate: () => void
  /** Whether any cache has been updated within the TTL window. */
  isCacheValid: ComputedRef<boolean>
  /**
   * Create a computed that groups a source Map by a key extractor,
   * returning Map<K, Map<string, V>>. Results are cached until TTL expires
   * or invalidate() is called.
   */
  cachedGroupBy: <V, K extends string>(
    source: () => Map<string, V>,
    keyFn: (item: V) => K,
  ) => ComputedRef<Map<K, Map<string, V>>>
  /**
   * Create a computed that filters a source Map by a predicate,
   * returning Map<string, V>. Results are cached until TTL expires
   * or invalidate() is called.
   */
  cachedFilter: <V>(
    source: () => Map<string, V>,
    predicate: (item: V) => boolean,
  ) => ComputedRef<Map<string, V>>
  /**
   * Create a computed that filters a source Map by a parameterized key,
   * returning a function (key) => Map<string, V>. Each key's result
   * is individually cached until TTL expires or invalidate() is called.
   */
  cachedFilterBy: <V>(
    source: () => Map<string, V>,
    matchFn: (item: V, key: string) => boolean,
  ) => ComputedRef<(key: string) => Map<string, V>>
}

export function createMapCache (ttl = 10_000): MapCache {
  // Track all cached refs so invalidate() can clear them
  const trackedCaches: { cache: Ref<unknown>, timestamp: Ref<number> }[] = []
  const trackedParamCaches: { cache: Ref<Map<string, unknown>>, timestamp: Ref<number> }[] = []

  // Global timestamp for isCacheValid — updated whenever any computed recomputes
  const globalTimestamp = ref(0)

  const isCacheValid = computed(() => {
    return (Date.now() - globalTimestamp.value) < ttl
  })

  const invalidate = () => {
    globalTimestamp.value = 0
    for (const entry of trackedCaches) {
      entry.cache.value = null
      entry.timestamp.value = 0
    }
    for (const entry of trackedParamCaches) {
      (entry.cache.value as Map<string, unknown>).clear()
      entry.timestamp.value = 0
    }
  }

  const cachedGroupBy = <V, K extends string>(
    source: () => Map<string, V>,
    keyFn: (item: V) => K,
  ): ComputedRef<Map<K, Map<string, V>>> => {
    const cached = ref<Map<K, Map<string, V>> | null>(null) as Ref<Map<K, Map<string, V>> | null>
    const ownTimestamp = ref(0)
    trackedCaches.push({ cache: cached as Ref<unknown>, timestamp: ownTimestamp })

    return computed(() => {
      if ((Date.now() - ownTimestamp.value) < ttl && cached.value) {
        return cached.value
      }

      const grouped = new Map<K, Map<string, V>>()
      for (const [id, item] of source().entries()) {
        const key = keyFn(item)
        if (!grouped.has(key)) {
          grouped.set(key, new Map())
        }
        grouped.get(key)!.set(id, item)
      }

      cached.value = grouped
      const now = Date.now()
      ownTimestamp.value = now
      globalTimestamp.value = now
      return grouped
    })
  }

  const cachedFilter = <V>(
    source: () => Map<string, V>,
    predicate: (item: V) => boolean,
  ): ComputedRef<Map<string, V>> => {
    const cached = ref<Map<string, V> | null>(null) as Ref<Map<string, V> | null>
    const ownTimestamp = ref(0)
    trackedCaches.push({ cache: cached as Ref<unknown>, timestamp: ownTimestamp })

    return computed(() => {
      if ((Date.now() - ownTimestamp.value) < ttl && cached.value) {
        return cached.value
      }

      const filtered = new Map<string, V>()
      for (const [id, item] of source().entries()) {
        if (predicate(item)) {
          filtered.set(id, item)
        }
      }

      cached.value = filtered
      const now = Date.now()
      ownTimestamp.value = now
      globalTimestamp.value = now
      return filtered
    })
  }

  const cachedFilterBy = <V>(
    source: () => Map<string, V>,
    matchFn: (item: V, key: string) => boolean,
  ): ComputedRef<(key: string) => Map<string, V>> => {
    const cached = ref(new Map<string, Map<string, V>>()) as Ref<Map<string, Map<string, V>>>
    const ownTimestamp = ref(0)
    trackedParamCaches.push({ cache: cached as Ref<Map<string, unknown>>, timestamp: ownTimestamp })

    return computed(() => (key: string): Map<string, V> => {
      if ((Date.now() - ownTimestamp.value) < ttl && cached.value.has(key)) {
        return cached.value.get(key)!
      }

      const filtered = new Map<string, V>()
      for (const [id, item] of source().entries()) {
        if (matchFn(item, key)) {
          filtered.set(id, item)
        }
      }

      cached.value.set(key, filtered)
      const now = Date.now()
      ownTimestamp.value = now
      globalTimestamp.value = now
      return filtered
    })
  }

  return { invalidate, isCacheValid, cachedGroupBy, cachedFilter, cachedFilterBy }
}
