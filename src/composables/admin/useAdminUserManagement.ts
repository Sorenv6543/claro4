import { ref } from 'vue'
import type { Ref } from 'vue'
import type { User, UserRole } from '@/types/user'
import { supabase } from '@/plugins/supabase'

// State (module-level singleton)
const users: Ref<User[]> = ref([])
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Helper to call the admin-users edge function.
 * The function verifies the caller is an admin via JWT, then uses the
 * service role key for auth.admin operations.
 */
async function invokeAdminUsers(body: Record<string, unknown>): Promise<{ data: unknown; error: string | null }> {
  const { data, error: fnError } = await supabase.functions.invoke('admin-users', {
    body
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

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message?: string }).message || fallback
  }
  return fallback
}

// Reads — use direct client (works with RLS + anon key)
async function fetchAllUsers(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const { data, error: supabaseError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (supabaseError) {
      throw supabaseError
    }
    users.value = (data as User[]) || []
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to fetch users')
    users.value = []
  } finally {
    loading.value = false
  }
}

// Writes that need service role key — routed through edge function

async function createUser(userData: Partial<User> & { password: string }): Promise<boolean> {
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
      notifications_enabled: userData.notifications_enabled ?? true
    })

    if (fnError) {
      throw new Error(fnError)
    }

    await fetchAllUsers()
    return true
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to create user')
    return false
  } finally {
    loading.value = false
  }
}

// Profile updates — direct client (RLS allows admins to update user_profiles)
async function updateUser(userId: string, updateData: Partial<User>): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        company_name: updateData.company_name,
        notifications_enabled: updateData.notifications_enabled,
        timezone: updateData.timezone,
        theme: updateData.theme,
        language: updateData.language,
        access_level: updateData.access_level,
        skills: updateData.skills,
        max_daily_bookings: updateData.max_daily_bookings,
        location_lat: updateData.location_lat,
        location_lng: updateData.location_lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    if (updateError) {
      throw updateError
    }
    await fetchAllUsers()
    return true
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to update user')
    return false
  } finally {
    loading.value = false
  }
}

async function deleteUser(userId: string): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    const { data, error: fnError } = await invokeAdminUsers({
      action: 'delete',
      userId
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
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to delete user')
    return false
  } finally {
    loading.value = false
  }
}

// Bulk role change — direct client (RLS)
async function bulkChangeRoles(userIds: string[], newRole: UserRole): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    const updatePromises = userIds.map(userId =>
      supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
    )
    const results = await Promise.all(updatePromises)
    const anyError = results.some(r => r.error)
    if (anyError) {
      const errors = results.filter(r => r.error).map(r => r.error?.message).join('; ')
      throw new Error(errors)
    }
    await fetchAllUsers()
    return true
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to change user roles')
    return false
  } finally {
    loading.value = false
  }
}

async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    const { error: fnError } = await invokeAdminUsers({
      action: 'reset-password',
      userId,
      newPassword
    })

    if (fnError) {
      throw new Error(fnError)
    }

    return true
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to update password')
    return false
  } finally {
    loading.value = false
  }
}

export function useAdminUserManagement() {
  return {
    users,
    loading,
    error,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkChangeRoles,
    resetUserPassword
  }
}
