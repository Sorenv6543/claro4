import type { Booking, Cleaner } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { useCleanerTeamStore } from '@/stores/cleanerTeam'
import { useUserProfileStore } from '@/stores/userProfile'
import { setAdminUser } from '../../utils/test-utils'

// Mock Supabase composables
vi.mock('@/composables/supabase/useSupabaseUserProfiles', () => ({
  useSupabaseUserProfiles: () => ({
    fetchByRole: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/composables/supabase/useSupabaseCleanerTeams', () => ({
  useSupabaseCleanerTeams: () => ({
    fetchActive: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe('useCleanerManagement', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let bookingStore: ReturnType<typeof useBookingStore>
  let userProfileStore: ReturnType<typeof useUserProfileStore>
  let _cleanerTeamStore: ReturnType<typeof useCleanerTeamStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    bookingStore = useBookingStore()
    userProfileStore = useUserProfileStore()
    _cleanerTeamStore = useCleanerTeamStore()

    // Reset supabase mocks between tests
    vi.mocked(supabase.from).mockClear()
    vi.mocked(supabase.functions.invoke).mockClear()
  })

  // ===== ACCESS CONTROL TESTS =====
  describe('Access Control - Admin Authentication Required', () => {
    it('fetchCleaners() returns false when no admin user', async () => {
      // Don't set any user
      const { fetchCleaners } = useCleanerManagement()
      const result = await fetchCleaners()
      expect(result).toBe(false)
    })

    it('createCleaner() returns null when no admin user', async () => {
      // Don't set any user
      const { createCleaner } = useCleanerManagement()
      const result = await createCleaner({
        name: 'John Cleaner',
        email: 'john@test.com',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
      })
      expect(result).toBeNull()
    })

    it('assignCleanerToBooking() returns false when no admin user', async () => {
      // Don't set any user
      const { assignCleanerToBooking } = useCleanerManagement()
      const result = await assignCleanerToBooking('c1', 'b1')
      expect(result).toBe(false)
    })

    it('unassignCleanerFromBooking() returns false when no admin user', async () => {
      // Don't set any user
      const { unassignCleanerFromBooking } = useCleanerManagement()
      const result = await unassignCleanerFromBooking('b1')
      expect(result).toBe(false)
    })

    it('deleteCleaner() returns false when no admin user', async () => {
      // Don't set any user
      const { deleteCleaner } = useCleanerManagement()
      const result = await deleteCleaner('c1')
      expect(result).toBe(false)
    })

    it('updateCleaner() returns false when no admin user', async () => {
      // Don't set any user
      const { updateCleaner } = useCleanerManagement()
      const result = await updateCleaner('c1', { name: 'Updated' })
      expect(result).toBe(false)
    })
  })

  // ===== CRITICAL BUG: assignCleanerToBooking DB Persistence =====
  describe('assignCleanerToBooking - DB Persistence', () => {
    it('updates local store and persists to Supabase', async () => {
      setAdminUser(authStore, 'admin1')

      // Add a cleaner to the store
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      // Add a booking to the store
      const booking: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: '2024-04-12',
        checkout_date: '2024-04-13',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'pending',
        priority: 'normal',
      }
      bookingStore.setBooking(booking.id, booking)

      const { assignCleanerToBooking } = useCleanerManagement()
      const result = await assignCleanerToBooking('c1', 'b1')

      // Assignment succeeds
      expect(result).toBe(true)

      // Local store is updated
      const updatedBooking = bookingStore.bookings.get('b1')
      expect(updatedBooking?.assigned_cleaner_id).toBe('c1')
      expect(updatedBooking?.status).toBe('scheduled')

      // FIXED: supabase.from('bookings') is now called for the update
      const fromCalls = vi.mocked(supabase.from).mock.calls
      const bookingsFromCalls = fromCalls.filter(call => call[0] === 'bookings')
      expect(bookingsFromCalls.length).toBeGreaterThan(0)
    })
  })

  // ===== FIXED: unassignCleanerFromBooking now persists to Supabase =====
  describe('unassignCleanerFromBooking - DB Persistence', () => {
    it('updates local store and persists to Supabase', async () => {
      setAdminUser(authStore, 'admin1')

      // Add a cleaner and booking with assignment
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      const booking: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: '2024-04-12',
        checkout_date: '2024-04-13',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      bookingStore.setBooking(booking.id, booking)

      const { unassignCleanerFromBooking } = useCleanerManagement()
      const result = await unassignCleanerFromBooking('b1')

      // Function succeeds
      expect(result).toBe(true)

      // Local store is updated
      const updatedBooking = bookingStore.bookings.get('b1')
      expect(updatedBooking?.assigned_cleaner_id).toBeNull()
      expect(updatedBooking?.status).toBe('pending')

      // FIXED: supabase.from('bookings') is now called for the update
      const fromCalls = vi.mocked(supabase.from).mock.calls
      const bookingsFromCalls = fromCalls.filter(call => call[0] === 'bookings')
      expect(bookingsFromCalls.length).toBeGreaterThan(0)
    })
  })

  // ===== CRITICAL BUG: getCleanerPerformance Mock Data =====
  describe('getCleanerPerformance - Mock Data Bug', () => {
    it('returns mocked random data instead of real metrics (known bug)', async () => {
      setAdminUser(authStore, 'admin1')

      // Add a cleaner
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      // Add a completed booking
      const booking: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: '2024-04-12',
        checkout_date: '2024-04-13',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'completed',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      bookingStore.setBooking(booking.id, booking)

      const { getCleanerPerformance } = useCleanerManagement()
      const perf1 = await getCleanerPerformance('c1')

      // averageRating should be in 4.2-4.8 range (from Math.random())
      expect(perf1.averageRating).toBeGreaterThanOrEqual(4.2)
      expect(perf1.averageRating).toBeLessThanOrEqual(4.8)

      // onTimePercentage should be in 85-95 range
      expect(perf1.onTimePercentage).toBeGreaterThanOrEqual(85)
      expect(perf1.onTimePercentage).toBeLessThanOrEqual(95)

      // Call again - values are in the expected range (may or may not differ
      // due to Math.random determinism in test environments)
      const perf2 = await getCleanerPerformance('c1')
      expect(perf2.averageRating).toBeGreaterThanOrEqual(4.2)
      expect(perf2.averageRating).toBeLessThanOrEqual(4.8)
      expect(perf2.onTimePercentage).toBeGreaterThanOrEqual(85)
      expect(perf2.onTimePercentage).toBeLessThanOrEqual(95)
    })
  })

  // ===== CLEANER VALIDATION TESTS =====
  describe('Cleaner Validation', () => {
    beforeEach(() => {
      setAdminUser(authStore, 'admin1')
    })

    it('createCleaner() with empty name returns error', async () => {
      const { createCleaner, error } = useCleanerManagement()
      const result = await createCleaner({
        name: '',
        email: 'cleaner@test.com',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
      })
      expect(result).toBeNull()
      expect(error.value).toContain('Name and email are required')
    })

    it('createCleaner() with empty email returns error', async () => {
      const { createCleaner, error } = useCleanerManagement()
      const result = await createCleaner({
        name: 'John Cleaner',
        email: '',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
      })
      expect(result).toBeNull()
      expect(error.value).toContain('Name and email are required')
    })

    it('createCleaner() with max_daily_bookings < 1 returns error', async () => {
      const { createCleaner, error } = useCleanerManagement()
      const result = await createCleaner({
        name: 'John Cleaner',
        email: 'john@test.com',
        skills: ['deep_clean'],
        max_daily_bookings: 0,
      })
      expect(result).toBeNull()
      expect(error.value).toContain('Max daily bookings must be between 1 and 10')
    })

    it('createCleaner() with max_daily_bookings > 10 returns error', async () => {
      const { createCleaner, error } = useCleanerManagement()
      const result = await createCleaner({
        name: 'John Cleaner',
        email: 'john@test.com',
        skills: ['deep_clean'],
        max_daily_bookings: 11,
      })
      expect(result).toBeNull()
      expect(error.value).toContain('Max daily bookings must be between 1 and 10')
    })

    it('createCleaner() with empty skills array returns error', async () => {
      const { createCleaner, error } = useCleanerManagement()
      const result = await createCleaner({
        name: 'John Cleaner',
        email: 'john@test.com',
        skills: [],
        max_daily_bookings: 4,
      })
      expect(result).toBeNull()
      expect(error.value).toContain('At least one skill is required')
    })
  })

  // ===== ASSIGNMENT AVAILABILITY TESTS =====
  describe('Assignment Availability', () => {
    beforeEach(() => {
      setAdminUser(authStore, 'admin1')
    })

    it('assignCleanerToBooking() when cleaner is at max capacity returns error', async () => {
      // Add cleaner with max_daily_bookings = 2
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 2,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      // Add 2 existing bookings for today (at capacity)
      const today = new Date().toISOString().split('T')[0]
      const booking1: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '09:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      const booking2: Booking = {
        id: 'b2',
        property_id: 'prop2',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '13:00',
        checkout_time: '15:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      bookingStore.setBooking(booking1.id, booking1)
      bookingStore.setBooking(booking2.id, booking2)

      // Try to assign a third booking
      const booking3: Booking = {
        id: 'b3',
        property_id: 'prop3',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '16:00',
        checkout_time: '18:00',
        booking_type: 'standard',
        status: 'pending',
        priority: 'normal',
      }
      bookingStore.setBooking(booking3.id, booking3)

      const { assignCleanerToBooking, error } = useCleanerManagement()
      const result = await assignCleanerToBooking('c1', 'b3')

      expect(result).toBe(false)
      expect(error.value).toContain('not available')
    })

    it('assignCleanerToBooking() with non-existent cleaner returns error', async () => {
      const booking: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: '2024-04-12',
        checkout_date: '2024-04-13',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'pending',
        priority: 'normal',
      }
      bookingStore.setBooking(booking.id, booking)

      const { assignCleanerToBooking, error } = useCleanerManagement()
      const result = await assignCleanerToBooking('non-existent-c', 'b1')

      expect(result).toBe(false)
      expect(error.value).toContain('Cleaner not found')
    })

    it('assignCleanerToBooking() with non-existent booking returns error', async () => {
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      const { assignCleanerToBooking, error } = useCleanerManagement()
      const result = await assignCleanerToBooking('c1', 'non-existent-b')

      expect(result).toBe(false)
      expect(error.value).toContain('Booking not found')
    })
  })

  // ===== DELETE PROTECTION TESTS =====
  describe('Delete Protection', () => {
    beforeEach(() => {
      setAdminUser(authStore, 'admin1')
    })

    it('deleteCleaner() with active assignments returns error', async () => {
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      // Add a scheduled booking for this cleaner
      const booking: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: '2024-04-12',
        checkout_date: '2024-04-13',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      bookingStore.setBooking(booking.id, booking)

      const { deleteCleaner, error } = useCleanerManagement()
      const result = await deleteCleaner('c1')

      expect(result).toBe(false)
      expect(error.value).toContain('active assignments')
    })

    it('deleteCleaner() with no active assignments proceeds (calls edge function)', async () => {
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      // Mock the edge function
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      })

      const { deleteCleaner } = useCleanerManagement()
      const result = await deleteCleaner('c1')

      expect(result).toBe(true)
      expect(vi.mocked(supabase.functions.invoke)).toHaveBeenCalledWith(
        'admin-users',
        expect.objectContaining({
          body: expect.objectContaining({
            action: 'delete',
            userId: 'c1',
          }),
        }),
      )
    })
  })

  // ===== COMPUTED PROPERTIES TESTS =====
  describe('Computed Properties', () => {
    beforeEach(() => {
      setAdminUser(authStore, 'admin1')
    })

    it('allCleaners returns cleaners with default skills and max_daily_bookings', () => {
      const cleaner1: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: undefined as any,
        max_daily_bookings: undefined as any,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      const cleaner2: Cleaner = {
        id: 'c2',
        email: 'cleaner2@test.com',
        name: 'Cleaner 2',
        role: 'cleaner',
        skills: ['deep_clean', 'window_clean'],
        max_daily_bookings: 6,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner1.id, cleaner1 as any)
      userProfileStore.setUserProfile(cleaner2.id, cleaner2)

      const { allCleaners } = useCleanerManagement()

      expect(allCleaners.value).toHaveLength(2)
      expect(allCleaners.value[0].skills).toEqual([])
      expect(allCleaners.value[0].max_daily_bookings).toBe(4)
      expect(allCleaners.value[1].skills).toEqual(['deep_clean', 'window_clean'])
      expect(allCleaners.value[1].max_daily_bookings).toBe(6)
    })

    it('availableCleaners filters out cleaners at max capacity', () => {
      const today = new Date().toISOString().split('T')[0]

      // Cleaner 1: at max capacity (2/2)
      const cleaner1: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 2,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      // Cleaner 2: has capacity (1/3)
      const cleaner2: Cleaner = {
        id: 'c2',
        email: 'cleaner2@test.com',
        name: 'Cleaner 2',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 3,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner1.id, cleaner1)
      userProfileStore.setUserProfile(cleaner2.id, cleaner2)

      // Add 2 bookings for c1 today
      const b1: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '09:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      const b2: Booking = {
        id: 'b2',
        property_id: 'prop2',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '13:00',
        checkout_time: '15:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      // Add 1 booking for c2 today
      const b3: Booking = {
        id: 'b3',
        property_id: 'prop3',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '09:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c2',
      }
      bookingStore.setBooking(b1.id, b1)
      bookingStore.setBooking(b2.id, b2)
      bookingStore.setBooking(b3.id, b3)

      const { availableCleaners } = useCleanerManagement()

      expect(availableCleaners.value).toHaveLength(1)
      expect(availableCleaners.value[0].id).toBe('c2')
    })

    it('cleanerWorkloads calculates correct workload status', () => {
      const today = new Date().toISOString().split('T')[0]

      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      // Add bookings to reach different utilization rates
      // Light: 1/4 = 25%
      const b1: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: today,
        checkout_date: today,
        checkin_time: '09:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'scheduled',
        priority: 'normal',
        assigned_cleaner_id: 'c1',
      }
      bookingStore.setBooking(b1.id, b1)

      const { cleanerWorkloads } = useCleanerManagement()

      expect(cleanerWorkloads.value).toHaveLength(1)
      const workload = cleanerWorkloads.value[0]
      expect(workload.cleanerId).toBe('c1')
      expect(workload.currentBookings).toBe(1) // 1 scheduled booking assigned to cleaner
      expect(workload.todayBookings).toBe(1)
      expect(workload.utilizationRate).toBe(25)
      expect(workload.workloadStatus).toBe('light')
    })

    it('systemCleanerMetrics aggregates total cleaners, available count, skill coverage', () => {
      const cleaner1: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      const cleaner2: Cleaner = {
        id: 'c2',
        email: 'cleaner2@test.com',
        name: 'Cleaner 2',
        role: 'cleaner',
        skills: ['deep_clean', 'window_clean'],
        max_daily_bookings: 3,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner1.id, cleaner1)
      userProfileStore.setUserProfile(cleaner2.id, cleaner2)

      const { systemCleanerMetrics } = useCleanerManagement()

      expect(systemCleanerMetrics.value.totalCleaners).toBe(2)
      expect(systemCleanerMetrics.value.totalCapacity).toBe(7) // 4 + 3
      expect(systemCleanerMetrics.value.skillCoverage).toHaveLength(2)
      expect(systemCleanerMetrics.value.skillCoverage[0]).toEqual({
        skill: 'deep_clean',
        cleanerCount: 2,
      })
      expect(systemCleanerMetrics.value.skillCoverage[1]).toEqual({
        skill: 'window_clean',
        cleanerCount: 1,
      })
    })
  })

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    beforeEach(() => {
      setAdminUser(authStore, 'admin1')
    })

    it('unassignCleanerFromBooking() when booking is not assigned returns error', async () => {
      const booking: Booking = {
        id: 'b1',
        property_id: 'prop1',
        owner_id: 'owner1',
        checkin_date: '2024-04-12',
        checkout_date: '2024-04-13',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard',
        status: 'pending',
        priority: 'normal',
        assigned_cleaner_id: null,
      }
      bookingStore.setBooking(booking.id, booking)

      const { unassignCleanerFromBooking, error } = useCleanerManagement()
      const result = await unassignCleanerFromBooking('b1')

      expect(result).toBe(false)
      expect(error.value).toContain('not assigned to any cleaner')
    })

    it('getCleanerAvailability() returns correct availability structure', async () => {
      const today = new Date().toISOString().split('T')[0]

      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      const { getCleanerAvailability } = useCleanerManagement()
      const availability = await getCleanerAvailability('c1', today)

      expect(availability).toHaveProperty('cleanerId')
      expect(availability).toHaveProperty('date')
      expect(availability).toHaveProperty('isAvailable')
      expect(availability).toHaveProperty('currentBookings')
      expect(availability).toHaveProperty('maxBookings')
      expect(availability).toHaveProperty('conflictingBookings')
      expect(availability).toHaveProperty('recommendedTimeSlots')
      expect(availability.cleanerId).toBe('c1')
      expect(availability.date).toBe(today)
      expect(availability.isAvailable).toBe(true)
      expect(Array.isArray(availability.recommendedTimeSlots)).toBe(true)
    })

    it('getCleanerById() returns correct cleaner or undefined', () => {
      const cleaner: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner.id, cleaner)

      const { getCleanerById } = useCleanerManagement()

      expect(getCleanerById('c1')).toBeDefined()
      expect(getCleanerById('c1')?.name).toBe('Cleaner 1')
      expect(getCleanerById('non-existent')).toBeUndefined()
    })

    it('getCleanersBySkill() filters cleaners correctly', () => {
      const cleaner1: Cleaner = {
        id: 'c1',
        email: 'cleaner1@test.com',
        name: 'Cleaner 1',
        role: 'cleaner',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      const cleaner2: Cleaner = {
        id: 'c2',
        email: 'cleaner2@test.com',
        name: 'Cleaner 2',
        role: 'cleaner',
        skills: ['deep_clean', 'window_clean'],
        max_daily_bookings: 4,
        timezone: 'UTC',
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
      }
      userProfileStore.setUserProfile(cleaner1.id, cleaner1)
      userProfileStore.setUserProfile(cleaner2.id, cleaner2)

      const { getCleanersBySkill } = useCleanerManagement()

      const deepCleaners = getCleanersBySkill('deep_clean')
      expect(deepCleaners).toHaveLength(2)

      const windowCleaners = getCleanersBySkill('window_clean')
      expect(windowCleaners).toHaveLength(1)
      expect(windowCleaners[0].id).toBe('c2')
    })
  })

  // ===== STATE MANAGEMENT TESTS =====
  describe('State Management', () => {
    beforeEach(() => {
      setAdminUser(authStore, 'admin1')
    })

    it('error state is set correctly when operations fail', async () => {
      const { createCleaner, error } = useCleanerManagement()

      await createCleaner({
        name: '',
        email: 'test@test.com',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
      })

      expect(error.value).toBeTruthy()
      expect(error.value).toContain('Name and email are required')
    })

    it('clearState() resets all state', async () => {
      const { createCleaner, clearState, error, loading, success } = useCleanerManagement()

      await createCleaner({
        name: '',
        email: 'test@test.com',
        skills: ['deep_clean'],
        max_daily_bookings: 4,
      })

      expect(error.value).toBeTruthy()

      clearState()

      expect(error.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(success.value).toBeNull()
    })
  })
})
