import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import PropertyColorPicker from '@/components/dumb/owner/PropertyColorPicker.vue'
import { PROPERTY_COLORS } from '@/utils/constants'

const vuetify = createVuetify()

function mountPicker (props = {}) {
  return mount(PropertyColorPicker, {
    props: { modelValue: PROPERTY_COLORS[0], ...props },
    global: { plugins: [vuetify] },
  })
}

describe('PropertyColorPicker', () => {
  it('renders 5 color swatches', () => {
    const wrapper = mountPicker()
    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    expect(swatches).toHaveLength(5)
  })

  it('marks the selected color', () => {
    const wrapper = mountPicker({ modelValue: PROPERTY_COLORS[2] })
    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    const selected = swatches.find(s => s.classes().includes('selected'))
    expect(selected?.attributes('data-color')).toBe(PROPERTY_COLORS[2])
  })

  it('emits update:modelValue on click', async () => {
    const wrapper = mountPicker({ modelValue: PROPERTY_COLORS[0] })
    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    await swatches[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([PROPERTY_COLORS[3]])
  })
})
