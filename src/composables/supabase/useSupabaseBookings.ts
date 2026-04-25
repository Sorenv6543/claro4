import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Booking, BookingFormData } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { canTransitionBookingStatus } from '@/utils/businessLogic'

// Default fetch window — only load bookings with checkout_date within this many days ago
const FETCH_WINDOW_DAYS = 90

// --- Module-level singleton state ---
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

// Safety net timeout — primary cleanup is in CRUD finally blocks
const OPTIMISTIC_SAFETY_TIMEOUT = 30_000

/**
 * Thrown by `bulkAssignCleaner` when the SQL UPDATE fails after optimistic
 * store updates have been rolled back.
 *
 * Carries `eligibleIds` (the IDs that passed the pre-filter and were actually
 * attempted against SQL) and `skipped` (the IDs that were pre-filtered and
 * never reached SQL). This lets admin-layer callers distinguish
 * "attempted but server rejected" from "pre-filtered as ineligible" — without
 * this, callers would have to choose between misreporting one or the other
 * as failed. See architecture-review PR feedback C1.
 */
export class BulkAssignSqlError extends Error {
  constructor (
    message: string,
    public readonly eligibleIds: readonly string[],
    public readonly skipped: readonly { id: string, reason: string }[],
    public readonly cause: unknown,
  ) {
    super(message)
    this.name = 'BulkAssignSqlError'
  }
}

export function useSupabaseBookings () {
  const bookingStore = useBookingStore()

  async function fetchAndSubscribe () {
    bookingStore.loading = true
    bookingStore.error = null

    try {
      const windowDate = new Date()
      windowDate.setDate(windowDate.getDate() - FETCH_WINDOW_DAYS)
      const dateWindow = windowDate.toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .gte('checkout_date', dateWindow)
        .order('checkout_date', { ascending: true })

      if (fetchError) {
        throw fetchError
      }
      bookingStore.setBookings((data ?? []) as Booking[])
      subscribe() // Only subscribe after successful fetch
    } catch (error) {
      bookingStore.error = error instanceof Error ? error.message : 'Failed to fetch bookings'
      console.error('[useSupabaseBookings] fetch error:', error)
      throw error // Propagate so callers can handle
    } finally {
      bookingStore.loading = false
    }
  }

  function subscribe () {
    if (channel) {
      return
    }

    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      console.error('[useSupabaseBookings] subscribe() called without authenticated user — aborting')
      return
    }

    connectionStatus.value = 'connecting'
    const subscriptionFilter: { event: string, schema: string, table: string, filter?: string } = {
      event: '*', schema: 'public', table: 'bookings',
    }
    // Scope subscription by role — admin gets all
    if (authStore.isOwner && authStore.user?.id) {
      subscriptionFilter.filter = `owner_id=eq.${authStore.user.id}`
    } else if (authStore.isCleaner && authStore.user?.id) {
      subscriptionFilter.filter = `assigned_cleaner_id=eq.${authStore.user.id}`
    }

    channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        subscriptionFilter as any,
        payload => handleRealtimeEvent(payload),
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          connectionStatus.value = 'connected'
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          connectionStatus.value = 'disconnected'
        }
      })
  }

  function unsubscribe () {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    connectionStatus.value = 'disconnected'
    optimisticIds.clear()
  }

  function handleRealtimeEvent (payload: any) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload
      const id = (newRecord || oldRecord)?.id
      if (!id) {
        return
      }

      switch (eventType) {
        case 'INSERT':
        case 'UPDATE': {
          if (optimisticIds.has(id)) {
            return
          }
          bookingStore.setBooking(id, newRecord as Booking)
          break
        }
        case 'DELETE': {
          if (!oldRecord?.id) {
            return
          }
          optimisticIds.delete(id)
          bookingStore.removeBooking(oldRecord.id)
          break
        }
      }
    } catch (error) {
      console.error('[useSupabaseBookings] realtime event error:', error, payload)
    }
  }

  function trackOptimistic (id: string) {
    optimisticIds.add(id)
    // Safety net — primary cleanup is in CRUD finally blocks
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_SAFETY_TIMEOUT)
  }

  function clearOptimistic (id: string) {
    optimisticIds.delete(id)
  }

  async function createBooking (formData: BookingFormData): Promise<Booking> {
    const id = uuidv4()
    const now = new Date().toISOString()

    const booking: Booking = {
      id,
      property_id: formData.property_id,
      owner_id: formData.owner_id,
      checkin_date: formData.checkin_date,
      checkout_date: formData.checkout_date,
      checkin_time: formData.checkin_time,
      checkout_time: formData.checkout_time,
      booking_type: formData.booking_type,
      status: formData.status ?? 'pending',
      priority: formData.priority ?? 'normal',
      guest_count: formData.guest_count ?? null,
      notes: formData.notes ?? null,
      assigned_cleaner_id: formData.assigned_cleaner_id ?? null,
      turn_date: formData.turn_date ?? null,
      turn_start_time: formData.turn_start_time ?? null,
      turn_checkin_time: formData.turn_checkin_time ?? null,
      created_at: now,
      updated_at: now,
    }

    bookingStore.setBooking(id, booking)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').insert(booking)
      if (error) {
        throw error
      }
      return booking
    } catch (error) {
      bookingStore.removeBooking(id)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function updateBooking (id: string, updates: Partial<Booking>): Promise<Booking> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) {
      throw new Error('Booking not found')
    }

    const updated: Booking = { ...existing, ...updates, updated_at: new Date().toISOString() }

    bookingStore.setBooking(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').update(updates).eq('id', id)
      if (error) {
        throw error
      }
      return updated
    } catch (error) {
      bookingStore.setBooking(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function deleteBooking (id: string): Promise<void> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) {
      throw new Error('Booking not found')
    }

    bookingStore.removeBooking(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) {
        throw error
      }
    } catch (error) {
      bookingStore.setBooking(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function changeBookingStatus (id: string, status: Booking['status']): Promise<Booking> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) {
      throw new Error('Booking not found')
    }
    if (!canTransitionBookingStatus(existing, status)) {
      throw new Error(`Cannot transition from ${existing.status} to ${status}`)
    }
    return updateBooking(id, { status })
  }

  async function assignCleaner (bookingId: string, cleanerId: string): Promise<Booking> {
    return updateBooking(bookingId, { assigned_cleaner_id: cleanerId })
  }

  /**
   * Assign one cleaner to many bookings in a single SQL round-trip.
   *
   * Replaces N parallel update().eq('id', x) calls with one
   * update().in('id', [...]) call. At ~50 bookings, this is 1 HTTP
   * round-trip instead of 50.
   *
   * Caveat: PostgreSQL aborts an entire UPDATE if any row violates a
   * CHECK constraint, so we pre-filter in JS based on the local
   * booking store. Bookings already assigned to a team or group are
   * reported as "skipped" rather than batch-aborting the operation.
   * (The `one_assignment_type` constraint enforces at most one of
   * assigned_cleaner_id / assigned_team_id / assigned_group_ids.)
   *
   * Returns { updated, skipped } on success (including the all-skipped
   * no-op case where eligibleIds is empty). Skip reasons:
   * - `'not found in local store'` — caller passed an ID not in the booking store
   * - `'has conflicting team/group assignment'` — would violate the
   *   `one_assignment_type` CHECK constraint
   * Note: completed/cancelled bookings are NOT pre-filtered — callers
   * should filter those upstream if they don't want assignment to apply.
   *
   * On SQL failure: all optimistic store updates are rolled back, then
   * a `BulkAssignSqlError` is thrown carrying both `eligibleIds` (what
   * was attempted) and `skipped` (what was pre-filtered). This lets the
   * admin layer accurately report which IDs were rejected by the server
   * vs. which were never sent.
   */
  async function bulkAssignCleaner (
    bookingIds: string[],
    cleanerId: string,
  ): Promise<{ updated: Booking[], skipped: { id: string, reason: string }[] }> {
    const snapshots = new Map<string, Booking>()
    const eligibleIds: string[] = []
    const skipped: { id: string, reason: string }[] = []

    for (const id of bookingIds) {
      const existing = bookingStore.bookings.get(id)
      if (!existing) {
        skipped.push({ id, reason: 'not found in local store' })
        continue
      }
      const hasTeam = !!existing.assigned_team_id
      const hasGroup = !!existing.assigned_group_ids?.length
      if (hasTeam || hasGroup) {
        skipped.push({ id, reason: 'has conflicting team/group assignment' })
        continue
      }
      snapshots.set(id, existing)
      eligibleIds.push(id)
    }

    if (eligibleIds.length === 0) {
      return { updated: [], skipped }
    }

    // Apply optimistic updates locally before the SQL call
    const updateTime = new Date().toISOString()
    const updated: Booking[] = []
    for (const id of eligibleIds) {
      const existing = snapshots.get(id)!
      const next: Booking = { ...existing, assigned_cleaner_id: cleanerId, updated_at: updateTime }
      bookingStore.setBooking(id, next)
      trackOptimistic(id)
      updated.push(next)
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ assigned_cleaner_id: cleanerId })
        .in('id', eligibleIds)
      if (error) {
        throw error
      }
      return { updated, skipped }
    } catch (error) {
      // Roll back all optimistic updates
      for (const [id, existing] of snapshots) {
        bookingStore.setBooking(id, existing)
      }
      // Wrap in BulkAssignSqlError so callers can distinguish
      // "attempted but rejected" (eligibleIds) from "pre-filtered" (skipped).
      throw new BulkAssignSqlError(
        error instanceof Error ? error.message : String(error),
        eligibleIds,
        skipped,
        error,
      )
    } finally {
      for (const id of eligibleIds) {
        clearOptimistic(id)
      }
    }
  }

  return {
    fetchAndSubscribe,
    unsubscribe,
    createBooking,
    updateBooking,
    deleteBooking,
    changeBookingStatus,
    assignCleaner,
    bulkAssignCleaner,
    connectionStatus,
  }
}
