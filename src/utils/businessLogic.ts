import type { Booking, BookingStatus } from '@/types/booking'
import type { PricingTier, Property } from '@/types/property'

/** Revenue multipliers by pricing tier */
export const REVENUE_MULTIPLIERS: Record<PricingTier, number> = {
  basic: 1,
  standard: 1.2,
  premium: 1.5,
  luxury: 2.5,
}

/**
 * Calculate property metrics (utilization, revenue projection, cleaning load)
 * Shared between owner and admin composables.
 */
export function calculatePropertyMetrics (
  property: Property,
  propertyBookings: Booking[],
): { utilizationRate: number, averageGapBetweenBookings: number, turnPercentage: number, revenueProjection: number, cleaningLoad: 'light' | 'moderate' | 'heavy' } {
  const totalDays = 30
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - totalDays)
  const windowStartStr = windowStart.toISOString().split('T')[0]
  const nowStr = now.toISOString().split('T')[0]

  // Filter bookings to the 30-day window for utilization calculation
  const windowBookings = propertyBookings.filter(b => b.checkout_date >= windowStartStr && b.checkin_date <= nowStr)

  const bookedDays = new Set<string>()

  for (const booking of windowBookings) {
    const checkinDate = new Date(booking.checkin_date)
    const checkoutDate = new Date(booking.checkout_date)
    const currentDate = new Date(Math.max(checkinDate.getTime(), windowStart.getTime()))
    const endDate = new Date(Math.min(checkoutDate.getTime(), now.getTime()))
    while (currentDate <= endDate) {
      bookedDays.add(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  const utilizationRate = bookedDays.size / totalDays

  const turnBookings = propertyBookings.filter(b => b.booking_type === 'turn')
  const turnPercentage = propertyBookings.length > 0 ? turnBookings.length / propertyBookings.length : 0

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

  const baseRevenue = 100
  const projectedBookings = Math.round(utilizationRate * 30)
  const revenueProjection = projectedBookings * baseRevenue * REVENUE_MULTIPLIERS[property.pricing_tier]

  const cleaningLoad: 'light' | 'moderate' | 'heavy'
    = utilizationRate < 0.3 ? 'light' : (utilizationRate < 0.7 ? 'moderate' : 'heavy')

  return { utilizationRate, averageGapBetweenBookings, turnPercentage, revenueProjection, cleaningLoad }
}

/**
 * Calculate booking priority based on booking type and timing
 */
export function calculateBookingPriority (booking: Booking): 'low' | 'normal' | 'high' | 'urgent' {
  const now = new Date()
  const checkoutDate = new Date(booking.checkout_date)
  const checkinDate = new Date(booking.checkin_date)

  // Turn bookings are always high priority or urgent
  if (booking.booking_type === 'turn') {
    const hoursUntilCheckout = (checkoutDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilCheckout <= 2) {
      return 'urgent'
    } // Less than 2 hours
    if (hoursUntilCheckout <= 6) {
      return 'high'
    } // Less than 6 hours
    return 'high' // All turns are at least high priority
  }

  // Standard bookings priority based on time until checkin
  const hoursUntilCheckin = (checkinDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilCheckin <= 4) {
    return 'urgent'
  } // Less than 4 hours
  if (hoursUntilCheckin <= 12) {
    return 'high'
  } // Less than 12 hours
  if (hoursUntilCheckin <= 24) {
    return 'normal'
  } // Less than 24 hours
  return 'low' // More than 24 hours
}

/**
 * Calculate the cleaning window for a booking
 * @deprecated Use the cleaning_window metadata from BookingWithMetadata instead.
 */
export function getCleaningWindow (booking: Booking, property: Property): {
  start: string
  end: string
  duration: number
  bufferTime: number
} {
  const checkoutDate = new Date(booking.checkout_date)
  const checkinDate = new Date(booking.checkin_date)
  const cleaningDuration = property.cleaning_duration || 120 // Default 2 hours

  if (booking.booking_type === 'turn') {
    // Turn: Cleaning must happen between checkout and checkin
    const availableTime = (checkinDate.getTime() - checkoutDate.getTime()) / (1000 * 60)
    const bufferTime = 30 // 30 minute buffer before checkin
    const maxCleaningTime = Math.max(60, availableTime - bufferTime) // Minimum 1 hour

    const cleaningStart = new Date(checkoutDate.getTime() + (30 * 60 * 1000)) // 30 min after checkout
    const cleaningEnd = new Date(cleaningStart.getTime() + (Math.min(cleaningDuration, maxCleaningTime) * 60 * 1000))

    return {
      start: cleaningStart.toISOString(),
      end: cleaningEnd.toISOString(),
      duration: Math.min(cleaningDuration, maxCleaningTime),
      bufferTime,
    }
  } else {
    // Standard: Flexible scheduling between checkout and checkin
    const cleaningStart = new Date(checkoutDate)
    cleaningStart.setHours(11, 0, 0, 0) // Default 11 AM start

    const cleaningEnd = new Date(cleaningStart.getTime() + (cleaningDuration * 60 * 1000))

    // Ensure cleaning ends at least 1 hour before checkin
    const oneHourBeforeCheckin = new Date(checkinDate.getTime() - (60 * 60 * 1000))
    if (cleaningEnd > oneHourBeforeCheckin) {
      cleaningEnd.setTime(oneHourBeforeCheckin.getTime())
    }

    return {
      start: cleaningStart.toISOString(),
      end: cleaningEnd.toISOString(),
      duration: cleaningDuration,
      bufferTime: 60,
    }
  }
}

/**
 * Check if a cleaning can be scheduled for a booking
 * @deprecated Use the cleaning_window metadata from BookingWithMetadata instead.
 */
export function canScheduleCleaning (booking: Booking, property: Property): {
  possible: boolean
  reason?: string
  suggestedTimes?: string[]
} {
  const checkoutDate = new Date(booking.checkout_date)
  const checkinDate = new Date(booking.checkin_date)
  const timeDiff = (checkinDate.getTime() - checkoutDate.getTime()) / (1000 * 60) // minutes

  const minCleaningTime = property.cleaning_duration || 120
  const bufferTime = booking.booking_type === 'turn' ? 30 : 60
  const requiredTime = minCleaningTime + bufferTime

  if (timeDiff < requiredTime) {
    return {
      possible: false,
      reason: `Insufficient time. Need ${requiredTime} minutes, have ${Math.floor(timeDiff)} minutes.`,
      suggestedTimes: [
        new Date(checkoutDate.getTime() + (requiredTime * 60 * 1000)).toISOString(),
      ],
    }
  }

  return { possible: true }
}

/**
 * Validate a turn booking for potential issues
 */
export function validateTurnBooking (booking: Partial<Booking>,
  _property: Property): { valid: boolean, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (booking.booking_type !== 'turn') {
    return { valid: true, errors, warnings }
  }

  // A turn booking is a same-day stay: the guest arrives and departs on the same calendar date
  // (checkin_date == checkout_date).
  if (booking.checkout_date!.slice(0, 10) !== booking.checkin_date!.slice(0, 10)) {
    errors.push('Turn bookings must have checkout and checkin on the same day')
  }

  // For same-day stays, guests must depart (checkout) after they arrive (checkin).
  if (booking.checkout_time && booking.checkin_time && booking.checkout_time <= booking.checkin_time) {
    errors.push('For turn bookings, checkout time must be after checkin time')
  }

  // Warn about late checkout — leaves little time for cleaning before next guests.
  const checkoutHour = booking.checkout_time ? Number.parseInt(booking.checkout_time.split(':')[0]) : null
  if (checkoutHour !== null && checkoutHour > 14) {
    warnings.push('Late checkout may leave insufficient time for cleaning before next guests')
  }

  // Warn about early checkin — cleaners may not finish preparation in time.
  const checkinHour = booking.checkin_time ? Number.parseInt(booking.checkin_time.split(':')[0]) : null
  if (checkinHour !== null && checkinHour < 14) {
    warnings.push('Early checkin may require rushing cleaning preparation')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Detect time conflicts between bookings
 */
export function detectBookingConflicts (booking: Booking,
  existingBookings: Booking[]): Booking[] {
  // Each booking spans from checkin_date (arrival) to checkout_date (departure).
  const bookingStart = new Date(booking.checkin_date)
  const bookingEnd = new Date(booking.checkout_date)

  // Check for overlapping bookings (two stays overlap if one starts before the other ends).
  return existingBookings.filter(otherBooking => {
    if (otherBooking.id === booking.id || otherBooking.property_id !== booking.property_id) {
      return false // Same booking or different property
    }

    const otherStart = new Date(otherBooking.checkin_date)
    const otherEnd = new Date(otherBooking.checkout_date)

    // Overlap: booking starts before other ends AND booking ends after other starts.
    // Adjacent bookings (one checkout == other checkin) do NOT conflict.
    return bookingStart < otherEnd && bookingEnd > otherStart
  })
}

/**
 * Validate a booking for scheduling
 */
export function validateBooking (booking: Partial<Booking>,
  property: Property,
  existingBookings: Booking[] = []): {
  valid: boolean
  errors: string[]
  warnings: string[]
  conflicts?: Booking[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validation
  if (!booking.checkout_date || !booking.checkin_date) {
    errors.push('Checkout and checkin dates are required')
    return { valid: false, errors, warnings }
  }

  const checkoutDate = new Date(booking.checkout_date)
  const checkinDate = new Date(booking.checkin_date)

  // Guests check in (arrive) first, then check out (depart). Same day is valid for turn bookings.
  if (checkoutDate < checkinDate) {
    errors.push('Checkout date must be on or after checkin date')
  }

  // For turn bookings, use the specialized validation
  if (booking.booking_type === 'turn') {
    const turnValidation = validateTurnBooking(booking, property)
    errors.push(...turnValidation.errors)
    warnings.push(...turnValidation.warnings)
  }

  // Check for conflicts with existing bookings
  const conflicts = booking.id
    ? detectBookingConflicts(booking as Booking, existingBookings)
    : []

  if (conflicts.length > 0) {
    warnings.push(`Found ${conflicts.length} potential scheduling conflicts`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
  }
}

/**
 * Get the workflow status transitions available for a booking
 */
export function getAvailableStatusTransitions (booking: Booking): BookingStatus[] {
  switch (booking.status) {
    case 'pending': {
      return ['scheduled', 'cancelled']
    }
    case 'scheduled': {
      return ['in_progress', 'cancelled']
    }
    case 'in_progress': {
      return ['completed', 'scheduled']
    } // Can go back if issues
    case 'completed': {
      return []
    } // Terminal state
    case 'cancelled': {
      return ['pending']
    } // Can reactivate
    default: {
      return []
    }
  }
}

/**
 * Check if a booking can transition to a new status
 */
export function canTransitionBookingStatus (booking: Booking, newStatus: BookingStatus): boolean {
  return getAvailableStatusTransitions(booking).includes(newStatus)
}

// Extracted shared logic from stores to eliminate duplication
export function calculateSystemMetrics (properties: Map<string, Property>,
  bookings: Map<string, Booking>) {
  const now = new Date()
  const twentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  // const thisMonth = new Date().toISOString().slice(0, 7) // Reserved for future metrics

  let totalProperties = 0
  let activeProperties = 0
  const ownerIds = new Set<string>()

  // Single pass through properties
  for (const property of properties.values()) {
    totalProperties++
    if (property.active) {
      activeProperties++
    }
    ownerIds.add(property.owner_id)
  }

  let totalBookings = 0
  let upcomingBookings = 0
  let urgentTurns = 0

  // Single pass through bookings
  for (const booking of bookings.values()) {
    totalBookings++

    const checkinDate = new Date(booking.checkin_date)
    const checkoutDate = new Date(booking.checkout_date)

    if (checkinDate > now && ['confirmed', 'scheduled'].includes(booking.status)) {
      upcomingBookings++
    }

    if (booking.booking_type === 'turn'
      && booking.status === 'pending'
      && checkoutDate <= twentyFourHours) { // checkout_date is when current guests depart; turn urgency is measured against that departure time
      urgentTurns++
    }
  }

  return {
    totalProperties,
    activeProperties,
    totalOwners: ownerIds.size,
    totalBookings,
    upcomingBookings,
    urgentTurns,
  }
}

export function filterBookingsByDateRange (bookings: Map<string, Booking>,
  startDate: string,
  endDate: string): Map<string, Booking> {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const filtered = new Map<string, Booking>()

  for (const [id, booking] of bookings.entries()) {
    const bookingStart = new Date(booking.checkin_date).getTime()
    const bookingEnd = new Date(booking.checkout_date).getTime()

    if (bookingStart <= end && bookingEnd >= start) {
      filtered.set(id, booking)
    }
  }

  return filtered
}

export function getUrgentTurns (bookings: Map<string, Booking>,
  hoursAhead = 24): Map<string, Booking> {
  const cutoffTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000)
  const urgentTurns = new Map<string, Booking>()

  for (const [id, booking] of bookings.entries()) {
    if (booking.booking_type === 'turn'
      && booking.status === 'pending'
      && new Date(booking.checkout_date) <= cutoffTime) {
      urgentTurns.set(id, booking)
    }
  }

  return urgentTurns
}

export function getUpcomingBookings (bookings: Map<string, Booking>): Map<string, Booking> {
  const now = new Date()
  const upcoming = new Map<string, Booking>()

  for (const [id, booking] of bookings.entries()) {
    if (new Date(booking.checkin_date) > now
      && ['confirmed', 'scheduled', 'pending'].includes(booking.status)) {
      upcoming.set(id, booking)
    }
  }

  return upcoming
}

export function getRecentBookings (bookings: Map<string, Booking>,
  daysBack = 30): Map<string, Booking> {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
  const recent = new Map<string, Booking>()

  for (const [id, booking] of bookings.entries()) {
    if (new Date(booking.checkout_date) >= cutoffDate) {
      recent.set(id, booking)
    }
  }

  return recent
}

/**
 * Check if a property can be deactivated (no upcoming bookings)
 * Shared between owner and admin composables to eliminate duplication
 */
export function canDeactivateProperty (propertyId: string,
  bookings: Iterable<Booking>): { canDeactivate: boolean, upcomingCount: number, reason?: string } {
  const now = new Date()
  let upcomingCount = 0

  for (const booking of bookings) {
    if (booking.property_id === propertyId
      && new Date(booking.checkin_date) > now
      && ['pending', 'scheduled'].includes(booking.status)) {
      upcomingCount++
    }
  }

  if (upcomingCount > 0) {
    return {
      canDeactivate: false,
      upcomingCount,
      reason: `Cannot deactivate property with ${upcomingCount} upcoming booking${upcomingCount > 1 ? 's' : ''}. Please complete or cancel them first.`,
    }
  }

  return { canDeactivate: true, upcomingCount: 0 }
}

/**
 * Build a booking assignment update that enforces mutual exclusivity.
 * Only one of cleaner/team/group can be set — the others are nulled out.
 * Mirrors the `one_assignment_type` CHECK constraint in the database.
 */
export function buildAssignmentUpdate (
  type: 'cleaner' | 'team',
  value: string,
): Pick<Booking, 'assigned_cleaner_id' | 'assigned_team_id' | 'assigned_group_ids'>
export function buildAssignmentUpdate (
  type: 'group',
  value: string[],
): Pick<Booking, 'assigned_cleaner_id' | 'assigned_team_id' | 'assigned_group_ids'>
export function buildAssignmentUpdate (
  type: 'cleaner' | 'team' | 'group',
  value: string | string[],
): Pick<Booking, 'assigned_cleaner_id' | 'assigned_team_id' | 'assigned_group_ids'> {
  switch (type) {
    case 'cleaner': {
      return { assigned_cleaner_id: value as string, assigned_team_id: null, assigned_group_ids: null }
    }
    case 'team': {
      return { assigned_cleaner_id: null, assigned_team_id: value as string, assigned_group_ids: null }
    }
    case 'group': {
      return { assigned_cleaner_id: null, assigned_team_id: null, assigned_group_ids: value as string[] }
    }
  }
}
