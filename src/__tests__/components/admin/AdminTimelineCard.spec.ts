import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import AdminTimelineCard from '@components/dumb/admin/AdminTimelineCard.vue'

const vuetify = createVuetify()

const baseBooking = {
  id: 'b1',
  property_id: 'p1',
  owner_id: 'o1',
  checkout_date: '2026-03-27',
  checkout_time: '11:00',
  checkin_date: '2026-03-27',
  checkin_time: '15:00',
  booking_type: 'standard' as const,
  status: 'scheduled' as const,
  priority: 'normal' as const,
  assigned_cleaner_id: 'c1',
}

const baseProperty = { id: 'p1', name: 'Oceanview Condo', color: '#5c6bc0' }
const baseCleaner = { id: 'c1', name: 'Maria R.' }

function mountCard(props = {}) {
  return mount(AdminTimelineCard, {
    props: { booking: baseBooking, property: baseProperty, cleaner: baseCleaner, ...props },
    global: { plugins: [vuetify] },
  })
}

describe('AdminTimelineCard', () => {
  it('renders property name and time', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Oceanview Condo')
    expect(wrapper.text()).toContain('11:00')
  })

  it('shows cleaner name when assigned', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Maria R.')
  })

  it('shows Unassigned chip when no cleaner', () => {
    const wrapper = mountCard({
      booking: { ...baseBooking, assigned_cleaner_id: null },
      cleaner: null,
    })
    expect(wrapper.text()).toContain('Unassigned')
  })

  it('shows Turn chip for turn bookings', () => {
    const wrapper = mountCard({
      booking: { ...baseBooking, booking_type: 'turn' },
    })
    expect(wrapper.text()).toContain('Turn')
  })
})
