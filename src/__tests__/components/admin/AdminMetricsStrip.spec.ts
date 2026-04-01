import AdminMetricsStrip from '@components/dumb/admin/AdminMetricsStrip.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

function mountStrip (props = {}) {
  return mount(AdminMetricsStrip, {
    props: {
      totalCleanings: 14,
      unassignedCount: 2,
      turnCount: 3,
      activeCleaners: 8,
      ...props,
    },
    global: { plugins: [vuetify] },
  })
}

describe('AdminMetricsStrip', () => {
  it('renders all four metric chips', () => {
    const wrapper = mountStrip()
    const text = wrapper.text()
    expect(text).toContain('14')
    expect(text).toContain('cleanings')
    expect(text).toContain('2')
    expect(text).toContain('unassigned')
    expect(text).toContain('3')
    expect(text).toContain('turns')
    expect(text).toContain('8')
    expect(text).toContain('cleaners')
  })

  it('shows success style when no unassigned', () => {
    const wrapper = mountStrip({ unassignedCount: 0 })
    expect(wrapper.text()).toContain('All assigned')
  })
})
