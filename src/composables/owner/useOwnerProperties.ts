import type { PricingTier, Property, PropertyFormData } from '@/types'
import { computed, ref } from 'vue'
import { useSupabaseProperties } from '@/composables/supabase/useSupabaseProperties'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'
import { calculatePropertyMetrics, canDeactivateProperty } from '@/utils/businessLogic'

/**
 * Owner-specific property composable
 * Delegates CRUD to useSupabaseProperties; reads from property store.
 *
 * Key Features:
 * - All operations filtered to current owner's properties only
 * - Owner-specific validation and error messages
 * - Automatic owner_id assignment on create operations
 * - Ownership validation on update/delete operations
 * - Owner-specific metrics calculation
 * - Removes admin-only property management functions
 */
export function useOwnerProperties () {
  // Supabase CRUD + stores
  const {
    createProperty: supaCreate,
    updateProperty: supaUpdate,
    deleteProperty: supaDelete,
  } = useSupabaseProperties()
  const authStore = useAuthStore()
  const propertyStore = usePropertyStore()
  const bookingStore = useBookingStore()

  // Owner-specific state
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  // Get current user ID
  const currentUserId = computed(() => authStore.user?.id)

  // COMPUTED PROPERTIES - Owner-scoped data filtering

  /**
   * Get all properties for the current owner only.
   *
   * Delegates to propertyStore.propertiesByOwner — a cachedFilterBy-backed
   * getter with per-key TTL. Same value is read by useOwnerBookings, so
   * both composables share one cached scan instead of doing two parallel
   * O(n) filters. See architecture review #8b/#13.
   */
  const myProperties = computed((): Property[] => {
    if (!currentUserId.value) {
      return []
    }
    return Array.from(propertyStore.propertiesByOwner(currentUserId.value).values())
  })

  /**
   * Get current owner's active properties only
   */
  const myActiveProperties = computed(() => {
    return myProperties.value.filter(property => property.active)
  })

  /**
   * Get current owner's properties by pricing tier
   */
  const myPropertiesByPricingTier = computed(() => {
    const tierGroups: Record<PricingTier, Property[]> = {
      basic: [],
      standard: [],
      premium: [],
      luxury: [],
    }

    for (const property of myProperties.value) {
      tierGroups[property.pricing_tier].push(property)
    }

    return tierGroups
  })

  // LOCAL HELPERS

  /**
   * Calculate property metrics (utilization, revenue, cleaning load)
   */
  function getPropertyMetrics (id: string) {
    const property = propertyStore.getPropertyById(id)
    if (!property) {
      return null
    }
    const propertyBookings = Array.from(bookingStore.bookingsByProperty(id).values())
    return calculatePropertyMetrics(property, propertyBookings)
  }

  /**
   * Get aggregated metrics for all owner's properties
   */
  const myPropertyMetrics = computed(() => {
    if (!currentUserId.value || myProperties.value.length === 0) {
      return {
        totalProperties: 0,
        activeProperties: 0,
        averageUtilization: 0,
        totalRevenue: 0,
        averageCleaningDuration: 0,
        pricingTierDistribution: {
          basic: 0,
          standard: 0,
          premium: 0,
          luxury: 0,
        },
      }
    }

    const totalProperties = myProperties.value.length
    const activeProperties = myActiveProperties.value.length

    let totalUtilization = 0
    let totalRevenue = 0
    let totalCleaningDuration = 0

    for (const property of myProperties.value) {
      const metrics = getPropertyMetrics(property.id)
      if (metrics) {
        totalUtilization += metrics.utilizationRate
        totalRevenue += metrics.revenueProjection
      }
      totalCleaningDuration += property.cleaning_duration
    }

    const averageUtilization = totalProperties > 0 ? totalUtilization / totalProperties : 0
    const averageCleaningDuration = totalProperties > 0 ? totalCleaningDuration / totalProperties : 0

    const pricingTierDistribution = {
      basic: myPropertiesByPricingTier.value.basic.length,
      standard: myPropertiesByPricingTier.value.standard.length,
      premium: myPropertiesByPricingTier.value.premium.length,
      luxury: myPropertiesByPricingTier.value.luxury.length,
    }

    return {
      totalProperties,
      activeProperties,
      averageUtilization,
      totalRevenue,
      averageCleaningDuration,
      pricingTierDistribution,
    }
  })

  // OWNER-SPECIFIC CRUD OPERATIONS

  /**
   * No-op — data loaded by layout via useSupabaseProperties.fetchAndSubscribe()
   */
  async function fetchMyProperties (): Promise<boolean> {
    // Data is loaded by the layout; nothing to do here.
    return true
  }

  /**
   * Create a new property for the current owner
   */
  async function createMyProperty (formData: Omit<PropertyFormData, 'owner_id'>): Promise<string | null> {
    if (!currentUserId.value) {
      error.value = 'Please log in to create properties'
      return null
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const ownerPropertyData: PropertyFormData = {
        ...formData,
        owner_id: currentUserId.value,
      }

      const property = await supaCreate(ownerPropertyData)

      success.value = 'Your property has been created successfully'
      loading.value = false
      return property.id
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Unable to create your property. Please try again.'
      loading.value = false
      return null
    }
  }

  /**
   * Update a property (only if owned by current user)
   */
  async function updateMyProperty (id: string, updates: Partial<Omit<PropertyFormData, 'owner_id'>>): Promise<boolean> {
    if (!currentUserId.value) {
      error.value = 'Please log in to update properties'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const property = propertyStore.getPropertyById(id)
      if (!property) {
        throw new Error('Property not found')
      }
      if (property.owner_id !== currentUserId.value) {
        throw new Error('You can only update your own properties')
      }

      await supaUpdate(id, updates)

      success.value = 'Your property has been updated successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Unable to update your property. Please try again.'
      loading.value = false
      return false
    }
  }

  /**
   * Delete a property (only if owned by current user and no bookings exist)
   */
  async function deleteMyProperty (id: string): Promise<boolean> {
    if (!currentUserId.value) {
      error.value = 'Please log in to delete properties'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const property = propertyStore.getPropertyById(id)
      if (!property) {
        throw new Error('Property not found')
      }
      if (property.owner_id !== currentUserId.value) {
        throw new Error('You can only delete your own properties')
      }

      const propertyBookings = bookingStore.bookingsByProperty(id)
      const activeBookings = Array.from(propertyBookings.values())
        .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
      if (activeBookings.length > 0) {
        throw new Error('Cannot delete property with existing bookings. Please cancel or complete all bookings first.')
      }

      await supaDelete(id)

      success.value = 'Your property has been deleted successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Unable to delete your property. Please try again.'
      loading.value = false
      return false
    }
  }

  /**
   * Toggle property active status (only if owned by current user)
   */
  async function toggleMyPropertyStatus (id: string, active: boolean): Promise<boolean> {
    if (!currentUserId.value) {
      error.value = 'Please log in to manage your properties'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const property = propertyStore.getPropertyById(id)
      if (!property) {
        throw new Error('Property not found')
      }
      if (property.owner_id !== currentUserId.value) {
        throw new Error('You can only manage your own properties')
      }

      if (!active) {
        const check = canDeactivateProperty(id, bookingStore.bookingsByProperty(id).values())
        if (!check.canDeactivate) {
          throw new Error(check.reason!)
        }
      }

      await supaUpdate(id, { active })

      success.value = `Your property has been ${active ? 'activated' : 'deactivated'} successfully`
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : `Unable to ${active ? 'activate' : 'deactivate'} your property. Please try again.`
      loading.value = false
      return false
    }
  }

  /**
   * Get detailed metrics for a specific property (only if owned by current user)
   */
  function getMyPropertyMetrics (id: string) {
    if (!currentUserId.value) {
      return null
    }

    const property = propertyStore.getPropertyById(id)
    if (!property || property.owner_id !== currentUserId.value) {
      return null
    }

    return getPropertyMetrics(id)
  }

  return {
    // State
    loading,
    error,
    success,

    // Computed properties - Owner-scoped data
    myProperties,
    myActiveProperties,
    myPropertiesByPricingTier,
    myPropertyMetrics,

    // CRUD operations - Owner-specific
    fetchMyProperties,
    createMyProperty,
    updateMyProperty,
    deleteMyProperty,
    toggleMyPropertyStatus,

    // Business logic - Owner-specific
    getMyPropertyMetrics,

  }
}
