import type { PricingTier, Property, PropertyMap } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createMapCache } from '@/utils/cachedMapFilter'

/**
 * Property store for the Property Cleaning Scheduler
 * Uses Map collections for efficient property access and management
 */
export const usePropertyStore = defineStore('property', () => {
  // State
  const properties = ref<PropertyMap>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Shared TTL cache for all filtered Maps
  const cache = createMapCache(10_000)
  const invalidateCache = cache.invalidate

  // Getters - Map-based with caching
  const propertiesArray = computed((): Property[] => {
    return Array.from(properties.value.values())
  })

  // Cached active properties Map
  const activePropertiesMap = cache.cachedFilter<Property>(
    () => properties.value,
    property => property.active,
  )

  // Array getter for active properties (when components need arrays)
  const activeProperties = computed((): Property[] => {
    return Array.from(activePropertiesMap.value.values())
  })

  const getPropertyById = computed(() => (id: string): Property | undefined => {
    return properties.value.get(id)
  })

  // Map-based pricing tier filtering with caching
  const propertiesByPricingTierMap = cache.cachedGroupBy<Property, PricingTier>(
    () => properties.value,
    property => property.pricing_tier,
  )

  // Efficient getter function that returns Map
  const propertiesByPricingTier = computed(() => (tier: PricingTier): Map<string, Property> => {
    return propertiesByPricingTierMap.value.get(tier) || new Map()
  })

  // Map-based owner filtering with caching
  const propertiesByOwner = cache.cachedFilterBy<Property>(
    () => properties.value,
    (property, ownerId) => property.owner_id === ownerId,
  )

  // Optimized status counting using Map iteration
  const propertiesByActiveStatus = computed(() => {
    const active = activePropertiesMap.value.size
    const total = properties.value.size

    return {
      active,
      inactive: total - active,
    }
  })

  const averageCleaningDuration = computed((): number => {
    let total = 0
    let count = 0

    for (const property of activePropertiesMap.value.values()) {
      total += property.cleaning_duration
      count++
    }

    return count > 0 ? total / count : 0
  })

  // Synchronous mutations (Supabase I/O handled by composables)
  function setProperties (data: Property[]) {
    properties.value = new Map(data.map(p => [p.id, p]))
    invalidateCache()
  }

  function setProperty (id: string, property: Property) {
    properties.value.set(id, property)
    invalidateCache()
  }

  function removeProperty (id: string) {
    properties.value.delete(id)
    invalidateCache()
  }

  function clearAll () {
    properties.value.clear()
    invalidateCache()
  }

  return {
    // State
    properties,
    loading,
    error,

    // Map getters (primary - for O(1) operations)
    activePropertiesMap,
    propertiesByPricingTierMap,

    // Parameterized Map getters
    getPropertyById,
    propertiesByPricingTier,
    propertiesByOwner,

    // Array getters (secondary - only when UI needs arrays)
    propertiesArray,
    activeProperties,

    // Computed metrics
    propertiesByActiveStatus,
    averageCleaningDuration,

    // Mutations
    setProperties,
    setProperty,
    removeProperty,
    clearAll,

    // Cache management
    invalidateCache,
  }
})
