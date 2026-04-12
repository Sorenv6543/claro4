  <!----
  OwnerLayout.vue

  Main layout for owner-facing pages, including the dashboard/schedule and profile.
  Contains the app bar with navigation and calendar controls, and a sidebar for page navigation.
  SECTION - The calendar controls (month/year display and view toggle) are only shown on the schedule/dashboard page.
-->

<!-- src/layouts/owner.vue -->
<template>
  <v-app class="owner-layout">
    <v-app-bar
      border="b"
      color="surface"
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

      <!-- Calendar controls — visible only on the schedule page -->
      <template v-if="isCalendarPage">
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

      <!-- View mode toggle (Ranges / Events) -->
      <template v-if="isCalendarPage">
        <v-btn-toggle
          v-model="viewMode"
          class="mr-2"
          color="primary"
          density="compact"
          mandatory
          rounded="pill"
        >
          <v-btn class="text-none" size="small" value="ranges">Range</v-btn>
          <v-btn class="text-none" size="small" value="events">Event</v-btn>
        </v-btn-toggle>
      </template>

      <!-- Right-side nav icons (Materio style) -->
      <div class="appbar-icons">
        <ThemePicker />

        <v-btn aria-label="Favorites" icon variant="text">
          <v-icon size="22">mdi-star-outline</v-icon>
        </v-btn>

        <v-btn aria-label="Notifications" icon variant="text">
          <v-badge
            color="error"
            :content="notificationCount"
            dot
            :model-value="notificationCount > 0"
          >
            <v-icon size="22">mdi-bell-outline</v-icon>
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
  import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
  import ThemePicker from '@/components/dumb/shared/ThemePicker.vue'
  import { useOwnerCalendarState } from '@/composables/owner/useOwnerCalendarState'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
  import { useAuthStore } from '@stores/auth'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'

  const { mdAndUp } = useDisplay()
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const calendarState = useOwnerCalendarState()
  const { init: initRealtimeSync } = useRealtimeSync()

  const sidebarOpen = ref(mdAndUp.value)
  const viewMode = calendarState.viewMode
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
/* Ensure height chain propagates through v-main for full-height pages (calendar).
   Vuetify 4 removed .v-main__wrap — content is placed directly inside .v-main. */
:deep(.v-main) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: rgb(var(--v-theme-background));
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
