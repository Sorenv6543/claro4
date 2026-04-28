export type PropertyStatus
  = | 'urgent_turn'
    | 'turn_today'
    | 'checkin_today'
    | 'checkout_today'
    | 'occupied'
    | 'vacant'

interface MinimalBooking {
  property_id: string
  status: string
  booking_type: string
  checkin_date: string
  checkout_date: string
  priority?: string
}

export function propStatus (
  propId: string,
  bookings: MinimalBooking[],
  todayStr: string,
): PropertyStatus {
  const bs = bookings.filter(b => b.property_id === propId && b.status !== 'cancelled')
  const turnToday = bs.find(b => b.checkin_date === todayStr && b.booking_type === 'turn')
  const checkoutToday = bs.find(b => b.checkout_date === todayStr && b.booking_type !== 'turn')
  const checkinToday = bs.find(b => b.checkin_date === todayStr && b.booking_type !== 'turn')
  const occupied = bs.find(
    b => b.checkin_date <= todayStr && b.checkout_date > todayStr && b.booking_type !== 'turn',
  )

  if (turnToday) {
    return turnToday.priority === 'urgent' ? 'urgent_turn' : 'turn_today'
  }
  if (checkoutToday && checkinToday) {
    return 'turn_today'
  }
  if (checkoutToday) {
    return 'checkout_today'
  }
  if (checkinToday) {
    return 'checkin_today'
  }
  if (occupied) {
    return 'occupied'
  }
  return 'vacant'
}
