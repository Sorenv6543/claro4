import type { Booking } from '@/types'
import type { Property } from '@/types/property'

/** Add one day to a YYYY-MM-DD string (for FullCalendar exclusive end dates). */
function addOneDay(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

/** Subtract one day from a YYYY-MM-DD string (reverses FullCalendar exclusive end offset on write-back). */
export function subtractOneDay(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

export interface CalendarBookingEvent {
  id: string
  title: string
  start: string
  end: string
  classNames: string[]
  extendedProps: {
    booking: Booking
    property: Property | undefined
    bookingType: string
    status: string
    priority: string
    guestCount: number | undefined
    notes: string | undefined
  }
}

/**
 * Convert a Booking to a FullCalendar EventInput.
 *
 * - start = checkin_date  (when guests arrive)
 * - end   = checkout_date + 1 day  (FullCalendar all-day end is exclusive)
 */
export function bookingToCalendarEvent(
  booking: Booking,
  property: Property | undefined
): CalendarBookingEvent {
  const isTurn = booking.booking_type === 'turn'

  return {
    id: booking.id,
    title: `${property?.name || 'Unknown Property'} - ${isTurn ? 'TURN' : 'Standard'}`,
    start: booking.checkin_date,
    end: addOneDay(booking.checkout_date),
    classNames: [
      `type-${booking.booking_type}`,
      `priority-${booking.priority}`,
    ],
    extendedProps: {
      booking,
      property,
      bookingType: booking.booking_type,
      status: booking.status,
      priority: booking.priority,
      guestCount: booking.guest_count,
      notes: booking.notes,
    },
  }
}
