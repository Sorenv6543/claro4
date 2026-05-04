import type { User, UserMap, UserRole } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createMapCache } from '@/utils/cachedMapFilter'

// Admin-side collection of all user profiles.
// Auth identity stays in authStore — this store holds the list the admin manages.
export const useUserProfileStore = defineStore('userProfile', () => {
  // State
  const userProfiles = ref<UserMap>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Shared TTL cache for all filtered Maps
  const cache = createMapCache(10_000)
  const invalidateCache = cache.invalidate

  // Array getter
  const userProfilesArray = computed((): User[] => {
    return Array.from(userProfiles.value.values())
  })

  const getUserProfileById = computed(() => (id: string): User | undefined => {
    return userProfiles.value.get(id)
  })

  // Map-based role filtering with caching
  const userProfilesByRoleMap = cache.cachedGroupBy<User, UserRole>(
    () => userProfiles.value,
    user => user.role,
  )

  const userProfilesByRole = computed(() => (role: UserRole): Map<string, User> => {
    return userProfilesByRoleMap.value.get(role) || new Map()
  })

  // Convenience: owners only
  const ownersMap = computed((): Map<string, User> => {
    return userProfilesByRole.value('owner')
  })

  const ownersArray = computed((): User[] => {
    return Array.from(ownersMap.value.values())
  })

  // Convenience: cleaners only
  const cleanersMap = computed((): Map<string, User> => {
    return userProfilesByRole.value('cleaner')
  })

  const cleanersArray = computed((): User[] => {
    return Array.from(cleanersMap.value.values())
  })

  // Mutations
  function setUserProfiles (data: User[]) {
    userProfiles.value = new Map(data.map(u => [u.id, u]))
    invalidateCache()
  }

  function setUserProfile (id: string, user: User) {
    userProfiles.value.set(id, user)
    invalidateCache()
  }

  function removeUserProfile (id: string) {
    userProfiles.value.delete(id)
    invalidateCache()
  }

  function clearAll () {
    userProfiles.value.clear()
    invalidateCache()
  }

  return {
    // State
    userProfiles,
    loading,
    error,

    // Map getters
    userProfilesByRoleMap,
    ownersMap,
    cleanersMap,

    // Parameterized Map getters
    getUserProfileById,
    userProfilesByRole,

    // Array getters
    userProfilesArray,
    ownersArray,
    cleanersArray,

    // Mutations
    setUserProfiles,
    setUserProfile,
    removeUserProfile,
    clearAll,

    // Cache management
    invalidateCache,
  }
})
