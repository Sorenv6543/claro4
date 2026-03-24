import type { Booking } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'
import { addOwnerBookings, setOwnerUser } from '../../utils/test-utils'

describe('useOwnerBookings (Role-Based)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should filter bookings to only show owner data', () => {
    const bookingStore = useBookingStore()
    const authStore = useAuthStore()
    expect(authStore).toBeDefined()
    if (!authStore) {
      throw new Error('authStore is null or undefined')
    }
    setOwnerUser(authStore, 'owner1')
    addOwnerBookings(bookingStore, 'owner1', 1)
    // Add a booking for another owner
    addOwnerBookings(bookingStore, 'owner2', 1)
    const { myBookings } = useOwnerBookings()
    expect(myBookings.value).toHaveLength(1)
    expect(myBookings.value[0].owner_id).toBe('owner1')
  })

  it('should identify turn bookings for urgent alerts', () => {
    const bookingStore = useBookingStore()
    const authStore = useAuthStore()

    // Set up owner user
    setOwnerUser(authStore, 'owner1')

    // Add turn and standard bookings
    const turnBooking: Booking = {
      id: 'turn1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: '2023-06-01T11:00:00Z',
      checkin_date: '2023-06-01T15:00:00Z',
      booking_type: 'turn',
      status: 'pending',
    }

    const standardBooking: Booking = {
      id: 'standard1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: '2023-06-02T11:00:00Z',
      checkin_date: '2023-06-04T15:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    bookingStore.setBooking(turnBooking.id, turnBooking)
    bookingStore.setBooking(standardBooking.id, standardBooking)

    const { myTurnBookings, myStandardBookings } = useOwnerBookings()

    // Should correctly separate turn vs standard bookings
    expect(myTurnBookings.value).toHaveLength(1)
    expect(myTurnBookings.value[0].booking_type).toBe('turn')
    expect(myStandardBookings.value).toHaveLength(1)
    expect(myStandardBookings.value[0].booking_type).toBe('standard')
  })

  it('should handle role-based booking creation', async () => {
    const authStore = useAuthStore()

    // Set up owner user
    setOwnerUser(authStore, 'owner1')

    const { createMyBooking } = useOwnerBookings()

    // createMyBooking requires a property that belongs to the owner in the property store
    const propertyStore = usePropertyStore()
    propertyStore.addProperty({
      id: 'prop1',
      owner_id: 'owner1',
      name: 'Owner House',
      address: '123 Owner St',
      cleaning_duration: 120,
      pricing_tier: 'standard',
      active: true,
      color: '#5c6bc0',
    })

    const newBookingData = {
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: '2023-06-01T11:00:00Z',
      checkin_date: '2023-06-03T15:00:00Z',
      booking_type: 'standard' as const,
      status: 'pending' as const,
    }

    // createMyBooking returns string | null (the booking id)
    const result = await createMyBooking(newBookingData)

    // Should return a booking ID on success
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('should enforce owner-only data access', () => {
    const bookingStore = useBookingStore()
    const authStore = useAuthStore()

    // Set up owner user
    setOwnerUser(authStore, 'owner1')

    // Add multiple bookings from different owners
    for (let i = 1; i <= 10; i++) {
      const id = `booking${i}`
      bookingStore.setBooking(id, {
        id,
        property_id: `prop${i}`,
        owner_id: i <= 3 ? 'owner1' : 'other_owner',
        checkout_date: '2023-06-01T11:00:00Z',
        checkin_date: '2023-06-03T15:00:00Z',
        booking_type: 'standard',
        status: 'pending',
      })
    }

    const { myBookings } = useOwnerBookings()

    // Should only return bookings for owner1 (3 out of 10)
    expect(myBookings.value).toHaveLength(3)
    for (const booking of myBookings.value) {
      expect(booking.owner_id).toBe('owner1')
    }
  })

  it('should provide today bookings for owner dashboard', () => {
    const bookingStore = useBookingStore()
    const authStore = useAuthStore()

    // Set up owner user
    setOwnerUser(authStore, 'owner1')

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Add today's booking
    const todayBooking: Booking = {
      id: 'today1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: `${today}T11:00:00Z`,
      checkin_date: `${today}T15:00:00Z`,
      booking_type: 'turn',
      status: 'pending',
    }

    // Add tomorrow's booking
    const tomorrowBooking: Booking = {
      id: 'tomorrow1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: `${tomorrow}T11:00:00Z`,
      checkin_date: `${tomorrow}T15:00:00Z`,
      booking_type: 'standard',
      status: 'pending',
    }

    bookingStore.setBooking(todayBooking.id, todayBooking)
    bookingStore.setBooking(tomorrowBooking.id, tomorrowBooking)

    const { myTodayBookings } = useOwnerBookings()

    // Should only return today's bookings
    expect(myTodayBookings.value).toHaveLength(1)
    expect(myTodayBookings.value[0].id).toBe('today1')
  })

  it('should handle permissions correctly for owners', () => {
    const bookingStore = useBookingStore()
    const authStore = useAuthStore()

    // Set up owner user
    setOwnerUser(authStore, 'owner1')

    // Add bookings - owner's booking and other owner's booking
    const ownerBooking: Booking = {
      id: 'booking_owner1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: '2023-06-01T11:00:00Z',
      checkin_date: '2023-06-03T15:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    const otherOwnerBooking: Booking = {
      id: 'booking_other',
      property_id: 'prop2',
      owner_id: 'other_owner',
      checkout_date: '2023-06-01T11:00:00Z',
      checkin_date: '2023-06-03T15:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    bookingStore.setBooking(ownerBooking.id, ownerBooking)
    bookingStore.setBooking(otherOwnerBooking.id, otherOwnerBooking)

    const { canEditBooking, canDeleteBooking } = useOwnerBookings()

    // Owner can edit/delete their own bookings
    expect(canEditBooking('booking_owner1')).toBe(true)
    expect(canDeleteBooking('booking_owner1')).toBe(true)

    // Owner cannot edit/delete other owner's bookings
    expect(canEditBooking('booking_other')).toBe(false)
    expect(canDeleteBooking('booking_other')).toBe(false)
  })
})
