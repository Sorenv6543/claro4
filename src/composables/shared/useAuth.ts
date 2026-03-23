// Mock auth composable — wraps a mock user store with login/logout/register.
// NOT used by the main auth store (which delegates to useSupabaseAuth).
// Use for development/testing flows that need auth-like behavior without Supabase.

import type { Admin, Cleaner, PropertyOwner, User, UserRole, UserSettings } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * Composable for authentication and user management
 * Currently uses mock data but designed to be replaced with real auth
 */
export function useAuth () {
  const userStore = useUserStore()

  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  // Mock users for development
  const mockUsers: User[] = [
    {
      id: 'owner-1',
      email: 'owner@example.com',
      name: 'Property Owner',
      role: 'owner' as UserRole,
      company_name: 'Luxury Rentals Inc.',
      notifications_enabled: true,
      timezone: 'America/New_York',
      theme: 'light' as const,
      language: 'en',
    } as PropertyOwner,
    {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as UserRole,
      access_level: 'full' as const,
      notifications_enabled: true,
      timezone: 'America/New_York',
      theme: 'dark' as const,
      language: 'en',
    } as Admin,
    {
      id: 'cleaner-1',
      email: 'cleaner@example.com',
      name: 'Cleaning Staff',
      role: 'cleaner' as UserRole,
      skills: ['deep clean', 'carpet cleaning', 'window washing'],
      max_daily_bookings: 3,
      location_lat: 40.7128,
      location_lng: -74.006,
      notifications_enabled: true,
      timezone: 'America/New_York',
      theme: 'light',
      language: 'en',
    } as Cleaner,
  ]

  /**
   * Login with email and password
   * This is a mock implementation
   */
  async function login (email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Simple mock validation
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Find mock user by email
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        throw new Error('Invalid credentials')
      }

      // Set user in store
      userStore.setUser(user as User)

      success.value = 'Logged in successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Login failed'
      loading.value = false
      return false
    }
  }

  /**
   * Logout current user
   */
  async function logout (): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Clear user data
      userStore.clearUserPreferences()

      success.value = 'Logged out successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Logout failed'
      loading.value = false
      return false
    }
  }

  /**
   * Register a new user
   * This is a mock implementation
   */
  async function register (userData: {
    email: string
    password: string
    name: string
    role: UserRole
    company_name?: string
  }): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Validate required fields
      if (!userData.email || !userData.password || !userData.name || !userData.role) {
        throw new Error('All fields are required')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format')
      }

      // Validate password strength
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      // Check if email already exists
      const existingUser = mockUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase())
      if (existingUser) {
        throw new Error('Email already in use')
      }

      // Create user based on role
      let newUser: User

      switch (userData.role) {
        case 'owner': {
          newUser = {
            id: `owner-${uuidv4()}`,
            email: userData.email,
            name: userData.name,
            role: 'owner',
            company_name: userData.company_name || '',
            notifications_enabled: true,
            timezone: 'America/New_York',
            theme: 'light' as const,
            language: 'en',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as PropertyOwner

          break
        }
        case 'admin': {
          newUser = {
            id: `admin-${uuidv4()}`,
            email: userData.email,
            name: userData.name,
            role: 'admin',
            access_level: 'limited',
            notifications_enabled: true,
            timezone: 'America/New_York',
            theme: 'dark' as const,
            language: 'en',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Admin

          break
        }
        case 'cleaner': {
          newUser = {
            id: `cleaner-${uuidv4()}`,
            email: userData.email,
            name: userData.name,
            role: 'cleaner',
            skills: [],
            max_daily_bookings: 2,
            notifications_enabled: true,
            timezone: 'America/New_York',
            theme: 'light' as const,
            language: 'en',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as Cleaner

          break
        }
        default: {
          throw new Error('Invalid user role')
        }
      }

      // Add to mock users (in a real app, this would be saved to a database)
      mockUsers.push(newUser)

      // Auto-login the new user
      userStore.setUser(newUser)

      success.value = 'Registered successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Registration failed'
      loading.value = false
      return false
    }
  }

  /**
   * Update user settings
   */
  async function updateUserSettings (settings: Partial<UserSettings>): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      // Check if user is logged in
      if (!userStore.user) {
        throw new Error('User not logged in')
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Update user in store with new settings, mapping UserSettings keys to flat User fields
      const settingsMap: Record<keyof UserSettings, keyof User> = {
        notifications: 'notifications_enabled',
        timezone: 'timezone',
        theme: 'theme',
        language: 'language',
      }

      const patch: Partial<User> = {}
      for (const [settingsKey, userKey] of Object.entries(settingsMap) as [keyof UserSettings, keyof User][]) {
        if (settingsKey in settings) {
          (patch as Record<string, unknown>)[userKey as string] = settings[settingsKey as keyof UserSettings]
        }
      }

      const updatedUser = {
        ...userStore.user,
        ...patch,
        updated_at: new Date().toISOString(),
      }

      userStore.setUser(updatedUser)

      success.value = 'Settings updated successfully'
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to update settings'
      loading.value = false
      return false
    }
  }

  return {
    // State
    loading,
    error,
    success,

    // User data
    user: computed(() => userStore.user),
    isAuthenticated: computed(() => userStore.isAuthenticated),

    // Auth methods
    login,
    logout,
    register,
    updateUserSettings,

    // Helper getters
    isOwner: computed(() => userStore.user?.role === 'owner'),
    isAdmin: computed(() => userStore.user?.role === 'admin'),
    isCleaner: computed(() => userStore.user?.role === 'cleaner'),
  }
}
