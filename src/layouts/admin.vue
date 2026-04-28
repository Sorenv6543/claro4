<!--
  AdminLayout.vue

  Main layout for admin-facing pages, including the dashboard, bookings, properties, cleaners,
  and settings. Contains a frosted-glass app bar with a hamburger sidebar toggle, the Claro
  brand title, ThemePicker, favorites, notifications bell, and an avatar/user menu. The
  AdminSidebar shows live stats (active cleanings today, urgent turns, total properties and
  cleaners) and exposes quick-action handlers (assign cleaner, create booking/property,
  emergency response, generate reports, manage system). Data is initialized on mount via
  useAdminUserManagement, useCleanerManagement, and useRealtimeSync; isReady/initError are
  provided to child pages via provide/inject.
-->
<template>
  <v-app class="admin-layout">
    <!-- Admin app bar with admin-specific controls (user menu, notifications) -->
    <v-app-bar
      color="transparent"
      flat
      height="64"
      order="-1"
    >
      <v-app-bar-nav-icon
        :icon="isSidebarOpen ? 'mdi-menu-open' : 'mdi-menu'"
        @click="toggleSidebar"
      />

      <v-app-bar-title class="flex-grow-0" style="min-width: auto">
        <span class="text-h6 font-weight-bold text-primary">Claro</span>
      </v-app-bar-title>

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
                <div class="text-body-2 font-weight-medium">{{ authStore.user?.name || 'Admin' }}</div>
                <div class="text-caption text-medium-emphasis">{{ authStore.user?.email }}</div>
              </div>
            </div>
            <v-divider class="my-1" />
            <v-list density="comfortable">
              <v-list-item
                prepend-icon="mdi-account-outline"
                title="Profile"
                to="/admin/profile"
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

    <!-- Admin Sidebar -->
    <AdminSidebar
      v-model="isSidebarOpen"
      :active-cleanings-today="activeCleaningsToday"
      :bookings="bookings"
      :current-date="currentDate"
      :current-view="currentView"
      :loading="loading"
      :properties="properties"
      :total-cleaners="allCleaners.length"
      :total-properties="totalProperties"
      :urgent-turns-count="urgentTurnsCount"
      @assign-cleaner="handleAssignCleaner"
      @create-booking="handleCreateBooking"
      @create-property="handleCreateProperty"
      @emergency-response="handleEmergencyResponse"
      @filter-by-property="handleFilterByProperty"
      @generate-reports="handleGenerateReports"
      @manage-system="handleManageSystem"
      @navigate-to-booking="handleNavigateToBooking"
      @navigate-to-date="handleNavigateToDate"
    />

    <!-- Main Content Area -->
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
  </v-app>
</template>

<script setup lang="ts">
  import { computed, onMounted, provide, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'

  import ThemePicker from '@/components/dumb/shared/ThemePicker.vue'
  import AdminSidebar from '@/components/smart/admin/AdminSidebar.vue'
  import { useAdminUserManagement } from '@/composables/admin/useAdminUserManagement'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
  import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync'
  import { useAuthStore } from '@/stores/auth'
  import { useBookingStore } from '@/stores/booking'
  import { usePropertyStore } from '@/stores/property'

  // Composables
  const router = useRouter()
  const { mdAndUp } = useDisplay()
  const authStore = useAuthStore()
  const bookingStore = useBookingStore()
  const propertyStore = usePropertyStore()
  const { users: _allUsers, fetchAllUsers } = useAdminUserManagement()
  const { allCleaners, fetchCleaners } = useCleanerManagement()
  const { init: initRealtimeSync } = useRealtimeSync()

  // Initialize state
  const currentView = ref('month')
  const currentDate = ref(new Date())
  const isSidebarOpen = ref(mdAndUp.value)
  const loading = ref<boolean>(false)
  const notificationCount = ref(0)

  // AppStatus — shared with all child pages via provide/inject
  const isReady = ref(false)
  const initError = ref<Error | null>(null)
  provide('appStatus', { isReady, initError })

  const bookings = computed(() => Array.from(bookingStore.bookings.values()))
  const properties = computed(() => Array.from(propertyStore.properties.values()))

  // Computed stats for sidebar
  const totalProperties = computed(() => propertyStore.properties.size)

  const activeCleaningsToday = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return Array.from(bookingStore.bookings.values())
      .filter(booking =>
        booking.checkout_date.startsWith(today)
        && booking.status === 'in_progress',
      )
      .length
  })

  const urgentTurnsCount = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return Array.from(bookingStore.bookings.values())
      .filter(booking =>
        booking.checkout_date.startsWith(today)
        && booking.booking_type === 'turn'
        && booking.status !== 'completed',
      )
      .length
  })

  const userInitials = computed(() => {
    const name
      = authStore.user?.name
        || authStore.user?.email?.split('@')[0]
        || 'A'
    return name
      .split(' ')
      .map((n: string) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  // Navigation handlers
  function toggleSidebar () {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  async function handleSignOut () {
    try {
      await authStore.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    router.push('/')
  }

  // Event handlers for sidebar
  function handleNavigateToBooking (bookingId: string) {
    router.push(`/admin/bookings/${bookingId}`)
  }

  function handleNavigateToDate (date: Date) {
    router.push(`/admin/calendar?date=${date.toISOString().split('T')[0]}`)
  }

  function handleFilterByProperty (propertyId: string | null) {
    console.log('Filter by property:', propertyId)
  }

  function handleCreateBooking () {
    router.push('/admin/bookings/create')
  }

  function handleCreateProperty () {
    router.push('/admin/properties')
  }

  function handleAssignCleaner (data: { bookingId: string, cleanerId?: string }) {
    console.log('Assign cleaner:', data)
  }

  function handleGenerateReports () {
    router.push('/admin/reports')
  }

  function handleManageSystem () {
    router.push('/admin/settings')
  }

  function handleEmergencyResponse () {
    console.log('Emergency response triggered')
  }

  // Initialize data on mount
  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([
        fetchAllUsers(),
        fetchCleaners(),
        initRealtimeSync(),
      ])
      isReady.value = true
    } catch (error) {
      initError.value = error instanceof Error ? error : new Error(String(error))
      console.error('[AdminLayout] Failed to initialize:', error)
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
/* Frosted-glass backdrop so scrolled content doesn't show through the transparent app bar */
.admin-layout :deep(.v-app-bar) {
  background: rgba(var(--v-theme-background), 0.72) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding-left: 16px;
  padding-right: 16px;
}

/* Strip button chrome from the hamburger nav icon too */
.admin-layout :deep(.v-app-bar-nav-icon) {
  box-shadow: none !important;
  background: transparent !important;
}

.admin-layout :deep(.v-app-bar-nav-icon .v-icon) {
  font-size: 26px;
}

/* Materio-style app bar icons — plain icons (no button chrome) */
.appbar-icons {
  display: flex;
  align-items: center;
  gap: 0;
}

.appbar-icons :deep(.v-btn) {
  min-width: 36px;
  padding: 0 6px;
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
