import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import PropertyExpansionList from '@/components/dumb/owner/PropertyExpansionList.vue'

const vuetify = createVuetify()

const FUTURE = '2099-12-31'
const PAST = '2000-01-01'

const baseProperty = {
  id: 'p1',
  owner_id: 'o1',
  address_street: '1 Main St',
  address_city: 'City',
  address_state: 'CA',
  address_zip: '90001',
  address_unit: null,
  bedrooms: 2,
  bathrooms: 1,
  property_type: 'house' as const,
  active: true,
  color: '#7367F0',
  cleaning_duration: 120,
  display_name: '1 Main St',
  full_address: '1 Main St, City, CA 90001',
  booking_count: 0,
}

function makeBooking (overrides: Record<string, unknown> = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    property_id: 'p1',
    owner_id: 'o1',
    checkin_date: FUTURE,
    checkout_date: FUTURE,
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard' as const,
    status: 'scheduled' as const,
    priority: 'normal' as const,
    turn_date: null,
    assigned_cleaner_id: null,
    ...overrides,
  }
}

function mountList (props: Record<string, unknown> = {}) {
  return mount(PropertyExpansionList, {
    props: {
      properties: [baseProperty],
      bookings: [],
      ...props,
    },
    global: { plugins: [vuetify] },
  })
}

describe('PropertyExpansionList', () => {
  it('shows skeleton loader when loading=true', () => {
    const wrapper = mountList({ loading: true, properties: [] })
    expect(wrapper.find('.v-skeleton-loader').exists()).toBe(true)
  })

  it('shows list-level empty state when no properties', () => {
    const wrapper = mountList({ properties: [] })
    expect(wrapper.text()).toContain('No Properties Yet')
  })

  it('renders one panel per property', () => {
    const wrapper = mountList({
      properties: [
        { ...baseProperty, id: 'p1', display_name: 'Alpha' },
        { ...baseProperty, id: 'p2', display_name: 'Beta' },
      ],
    })
    const panels = wrapper.findAll('.v-expansion-panel')
    expect(panels).toHaveLength(2)
  })

  it('shows property display_name in panel header', () => {
    const wrapper = mountList()
    expect(wrapper.text()).toContain('1 Main St')
  })

  describe('upcomingByProperty', () => {
    it('includes only standard future bookings', () => {
      const vm = mountList({
        bookings: [
          makeBooking({ checkin_date: FUTURE, booking_type: 'standard' }),
          makeBooking({ checkin_date: PAST, booking_type: 'standard' }),
          makeBooking({ checkin_date: FUTURE, booking_type: 'turn' }),
        ],
      }).vm as unknown as { upcomingByProperty: Map<string, unknown[]> }

      const upcoming = vm.upcomingByProperty.get('p1') ?? []
      expect(upcoming).toHaveLength(1)
    })

    it('caps at 5 entries per property', () => {
      const bookings = Array.from({ length: 7 }, (_, i) =>
        makeBooking({ checkin_date: `2099-01-${String(i + 1).padStart(2, '0')}`, booking_type: 'standard' }),
      )
      const vm = mountList({ bookings }).vm as unknown as { upcomingByProperty: Map<string, unknown[]> }
      expect(vm.upcomingByProperty.get('p1')).toHaveLength(5)
    })

    it('sorts ascending by checkin_date', () => {
      const bookings = [
        makeBooking({ id: 'late', checkin_date: '2099-06-01', booking_type: 'standard' }),
        makeBooking({ id: 'early', checkin_date: '2099-01-01', booking_type: 'standard' }),
      ]
      const vm = mountList({ bookings }).vm as unknown as { upcomingByProperty: Map<string, Array<{ id: string }>> }
      const list = vm.upcomingByProperty.get('p1') ?? []
      expect(list[0].id).toBe('early')
    })
  })

  describe('turnsByProperty', () => {
    it('includes only turn bookings', () => {
      const bookings = [
        makeBooking({ booking_type: 'turn', turn_date: FUTURE }),
        makeBooking({ booking_type: 'standard' }),
      ]
      const vm = mountList({ bookings }).vm as unknown as { turnsByProperty: Map<string, unknown[]> }
      expect(vm.turnsByProperty.get('p1')).toHaveLength(1)
    })

    it('caps at 5 turns per property', () => {
      const bookings = Array.from({ length: 8 }, (_, i) =>
        makeBooking({ booking_type: 'turn', turn_date: `2099-01-${String(i + 1).padStart(2, '0')}` }),
      )
      const vm = mountList({ bookings }).vm as unknown as { turnsByProperty: Map<string, unknown[]> }
      expect(vm.turnsByProperty.get('p1')).toHaveLength(5)
    })
  })

  describe('emits', () => {
    it('emits view with property id', () => {
      const wrapper = mountList()
      ;(wrapper.vm as unknown as { emit: (e: string, id: string) => void }).emit('view', 'p1')
      // trigger via vm.$emit proxy
      wrapper.vm.$emit('view', 'p1')
      expect(wrapper.emitted('view')?.[0]).toEqual(['p1'])
    })

    it('emits edit with property id', () => {
      const wrapper = mountList()
      wrapper.vm.$emit('edit', 'p1')
      expect(wrapper.emitted('edit')?.[0]).toEqual(['p1'])
    })

    it('emits delete with property id', () => {
      const wrapper = mountList()
      wrapper.vm.$emit('delete', 'p1')
      expect(wrapper.emitted('delete')?.[0]).toEqual(['p1'])
    })
  })
})
