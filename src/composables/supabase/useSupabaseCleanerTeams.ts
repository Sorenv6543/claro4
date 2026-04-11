import type { CleanerTeam } from '@/types'
import { supabase } from '@/plugins/supabase'
import { useCleanerTeamStore } from '@/stores/cleanerTeam'

// Fetch-on-demand composable for cleaner_teams table. No realtime.
export function useSupabaseCleanerTeams () {
  const cleanerTeamStore = useCleanerTeamStore()

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
      // Merge into store — only update active teams, don't clear inactive
      for (const team of (data ?? []) as CleanerTeam[]) {
        cleanerTeamStore.setTeam(team.id, team)
      }
    } catch (error) {
      cleanerTeamStore.error = error instanceof Error ? error.message : 'Failed to fetch active teams'
      console.error('[useSupabaseCleanerTeams] fetchActive error:', error)
      throw error
    } finally {
      cleanerTeamStore.loading = false
    }
  }

  return {
    fetchAll,
    fetchActive,
  }
}
