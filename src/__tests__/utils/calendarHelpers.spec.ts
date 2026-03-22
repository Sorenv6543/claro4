import type { Booking } from '@/types'
import type { Property } from '@/types/property'
import { describe, expect, it } from 'vitest'
import { bookingToCalendarEvent, bookingToTransitionEvents, subtractOneDay } from '@/utils/calendarHelpers'

const mockProperty: Property = {
  id: 'prop1',
  owner_id: 'owner1',
  address_street: '434 ggg',
  address_unit: '',
  address_city: 'Palm Springs',
  address_state: 'CA',
  address_zip: '92235',
  property_type: 'apartment',
  pricing_tier: 'standard',
  cleaning_duration: 120,
  active: true,
  color: '#5c6bc0',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function makeBooking (overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    property_id: 'prop1',
    owner_id: 'owner1',
    booking_type: 'standard',
    status: 'pending',
    priority: 'normal',
    checkin_date: '2026-03-19',
    checkout_date: '2026-03-28',
    checkin_time: '15:00',
    checkout_time: '11:00',
    guest_count: 2,
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('bookingToCalendarEvent', () => {
  it('sets start to checkin_date', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.start).toBe('2026-03-19')
  })

  it('sets end to one day after checkout_date (exclusive end for FullCalendar)', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.end).toBe('2026-03-29')
  })

  it('uses property address in the title', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.title).toContain('434 ggg')
  })

  it('includes booking id', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.id).toBe('b1')
  })

  it('includes turn type class for turn bookings', () => {
    const event = bookingToCalendarEvent(
      makeBooking({ booking_type: 'turn', turn_date: '2026-03-20' }),
      mockProperty,
    )
    expect(event.classNames).toContain('type-turn')
  })

  it('includes type class', () => {
    const booking = makeBooking({ booking_type: 'turn', priority: 'normal' })
    const event = bookingToCalendarEvent(booking, mockProperty)
    expect(event.classNames).toContain('type-turn')
  })

  it('includes priority class', () => {
    const booking = makeBooking({ booking_type: 'standard', priority: 'urgent' })
    const event = bookingToCalendarEvent(booking, mockProperty)
    expect(event.classNames).toContain('priority-urgent')
  })
})

describe('subtractOneDay', () => {
  it('subtracts one day from a YYYY-MM-DD string', () => {
    expect(subtractOneDay('2026-03-29')).toBe('2026-03-28')
  })

  it('handles month boundaries', () => {
    expect(subtractOneDay('2026-03-01')).toBe('2026-02-28')
  })

  it('handles year boundaries', () => {
    expect(subtractOneDay('2026-01-01')).toBe('2025-12-31')
  })
})

describe('bookingToTransitionEvents', () => {
  it('standard booking produces 2 events (IN + OUT)', () => {
    const events = bookingToTransitionEvents(makeBooking(), mockProperty)
    expect(events).toHaveLength(2)
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('out')
  })

  it('turn booking with turn_date produces 3 events (IN + TURN + OUT)', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    expect(events).toHaveLength(3)
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('turn')
    expect(events[2].extendedProps.transitionType).toBe('out')
  })

  it('turn booking where turn_date === checkout_date produces 2 events (IN + TURN, OUT skipped)', () => {
    const booking = makeBooking({ turn_date: '2026-03-28', checkout_date: '2026-03-28' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    expect(events).toHaveLength(2)
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('turn')
  })

  it('IDs are suffixed correctly', () => {
    const booking = makeBooking({ id: 'abc123', turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    expect(events[0].id).toBe('abc123-in')
    expect(events[1].id).toBe('abc123-turn')
    expect(events[2].id).toBe('abc123-out')
  })

  it('each event is single-day (start and end one day apart)', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    for (const event of events) {
      const start = new Date(event.start)
      const end = new Date(event.end)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBe(1)
    }
  })

  it('all events have the transition-event class', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    for (const event of events) {
      expect(event.classNames).toContain('transition-event')
    }
  })

  it('events have correct type-specific classes', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    expect(events[0].classNames).toContain('transition-in')
    expect(events[1].classNames).toContain('transition-turn')
    expect(events[2].classNames).toContain('transition-out')
  })

  it('title includes transition label and property address', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    expect(events[0].title).toMatch(/^IN/)
    expect(events[0].title).toContain('434 ggg')
    expect(events[1].title).toMatch(/^TURN/)
    expect(events[1].title).toContain('434 ggg')
    expect(events[2].title).toMatch(/^OUT/)
    expect(events[2].title).toContain('434 ggg')
  })

  it('extendedProps includes bookingType, status, priority for CalendarBookingEvent compatibility', () => {
    const booking = makeBooking({ booking_type: 'turn', status: 'confirmed', priority: 'high', turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    for (const event of events) {
      expect(event.extendedProps.bookingType).toBe('turn')
      expect(event.extendedProps.status).toBe('confirmed')
      expect(event.extendedProps.priority).toBe('high')
    }
  })

  it('TURN event dates are correct (start=turn_date, end=turn_date+1)', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    const turnEvent = events.find(e => e.extendedProps.transitionType === 'turn')
    expect(turnEvent).toBeDefined()
    expect(turnEvent!.start).toBe('2026-03-22')
    expect(turnEvent!.end).toBe('2026-03-23')
  })

  it('uses "Unknown Property" label when property is undefined', () => {
    const events = bookingToTransitionEvents(makeBooking(), undefined)
    expect(events[0].title).toContain('Unknown Property')
    expect(events[1].title).toContain('Unknown Property')
  })

  it('handles turn_date: null (Supabase default) same as absent', () => {
    const events = bookingToTransitionEvents(makeBooking({ turn_date: null }), mockProperty)
    expect(events).toHaveLength(2)
    expect(events.map(e => e.extendedProps.transitionType)).toEqual(['in', 'out'])
  })

  it('same-day booking (checkin === checkout, no turn) produces IN + OUT on same date', () => {
    const events = bookingToTransitionEvents(
      makeBooking({ checkin_date: '2026-03-20', checkout_date: '2026-03-20' }),
      mockProperty,
    )
    expect(events).toHaveLength(2)
    expect(events[0].start).toBe('2026-03-20')
    expect(events[1].start).toBe('2026-03-20')
    expect(events[0].extendedProps.transitionType).toBe('in')
    expect(events[1].extendedProps.transitionType).toBe('out')
  })

  it('extendedProps.booking is the original booking object (referential equality)', () => {
    const booking = makeBooking({ turn_date: '2026-03-22' })
    const events = bookingToTransitionEvents(booking, mockProperty)
    for (const event of events) {
      expect(event.extendedProps.booking).toBe(booking)
    }
  })
})
