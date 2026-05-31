/**
 * User Type Definitions
 * Types for users in the property cleaning scheduler
 */

/**
 * Valid user roles in the system
 */
export type UserRole = 'owner' | 'admin' | 'cleaner'

/**
 * Valid theme preferences
 */
export type ThemePreference = 'light' | 'dark' | 'system'

/**
 * User settings interface (nested structure)
 */
export interface UserSettings {
  notifications: boolean
  timezone: string
  theme: ThemePreference
  language: string
}

/**
 * Base User interface
 * Core data model for all users. Settings are stored as flat fields only.
 */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  company_name?: string
  notifications_enabled: boolean
  timezone: string
  theme: ThemePreference
  language: string
  access_level?: 'full' | 'limited'
  skills?: string[] | null
  max_daily_bookings?: number | null
  location_lat?: number | null
  location_lng?: number | null
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string | null
}

/**
 * Data emitted by UserFormDialog on submit
 */
export interface UserFormData {
  name: string
  email: string
  password: string
  role: UserRole
  company_name: string
  access_level: string
  skills: string[]
  max_daily_bookings: number
  location: string
  timezone: string
  language: string
  notifications_enabled: boolean
}

/**
 * Property Owner user
 * Has properties that need cleaning
 */
export interface PropertyOwner extends User {
  role: 'owner'
  company_name?: string
}

/**
 * Admin user
 * Manages the cleaning company
 */
export interface Admin extends User {
  role: 'admin'
  access_level: 'full' | 'limited'
}

/**
 * Cleaner user
 * Performs the actual cleaning work
 */
export interface Cleaner extends User {
  role: 'cleaner'
  skills: string[]
  max_daily_bookings: number
}

/**
 * Type guard for PropertyOwner
 */
export function isPropertyOwner (user: User): user is PropertyOwner {
  return user.role === 'owner'
}

/**
 * Type guard for Admin
 */
export function isAdmin (user: User): user is Admin {
  return user.role === 'admin'
}

/**
 * Type guard for Cleaner
 */
export function isCleaner (user: User): user is Cleaner {
  return (
    user.role === 'cleaner'
    && Array.isArray(user.skills)
    && typeof user.max_daily_bookings === 'number'
  )
}

export type UserMap = Map<string, User>
