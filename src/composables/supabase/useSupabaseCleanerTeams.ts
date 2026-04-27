import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CleanerTeam, CleanerTeamFormData } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useCleanerTeamStore } from '@/stores/cleanerTeam'

// Module-level singleton state — matches useSupabaseBookings / useSupabaseProperties pattern
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
const OPTIMISTIC_SAFETY_TIMEOUT = 30_000

export function useSupabaseCleanerTeams() {
  const cleanerTeamStore = useCleanerTeamStore()

  async function fetchAll(): Promise<void> {
    cleanerTeamStore.loading = true
    cleanerTeamStore.error = null
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      cleanerTeamStore.setTeams((data ?? []) as CleanerTeam[])
    } catch (error) {
      cleanerTeamStore.error = error instanceof Error ? error.message : 'Failed to fetch cleaner teams'
      console.error('[useSupabaseCleanerTeams] fetchAll error:', error)
      throw error
    } finally {
      cleanerTeamStore.loading = false
    }
  }

  async function fetchActive(): Promise<void> {
    cleanerTeamStore.loading = true
    cleanerTeamStore.error = null
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      // Replace store contents with the current active set so teams that
      // are no longer active are not left behind as stale active entries.
      cleanerTeamStore.setTeams((data ?? []) as CleanerTeam[])
    } catch (error) {
      cleanerTeamStore.error = error instanceof Error ? error.message : 'Failed to fetch active teams'
      console.error('[useSupabaseCleanerTeams] fetchActive error:', error)
      throw error
    } finally {
      cleanerTeamStore.loading = false
    }
  }

  function subscribe(): void {
    if (channel) return
    connectionStatus.value = 'connecting'
    channel = supabase
      .channel('cleaner-teams-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaner_teams' },
        payload => handleRealtimeEvent(payload))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') connectionStatus.value = 'connected'
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') connectionStatus.value = 'disconnected'
      })
  }

  function unsubscribe(): void {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    connectionStatus.value = 'disconnected'
    optimisticIds.clear()
  }

  function handleRealtimeEvent(payload: any): void {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload
      const id = (newRecord || oldRecord)?.id
      if (!id) return
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE': {
          if (optimisticIds.has(id)) return
          if (newRecord.active === false) {
            cleanerTeamStore.removeTeam(id)
          } else {
            cleanerTeamStore.setTeam(id, newRecord as CleanerTeam)
          }
          break
        }
        case 'DELETE': {
          optimisticIds.delete(id)
          cleanerTeamStore.removeTeam(oldRecord.id)
          break
        }
      }
    } catch (error) {
      console.error('[useSupabaseCleanerTeams] realtime event error:', error, payload)
    }
  }

  function trackOptimistic(id: string): void {
    optimisticIds.add(id)
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_SAFETY_TIMEOUT)
  }

  function clearOptimistic(id: string): void {
    optimisticIds.delete(id)
  }

  async function createTeam(formData: CleanerTeamFormData): Promise<CleanerTeam> {
    const id = uuidv4()
    const now = new Date().toISOString()
    const team: CleanerTeam = { id, ...formData, created_at: now, updated_at: now }

    cleanerTeamStore.setTeam(id, team)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('cleaner_teams').insert(team)
      if (error) throw error
      return team
    } catch (error) {
      cleanerTeamStore.removeTeam(id)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function updateTeam(id: string, updates: Partial<CleanerTeam>): Promise<CleanerTeam> {
    const existing = cleanerTeamStore.teams.get(id)
    if (!existing) throw new Error('Team not found')

    const updated: CleanerTeam = { ...existing, ...updates, updated_at: new Date().toISOString() }
    cleanerTeamStore.setTeam(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('cleaner_teams').update(updates).eq('id', id)
      if (error) throw error
      return updated
    } catch (error) {
      cleanerTeamStore.setTeam(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function deleteTeam(id: string): Promise<void> {
    const existing = cleanerTeamStore.teams.get(id)
    if (!existing) throw new Error('Team not found')

    cleanerTeamStore.removeTeam(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase
        .from('cleaner_teams')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } catch (error) {
      cleanerTeamStore.setTeam(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  return {
    fetchAll,
    fetchActive,
    subscribe,
    unsubscribe,
    createTeam,
    updateTeam,
    deleteTeam,
    connectionStatus,
  }
}
