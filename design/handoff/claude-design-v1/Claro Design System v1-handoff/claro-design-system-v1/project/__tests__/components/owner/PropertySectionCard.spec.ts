import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import PropertySectionCard from '@/components/dumb/owner/PropertySectionCard.vue'

const vuetify = createVuetify()

function mountCard (props = {}, slots = {}) {
  return mount(PropertySectionCard, {
    props: { title: 'Test Section', icon: 'mdi-home', ...props },
    slots: { default: '<div>view content</div>', edit: '<div>edit content</div>', ...slots },
    global: { plugins: [vuetify] },
  })
}

describe('PropertySectionCard', () => {
  it('renders title and icon', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Test Section')
  })

  it('shows view slot by default', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('view content')
    expect(wrapper.text()).not.toContain('edit content')
  })

  it('shows edit slot when editing=true', () => {
    const wrapper = mountCard({ editing: true })
    expect(wrapper.text()).toContain('edit content')
  })

  it('emits edit when pencil clicked', async () => {
    const wrapper = mountCard()
    const editBtn = wrapper.find('[data-testid="section-edit-btn"]')
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('emits save and cancel from edit mode', async () => {
    const wrapper = mountCard({ editing: true })
    await wrapper.find('[data-testid="section-save-btn"]').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    await wrapper.find('[data-testid="section-cancel-btn"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('hides edit button when readonly', () => {
    const wrapper = mountCard({ readonly: true })
    expect(wrapper.find('[data-testid="section-edit-btn"]').exists()).toBe(false)
  })

  it('disables save when saveDisabled is true', () => {
    const wrapper = mountCard({ editing: true, saveDisabled: true })
    const saveBtn = wrapper.find('[data-testid="section-save-btn"]')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })
})
