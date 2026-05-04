<!----
  OwnerLayout.vue

  Main layout for owner-facing pages, including the dashboard/schedule and profile.
  Contains the app bar with the ClaroWordmark, a tiles toggle button that opens/closes
  the sidebar, prev/next calendar controls (desktop only on the schedule page), and a
  sidebar for page navigation. The Range/Event view toggle lives inside HomeOwner.vue;
  on mobile the prev/next/month label moves into a floating CalendarNavPill rendered
  by HomeOwner.vue.
-->

<!-- src/layouts/owner.vue -->
<template>
  <v-app class="owner-layout">
    <OwnerNavigationDrawer v-if="!mobile" v-model="sidebarOpen" />

    <MobileBottomNav
      v-if="mobile"
      :items="ownerNavItems"
      user-role="owner"
    />

    <v-main>
      <v-banner
        v-if="initError"
        class="mb-0"
        color="error"
        icon="mdi-alert-circle-outline"
        lines="one"
      >
        <v-banner-text>
          Failed to load data. Please refresh the page.
        </v-banner-text>
      </v-banner>

      <v-skeleton-loader
        v-else-if="!isReady"
        class="ma-4"
        type="article"
      />

      <router-view v-else />
    </v-main>

    <!-- Global booking modal: active on all non-calendar pages.
         Calendar page (HomeOwner.vue) manages its own modal with richer handlers. -->
    <GlobalBookingModal v-if="isReady && !isCalendarPage" />

    <!-- Floating Add Booking circle -->
    <Teleport to="body">
      <button
        v-if="isReady && !isCalendarPage"
        aria-label="Add booking"
        class="fab-add-booking"
        type="button"
        @click="openBookingModal"
      >
        <v-icon color="white" size="26">mdi-plus</v-icon>
      </button>
    </Teleport>

  </v-app>
</template>

<script setup lang="ts">
  import { computed, onMounted, provide, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import MobileBottomNav from '@/components/dumb/shared/MobileBottomNav.vue'
  import type { NavItem } from '@/components/dumb/shared/MobileBottomNav.vue'
  import GlobalBookingModal from '@/components/smart/owner/GlobalBookingModal.vue'
  import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
  import { useUIStore } from '@/stores/ui'

  const ownerNavItems: NavItem[] = [
    { id: 'overview', value: 'overview', label: 'Overview', icon: 'mdi-view-dashboard', route: '/owner/overview' },
    { id: 'calendar', value: 'calendar', label: 'Calendar', icon: 'mdi-calendar', route: '/owner/calendar' },
    { id: 'bookings', value: 'bookings', label: 'Bookings', icon: 'mdi-format-list-bulleted', route: '/owner/bookings' },
    { id: 'properties', value: 'properties', label: 'Properties', icon: 'mdi-home', route: '/owner/properties' },
  ]

  const { mdAndUp, mobile } = useDisplay()
  const route = useRoute()
  const { init: initRealtimeSync } = useRealtimeSync()

  const isCalendarPage = computed(() => route.path === '/owner/calendar')

  const sidebarOpen = ref(mdAndUp.value)
  const uiStore = useUIStore()

  const isReady = ref(false)
  const initError = ref<Error | null>(null)
  provide('appStatus', { isReady, initError })

  function openBookingModal () {
    uiStore.openModal('eventModal', 'create')
  }

  onMounted(() => {
    initRealtimeSync()
      .then(() => {
        isReady.value = true
      })
      .catch((error: unknown) => {
        initError.value = error instanceof Error ? error : new Error(String(error))
        console.error('[OwnerLayout] Failed to initialize realtime sync:', error)
      })
  })
</script>

<style scoped>
:deep(.v-main) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: rgb(var(--v-theme-background));
}

/* Floating Add Booking circle */
.fab-add-booking {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 200;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 14px rgba(115, 103, 240, 0.45),
    0 1px 0 rgba(255, 255, 255, 0.18) inset;
  touch-action: manipulation;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fab-add-booking:hover {
  transform: translateY(-2px) scale(1.06);
  box-shadow:
    0 8px 20px rgba(115, 103, 240, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.fab-add-booking:active {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 2px 8px rgba(115, 103, 240, 0.35);
}

.fab-add-booking:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: 3px;
}

@media (max-width: 599px) {
  .fab-add-booking {
    bottom: 72px;
    width: 52px;
    height: 52px;
  }
}
</style>
