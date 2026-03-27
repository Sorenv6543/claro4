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
          class="text-none mr-2"
          size="small"
          variant="outlined"
          @click="calendarState.goToToday()"
        >
          Today
        </v-btn>

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
          <v-btn class="text-none" size="small" value="ranges">Ranges</v-btn>
          <v-btn class="text-none" size="small" value="events">Events</v-btn>
        </v-btn-toggle>
      </template>

      <!-- View switcher — calendar page only -->
      <template v-if="isCalendarPage">
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              append-icon="mdi-chevron-down"
              class="text-none mr-2"
              size="small"
              variant="outlined"
            >
              {{ viewLabels[activeViewKey] }}
            </v-btn>
          </template>
          <v-list density="compact" min-width="140">
            <v-list-item
              v-for="opt in viewOptions"
              :key="opt.value"
              :active="activeViewKey === opt.value"
              color="primary"
              :prepend-icon="opt.icon"
              :title="opt.label"
              @click="switchView(opt.value)"
            />
          </v-list>
        </v-menu>
      </template>

      <!-- Notification bell -->
      <v-btn
        aria-label="Notifications"
        class="mr-1"
        icon="mdi-bell-outline"
        size="small"
        variant="text"
      />

      <!-- DEV: theme picker -->
      <template v-if="isDev">
        <v-menu :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              aria-label="Theme picker"
              class="mr-1"
              icon="mdi-palette"
              size="small"
              variant="text"
            />
          </template>
          <v-card elevation="2" rounded="lg" style="padding:12px;width:296px">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
              <div
                v-for="t in THEMES"
                :key="t.id"
                style="position:relative;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid transparent"
                :style="theme.global.name.value === t.id ? { borderColor: t.primary } : {}"
                @click="applyTheme(t.id)"
              >
                <div style="display:flex;height:36px">
                  <div :style="{ flex:1, background: t.primary }" />
                  <div :style="{ flex:1, background: t.background }" />
                  <div :style="{ flex:1, background: t.surface }" />
                </div>
                <div style="padding:3px 6px;font-size:11px;background:#fff;color:#333">{{ t.label }}</div>
                <v-icon
                  v-if="theme.global.name.value === t.id"
                  color="white"
                  size="14"
                  style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.45);border-radius:50%;padding:2px"
                >mdi-check</v-icon>
              </div>
            </div>
          </v-card>
        </v-menu>
      </template>

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
      </v-menu>
    </v-app-bar>

    <OwnerNavigationDrawer v-model="sidebarOpen" />

    <v-main>
      <router-view />
    </v-main>

    <OwnerBottomNav @open-drawer="sidebarOpen = true" />
  </v-app>
</template>

<script setup lang="ts">
  import { useAuthStore } from '@stores/auth'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay, useTheme } from 'vuetify'
  import OwnerBottomNav from '@/components/smart/owner/OwnerBottomNav.vue'
  import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
  import { useCalendarState } from '@/composables/shared/useCalendarState'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
  import { THEMES } from '@/layouts/ownerThemes'

  const isDev = import.meta.env.DEV
  const { mdAndUp } = useDisplay()
  const theme = useTheme()
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

  const viewOptions = [
    { value: 'month', label: 'Month', icon: 'mdi-calendar-month-outline' },
    { value: 'week', label: 'Week', icon: 'mdi-calendar-week-outline' },
    { value: 'day', label: 'Day', icon: 'mdi-calendar-today-outline' },
    { value: 'list', label: 'List', icon: 'mdi-format-list-bulleted' },
  ] as const

  const viewLabels: Record<string, string> = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
    list: 'List',
  }

  const activeViewKey = computed(() => {
    const v = calendarState.currentView.value
    if (v === 'timeGridWeek') return 'week'
    if (v === 'timeGridDay') return 'day'
    if (v === 'listWeek') return 'list'
    return 'month'
  })

  function switchView (key: string) {
    const viewMap: Record<string, 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'> = {
      week: 'timeGridWeek',
      day: 'timeGridDay',
      list: 'listWeek',
      month: 'dayGridMonth',
    }
    calendarState.setCalendarView(viewMap[key] ?? 'dayGridMonth')
  }

  // ── Theme / Auth ─────────────────────────────────────────────────
  function applyTheme (id: string) {
    theme.global.name.value = id
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
