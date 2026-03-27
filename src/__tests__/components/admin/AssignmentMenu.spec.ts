import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import AssignmentMenu from '@components/dumb/shared/AssignmentMenu.vue'

const vuetify = createVuetify()

const mockCleaners = [
  { id: 'c1', name: 'Maria R.', assigned: 2, total: 4 },
  { id: 'c2', name: 'Carlos K.', assigned: 4, total: 4 },
]

const mockTeams = [
  { id: 't1', name: 'Team A', member_ids: ['c1', 'c3'], assigned: 1, total: 2 },
]

function mountMenu(props = {}) {
  return mount(AssignmentMenu, {
    props: { cleaners: mockCleaners, teams: mockTeams, ...props },
    global: { plugins: [vuetify] },
  })
}

describe('AssignmentMenu', () => {
  it('renders cleaner list', () => {
    const wrapper = mountMenu()
    expect(wrapper.text()).toContain('Maria R.')
    expect(wrapper.text()).toContain('Carlos K.')
  })

  it('renders all three tabs', () => {
    const wrapper = mountMenu()
    expect(wrapper.text()).toContain('Cleaner')
    expect(wrapper.text()).toContain('Team')
    expect(wrapper.text()).toContain('Quick Group')
  })

  it('shows capacity for cleaners', () => {
    const wrapper = mountMenu()
    expect(wrapper.text()).toContain('2/4')
    expect(wrapper.text()).toContain('4/4')
  })
})
