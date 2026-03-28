import type { Booking } from '@/types'
import type { Property } from '@/types/property'
import { describe, expect, it } from 'vitest'
import {
  buildAssignmentUpdate,
  detectBookingConflicts,
  validateBooking,
  validateTurnBooking,
} from '@/utils/businessLogic'

const mockProperty: Property = {
  id: 'prop1',
  owner_id: 'owner1',
  address_street: '123 Test St',
  address_city: 'Test City',
  address_state: 'TX',
  address_zip: '78701',
  property_type: 'apartment',
  pricing_tier: 'standard',
  cleaning_duration: 120,
  active: true,
  color: '#5c6bc0',
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
      mockProperty,
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
      mockProperty,
    )
    expect(result.valid).toBe(true)
  })

  it('rejects when checkout_date is before checkin_date', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-05', checkout_date: '2026-04-01' },
      mockProperty,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Checkout date must be on or after checkin date')
  })

  it('produces no warnings for a standard booking with sufficient time between dates', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: '2026-04-05' },
      mockProperty,
    )
    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })
})

describe('validateTurnBooking — time ordering (checkout_time must follow checkin_time)', () => {
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
      mockProperty,
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
      mockProperty,
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

  it('does not conflict when bookings are on different properties', () => {
    const booking: Booking = {
      ...existing,
      id: 'b3',
      property_id: 'prop2',
      checkin_date: '2026-04-05',
      checkout_date: '2026-04-09',
    }
    expect(detectBookingConflicts(booking, [existing])).toHaveLength(0)
  })
})

describe('validateTurnBooking — warnings', () => {
  it('warns when checkout is after 14:00 (late checkout)', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '10:00',
        checkout_time: '15:00',
      },
      mockProperty,
    )
    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes('Late checkout'))).toBe(true)
  })

  it('warns when checkin is before 14:00 (early checkin)', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '13:00',
        checkout_time: '22:00',
      },
      mockProperty,
    )
    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes('Early checkin'))).toBe(true)
  })

  it('returns valid with no errors for a non-turn booking', () => {
    const result = validateTurnBooking(
      { ...baseBooking, booking_type: 'standard', checkin_date: '2026-04-01', checkout_date: '2026-04-05' },
      mockProperty,
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})

describe('buildAssignmentUpdate — mutual exclusivity', () => {
  it('assigns cleaner and nulls team/group', () => {
    const result = buildAssignmentUpdate('cleaner', 'cleaner-1')
    expect(result).toEqual({
      assigned_cleaner_id: 'cleaner-1',
      assigned_team_id: null,
      assigned_group_ids: null,
    })
  })

  it('assigns team and nulls cleaner/group', () => {
    const result = buildAssignmentUpdate('team', 'team-1')
    expect(result).toEqual({
      assigned_cleaner_id: null,
      assigned_team_id: 'team-1',
      assigned_group_ids: null,
    })
  })

  it('assigns group and nulls cleaner/team', () => {
    const result = buildAssignmentUpdate('group', ['c1', 'c2'])
    expect(result).toEqual({
      assigned_cleaner_id: null,
      assigned_team_id: null,
      assigned_group_ids: ['c1', 'c2'],
    })
  })
})

describe('validateBooking — conflict detection', () => {
  it('populates conflicts when existingBookings overlap', () => {
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
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-05', checkout_date: '2026-04-09' },
      mockProperty,
      [existing],
    )
    expect(result.warnings.some(w => w.includes('scheduling conflicts'))).toBe(true)
    expect(result.conflicts).toHaveLength(1)
  })
})
