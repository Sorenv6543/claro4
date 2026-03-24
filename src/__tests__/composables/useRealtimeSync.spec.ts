import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock useSupabaseBookings at module level
const mockInitBookings = vi.fn().mockResolvedValue(undefined)
const mockTeardownBookings = vi.fn()
const mockBookingStatus = { value: 'disconnected' as string }

vi.mock('@/composables/supabase/useSupabaseBookings', () => ({
  useSupabaseBookings: () => ({
    fetchAndSubscribe: mockInitBookings,
    unsubscribe: mockTeardownBookings,
    connectionStatus: mockBookingStatus,
  }),
}))

// Mock useSupabaseProperties at module level
const mockInitProperties = vi.fn().mockResolvedValue(undefined)
const mockTeardownProperties = vi.fn()
const mockPropertyStatus = { value: 'disconnected' as string }

vi.mock('@/composables/supabase/useSupabaseProperties', () => ({
  useSupabaseProperties: () => ({
    fetchAndSubscribe: mockInitProperties,
    unsubscribe: mockTeardownProperties,
    connectionStatus: mockPropertyStatus,
  }),
}))

describe('useRealtimeSync', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())

    // Reset mock state
    mockInitBookings.mockClear()
    mockTeardownBookings.mockClear()
    mockBookingStatus.value = 'disconnected'

    mockInitProperties.mockClear()
    mockTeardownProperties.mockClear()
    mockPropertyStatus.value = 'disconnected'

    // Get the global supabase mock
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase

    // Set up channel mock for profile subscription
    supabaseMock.channel = vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
    supabaseMock.removeChannel = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper to dynamically import the composable (fresh module state each time)
  async function getComposable() {
    const mod = await import('@/composables/supabase/useRealtimeSync')
    return mod.useRealtimeSync()
  }

  async function getPropertyStore() {
    const mod = await import('@/stores/property')
    return mod.usePropertyStore()
  }

  async function getBookingStore() {
    const mod = await import('@/stores/booking')
    return mod.useBookingStore()
  }

  describe('init', () => {
    it('calls fetchAndSubscribe on bookings', async () => {
      const composable = await getComposable()

      await composable.init()

      expect(mockInitBookings).toHaveBeenCalledOnce()
    })

    it('calls fetchAndSubscribe on properties', async () => {
      const composable = await getComposable()

      await composable.init()

      expect(mockInitProperties).toHaveBeenCalledOnce()
    })

    it('subscribes to profile changes', async () => {
      const composable = await getComposable()

      await composable.init()

      expect(supabaseMock.channel).toHaveBeenCalledWith('user-profile-changes')
    })
  })

  describe('teardown', () => {
    it('calls unsubscribe on bookings', async () => {
      const composable = await getComposable()

      composable.teardown()

      expect(mockTeardownBookings).toHaveBeenCalledOnce()
    })

    it('calls unsubscribe on properties', async () => {
      const composable = await getComposable()

      composable.teardown()

      expect(mockTeardownProperties).toHaveBeenCalledOnce()
    })

    it('clears booking store', async () => {
      const bookingStore = await getBookingStore()
      const clearSpy = vi.spyOn(bookingStore, 'clearAll')

      const composable = await getComposable()

      composable.teardown()

      expect(clearSpy).toHaveBeenCalledOnce()
    })

    it('clears property store', async () => {
      const propertyStore = await getPropertyStore()
      const clearSpy = vi.spyOn(propertyStore, 'clearAll')

      const composable = await getComposable()

      composable.teardown()

      expect(clearSpy).toHaveBeenCalledOnce()
    })

    it('removes profile channel if subscribed', async () => {
      const composable = await getComposable()

      // Init to create the profile channel
      await composable.init()

      // Teardown should remove the channel
      composable.teardown()

      expect(supabaseMock.removeChannel).toHaveBeenCalled()
    })
  })

  describe('connectionStatus', () => {
    it('returns connected when both booking and property status are connected', async () => {
      mockBookingStatus.value = 'connected'
      mockPropertyStatus.value = 'connected'

      const composable = await getComposable()

      expect(composable.connectionStatus.value).toBe('connected')
    })

    it('returns connecting when booking status is connecting', async () => {
      mockBookingStatus.value = 'connecting'
      mockPropertyStatus.value = 'disconnected'

      const composable = await getComposable()

      expect(composable.connectionStatus.value).toBe('connecting')
    })

    it('returns connecting when property status is connecting', async () => {
      mockBookingStatus.value = 'connected'
      mockPropertyStatus.value = 'connecting'

      const composable = await getComposable()

      expect(composable.connectionStatus.value).toBe('connecting')
    })

    it('returns disconnected when both are disconnected', async () => {
      mockBookingStatus.value = 'disconnected'
      mockPropertyStatus.value = 'disconnected'

      const composable = await getComposable()

      expect(composable.connectionStatus.value).toBe('disconnected')
    })

    it('returns disconnected when one is connected and one is disconnected', async () => {
      mockBookingStatus.value = 'connected'
      mockPropertyStatus.value = 'disconnected'

      const composable = await getComposable()

      expect(composable.connectionStatus.value).toBe('disconnected')
    })
  })

  describe('isOnline', () => {
    it('reflects navigator.onLine initial value', async () => {
      const composable = await getComposable()

      // In test environment navigator.onLine defaults to true
      expect(composable.isOnline.value).toBe(navigator.onLine)
    })
  })
})
