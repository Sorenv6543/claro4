import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
import { useAuthStore } from '@/stores/auth'
import { useBookingStore } from '@/stores/booking'
import { usePropertyStore } from '@/stores/property'

export function useRealtimeSync() {
  const { fetchAndSubscribe: initBookings, unsubscribe: teardownBookings,
          connectionStatus: bookingStatus } = useSupabaseBookings()
  const authStore = useAuthStore()
  const bookingStore = useBookingStore()
  const propertyStore = usePropertyStore()

  const isOnline = ref(navigator.onLine)
  let profileChannel: RealtimeChannel | null = null

  const connectionStatus = computed(() => {
    // For now, just use booking status since properties composable isn't rewritten yet
    if (bookingStatus.value === 'connected') return 'connected'
    if (bookingStatus.value === 'connecting') return 'connecting'
    return 'disconnected'
  })

  function subscribeToProfileChanges() {
    if (profileChannel) return
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
        () => authStore.checkAuth(),
      )
      .subscribe()
  }

  async function init() {
    await initBookings()
    // Properties will be added in Phase 2 (Task 9) when useSupabaseProperties is rewritten
    // For now, fetch properties directly from store as a temporary bridge
    await propertyStore.fetchProperties()
    subscribeToProfileChanges()
  }

  function teardown() {
    teardownBookings()
    if (profileChannel) {
      supabase.removeChannel(profileChannel)
      profileChannel = null
    }
    bookingStore.clearAll()
    propertyStore.clearAll()
  }

  function onOnline() {
    isOnline.value = true
    init()
  }
  function onOffline() {
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
