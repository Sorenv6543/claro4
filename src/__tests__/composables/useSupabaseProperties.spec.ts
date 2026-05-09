import type { Property, PropertyFormData } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Helper to build a valid PropertyFormData
function makeFormData (overrides: Partial<PropertyFormData> = {}): PropertyFormData {
  return {
    owner_id: 'owner-1',
    address_street: '123 Main St',
    address_city: 'Austin',
    address_state: 'TX',
    address_zip: '78701',
    cleaning_duration: 120,
    pricing_tier: 'standard',
    active: true,
    color: '#3F51B5',
    ...overrides,
  }
}

// Helper to build a full Property object
function makeProperty (overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop-1',
    owner_id: 'owner-1',
    address_street: '123 Main St',
    address_city: 'Austin',
    address_state: 'TX',
    address_zip: '78701',
    cleaning_duration: 120,
    pricing_tier: 'standard',
    active: true,
    color: '#3F51B5',
    created_at: '2026-03-20T00:00:00.000Z',
    updated_at: '2026-03-20T00:00:00.000Z',
    ...overrides,
  }
}

/**
 * Mock for `.select('*').order(...).limit(...)` chain used by fetchAndSubscribe.
 * Returns a vi.fn so callers can still assert with `expect(selectMock).toHaveBeenCalledWith('*')`.
 */
function chainableSelect (resolveValue: { data: unknown, error: unknown }) {
  const limitMock = vi.fn().mockResolvedValue(resolveValue)
  const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
  return vi.fn().mockReturnValue({ order: orderMock })
}

describe('useSupabaseProperties', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())

    // Dynamically import supabase to get the mocked version
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper to dynamically import the composable (fresh module state each time)
  async function getComposable () {
    const mod = await import('@/composables/supabase/useSupabaseProperties')
    return mod.useSupabaseProperties()
  }

  // Helper to dynamically import the property store
  async function getPropertyStore () {
    const mod = await import('@/stores/property')
    return mod.usePropertyStore()
  }

  describe('fetchAndSubscribe', () => {
    it('populates the store with fetched properties', async () => {
      const properties = [
        makeProperty({ id: 'p1' }),
        makeProperty({ id: 'p2' }),
      ]

      // Configure the supabase chain to return properties
      const selectMock = chainableSelect({ data: properties, error: null })
      supabaseMock.from.mockReturnValue({
        select: selectMock,
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      // Mock channel subscription
      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await composable.fetchAndSubscribe()

      expect(supabaseMock.from).toHaveBeenCalledWith('properties')
      expect(selectMock).toHaveBeenCalledWith('*')
      expect(store.properties.size).toBe(2)
      expect(store.properties.get('p1')).toEqual(properties[0])
      expect(store.properties.get('p2')).toEqual(properties[1])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets store error on fetch failure', async () => {
      const selectMock = chainableSelect({
        data: null,
        error: { message: 'Network error' },
      })
      supabaseMock.from.mockReturnValue({
        select: selectMock,
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await expect(composable.fetchAndSubscribe()).rejects.toBeTruthy()

      expect(store.properties.size).toBe(0)
      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
    })
  })

  describe('createProperty', () => {
    it('optimistically adds property to store before Supabase resolves', async () => {
      // Make insert return a promise that we control
      let resolveInsert!: (value: any) => void
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve
      })

      const insertMock = vi.fn().mockReturnValue(insertPromise)
      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: insertMock,
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      const formData = makeFormData()
      const createPromise = composable.createProperty(formData)

      // Store should have the property BEFORE supabase resolves
      expect(store.properties.size).toBe(1)
      const [optimisticProperty] = Array.from(store.properties.values())
      expect(optimisticProperty.address_street).toBe('123 Main St')
      expect(optimisticProperty.active).toBe(true)

      // Now resolve supabase
      resolveInsert({ data: null, error: null })
      const result = await createPromise

      expect(result.address_street).toBe('123 Main St')
      expect(store.properties.size).toBe(1)
    })

    it('rolls back on Supabase error', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })
      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: insertMock,
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      const formData = makeFormData()

      await expect(composable.createProperty(formData)).rejects.toThrow()

      // Store should NOT have the property after rollback
      expect(store.properties.size).toBe(0)
    })
  })

  describe('updateProperty', () => {
    it('optimistically updates the store and succeeds', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      // Seed a property in the store
      const existing = makeProperty({ id: 'u1', special_instructions: 'old notes' })
      store.setProperty('u1', existing)

      const result = await composable.updateProperty('u1', { special_instructions: 'new notes' })

      expect(result.special_instructions).toBe('new notes')
      expect(store.properties.get('u1')?.special_instructions).toBe('new notes')
      expect(updateMock).toHaveBeenCalledWith({ special_instructions: 'new notes' })
      expect(eqMock).toHaveBeenCalledWith('id', 'u1')
    })

    it('rolls back on Supabase error', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      const existing = makeProperty({ id: 'u2', special_instructions: 'original' })
      store.setProperty('u2', existing)

      await expect(composable.updateProperty('u2', { special_instructions: 'changed' })).rejects.toThrow()

      // Should have rolled back to original
      expect(store.properties.get('u2')?.special_instructions).toBe('original')
    })

    it('throws when property not found', async () => {
      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()

      await expect(composable.updateProperty('nonexistent', { special_instructions: 'x' })).rejects.toThrow('Property not found')
    })
  })

  describe('deleteProperty (hard delete)', () => {
    it('optimistically removes from store and succeeds', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: deleteMock,
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      const existing = makeProperty({ id: 'd1' })
      store.setProperty('d1', existing)
      expect(store.properties.size).toBe(1)

      await composable.deleteProperty('d1')

      expect(store.properties.size).toBe(0)
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 'd1')
    })

    it('rolls back on Supabase error', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: deleteMock,
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      const existing = makeProperty({ id: 'd2' })
      store.setProperty('d2', existing)

      await expect(composable.deleteProperty('d2')).rejects.toThrow()

      // Should have rolled back — property is back in the store
      expect(store.properties.size).toBe(1)
      expect(store.properties.get('d2')).toEqual(existing)
    })

    it('throws when property not found', async () => {
      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()

      await expect(composable.deleteProperty('nonexistent')).rejects.toThrow('Property not found')
    })
  })

  describe('realtime handling', () => {
    it('skips realtime INSERT for an optimistically-created property while CRUD in-flight', async () => {
      // Use a controlled promise so we can fire the realtime event DURING the insert
      let resolveInsert!: (value: any) => void
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve
      })
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockReturnValue(insertPromise),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((_type: string, _filter: any, callback: any) => {
          realtimeCallback = callback
          return {
            subscribe: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
          }
        }),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await composable.fetchAndSubscribe()

      // Start creating — don't await yet
      const formData = makeFormData()
      const createPromise = composable.createProperty(formData)

      // Property is in store optimistically
      expect(store.properties.size).toBe(1)
      const optimisticId = Array.from(store.properties.keys())[0]

      // Fire realtime event WHILE insert is still pending — should be skipped
      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'INSERT',
        new: { ...store.properties.get(optimisticId), special_instructions: 'from-realtime', active: true },
        old: null,
      })

      // Store should still have the original optimistic version
      expect(store.properties.get(optimisticId)?.special_instructions).not.toBe('from-realtime')

      // Now resolve the insert
      resolveInsert({ data: null, error: null })
      await createPromise

      expect(store.properties.size).toBe(1)
    })

    it('applies realtime INSERT for a non-optimistic active property', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((_type: string, _filter: any, callback: any) => {
          realtimeCallback = callback
          return {
            subscribe: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
          }
        }),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await composable.fetchAndSubscribe()

      // Simulate a realtime INSERT for a property we did NOT create optimistically
      const externalProperty = makeProperty({ id: 'external-1', special_instructions: 'from-another-client', active: true })

      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'INSERT',
        new: externalProperty,
        old: null,
      })

      // Store should have the property
      expect(store.properties.size).toBe(1)
      expect(store.properties.get('external-1')?.special_instructions).toBe('from-another-client')
    })

    it('does NOT apply realtime INSERT for inactive property', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((_type: string, _filter: any, callback: any) => {
          realtimeCallback = callback
          return {
            subscribe: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
          }
        }),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await composable.fetchAndSubscribe()

      // Simulate a realtime INSERT for an inactive property
      const inactiveProperty = makeProperty({ id: 'inactive-1', active: false })

      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'INSERT',
        new: inactiveProperty,
        old: null,
      })

      // Store should NOT have the inactive property
      expect(store.properties.size).toBe(0)
    })

    it('removes property from store on realtime UPDATE with active=false', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((_type: string, _filter: any, callback: any) => {
          realtimeCallback = callback
          return {
            subscribe: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
          }
        }),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await composable.fetchAndSubscribe()

      // Seed a property in the store
      const existing = makeProperty({ id: 'rt-1', active: true })
      store.setProperty('rt-1', existing)
      expect(store.properties.size).toBe(1)

      // Simulate realtime UPDATE with active=false (soft delete by another client)
      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'UPDATE',
        new: { ...existing, active: false },
        old: existing,
      })

      // Property should be removed from store
      expect(store.properties.size).toBe(0)
    })

    it('updates property in store on realtime UPDATE with active=true', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((_type: string, _filter: any, callback: any) => {
          realtimeCallback = callback
          return {
            subscribe: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
          }
        }),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getPropertyStore()

      await composable.fetchAndSubscribe()

      // Seed a property in the store
      const existing = makeProperty({ id: 'rt-2', special_instructions: 'old', active: true })
      store.setProperty('rt-2', existing)

      // Simulate realtime UPDATE with new data
      const updatedProperty = { ...existing, special_instructions: 'new', active: true }
      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'UPDATE',
        new: updatedProperty,
        old: existing,
      })

      // Property should be updated
      expect(store.properties.get('rt-2')?.special_instructions).toBe('new')
    })
  })

  describe('unsubscribe', () => {
    it('removes the channel and resets connection status', async () => {
      supabaseMock.from.mockReturnValue({
        select: chainableSelect({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      }
      supabaseMock.channel = vi.fn().mockReturnValue(mockChannel)
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()

      // Subscribe first
      await composable.fetchAndSubscribe()

      // Now unsubscribe
      composable.unsubscribe()

      expect(supabaseMock.removeChannel).toHaveBeenCalledWith(mockChannel)
      expect(composable.connectionStatus.value).toBe('disconnected')
    })
  })
})
