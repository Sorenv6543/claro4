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
    connectionStatus.value = 'connecting'

    const authStore = useAuthStore()
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

  return {
    fetchAndSubscribe,
    unsubscribe,
    createBooking,
    updateBooking,
    deleteBooking,
    changeBookingStatus,
    assignCleaner,
    connectionStatus,
  }
}
