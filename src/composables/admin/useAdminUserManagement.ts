import { ref } from 'vue'
import type { Ref } from 'vue'
import type { User, UserRole } from '@/types/user'
import { supabase } from '@/plugins/supabase' // adjust import if needed

// State
const users: Ref<User[]> = ref([])
const loading = ref(false)
const error = ref<string | null>(null)

// Core Methods (stubs)
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
    if (err && typeof err === 'object' && 'message' in err) {
      error.value = (err as { message?: string }).message || 'Failed to fetch users'
    } else {
      error.value = 'Failed to fetch users'
    }
    users.value = []
  } finally {
    loading.value = false
  }
}

async function createUser(userData: Partial<User> & { password: string }): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    // 1. Create user in auth.users (Supabase admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email!,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role,
      }
    })
    if (authError || !authData?.user) {
      throw authError || new Error('Failed to create auth user')
    }
    // 2. Insert into user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
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
    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }
    await fetchAllUsers()
    return true
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      error.value = (err as { message?: string }).message || 'Failed to create user'
    } else {
      error.value = 'Failed to create user'
    }
    return false
  } finally {
    loading.value = false
  }
}

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
    if (err && typeof err === 'object' && 'message' in err) {
      error.value = (err as { message?: string }).message || 'Failed to update user'
    } else {
      error.value = 'Failed to update user'
    }
    return false
  } finally {
    loading.value = false
  }
}

async function deleteUser(userId: string): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    // Delete from user_profiles first
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    if (profileError) {
      throw profileError
    }
    // Delete from auth.users using admin API
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      // Profile was deleted but auth account remains — user can still log in
      error.value = 'User profile deleted, but the auth account could not be removed. Contact your Supabase admin to delete the auth record manually.'
      loading.value = false
      return false
    }
    await fetchAllUsers()
    return true
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      error.value = (err as { message?: string }).message || 'Failed to delete user'
    } else {
      error.value = 'Failed to delete user'
    }
    return false
  } finally {
    loading.value = false
  }
}

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
    if (err && typeof err === 'object' && 'message' in err) {
      error.value = (err as { message?: string }).message || 'Failed to change user roles'
    } else {
      error.value = 'Failed to change user roles'
    }
    return false
  } finally {
    loading.value = false
  }
}

async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    // Supabase admin API does not send password reset emails directly; must use client API
    const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    })
    if (resetError) {
      throw resetError
    }
    return true
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      error.value = (err as { message?: string }).message || 'Failed to send password reset email'
    } else {
      error.value = 'Failed to send password reset email'
    }
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