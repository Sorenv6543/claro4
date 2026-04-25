import type { Booking, BookingFormData } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Helper to build a valid BookingFormData
function makeFormData (overrides: Partial<BookingFormData> = {}): BookingFormData {
  return {
    property_id: 'prop-1',
    owner_id: 'owner-1',
    checkin_date: '2026-04-01',
    checkout_date: '2026-04-05',
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard',
    status: 'pending',
    priority: 'normal',
    ...overrides,
  }
}

// Helper to build a full Booking object
function makeBooking (overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    property_id: 'prop-1',
    owner_id: 'owner-1',
    checkin_date: '2026-04-01',
    checkout_date: '2026-04-05',
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard',
    status: 'pending',
    priority: 'normal',
    guest_count: null,
    notes: null,
    assigned_cleaner_id: null,
    turn_date: null,
    turn_start_time: null,
    turn_checkin_time: null,
    created_at: '2026-03-20T00:00:00.000Z',
    updated_at: '2026-03-20T00:00:00.000Z',
    ...overrides,
  }
}

// We need to create per-test mock state so each test gets fresh supabase chain mocks.
// The global setupTests.ts already mocks @/plugins/supabase, so we access it via import.
// Because module-level singleton state exists in useSupabaseBookings, we use
// vi.resetModules() + dynamic import to get fresh module state per test.

describe('useSupabaseBookings', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())

    // Mock auth store so subscribe() has an authenticated user
    vi.doMock('@/stores/auth', () => ({
      useAuthStore: () => ({
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Test Admin', role: 'admin' },
        isAdmin: true,
        isOwner: false,
        isCleaner: false,
      }),
    }))

    // Dynamically import supabase to get the mocked version
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper to dynamically import the composable (fresh module state each time)
  async function getComposable () {
    const mod = await import('@/composables/supabase/useSupabaseBookings')
    return mod.useSupabaseBookings()
  }

  // Helper to dynamically import the booking store
  async function getBookingStore () {
    const mod = await import('@/stores/booking')
    return mod.useBookingStore()
  }

  describe('fetchAndSubscribe', () => {
    it('populates the store with fetched bookings', async () => {
      const bookings = [
        makeBooking({ id: 'b1' }),
        makeBooking({ id: 'b2' }),
      ]

      // Configure the supabase chain to return bookings
      const orderMock = vi.fn().mockResolvedValue({ data: bookings, error: null })
      const gteMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ gte: gteMock })
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
      const store = await getBookingStore()

      await composable.fetchAndSubscribe()

      expect(supabaseMock.from).toHaveBeenCalledWith('bookings')
      expect(selectMock).toHaveBeenCalledWith('*')
      expect(orderMock).toHaveBeenCalledWith('checkout_date', { ascending: true })
      expect(store.bookings.size).toBe(2)
      expect(store.bookings.get('b1')).toEqual(bookings[0])
      expect(store.bookings.get('b2')).toEqual(bookings[1])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets store error on fetch failure', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      })
      const gteMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ gte: gteMock })
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
      const store = await getBookingStore()

      await expect(composable.fetchAndSubscribe()).rejects.toBeTruthy()

      expect(store.bookings.size).toBe(0)
      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
    })
  })

  describe('createBooking', () => {
    it('optimistically adds booking to store before Supabase resolves', async () => {
      // Make insert return a promise that we control
      let resolveInsert!: (value: any) => void
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve
      })

      const insertMock = vi.fn().mockReturnValue(insertPromise)
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      const formData = makeFormData()
      const createPromise = composable.createBooking(formData)

      // Store should have the booking BEFORE supabase resolves
      expect(store.bookings.size).toBe(1)
      const [optimisticBooking] = Array.from(store.bookings.values())
      expect(optimisticBooking.property_id).toBe('prop-1')
      expect(optimisticBooking.status).toBe('pending')

      // Now resolve supabase
      resolveInsert({ data: null, error: null })
      const result = await createPromise

      expect(result.property_id).toBe('prop-1')
      expect(store.bookings.size).toBe(1)
    })

    it('rolls back on Supabase error', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      const formData = makeFormData()

      await expect(composable.createBooking(formData)).rejects.toThrow()

      // Store should NOT have the booking after rollback
      expect(store.bookings.size).toBe(0)
    })
  })

  describe('updateBooking', () => {
    it('optimistically updates the store and succeeds', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      // Seed a booking in the store
      const existing = makeBooking({ id: 'u1', notes: 'old notes' })
      store.setBooking('u1', existing)

      const result = await composable.updateBooking('u1', { notes: 'new notes' })

      expect(result.notes).toBe('new notes')
      expect(store.bookings.get('u1')?.notes).toBe('new notes')
      expect(updateMock).toHaveBeenCalledWith({ notes: 'new notes' })
      expect(eqMock).toHaveBeenCalledWith('id', 'u1')
    })

    it('rolls back on Supabase error', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      const existing = makeBooking({ id: 'u2', notes: 'original' })
      store.setBooking('u2', existing)

      await expect(composable.updateBooking('u2', { notes: 'changed' })).rejects.toThrow()

      // Should have rolled back to original
      expect(store.bookings.get('u2')?.notes).toBe('original')
    })

    it('throws when booking not found', async () => {
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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

      await expect(composable.updateBooking('nonexistent', { notes: 'x' })).rejects.toThrow('Booking not found')
    })
  })

  describe('deleteBooking', () => {
    it('optimistically removes from store and succeeds', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      const existing = makeBooking({ id: 'd1' })
      store.setBooking('d1', existing)
      expect(store.bookings.size).toBe(1)

      await composable.deleteBooking('d1')

      expect(store.bookings.size).toBe(0)
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
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      const existing = makeBooking({ id: 'd2' })
      store.setBooking('d2', existing)

      await expect(composable.deleteBooking('d2')).rejects.toThrow()

      // Should have rolled back — booking is back in the store
      expect(store.bookings.size).toBe(1)
      expect(store.bookings.get('d2')).toEqual(existing)
    })

    it('throws when booking not found', async () => {
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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

      await expect(composable.deleteBooking('nonexistent')).rejects.toThrow('Booking not found')
    })
  })

  describe('realtime deduplication', () => {
    it('skips realtime INSERT for an optimistically-created booking while CRUD in-flight', async () => {
      // Use a controlled promise so we can fire the realtime event DURING the insert
      let resolveInsert!: (value: any) => void
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve
      })
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      await composable.fetchAndSubscribe()

      // Start creating — don't await yet
      const formData = makeFormData()
      const createPromise = composable.createBooking(formData)

      // Booking is in store optimistically
      expect(store.bookings.size).toBe(1)
      const optimisticId = Array.from(store.bookings.keys())[0]

      // Fire realtime event WHILE insert is still pending — should be skipped
      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'INSERT',
        new: { ...store.bookings.get(optimisticId), notes: 'from-realtime' },
        old: null,
      })

      // Store should still have the original optimistic version
      expect(store.bookings.get(optimisticId)?.notes).not.toBe('from-realtime')

      // Now resolve the insert
      resolveInsert({ data: null, error: null })
      await createPromise

      expect(store.bookings.size).toBe(1)
    })

    it('applies realtime INSERT for a non-optimistic booking', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      await composable.fetchAndSubscribe()

      // Simulate a realtime INSERT for a booking we did NOT create optimistically
      const externalBooking = makeBooking({ id: 'external-1', notes: 'from-another-client' })

      expect(realtimeCallback).not.toBeNull()
      realtimeCallback!({
        eventType: 'INSERT',
        new: externalBooking,
        old: null,
      })

      // Store should have the booking
      expect(store.bookings.size).toBe(1)
      expect(store.bookings.get('external-1')?.notes).toBe('from-another-client')
    })
  })

  describe('changeBookingStatus', () => {
    it('transitions valid status', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      // pending -> scheduled is valid
      const existing = makeBooking({ id: 's1', status: 'pending' })
      store.setBooking('s1', existing)

      const result = await composable.changeBookingStatus('s1', 'scheduled')

      expect(result.status).toBe('scheduled')
      expect(store.bookings.get('s1')?.status).toBe('scheduled')
    })

    it('rejects invalid status transition', async () => {
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      // completed -> in_progress is NOT valid (completed is terminal)
      const existing = makeBooking({ id: 's2', status: 'completed' })
      store.setBooking('s2', existing)

      await expect(composable.changeBookingStatus('s2', 'in_progress'))
        .rejects
        .toThrow('Cannot transition from completed to in_progress')
    })
  })

  describe('assignCleaner', () => {
    it('assigns a cleaner via updateBooking', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
      const store = await getBookingStore()

      const existing = makeBooking({ id: 'a1', assigned_cleaner_id: null })
      store.setBooking('a1', existing)

      const result = await composable.assignCleaner('a1', 'cleaner-42')

      expect(result.assigned_cleaner_id).toBe('cleaner-42')
      expect(store.bookings.get('a1')?.assigned_cleaner_id).toBe('cleaner-42')
    })
  })

  describe('bulkAssignCleaner', () => {
    /**
     * Helper that wires up a supabase chain whose update().in() resolves
     * with the supplied result. Returns the inner mocks so tests can
     * assert what was called with which arguments.
     */
    function wireBulkUpdateChain (result: { data: unknown, error: unknown }) {
      const inMock = vi.fn().mockResolvedValue(result)
      const updateMock = vi.fn().mockReturnValue({ in: inMock })
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })
      supabaseMock.removeChannel = vi.fn()
      return { updateMock, inMock }
    }

    it('skips bookings with assigned_team_id and only sends eligible ids to SQL', async () => {
      const { updateMock, inMock } = wireBulkUpdateChain({ data: null, error: null })

      const composable = await getComposable()
      const store = await getBookingStore()

      store.setBooking('b1', makeBooking({ id: 'b1', assigned_team_id: 'team-1', assigned_cleaner_id: null }))
      store.setBooking('b2', makeBooking({ id: 'b2', assigned_cleaner_id: null }))

      const result = await composable.bulkAssignCleaner(['b1', 'b2'], 'cleaner-X')

      expect(result.skipped).toEqual([
        { id: 'b1', reason: 'has conflicting team/group assignment' },
      ])
      expect(result.updated).toHaveLength(1)
      expect(result.updated[0].id).toBe('b2')
      expect(updateMock).toHaveBeenCalledWith({ assigned_cleaner_id: 'cleaner-X' })
      expect(inMock).toHaveBeenCalledWith('id', ['b2'])
    })

    it('skips bookings with non-empty assigned_group_ids', async () => {
      const { inMock } = wireBulkUpdateChain({ data: null, error: null })

      const composable = await getComposable()
      const store = await getBookingStore()

      store.setBooking('g1', makeBooking({ id: 'g1', assigned_group_ids: ['group-1'], assigned_cleaner_id: null }))
      store.setBooking('g2', makeBooking({ id: 'g2', assigned_group_ids: [], assigned_cleaner_id: null })) // empty array → eligible

      const result = await composable.bulkAssignCleaner(['g1', 'g2'], 'cleaner-X')

      expect(result.skipped).toEqual([
        { id: 'g1', reason: 'has conflicting team/group assignment' },
      ])
      expect(result.updated.map(b => b.id)).toEqual(['g2'])
      expect(inMock).toHaveBeenCalledWith('id', ['g2'])
    })

    it('skips bookings not present in the local store', async () => {
      const { inMock } = wireBulkUpdateChain({ data: null, error: null })

      const composable = await getComposable()
      const store = await getBookingStore()

      store.setBooking('present', makeBooking({ id: 'present', assigned_cleaner_id: null }))

      const result = await composable.bulkAssignCleaner(['present', 'missing'], 'cleaner-X')

      expect(result.skipped).toEqual([
        { id: 'missing', reason: 'not found in local store' },
      ])
      expect(result.updated.map(b => b.id)).toEqual(['present'])
      expect(inMock).toHaveBeenCalledWith('id', ['present'])
    })

    it('returns early without calling SQL when every booking is skipped', async () => {
      const { updateMock, inMock } = wireBulkUpdateChain({ data: null, error: null })

      const composable = await getComposable()
      const store = await getBookingStore()

      store.setBooking('all-team', makeBooking({ id: 'all-team', assigned_team_id: 'team-1', assigned_cleaner_id: null }))

      const result = await composable.bulkAssignCleaner(['all-team', 'also-missing'], 'cleaner-X')

      expect(result.updated).toHaveLength(0)
      expect(result.skipped.map(s => s.id).sort()).toEqual(['all-team', 'also-missing'].sort())
      expect(updateMock).not.toHaveBeenCalled()
      expect(inMock).not.toHaveBeenCalled()
    })

    it('optimistically updates store and resolves with all eligible bookings on success', async () => {
      wireBulkUpdateChain({ data: null, error: null })

      const composable = await getComposable()
      const store = await getBookingStore()

      for (const id of ['s1', 's2', 's3']) {
        store.setBooking(id, makeBooking({ id, assigned_cleaner_id: null }))
      }

      const result = await composable.bulkAssignCleaner(['s1', 's2', 's3'], 'cleaner-Y')

      expect(result.updated).toHaveLength(3)
      expect(result.skipped).toHaveLength(0)
      for (const id of ['s1', 's2', 's3']) {
        expect(store.bookings.get(id)?.assigned_cleaner_id).toBe('cleaner-Y')
      }
    })

    it('rolls back ALL optimistic updates and throws BulkAssignSqlError on SQL failure', async () => {
      wireBulkUpdateChain({ data: null, error: { message: 'SQL UPDATE failed' } })

      const mod = await import('@/composables/supabase/useSupabaseBookings')
      const composable = mod.useSupabaseBookings()
      const store = await getBookingStore()

      for (const id of ['r1', 'r2', 'r3']) {
        store.setBooking(id, makeBooking({ id, assigned_cleaner_id: null }))
      }

      await expect(composable.bulkAssignCleaner(['r1', 'r2', 'r3'], 'cleaner-Z'))
        .rejects.toBeInstanceOf(mod.BulkAssignSqlError)

      // All three optimistic updates must be rolled back
      for (const id of ['r1', 'r2', 'r3']) {
        expect(store.bookings.get(id)?.assigned_cleaner_id).toBeNull()
      }
    })

    it('attaches eligibleIds and skipped to BulkAssignSqlError so admin can distinguish them', async () => {
      wireBulkUpdateChain({ data: null, error: { message: 'SQL UPDATE failed' } })

      const mod = await import('@/composables/supabase/useSupabaseBookings')
      const composable = mod.useSupabaseBookings()
      const store = await getBookingStore()

      // Two eligible (e1, e2), one team-conflict (skip)
      store.setBooking('e1', makeBooking({ id: 'e1', assigned_cleaner_id: null }))
      store.setBooking('e2', makeBooking({ id: 'e2', assigned_cleaner_id: null }))
      store.setBooking('skip', makeBooking({ id: 'skip', assigned_team_id: 'team-1', assigned_cleaner_id: null }))

      try {
        await composable.bulkAssignCleaner(['e1', 'skip', 'e2'], 'cleaner-Q')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(mod.BulkAssignSqlError)
        const bulkErr = err as InstanceType<typeof mod.BulkAssignSqlError>
        expect([...bulkErr.eligibleIds].sort()).toEqual(['e1', 'e2'])
        expect(bulkErr.skipped.map(s => s.id)).toEqual(['skip'])
        expect(bulkErr.cause).toEqual({ message: 'SQL UPDATE failed' })
      }
    })
  })

  describe('unsubscribe', () => {
    it('removes the channel and resets connection status', async () => {
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
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
