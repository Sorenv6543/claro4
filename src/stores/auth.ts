import type { User, UserRole } from '@/types'
// src/stores/auth.ts - Fixed Version with Proper Loading Management
import * as Sentry from '@sentry/vue'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSupabaseAuth } from '@/composables/supabase/useSupabaseAuth'
import {
  clearAllRoleSpecificState,
  getRoleSpecificSuccessMessage,
} from '@/utils/authHelpers'

interface RegisterData {
  email: string
  password: string
  name: string
  role: UserRole
  company_name?: string
}

export const useAuthStore = defineStore('auth', () => {
  // Use Supabase auth composable
  const {
    user: supabaseUser,
    session,
    loading: supabaseLoading,
    error: supabaseError,
    isAuthenticated: supabaseIsAuthenticated,
    signIn,
    signUp,
    signOut: supabaseSignOut,
    updateProfile,
    resetPassword,
    checkAuth,
    clearError: supabaseClearError,
    refreshProfile,
  } = useSupabaseAuth()

  // Local loading state for store operations
  const storeLoading = ref(false)
  const storeError = ref<string | null>(null)

  // Tracks whether checkAuth() has been called at least once this session.
  // Reset on sign-out so the next navigation re-checks the session.
  const authChecked = ref(false)

  // Computed properties
  const user = computed(() => supabaseUser.value)
  const isAuthenticated = computed(() => supabaseIsAuthenticated.value)

  const loading = computed(() => storeLoading.value || supabaseLoading.value)

  // Combined error state
  const error = computed(() => storeError.value || supabaseError.value)

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isOwner = computed(() => user.value?.role === 'owner')
  const isCleaner = computed(() => user.value?.role === 'cleaner')

  // Keep Sentry user identity in sync with auth state.
  // Fires on login, page-reload session restore, and logout — immediate:true
  // handles sessions that already exist when the store is first accessed.
  watch(user, u => {
    if (u) {
      Sentry.setUser({ id: u.id, email: u.email, username: u.name, role: u.role })
    } else {
      Sentry.setUser(null)
    }
  }, { immediate: true })

  function clearError () {
    storeError.value = null
    supabaseClearError()
  }

  // Authentication methods
  async function login (email: string, password: string): Promise<boolean> {
    try {
      storeLoading.value = true
      storeError.value = null

      const success = await signIn(email, password)

      if (success) {
        clearError()
        return true
      }

      storeError.value = 'Invalid email or password'
      return false
    } catch (error_) {
      storeError.value = error_ instanceof Error ? error_.message : 'Login failed'
      return false
    } finally {
      storeLoading.value = false
    }
  }

  async function logout (): Promise<boolean> {
    try {
      storeLoading.value = true
      storeError.value = null

      // Clear role-specific state before logout
      clearAllRoleSpecificState()

      const success = await supabaseSignOut()

      if (success) {
        authChecked.value = false
        clearError()
        return true
      }

      return false
    } catch (error_) {
      storeError.value = error_ instanceof Error ? error_.message : 'Logout failed'
      return false
    } finally {
      storeLoading.value = false
    }
  }

  async function register (userData: RegisterData): Promise<boolean> {
    try {
      storeLoading.value = true
      storeError.value = null

      const success = await signUp(userData.email, userData.password, {
        name: userData.name,
        role: userData.role,
        company_name: userData.company_name,
      })

      if (success) {
        clearError()
        return true
      }

      storeError.value = 'Registration failed'
      return false
    } catch (error_) {
      storeError.value = error_ instanceof Error ? error_.message : 'Registration failed'
      return false
    } finally {
      storeLoading.value = false
    }
  }

  // Role switching (for admin users)
  function switchToOwnerView (_ownerId?: string): boolean {
    if (!isAdmin.value) {
      storeError.value = 'Only administrators can switch views'
      return false
    }

    return true
  }

  function switchToAdminView (): boolean {
    if (!isAdmin.value) {
      storeError.value = 'Only administrators can access admin view'
      return false
    }

    return true
  }

  // Profile management
  async function updateUserProfile (updates: {
    name?: string
    company_name?: string
    notifications_enabled?: boolean
    timezone?: string
    theme?: 'light' | 'dark' | 'system'
    language?: string
  }): Promise<boolean> {
    try {
      storeLoading.value = true
      storeError.value = null

      const success = await updateProfile(updates as Partial<User>)

      if (success) {
        clearError()
        return true
      }

      return false
    } catch (error_) {
      storeError.value = error_ instanceof Error ? error_.message : 'Profile update failed'
      return false
    } finally {
      storeLoading.value = false
    }
  }

  async function requestPasswordReset (email: string): Promise<boolean> {
    try {
      storeLoading.value = true
      storeError.value = null

      const success = await resetPassword(email)

      if (success) {
        clearError()
        return true
      }

      return false
    } catch (error_) {
      storeError.value = error_ instanceof Error ? error_.message : 'Password reset failed'
      return false
    } finally {
      storeLoading.value = false
    }
  }

  // Utility functions
  function getSuccessMessage (action: 'login' | 'logout' | 'register'): string {
    return getRoleSpecificSuccessMessage(action, user.value?.role)
  }

  // Initialize auth state
  async function initialize () {
    try {
      await checkAuth()
    } catch (error_) {
      storeError.value = error_ instanceof Error ? error_.message : 'Initialization failed'
    }
  }

  return {
    // State
    user,
    session,
    loading,
    error,
    authChecked,

    // Computed
    isAuthenticated,
    isAdmin,
    isOwner,
    isCleaner,

    // Methods
    login,
    logout,
    register,
    switchToOwnerView,
    switchToAdminView,
    updateUserProfile,
    requestPasswordReset,
    clearError,
    getSuccessMessage,
    initialize,

    // Direct Supabase access for advanced use cases
    checkAuth,
    refreshProfile,
    updateProfile,
  }
})
