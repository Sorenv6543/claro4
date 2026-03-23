import type { PricingTier, Property, PropertyMap } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import supabase from '@/plugins/supabase'
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

  // --- Supabase RLS Policy ---
  // Owners can insert/select their own properties. See supabase/migrations/002_rls_policies.sql for details.

  // Actions
  async function fetchProperties () {
    loading.value = true
    error.value = null

    try {
      const { data, error: supaError } = await supabase.from('properties').select('*')
      if (supaError) {
        throw supaError
      }
      properties.value.clear()
      if (data) {
        for (const prop of data) {
          properties.value.set(prop.id, prop)
        }
      }
    } catch (error_: unknown) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to fetch properties.'
      console.error('fetchProperties error:', error_)
    } finally {
      loading.value = false
      invalidateCache() // Invalidate cache after fetch
    }
  }

  async function addProperty (property: Property) {
    // Optimistic update
    properties.value.set(property.id, property)
    error.value = null

    try {
      const { error: supaError } = await supabase.from('properties').insert([property])
      if (supaError) {
        throw supaError
      }
      invalidateCache() // Invalidate cache after successful insert
    } catch (error_: unknown) {
      properties.value.delete(property.id)
      error.value = error_ instanceof Error ? error_.message : 'Failed to add property.'
      console.error('addProperty error:', error_)
      throw error_
    }
  }

  async function updateProperty (id: string, updates: Partial<Property>) {
    const existing = properties.value.get(id)
    if (!existing) {
      error.value = 'Property not found'
      throw new Error('Property not found')
    }

    // Optimistic update
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    properties.value.set(id, updated)
    error.value = null

    try {
      const { error: supaError } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)

      if (supaError) {
        throw supaError
      }
      invalidateCache() // Invalidate cache after successful update
    } catch (error_: unknown) {
      // Rollback on error
      properties.value.set(id, existing)
      error.value = error_ instanceof Error ? error_.message : 'Failed to update property.'
      console.error('updateProperty error:', error_)
      throw error_
    }
  }

  async function removeProperty (id: string) {
    const existing = properties.value.get(id)
    if (!existing) {
      error.value = 'Property not found'
      throw new Error('Property not found')
    }

    // Optimistic update (soft delete by setting active = false)
    const deactivated = { ...existing, active: false, updated_at: new Date().toISOString() }
    properties.value.set(id, deactivated)
    error.value = null

    try {
      const { error: supaError } = await supabase
        .from('properties')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (supaError) {
        throw supaError
      }

      // Remove from local state after successful soft delete
      properties.value.delete(id)
      invalidateCache() // Invalidate cache after successful delete
    } catch (error_: unknown) {
      // Rollback on error
      properties.value.set(id, existing)
      error.value = error_ instanceof Error ? error_.message : 'Failed to remove property.'
      console.error('removeProperty error:', error_)
      throw error_
    }
  }

  function setPropertyActiveStatus (id: string, active: boolean) {
    updateProperty(id, { active })
  }

  function clearAll () {
    properties.value.clear()
    invalidateCache() // Invalidate cache when data changes
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

    // Actions
    fetchProperties,
    addProperty,
    updateProperty,
    removeProperty,
    setPropertyActiveStatus,
    clearAll,

    // Cache management
    invalidateCache,
  }
})
