import type { Booking } from '@/types'
import type { Property } from '@/types/property'
import { describe, expect, it } from 'vitest'
import {
  buildAssignmentUpdate,
  calculateBookingPriority,
  calculatePropertyMetrics,
  calculateSystemMetrics,
  canDeactivateProperty,
  canTransitionBookingStatus,
  detectBookingConflicts,
  filterBookingsByDateRange,
  getAvailableStatusTransitions,
  getRecentBookings,
  getUrgentTurns,
  getUpcomingBookings,
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

describe('calculateBookingPriority', () => {
  it('returns "urgent" for turn booking with checkout < 2 hours from now', () => {
    const nearFuture = new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_urgent_turn',
      booking_type: 'turn',
      checkin_date: nearFuture,
      checkout_date: nearFuture,
    }
    expect(calculateBookingPriority(booking)).toBe('urgent')
  })

  it('returns "high" for turn booking with checkout 3 hours from now', () => {
    const threeHoursFromNow = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_high_turn_3h',
      booking_type: 'turn',
      checkin_date: threeHoursFromNow,
      checkout_date: threeHoursFromNow,
    }
    expect(calculateBookingPriority(booking)).toBe('high')
  })

  it('returns "high" for turn booking with checkout 10 hours from now (all turns are at least high)', () => {
    const tenHoursFromNow = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_high_turn_10h',
      booking_type: 'turn',
      checkin_date: tenHoursFromNow,
      checkout_date: tenHoursFromNow,
    }
    expect(calculateBookingPriority(booking)).toBe('high')
  })

  it('returns "urgent" for standard booking with checkin < 4 hours from now', () => {
    const nearFuture = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_urgent_std',
      booking_type: 'standard',
      checkin_date: nearFuture,
      checkout_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(calculateBookingPriority(booking)).toBe('urgent')
  })

  it('returns "high" for standard booking with checkin 8 hours from now', () => {
    const eightHoursFromNow = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_high_std_8h',
      booking_type: 'standard',
      checkin_date: eightHoursFromNow,
      checkout_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(calculateBookingPriority(booking)).toBe('high')
  })

  it('returns "normal" for standard booking with checkin 20 hours from now', () => {
    const twentyHoursFromNow = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_normal_std_20h',
      booking_type: 'standard',
      checkin_date: twentyHoursFromNow,
      checkout_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(calculateBookingPriority(booking)).toBe('normal')
  })

  it('returns "low" for standard booking with checkin 48 hours from now', () => {
    const fortyEightHoursFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_low_std_48h',
      booking_type: 'standard',
      checkin_date: fortyEightHoursFromNow,
      checkout_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(calculateBookingPriority(booking)).toBe('low')
  })
})

describe('getAvailableStatusTransitions', () => {
  it('transitions from pending to [scheduled, cancelled]', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_pending',
      status: 'pending',
    }
    const transitions = getAvailableStatusTransitions(booking)
    expect(transitions).toContain('scheduled')
    expect(transitions).toContain('cancelled')
  })

  it('transitions from scheduled to [in_progress, cancelled]', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_scheduled',
      status: 'scheduled',
    }
    const transitions = getAvailableStatusTransitions(booking)
    expect(transitions).toContain('in_progress')
    expect(transitions).toContain('cancelled')
  })

  it('transitions from in_progress to [completed, scheduled]', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_in_progress',
      status: 'in_progress',
    }
    const transitions = getAvailableStatusTransitions(booking)
    expect(transitions).toContain('completed')
    expect(transitions).toContain('scheduled')
  })

  it('completed status has no transitions (terminal state)', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_completed',
      status: 'completed',
    }
    const transitions = getAvailableStatusTransitions(booking)
    expect(transitions).toHaveLength(0)
  })

  it('transitions from cancelled to [pending]', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_cancelled',
      status: 'cancelled',
    }
    const transitions = getAvailableStatusTransitions(booking)
    expect(transitions).toContain('pending')
  })
})

describe('canTransitionBookingStatus', () => {
  it('allows transition from pending to scheduled', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_pending',
      status: 'pending',
    }
    expect(canTransitionBookingStatus(booking, 'scheduled')).toBe(true)
  })

  it('disallows transition from pending to completed', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_pending',
      status: 'pending',
    }
    expect(canTransitionBookingStatus(booking, 'completed')).toBe(false)
  })

  it('disallows any transition from completed', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_completed',
      status: 'completed',
    }
    expect(canTransitionBookingStatus(booking, 'scheduled')).toBe(false)
    expect(canTransitionBookingStatus(booking, 'cancelled')).toBe(false)
  })
})

describe('canDeactivateProperty', () => {
  it('allows deactivation when property has no bookings', () => {
    const result = canDeactivateProperty('prop1', [])
    expect(result.canDeactivate).toBe(true)
    expect(result.upcomingCount).toBe(0)
  })

  it('allows deactivation when property has only past bookings', () => {
    const pastBooking: Booking = {
      ...baseBooking as Booking,
      id: 'b_past',
      checkin_date: '2026-01-01',
      checkout_date: '2026-01-05',
    }
    const result = canDeactivateProperty('prop1', [pastBooking])
    expect(result.canDeactivate).toBe(true)
  })

  it('disallows deactivation with upcoming pending booking', () => {
    const upcomingDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const upcomingBooking: Booking = {
      ...baseBooking as Booking,
      id: 'b_upcoming',
      checkin_date: upcomingDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
    }
    const result = canDeactivateProperty('prop1', [upcomingBooking])
    expect(result.canDeactivate).toBe(false)
    expect(result.upcomingCount).toBe(1)
    expect(result.reason).toContain('1')
  })

  it('disallows deactivation with upcoming scheduled booking', () => {
    const upcomingDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const upcomingBooking: Booking = {
      ...baseBooking as Booking,
      id: 'b_upcoming_scheduled',
      checkin_date: upcomingDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'scheduled',
    }
    const result = canDeactivateProperty('prop1', [upcomingBooking])
    expect(result.canDeactivate).toBe(false)
  })

  it('allows deactivation with upcoming completed booking', () => {
    const upcomingDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const upcomingBooking: Booking = {
      ...baseBooking as Booking,
      id: 'b_upcoming_completed',
      checkin_date: upcomingDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
    }
    const result = canDeactivateProperty('prop1', [upcomingBooking])
    expect(result.canDeactivate).toBe(true)
  })

  it('allows deactivation with upcoming cancelled booking', () => {
    const upcomingDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const upcomingBooking: Booking = {
      ...baseBooking as Booking,
      id: 'b_upcoming_cancelled',
      checkin_date: upcomingDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'cancelled',
    }
    const result = canDeactivateProperty('prop1', [upcomingBooking])
    expect(result.canDeactivate).toBe(true)
  })

  it('correctly counts multiple upcoming bookings', () => {
    const upcomingDate1 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const upcomingDate2 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking1: Booking = {
      ...baseBooking as Booking,
      id: 'b_upcoming_1',
      checkin_date: upcomingDate1,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
    }
    const booking2: Booking = {
      ...baseBooking as Booking,
      id: 'b_upcoming_2',
      checkin_date: upcomingDate2,
      checkout_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'scheduled',
    }
    const result = canDeactivateProperty('prop1', [booking1, booking2])
    expect(result.canDeactivate).toBe(false)
    expect(result.upcomingCount).toBe(2)
    expect(result.reason).toContain('2')
  })
})

describe('calculatePropertyMetrics', () => {
  it('returns zeros for empty bookings array', () => {
    const metrics = calculatePropertyMetrics(mockProperty, [])
    expect(metrics.utilizationRate).toBe(0)
    expect(metrics.turnPercentage).toBe(0)
    expect(metrics.averageGapBetweenBookings).toBe(0)
  })

  it('calculates utilization rate for single booking covering 15 of last 30 days', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking: Booking = {
      ...baseBooking,
      id: 'b_util',
      checkin_date: thirtyDaysAgo,
      checkout_date: fifteenDaysAgo,
    }
    const metrics = calculatePropertyMetrics(mockProperty, [booking])
    expect(metrics.utilizationRate).toBeGreaterThan(0.4)
    expect(metrics.utilizationRate).toBeLessThan(0.6)
  })

  it('returns turnPercentage 1 for all turn bookings', () => {
    const booking1: Booking = {
      ...baseBooking,
      id: 'b_turn_1',
      booking_type: 'turn',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-01',
    }
    const booking2: Booking = {
      ...baseBooking,
      id: 'b_turn_2',
      booking_type: 'turn',
      checkin_date: '2026-04-05',
      checkout_date: '2026-04-05',
    }
    const metrics = calculatePropertyMetrics(mockProperty, [booking1, booking2])
    expect(metrics.turnPercentage).toBe(1)
  })

  it('returns turnPercentage 0 for no turn bookings', () => {
    const booking1: Booking = {
      ...baseBooking,
      id: 'b_std_1',
      booking_type: 'standard',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-05',
    }
    const booking2: Booking = {
      ...baseBooking,
      id: 'b_std_2',
      booking_type: 'standard',
      checkin_date: '2026-04-10',
      checkout_date: '2026-04-15',
    }
    const metrics = calculatePropertyMetrics(mockProperty, [booking1, booking2])
    expect(metrics.turnPercentage).toBe(0)
  })

  it('scales revenue by pricing tier (luxury vs basic)', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_revenue',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-05',
    }
    const basicProp = { ...mockProperty, pricing_tier: 'basic' as const }
    const luxuryProp = { ...mockProperty, pricing_tier: 'luxury' as const }
    const metricsBasic = calculatePropertyMetrics(basicProp, [booking])
    const metricsLuxury = calculatePropertyMetrics(luxuryProp, [booking])
    // Luxury tier multiplier is higher than basic
    expect(metricsLuxury.revenueProjection).toBeGreaterThanOrEqual(metricsBasic.revenueProjection)
  })
})

describe('filterBookingsByDateRange', () => {
  it('returns empty map when no bookings match range', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_out_of_range',
      checkin_date: '2026-01-01',
      checkout_date: '2026-01-05',
    }
    const bookingsMap = new Map<string, Booking>([['b_out_of_range', booking]])
    const result = filterBookingsByDateRange(bookingsMap, '2026-06-01', '2026-06-30')
    expect(result.size).toBe(0)
  })

  it('includes booking that overlaps start of range', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_overlap_start',
      checkin_date: '2026-04-15',
      checkout_date: '2026-05-05',
    }
    const bookingsMap = new Map<string, Booking>([['b_overlap_start', booking]])
    const result = filterBookingsByDateRange(bookingsMap, '2026-05-01', '2026-05-31')
    expect(result.size).toBe(1)
    expect(result.get('b_overlap_start')).toBeDefined()
  })

  it('includes booking that overlaps end of range', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_overlap_end',
      checkin_date: '2026-05-20',
      checkout_date: '2026-06-05',
    }
    const bookingsMap = new Map<string, Booking>([['b_overlap_end', booking]])
    const result = filterBookingsByDateRange(bookingsMap, '2026-05-01', '2026-05-31')
    expect(result.size).toBe(1)
    expect(result.get('b_overlap_end')).toBeDefined()
  })

  it('excludes booking entirely outside range', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_outside',
      checkin_date: '2026-03-01',
      checkout_date: '2026-03-31',
    }
    const bookingsMap = new Map<string, Booking>([['b_outside', booking]])
    const result = filterBookingsByDateRange(bookingsMap, '2026-05-01', '2026-05-31')
    expect(result.size).toBe(0)
  })

  it('includes booking fully within range', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_within',
      checkin_date: '2026-05-10',
      checkout_date: '2026-05-20',
    }
    const bookingsMap = new Map<string, Booking>([['b_within', booking]])
    const result = filterBookingsByDateRange(bookingsMap, '2026-05-01', '2026-05-31')
    expect(result.size).toBe(1)
    expect(result.get('b_within')).toBeDefined()
  })
})

describe('getUrgentTurns', () => {
  it('returns only turn bookings with pending status and checkout within hoursAhead', () => {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const turnBooking: Booking = {
      ...baseBooking,
      id: 'b_urgent_turn',
      booking_type: 'turn',
      checkin_date: twoHoursFromNow,
      checkout_date: twoHoursFromNow,
      status: 'pending',
    }
    const bookingsMap = new Map<string, Booking>([['b_urgent_turn', turnBooking]])
    const result = getUrgentTurns(bookingsMap, 24)
    expect(result.size).toBe(1)
    expect(result.get('b_urgent_turn')).toBeDefined()
  })

  it('excludes standard bookings', () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const booking: Booking = {
      ...baseBooking,
      id: 'b_standard',
      booking_type: 'standard',
      checkin_date: soon,
      checkout_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    }
    const bookingsMap = new Map<string, Booking>([['b_standard', booking]])
    const result = getUrgentTurns(bookingsMap, 24)
    expect(result.size).toBe(0)
  })

  it('excludes completed turns', () => {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const turnBooking: Booking = {
      ...baseBooking,
      id: 'b_completed_turn',
      booking_type: 'turn',
      checkin_date: twoHoursFromNow,
      checkout_date: twoHoursFromNow,
      status: 'completed',
    }
    const bookingsMap = new Map<string, Booking>([['b_completed_turn', turnBooking]])
    const result = getUrgentTurns(bookingsMap, 24)
    expect(result.size).toBe(0)
  })

  it('excludes cancelled turns', () => {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const turnBooking: Booking = {
      ...baseBooking,
      id: 'b_cancelled_turn',
      booking_type: 'turn',
      checkin_date: twoHoursFromNow,
      checkout_date: twoHoursFromNow,
      status: 'cancelled',
    }
    const bookingsMap = new Map<string, Booking>([['b_cancelled_turn', turnBooking]])
    const result = getUrgentTurns(bookingsMap, 24)
    expect(result.size).toBe(0)
  })

  it('respects custom hoursAhead parameter', () => {
    const oneHourFromNow = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
    const turnBooking: Booking = {
      ...baseBooking,
      id: 'b_urgent_custom',
      booking_type: 'turn',
      checkin_date: oneHourFromNow,
      checkout_date: oneHourFromNow,
      status: 'pending',
    }
    const bookingsMap = new Map<string, Booking>([['b_urgent_custom', turnBooking]])
    const resultWith2Hours = getUrgentTurns(bookingsMap, 2)
    expect(resultWith2Hours.size).toBe(1)
    const resultWith0Hours = getUrgentTurns(bookingsMap, 0)
    expect(resultWith0Hours.size).toBe(0)
  })
})

describe('getUpcomingBookings', () => {
  it('returns bookings with checkin_date in future and status confirmed/scheduled/pending', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking: Booking = {
      ...baseBooking,
      id: 'b_upcoming',
      checkin_date: futureDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
    }
    const bookingsMap = new Map<string, Booking>([['b_upcoming', booking]])
    const result = getUpcomingBookings(bookingsMap)
    expect(result.size).toBe(1)
    expect(result.get('b_upcoming')).toBeDefined()
  })

  it('excludes past bookings', () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking: Booking = {
      ...baseBooking,
      id: 'b_past',
      checkin_date: pastDate,
      checkout_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
    }
    const bookingsMap = new Map<string, Booking>([['b_past', booking]])
    const result = getUpcomingBookings(bookingsMap)
    expect(result.size).toBe(0)
  })

  it('excludes completed and cancelled bookings', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const completedBooking: Booking = {
      ...baseBooking,
      id: 'b_completed',
      checkin_date: futureDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
    }
    const cancelledBooking: Booking = {
      ...baseBooking,
      id: 'b_cancelled',
      checkin_date: futureDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'cancelled',
    }
    const bookingsMap = new Map<string, Booking>([
      ['b_completed', completedBooking],
      ['b_cancelled', cancelledBooking],
    ])
    const result = getUpcomingBookings(bookingsMap)
    expect(result.size).toBe(0)
  })
})

describe('getRecentBookings', () => {
  it('returns bookings with checkout_date within daysBack', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking: Booking = {
      ...baseBooking,
      id: 'b_recent',
      checkin_date: '2026-04-01',
      checkout_date: threeDaysAgo,
    }
    const bookingsMap = new Map<string, Booking>([['b_recent', booking]])
    const result = getRecentBookings(bookingsMap, 7)
    expect(result.size).toBe(1)
    expect(result.get('b_recent')).toBeDefined()
  })

  it('excludes older bookings', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking: Booking = {
      ...baseBooking,
      id: 'b_old',
      checkin_date: '2026-03-01',
      checkout_date: tenDaysAgo,
    }
    const bookingsMap = new Map<string, Booking>([['b_old', booking]])
    const result = getRecentBookings(bookingsMap, 7)
    expect(result.size).toBe(0)
  })

  it('respects custom daysBack parameter', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const booking: Booking = {
      ...baseBooking,
      id: 'b_custom_days',
      checkin_date: '2026-03-01',
      checkout_date: tenDaysAgo,
    }
    const bookingsMap = new Map<string, Booking>([['b_custom_days', booking]])
    const resultWith7Days = getRecentBookings(bookingsMap, 7)
    expect(resultWith7Days.size).toBe(0)
    const resultWith14Days = getRecentBookings(bookingsMap, 14)
    expect(resultWith14Days.size).toBe(1)
  })
})

describe('calculateSystemMetrics', () => {
  it('returns all zeros for empty maps', () => {
    const metrics = calculateSystemMetrics(
      new Map(),
      new Map(),
    )
    expect(metrics.totalProperties).toBe(0)
    expect(metrics.activeProperties).toBe(0)
    expect(metrics.totalOwners).toBe(0)
    expect(metrics.upcomingBookings).toBe(0)
    expect(metrics.urgentTurns).toBe(0)
  })

  it('counts active vs inactive properties', () => {
    const activeProp: Property = { ...mockProperty, id: 'prop_active', active: true }
    const inactiveProp: Property = { ...mockProperty, id: 'prop_inactive', active: false }
    const propertiesMap = new Map<string, Property>([
      ['prop_active', activeProp],
      ['prop_inactive', inactiveProp],
    ])
    const metrics = calculateSystemMetrics(
      propertiesMap,
      new Map(),
    )
    expect(metrics.activeProperties).toBe(1)
    expect(metrics.totalProperties).toBe(2)
  })

  it('counts unique owners', () => {
    const prop1: Property = { ...mockProperty, id: 'prop1', owner_id: 'owner1' }
    const prop2: Property = { ...mockProperty, id: 'prop2', owner_id: 'owner1' }
    const prop3: Property = { ...mockProperty, id: 'prop3', owner_id: 'owner2' }
    const propertiesMap = new Map<string, Property>([
      ['prop1', prop1],
      ['prop2', prop2],
      ['prop3', prop3],
    ])
    const metrics = calculateSystemMetrics(
      propertiesMap,
      new Map(),
    )
    expect(metrics.totalOwners).toBe(2)
  })

  it('counts upcoming bookings with future checkin and confirmed/scheduled status', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const upcomingBooking: Booking = {
      ...baseBooking,
      id: 'b_upcoming_system',
      checkin_date: futureDate,
      checkout_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
    }
    const bookingsMap = new Map<string, Booking>([['b_upcoming_system', upcomingBooking]])
    const metrics = calculateSystemMetrics(
      new Map(),
      bookingsMap,
    )
    expect(metrics.upcomingBookings).toBe(1)
  })

  it('counts urgent turns with type turn, status pending, checkout within 24h', () => {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const urgentTurn: Booking = {
      ...baseBooking,
      id: 'b_urgent_system',
      booking_type: 'turn',
      checkin_date: twoHoursFromNow,
      checkout_date: twoHoursFromNow,
      status: 'pending',
    }
    const bookingsMap = new Map<string, Booking>([['b_urgent_system', urgentTurn]])
    const metrics = calculateSystemMetrics(
      new Map(),
      bookingsMap,
    )
    expect(metrics.urgentTurns).toBe(1)
  })
})

describe('validateBooking — edge cases (missing dates)', () => {
  it('rejects when both checkin_date and checkout_date are missing', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: undefined, checkout_date: undefined },
      mockProperty,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Checkout and checkin dates are required'))).toBe(true)
  })

  it('rejects when only checkout_date is missing', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: undefined },
      mockProperty,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Checkout and checkin dates are required'))).toBe(true)
  })

  it('rejects when only checkin_date is missing', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: undefined, checkout_date: '2026-04-05' },
      mockProperty,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Checkout and checkin dates are required'))).toBe(true)
  })

  it('returns no conflicts when existingBookings array is empty', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: '2026-04-05' },
      mockProperty,
      [],
    )
    expect(result.valid).toBe(true)
    expect(result.conflicts ?? []).toHaveLength(0)
  })
})

describe('validateTurnBooking — edge cases (date and time validation)', () => {
  it('rejects turn with different dates (not same day)', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-02',
        checkin_time: '14:00',
        checkout_time: '22:00',
      },
      mockProperty,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('same'))).toBe(true)
  })

  it('rejects turn with checkout_time equal to checkin_time (must be AFTER)', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '14:00',
      },
      mockProperty,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('after'))).toBe(true)
  })

  it('non-turn booking returns valid with no errors/warnings', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'standard',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-05',
        checkin_time: '15:00',
        checkout_time: '11:00',
      },
      mockProperty,
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('turn with no times provided returns no time-related errors (only date check applies)', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: undefined,
        checkout_time: undefined,
      },
      mockProperty,
    )
    // Should validate only the date, not time
    expect(result.valid).toBe(true)
    expect(result.errors.filter(e => e.includes('time'))).toHaveLength(0)
  })
})

describe('detectBookingConflicts — additional edge cases (multiple and containment)', () => {
  it('returns all overlapping bookings when multiple conflict', () => {
    const existing1: Booking = {
      ...baseBooking,
      id: 'b_exist_1',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-05',
    }
    const existing2: Booking = {
      ...baseBooking,
      id: 'b_exist_2',
      checkin_date: '2026-04-03',
      checkout_date: '2026-04-07',
    }
    const newBooking: Booking = {
      ...baseBooking,
      id: 'b_new',
      checkin_date: '2026-04-04',
      checkout_date: '2026-04-06',
    }
    const conflicts = detectBookingConflicts(newBooking, [existing1, existing2])
    expect(conflicts).toHaveLength(2)
  })

  it('excludes booking overlapping itself (same ID)', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b_self',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-05',
    }
    const conflicts = detectBookingConflicts(booking, [booking])
    expect(conflicts).toHaveLength(0)
  })

  it('detects conflict when new booking fully contains another', () => {
    const existing: Booking = {
      ...baseBooking,
      id: 'b_contained',
      checkin_date: '2026-04-03',
      checkout_date: '2026-04-05',
    }
    const newBooking: Booking = {
      ...baseBooking,
      id: 'b_container',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-07',
    }
    const conflicts = detectBookingConflicts(newBooking, [existing])
    expect(conflicts).toHaveLength(1)
  })

  it('detects conflict when new booking is fully contained by another', () => {
    const existing: Booking = {
      ...baseBooking,
      id: 'b_container',
      checkin_date: '2026-04-01',
      checkout_date: '2026-04-07',
    }
    const newBooking: Booking = {
      ...baseBooking,
      id: 'b_contained',
      checkin_date: '2026-04-03',
      checkout_date: '2026-04-05',
    }
    const conflicts = detectBookingConflicts(newBooking, [existing])
    expect(conflicts).toHaveLength(1)
  })
})
