import { propStatus } from '@utils/propertyStatus'
import { describe, expect, it } from 'vitest'

const TODAY = '2026-04-27'
const PROP = 'prop-1'

function booking (overrides: Record<string, string>) {
  return {
    property_id: PROP,
    status: 'confirmed',
    booking_type: 'standard',
    checkin_date: '2026-04-25',
    checkout_date: '2026-04-29',
    priority: 'normal',
    ...overrides,
  }
}

describe('propStatus', () => {
  it('returns vacant when no bookings', () => {
    expect(propStatus(PROP, [], TODAY)).toBe('vacant')
  })

  it('ignores cancelled bookings', () => {
    const b = booking({ checkin_date: TODAY, booking_type: 'turn', status: 'cancelled' })
    expect(propStatus(PROP, [b], TODAY)).toBe('vacant')
  })

  it('returns urgent_turn for urgent turn booking today', () => {
    const b = booking({ checkin_date: TODAY, booking_type: 'turn', priority: 'urgent' })
    expect(propStatus(PROP, [b], TODAY)).toBe('urgent_turn')
  })

  it('returns turn_today for non-urgent turn booking today', () => {
    const b = booking({ checkin_date: TODAY, booking_type: 'turn', priority: 'normal' })
    expect(propStatus(PROP, [b], TODAY)).toBe('turn_today')
  })

  it('returns turn_today when standard checkout and checkin both today', () => {
    const out = booking({ checkout_date: TODAY })
    const inn = booking({ checkin_date: TODAY })
    expect(propStatus(PROP, [out, inn], TODAY)).toBe('turn_today')
  })

  it('returns checkout_today when only checkout is today', () => {
    const b = booking({ checkout_date: TODAY })
    expect(propStatus(PROP, [b], TODAY)).toBe('checkout_today')
  })

  it('returns checkin_today when only checkin is today', () => {
    const b = booking({ checkin_date: TODAY, checkout_date: '2026-04-30' })
    expect(propStatus(PROP, [b], TODAY)).toBe('checkin_today')
  })

  it('returns occupied for booking spanning today', () => {
    const b = booking({ checkin_date: '2026-04-25', checkout_date: '2026-04-30' })
    expect(propStatus(PROP, [b], TODAY)).toBe('occupied')
  })

  it('turn_today takes priority over checkout_today + checkin_today', () => {
    const turn = booking({ checkin_date: TODAY, booking_type: 'turn', priority: 'high' })
    const out = booking({ checkout_date: TODAY })
    const inn = booking({ checkin_date: TODAY, checkout_date: '2026-04-30' })
    expect(propStatus(PROP, [turn, out, inn], TODAY)).toBe('turn_today')
  })

  it('ignores bookings for a different property', () => {
    const b = booking({ property_id: 'other-prop', checkin_date: TODAY, booking_type: 'turn', priority: 'urgent' })
    expect(propStatus(PROP, [b], TODAY)).toBe('vacant')
  })
})
