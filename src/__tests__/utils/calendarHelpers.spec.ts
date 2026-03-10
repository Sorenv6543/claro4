import { describe, it, expect } from 'vitest'
import { bookingToCalendarEvent } from '@/utils/calendarHelpers'
import type { Booking } from '@/types'
import type { Property } from '@/types/property'

const mockProperty: Property = {
  id: 'prop1',
  owner_id: 'owner1',
  name: '434 ggg, Palm Springs',
  address: '434 ggg, Palm springs, CA, 92235',
  property_type: 'apartment',
  pricing_tier: 'standard',
  cleaning_duration: 120,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
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
})

describe('bookingToCalendarEvent', () => {
  it('sets start to checkin_date', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.start).toBe('2026-03-19')
  })

  it('sets end to one day after checkout_date (exclusive end for FullCalendar)', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.end).toBe('2026-03-29')
  })

  it('uses property name in the title', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.title).toContain('434 ggg, Palm Springs')
  })

  it('includes booking id', () => {
    const event = bookingToCalendarEvent(makeBooking(), mockProperty)
    expect(event.id).toBe('b1')
  })

  it('marks turn bookings in the title', () => {
    const event = bookingToCalendarEvent(makeBooking({ booking_type: 'turn' }), mockProperty)
    expect(event.title).toContain('TURN')
  })
})
