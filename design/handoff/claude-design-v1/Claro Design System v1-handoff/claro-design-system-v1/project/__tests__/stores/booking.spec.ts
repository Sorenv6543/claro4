import type { Booking } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBookingStore } from '@/stores/booking'

describe('Booking Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and set it as active for testing
    setActivePinia(createPinia())
  })

  it('should start with empty bookings collection', () => {
    const store = useBookingStore()
    expect(store.bookings.size).toBe(0)
    expect(store.bookingsArray.length).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should add bookings to the Map', () => {
    const store = useBookingStore()
    const booking: Booking = {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    store.setBooking(booking.id, booking)
    expect(store.bookings.size).toBe(1)
    expect(store.bookings.get('booking1')).toEqual(booking)
    expect(store.bookingsArray.length).toBe(1)
  })

  it('should update bookings in the Map', () => {
    const store = useBookingStore()
    const booking: Booking = {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    store.setBooking(booking.id, booking)
    const existing = store.bookings.get('booking1')!
    store.setBooking('booking1', {
      ...existing,
      status: 'scheduled',
      notes: 'Updated booking',
    })

    const updated = store.bookings.get('booking1')
    expect(updated?.status).toBe('scheduled')
    expect(updated?.notes).toBe('Updated booking')
  })

  it('should remove bookings from the Map', () => {
    const store = useBookingStore()
    const booking: Booking = {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    store.setBooking(booking.id, booking)
    expect(store.bookings.size).toBe(1)

    store.removeBooking('booking1')
    expect(store.bookings.size).toBe(0)
    expect(store.bookings.get('booking1')).toBeUndefined()
  })

  it('should filter bookings by status', () => {
    const store = useBookingStore()

    store.setBooking('booking1', {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    store.setBooking('booking2', {
      id: 'booking2',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-05T15:00:00Z',
      checkout_date: '2023-06-07T11:00:00Z',
      booking_type: 'standard',
      status: 'scheduled',
    })

    expect(store.bookings.size).toBe(2)
    expect(store.bookingsByStatus('pending').size).toBe(1)
    expect(store.bookingsByStatus('scheduled').size).toBe(1)
    expect(store.pendingBookings.length).toBe(1)
    expect(store.scheduledBookings.length).toBe(1)
  })

  it('should filter bookings by type', () => {
    const store = useBookingStore()

    store.setBooking('booking1', {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    store.setBooking('booking2', {
      id: 'booking2',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-05T11:00:00Z',
      checkout_date: '2023-06-05T15:00:00Z',
      booking_type: 'turn',
      status: 'pending',
    })

    expect(store.bookings.size).toBe(2)
    expect(store.bookingsByType('standard').size).toBe(1)
    expect(store.bookingsByType('turn').size).toBe(1)
    expect(store.standardBookings.length).toBe(1)
    expect(store.turnBookings.length).toBe(1)
  })

  it('should filter bookings by property', () => {
    const store = useBookingStore()

    store.setBooking('booking1', {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    store.setBooking('booking2', {
      id: 'booking2',
      property_id: 'prop2',
      owner_id: 'owner1',
      checkin_date: '2023-06-05T15:00:00Z',
      checkout_date: '2023-06-07T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    expect(store.bookingsByProperty('prop1').size).toBe(1)
    expect(store.bookingsByProperty('prop2').size).toBe(1)
    expect(store.bookingsByProperty('prop3').size).toBe(0)
  })

  it('should filter bookings by date range', () => {
    const store = useBookingStore()

    store.setBooking('booking1', {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    store.setBooking('booking2', {
      id: 'booking2',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-10T15:00:00Z',
      checkout_date: '2023-06-12T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    expect(store.bookingsByDateRange('2023-06-01', '2023-06-05').size).toBe(1)
    expect(store.bookingsByDateRange('2023-06-09', '2023-06-13').size).toBe(1)
    expect(store.bookingsByDateRange('2023-06-05', '2023-06-09').size).toBe(0)
    expect(store.bookingsByDateRange('2023-05-31', '2023-06-13').size).toBe(2)
  })

  it('should update booking status via setBooking', () => {
    const store = useBookingStore()
    const booking: Booking = {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    store.setBooking(booking.id, booking)
    const existing = store.bookings.get('booking1')!
    store.setBooking('booking1', { ...existing, status: 'scheduled' })

    const updated = store.bookings.get('booking1')
    expect(updated?.status).toBe('scheduled')
  })

  it('should assign cleaner to booking via setBooking', () => {
    const store = useBookingStore()
    const booking: Booking = {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    }

    store.setBooking(booking.id, booking)
    const existing = store.bookings.get('booking1')!
    store.setBooking('booking1', { ...existing, assigned_cleaner_id: 'cleaner1' })

    const updated = store.bookings.get('booking1')
    expect(updated?.assigned_cleaner_id).toBe('cleaner1')
  })

  it('should clear all bookings', () => {
    const store = useBookingStore()

    store.setBooking('booking1', {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-01T15:00:00Z',
      checkout_date: '2023-06-03T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    store.setBooking('booking2', {
      id: 'booking2',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkin_date: '2023-06-05T15:00:00Z',
      checkout_date: '2023-06-07T11:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    })

    expect(store.bookings.size).toBe(2)

    store.clearAll()
    expect(store.bookings.size).toBe(0)
    expect(store.bookingsArray.length).toBe(0)
  })

  it('should bulk set bookings via setBookings()', () => {
    const store = useBookingStore()
    store.setBookings([
      { id: 'b1', property_id: 'p1', owner_id: 'o1', checkin_date: '2026-03-25', checkout_date: '2026-03-27', checkin_time: '15:00:00', checkout_time: '11:00:00', booking_type: 'standard', status: 'pending', priority: 'normal' } as Booking,
      { id: 'b2', property_id: 'p2', owner_id: 'o2', checkin_date: '2026-03-25', checkout_date: '2026-03-27', checkin_time: '15:00:00', checkout_time: '11:00:00', booking_type: 'standard', status: 'pending', priority: 'normal' } as Booking,
    ])
    expect(store.bookings.size).toBe(2)
    expect(store.bookings.get('b1')).toBeDefined()
  })
})
