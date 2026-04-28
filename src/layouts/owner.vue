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
        :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
        class="claro-toggle"
        type="button"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span class="claro-tiles">
          <span /><span /><span /><span />
        </span>
      </button>

      <!-- Calendar controls — only on schedule page, desktop only (mobile uses bottom pill) -->
      <template v-if="isCalendarPage && !mobile">
        <v-divider class="mx-3 my-0 d-none d-sm-flex" vertical />

        <v-btn
          aria-label="Previous period"
          density="comfortable"
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          @click="calendarState.prev()"
        />
        <v-btn
          aria-label="Next period"
          density="comfortable"
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          @click="calendarState.next()"
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
            @click="viewMode = viewMode === 'ranges' ? 'events' : 'ranges'"
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

        <button class="claro-btn" type="button" aria-label="Favorites">
          <v-icon size="20">mdi-star-outline</v-icon>
        </button>

        <button class="claro-btn" type="button" aria-label="Notifications">
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
              class="claro-chevron-btn"
              type="button"
              aria-label="More options"
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
        <div class="claro-avatar" aria-label="User profile">
          {{ userInitials }}
          <span class="claro-status-dot" aria-hidden="true" />
        </div>
      </div>
    </v-app-bar>

    <OwnerNavigationDrawer v-model="sidebarOpen" />

    <v-main>
      <v-banner
        v-if="initError"
        color="error"
        icon="mdi-alert-circle-outline"
        lines="one"
        class="mb-0"
      >
        <v-banner-text>
          Failed to load data. Please refresh the page.
        </v-banner-text>
      </v-banner>
      <v-skeleton-loader
        v-else-if="!isReady"
        type="article"
        class="ma-4"
      />
      <router-view v-else />
    </v-main>

    <!-- Global booking modal: active on all non-calendar pages.
         Calendar page (HomeOwner.vue) manages its own modal with richer handlers. -->
    <GlobalBookingModal v-if="isReady && !isCalendarPage" />

    <!-- Floating Add Booking pill — not shown on the calendar page (has its own controls) -->
    <Teleport to="body">
      <v-btn
        v-if="isReady && !isCalendarPage"
        class="fab-add-booking"
        color="primary"
        prepend-icon="mdi-plus"
        rounded="pill"
        @click="openBookingModal"
      >
        Add booking
      </v-btn>
    </Teleport>

  </v-app>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@stores/auth'
  import { computed, onMounted, provide, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import ClaroWordmark from '@/components/dumb/shared/ClaroWordmark.vue'
  import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
  import GlobalBookingModal from '@/components/smart/owner/GlobalBookingModal.vue'
  import { useOwnerCalendarState } from '@/composables/owner/useOwnerCalendarState'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
  import { useUIStore } from '@/stores/ui'

  const { mdAndUp, mobile } = useDisplay()
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const calendarState = useOwnerCalendarState()
  const { init: initRealtimeSync } = useRealtimeSync()

  const sidebarOpen = ref(mdAndUp.value)
  const notificationCount = ref(0)
  const viewMode = calendarState.viewMode

  const uiStore = useUIStore()

  const isReady = ref(false)
  const initError = ref<Error | null>(null)
  provide('appStatus', { isReady, initError })

  function openBookingModal() {
    uiStore.openModal('eventModal', 'create')
  }

  onMounted(() => {
    initRealtimeSync()
      .then(() => { isReady.value = true })
      .catch((error: unknown) => {
        initError.value = error instanceof Error ? error : new Error(String(error))
        console.error('[OwnerLayout] Failed to initialize realtime sync:', error)
      })
  })

  // Show calendar controls only on the owners/calendar page
  const isCalendarPage = computed(() => route.path === '/owner/calendar')

  // ── Calendar header data ─────────────────────────────────────────
  const formattedMonthYear = computed(() =>
    calendarState.currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  )

  const formattedMonthYearShort = computed(() =>
    calendarState.currentDate.value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  )

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
  background: var(--claro-primary, #7367F0);
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

/* Floating Add Booking pill — fixed bottom-right, above mobile nav */
.fab-add-booking {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(115, 103, 240, 0.45) !important;
}

@media (max-width: 599px) {
  .fab-add-booking {
    bottom: 72px; /* clear mobile bottom nav */
  }
}

</style>
