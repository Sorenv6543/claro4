import type { CleanerTeam, CleanerTeamFormData } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/plugins/supabase'
import { useBookingStore } from '@/stores/booking'
import { useCleanerTeamStore } from '@/stores/cleanerTeam'

export function useSupabaseCleanerTeams () {
  const cleanerTeamStore = useCleanerTeamStore()
  const bookingStore = useBookingStore()

  async function fetchAll (): Promise<void> {
    cleanerTeamStore.loading = true
    cleanerTeamStore.error = null
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .order('name', { ascending: true })
      if (fetchError) {
        throw fetchError
      }
      cleanerTeamStore.setTeams((data ?? []) as CleanerTeam[])
    } catch (error) {
      cleanerTeamStore.error = error instanceof Error ? error.message : 'Failed to fetch cleaner teams'
      console.error('[useSupabaseCleanerTeams] fetchAll error:', error)
      throw error
    } finally {
      cleanerTeamStore.loading = false
    }
  }

  async function fetchActive (): Promise<void> {
    cleanerTeamStore.loading = true
    cleanerTeamStore.error = null
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })
      if (fetchError) {
        throw fetchError
      }
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

  async function createTeam (formData: CleanerTeamFormData): Promise<CleanerTeam> {
    const name = formData.name?.trim()
    if (!name) {
      throw new Error('Team name is required')
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    const team: CleanerTeam = { id, ...formData, name, created_at: now, updated_at: now }

    cleanerTeamStore.setTeam(id, team)

    try {
      const { error } = await supabase.from('cleaner_teams').insert(team)
      if (error) {
        throw error
      }
      return team
    } catch (error) {
      cleanerTeamStore.removeTeam(id)
      throw error
    }
  }

  async function updateTeam (id: string, updates: Partial<CleanerTeam>): Promise<CleanerTeam> {
    const existing = cleanerTeamStore.teams.get(id)
    if (!existing) {
      throw new Error('Team not found')
    }

    const updated: CleanerTeam = { ...existing, ...updates, updated_at: new Date().toISOString() }
    cleanerTeamStore.setTeam(id, updated)

    try {
      const { error } = await supabase.from('cleaner_teams').update(updates).eq('id', id)
      if (error) {
        throw error
      }
      return updated
    } catch (error) {
      cleanerTeamStore.setTeam(id, existing)
      throw error
    }
  }

  async function deleteTeam (id: string): Promise<void> {
    const existing = cleanerTeamStore.teams.get(id)
    if (!existing) {
      throw new Error('Team not found')
    }

    cleanerTeamStore.removeTeam(id)

    try {
      const { error } = await supabase
        .from('cleaner_teams')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        throw error
      }

      await clearTeamFromBookings(id)
    } catch (error) {
      cleanerTeamStore.setTeam(id, existing)
      throw error
    }
  }

  async function clearTeamFromBookings (teamId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ assigned_team_id: null, updated_at: new Date().toISOString() })
      .eq('assigned_team_id', teamId)
    if (error) {
      console.error('[useSupabaseCleanerTeams] clearTeamFromBookings error:', error)
      throw error
    }

    for (const [bookingId, booking] of bookingStore.bookings.entries()) {
      if (booking.assigned_team_id === teamId) {
        bookingStore.setBooking(bookingId, { ...booking, assigned_team_id: null })
      }
    }
  }

  return {
    fetchAll,
    fetchActive,
    createTeam,
    updateTeam,
    deleteTeam,
  }
}
