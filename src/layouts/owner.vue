<!----
  OwnerLayout.vue

  Main layout for owner-facing pages. On desktop renders OwnerNavigationDrawer
  (permanent sidebar); on mobile renders MobileBottomNav (bottom tab bar).
  Initializes realtime sync and provides appStatus to child pages. A floating
  FAB and GlobalBookingModal are rendered on all non-calendar pages.
-->

<!-- src/layouts/owner.vue -->
<template>
  <v-app class="owner-layout">
    <v-app-bar
      color="surface"
      flat
      height="64"
      order="-1"
    >
      <!-- Wordmark — Variant A "Hook-back arc" (replaces the old text "Claro" brand) -->
      <ClaroWordmark class="claro-appbar-wm" />

      <!-- Tiles toggle — 2×2 square grid in primary purple (replaces hamburger) -->
      <button
        v-if="!mobile"
        :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
        class="claro-toggle"
        type="button"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span class="claro-tiles">
          <span /><span /><span /><span />
        </span>
      </button>

      <!-- Calendar controls — only on schedule page -->
      <template v-if="isCalendarPage">
        <v-divider class="mx-3 my-0 d-none d-sm-flex" vertical />

        <v-btn
          aria-label="Previous period"
          density="comfortable"
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          @click="calendarNavPrev?.()"
        />

        <v-btn
          aria-label="Next period"
          density="comfortable"
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          @click="calendarNavNext?.()"
        />

        <span class="text-h6 font-weight-regular ml-3 d-none d-sm-inline">
          {{ formattedMonthYear }}
        </span>

        <span class="text-body-1 font-weight-medium ml-2 d-sm-none">
          {{ formattedMonthYearShort }}
        </span>
      </template>

      <v-spacer />

      <!-- Right-side actions: star · bell · chevron-down · avatar (per design handoff) -->
      <div class="claro-actions">
        <!-- Calendar view-mode toggle — only on calendar page -->
        <template v-if="isCalendarPage">
          <button
            :aria-label="viewMode === 'ranges' ? 'Switch to event view' : 'Switch to range view'"
            class="claro-btn"
            type="button"
            @click="(() => {
              const nextViewMode = viewMode === 'ranges' ? 'events' : 'ranges'
              viewMode = nextViewMode
              $router.replace({
                query: {
                  ...$route.query,
                  viewMode: nextViewMode,
                },
              })
            })()"
          >
            <v-icon size="20">
              {{ viewMode === 'ranges' ? 'mdi-calendar-range' : 'mdi-calendar-check-outline' }}
            </v-icon>

            <v-tooltip activator="parent" content-class="claro-tooltip" location="bottom">
              {{ viewMode === 'ranges' ? 'Switch to event view' : 'Switch to range view' }}
            </v-tooltip>
          </button>

          <span class="claro-actions-divider" />
        </template>

        <button aria-label="Favorites" class="claro-btn" type="button">
          <v-icon size="20">mdi-star-outline</v-icon>
        </button>

        <button aria-label="Notifications" class="claro-btn" type="button">
          <v-badge
            color="error"
            :content="notificationCount"
            dot
            :model-value="notificationCount > 0"
          >
            <v-icon size="20">mdi-bell-outline</v-icon>
          </v-badge>
        </button>

        <!-- Chevron-down "more options" trigger — opens user menu -->
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <button
              aria-label="More options"
              class="claro-chevron-btn"
              type="button"
              v-bind="menuProps"
            >
              <v-icon size="22">mdi-chevron-down</v-icon>
            </button>
          </template>

          <v-card min-width="220">
            <div class="d-flex align-center ga-3 pa-4 pb-2">
              <v-avatar color="primary" size="38">
                <span class="text-caption font-weight-bold">{{ userInitials }}</span>
              </v-avatar>

              <div>
                <div class="text-body-2 font-weight-medium">{{ authStore.user?.name || 'User' }}</div>
                <div class="text-caption text-medium-emphasis">{{ authStore.user?.email }}</div>
              </div>
            </div>

            <v-divider class="my-1" />

            <v-list density="comfortable">
              <v-list-item
                prepend-icon="mdi-account-outline"
                title="Profile"
                :to="'/owner/profile'"
              />

              <v-list-item
                prepend-icon="mdi-cog-outline"
                title="Settings"
                :to="'/owner/settings'"
              />

              <v-divider class="my-1" />

              <v-list-item
                class="text-error"
                prepend-icon="mdi-logout"
                title="Sign Out"
                @click="handleSignOut"
              />
            </v-list>
          </v-card>
        </v-menu>

        <!-- Avatar with online status dot -->
        <div aria-label="User profile" class="claro-avatar">
          {{ userInitials }}
          <span aria-hidden="true" class="claro-status-dot" />
        </div>
      </div>
    </v-app-bar>

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
  import type { NavItem } from '@/components/dumb/shared/MobileBottomNav.vue'
  import type { Ref } from 'vue'
  import { useAuthStore } from '@stores/auth'
  import { computed, onMounted, provide, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import ClaroWordmark from '@/components/dumb/shared/ClaroWordmark.vue'
  import MobileBottomNav from '@/components/dumb/shared/MobileBottomNav.vue'
  import GlobalBookingModal from '@/components/smart/owner/GlobalBookingModal.vue'
  import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
  import { useOwnerCalendarState } from '@/composables/owner/useOwnerCalendarState'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
  import { useUIStore } from '@/stores/ui'

  const ownerNavItems: NavItem[] = [
    { id: 'overview', value: 'overview', label: 'Overview', icon: 'mdi-view-dashboard', route: '/owner/overview' },
    { id: 'calendar', value: 'calendar', label: 'Calendar', icon: 'mdi-calendar', route: '/owner/calendar' },
    { id: 'bookings', value: 'bookings', label: 'Bookings', icon: 'mdi-format-list-bulleted', route: '/owner/bookings' },
    { id: 'properties', value: 'properties', label: 'Properties', icon: 'mdi-home', route: '/owner/properties' },
  ]

  const { mdAndUp, mobile } = useDisplay()
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const calendarState = useOwnerCalendarState()
  const { init: initRealtimeSync } = useRealtimeSync()

  const sidebarOpen = ref(mdAndUp.value)
  const notificationCount = ref(0)
  const viewMode = calendarState.viewMode

  // Calendar nav — filled by OwnerCalendar via provide/inject when it mounts
  const calendarNavPrev = ref<(() => void) | null>(null)
  const calendarNavNext = ref<(() => void) | null>(null)
  provide('ownerCalNavPrev', calendarNavPrev as Ref<(() => void) | null>)
  provide('ownerCalNavNext', calendarNavNext as Ref<(() => void) | null>)

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

    updateCalendarMonthLabels()
    window.setInterval(updateCalendarMonthLabels, 300)
  })

  const isCalendarPage = computed(() => route.path === '/owner/calendar')

  const formattedMonthYear = ref(
    calendarState.currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  )

  const formattedMonthYearShort = ref(
    calendarState.currentDate.value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  )

  function updateCalendarMonthLabels () {
    const fallbackLong = calendarState.currentDate.value.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    const fallbackShort = calendarState.currentDate.value.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })

    if (!isCalendarPage.value) {
      formattedMonthYear.value = fallbackLong
      formattedMonthYearShort.value = fallbackShort
      return
    }

    const toolbarTitle = document.querySelector('.fc-toolbar-title')?.textContent?.trim()

    formattedMonthYear.value = toolbarTitle || fallbackLong
    formattedMonthYearShort.value = toolbarTitle || fallbackShort
  }

  const userInitials = computed(() => {
    const name
      = authStore.user?.name
        || authStore.user?.email?.split('@')[0]
        || 'U'
    return name
      .split(' ')
      .map((n: string) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  async function handleSignOut () {
    try {
      await authStore.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    router.push('/')
  }
</script>
