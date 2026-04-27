import type { User, UserRole } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function makeUser (overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'owner' as UserRole,
    company_name: '',
    notifications_enabled: true,
    timezone: 'America/Los_Angeles',
    theme: 'light',
    language: 'en',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useSupabaseUserProfiles', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function getComposable () {
    const mod = await import('@/composables/supabase/useSupabaseUserProfiles')
    return mod.useSupabaseUserProfiles()
  }

  async function getStore () {
    const mod = await import('@/stores/userProfile')
    return mod.useUserProfileStore()
  }

  describe('fetchAll', () => {
    it('populates the store with fetched users', async () => {
      const users = [makeUser({ id: 'u1' }), makeUser({ id: 'u2' })]
      const limitMock = vi.fn().mockResolvedValue({ data: users, error: null })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const selectMock = vi.fn().mockReturnValue({ order: orderMock })
      supabaseMock.from.mockReturnValue({ select: selectMock })

      const composable = await getComposable()
      const store = await getStore()
      await composable.fetchAll()

      expect(store.userProfiles.size).toBe(2)
    })
  })

  describe('updateProfile', () => {
    it('uses a single round-trip (update + select) without a separate fetch', async () => {
      const updatedUser = makeUser({ id: 'u1', name: 'Updated Name' })

      const singleMock = vi.fn().mockResolvedValue({ data: updatedUser, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const eqMock = vi.fn().mockReturnValue({ select: selectMock })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({ update: updateMock })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', name: 'Old Name' }))

      const result = await composable.updateProfile('u1', { name: 'Updated Name' })

      expect(result.name).toBe('Updated Name')
      // select() called on the same chain — not a second .from() call
      expect(supabaseMock.from).toHaveBeenCalledTimes(1)
      expect(selectMock).toHaveBeenCalled()
    })

    it('rolls back optimistic update on failure', async () => {
      const eqMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      })
      supabaseMock.from.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqMock }) })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', name: 'Original' }))

      await expect(composable.updateProfile('u1', { name: 'Changed' })).rejects.toThrow()
      expect(store.userProfiles.get('u1')?.name).toBe('Original')
    })
  })

  describe('bulkUpdateRole', () => {
    it('optimistically updates all users and succeeds', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      supabaseMock.from.mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', role: 'owner' }))
      store.setUserProfile('u2', makeUser({ id: 'u2', role: 'owner' }))

      await composable.bulkUpdateRole(['u1', 'u2'], 'cleaner')

      expect(store.userProfiles.get('u1')?.role).toBe('cleaner')
      expect(store.userProfiles.get('u2')?.role).toBe('cleaner')
    })

    it('rolls back all optimistic updates on failure', async () => {
      supabaseMock.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('SQL failed')),
        }),
      })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', role: 'owner' }))
      store.setUserProfile('u2', makeUser({ id: 'u2', role: 'owner' }))

      await expect(composable.bulkUpdateRole(['u1', 'u2'], 'cleaner')).rejects.toThrow()

      expect(store.userProfiles.get('u1')?.role).toBe('owner')
      expect(store.userProfiles.get('u2')?.role).toBe('owner')
    })
  })

  describe('deleteProfile', () => {
    it('optimistically removes and rolls back on failure', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
      supabaseMock.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: eqMock }),
      })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1' }))

      await expect(composable.deleteProfile('u1')).rejects.toThrow()
      const restored = store.userProfiles.get('u1')
      expect(restored).toBeDefined()
      expect(restored?.id).toBe('u1')
      expect(restored?.name).toBe('Test User')
    })
  })
})
