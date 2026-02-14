import { ref, computed, type ComputedRef } from 'vue';

const CACHE_TTL = 10000; // 10 seconds, matching store TTL

/**
 * Creates a computed property with TTL caching.
 * Returns cached value if within TTL window, even if dependencies changed.
 * Follows the same 10-second TTL pattern used in Pinia stores.
 */
export function useCachedComputed<T>(getter: () => T): ComputedRef<T> {
  const cachedValue = ref<T | undefined>(undefined) as { value: T | undefined };
  const cacheTimestamp = ref(0);

  return computed(() => {
    const now = Date.now();
    if (cachedValue.value !== undefined && (now - cacheTimestamp.value) < CACHE_TTL) {
      return cachedValue.value;
    }

    const newValue = getter();
    cachedValue.value = newValue;
    cacheTimestamp.value = now;
    return newValue;
  });
}
