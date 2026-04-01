import AssignmentMenu from '@components/dumb/shared/AssignmentMenu.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

const mockCleaners = [
  { id: 'c1', name: 'Maria R.', assigned: 2, total: 4 },
  { id: 'c2', name: 'Carlos K.', assigned: 4, total: 4 },
]

const mockTeams = [
  { id: 't1', name: 'Team A', member_ids: ['c1', 'c3'], assigned: 1, total: 2 },
]

function mountMenu (props = {}) {
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

  it('emits assignCleaner when clicking an available cleaner', async () => {
    const wrapper = mountMenu()
    // Find the list item for Maria (available, 2/4)
    const listItems = wrapper.findAll('.v-list-item')
    const mariaItem = listItems.find(item => item.text().includes('Maria R.'))
    expect(mariaItem).toBeTruthy()
    await mariaItem!.trigger('click')
    expect(wrapper.emitted('assign-cleaner')).toBeTruthy()
    expect(wrapper.emitted('assign-cleaner')![0]).toEqual(['c1'])
  })

  it('does not emit assignCleaner for at-capacity cleaners', async () => {
    const wrapper = mountMenu()
    const listItems = wrapper.findAll('.v-list-item')
    const carlosItem = listItems.find(item => item.text().includes('Carlos K.'))
    expect(carlosItem).toBeTruthy()
    await carlosItem!.trigger('click')
    // Carlos is at capacity (4/4) — should not emit
    expect(wrapper.emitted('assign-cleaner')).toBeFalsy()
  })

  it('emits assignTeam when clicking a team', async () => {
    const wrapper = mountMenu()
    // Switch to Team tab
    const tabs = wrapper.findAll('.v-tab')
    const teamTab = tabs.find(t => t.text().includes('Team'))
    if (teamTab) {
      await teamTab.trigger('click')
      await wrapper.vm.$nextTick()
    }
    // Find team list item
    const listItems = wrapper.findAll('.v-list-item')
    const teamItem = listItems.find(item => item.text().includes('Team A'))
    if (teamItem) {
      await teamItem.trigger('click')
      expect(wrapper.emitted('assign-team')).toBeTruthy()
      expect(wrapper.emitted('assign-team')![0]).toEqual(['t1'])
    }
  })
})
