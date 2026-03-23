import type { PricingTier, Property, PropertyFormData } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'

/**
 * Composable for property management
 * Provides CRUD operations and validation for properties
 */
export function useProperties () {
  const propertyStore = usePropertyStore()
  const bookingStore = useBookingStore()

  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  /**
   * Create a new property
   */
  async function createProperty (formData: PropertyFormData): Promise<string | null> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Validate required fields
      if (!formData.address_street || !formData.address_city || !formData.address_state || !formData.address_zip) {
        throw new Error('Street, city, state, and ZIP are required')
      }

      // Validate cleaning duration
      if (!formData.cleaning_duration || (formData.cleaning_duration as number) < 30) {
        throw new Error('Cleaning duration must be at least 30 minutes')
      }

      // Validate pricing tier
      if (!['basic', 'standard', 'premium', 'luxury'].includes(formData.pricing_tier as string)) {
        throw new Error('Invalid pricing tier')
      }

      // Create property object
      const newProperty: Property = {
        id: uuidv4(),
        ...formData,
        active: formData.active === undefined ? true : (formData.active as boolean),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Property

      // Add to store (calls Supabase with optimistic update + rollback)
      await propertyStore.addProperty(newProperty)

      success.value = 'Property created successfully'
      loading.value = false
      return newProperty.id
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to create property'
      loading.value = false
      return null
    }
  }

  /**
   * Update an existing property
   */
  async function updateProperty (id: string, updates: Partial<PropertyFormData>): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Check if property exists
      const property = propertyStore.getPropertyById(id)
      if (!property) {
        throw new Error('Property not found')
      }

      // Validate cleaning duration if changed
      if (updates.cleaning_duration !== undefined && updates.cleaning_duration !== null && (updates.cleaning_duration as number) < 30) {
        throw new Error('Cleaning duration must be at least 30 minutes')
      }

      // Validate pricing tier if changed
      if (updates.pricing_tier && !['basic', 'standard', 'premium', 'luxury'].includes(updates.pricing_tier as string)) {
        throw new Error('Invalid pricing tier')
      }

      // Update property in store (calls Supabase with optimistic update + rollback)
      await propertyStore.updateProperty(id, updates)

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
   * Delete a property
   */
  async function deleteProperty (id: string): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Check if property exists
      const property = propertyStore.getPropertyById(id)
      if (!property) {
        throw new Error('Property not found')
      }

      // Check if property has bookings
      const propertyBookings = bookingStore.bookingsByProperty(id)
      if (propertyBookings.size > 0) {
        throw new Error('Cannot delete property with existing bookings')
      }

      // Remove from store (calls Supabase with optimistic update + rollback)
      await propertyStore.removeProperty(id)

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
   * Toggle property active status
   */
  async function togglePropertyStatus (id: string, active: boolean): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Check if property exists
      const property = propertyStore.getPropertyById(id)
      if (!property) {
        throw new Error('Property not found')
      }

      // If deactivating, check for upcoming bookings
      if (!active) {
        const now = new Date()
        const upcomingBookings = Array.from(bookingStore.bookingsByProperty(id).values()).filter(booking => {
          const checkinDate = new Date(booking.checkin_date)
          return checkinDate > now && ['pending', 'scheduled'].includes(booking.status)
        })

        if (upcomingBookings.length > 0) {
          throw new Error('Cannot deactivate property with upcoming bookings')
        }
      }

      // Update property status (calls Supabase with optimistic update + rollback)
      await propertyStore.updateProperty(id, { active })

      success.value = `Property ${active ? 'activated' : 'deactivated'} successfully`
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : `Failed to ${active ? 'activate' : 'deactivate'} property`
      loading.value = false
      return false
    }
  }

  /**
   * Calculate property metrics
   */
  function calculatePropertyMetrics (id: string) {
    const property = propertyStore.getPropertyById(id)
    if (!property) {
      return null
    }

    // Get all bookings for this property
    const propertyBookingsMap = bookingStore.bookingsByProperty(id)
    const propertyBookings = Array.from(propertyBookingsMap.values())

    // Calculate utilization rate (booked days / total days)
    const totalDays = 30 // Assuming last 30 days
    const bookedDays = new Set()

    for (const booking of propertyBookings) {
      const checkinDate = new Date(booking.checkin_date)
      const checkoutDate = new Date(booking.checkout_date)

      // Count days of guest stay from checkin to checkout
      const currentDate = new Date(checkinDate)
      while (currentDate <= checkoutDate) {
        bookedDays.add(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    const utilizationRate = bookedDays.size / totalDays

    // Calculate turn percentage
    const turnBookings = propertyBookings.filter(booking => booking.booking_type === 'turn')
    const turnPercentage = propertyBookings.length > 0 ? turnBookings.length / propertyBookings.length : 0

    // Calculate average gap between bookings
    let totalGapDays = 0
    let gapCount = 0

    // Sort bookings by checkin date (chronological order of arrivals)
    const sortedBookings = propertyBookings.toSorted((a, b) => {
      return new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime()
    })

    // Calculate gaps between consecutive bookings
    for (let i = 0; i < sortedBookings.length - 1; i++) {
      const currentEnd = new Date(sortedBookings[i].checkout_date)
      const nextStart = new Date(sortedBookings[i + 1].checkin_date)

      if (nextStart > currentEnd) {
        const gapDays = Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24))
        totalGapDays += gapDays
        gapCount++
      }
    }

    const averageGapBetweenBookings = gapCount > 0 ? totalGapDays / gapCount : 0

    // Calculate revenue projection based on pricing tier
    const revenueMultipliers: Record<PricingTier, number> = {
      basic: 1,
      standard: 1.2,
      premium: 1.5,
      luxury: 2.5,
    }

    const baseRevenue = 100 // Base revenue per booking
    const projectedBookings = Math.round(utilizationRate * 30) // Projected bookings for next month
    const revenueProjection = projectedBookings * baseRevenue * revenueMultipliers[property.pricing_tier]

    // Determine cleaning load
    let cleaningLoad: 'light' | 'moderate' | 'heavy'

    if (utilizationRate < 0.3) {
      cleaningLoad = 'light'
    } else if (utilizationRate < 0.7) {
      cleaningLoad = 'moderate'
    } else {
      cleaningLoad = 'heavy'
    }

    return {
      utilizationRate,
      averageGapBetweenBookings,
      turnPercentage,
      revenueProjection,
      cleaningLoad,
    }
  }

  /**
   * Fetch all properties
   */
  async function fetchAllProperties (): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await propertyStore.fetchProperties()
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to fetch properties'
      loading.value = false
      return false
    }
  }

  return {
    // State
    loading,
    error,
    success,

    // Store access
    properties: computed(() => propertyStore.propertiesArray),
    activeProperties: computed(() => propertyStore.activeProperties),
    getPropertyById: computed(() => propertyStore.getPropertyById),
    propertiesByPricingTier: computed(() => propertyStore.propertiesByPricingTier),
    propertiesByOwner: computed(() => propertyStore.propertiesByOwner),

    // CRUD operations
    createProperty,
    updateProperty,
    deleteProperty,
    togglePropertyStatus,
    fetchAllProperties,

    // Business logic
    calculatePropertyMetrics,
  }
}
