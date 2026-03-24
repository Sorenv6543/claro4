import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Booking, BookingFormData } from '@/types'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/plugins/supabase'
import { useBookingStore } from '@/stores/booking'
import { canTransitionBookingStatus } from '@/utils/businessLogic'

// --- Module-level singleton state ---
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

const OPTIMISTIC_CLEANUP_DELAY = 5_000

export function useSupabaseBookings() {
  const bookingStore = useBookingStore()

  async function fetchAndSubscribe() {
    bookingStore.loading = true
    bookingStore.error = null

    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .order('checkout_date', { ascending: true })

      if (fetchError) throw fetchError
      bookingStore.setBookings((data ?? []) as Booking[])
    } catch (err) {
      bookingStore.error = err instanceof Error ? err.message : 'Failed to fetch bookings'
      console.error('[useSupabaseBookings] fetch error:', err)
    } finally {
      bookingStore.loading = false
    }

    subscribe()
  }

  function subscribe() {
    if (channel) return
    connectionStatus.value = 'connecting'

    channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => handleRealtimeEvent(payload),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') connectionStatus.value = 'connected'
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') connectionStatus.value = 'disconnected'
      })
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    connectionStatus.value = 'disconnected'
    optimisticIds.clear()
  }

  function handleRealtimeEvent(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const id = (newRecord || oldRecord)?.id
    if (!id) return

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE': {
        if (optimisticIds.has(id)) return
        bookingStore.setBooking(id, newRecord as Booking)
        break
      }
      case 'DELETE': {
        optimisticIds.delete(id)
        bookingStore.removeBooking(oldRecord.id)
        break
      }
    }
  }

  function trackOptimistic(id: string) {
    optimisticIds.add(id)
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_CLEANUP_DELAY)
  }

  async function createBooking(formData: BookingFormData): Promise<Booking> {
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
      if (error) throw error
      return booking
    } catch (err) {
      bookingStore.removeBooking(id)
      optimisticIds.delete(id)
      throw err
    }
  }

  async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) throw new Error('Booking not found')

    const updated: Booking = { ...existing, ...updates, updated_at: new Date().toISOString() }

    bookingStore.setBooking(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').update(updates).eq('id', id)
      if (error) throw error
      return updated
    } catch (err) {
      bookingStore.setBooking(id, existing)
      optimisticIds.delete(id)
      throw err
    }
  }

  async function deleteBooking(id: string): Promise<void> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) throw new Error('Booking not found')

    bookingStore.removeBooking(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      bookingStore.setBooking(id, existing)
      optimisticIds.delete(id)
      throw err
    }
  }

  async function changeBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    const existing = bookingStore.bookings.get(id)
    if (!existing) throw new Error('Booking not found')
    if (!canTransitionBookingStatus(existing, status)) {
      throw new Error(`Cannot transition from ${existing.status} to ${status}`)
    }
    return updateBooking(id, { status })
  }

  async function assignCleaner(bookingId: string, cleanerId: string): Promise<Booking> {
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
