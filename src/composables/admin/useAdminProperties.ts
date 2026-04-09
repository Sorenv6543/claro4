import type { PricingTier, Property, PropertyFormData } from '@/types/property.ts'
import { computed, ref } from 'vue'
import { useSupabaseProperties } from '@/composables/supabase/useSupabaseProperties'
import { useAuthStore } from '@/stores/auth.ts'
import { useBookingStore } from '@/stores/booking.ts'
import { usePropertyStore } from '@/stores/property.ts'
import { canDeactivateProperty } from '@/utils/businessLogic'

/**
 * Admin-specific property composable
 * Delegates CRUD to useSupabaseProperties; reads from property store.
 *
 * Key Features:
 * - NO filtering - access ALL properties across all owners (key difference from owner version)
 * - Admin-specific analytics and reporting functions
 * - System-wide property management
 * - Bulk operations and advanced filtering
 * - Business insights across all clients
 */
export function useAdminProperties () {
  // Supabase CRUD + stores
  const {
    createProperty: supaCreate,
    updateProperty: supaUpdate,
    deleteProperty: supaDelete,
  } = useSupabaseProperties()
  const authStore = useAuthStore()
  const propertyStore = usePropertyStore()
  const bookingStore = useBookingStore()

  // Admin-specific state
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  // Get current admin user ID
  const currentAdminId = computed(() => authStore.user?.id)

  // COMPUTED PROPERTIES - Admin system-wide data access (NO filtering)

  /**
   * Get ALL properties across all owners (no filtering)
   * This is the key difference from owner version
   */
  const allProperties = computed<Property[]>(() => {
    return Array.from(propertyStore.properties.values())
  })

  /**
   * Get ALL active properties across all owners (no filtering)
   */
  const allActiveProperties = computed(() => {
    return allProperties.value.filter((property: Property) => property.active)
  })

  /**
   * Get ALL inactive properties across all owners (no filtering)
   */
  const allInactiveProperties = computed(() => {
    return allProperties.value.filter((property: Property) => !property.active)
  })

  /**
   * Get properties grouped by owner (admin view of all clients)
   */
  const propertiesByOwner = computed(() => {
    const ownerGroups: Record<string, Property[]> = {}

    for (const property of allProperties.value) {
      if (!ownerGroups[property.owner_id]) {
        ownerGroups[property.owner_id] = []
      }
      ownerGroups[property.owner_id].push(property)
    }

    return ownerGroups
  })

  /**
   * Get properties grouped by pricing tier (system-wide)
   */
  const propertiesByPricingTier = computed(() => {
    const tierGroups: Record<PricingTier, Property[]> = {
      basic: [],
      standard: [],
      premium: [],
      luxury: [],
    }

    for (const property of allProperties.value) {
      tierGroups[property.pricing_tier].push(property)
    }

    return tierGroups
  })

  /**
   * Get properties grouped by active status (system-wide)
   */
  const propertiesByStatus = computed(() => {
    return {
      active: allActiveProperties.value,
      inactive: allInactiveProperties.value,
    }
  })

  // LOCAL HELPERS

  /**
   * Calculate property metrics (utilization, revenue, cleaning load)
   */
  function calculatePropertyMetrics (id: string) {
    const property = propertyStore.getPropertyById(id)
    if (!property) {
      return null
    }

    const propertyBookings = Array.from(bookingStore.bookingsByProperty(id).values())

    // Utilization rate (booked days / 30-day window)
    const totalDays = 30
    const bookedDays = new Set<string>()

    for (const booking of propertyBookings) {
      const checkinDate = new Date(booking.checkin_date)
      const checkoutDate = new Date(booking.checkout_date)
      const currentDate = new Date(checkinDate)
      while (currentDate <= checkoutDate) {
        bookedDays.add(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    const utilizationRate = bookedDays.size / totalDays

    // Turn percentage
    const turnBookings = propertyBookings.filter(b => b.booking_type === 'turn')
    const turnPercentage = propertyBookings.length > 0 ? turnBookings.length / propertyBookings.length : 0

    // Average gap between bookings
    let totalGapDays = 0
    let gapCount = 0
    const sorted = propertyBookings.toSorted((a, b) =>
      new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime(),
    )
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = new Date(sorted[i].checkout_date)
      const nextStart = new Date(sorted[i + 1].checkin_date)
      if (nextStart > currentEnd) {
        totalGapDays += Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24))
        gapCount++
      }
    }
    const averageGapBetweenBookings = gapCount > 0 ? totalGapDays / gapCount : 0

    // Revenue projection
    const revenueMultipliers: Record<PricingTier, number> = { basic: 1, standard: 1.2, premium: 1.5, luxury: 2.5 }
    const baseRevenue = 100
    const projectedBookings = Math.round(utilizationRate * 30)
    const revenueProjection = projectedBookings * baseRevenue * revenueMultipliers[property.pricing_tier]

    // Cleaning load
    const cleaningLoad: 'light' | 'moderate' | 'heavy'
      = utilizationRate < 0.3 ? 'light' : (utilizationRate < 0.7 ? 'moderate' : 'heavy')

    return { utilizationRate, averageGapBetweenBookings, turnPercentage, revenueProjection, cleaningLoad }
  }

  /**
   * Get system-wide property metrics and analytics
   */
  const systemPropertyMetrics = computed(() => {
    const total = allProperties.value.length
    const active = allActiveProperties.value.length
    const inactive = allInactiveProperties.value.length

    // Calculate average cleaning duration across all properties
    const totalDuration = allActiveProperties.value.reduce((sum, prop) => sum + prop.cleaning_duration, 0)
    const averageCleaningDuration = active > 0 ? Math.round(totalDuration / active) : 0

    // Count properties by pricing tier
    const tierCounts = {
      basic: propertiesByPricingTier.value.basic.length,
      standard: propertiesByPricingTier.value.standard.length,
      premium: propertiesByPricingTier.value.premium.length,
      luxury: propertiesByPricingTier.value.luxury.length,
    }

    // Calculate owner distribution
    const ownerCount = Object.keys(propertiesByOwner.value).length
    const averagePropertiesPerOwner = ownerCount > 0 ? Math.round(total / ownerCount) : 0

    return {
      total,
      active,
      inactive,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
      averageCleaningDuration,
      tierCounts,
      ownerCount,
      averagePropertiesPerOwner,
    }
  })

  /**
   * Get property utilization data (booking frequency per property)
   */
  const propertyUtilizationData = computed(() => {
    const utilizationMap: Record<string, {
      property: Property
      totalBookings: number
      turnBookings: number
      standardBookings: number
      utilizationRate: number
      averageGapDays: number
      revenueProjection: number
      cleaningLoad: 'light' | 'moderate' | 'heavy'
    }> = {}

    for (const property of allProperties.value) {
      const metrics = calculatePropertyMetrics(property.id)
      if (!metrics) {
        continue
      }

      const propertyBookingsMap = bookingStore.bookingsByProperty(property.id)
      const propertyBookings = Array.from(propertyBookingsMap.values())

      utilizationMap[property.id] = {
        property,
        totalBookings: propertyBookings.length,
        turnBookings: propertyBookings.filter(b => b.booking_type === 'turn').length,
        standardBookings: propertyBookings.filter(b => b.booking_type === 'standard').length,
        utilizationRate: metrics.utilizationRate,
        averageGapDays: Math.round(metrics.averageGapBetweenBookings),
        revenueProjection: metrics.revenueProjection,
        cleaningLoad: metrics.cleaningLoad,
      }
    }

    return utilizationMap
  })

  // ADMIN-SPECIFIC CRUD OPERATIONS

  /**
   * No-op — data loaded by layout via useSupabaseProperties.fetchAndSubscribe()
   */
  async function fetchAllProperties (): Promise<boolean> {
    // Data is loaded by the layout; nothing to do here.
    return true
  }

  /**
   * Create a property (admin can create for any owner)
   */
  async function createProperty (formData: PropertyFormData): Promise<string | null> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required'
      return null
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const property = await supaCreate(formData)
      success.value = 'Property created successfully'
      loading.value = false
      return property.id
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to create property'
      loading.value = false
      return null
    }
  }

  /**
   * Update a property (admin can update any property)
   */
  async function updateProperty (id: string, updates: Partial<PropertyFormData>): Promise<boolean> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      await supaUpdate(id, updates)
      success.value = 'Property updated successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to update property'
      loading.value = false
      return false
    }
  }

  /**
   * Delete a property (admin soft-delete)
   */
  async function deleteProperty (id: string): Promise<boolean> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      await supaDelete(id)
      success.value = 'Property deleted successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to delete property'
      loading.value = false
      return false
    }
  }

  /**
   * Get properties by specific owner (admin filtering capability)
   */
  function getPropertiesByOwner (ownerId: string): Property[] {
    if (!currentAdminId.value) {
      console.warn('Admin authentication required for owner-specific property access')
      return []
    }

    return allProperties.value.filter(property => property.owner_id === ownerId)
  }

  /**
   * Bulk update multiple properties (admin-only operation)
   */
  async function bulkUpdateProperties (
    propertyIds: string[],
    updates: Partial<PropertyFormData>,
  ): Promise<{ success: string[], failed: string[] }> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required for bulk property operations'
      return { success: [], failed: propertyIds }
    }

    loading.value = true
    error.value = null

    const results = { success: [] as string[], failed: [] as string[] }

    try {
      for (const propertyId of propertyIds) {
        try {
          const property = propertyStore.getPropertyById(propertyId)
          if (!property) {
            results.failed.push(propertyId)
            continue
          }

          // Validate updates if needed
          if (updates.cleaning_duration !== undefined && updates.cleaning_duration !== null && (updates.cleaning_duration as number) < 30) {
            results.failed.push(propertyId)
            continue
          }

          if (updates.pricing_tier && !['basic', 'standard', 'premium', 'luxury'].includes(updates.pricing_tier as string)) {
            results.failed.push(propertyId)
            continue
          }

          await supaUpdate(propertyId, updates)
          results.success.push(propertyId)
        } catch (error_) {
          console.error(`Failed to update property ${propertyId}:`, error_)
          results.failed.push(propertyId)
        }
      }

      const successCount = results.success.length
      const failedCount = results.failed.length

      if (successCount > 0 && failedCount === 0) {
        success.value = `Successfully updated ${successCount} properties`
      } else if (successCount > 0 && failedCount > 0) {
        success.value = `Updated ${successCount} properties, ${failedCount} failed`
      } else {
        error.value = `Failed to update all ${failedCount} properties`
      }

      loading.value = false
      return results
    } catch {
      error.value = 'Bulk property update failed. This may impact multiple clients.'
      loading.value = false
      return { success: [], failed: propertyIds }
    }
  }

  /**
   * Bulk toggle property status (admin-only operation)
   */
  async function bulkTogglePropertyStatus (
    propertyIds: string[],
    active: boolean,
  ): Promise<{ success: string[], failed: string[] }> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required for bulk status operations'
      return { success: [], failed: propertyIds }
    }

    loading.value = true
    error.value = null

    const results = { success: [] as string[], failed: [] as string[] }

    try {
      for (const propertyId of propertyIds) {
        try {
          const property = propertyStore.getPropertyById(propertyId)
          if (!property) {
            results.failed.push(propertyId)
            continue
          }

          // If deactivating, check for upcoming bookings using shared validation
          if (!active) {
            const check = canDeactivateProperty(propertyId, bookingStore.bookings.values())
            if (!check.canDeactivate) {
              results.failed.push(propertyId)
              continue
            }
          }

          await supaUpdate(propertyId, { active })
          results.success.push(propertyId)
        } catch (error_) {
          console.error(`Failed to toggle property ${propertyId}:`, error_)
          results.failed.push(propertyId)
        }
      }

      const successCount = results.success.length
      const failedCount = results.failed.length
      const action = active ? 'activated' : 'deactivated'

      if (successCount > 0 && failedCount === 0) {
        success.value = `Successfully ${action} ${successCount} properties`
      } else if (successCount > 0 && failedCount > 0) {
        success.value = `${action} ${successCount} properties, ${failedCount} failed`
      } else {
        error.value = `Failed to ${action.replace('ed', '')} all ${failedCount} properties`
      }

      loading.value = false
      return results
    } catch {
      error.value = `Bulk property ${active ? 'activation' : 'deactivation'} failed. This may impact client operations.`
      loading.value = false
      return { success: [], failed: propertyIds }
    }
  }

  // ADMIN-SPECIFIC ANALYTICS AND REPORTING

  /**
   * Get comprehensive property analytics (admin-only)
   */
  function getPropertyAnalytics () {
    if (!currentAdminId.value) {
      console.warn('Admin authentication required for property analytics')
      return null
    }

    const metrics = systemPropertyMetrics.value
    const utilization = propertyUtilizationData.value

    // Calculate top performing properties
    const topPerformers = Object.values(utilization)
      .toSorted((a, b) => b.revenueProjection - a.revenueProjection)
      .slice(0, 5)
      .map(data => ({
        property: data.property,
        revenueProjection: data.revenueProjection,
        utilizationRate: data.utilizationRate,
        totalBookings: data.totalBookings,
      }))

    // Calculate underperforming properties
    const underPerformers = Object.values(utilization)
      .filter(data => data.utilizationRate < 0.3)
      .toSorted((a, b) => a.utilizationRate - b.utilizationRate)
      .slice(0, 5)
      .map(data => ({
        property: data.property,
        utilizationRate: data.utilizationRate,
        totalBookings: data.totalBookings,
        averageGapDays: data.averageGapDays,
      }))

    // Calculate cleaning load distribution
    const cleaningLoadDistribution = {
      light: Object.values(utilization).filter(d => d.cleaningLoad === 'light').length,
      moderate: Object.values(utilization).filter(d => d.cleaningLoad === 'moderate').length,
      heavy: Object.values(utilization).filter(d => d.cleaningLoad === 'heavy').length,
    }

    // Calculate revenue projections by tier
    const revenueByTier = {
      basic: Object.values(utilization)
        .filter(d => d.property.pricing_tier === 'basic')
        .reduce((sum, d) => sum + d.revenueProjection, 0),
      standard: Object.values(utilization)
        .filter(d => d.property.pricing_tier === 'standard')
        .reduce((sum, d) => sum + d.revenueProjection, 0),
      premium: Object.values(utilization)
        .filter(d => d.property.pricing_tier === 'premium')
        .reduce((sum, d) => sum + d.revenueProjection, 0),
      luxury: Object.values(utilization)
        .filter(d => d.property.pricing_tier === 'luxury')
        .reduce((sum, d) => sum + d.revenueProjection, 0),
    }

    return {
      systemMetrics: metrics,
      topPerformers,
      underPerformers,
      cleaningLoadDistribution,
      revenueByTier,
      totalProjectedRevenue: Object.values(revenueByTier).reduce((sum, revenue) => sum + revenue, 0),
    }
  }

  /**
   * Get property utilization report (admin-only)
   */
  function getPropertyUtilization () {
    if (!currentAdminId.value) {
      console.warn('Admin authentication required for utilization reports')
      return null
    }

    return propertyUtilizationData.value
  }

  /**
   * Get owner performance report (admin-only)
   */
  function getOwnerPerformanceReport () {
    if (!currentAdminId.value) {
      console.warn('Admin authentication required for owner performance reports')
      return null
    }

    const ownerPerformance: Record<string, {
      ownerId: string
      propertyCount: number
      activePropertyCount: number
      totalBookings: number
      totalRevenue: number
      averageUtilization: number
      topProperty: Property | null
    }> = {}

    for (const [ownerId, properties] of Object.entries(propertiesByOwner.value)) {
      const activeProperties = properties.filter(p => p.active)

      let totalBookings = 0
      let totalRevenue = 0
      let totalUtilization = 0
      let topProperty: Property | null = null
      let topPropertyRevenue = 0

      for (const property of properties) {
        const utilData = propertyUtilizationData.value[property.id]
        if (utilData) {
          totalBookings += utilData.totalBookings
          totalRevenue += utilData.revenueProjection
          totalUtilization += utilData.utilizationRate

          if (utilData.revenueProjection > topPropertyRevenue) {
            topPropertyRevenue = utilData.revenueProjection
            topProperty = property
          }
        }
      }

      ownerPerformance[ownerId] = {
        ownerId,
        propertyCount: properties.length,
        activePropertyCount: activeProperties.length,
        totalBookings,
        totalRevenue,
        averageUtilization: properties.length > 0 ? totalUtilization / properties.length : 0,
        topProperty,
      }
    }

    return ownerPerformance
  }

  /**
   * Advanced property filtering (admin-only)
   */
  function filterProperties (criteria: {
    active?: boolean
    pricingTier?: PricingTier[]
    ownerId?: string
    minCleaningDuration?: number
    maxCleaningDuration?: number
    utilizationRange?: { min: number, max: number }
    cleaningLoad?: ('light' | 'moderate' | 'heavy')[]
    hasBookings?: boolean
  }) {
    if (!currentAdminId.value) {
      console.warn('Admin authentication required for advanced property filtering')
      return []
    }

    let filtered = allProperties.value

    // Filter by active status
    if (criteria.active !== undefined) {
      filtered = filtered.filter((property: Property) => property.active === criteria.active)
    }

    // Filter by pricing tier
    if (criteria.pricingTier && criteria.pricingTier.length > 0) {
      filtered = filtered.filter((property: Property) => criteria.pricingTier!.includes(property.pricing_tier))
    }

    // Filter by owner
    if (criteria.ownerId) {
      const ownerId = criteria.ownerId
      filtered = filtered.filter((property: Property) => propertiesByOwner.value[ownerId]?.includes(property))
    }

    // Filter by cleaning duration range
    if (criteria.minCleaningDuration !== undefined) {
      filtered = filtered.filter((property: Property) => property.cleaning_duration >= criteria.minCleaningDuration!)
    }

    if (criteria.maxCleaningDuration !== undefined) {
      filtered = filtered.filter((property: Property) => property.cleaning_duration <= criteria.maxCleaningDuration!)
    }

    // Filter by utilization range
    if (criteria.utilizationRange) {
      filtered = filtered.filter((property: Property) => {
        const utilData = propertyUtilizationData.value[property.id]
        if (!utilData) {
          return false
        }

        return utilData.utilizationRate >= criteria.utilizationRange!.min
          && utilData.utilizationRate <= criteria.utilizationRange!.max
      })
    }

    // Filter by cleaning load
    if (criteria.cleaningLoad && criteria.cleaningLoad.length > 0) {
      filtered = filtered.filter((property: Property) => {
        const utilData = propertyUtilizationData.value[property.id]
        return utilData && criteria.cleaningLoad!.includes(utilData.cleaningLoad)
      })
    }

    // Filter by booking existence
    if (criteria.hasBookings !== undefined) {
      filtered = filtered.filter((property: Property) => {
        const utilData = propertyUtilizationData.value[property.id]
        const hasBookings = utilData && utilData.totalBookings > 0
        return criteria.hasBookings ? hasBookings : !hasBookings
      })
    }

    return filtered
  }

  return {
    // Admin-specific state
    loading,
    error,
    success,

    // Admin system-wide computed properties (NO filtering)
    allProperties,
    allActiveProperties,
    allInactiveProperties,
    propertiesByOwner,
    propertiesByPricingTier,
    propertiesByStatus,
    systemPropertyMetrics,
    propertyUtilizationData,

    // Admin-specific CRUD operations
    createProperty,
    updateProperty,
    deleteProperty,
    fetchAllProperties,
    getPropertiesByOwner,
    bulkUpdateProperties,
    bulkTogglePropertyStatus,

    // Admin-specific analytics and reporting
    getPropertyAnalytics,
    getPropertyUtilization,
    getOwnerPerformanceReport,
    filterProperties,
  }
}
