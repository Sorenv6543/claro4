import type { CleanerTeam, CleanerTeamMap } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createMapCache } from '@/utils/cachedMapFilter'

export const useCleanerTeamStore = defineStore('cleanerTeam', () => {
  // State
  const teams = ref<CleanerTeamMap>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Shared TTL cache
  const cache = createMapCache(10_000)
  const invalidateCache = cache.invalidate

  // Array getter
  const teamsArray = computed((): CleanerTeam[] => {
    return Array.from(teams.value.values())
  })

  const getTeamById = computed(() => (id: string): CleanerTeam | undefined => {
    return teams.value.get(id)
  })

  // Cached active filter
  const activeTeamsMap = cache.cachedFilter<CleanerTeam>(
    () => teams.value,
    team => team.active === true,
  )

  const activeTeamsArray = computed((): CleanerTeam[] => {
    return Array.from(activeTeamsMap.value.values())
  })

  // Mutations
  function setTeams (data: CleanerTeam[]) {
    teams.value = new Map(data.map(t => [t.id, t]))
    invalidateCache()
  }

  function setTeam (id: string, team: CleanerTeam) {
    teams.value.set(id, team)
    invalidateCache()
  }

  function removeTeam (id: string) {
    teams.value.delete(id)
    invalidateCache()
  }

  function clearAll () {
    teams.value.clear()
    invalidateCache()
  }

  return {
    // State
    teams,
    loading,
    error,

    // Map getters
    activeTeamsMap,

    // Parameterized Map getters
    getTeamById,

    // Array getters
    teamsArray,
    activeTeamsArray,

    // Mutations
    setTeams,
    setTeam,
    removeTeam,
    clearAll,

    // Cache management
    invalidateCache,
  }
})
