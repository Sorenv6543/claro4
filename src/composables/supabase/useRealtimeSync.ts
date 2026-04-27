import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
import { useSupabaseProperties } from '@/composables/supabase/useSupabaseProperties'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/stores/auth'

export function useRealtimeSync () {
  const { fetchAndSubscribe: initBookings, unsubscribe: teardownBookings,
    connectionStatus: bookingStatus } = useSupabaseBookings()
  const { fetchAndSubscribe: initProperties, unsubscribe: teardownProperties,
    connectionStatus: propertyStatus } = useSupabaseProperties()
  const authStore = useAuthStore()

  const isOnline = ref(navigator.onLine)
  let profileChannel: RealtimeChannel | null = null

  const connectionStatus = computed(() => {
    if (bookingStatus.value === 'connected' && propertyStatus.value === 'connected') {
      return 'connected'
    }
    if (bookingStatus.value === 'connecting' || propertyStatus.value === 'connecting') {
      return 'connecting'
    }
    return 'disconnected'
  })

  function subscribeToProfileChanges () {
    if (profileChannel) {
      return
    }
    profileChannel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${authStore.user?.id}`,
        },
        () => {
          authStore.refreshProfile().catch((error: unknown) =>
            console.error('[useRealtimeSync] profile refresh failed:', error),
          )
        },
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[useRealtimeSync] profile channel subscription failed:', status)
        }
      })
  }

  async function init () {
    const results = await Promise.allSettled([initBookings(), initProperties()])
    const failures = results.filter(r => r.status === 'rejected')
    for (const result of failures) {
      console.error('[useRealtimeSync] init partial failure:', (result as PromiseRejectedResult).reason)
    }
    if (failures.length === results.length) {
      throw new Error('All data sources failed to initialize')
    }
    if (failures.length < results.length) {
      subscribeToProfileChanges()
    }
  }

  function teardown () {
    teardownBookings()
    teardownProperties()
    if (profileChannel) {
      supabase.removeChannel(profileChannel)
      profileChannel = null
    }
    // Store data remains valid after unsubscribe — cleared by auth on sign-out
  }

  function onOnline () {
    isOnline.value = true
    init().catch(error => console.error('[useRealtimeSync] reconnection failed:', error))
  }
  function onOffline () {
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    teardown()
  })

  return { init, teardown, connectionStatus, isOnline }
}
