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

      <!-- Notification bell -->
      <v-btn
        aria-label="Notifications"
        class="mr-1"
        icon="mdi-bell-outline"
        size="small"
        variant="text"
      />

      <!-- Avatar / user menu -->
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-avatar
            v-bind="menuProps"
            class="mr-2"
            color="primary"
            size="28"
            style="cursor: pointer"
          >
            <span class="text-caption font-weight-bold">{{ userInitials }}</span>
          </v-avatar>
        </template>
        <v-card>
          <v-list density="comfortable" min-width="160">
            <v-list-item
              prepend-icon="mdi-account-outline"
              title="Profile"
              :to="'/owner/profile'"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="handleSignOut"
            />
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <OwnerNavigationDrawer v-model="sidebarOpen" />

    <v-main>
      <router-view />
    </v-main>

  </v-app>
</template>

<script setup lang="ts">
import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
import { useCalendarState } from '@/composables/shared/useCalendarState'
import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
import { useAuthStore } from '@stores/auth'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

  const { mdAndUp } = useDisplay()
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const calendarState = useCalendarState()
  const { init: initRealtimeSync } = useRealtimeSync()

  const sidebarOpen = ref(mdAndUp.value)
  const viewMode = calendarState.viewMode

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
</style>
