import type { Booking, BookingMap, BookingStatus, BookingType } from '@/types/booking.ts'
// EVENTS/BOOKING STORE - Pure reactive state container (no Supabase)
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  filterBookingsByDateRange,
  getUpcomingBookings,
  getUrgentTurns,
} from '@/utils/businessLogic.ts'
import { createMapCache } from '@/utils/cachedMapFilter.ts'

// Uses Map collections for efficient booking access and management
export const useBookingStore = defineStore('booking', () => {
  // State
  const bookings = ref<BookingMap>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Shared TTL cache for all filtered Maps
  const cache = createMapCache(10_000)
  const invalidateCache = cache.invalidate

  // GET EVENTS/BOOKINGS BY FILTER FUNCTIONS - Optimized Map-based filtering
  const bookingsArray = computed((): Booking[] => {
    return Array.from(bookings.value.values())
  })

  const getBookingById = computed(() => (id: string): Booking | undefined => {
    return bookings.value.get(id)
  })

  // Map-based status filtering with caching
  const bookingsByStatusMap = cache.cachedGroupBy<Booking, BookingStatus>(
    () => bookings.value,
    booking => booking.status,
  )

  // Map-based type filtering with caching
  const bookingsByTypeMap = cache.cachedGroupBy<Booking, BookingType>(
    () => bookings.value,
    booking => booking.booking_type,
  )

  // Efficient getter functions that return Maps
  const bookingsByStatus = computed(() => (status: BookingStatus): Map<string, Booking> => {
    return bookingsByStatusMap.value.get(status) || new Map()
  })

  const bookingsByType = computed(() => (type: BookingType): Map<string, Booking> => {
    return bookingsByTypeMap.value.get(type) || new Map()
  })

  const bookingsByProperty = cache.cachedFilterBy<Booking>(
    () => bookings.value,
    (booking, propertyId) => booking.property_id === propertyId,
  )

  const bookingsByOwner = cache.cachedFilterBy<Booking>(
    () => bookings.value,
    (booking, ownerId) => booking.owner_id === ownerId,
  )

  // Use business logic utilities for complex filtering
  const bookingsByDateRange = computed(() => (startDate: string, endDate: string): Map<string, Booking> => {
    return filterBookingsByDateRange(bookings.value, startDate, endDate)
  })

  // Optimized pre-computed common filters using business logic
  const pendingBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByStatus.value('pending')
  })

  const scheduledBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByStatus.value('scheduled')
  })

  const turnBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByType.value('turn')
  })

  const standardBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByType.value('standard')
  })

  const upcomingBookingsMap = computed((): Map<string, Booking> => {
    return getUpcomingBookings(bookings.value)
  })

  const urgentTurnsMap = computed((): Map<string, Booking> => {
    return getUrgentTurns(bookings.value)
  })

  // Array getters ONLY for components that need arrays
  const pendingBookings = computed((): Booking[] => {
    return Array.from(pendingBookingsMap.value.values())
  })

  const scheduledBookings = computed((): Booking[] => {
    return Array.from(scheduledBookingsMap.value.values())
  })

  const turnBookings = computed((): Booking[] => {
    return Array.from(turnBookingsMap.value.values())
  })

  const standardBookings = computed((): Booking[] => {
    return Array.from(standardBookingsMap.value.values())
  })

  // ACTIONS - Synchronous state mutations (Supabase interaction handled by composables)

  function setBookings (data: Booking[]) {
    bookings.value = new Map(data.map(b => [b.id, b]))
    invalidateCache()
  }

  function setBooking (id: string, booking: Booking) {
    bookings.value.set(id, booking)
    invalidateCache()
  }

  function removeBooking (id: string) {
    bookings.value.delete(id)
    invalidateCache()
  }

  function clearAll () {
    bookings.value.clear()
    invalidateCache()
  }

  return {
    // State
    bookings,
    loading,
    error,

    // Map getters (primary - for O(1) operations)
    bookingsByStatusMap,
    bookingsByTypeMap,
    pendingBookingsMap,
    scheduledBookingsMap,
    turnBookingsMap,
    standardBookingsMap,
    upcomingBookingsMap,
    urgentTurnsMap,

    // Parameterized Map getters
    getBookingById,
    bookingsByStatus,
    bookingsByType,
    bookingsByProperty,
    bookingsByOwner,
    bookingsByDateRange,

    // Array getters (secondary - only when UI needs arrays)
    bookingsArray,
    pendingBookings,
    scheduledBookings,
    turnBookings,
    standardBookings,

    // Actions
    setBookings,
    setBooking,
    removeBooking,
    clearAll,

    // Cache management
    invalidateCache,
  }
})
