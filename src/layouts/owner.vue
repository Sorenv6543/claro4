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

    <!-- Floating action button — action varies by page -->
    <Teleport to="body">
      <button
        v-if="isReady && !isCalendarPage && !isOverviewPage"
        :aria-label="isPropertiesPage ? 'Add property' : 'Add booking'"
        class="fab-add-booking"
        type="button"
        @click="isPropertiesPage ? openPropertyModal() : openBookingModal()"
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
  import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay, useTheme } from 'vuetify'
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

  const vuetifyTheme = useTheme()
  let calendarLabelInterval: ReturnType<typeof setInterval> | null = null

  function openBookingModal () {
    uiStore.openModal('eventModal', 'create')
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('property-scheduler-theme')
    if (savedTheme) vuetifyTheme.global.name.value = savedTheme

    initRealtimeSync()
      .then(() => {
        isReady.value = true
      })
      .catch((error: unknown) => {
        initError.value = error instanceof Error ? error : new Error(String(error))
        console.error('[OwnerLayout] Failed to initialize realtime sync:', error)
      })

    updateCalendarMonthLabels()
    calendarLabelInterval = window.setInterval(updateCalendarMonthLabels, 300)
  })

  onUnmounted(() => {
    if (calendarLabelInterval !== null) {
      window.clearInterval(calendarLabelInterval)
      calendarLabelInterval = null
    }
  })

  const isCalendarPage = computed(() => route.path === '/owner/calendar')
  const isOverviewPage = computed(() => route.path === '/owner/overview')
  const isPropertiesPage = computed(() => route.path === '/owner/properties')

  function openPropertyModal (): void {
    uiStore.openModal('propertyModal', 'create')
  }

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
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      uiStore.addNotification(
        'error',
        'Logout Failed',
        'Unable to sign out. Please try again.',
      )
    }
  }
</script>

<style scoped>
:deep(.v-main) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: rgb(var(--v-theme-background));
}

/* ── Appbar shell — matches components-appbar.html handoff ─────────────────── */
.owner-layout :deep(.v-app-bar) {
  background: rgb(var(--v-theme-surface)) !important;
  border-bottom: 1px solid rgba(46, 38, 61, 0.08);
  padding: 0 20px;
}

.owner-layout :deep(.v-app-bar .v-toolbar__content) {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* Wordmark — height 38px, fixed-width brand area on desktop to align with sidebar */
.claro-appbar-wm {
  margin: 0;
}

@media (min-width: 960px) {
  .claro-appbar-wm {
    margin-right: 8px;
  }
}

/* ── Tiles toggle (2×2 grid in primary purple) ─────────────────────────────── */
.claro-toggle {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--claro-primary, #7367F0);
  transition: background 140ms ease;
  padding: 0;
}

.claro-toggle:hover {
  background: rgba(115, 103, 240, 0.10);
}

.claro-toggle:focus-visible {
  outline: 2px solid var(--claro-primary, #7367F0);
  outline-offset: 2px;
}

.claro-tiles {
  display: grid;
  grid-template-columns: repeat(2, 8px);
  grid-template-rows: repeat(2, 8px);
  gap: 3px;
}

.claro-tiles > span {
  display: block;
  border-radius: 1.5px;
  background: var(--claro-primary, #7367F0);
}

/* Diagonal tile dim for visual hierarchy (matches handoff) */
.claro-tiles > span:nth-child(2),
.claro-tiles > span:nth-child(3) {
  opacity: 0.45;
}

/* ── Right-side actions ────────────────────────────────────────────────────── */
.claro-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.claro-actions-divider {
  display: inline-block;
  width: 1px;
  height: 24px;
  margin: 0 6px;
  background: rgba(46, 38, 61, 0.12);
}

.claro-btn,
.claro-chevron-btn {
  height: 38px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.68);
  transition: background 140ms ease, color 140ms ease;
  padding: 0;
}

.claro-btn {
  width: 38px;
}

.claro-chevron-btn {
  padding: 0 6px 0 4px;
}

.claro-btn:hover,
.claro-chevron-btn:hover {
  background: rgba(46, 38, 61, 0.05);
  color: rgba(var(--v-theme-on-surface), 0.95);
}

.claro-btn:focus-visible,
.claro-chevron-btn:focus-visible {
  outline: 2px solid var(--claro-primary, #7367F0);
  outline-offset: 2px;
}

/* ── Avatar with status dot ────────────────────────────────────────────────── */
.claro-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--claro-primary-dark, #5E52EE);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  margin-left: 4px;
  position: relative;
  flex-shrink: 0;
}

.claro-status-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #28C76F;
  bottom: 0;
  right: 0;
  border: 2px solid #fff;
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
