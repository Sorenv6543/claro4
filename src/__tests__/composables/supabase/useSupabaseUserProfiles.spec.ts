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
  })
})
