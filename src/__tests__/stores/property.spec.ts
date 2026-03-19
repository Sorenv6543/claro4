import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePropertyStore } from '@/stores/property';
import type { Property } from '@/types';

function makeProperty(overrides: Partial<Property> = {}): Property {
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
    ...overrides,
  };
}

describe('Property Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and set it as active for testing
    setActivePinia(createPinia());
  });

  it('should start with empty properties collection', () => {
    const store = usePropertyStore();
    expect(store.properties.size).toBe(0);
    expect(store.propertiesArray.length).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should add properties to the Map', async () => {
    const store = usePropertyStore();
    const property = makeProperty();

    await store.addProperty(property);
    expect(store.properties.size).toBe(1);
    expect(store.properties.get('prop1')).toEqual(property);
    expect(store.propertiesArray.length).toBe(1);
  });

  it('should update properties in the Map', async () => {
    const store = usePropertyStore();
    const property = makeProperty();

    await store.addProperty(property);
    await store.updateProperty('prop1', {
      address_street: '999 Updated Blvd',
      cleaning_duration: 150
    });

    const updated = store.properties.get('prop1');
    expect(updated?.address_street).toBe('999 Updated Blvd');
    expect(updated?.cleaning_duration).toBe(150);
    expect(updated?.updated_at).toBeDefined();
  });

  it('should remove properties from the Map', async () => {
    const store = usePropertyStore();
    const property = makeProperty();

    await store.addProperty(property);
    expect(store.properties.size).toBe(1);

    await store.removeProperty('prop1');
    expect(store.properties.size).toBe(0);
    expect(store.properties.get('prop1')).toBeUndefined();
  });

  it('should filter active properties', async () => {
    const store = usePropertyStore();

    await store.addProperty(makeProperty({ id: 'prop1', active: true, address_street: '123 Main St' }));
    await store.addProperty(makeProperty({ id: 'prop2', active: false, address_street: '456 Side St' }));

    expect(store.properties.size).toBe(2);
    expect(store.activeProperties.length).toBe(1);
    expect(store.activeProperties[0].address_street).toBe('123 Main St');
  });

  it('should filter properties by pricing tier', async () => {
    const store = usePropertyStore();

    await store.addProperty(makeProperty({ id: 'prop1', pricing_tier: 'basic', cleaning_duration: 90 }));
    await store.addProperty(makeProperty({ id: 'prop2', pricing_tier: 'premium', address_street: '456 Side St' }));
    await store.addProperty(makeProperty({ id: 'prop3', owner_id: 'owner2', pricing_tier: 'luxury', cleaning_duration: 180 }));

    expect(store.properties.size).toBe(3);
    expect(store.propertiesByPricingTier('basic').size).toBe(1);
    expect(store.propertiesByPricingTier('premium').size).toBe(1);
    expect(store.propertiesByPricingTier('luxury').size).toBe(1);
    expect(Array.from(store.propertiesByPricingTier('basic').values())[0].address_street).toBe('123 Main St');
  });

  it('should filter properties by owner', async () => {
    const store = usePropertyStore();

    await store.addProperty(makeProperty({ id: 'prop1', owner_id: 'owner1' }));
    await store.addProperty(makeProperty({ id: 'prop2', owner_id: 'owner1', address_street: '456 Side St' }));
    await store.addProperty(makeProperty({ id: 'prop3', owner_id: 'owner2', address_street: '789 Ocean Dr' }));

    expect(store.propertiesByOwner('owner1').size).toBe(2);
    expect(store.propertiesByOwner('owner2').size).toBe(1);
    expect(store.propertiesByOwner('owner3').size).toBe(0);
  });

  it('should clear all properties', async () => {
    const store = usePropertyStore();

    await store.addProperty(makeProperty({ id: 'prop1' }));
    await store.addProperty(makeProperty({ id: 'prop2', address_street: '456 Side St' }));

    expect(store.properties.size).toBe(2);

    store.clearAll();
    expect(store.properties.size).toBe(0);
    expect(store.propertiesArray.length).toBe(0);
  });
});
