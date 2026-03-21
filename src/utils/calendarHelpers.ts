import type { Booking } from '@/types'
import type { Property } from '@/types/property'
import { formatPropertyAddress } from '@/types/property'

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
    guestCount: number | null | undefined
    notes: string | null | undefined
    transitionType?: 'in' | 'turn' | 'out'
  }
}

/**
 * Convert a Booking to a FullCalendar EventInput.
 *
 * Turn bookings render as a single event spanning the full stay.
 * The turn day indicator is handled by eventContent + dayCellDidMount in FullCalendar.vue.
 */
export function bookingToCalendarEvent(
  booking: Booking,
  property: Property | undefined
): CalendarBookingEvent {
  const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Unknown Property'

  return {
    id: booking.id,
    title: propertyLabel,
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

/**
 * Convert a Booking into 1–3 single-day transition events (IN / TURN / OUT)
 * for use in an "events" calendar view mode.
 *
 * - IN  — always present on checkin_date
 * - TURN — present when booking.turn_date is set
 * - OUT  — present when checkout_date !== turn_date (skipped for turn-only bookings)
 */
export function bookingToTransitionEvents(
  booking: Booking,
  property: Property | undefined
): CalendarBookingEvent[] {
  const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  const events: CalendarBookingEvent[] = []

  const baseExtendedProps = {
    booking,
    property,
    bookingType: booking.booking_type,
    status: booking.status,
    priority: booking.priority,
    guestCount: booking.guest_count,
    notes: booking.notes,
  }

  // IN event — always present
  events.push({
    id: `${booking.id}-in`,
    title: `IN · ${propertyLabel}`,
    start: booking.checkin_date,
    end: addOneDay(booking.checkin_date),
    classNames: ['transition-event', 'transition-in'],
    extendedProps: { ...baseExtendedProps, transitionType: 'in' as const },
  })

  // TURN event — only if turn_date exists
  if (booking.turn_date) {
    events.push({
      id: `${booking.id}-turn`,
      title: `TURN · ${propertyLabel}`,
      start: booking.turn_date,
      end: addOneDay(booking.turn_date),
      classNames: ['transition-event', 'transition-turn'],
      extendedProps: { ...baseExtendedProps, transitionType: 'turn' as const },
    })
  }

  // OUT event — skip if same as turn_date
  if (booking.checkout_date !== booking.turn_date) {
    events.push({
      id: `${booking.id}-out`,
      title: `OUT · ${propertyLabel}`,
      start: booking.checkout_date,
      end: addOneDay(booking.checkout_date),
      classNames: ['transition-event', 'transition-out'],
      extendedProps: { ...baseExtendedProps, transitionType: 'out' as const },
    })
  }

  return events
}
