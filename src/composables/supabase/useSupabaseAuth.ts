import type { Session } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types/user.ts'
// src/composables/supabase/useSupabaseAuth.ts
import { computed, ref } from 'vue'
import { supabase } from '@/plugins/supabase.ts'

export function useSupabaseAuth () {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initializing = ref(true)

  const isAuthenticated = computed(() => !!session.value && !!user.value)

  const currentUserId = computed(() => session.value?.user?.id || null)

  // Guard against concurrent profile loads
  let profileLoadPromise: Promise<void> | null = null

  let initializationTimeout: ReturnType<typeof setTimeout>

  initializeAuthListener()

  function initializeAuthListener () {
    try {
      initializing.value = false
      clearTimeout(initializationTimeout)

      supabase.auth.onAuthStateChange((event, newSession) => {
        // IMPORTANT: Do NOT await async work here — it holds Supabase's
        // internal auth lock and causes "Lock was not released within 5000ms".
        // Instead, fire profile loading asynchronously.

        if (event === 'INITIAL_SESSION') {
          session.value = newSession
          if (newSession) {
            loadUserProfileSafe(newSession.user.id)
          }
        } else if (event === 'SIGNED_IN' && newSession) {
          session.value = newSession
          if (!user.value) {
            loadUserProfileSafe(newSession.user.id)
          }
        } else if (event === 'SIGNED_OUT') {
          user.value = null
          session.value = null
          error.value = null
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          session.value = newSession
        }
      })

      // Fallback: check current session in case onAuthStateChange is delayed
      supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
        if (sessionError) {
          console.error('Session check failed:', sessionError)
        }
        if (currentSession) {
          session.value = currentSession
          if (!user.value) {
            loadUserProfileSafe(currentSession.user.id)
          }
        }
        if (initializing.value) {
          initializing.value = false
          clearTimeout(initializationTimeout)
        }
      }).catch(error_ => {
        console.error('Session check failed:', error_)
        if (initializing.value) {
          initializing.value = false
          clearTimeout(initializationTimeout)
        }
      })
    } catch (error_) {
      console.error('Failed to initialize auth listener:', error_)
      initializing.value = false
      clearTimeout(initializationTimeout)
    }
  }

  function buildFallbackProfile (userId: string): User {
    return {
      id: userId,
      email: session.value?.user?.email || '',
      name: session.value?.user?.user_metadata?.name || session.value?.user?.email?.split('@')[0] || 'User',
      role: (session.value?.user?.user_metadata?.role as UserRole) || 'owner',
      company_name: session.value?.user?.user_metadata?.company_name || '',
      notifications_enabled: true,
      timezone: 'America/Los_Angeles',
      theme: 'light',
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  /**
   * Fire-and-forget wrapper for loadUserProfile.
   * Deduplicates concurrent calls by sharing a single in-flight promise.
   */
  function loadUserProfileSafe (userId: string) {
    if (profileLoadPromise) {
      return
    }

    profileLoadPromise = loadUserProfile(userId)
      .catch(error_ => {
        // Single retry after 1s for transient network errors
        console.warn('Profile load failed, retrying once:', error_.message)
        return new Promise<void>(resolve => setTimeout(resolve, 1000))
          .then(() => loadUserProfile(userId))
      })
      .catch(error_ => {
        console.warn('Profile load retry failed, using fallback from session metadata:', error_.message)
        user.value = buildFallbackProfile(userId)
      })
      .finally(() => {
        profileLoadPromise = null
        if (initializing.value) {
          initializing.value = false
          clearTimeout(initializationTimeout)
        }
      })
  }

  async function loadUserProfile (userId: string): Promise<void> {
    const queryPromise = supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile query timeout after 5 seconds')), 5000)
    })

    const result = await Promise.race([queryPromise, timeoutPromise])
    const { data, error: profileError } = result

    if (profileError) {
      const isNotFound = profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')
      if (!isNotFound) {
        throw new Error(`Profile query failed: ${profileError.message}`)
      }
    }

    if (data) {
      user.value = {
        id: data.id,
        email: session.value?.user?.email || data.email || '',
        name: data.name,
        role: data.role as UserRole,
        company_name: data.company_name,
        notifications_enabled: data.notifications_enabled ?? true,
        timezone: data.timezone || 'America/Los_Angeles',
        theme: data.theme || 'light',
        language: data.language || 'en',
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
      return
    }

    // Profile not found — use fallback from session metadata
    user.value = buildFallbackProfile(userId)
  }

  async function signIn (email: string, password: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.user && data.session) {
        session.value = data.session
        await loadUserProfile(data.user.id)
        return true
      }

      return false
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Sign in failed'
      const isCredentialError = message.includes('Invalid login') || message.includes('invalid_grant')
      error.value = isCredentialError ? 'Invalid email or password' : message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signUp (
    email: string,
    password: string,
    userData: {
      name: string
      role?: UserRole
      company_name?: string
    },
  ): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'owner',
            company_name: userData.company_name,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.user) {
        return true
      }

      return false
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Sign up failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function signOut (): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Sign out failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateProfile (updates: Partial<User>): Promise<boolean> {
    try {
      if (!currentUserId.value) {
        throw new Error('No authenticated user')
      }

      loading.value = true
      error.value = null

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUserId.value)

      if (updateError) {
        throw updateError
      }

      await loadUserProfile(currentUserId.value)
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Profile update failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPassword (email: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Password reset failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function checkAuth (): Promise<void> {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (currentSession) {
        session.value = currentSession
        if (!user.value) {
          await loadUserProfile(currentSession.user.id)
        }
      } else {
        if (user.value) {
          user.value = null
        }
        if (session.value) {
          session.value = null
        }
      }
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Auth check failed'
    } finally {
      if (initializing.value) {
        initializing.value = false
        clearTimeout(initializationTimeout)
      }
    }
  }

  // Admin functions
  async function getAllUsers (): Promise<User[]> {
    const { data, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    return data || []
  }

  async function updateUserRole (userId: string, newRole: UserRole): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to update user role'
      return false
    }
  }

  async function deleteUser (userId: string): Promise<boolean> {
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        throw profileError
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) {
        error.value = 'Profile deleted but auth record cleanup failed. Contact support.'
        return false
      }

      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to delete user'
      return false
    }
  }

  async function createAdminUser (userData: {
    email: string
    password: string
    name: string
    access_level?: string
  }): Promise<boolean> {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: 'admin',
        },
      })

      if (authError || !authData.user) {
        throw authError || new Error('Failed to create auth user')
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: 'admin' as UserRole,
          access_level: userData.access_level || 'full',
        })

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id).catch(error_ => {
          console.error('Failed to clean up auth user after profile creation failure:', error_)
        })
        throw profileError
      }

      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to create admin user'
      return false
    }
  }

  // Fallback timeout in case getSession() hangs and onAuthStateChange never fires
  initializationTimeout = setTimeout(() => {
    if (initializing.value) {
      initializing.value = false

      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession && !user.value) {
          loadUserProfileSafe(currentSession.user.id)
        }
      }).catch(() => {
        // Timeout fallback — session check failure is non-critical here
      })
    }
  }, 1000)

  function clearError () {
    error.value = null
  }

  return {
    // State
    user,
    session,
    loading,
    error,
    initializing,

    // Computed
    isAuthenticated,
    currentUserId,

    // Methods
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    checkAuth,
    clearError,
    getAllUsers,
    updateUserRole,
    deleteUser,
    createAdminUser,
  }
}
