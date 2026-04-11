import type { User, UserRole } from '@/types'
import { supabase } from '@/plugins/supabase'
import { useUserProfileStore } from '@/stores/userProfile'

// Fetch-on-demand composable for admin operations on user_profiles.
// Auth-related profile access (current user) stays in useSupabaseAuth.
export function useSupabaseUserProfiles () {
  const userProfileStore = useUserProfileStore()

  async function fetchAll (): Promise<void> {
    userProfileStore.loading = true
    userProfileStore.error = null

    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (fetchError) {
        throw fetchError
      }
      userProfileStore.setUserProfiles((data ?? []) as User[])
    } catch (error) {
      userProfileStore.error = error instanceof Error ? error.message : 'Failed to fetch user profiles'
      console.error('[useSupabaseUserProfiles] fetchAll error:', error)
      throw error
    } finally {
      userProfileStore.loading = false
    }
  }

  async function fetchByRole (role: UserRole): Promise<void> {
    userProfileStore.loading = true
    userProfileStore.error = null

    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', role)
        .order('name', { ascending: true })

      if (fetchError) {
        throw fetchError
      }
      // Merge into store — don't clear existing profiles of other roles
      for (const profile of (data ?? []) as User[]) {
        userProfileStore.setUserProfile(profile.id, profile)
      }
    } catch (error) {
      userProfileStore.error = error instanceof Error ? error.message : `Failed to fetch ${role} profiles`
      console.error(`[useSupabaseUserProfiles] fetchByRole(${role}) error:`, error)
      throw error
    } finally {
      userProfileStore.loading = false
    }
  }

  async function updateProfile (userId: string, updates: Partial<User>): Promise<User> {
    const existing = userProfileStore.userProfiles.get(userId)

    // Optimistic update if we have the record
    const optimistic = existing ? { ...existing, ...updates, updated_at: new Date().toISOString() } : null
    if (optimistic) {
      userProfileStore.setUserProfile(userId, optimistic)
    }

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Re-fetch the updated row to get server state
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const updated = data as User
      userProfileStore.setUserProfile(userId, updated)
      return updated
    } catch (error) {
      // Rollback on failure
      if (existing) {
        userProfileStore.setUserProfile(userId, existing)
      }
      console.error('[useSupabaseUserProfiles] updateProfile error:', error)
      throw error
    }
  }

  async function bulkUpdateRole (userIds: string[], newRole: UserRole): Promise<void> {
    const now = new Date().toISOString()
    const rollbacks: Array<{ id: string, user: User }> = []

    // Optimistic updates
    for (const id of userIds) {
      const existing = userProfileStore.userProfiles.get(id)
      if (existing) {
        rollbacks.push({ id, user: existing })
        userProfileStore.setUserProfile(id, { ...existing, role: newRole, updated_at: now })
      }
    }

    try {
      const results = await Promise.allSettled(
        userIds.map(userId =>
          supabase
            .from('user_profiles')
            .update({ role: newRole, updated_at: now })
            .eq('id', userId),
        ),
      )

      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        throw new Error(`${failures.length} of ${userIds.length} role updates failed`)
      }

      // Check for Supabase errors in fulfilled results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.error) {
          throw result.value.error
        }
      }
    } catch (error) {
      // Rollback all optimistic updates
      for (const { id, user } of rollbacks) {
        userProfileStore.setUserProfile(id, user)
      }
      console.error('[useSupabaseUserProfiles] bulkUpdateRole error:', error)
      throw error
    }
  }

  async function deleteProfile (userId: string): Promise<void> {
    const existing = userProfileStore.userProfiles.get(userId)

    userProfileStore.removeUserProfile(userId)

    try {
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        throw deleteError
      }
    } catch (error) {
      // Rollback
      if (existing) {
        userProfileStore.setUserProfile(userId, existing)
      }
      console.error('[useSupabaseUserProfiles] deleteProfile error:', error)
      throw error
    }
  }

  async function fetchById (userId: string): Promise<User | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return null
        throw fetchError
      }

      const user = data as User
      userProfileStore.setUserProfile(user.id, user)
      return user
    } catch (error) {
      console.error('[useSupabaseUserProfiles] fetchById error:', error)
      throw error
    }
  }

  return {
    fetchAll,
    fetchByRole,
    fetchById,
    updateProfile,
    bulkUpdateRole,
    deleteProfile,
  }
}
