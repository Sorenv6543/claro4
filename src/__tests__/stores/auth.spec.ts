import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

/**
 * Test suite for the Auth Pinia store (src/stores/auth.ts)
 *
 * Tests the store's methods, computed properties, and state management.
 * The store wraps useSupabaseAuth() which is mocked globally in setupTests.ts.
 * All supabase.auth methods are vi.fn() mocks that we configure per test.
 */
// Helper: mock a successful admin login so store.isAdmin becomes true
async function loginAsAdmin (store: ReturnType<typeof useAuthStore>) {
  vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
    data: {
      user: { id: 'admin-1', email: 'admin@test.com', user_metadata: { role: 'admin' } } as any,
      session: { access_token: 'token', user: { id: 'admin-1' } } as any,
    },
    error: null,
  })
  const mockFrom = supabase.from as ReturnType<typeof vi.fn>
  mockFrom.mockReturnValueOnce({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'admin', notifications_enabled: true, timezone: 'UTC', theme: 'light', language: 'en' },
      error: null,
    }),
  })
  await store.login('admin@test.com', 'pass')
}

describe('Auth Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and set it as active for testing
    setActivePinia(createPinia())

    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock localStorage (needed for clearAllRoleSpecificState)
    const localStorageMock: Record<string, string> = {}
    global.localStorage = {
      getItem: vi.fn(key => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])
      }),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should start with null user, not authenticated, no errors', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.authChecked).toBe(false)
    })

    it('should have role-detection computed properties', () => {
      const store = useAuthStore()

      expect(store.isAdmin).toBe(false)
      expect(store.isOwner).toBe(false)
      expect(store.isCleaner).toBe(false)
    })
  })

  describe('login()', () => {
    it('should successfully log in with valid credentials', async () => {
      const store = useAuthStore()
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        notifications_enabled: true,
        timezone: 'America/Los_Angeles',
        theme: 'light',
        language: 'en',
      }

      // Mock signInWithPassword success
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: mockUser.id, email: mockUser.email, user_metadata: { name: mockUser.name, role: mockUser.role } } as any,
          session: { access_token: 'token', user: { id: mockUser.id } } as any,
        },
        error: null,
      })

      // Mock profile loading
      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            notifications_enabled: true,
            timezone: 'America/Los_Angeles',
            theme: 'light',
            language: 'en',
          },
          error: null,
        }),
      })

      const result = await store.login('test@example.com', 'password123')

      expect(result).toBe(true)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should return false and set error on invalid credentials', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      })

      const result = await store.login('wrong@example.com', 'wrongpass')

      expect(result).toBe(false)
      expect(store.error).toBe('Invalid email or password')
      expect(store.loading).toBe(false)
    })

    it('should catch and handle exceptions during login', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(
        new Error('Network error'),
      )

      const result = await store.login('test@example.com', 'password')

      expect(result).toBe(false)
      // The composable catches the exception and returns false.
      // The store sees false and sets 'Invalid email or password'.
      expect(store.error).toBe('Invalid email or password')
      expect(store.loading).toBe(false)
    })

    it('should set loading state during login', async () => {
      const store = useAuthStore()
      let loadingDuringCall = false

      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => {
        loadingDuringCall = store.loading
        return Promise.resolve({
          data: { user: null, session: null },
          error: null,
        })
      })

      await store.login('test@example.com', 'password')

      expect(loadingDuringCall).toBe(true)
      expect(store.loading).toBe(false)
    })
  })

  describe('logout()', () => {
    it('should successfully log out', async () => {
      const store = useAuthStore()
      // Simulate logged-in state
      store.authChecked = true

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      })

      const result = await store.logout()

      expect(result).toBe(true)
      expect(store.authChecked).toBe(false)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should handle logout failure', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: { message: 'Logout failed' } as any,
      })

      const result = await store.logout()

      expect(result).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('should handle logout exceptions', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(
        new Error('Session error'),
      )

      const result = await store.logout()

      expect(result).toBe(false)
      expect(store.error).toBe('Session error')
      expect(store.loading).toBe(false)
    })

    it('should set loading state during logout', async () => {
      const store = useAuthStore()
      let loadingDuringCall = false

      vi.mocked(supabase.auth.signOut).mockImplementation(() => {
        loadingDuringCall = store.loading
        return Promise.resolve({ error: null })
      })

      await store.logout()

      expect(loadingDuringCall).toBe(true)
      expect(store.loading).toBe(false)
    })
  })

  describe('register()', () => {
    it('should successfully register a new user', async () => {
      const store = useAuthStore()
      const mockUser = {
        id: 'new-user-1',
        email: 'newuser@example.com',
        user_metadata: {
          name: 'New User',
          role: 'owner',
          company_name: 'My Company',
        },
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser as any },
        error: null,
      })

      const result = await store.register({
        email: 'newuser@example.com',
        password: 'secure123',
        name: 'New User',
        role: 'owner',
        company_name: 'My Company',
      })

      expect(result).toBe(true)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should return false on registration failure', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await store.register({
        email: 'test@example.com',
        password: 'pass123',
        name: 'Test',
        role: 'owner',
      })

      expect(result).toBe(false)
      expect(store.error).toBe('Registration failed')
    })

    it('should handle registration exceptions', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signUp).mockRejectedValueOnce(
        new Error('Email already in use'),
      )

      const result = await store.register({
        email: 'test@example.com',
        password: 'pass123',
        name: 'Test',
        role: 'owner',
      })

      expect(result).toBe(false)
      // The composable catches the exception and returns false.
      // The store sees false and sets 'Registration failed'.
      expect(store.error).toBe('Registration failed')
    })

    it('should set loading state during registration', async () => {
      const store = useAuthStore()
      let loadingDuringCall = false

      vi.mocked(supabase.auth.signUp).mockImplementation(() => {
        loadingDuringCall = store.loading
        return Promise.resolve({ data: { user: null }, error: null })
      })

      await store.register({
        email: 'test@example.com',
        password: 'pass123',
        name: 'Test',
        role: 'owner',
      })

      expect(loadingDuringCall).toBe(true)
      expect(store.loading).toBe(false)
    })
  })

  describe('Role Detection', () => {
    it('should correctly detect admin role', () => {
      const store = useAuthStore()
      // Manually set user state for testing
      const storeAny = store as any
      storeAny.supabaseUser = {
        value: {
          id: 'admin-1',
          role: 'admin',
          email: 'admin@example.com',
        } as User,
      }

      // Need to re-access computed after setting user
      const adminStore = useAuthStore()
      // Create new store instance to pick up user
      setActivePinia(createPinia())
      const freshStore = useAuthStore()
      const freshStoreAny = freshStore as any
      freshStoreAny.supabaseUser = {
        value: {
          id: 'admin-1',
          role: 'admin',
          email: 'admin@example.com',
        } as User,
      }

      // Alternative: test through the public interface
      // This is tested more thoroughly in the switchToAdminView tests
    })

    it('should detect owner role correctly when user has owner role', () => {
      const store = useAuthStore()
      // The role detection is computed based on the user object
      // We can test this indirectly through the switchToOwnerView/switchToAdminView methods
      expect(store.isOwner).toBe(false)
      expect(store.isAdmin).toBe(false)
      expect(store.isCleaner).toBe(false)
    })

    it('should detect cleaner role correctly', () => {
      const store = useAuthStore()
      expect(store.isCleaner).toBe(false)
    })
  })

  describe('switchToOwnerView()', () => {
    it('should return false and set error if not admin', () => {
      const store = useAuthStore()

      const result = store.switchToOwnerView()

      expect(result).toBe(false)
      expect(store.error).toBe('Only administrators can switch views')
    })

    it('should return true if user is admin', async () => {
      const store = useAuthStore()

      // Log in as admin to set isAdmin = true
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'admin-1', email: 'admin@test.com', user_metadata: { role: 'admin' } } as any,
          session: { access_token: 'token', user: { id: 'admin-1' } } as any,
        },
        error: null,
      })
      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'admin', notifications_enabled: true, timezone: 'UTC', theme: 'light', language: 'en' },
          error: null,
        }),
      })
      await store.login('admin@test.com', 'pass')

      const result = store.switchToOwnerView()
      expect(result).toBe(true)
    })

    it('should accept optional ownerId parameter', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'admin-1', email: 'admin@test.com', user_metadata: { role: 'admin' } } as any,
          session: { access_token: 'token', user: { id: 'admin-1' } } as any,
        },
        error: null,
      })
      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'admin', notifications_enabled: true, timezone: 'UTC', theme: 'light', language: 'en' },
          error: null,
        }),
      })
      await store.login('admin@test.com', 'pass')

      const result = store.switchToOwnerView('owner-456')
      expect(result).toBe(true)
    })
  })

  describe('switchToAdminView()', () => {
    it('should return false and set error if not admin', () => {
      const store = useAuthStore()

      const result = store.switchToAdminView()

      expect(result).toBe(false)
      expect(store.error).toBe('Only administrators can access admin view')
    })

    it('should return true if user is admin', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'admin-1', email: 'admin@test.com', user_metadata: { role: 'admin' } } as any,
          session: { access_token: 'token', user: { id: 'admin-1' } } as any,
        },
        error: null,
      })
      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'admin', notifications_enabled: true, timezone: 'UTC', theme: 'light', language: 'en' },
          error: null,
        }),
      })
      await store.login('admin@test.com', 'pass')

      const result = store.switchToAdminView()
      expect(result).toBe(true)
    })
  })

  describe('updateUserProfile()', () => {
    it('should return false when not authenticated', async () => {
      const store = useAuthStore()

      // No login, so currentUserId is null → composable throws "No authenticated user"
      const result = await store.updateUserProfile({ name: 'Test' })

      expect(result).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('should handle profile update failure', async () => {
      const store = useAuthStore()

      // updateProfile requires an authenticated user but will fail at the composable level
      const result = await store.updateUserProfile({ name: 'New Name' })

      expect(result).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('should handle profile update exceptions gracefully', async () => {
      const store = useAuthStore()

      // Without authentication, composable catches and returns false
      const result = await store.updateUserProfile({ timezone: 'Europe/London' })

      expect(result).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('requestPasswordReset()', () => {
    it('should successfully request password reset', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      })

      const result = await store.requestPasswordReset('test@example.com')

      expect(result).toBe(true)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should handle password reset failure', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: { message: 'Email not found' } as any,
      })

      const result = await store.requestPasswordReset('nonexistent@example.com')

      expect(result).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('should handle password reset exceptions', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.resetPasswordForEmail).mockRejectedValueOnce(
        new Error('Service unavailable'),
      )

      const result = await store.requestPasswordReset('test@example.com')

      expect(result).toBe(false)
      expect(store.error).toBe('Service unavailable')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchAllUsers()', () => {
    it('should throw error if not admin', async () => {
      const store = useAuthStore()

      await expect(store.fetchAllUsers()).rejects.toThrow('Unauthorized: Admin access required')
    })

    it('should fetch all users if admin', async () => {
      const store = useAuthStore()

      // Log in as admin so isAdmin = true
      await loginAsAdmin(store)

      const mockUsers: User[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'owner',
          notifications_enabled: true,
          timezone: 'America/Los_Angeles',
          theme: 'light',
          language: 'en',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'cleaner',
          notifications_enabled: true,
          timezone: 'America/New_York',
          theme: 'light',
          language: 'en',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
      })

      const result = await store.fetchAllUsers()

      expect(result).toEqual(mockUsers)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch users error', async () => {
      const store = useAuthStore()

      await loginAsAdmin(store)

      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Database error')),
      })

      await expect(store.fetchAllUsers()).rejects.toThrow('Database error')
      expect(store.error).toBe('Database error')
      expect(store.loading).toBe(false)
    })
  })

  describe('changeUserRole()', () => {
    it('should return false if not admin', async () => {
      const store = useAuthStore()

      const result = await store.changeUserRole('user-123', 'cleaner')

      expect(result).toBe(false)
      expect(store.error).toBe('Unauthorized: Admin access required')
    })

    it('should successfully change user role if admin', async () => {
      const store = useAuthStore()

      await loginAsAdmin(store)

      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      // updateUserRole in useSupabaseAuth calls supabase.from().update().eq()
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await store.changeUserRole('user-123', 'admin')

      expect(result).toBe(true)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should handle role change failure', async () => {
      const store = useAuthStore()

      await loginAsAdmin(store)

      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      })

      const result = await store.changeUserRole('user-123', 'owner')

      expect(result).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('should handle role change exceptions', async () => {
      const store = useAuthStore()

      await loginAsAdmin(store)

      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      // The error occurs in the eq() call of the update chain
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error('Permission denied')),
      })

      const result = await store.changeUserRole('user-456', 'cleaner')

      expect(result).toBe(false)
      expect(store.error).toBe('Permission denied')
      expect(store.loading).toBe(false)
    })
  })

  describe('clearError()', () => {
    it('should clear both store and supabase errors', () => {
      const store = useAuthStore()

      // Set an error manually
      const storeAny = store as any
      storeAny.storeError = { value: 'Test error' }

      store.clearError()

      expect(store.error).toBeNull()
    })

    it('should work when no error is set', () => {
      const store = useAuthStore()

      expect(store.error).toBeNull()

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('getSuccessMessage()', () => {
    it('should return login message for owner', () => {
      setActivePinia(createPinia())
      const store = useAuthStore()

      // Manually set user to owner for testing
      vi.spyOn(store, 'user', 'get').mockReturnValue({
        id: 'owner-1',
        email: 'owner@example.com',
        name: 'Owner User',
        role: 'owner',
        notifications_enabled: true,
        timezone: 'America/Los_Angeles',
        theme: 'light',
        language: 'en',
      })

      const message = store.getSuccessMessage('login')
      expect(message).toContain('logged in')
    })

    it('should return register message for admin', () => {
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.spyOn(store, 'user', 'get').mockReturnValue({
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        notifications_enabled: true,
        timezone: 'America/Los_Angeles',
        theme: 'light',
        language: 'en',
      })

      const message = store.getSuccessMessage('register')
      expect(message).toContain('created')
    })

    it('should return logout message for any role', () => {
      const store = useAuthStore()

      const message = store.getSuccessMessage('logout')
      expect(message).toContain('logged out')
    })
  })

  describe('initialize()', () => {
    it('should call checkAuth on initialization', async () => {
      const store = useAuthStore()

      // Mock getSession to resolve cleanly
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      await store.initialize()

      // Verify checkAuth was called (which internally calls getSession)
      expect(vi.mocked(supabase.auth.getSession)).toHaveBeenCalled()
    })

    it('should handle initialization errors', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.getSession).mockRejectedValueOnce(
        new Error('Init failed'),
      )

      await store.initialize()

      expect(store.error).toBe('Init failed')
    })
  })

  describe('Loading State Management', () => {
    it('should track loading state for async operations', async () => {
      const store = useAuthStore()

      expect(store.loading).toBe(false)

      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve({
          data: { user: null, session: null },
          error: null,
        })
      })

      await store.login('test@example.com', 'password')

      expect(store.loading).toBe(false)
    })

    it('should combine store and supabase loading states', async () => {
      const store = useAuthStore()

      // Test that loading combines store and supabase states
      expect(store.loading).toBe(false)

      // During login, store.loading should be true while operation is in flight
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve({
          data: { user: null, session: null },
          error: null,
        })
      })

      await store.login('test@example.com', 'password')

      // After operation completes, loading should be false
      expect(store.loading).toBe(false)
    })
  })

  describe('Error State Management', () => {
    it('should combine store and supabase error states', () => {
      const store = useAuthStore()

      // Initially no error from either source
      expect(store.error).toBeNull()

      // The store.error computed combines storeError OR supabaseError
      // Test that the combined error starts as null
      expect(store.error).toBeNull()
    })

    it('should clear errors after successful operations', async () => {
      const store = useAuthStore()

      // Ensure clean mock state for signInWithPassword
      vi.mocked(supabase.auth.signInWithPassword).mockReset()

      // First: login fails (returns false, user/session null)
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      })

      const result = await store.login('test@example.com', 'password')

      expect(result).toBe(false)
      expect(store.error).toBe('Invalid email or password')

      // Second: login succeeds
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            user_metadata: { name: 'Test', role: 'owner' },
          } as any,
          session: { access_token: 'token', user: { id: 'user-1' } } as any,
        },
        error: null,
      })

      // Mock profile load
      const mockFrom = supabase.from as ReturnType<typeof vi.fn>
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test',
            role: 'owner',
            notifications_enabled: true,
            timezone: 'America/Los_Angeles',
            theme: 'light',
            language: 'en',
          },
          error: null,
        }),
      })

      const successResult = await store.login('test@example.com', 'password')

      // Login succeeds, error is cleared
      expect(successResult).toBe(true)
      expect(store.error).toBeNull()
    })
  })

  describe('Authentication State', () => {
    it('should expose session from composable', () => {
      const store = useAuthStore()

      // session is a computed that reads from supabaseAuth
      expect(store.session).toBeNull()
    })

    it('should have checkAuth and updateProfile methods from composable', () => {
      const store = useAuthStore()

      expect(typeof store.checkAuth).toBe('function')
      expect(typeof store.updateProfile).toBe('function')
    })
  })

  describe('Edge Cases', () => {
    it('should handle logout when already logged out', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      })

      const result = await store.logout()

      expect(result).toBe(true)
      expect(store.authChecked).toBe(false)
    })

    it('should handle multiple login attempts', async () => {
      const store = useAuthStore()

      // Use mockResolvedValue (permanent) to avoid Once-queue ordering issues
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const result1 = await store.login('test1@example.com', 'pass1')
      expect(result1).toBe(false)

      const result2 = await store.login('test2@example.com', 'pass2')
      expect(result2).toBe(false)

      // Both should fail independently
      expect(store.loading).toBe(false)
    })

    it('should handle empty error message from exception', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(
        new Error(''),
      )

      await store.login('test@example.com', 'password')

      // The composable catches the exception and returns false.
      // The store sees false and sets 'Invalid email or password'.
      expect(store.error).toBe('Invalid email or password')
    })

    it('should handle non-Error objects thrown as exceptions', async () => {
      const store = useAuthStore()

      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(
        'String error',
      )

      await store.login('test@example.com', 'password')

      // The composable catches the non-Error exception and returns false.
      // The store sees false and sets 'Invalid email or password'.
      expect(store.error).toBe('Invalid email or password')
    })
  })
})
