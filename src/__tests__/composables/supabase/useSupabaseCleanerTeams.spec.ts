import type { CleanerTeam, CleanerTeamFormData } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function makeTeam(overrides: Partial<CleanerTeam> = {}): CleanerTeam {
  return {
    id: 'team-1',
    name: 'Team Alpha',
    member_ids: ['cleaner-1', 'cleaner-2'],
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeFormData(overrides: Partial<CleanerTeamFormData> = {}): CleanerTeamFormData {
  return {
    name: 'Team Beta',
    member_ids: ['cleaner-3'],
    active: true,
    ...overrides,
  }
}

describe('useSupabaseCleanerTeams', () => {
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

  async function getComposable() {
    const mod = await import('@/composables/supabase/useSupabaseCleanerTeams')
    return mod.useSupabaseCleanerTeams()
  }

  async function getStore() {
    const mod = await import('@/stores/cleanerTeam')
    return mod.useCleanerTeamStore()
  }

  describe('createTeam', () => {
    it('optimistically adds team to store and resolves', async () => {
      let resolveInsert!: (v: any) => void
      const insertPromise = new Promise(res => { resolveInsert = res })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockReturnValue(insertPromise),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      const createPromise = composable.createTeam(makeFormData())

      // Optimistic: store has the team before Supabase resolves
      expect(store.teams.size).toBe(1)

      // UUID was generated client-side — not waiting for server
      expect(store.teams.values().next().value?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/)

      resolveInsert({ data: null, error: null })
      const result = await createPromise

      expect(result.name).toBe('Team Beta')
      expect(store.teams.size).toBe(1)
    })

    it('rolls back on Supabase error', async () => {
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      await expect(composable.createTeam(makeFormData())).rejects.toThrow()
      expect(store.teams.size).toBe(0)
    })
  })

  describe('updateTeam', () => {
    it('optimistically updates and rolls back on failure', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      const existing = makeTeam({ id: 't1', name: 'Original' })
      store.setTeam('t1', existing)

      await expect(composable.updateTeam('t1', { name: 'Changed' })).rejects.toThrow()
      expect(store.teams.get('t1')?.name).toBe('Original')
    })
  })

  describe('deleteTeam', () => {
    it('soft-deletes optimistically and rolls back on failure', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      const existing = makeTeam({ id: 't2' })
      store.setTeam('t2', existing)

      await expect(composable.deleteTeam('t2')).rejects.toThrow()
      // Rolled back — team is back
      expect(store.teams.get('t2')).toEqual(existing)
    })
  })
})
