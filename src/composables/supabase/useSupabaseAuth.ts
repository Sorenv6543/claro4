// src/composables/supabase/useSupabaseAuth.ts
import { ref, computed } from 'vue';
import { supabase } from '@/plugins/supabase.ts';
import type { Session } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/user.ts';

export function useSupabaseAuth() {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initializing = ref(true);

  const isAuthenticated = computed(() => !!session.value && !!user.value);

  const currentUserId = computed(() => session.value?.user?.id || null);

  let initializationTimeout: ReturnType<typeof setTimeout>;

  initializeAuthListener();

  function initializeAuthListener() {
    try {
      initializing.value = false;
      clearTimeout(initializationTimeout);

      supabase.auth.onAuthStateChange(async (event, newSession) => {
        try {
          if (event === 'INITIAL_SESSION') {
            session.value = newSession;
            if (newSession) {
              await loadUserProfile(newSession.user.id);
            }
          } else if (event === 'SIGNED_IN' && newSession) {
            // Profile is loaded directly in signIn() to avoid the race condition.
            // This handler updates the session ref for token refreshes and handles
            // flows where signIn() is not the entry point (e.g. OAuth, magic link).
            // The !user.value guard means this only fires when no profile is loaded yet.
            session.value = newSession;
            if (!user.value) {
              await loadUserProfile(newSession.user.id).catch(err => {
                console.error('Profile loading failed during SIGNED_IN:', err);
                error.value = err instanceof Error ? err.message : 'Failed to load profile';
              });
            }
          } else if (event === 'SIGNED_OUT') {
            user.value = null;
            session.value = null;
            error.value = null;
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          error.value = err instanceof Error ? err.message : 'Authentication error';
        }
      });

      // Check current session as fallback in case onAuthStateChange is delayed
      supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
        if (sessionError) {
          console.error('Session check failed:', sessionError);
        }
        if (currentSession) {
          session.value = currentSession;
          loadUserProfile(currentSession.user.id).catch(err => {
            console.error('Existing session profile loading failed:', err);
          });
        }
        if (initializing.value) {
          initializing.value = false;
          clearTimeout(initializationTimeout);
        }
      }).catch(err => {
        console.error('Session check failed:', err);
        if (initializing.value) {
          initializing.value = false;
          clearTimeout(initializationTimeout);
        }
      });

    } catch (err) {
      console.error('Failed to initialize auth listener:', err);
      initializing.value = false;
      clearTimeout(initializationTimeout);
    }
  }

  function buildFallbackProfile(userId: string): User {
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
      updated_at: new Date().toISOString()
    };
  }

  async function loadUserProfile(userId: string): Promise<void> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const queryPromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile query timeout after 3 seconds')), 3000);
        });

        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data, error: profileError } = result;

        // Non-404 errors are real failures — throw so callers can handle
        if (profileError) {
          const isNotFound = profileError.code === 'PGRST116' || profileError.message?.includes('No rows found');
          if (!isNotFound) {
            throw new Error(`Profile query failed: ${profileError.message}`);
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
            updated_at: data.updated_at
          };
          return;
        }

        // Profile not found (null data or 404 error) — use fallback from session metadata
        user.value = buildFallbackProfile(userId);
        return;
      } catch (err) {
        if (attempt === maxRetries) {
          throw err instanceof Error ? err : new Error('Failed to load user profile');
        }

        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user && data.session) {
        session.value = data.session;
        await loadUserProfile(data.user.id);
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      // Distinguish credential errors from infrastructure errors
      const isCredentialError = message.includes('Invalid login') || message.includes('invalid_grant');
      error.value = isCredentialError ? 'Invalid email or password' : message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signUp(
    email: string,
    password: string,
    userData: {
      name: string;
      role?: UserRole;
      company_name?: string;
    }
  ): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'owner',
            company_name: userData.company_name
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // If the email is immediately confirmed, the SIGNED_IN handler will load
        // the profile (subject to the !user.value guard). If not confirmed, the
        // user must verify their email first.
        return true;
      }

      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign up failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signOut(): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      // Auth state change handler will clear user state
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(updates: Partial<User>): Promise<boolean> {
    try {
      if (!currentUserId.value) {
        throw new Error('No authenticated user');
      }

      loading.value = true;
      error.value = null;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId.value);

      if (updateError) {
        throw updateError;
      }

      await loadUserProfile(currentUserId.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Profile update failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(email: string): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (resetError) {
        throw resetError;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password reset failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function checkAuth(): Promise<void> {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        session.value = currentSession;
        if (!user.value) {
          await loadUserProfile(currentSession.user.id);
        }
      } else {
        if (user.value) {
          user.value = null;
        }
        if (session.value) {
          session.value = null;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Auth check failed';
    } finally {
      if (initializing.value) {
        initializing.value = false;
        clearTimeout(initializationTimeout);
      }
    }
  }

  // Admin functions
  async function getAllUsers(): Promise<User[]> {
    const { data, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return data || [];
  }

  async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user role';
      return false;
    }
  }

  async function deleteUser(userId: string): Promise<boolean> {
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        // Profile deleted but auth record remains — report partial failure
        error.value = 'Profile deleted but auth record cleanup failed. Contact support.';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user';
      return false;
    }
  }

  async function createAdminUser(userData: {
    email: string;
    password: string;
    name: string;
    access_level?: string;
  }): Promise<boolean> {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: 'admin'
        }
      });

      if (authError || !authData.user) {
        throw authError || new Error('Failed to create auth user');
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: 'admin' as UserRole,
          access_level: userData.access_level || 'full'
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id).catch(cleanupErr => {
          console.error('Failed to clean up auth user after profile creation failure:', cleanupErr);
        });
        throw profileError;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create admin user';
      return false;
    }
  }

  // Fallback timeout in case getSession() hangs and onAuthStateChange never fires
  initializationTimeout = setTimeout(() => {
    if (initializing.value) {
      initializing.value = false;

      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession && !user.value) {
          loadUserProfile(currentSession.user.id).catch(() => {
            // Timeout fallback — profile load failure is non-critical here
          });
        }
      }).catch(() => {
        // Timeout fallback — session check failure is non-critical here
      });
    }
  }, 1000);

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
    getAllUsers,
    updateUserRole,
    deleteUser,
    createAdminUser,
    loadUserProfile
  };
}
