import { ref, computed, type ComputedRef } from 'vue';

const CACHE_TTL = 10000; // 10 seconds, matching store TTL

/**
 * Creates a computed property with TTL caching.
 * Always runs the getter so Vue tracks reactive dependencies correctly,
 * but returns the cached result when within the TTL window.
 */
export function useCachedComputed<T>(getter: () => T): ComputedRef<T> {
  const cachedValue = ref<T | undefined>(undefined) as { value: T | undefined };
  const cacheTimestamp = ref(0);

  return computed(() => {
    // Always call getter to maintain Vue's dependency tracking.
    // Without this, Vue stops re-evaluating when upstream refs change.
    const newValue = getter();
    const now = Date.now();

    if (cachedValue.value !== undefined && (now - cacheTimestamp.value) < CACHE_TTL) {
      return cachedValue.value;
    }

    cachedValue.value = newValue;
    cacheTimestamp.value = now;
    return newValue;
  });
}
