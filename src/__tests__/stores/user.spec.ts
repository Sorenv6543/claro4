import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'
import { useUserStore } from '@/stores/user'
import { setAdminUser, setOwnerUser } from '../utils/test-utils'

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start with null user and default settings', () => {
    const store = useUserStore()
    expect(store.currentUser).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.settings.notifications).toBe(true)
    expect(store.settings.theme).toBe('light')
    expect(store.settings.timezone).toBe('America/New_York')
  })

  it('should provide user-filtered properties for owner', () => {
    const store = useUserStore()
    const propertyStore = usePropertyStore()
    const authStore = useAuthStore()

    setOwnerUser(authStore as any, 'owner1')

    propertyStore.setProperty('prop1', {
      id: 'prop1',
      owner_id: 'owner1',
      name: 'Owner House',
      address: '123 Owner St',
      cleaning_duration: 120,
      pricing_tier: 'standard',
      active: true,
      color: '#5c6bc0',
    } as any)

    propertyStore.setProperty('prop2', {
      id: 'prop2',
      owner_id: 'other_owner',
      name: 'Other House',
      address: '456 Other St',
      cleaning_duration: 90,
      pricing_tier: 'premium',
      active: true,
      color: '#5c6bc0',
    } as any)

    if (Array.isArray(store.userProperties)) {
      expect(store.userProperties.length).toBe(1)
      expect(store.userProperties[0].owner_id).toBe('owner1')
    } else {
      expect(store.userProperties.size).toBe(1)
      expect(Array.from(store.userProperties.values())[0].owner_id).toBe('owner1')
    }
    expect(store.userActiveProperties.size).toBe(1)
  })

  it('should provide all properties for admin', () => {
    const store = useUserStore()
    const propertyStore = usePropertyStore()
    const authStore = useAuthStore()

    setAdminUser(authStore as any, 'admin1')

    propertyStore.setProperty('prop1', {
      id: 'prop1',
      owner_id: 'owner1',
      name: 'House 1',
      address: '123 Street',
      cleaning_duration: 120,
      pricing_tier: 'standard',
      active: true,
      color: '#5c6bc0',
    } as any)

    propertyStore.setProperty('prop2', {
      id: 'prop2',
      owner_id: 'owner2',
      name: 'House 2',
      address: '456 Avenue',
      cleaning_duration: 90,
      pricing_tier: 'premium',
      active: true,
      color: '#5c6bc0',
    } as any)

    expect(store.userProperties).toHaveLength(2)
  })

  it('should provide user-filtered bookings for owner', () => {
    const store = useUserStore()
    const bookingStore = useBookingStore()
    const authStore = useAuthStore()

    setOwnerUser(authStore as any, 'owner1')

    bookingStore.setBooking('booking1', {
      id: 'booking1',
      property_id: 'prop1',
      owner_id: 'owner1',
      checkout_date: '2023-06-01T11:00:00Z',
      checkin_date: '2023-06-03T15:00:00Z',
      booking_type: 'standard',
      status: 'pending',
    } as any)

    bookingStore.setBooking('booking2', {
      id: 'booking2',
      property_id: 'prop2',
      owner_id: 'other_owner',
      checkout_date: '2023-06-01T11:00:00Z',
      checkin_date: '2023-06-01T15:00:00Z',
      booking_type: 'turn',
      status: 'scheduled',
    } as any)

    if (Array.isArray(store.userBookings)) {
      expect(store.userBookings.length).toBe(1)
      expect(store.userBookings[0].owner_id).toBe('owner1')
    } else {
      expect(store.userBookings.size).toBe(1)
      expect(Array.from(store.userBookings.values())[0].owner_id).toBe('owner1')
    }
  })

  it('should manage favorite properties', () => {
    const store = useUserStore()
    const propertyStore = usePropertyStore()
    const authStore = useAuthStore()

    setOwnerUser(authStore as any, 'owner1')

    propertyStore.setProperty('prop1', {
      id: 'prop1',
      owner_id: 'owner1',
      name: 'Beach House',
      address: '123 Ocean Ave',
      cleaning_duration: 120,
      pricing_tier: 'premium',
      active: true,
      color: '#5c6bc0',
    } as any)

    expect(store.favoriteProperties.size).toBe(0)
    store.toggleFavoriteProperty('prop1')
    expect(store.favoriteProperties.size).toBe(1)
    expect(Array.from(store.favoriteProperties.values())[0].id).toBe('prop1')
    store.toggleFavoriteProperty('prop1')
    expect(store.favoriteProperties.size).toBe(0)
  })

  it('should check permissions correctly', () => {
    const store = useUserStore()
    const authStore = useAuthStore()

    // Test owner permissions
    setOwnerUser(authStore as any, 'owner1')

    expect(store.hasPermission('view', 'property')).toBe(true)
    expect(store.hasPermission('view', 'booking')).toBe(true)
    expect(store.hasPermission('edit', 'property', 'owner1')).toBe(true)
    expect(store.hasPermission('edit', 'property', 'other_owner')).toBe(false)
    expect(store.hasPermission('delete', 'booking', 'owner1')).toBe(true)
    expect(store.hasPermission('delete', 'booking', 'other_owner')).toBe(false)

    // Test admin permissions
    setAdminUser(authStore as any, 'admin1')

    expect(store.hasPermission('view', 'property')).toBe(true)
    expect(store.hasPermission('edit', 'property', 'any_owner')).toBe(true)
    expect(store.hasPermission('delete', 'booking', 'any_owner')).toBe(true)
  })

  it('should clear preferences', () => {
    const store = useUserStore()

    store.toggleFavoriteProperty('prop1')
    store.addRecentlyViewedProperty('prop2')

    expect(store.viewPreferences.favoriteProperties.size).toBe(1)
    expect(store.viewPreferences.recentlyViewedProperties).toHaveLength(1)

    store.clearUserPreferences()

    expect(store.viewPreferences.favoriteProperties.size).toBe(0)
    expect(store.viewPreferences.recentlyViewedProperties).toHaveLength(0)
  })
})
