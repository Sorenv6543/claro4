import { describe, it, expect } from 'vitest'
import {
  validateBooking,
  validateTurnBooking,
  detectBookingConflicts,
} from '@/utils/businessLogic'
import type { Booking } from '@/types'
import type { Property } from '@/types/property'

const mockProperty: Property = {
  id: 'prop1',
  owner_id: 'owner1',
  name: 'Test Property',
  address: '123 Test St',
  property_type: 'apartment',
  pricing_tier: 'standard',
  cleaning_duration: 120,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const baseBooking: Partial<Booking> = {
  id: 'b1',
  property_id: 'prop1',
  owner_id: 'owner1',
  booking_type: 'standard',
  status: 'pending',
  priority: 'normal',
  checkin_time: '15:00',
  checkout_time: '11:00',
}

describe('validateBooking — date ordering', () => {
  it('accepts when checkout_date is after checkin_date', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: '2026-04-05' },
      mockProperty
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts when checkout_date equals checkin_date (same-day turn)', () => {
    const result = validateBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '22:00',
      },
      mockProperty
    )
    expect(result.valid).toBe(true)
  })

  it('rejects when checkout_date is before checkin_date', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-05', checkout_date: '2026-04-01' },
      mockProperty
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Checkout date must be on or after checkin date')
  })

  it('does not warn about short time for standard bookings with different dates', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: '2026-04-02' },
      mockProperty
    )
    expect(result.warnings.some(w => w.includes('turn booking'))).toBe(false)
  })
})

describe('validateTurnBooking — time ordering under Model A', () => {
  it('rejects turn booking where checkout_time is before checkin_time', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '10:00',
      },
      mockProperty
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('For turn bookings, checkout time must be after checkin time')
  })

  it('accepts turn booking where checkout_time is after checkin_time', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '22:00',
      },
      mockProperty
    )
    expect(result.valid).toBe(true)
  })
})

describe('detectBookingConflicts', () => {
  const existing: Booking = {
    id: 'b2',
    property_id: 'prop1',
    owner_id: 'owner1',
    checkin_date: '2026-04-03',
    checkout_date: '2026-04-07',
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard',
    status: 'pending',
    priority: 'normal',
  }

  it('detects overlap when new booking starts inside an existing booking', () => {
    const booking: Booking = {
      ...existing,
      id: 'b3',
      checkin_date: '2026-04-05',
      checkout_date: '2026-04-09',
    }
    expect(detectBookingConflicts(booking, [existing])).toHaveLength(1)
  })

  it('does not conflict when bookings are adjacent (one checkout == other checkin)', () => {
    const booking: Booking = {
      ...existing,
      id: 'b3',
      checkin_date: '2026-04-07',
      checkout_date: '2026-04-10',
    }
    expect(detectBookingConflicts(booking, [existing])).toHaveLength(0)
  })
})
