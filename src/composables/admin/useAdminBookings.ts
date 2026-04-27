import type { Booking, BookingFormData, BookingStatus, BookingType } from '@/types'

import { computed, ref } from 'vue'

import { useErrorHandler } from '@/composables/shared/useErrorHandler'
import { usePerformanceMonitor } from '@/composables/shared/usePerformanceMonitor'
import { BulkAssignSqlError, useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'
import { buildAssignmentUpdate, calculateBookingPriority } from '@/utils/businessLogic'

/**
 * Admin-specific booking composable
 * Uses useSupabaseBookings for CRUD with admin system-wide access
 *
 * Key Features:
 * - NO filtering - access ALL bookings across all owners (key difference from owner version)
 * - Admin-specific functions (cleaner assignment, status management)
 * - System-wide analytics and reporting
 * - Bulk operations for managing multiple bookings
 * - Advanced filtering and business insights
 */
export function useAdminBookings () {
  // Get supabase composable for CRUD and stores for reads
  const {
    createBooking: supaCreate,
    updateBooking: supaUpdate,
    deleteBooking: supaDelete,
    changeBookingStatus: supaChangeStatus,
    assignCleaner: supaAssignCleaner,
    bulkAssignCleaner: supaBulkAssignCleaner,
    bulkChangeStatus: supaBulkChangeStatus,
  } = useSupabaseBookings()
  const authStore = useAuthStore()
  const bookingStore = useBookingStore()
  const propertyStore = usePropertyStore()
  const { measureRolePerformance, trackCachePerformance } = usePerformanceMonitor()
  // useErrorHandler routes errors through Sentry (when DSN configured) — see
  // main.ts and useErrorHandler.reportError. Replaces raw console.error in
  // catch blocks so admin operations are visible in production ops dashboards.
  const errorHandler = useErrorHandler()

  // Admin-specific state
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  // Get current admin user ID
  const currentAdminId = computed(() => authStore.user?.id)

  // COMPUTED PROPERTIES - Admin system-wide data access (NO filtering)

  /**
   * Get ALL bookings across all owners (no filtering)
   * This is the key difference from owner version
   */
  const allBookings = computed((): Booking[] => {
    return Array.from(bookingStore.bookings.values())
  })

  /**
   * Get ALL properties across all owners (no filtering)
   */
  const allProperties = computed(() => {
    return Array.from(propertyStore.properties.values())
  })

  /**
   * Get ALL turn bookings across all properties (system-wide)
   */
  const systemTurns = computed(() => {
    return allBookings.value.filter(booking => booking.booking_type === 'turn')
  })

  /**
   * Get today's turn bookings across ALL properties (system-wide)
   */
  const systemTodayTurns = computed(() => {
    const today = new Date().toISOString().split('T')[0]

    return allBookings.value.filter(booking =>
      booking.booking_type === 'turn'
      && booking.checkout_date.startsWith(today)
      && booking.status !== 'completed',
    )
  })

  /**
   * Get unassigned bookings across all properties
   */
  const unassignedBookings = computed(() => {
    return allBookings.value.filter(booking =>
      !booking.assigned_cleaner_id
      && booking.status !== 'completed'
      && booking.status !== 'cancelled',
    )
  })

  // Stable date strings for today/tomorrow — avoids new Date() in computeds
  const todayStr = computed(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const tomorrowStr = computed(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const todayBookingsByTime = computed(() => {
    return allBookings.value
      .filter((b: Booking) => b.checkout_date === todayStr.value || b.checkin_date === todayStr.value)
      .toSorted((a: Booking, b: Booking) => {
        const timeA = a.checkout_time || a.checkin_time || '00:00'
        const timeB = b.checkout_time || b.checkin_time || '00:00'
        return timeA.localeCompare(timeB)
      })
  })

  const tomorrowBookings = computed(() => {
    return allBookings.value
      .filter((b: Booking) => b.checkout_date === tomorrowStr.value || b.checkin_date === tomorrowStr.value)
      .toSorted((a: Booking, b: Booking) => {
        const timeA = a.checkout_time || a.checkin_time || '00:00'
        const timeB = b.checkout_time || b.checkin_time || '00:00'
        return timeA.localeCompare(timeB)
      })
  })

  const unassignedToday = computed(() => {
    return todayBookingsByTime.value.filter(
      (b: Booking) => !b.assigned_cleaner_id && !b.assigned_team_id && (!b.assigned_group_ids || b.assigned_group_ids.length === 0),
    )
  })

  const unassignedTomorrow = computed(() => {
    return tomorrowBookings.value.filter(
      (b: Booking) => !b.assigned_cleaner_id && !b.assigned_team_id && (!b.assigned_group_ids || b.assigned_group_ids.length === 0),
    )
  })

  const urgentTurnsToday = computed(() => {
    const now = new Date()
    return todayBookingsByTime.value.filter((b: Booking) => {
      if (b.booking_type !== 'turn') {
        return false
      }
      if (b.status === 'completed' || b.status === 'cancelled') {
        return false
      }
      const checkoutTime = b.checkout_time || '11:00'
      const [hours, minutes] = checkoutTime.split(':').map(Number)
      const checkoutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      const hoursUntil = (checkoutDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntil <= 6 && hoursUntil > -2
    })
  })

  /**
   * Get bookings grouped by status (system-wide)
   */
  const systemBookingsByStatus = computed(() => {
    return measureRolePerformance('admin', 'filter-system-bookings-by-status', () => {
      const statusGroups: Record<BookingStatus, Booking[]> = {
        pending: [],
        scheduled: [],
        in_progress: [],
        completed: [],
        cancelled: [],
      }

      for (const booking of allBookings.value) {
        statusGroups[booking.status].push(booking)
      }

      return statusGroups
    })
  })

  /**
   * Get bookings grouped by owner (admin view of all clients)
   */
  const bookingsByOwner = computed(() => {
    const ownerGroups: Record<string, Booking[]> = {}

    for (const booking of allBookings.value) {
      if (!ownerGroups[booking.owner_id]) {
        ownerGroups[booking.owner_id] = []
      }
      ownerGroups[booking.owner_id].push(booking)
    }

    return ownerGroups
  })

  /**
   * Get bookings grouped by cleaner (admin workload view)
   */
  const bookingsByCleaner = computed(() => {
    const cleanerGroups: Record<string, Booking[]> = {
      unassigned: [],
    }

    for (const booking of allBookings.value) {
      if (booking.assigned_cleaner_id) {
        if (!cleanerGroups[booking.assigned_cleaner_id]) {
          cleanerGroups[booking.assigned_cleaner_id] = []
        }
        cleanerGroups[booking.assigned_cleaner_id].push(booking)
      } else {
        cleanerGroups.unassigned.push(booking)
      }
    }

    return cleanerGroups
  })

  /**
   * Get system-wide metrics and analytics
   */
  const systemMetrics = computed(() => {
    const total = allBookings.value.length
    const turns = systemTurns.value.length
    const urgentTurns = systemTodayTurns.value.length
    const unassigned = unassignedBookings.value.length
    const completed = systemBookingsByStatus.value.completed.length
    const pending = systemBookingsByStatus.value.pending.length

    return {
      total,
      turns,
      urgentTurns,
      unassigned,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      turnPercentage: total > 0 ? Math.round((turns / total) * 100) : 0,
    }
  })

  // Additional computed properties expected by tests
  const systemTurnAlerts = computed(() => systemTurns.value)
  const allTurnBookings = computed(() => systemTurns.value)
  const todayUrgentTurns = computed(() => systemTodayTurns.value)

  const businessMetrics = computed(() => ({
    totalBookings: allBookings.value.length,
    turnBookings: systemTurns.value.length,
    standardBookings: allBookings.value.filter(b => b.booking_type === 'standard').length,
    uniqueOwners: new Set(allBookings.value.map(b => b.owner_id)).size,
  }))

  // Functions expected by tests
  function getBookingsByStatus (status: BookingStatus) {
    return allBookings.value.filter(booking => booking.status === status)
  }

  // Admin function to create booking for any owner
  async function createBookingForOwner (bookingData: Partial<Booking> & { id?: never }): Promise<Booking> {
    try {
      loading.value = true
      error.value = null

      if (!bookingData.property_id || !bookingData.owner_id) {
        throw new Error('property_id and owner_id are required to create a booking')
      }
      if (!bookingData.checkout_date || !bookingData.checkin_date) {
        throw new Error('checkout_date and checkin_date are required to create a booking')
      }

      const formData: BookingFormData = {
        property_id: bookingData.property_id as string,
        owner_id: bookingData.owner_id as string,
        checkout_date: bookingData.checkout_date as string,
        checkin_date: bookingData.checkin_date as string,
        checkin_time: (bookingData.checkin_time as string) || '15:00:00',
        checkout_time: (bookingData.checkout_time as string) || '11:00:00',
        status: (bookingData.status as BookingStatus) || 'pending',
        booking_type: (bookingData.booking_type as BookingType) || 'standard',
        priority: (bookingData.priority as Booking['priority']) || 'normal',
        assigned_cleaner_id: (bookingData.assigned_cleaner_id as string | null) ?? null,
        notes: (bookingData.notes as string) || '',
      }

      const created = await supaCreate(formData)
      success.value = 'Booking created successfully'
      return created
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to create booking'
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Performance-monitored admin actions
  const createBooking = async (bookingData: BookingFormData): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      await supaCreate(bookingData)
      trackCachePerformance('admin-create-booking', true)

      success.value = 'Booking created successfully'
    } catch (error_: unknown) {
      error.value = `Failed to create booking: ${error_ instanceof Error ? error_.message : String(error_)}`
      trackCachePerformance('admin-create-booking', false)
      throw error_
    } finally {
      loading.value = false
    }
  }

  const updateBooking = async (id: string, updates: Partial<Booking>): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      await supaUpdate(id, updates)
      trackCachePerformance('admin-update-booking', true)

      success.value = 'Booking updated successfully'
    } catch (error_: unknown) {
      error.value = `Failed to update booking: ${error_ instanceof Error ? error_.message : String(error_)}`
      trackCachePerformance('admin-update-booking', false)
      throw error_
    } finally {
      loading.value = false
    }
  }

  const deleteBooking = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      await supaDelete(id)

      success.value = 'Booking deleted successfully'
    } catch (error_: unknown) {
      error.value = `Failed to delete booking: ${error_ instanceof Error ? error_.message : String(error_)}`
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Permission functions expected by tests
  function canManageAnyBooking (): boolean {
    return !!currentAdminId.value
  }

  function canEditAnyBooking (): boolean {
    return !!currentAdminId.value
  }

  function canDeleteAnyBooking (): boolean {
    return !!currentAdminId.value
  }

  function canAssignCleaners (): boolean {
    return !!currentAdminId.value
  }

  function canViewSystemMetrics (): boolean {
    return !!currentAdminId.value
  }

  // ADMIN-SPECIFIC CRUD OPERATIONS

  /**
   * Fetch ALL bookings (no owner filter) - admin system-wide access
   * Data is now loaded by layout via useRealtimeSync().init(); kept as thin wrapper for backward compat.
   */
  async function fetchAllBookings (): Promise<boolean> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required to access system data'
      return false
    }

    // Data is loaded by useRealtimeSync — nothing to do here
    success.value = `Loaded ${allBookings.value.length} bookings across all properties`
    return true
  }

  /**
   * Assign cleaner to a booking (admin-only operation)
   */
  async function assignCleaner (bookingId: string, cleanerId: string): Promise<boolean> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required for cleaner assignment'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      await supaAssignCleaner(bookingId, cleanerId)
      success.value = `Cleaner assigned successfully to booking ${bookingId}`
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Unable to assign cleaner. System error occurred.'
      loading.value = false
      return false
    }
  }

  /**
   * Update booking status (admin workflow management)
   */
  async function updateBookingStatus (bookingId: string, status: BookingStatus): Promise<boolean> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required for status management'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      await supaChangeStatus(bookingId, status)
      success.value = `Booking status updated to ${status} successfully`
      loading.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Unable to update booking status. System error occurred.'
      loading.value = false
      return false
    }
  }

  /**
   * Bulk assign cleaner to multiple bookings (admin efficiency operation).
   *
   * Delegates to the supabase-layer bulkAssignCleaner, which executes one
   * `.update().in('id', [...])` round-trip instead of N parallel updates.
   * Bookings with conflicting team/group assignments (or missing from the
   * local store) are pre-filtered and surfaced via the returned `failed`
   * list. On SQL failure, only IDs that were *actually attempted* against
   * the server are reported as failed — pre-filtered IDs aren't conflated
   * with server rejects (see PR review C1).
   */
  async function bulkAssignCleaner (bookingIds: string[], cleanerId: string): Promise<{ success: string[], failed: string[] }> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required for bulk operations'
      return { success: [], failed: bookingIds }
    }

    // Empty input is a no-op, not a failure — bail before touching loading
    // / error / success refs. Without this guard, the function falls through
    // to the defensive `else` at the end of the try block and shows a
    // misleading "Bulk assignment failed: no operation performed" toast.
    // (PR #28 Copilot review.)
    if (bookingIds.length === 0) {
      return { success: [], failed: [] }
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const { updated, skipped } = await supaBulkAssignCleaner(bookingIds, cleanerId)
      const successIds = updated.map(b => b.id)
      const skippedIds = skipped.map(s => s.id)

      // Aggregate skip reasons so the user-visible message is actionable
      // instead of a vague "N skipped" — e.g. "3 had conflicting team/group
      // assignment, 2 not found in local store" tells the admin whether to
      // refresh the page or unassign a team first.
      let skipSummary = ''
      if (skipped.length > 0) {
        const counts = new Map<string, number>()
        for (const { reason } of skipped) {
          counts.set(reason, (counts.get(reason) ?? 0) + 1)
        }
        skipSummary = [...counts].map(([r, n]) => `${n} ${r}`).join(', ')
      }

      if (successIds.length > 0) {
        success.value = skippedIds.length > 0
          ? `Bulk assignment completed: ${successIds.length} successful, ${skippedIds.length} skipped (${skipSummary})`
          : `Bulk assignment completed: ${successIds.length} successful`
      } else if (skippedIds.length > 0) {
        // All-skipped: this is a no-op (user selected ineligible rows),
        // not a failure. Showing it as an error misleads the admin into
        // thinking something went wrong when nothing was attempted.
        success.value = `No bookings eligible: ${skipSummary}`
      } else {
        // Defensive — nothing succeeded, nothing skipped, no error thrown.
        // Shouldn't happen given the supabase layer's contract, but if it
        // does we want a clear signal rather than a misleading toast.
        error.value = 'Bulk assignment failed: no operation performed'
      }

      // Log per-id skip reasons for debugging
      for (const { id, reason } of skipped) {
        console.warn(`[useAdminBookings] bulkAssignCleaner skipped ${id}: ${reason}`)
      }

      return { success: successIds, failed: skippedIds }
    } catch (error_) {
      void errorHandler.handleError(error_ as Error, {
        component: 'useAdminBookings',
        operation: 'bulkAssignCleaner',
      }, {
        showToUser: false, // We surface our own snackbar via error.value
        reportToService: true,
      })

      if (error_ instanceof BulkAssignSqlError) {
        // SQL update failed after rollback. Only IDs that actually reached SQL
        // (eligibleIds) should be reported as failed — skipped IDs were never
        // attempted and shouldn't be conflated with server rejects.
        error.value = `Bulk assignment failed: ${error_.message}`
        return { success: [], failed: [...error_.eligibleIds] }
      }

      // Unexpected non-BulkAssign error path (defensive — should not happen
      // because the supabase layer wraps SQL failures in BulkAssignSqlError).
      error.value = `Bulk assignment failed: ${error_ instanceof Error ? error_.message : 'System error occurred'}`
      return { success: [], failed: bookingIds }
    } finally {
      loading.value = false
    }
  }

  /**
   * Bulk update status for multiple bookings (admin workflow management).
   *
   * Delegates to the supabase-layer bulkChangeStatus, which executes one
   * `.update().in('id', [...])` round-trip instead of N parallel updates.
   * Bookings with invalid status transitions (or missing from the local
   * store) are pre-filtered and surfaced via the returned `failed` list.
   */
  async function bulkUpdateStatus (
    bookingIds: string[],
    status: BookingStatus,
  ): Promise<{ success: string[], failed: string[] }> {
    if (!currentAdminId.value) {
      error.value = 'Admin authentication required for bulk operations'
      return { success: [], failed: bookingIds }
    }

    if (bookingIds.length === 0) {
      return { success: [], failed: [] }
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const { updated, skipped } = await supaBulkChangeStatus(bookingIds, status)
      const successIds = updated.map(b => b.id)
      const skippedIds = skipped.map(s => s.id)

      if (skipped.length > 0) {
        const counts = new Map<string, number>()
        for (const { reason } of skipped) {
          counts.set(reason, (counts.get(reason) ?? 0) + 1)
        }
        const skipSummary = [...counts].map(([r, n]) => `${n} ${r}`).join(', ')

        success.value = successIds.length > 0
          ? `Bulk status update completed: ${successIds.length} successful, ${skippedIds.length} skipped (${skipSummary})`
          : `No bookings eligible: ${skipSummary}`
      } else {
        success.value = `Bulk status update completed: ${successIds.length} successful`
      }

      return { success: successIds, failed: skippedIds }
    } catch (error_) {
      void errorHandler.handleError(error_ as Error, {
        component: 'useAdminBookings',
        operation: 'bulkUpdateStatus',
      }, { showToUser: false, reportToService: true })
      error.value = `Bulk status update failed: ${error_ instanceof Error ? error_.message : 'System error'}`
      return { success: [], failed: bookingIds }
    } finally {
      loading.value = false
    }
  }

  // ADMIN ANALYTICS AND REPORTING

  /**
   * Get system-wide turn alerts (admin business impact view)
   */
  function getSystemTurnAlerts () {
    const urgentTurns = systemTodayTurns.value
    const unassignedTurns = urgentTurns.filter(turn => !turn.assigned_cleaner_id)

    return {
      total: urgentTurns.length,
      unassigned: unassignedTurns.length,
      assigned: urgentTurns.length - unassignedTurns.length,
      alerts: urgentTurns.map(turn => ({
        id: turn.id,
        property_id: turn.property_id,
        checkout_date: turn.checkout_date,
        checkin_date: turn.checkin_date,
        status: turn.status,
        assigned_cleaner_id: turn.assigned_cleaner_id,
        priority: calculateBookingPriority(turn),
        businessImpact: turn.assigned_cleaner_id ? 'Assigned - On Track' : 'URGENT - Needs Assignment',
      })),
    }
  }

  /**
   * Get cleaner workload analysis (admin resource management)
   */
  function getCleanerWorkloadAnalysis () {
    const cleanerWorkloads: Record<string, {
      assigned: number
      completed: number
      pending: number
      workloadScore: number
    }> = {}

    for (const [cleanerId, bookings] of Object.entries(bookingsByCleaner.value)) {
      if (cleanerId === 'unassigned') {
        continue
      }

      const assigned = bookings.length
      const completed = bookings.filter(b => b.status === 'completed').length
      const pending = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length
      const workloadScore = pending * 2 + assigned // Weighted score for workload

      cleanerWorkloads[cleanerId] = {
        assigned,
        completed,
        pending,
        workloadScore,
      }
    }

    return {
      cleanerWorkloads,
      unassignedCount: bookingsByCleaner.value.unassigned?.length || 0,
      totalCleaners: Object.keys(cleanerWorkloads).length,
      averageWorkload: Object.values(cleanerWorkloads).reduce((sum, w) => sum + w.workloadScore, 0) / Object.keys(cleanerWorkloads).length || 0,
    }
  }

  /**
   * Get property utilization report (admin business insights)
   */
  function getPropertyUtilizationReport () {
    const propertyStats: Record<string, {
      totalBookings: number
      turnBookings: number
      completedBookings: number
      utilizationRate: number
      turnRate: number
    }> = {}

    for (const property of allProperties.value) {
      const propertyBookingsMap = bookingStore.bookingsByProperty(property.id)
      const propertyBookings = Array.from(propertyBookingsMap.values())
      const turnBookings = propertyBookings.filter(b => b.booking_type === 'turn')
      const completedBookings = propertyBookings.filter(b => b.status === 'completed')

      propertyStats[property.id] = {
        totalBookings: propertyBookings.length,
        turnBookings: turnBookings.length,
        completedBookings: completedBookings.length,
        utilizationRate: propertyBookings.length > 0 ? Math.round((completedBookings.length / propertyBookings.length) * 100) : 0,
        turnRate: propertyBookings.length > 0 ? Math.round((turnBookings.length / propertyBookings.length) * 100) : 0,
      }
    }

    return {
      propertyStats,
      totalProperties: allProperties.value.length,
      averageUtilization: Object.values(propertyStats).reduce((sum, p) => sum + p.utilizationRate, 0) / allProperties.value.length || 0,
      averageTurnRate: Object.values(propertyStats).reduce((sum, p) => sum + p.turnRate, 0) / allProperties.value.length || 0,
    }
  }

  // ADVANCED FILTERING AND SEARCH

  /**
   * Advanced filtering for admin interface (multiple criteria)
   */
  function filterBookings (criteria: {
    status?: BookingStatus[]
    bookingType?: BookingType[]
    ownerId?: string
    cleanerId?: string
    dateRange?: { start: string, end: string }
    propertyId?: string
    unassignedOnly?: boolean
  }) {
    return allBookings.value.filter(booking => {
      // Status filter
      if (criteria.status && criteria.status.length > 0 && !criteria.status.includes(booking.status)) {
        return false
      }

      // Booking type filter
      if (criteria.bookingType && criteria.bookingType.length > 0 && !criteria.bookingType.includes(booking.booking_type)) {
        return false
      }

      // Owner filter
      if (criteria.ownerId && booking.owner_id !== criteria.ownerId) {
        return false
      }

      // Cleaner filter
      if (criteria.cleanerId && booking.assigned_cleaner_id !== criteria.cleanerId) {
        return false
      }

      // Unassigned filter
      if (criteria.unassignedOnly && booking.assigned_cleaner_id) {
        return false
      }

      // Date range filter
      if (criteria.dateRange) {
        const bookingDate = new Date(booking.checkout_date)
        const startDate = new Date(criteria.dateRange.start)
        const endDate = new Date(criteria.dateRange.end)
        if (bookingDate < startDate || bookingDate > endDate) {
          return false
        }
      }

      // Property filter
      if (criteria.propertyId && booking.property_id !== criteria.propertyId) {
        return false
      }

      return true
    })
  }

  // Return admin-specific interface
  return {
    // State
    loading,
    error,
    success,

    // Computed properties (system-wide, no filtering)
    allBookings,
    allProperties,
    systemTurns,
    systemTodayTurns,
    unassignedBookings,
    todayBookingsByTime,
    tomorrowBookings,
    unassignedToday,
    unassignedTomorrow,
    urgentTurnsToday,
    systemBookingsByStatus,
    bookingsByOwner,
    bookingsByCleaner,
    systemMetrics,

    // Admin CRUD operations
    fetchAllBookings,
    assignCleaner,
    assignCleanerToBooking: async (bookingId: string, cleanerId: string): Promise<boolean> => {
      loading.value = true
      error.value = null
      try {
        await supaUpdate(bookingId, buildAssignmentUpdate('cleaner', cleanerId) as Partial<Booking>)
        success.value = 'Cleaner assigned successfully'
        return true
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : 'Failed to assign cleaner'
        void errorHandler.handleError(error_ as Error, {
          component: 'useAdminBookings',
          operation: 'assignCleanerToBooking',
        }, { showToUser: false, reportToService: true })
        return false
      } finally {
        loading.value = false
      }
    },
    assignTeamToBooking: async (bookingId: string, teamId: string): Promise<boolean> => {
      loading.value = true
      error.value = null
      try {
        await supaUpdate(bookingId, buildAssignmentUpdate('team', teamId) as Partial<Booking>)
        success.value = 'Team assigned successfully'
        return true
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : 'Failed to assign team'
        void errorHandler.handleError(error_ as Error, {
          component: 'useAdminBookings',
          operation: 'assignTeamToBooking',
        }, { showToUser: false, reportToService: true })
        return false
      } finally {
        loading.value = false
      }
    },
    assignGroupToBooking: async (bookingId: string, cleanerIds: string[]): Promise<boolean> => {
      loading.value = true
      error.value = null
      try {
        await supaUpdate(bookingId, buildAssignmentUpdate('group', cleanerIds) as Partial<Booking>)
        success.value = 'Group assigned successfully'
        return true
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : 'Failed to assign group'
        void errorHandler.handleError(error_ as Error, {
          component: 'useAdminBookings',
          operation: 'assignGroupToBooking',
        }, { showToUser: false, reportToService: true })
        return false
      } finally {
        loading.value = false
      }
    },
    updateBookingStatus,
    bulkAssignCleaner,
    bulkUpdateStatus,
    createBookingForOwner,

    // Analytics and reporting
    getSystemTurnAlerts,
    getCleanerWorkloadAnalysis,
    getPropertyUtilizationReport,

    // Advanced filtering
    filterBookings,

    // Expose CRUD functions for admin use
    createBooking,
    updateBooking,
    deleteBooking,
    calculateBookingPriority,

    // Additional computed properties expected by tests
    systemTurnAlerts,
    allTurnBookings,
    todayUrgentTurns,
    businessMetrics,
    getBookingsByStatus,
    getAdminPerformanceMetrics: () => ({}), // Placeholder for performance metrics

    // Store actions (direct access)
    fetchAllProperties: () => Promise.resolve(),

    // Permission functions
    canManageAnyBooking,
    canEditAnyBooking,
    canDeleteAnyBooking,
    canAssignCleaners,
    canViewSystemMetrics,
  }
}
