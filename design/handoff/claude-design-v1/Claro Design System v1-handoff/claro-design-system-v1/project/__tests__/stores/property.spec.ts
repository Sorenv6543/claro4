import type { Property } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePropertyStore } from '@/stores/property'

function makeProperty (overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop1',
    owner_id: 'owner1',
    address_street: '123 Main St',
    address_city: 'Austin',
    address_state: 'TX',
    address_zip: '78701',
    cleaning_duration: 120,
    pricing_tier: 'premium',
    active: true,
    color: '#5c6bc0',
    ...overrides,
  }
}

describe('Property Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and set it as active for testing
    setActivePinia(createPinia())
  })

  it('should start with empty properties collection', () => {
    const store = usePropertyStore()
    expect(store.properties.size).toBe(0)
    expect(store.propertiesArray.length).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should add properties to the Map via setProperty', () => {
    const store = usePropertyStore()
    const property = makeProperty()

    store.setProperty(property.id, property)
    expect(store.properties.size).toBe(1)
    expect(store.properties.get('prop1')).toEqual(property)
    expect(store.propertiesArray.length).toBe(1)
  })

  it('should bulk-set properties via setProperties', () => {
    const store = usePropertyStore()
    const props = [
      makeProperty({ id: 'prop1' }),
      makeProperty({ id: 'prop2', address_street: '456 Side St' }),
      makeProperty({ id: 'prop3', address_street: '789 Ocean Dr' }),
    ]

    store.setProperties(props)
    expect(store.properties.size).toBe(3)
    expect(store.propertiesArray.length).toBe(3)
    expect(store.properties.get('prop2')?.address_street).toBe('456 Side St')
  })

  it('should overwrite existing property via setProperty', () => {
    const store = usePropertyStore()
    const property = makeProperty()

    store.setProperty(property.id, property)
    const updated = makeProperty({
      address_street: '999 Updated Blvd',
      cleaning_duration: 150,
    })
    store.setProperty('prop1', updated)

    const result = store.properties.get('prop1')
    expect(result?.address_street).toBe('999 Updated Blvd')
    expect(result?.cleaning_duration).toBe(150)
  })

  it('should remove properties from the Map', () => {
    const store = usePropertyStore()
    const property = makeProperty()

    store.setProperty(property.id, property)
    expect(store.properties.size).toBe(1)

    store.removeProperty('prop1')
    expect(store.properties.size).toBe(0)
    expect(store.properties.get('prop1')).toBeUndefined()
  })

  it('should filter active properties', () => {
    const store = usePropertyStore()

    store.setProperty('prop1', makeProperty({ id: 'prop1', active: true, address_street: '123 Main St' }))
    store.setProperty('prop2', makeProperty({ id: 'prop2', active: false, address_street: '456 Side St' }))

    expect(store.properties.size).toBe(2)
    expect(store.activeProperties.length).toBe(1)
    expect(store.activeProperties[0].address_street).toBe('123 Main St')
  })

  it('should filter properties by pricing tier', () => {
    const store = usePropertyStore()

    store.setProperty('prop1', makeProperty({ id: 'prop1', pricing_tier: 'basic', cleaning_duration: 90 }))
    store.setProperty('prop2', makeProperty({ id: 'prop2', pricing_tier: 'premium', address_street: '456 Side St' }))
    store.setProperty('prop3', makeProperty({ id: 'prop3', owner_id: 'owner2', pricing_tier: 'luxury', cleaning_duration: 180 }))

    expect(store.properties.size).toBe(3)
    expect(store.propertiesByPricingTier('basic').size).toBe(1)
    expect(store.propertiesByPricingTier('premium').size).toBe(1)
    expect(store.propertiesByPricingTier('luxury').size).toBe(1)
    expect(Array.from(store.propertiesByPricingTier('basic').values())[0].address_street).toBe('123 Main St')
  })

  it('should filter properties by owner', () => {
    const store = usePropertyStore()

    store.setProperty('prop1', makeProperty({ id: 'prop1', owner_id: 'owner1' }))
    store.setProperty('prop2', makeProperty({ id: 'prop2', owner_id: 'owner1', address_street: '456 Side St' }))
    store.setProperty('prop3', makeProperty({ id: 'prop3', owner_id: 'owner2', address_street: '789 Ocean Dr' }))

    expect(store.propertiesByOwner('owner1').size).toBe(2)
    expect(store.propertiesByOwner('owner2').size).toBe(1)
    expect(store.propertiesByOwner('owner3').size).toBe(0)
  })

  it('should clear all properties', () => {
    const store = usePropertyStore()

    store.setProperty('prop1', makeProperty({ id: 'prop1' }))
    store.setProperty('prop2', makeProperty({ id: 'prop2', address_street: '456 Side St' }))

    expect(store.properties.size).toBe(2)

    store.clearAll()
    expect(store.properties.size).toBe(0)
    expect(store.propertiesArray.length).toBe(0)
  })
})
