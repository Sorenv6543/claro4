import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Property, PropertyFormData } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { usePropertyStore } from '@/stores/property'

// Cap on properties returned per fetch.
// Bookings use a 90-day date window; properties have no natural date axis,
// so we bound by row count instead. 2000 gives ~10× headroom over the
// CLAUDE.md target scale (30–40 owners × ~5 properties = ~200 rows today).
// Past that, we need a paginated fetcher, not a bigger ceiling.
const PROPERTIES_FETCH_LIMIT = 2000

// Module-level singleton state
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

const OPTIMISTIC_SAFETY_TIMEOUT = 30_000

export function useSupabaseProperties () {
  const propertyStore = usePropertyStore()

  async function fetchAndSubscribe () {
    propertyStore.loading = true
    propertyStore.error = null

    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(PROPERTIES_FETCH_LIMIT)

      if (fetchError) {
        throw fetchError
      }
      propertyStore.setProperties((data ?? []) as Property[])
      subscribe() // Only subscribe after successful fetch
    } catch (error) {
      propertyStore.error = error instanceof Error ? error.message : 'Failed to fetch properties'
      console.error('[useSupabaseProperties] fetch error:', error)
      throw error // Propagate so callers can handle
    } finally {
      propertyStore.loading = false
    }
  }

  function subscribe () {
    if (channel) {
      return
    }
    connectionStatus.value = 'connecting'

    channel = supabase
      .channel('properties-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
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
        case 'INSERT': {
          if (optimisticIds.has(id)) {
            return
          }
          if (newRecord.active) {
            propertyStore.setProperty(id, newRecord as Property)
          }
          break
        }
        case 'UPDATE': {
          if (optimisticIds.has(id)) {
            return
          }
          if (newRecord.active === false) {
            propertyStore.removeProperty(id)
          } else {
            propertyStore.setProperty(id, newRecord as Property)
          }
          break
        }
        case 'DELETE': {
          if (!oldRecord?.id) {
            return
          }
          optimisticIds.delete(id)
          propertyStore.removeProperty(oldRecord.id)
          break
        }
      }
    } catch (error) {
      console.error('[useSupabaseProperties] realtime event error:', error, payload)
    }
  }

  function trackOptimistic (id: string) {
    optimisticIds.add(id)
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_SAFETY_TIMEOUT)
  }

  function clearOptimistic (id: string) {
    optimisticIds.delete(id)
  }

  async function createProperty (formData: PropertyFormData): Promise<Property> {
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
      if (error) {
        throw error
      }
      return property
    } catch (error) {
      propertyStore.removeProperty(id)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function updateProperty (id: string, updates: Partial<Property>): Promise<Property> {
    const existing = propertyStore.properties.get(id)
    if (!existing) {
      throw new Error('Property not found')
    }

    const updated: Property = { ...existing, ...updates, updated_at: new Date().toISOString() }

    propertyStore.setProperty(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('properties').update(updates).eq('id', id)
      if (error) {
        throw error
      }
      return updated
    } catch (error) {
      propertyStore.setProperty(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  // Soft delete — sets active=false, removes from store
  async function deleteProperty (id: string): Promise<void> {
    const existing = propertyStore.properties.get(id)
    if (!existing) {
      throw new Error('Property not found')
    }

    propertyStore.removeProperty(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase
        .from('properties')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        throw error
      }
    } catch (error) {
      propertyStore.setProperty(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
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
