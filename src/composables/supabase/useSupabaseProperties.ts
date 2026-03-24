import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Property, PropertyFormData } from '@/types'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/plugins/supabase'
import { usePropertyStore } from '@/stores/property'

// Module-level singleton state
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

const OPTIMISTIC_CLEANUP_DELAY = 5_000

export function useSupabaseProperties() {
  const propertyStore = usePropertyStore()

  async function fetchAndSubscribe() {
    propertyStore.loading = true
    propertyStore.error = null

    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')

      if (fetchError) throw fetchError
      propertyStore.setProperties((data ?? []) as Property[])
    } catch (err) {
      propertyStore.error = err instanceof Error ? err.message : 'Failed to fetch properties'
      console.error('[useSupabaseProperties] fetch error:', err)
    } finally {
      propertyStore.loading = false
    }

    subscribe()
  }

  function subscribe() {
    if (channel) return
    connectionStatus.value = 'connecting'

    channel = supabase
      .channel('properties-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
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
      case 'INSERT': {
        if (optimisticIds.has(id)) return
        if (newRecord.active) propertyStore.setProperty(id, newRecord as Property)
        break
      }
      case 'UPDATE': {
        if (optimisticIds.has(id)) return
        if (newRecord.active === false) {
          // Soft-deleted — remove from store
          propertyStore.removeProperty(id)
        } else {
          propertyStore.setProperty(id, newRecord as Property)
        }
        break
      }
      case 'DELETE': {
        optimisticIds.delete(id)
        propertyStore.removeProperty(oldRecord.id)
        break
      }
    }
  }

  function trackOptimistic(id: string) {
    optimisticIds.add(id)
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_CLEANUP_DELAY)
  }

  async function createProperty(formData: PropertyFormData): Promise<Property> {
    const id = uuidv4()
    const now = new Date().toISOString()

    const property: Property = {
      id,
      ...formData,
      active: true,
      created_at: now,
      updated_at: now,
    } as Property

    propertyStore.setProperty(id, property)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('properties').insert(property)
      if (error) throw error
      return property
    } catch (err) {
      propertyStore.removeProperty(id)
      optimisticIds.delete(id)
      throw err
    }
  }

  async function updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    const existing = propertyStore.properties.get(id)
    if (!existing) throw new Error('Property not found')

    const updated: Property = { ...existing, ...updates, updated_at: new Date().toISOString() }

    propertyStore.setProperty(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('properties').update(updates).eq('id', id)
      if (error) throw error
      return updated
    } catch (err) {
      propertyStore.setProperty(id, existing)
      optimisticIds.delete(id)
      throw err
    }
  }

  // Soft delete — sets active=false, removes from store
  async function deleteProperty(id: string): Promise<void> {
    const existing = propertyStore.properties.get(id)
    if (!existing) throw new Error('Property not found')

    propertyStore.removeProperty(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase
        .from('properties')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      propertyStore.setProperty(id, existing)
      optimisticIds.delete(id)
      throw err
    }
  }

  return {
    fetchAndSubscribe,
    unsubscribe,
    createProperty,
    updateProperty,
    deleteProperty,
    connectionStatus,
  }
}
