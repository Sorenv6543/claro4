<!----
  OwnerLayout.vue

  Main layout for owner-facing pages, including the dashboard/schedule and profile.
  Contains the app bar with navigation, prev/next calendar controls (desktop only on
  the schedule page), and a sidebar for page navigation. The Range/Event view toggle
  lives inside HomeOwner.vue; on mobile the prev/next/month label moves into a
  floating CalendarNavPill rendered by HomeOwner.vue.
-->

<!-- src/layouts/owner.vue -->
<template>
  <v-app class="owner-layout">
    <v-app-bar
      color="transparent"
      flat
      height="64"
      order="-1"
    >
      <!-- Hamburger -->
      <v-app-bar-nav-icon
        :icon="sidebarOpen ? 'mdi-menu-open' : 'mdi-menu'"
        @click="sidebarOpen = !sidebarOpen"
      />

      <!-- Logo -->
      <v-app-bar-title class="flex-grow-0" style="min-width:auto">
        <span class="text-h6 font-weight-bold text-primary">Claro</span>
      </v-app-bar-title>

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

      <!-- Right-side nav icons (Materio style) -->
      <div class="appbar-icons">
        <ThemePicker />

        <v-btn aria-label="Favorites" icon variant="text">
          <v-icon size="26">mdi-star-outline</v-icon>
        </v-btn>

        <v-btn aria-label="Notifications" icon variant="text">
          <v-badge
            color="error"
            :content="notificationCount"
            dot
            :model-value="notificationCount > 0"
          >
            <v-icon size="26">mdi-bell-outline</v-icon>
          </v-badge>
        </v-btn>

        <!-- Avatar / user menu -->
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <div class="avatar-wrapper ml-1 mr-2" v-bind="menuProps">
              <v-avatar
                color="primary"
                size="36"
                style="cursor: pointer"
              >
                <span class="text-caption font-weight-bold">{{ userInitials }}</span>
              </v-avatar>
              <span class="avatar-status" />
            </div>
          </template>
          <v-card min-width="200">
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
      </div>
    </v-app-bar>

    <OwnerNavigationDrawer v-model="sidebarOpen" />

    <v-main>
      <router-view />
    </v-main>

  </v-app>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@stores/auth'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import ThemePicker from '@/components/dumb/shared/ThemePicker.vue'
  import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
  import { useOwnerCalendarState } from '@/composables/owner/useOwnerCalendarState'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'

  const { mdAndUp, mobile } = useDisplay()
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const calendarState = useOwnerCalendarState()
  const { init: initRealtimeSync } = useRealtimeSync()

  const sidebarOpen = ref(mdAndUp.value)
  const notificationCount = ref(0)

  onMounted(() => {
    initRealtimeSync().catch((error: unknown) => {
      console.error('[OwnerLayout] Failed to initialize realtime sync:', error)
    })
  })

  // Show calendar controls only on the schedule/dashboard page
  const isCalendarPage = computed(() => route.path === '/owner/dashboard')

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

/* Frosted-glass backdrop so scrolled content doesn't show through the transparent app bar */
.owner-layout :deep(.v-app-bar) {
  background: rgba(var(--v-theme-background), 0.72) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding-left: 16px;
  padding-right: 16px;
}

/* Strip button chrome from the hamburger nav icon too */
.owner-layout :deep(.v-app-bar-nav-icon) {
  box-shadow: none !important;
  background: transparent !important;
}

.owner-layout :deep(.v-app-bar-nav-icon .v-icon) {
  font-size: 26px;
}

/* Materio-style app bar icons — plain icons (no button chrome) */
.appbar-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.appbar-icons :deep(.v-btn) {
  color: rgba(var(--v-theme-on-surface), 0.68);
  box-shadow: none !important;
  background: transparent !important;
}

.appbar-icons :deep(.v-btn:hover) {
  color: rgba(var(--v-theme-on-surface), 0.9);
  background: rgba(var(--v-theme-on-surface), 0.06) !important;
}

.appbar-icons :deep(.v-btn__overlay),
.appbar-icons :deep(.v-btn__underlay) {
  display: none;
}

/* Avatar with online status dot */
.avatar-wrapper {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.avatar-status {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background-color: rgb(var(--v-theme-success));
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
}
</style>
