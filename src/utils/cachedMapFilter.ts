import { ref, computed, type Ref, type ComputedRef } from 'vue'

/**
 * Shared TTL-based cache for filtered Map computeds.
 *
 * Every store (booking, property, ownerData, adminData) duplicates
 * the same cacheTimestamp / isCacheValid / invalidateCache plumbing.
 * This utility extracts that into a single reusable primitive.
 *
 * Usage:
 *   const cache = createMapCache(10_000)                  // 10s TTL
 *   const byStatus = cache.cachedMap(                     // returns ComputedRef<Map>
 *     () => bookings.value,                               // source Map
 *     (booking) => booking.status                          // key extractor
 *   )
 *   cache.invalidate()                                    // bust all cached maps
 */

export interface MapCache {
  /** Invalidate all cached maps managed by this cache instance. */
  invalidate: () => void
  /** Whether the cache is currently within its TTL window. */
  isCacheValid: ComputedRef<boolean>
  /**
   * Create a computed that groups a source Map by a key extractor,
   * returning Map<K, Map<string, V>>. Results are cached until TTL expires
   * or invalidate() is called.
   */
  cachedGroupBy: <V, K extends string>(
    source: () => Map<string, V>,
    keyFn: (item: V) => K
  ) => ComputedRef<Map<K, Map<string, V>>>
  /**
   * Create a computed that filters a source Map by a predicate,
   * returning Map<string, V>. Results are cached until TTL expires
   * or invalidate() is called.
   */
  cachedFilter: <V>(
    source: () => Map<string, V>,
    predicate: (item: V) => boolean
  ) => ComputedRef<Map<string, V>>
  /**
   * Create a computed that filters a source Map by a parameterized key,
   * returning a function (key) => Map<string, V>. Each key's result
   * is individually cached until TTL expires or invalidate() is called.
   */
  cachedFilterBy: <V>(
    source: () => Map<string, V>,
    matchFn: (item: V, key: string) => boolean
  ) => ComputedRef<(key: string) => Map<string, V>>
}

export function createMapCache(ttl: number = 10_000): MapCache {
  const cacheTimestamp = ref(0)
  // Track all cached refs so invalidate() can clear them
  const trackedCaches: Ref<unknown>[] = []
  const trackedParamCaches: Ref<Map<string, unknown>>[] = []

  const isCacheValid = computed(() => {
    return (Date.now() - cacheTimestamp.value) < ttl
  })

  const invalidate = () => {
    cacheTimestamp.value = 0
    for (const cache of trackedCaches) {
      cache.value = null
    }
    for (const cache of trackedParamCaches) {
      (cache.value as Map<string, unknown>).clear()
    }
  }

  const cachedGroupBy = <V, K extends string>(
    source: () => Map<string, V>,
    keyFn: (item: V) => K
  ): ComputedRef<Map<K, Map<string, V>>> => {
    const cached = ref<Map<K, Map<string, V>> | null>(null) as Ref<Map<K, Map<string, V>> | null>
    trackedCaches.push(cached as Ref<unknown>)

    return computed(() => {
      if (isCacheValid.value && cached.value) {
        return cached.value
      }

      const grouped = new Map<K, Map<string, V>>()
      source().forEach((item, id) => {
        const key = keyFn(item)
        if (!grouped.has(key)) {
          grouped.set(key, new Map())
        }
        grouped.get(key)!.set(id, item)
      })

      cached.value = grouped
      cacheTimestamp.value = Date.now()
      return grouped
    })
  }

  const cachedFilter = <V>(
    source: () => Map<string, V>,
    predicate: (item: V) => boolean
  ): ComputedRef<Map<string, V>> => {
    const cached = ref<Map<string, V> | null>(null) as Ref<Map<string, V> | null>
    trackedCaches.push(cached as Ref<unknown>)

    return computed(() => {
      if (isCacheValid.value && cached.value) {
        return cached.value
      }

      const filtered = new Map<string, V>()
      source().forEach((item, id) => {
        if (predicate(item)) {
          filtered.set(id, item)
        }
      })

      cached.value = filtered
      cacheTimestamp.value = Date.now()
      return filtered
    })
  }

  const cachedFilterBy = <V>(
    source: () => Map<string, V>,
    matchFn: (item: V, key: string) => boolean
  ): ComputedRef<(key: string) => Map<string, V>> => {
    const cached = ref(new Map<string, Map<string, V>>()) as Ref<Map<string, Map<string, V>>>
    trackedParamCaches.push(cached as Ref<Map<string, unknown>>)

    return computed(() => (key: string): Map<string, V> => {
      if (isCacheValid.value && cached.value.has(key)) {
        return cached.value.get(key)!
      }

      const filtered = new Map<string, V>()
      source().forEach((item, id) => {
        if (matchFn(item, key)) {
          filtered.set(id, item)
        }
      })

      cached.value.set(key, filtered)
      return filtered
    })
  }

  return { invalidate, isCacheValid, cachedGroupBy, cachedFilter, cachedFilterBy }
}
