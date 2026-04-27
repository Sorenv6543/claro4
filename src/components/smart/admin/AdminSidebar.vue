<template>
  <v-navigation-drawer
    :model-value="modelValue"
    :permanent="mdAndUp"
    :temporary="!mdAndUp"
    :width="drawerWidth"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Navigation section -->
    <v-list class="pt-2" density="comfortable" nav :opened="usersGroupOpen ? ['users'] : []">
      <v-list-subheader class="text-overline">Administration</v-list-subheader>

      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :active="isActive(item.to)"
        color="primary"
        :prepend-icon="isActive(item.to) ? item.filledIcon : item.icon"
        :title="item.label"
        @click="navigateTo(item.to)"
      />

      <!-- Users group: Cleaners, Property Owners, Administrators -->
      <v-list-group value="users">
        <template #activator="{ props: groupProps }">
          <v-list-item
            v-bind="groupProps"
            :active="usersGroupOpen"
            color="primary"
            :prepend-icon="usersGroupOpen ? 'mdi-account-multiple' : 'mdi-account-multiple-outline'"
            title="Users"
          />
        </template>

        <v-list-item
          :active="isActive('/admin/cleaners')"
          color="primary"
          :prepend-icon="isActive('/admin/cleaners') ? 'mdi-account-hard-hat' : 'mdi-account-hard-hat-outline'"
          title="Cleaners"
          @click="navigateTo('/admin/cleaners')"
        />
        <v-list-item
          :active="isActive('/admin/property-owners')"
          color="primary"
          :prepend-icon="isActive('/admin/property-owners') ? 'mdi-account-group' : 'mdi-account-group-outline'"
          title="Property Owners"
          @click="navigateTo('/admin/property-owners')"
        />
        <v-list-item
          :active="isActive('/admin/users')"
          color="primary"
          :prepend-icon="isActive('/admin/users') ? 'mdi-account-cog' : 'mdi-account-cog-outline'"
          title="Administrators"
          @click="navigateTo('/admin/users')"
        />
      </v-list-group>
    </v-list>

    <v-divider class="mx-4 my-1" />

    <!-- Business Overview metrics -->
    <div class="px-4 pt-2 pb-1">
      <div class="text-overline text-medium-emphasis px-1 mb-2" style="font-size:0.67rem">Business Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <v-card variant="outlined">
          <v-card-text class="text-center pa-2">
            <div class="text-h6 font-weight-bold text-primary">{{ totalProperties }}</div>
            <div class="text-caption text-medium-emphasis">Properties</div>
          </v-card-text>
        </v-card>
        <v-card variant="outlined">
          <v-card-text class="text-center pa-2">
            <div class="text-h6 font-weight-bold text-success">{{ activeCleaningsToday }}</div>
            <div class="text-caption text-medium-emphasis">Active</div>
          </v-card-text>
        </v-card>
        <v-card variant="outlined">
          <v-card-text class="text-center pa-2">
            <div class="text-h6 font-weight-bold text-warning">{{ urgentBookings.length }}</div>
            <div class="text-caption text-medium-emphasis">Urgent</div>
          </v-card-text>
        </v-card>
        <v-card variant="outlined">
          <v-card-text class="text-center pa-2">
            <div class="text-h6 font-weight-bold text-info">{{ totalCleanersCount }}</div>
            <div class="text-caption text-medium-emphasis">Cleaners</div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Urgent Alerts -->
    <template v-if="urgentBookings.length > 0">
      <v-divider class="mx-4 my-1" />
      <v-list class="pt-1" density="compact" nav>
        <v-list-subheader class="text-overline">
          Urgent Alerts
          <v-chip class="ml-2" color="error" size="x-small" variant="flat">{{ urgentBookings.length }}</v-chip>
        </v-list-subheader>

        <v-list-item
          v-for="booking in urgentBookings.slice(0, 3)"
          :key="booking.id"
          color="error"
          prepend-icon="mdi-alert-circle"
          :subtitle="'Turn cleaning needed'"
          :title="getPropertyName(booking.property_id)"
          @click="viewBooking(booking)"
        />

        <v-list-item
          v-if="urgentBookings.length > 3"
          color="primary"
          prepend-icon="mdi-eye"
          :title="`View all (${urgentBookings.length})`"
          @click="navigateTo('/admin/bookings?filter=urgent')"
        />
      </v-list>
    </template>

    <v-divider class="mx-4 my-1" />

    <!-- Quick Actions -->
    <v-list class="pt-1" density="compact" nav>
      <v-list-subheader class="text-overline">Quick Actions</v-list-subheader>

      <v-list-item
        v-for="item in quickActions"
        :key="item.label"
        color="primary"
        :prepend-icon="item.icon"
        :title="item.label"
        @click="item.action()"
      />
    </v-list>

    <!-- Bottom: user profile -->
    <template #append>
      <v-divider />
      <div class="pa-3 pb-2">
        <div class="d-flex align-center ga-3 px-1 py-2">
          <v-avatar color="primary" size="30">
            <v-icon color="white" size="18">mdi-shield-account</v-icon>
          </v-avatar>
          <div class="overflow-hidden flex-1-1">
            <div class="text-body-2 font-weight-semibold text-truncate">{{ authStore.user?.name || 'Admin' }}</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ authStore.user?.email || '' }}</div>
          </div>
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" icon size="x-small" variant="text">
                <v-icon size="16">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-account" title="Profile" @click="navigateTo('/admin/profile')" />
                <v-list-item prepend-icon="mdi-cog" title="Settings" @click="navigateTo('/admin/settings')" />
                <v-divider />
                <v-list-item prepend-icon="mdi-logout" title="Sign Out" @click="handleSignOut" />
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types/booking.ts'
  import type { Property } from '@/types/property.ts'
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth.ts'
  import { formatPropertyAddress } from '@/types/property'

  interface Props {
    modelValue?: boolean
    bookings?: Booking[]
    properties?: Property[]
    totalProperties?: number
    totalCleaners?: number
    activeCleaningsToday?: number
    urgentTurnsCount?: number
    loading?: boolean
    currentView?: string
    currentDate?: Date
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    bookings: () => [],
    properties: () => [],
    totalProperties: 0,
    totalCleaners: 0,
    activeCleaningsToday: 0,
    urgentTurnsCount: 0,
    loading: false,
    currentView: 'month',
    currentDate: () => new Date(),
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'navigate-to-booking': [bookingId: string]
    'navigate-to-date': [date: Date]
    'filter-by-property': [propertyId: string | null]
    'create-booking': []
    'create-property': []
    'assign-cleaner': [data: { bookingId: string, cleanerId?: string }]
    'generate-reports': []
    'manage-system': []
    'emergency-response': []
  }>()

  const router = useRouter()
  const route = useRoute()
  const { mdAndUp } = useDisplay()
  const authStore = useAuthStore()

  // 260 on md+ (permanent), 280 below (temporary overlay — wider for
  // readability when slid in). The CSS token --claro-drawer-width in
  // tokens.css is documentary only; this computed owns width selection.
  const drawerWidth = computed(() => mdAndUp.value ? 260 : 280)

  const navItems = [
    {
      label: 'Overview',
      icon: 'mdi-view-dashboard-outline',
      filledIcon: 'mdi-view-dashboard',
      to: '/admin',
    },
    {
      label: 'Calendar',
      icon: 'mdi-calendar-month-outline',
      filledIcon: 'mdi-calendar-month',
      to: '/admin/calendar',
    },
    {
      label: 'All Bookings',
      icon: 'mdi-calendar-check-outline',
      filledIcon: 'mdi-calendar-check',
      to: '/admin/bookings',
    },
    {
      label: 'Properties',
      icon: 'mdi-home-city-outline',
      filledIcon: 'mdi-home-city',
      to: '/admin/properties',
    },
    {
      label: 'Reports',
      icon: 'mdi-chart-line',
      filledIcon: 'mdi-chart-line',
      to: '/admin/reports',
    },
  ]

  const quickActions = [
    { label: 'New Booking', icon: 'mdi-calendar-plus', action: () => emit('create-booking') },
    { label: 'Add Property', icon: 'mdi-home-plus', action: () => emit('create-property') },
    { label: 'Add Cleaner', icon: 'mdi-account-plus', action: () => navigateTo('/admin/cleaners/create') },
    { label: 'Generate Report', icon: 'mdi-file-chart-outline', action: () => emit('generate-reports') },
    { label: 'System Settings', icon: 'mdi-cog-outline', action: () => navigateTo('/admin/settings') },
  ]

  function isActive (to: string): boolean {
    if (to === '/admin') return route.path === '/admin'
    return route.path === to || route.path.startsWith(to + '/')
  }

  const usersGroupOpen = computed(() =>
    ['/admin/cleaners', '/admin/property-owners', '/admin/users'].some(path => isActive(path)),
  )

  const totalCleanersCount = computed(() => props.totalCleaners)

  const propertyNameById = computed(() =>
    new Map(
      props.properties.map(property => [property.id, formatPropertyAddress(property, 'short')]),
    ),
  )

  const urgentBookings = computed(() =>
    props.bookings.filter(booking => {
      const today = new Date().toISOString().split('T')[0]

      return booking.checkout_date.startsWith(today)
        && booking.booking_type === 'turn'
        && booking.status !== 'completed'
    }),
  )

  function navigateTo (path: string) {
    router.push(path)
  }

  async function handleSignOut () {
    const success = await authStore.logout()
    if (success) router.push('/')
  }

  function viewBooking (booking: Booking) {
    emit('navigate-to-booking', booking.id)
  }

  function getPropertyName (propertyId: string): string {
    return propertyNameById.value.get(propertyId) ?? 'Unknown Property'
  }
</script>

<style scoped>
/* Ensure nav icon colors follow active state, not forced overrides */
.v-list-item :deep(.v-list-item__prepend .v-icon) {
  opacity: 0.75;
}

.v-list-item--active :deep(.v-list-item__prepend .v-icon) {
  opacity: 1;
}
</style>

<!-- Non-scoped: temporary drawers are teleported to v-app root, scoped CSS can't reach them.
     Scoped to .admin-layout to avoid affecting owner drawers. -->
<style>
.admin-layout .v-navigation-drawer--temporary {
  top: var(--app-bar-height, 64px) !important;
  height: calc(100% - var(--app-bar-height, 64px)) !important;
}
</style>
