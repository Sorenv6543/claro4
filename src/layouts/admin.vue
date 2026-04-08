<!-- layouts/admin.vue - Full admin layout with sidebar and top app bar -->
<template>
  <v-app class="admin-layout">
    <!-- Admin App Bar — matches owner nav bar style -->
    <v-app-bar
      border="b"
      color="surface"
      flat
      height="64"
      order="-1"
    >
      <v-app-bar-nav-icon
        :icon="isSidebarOpen ? 'mdi-menu-open' : 'mdi-menu'"
        @click="toggleSidebar"
      />

      <v-app-bar-title class="flex-grow-0" style="min-width:auto">
        <span class="text-h6 font-weight-bold text-primary">Claro</span>
      </v-app-bar-title>

      <v-spacer />

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
              to="/admin/profile"
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
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

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
    router.push(`/admin/schedule?date=${date.toISOString().split('T')[0]}`)
  }

  function handleFilterByProperty (propertyId: string | null) {
    console.log('Filter by property:', propertyId)
  }

  function handleCreateBooking () {
    router.push('/admin/bookings/create')
  }

  function handleCreateProperty () {
    router.push('/admin/properties/create')
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
    } catch (error) {
      console.error('[AdminLayout] Failed to initialize:', error)
    } finally {
      loading.value = false
    }
  })
</script>
