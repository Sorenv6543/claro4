import type { User, UserRole } from '@/types/user'
import { computed, ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useSupabaseUserProfiles } from '@/composables/supabase/useSupabaseUserProfiles'
import { useUserProfileStore } from '@/stores/userProfile'

// Module-level singleton state
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Helper to call the admin-users edge function.
 * The function verifies the caller is an admin via JWT, then uses the
 * service role key for auth.admin operations.
 */
async function invokeAdminUsers (body: Record<string, unknown>): Promise<{ data: unknown, error: string | null }> {
  const { data, error: fnError } = await supabase.functions.invoke('admin-users', {
    body,
  })

  if (fnError) {
    // Edge function network/invocation error
    return { data: null, error: fnError.message }
  }

  // The edge function returns JSON — check for an error field
  if (data?.error) {
    return { data: null, error: data.error }
  }

  return { data, error: null }
}

function extractErrorMessage (err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message?: string }).message || fallback
  }
  return fallback
}

export function useAdminUserManagement () {
  const supaUserProfiles = useSupabaseUserProfiles()
  const userProfileStore = useUserProfileStore()

  const users = computed(() => userProfileStore.userProfilesArray)

  async function fetchAllUsers (): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await supaUserProfiles.fetchAll()
    } catch (error_: unknown) {
      error.value = extractErrorMessage(error_, 'Failed to fetch users')
    } finally {
      loading.value = false
    }
  }

  // Writes that need service role key — routed through edge function

  async function createUser (userData: Partial<User> & { password: string }): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const { error: fnError } = await invokeAdminUsers({
        action: 'create',
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        company_name: userData.company_name || null,
        access_level: userData.access_level || null,
        skills: userData.skills || null,
        max_daily_bookings: userData.max_daily_bookings || null,
        location_lat: userData.location_lat || null,
        location_lng: userData.location_lng || null,
        timezone: userData.timezone || null,
        language: userData.language || null,
        notifications_enabled: userData.notifications_enabled ?? true,
      })

      if (fnError) {
        throw new Error(fnError)
      }

      await fetchAllUsers()
      return true
    } catch (error_: unknown) {
      error.value = extractErrorMessage(error_, 'Failed to create user')
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateUser (userId: string, updateData: Partial<User>): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await supaUserProfiles.updateProfile(userId, updateData)
      return true
    } catch (error_: unknown) {
      error.value = extractErrorMessage(error_, 'Failed to update user')
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteUser (userId: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const { data, error: fnError } = await invokeAdminUsers({
        action: 'delete',
        userId,
      })

      if (fnError) {
        throw new Error(fnError)
      }

      // Edge function returns 207 with a warning if profile deleted but auth remains
      if (data && typeof data === 'object' && 'warning' in data) {
        error.value = (data as { warning: string }).warning
        await fetchAllUsers()
        return false
      }

      await fetchAllUsers()
      return true
    } catch (error_: unknown) {
      error.value = extractErrorMessage(error_, 'Failed to delete user')
      return false
    } finally {
      loading.value = false
    }
  }

  async function bulkChangeRoles (userIds: string[], newRole: UserRole): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await supaUserProfiles.bulkUpdateRole(userIds, newRole)
      return true
    } catch (error_: unknown) {
      error.value = extractErrorMessage(error_, 'Failed to change user roles')
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetUserPassword (userId: string, newPassword: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const { error: fnError } = await invokeAdminUsers({
        action: 'reset-password',
        userId,
        newPassword,
      })

      if (fnError) {
        throw new Error(fnError)
      }

      return true
    } catch (error_: unknown) {
      error.value = extractErrorMessage(error_, 'Failed to update password')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkChangeRoles,
    resetUserPassword,
  }
}
