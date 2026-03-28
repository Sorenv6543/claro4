<template>
  <div class="admin-dashboard">
    <v-container fluid>
      <!-- Welcome Banner (full width) -->
      <v-row class="mb-4">
        <v-col cols="12">
          <AdminWelcomeBanner
            :booking-count="bookingsData.totalCheckouts"
            :cleanings-completed="bookingsData.completedCount"
            :cleanings-total="bookingsData.totalCheckouts"
            :property-count="propertiesData.totalProperties"
            :turn-count="bookingsData.totalTurns"
            :user-name="userName"
          />
        </v-col>
      </v-row>

      <!-- Card Grid -->
      <v-row>
        <!-- Bookings This Week (wide) -->
        <v-col
          cols="12"
          md="8"
        >
          <WeeklyBookingsChart :daily-counts="weeklyChartData" />
        </v-col>

        <!-- Top Properties -->
        <v-col
          cols="12"
          md="4"
        >
          <TopPropertiesCard :properties="topPropertiesData" />
        </v-col>

        <!-- Upcoming Checkouts -->
        <v-col
          cols="12"
          md="4"
        >
          <UpcomingCheckoutsCard :checkouts="upcomingCheckoutsData" />
        </v-col>

        <!-- Urgent Turns -->
        <v-col
          cols="12"
          md="4"
        >
          <UrgentTurnsCard :turns="urgentTurnsData" />
        </v-col>

        <!-- Cleaner Availability -->
        <v-col
          cols="12"
          md="4"
        >
          <CleanerAvailabilityCard :cleaners="cleanerAvailabilityData" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types/booking.ts'
  import type { Property } from '@/types/property.ts'
  import { computed, onMounted, ref } from 'vue'
  import AdminWelcomeBanner from '@/components/dumb/admin/AdminWelcomeBanner.vue'
  import CleanerAvailabilityCard from '@/components/dumb/admin/CleanerAvailabilityCard.vue'
  import TopPropertiesCard from '@/components/dumb/admin/TopPropertiesCard.vue'
  import UpcomingCheckoutsCard from '@/components/dumb/admin/UpcomingCheckoutsCard.vue'
  import UrgentTurnsCard from '@/components/dumb/admin/UrgentTurnsCard.vue'
  import WeeklyBookingsChart from '@/components/dumb/admin/WeeklyBookingsChart.vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings.ts'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties.ts'
  import { useAdminUserManagement } from '@/composables/admin/useAdminUserManagement.ts'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { calculateBookingPriority } from '@/utils/businessLogic'

  // Composables
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const {
    allBookings,
    fetchAllBookings,
    bookingsByCleaner,
  } = useAdminBookings()
  const {
    allProperties,
    loading: _propertiesLoading,
    fetchAllProperties,
  } = useAdminProperties()
  const {
    users,
    fetchAllUsers,
  } = useAdminUserManagement()

  const loading = ref(false)

  const allPropertiesArray = computed<Property[]>(() => allProperties.value as Property[])
  const allBookingsArray = computed<Booking[]>(() => allBookings.value as Booking[])

  // --- Welcome Banner Data ---
  const userName = computed(() => {
    const name = authStore.user?.name
    if (name) return name
    const email = authStore.user?.email
    return email ? email.split('@')[0] : 'Admin'
  })

  // Computed data for overview cards
  const propertiesData = computed(() => {
    const total = allPropertiesArray.value.length
    const active = allPropertiesArray.value.filter((p: Property) => p.active).length
    const booked = allBookingsArray.value.filter((b: Booking) => {
      const today = new Date().toISOString().split('T')[0]
      return b.checkout_date >= today && b.status !== 'completed'
    }).length

    return {
      totalProperties: total,
      activeProperties: active,
      bookedProperties: booked,
    }
  })

  const bookingsData = computed(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const weekStart = startOfWeek.toISOString().split('T')[0]
    const weekEnd = endOfWeek.toISOString().split('T')[0]

    const allBookingsCount = allBookingsArray.value.length
    const turns = allBookingsArray.value.filter(b => b.booking_type === 'turn')
    const urgentTurns = turns.filter(b => {
      const checkoutTime = new Date(b.checkout_date)
      const hoursUntil = (checkoutTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntil <= 6 && b.status !== 'completed'
    })

    const completedCount = allBookingsArray.value.filter(b => b.status === 'completed').length

    const checkoutsThisWeek = allBookingsArray.value.filter(b =>
      b.checkout_date >= weekStart && b.checkout_date <= weekEnd,
    ).length

    const turnsThisWeek = turns.filter(b =>
      b.checkout_date >= weekStart && b.checkout_date <= weekEnd,
    ).length

    return {
      totalCheckouts: allBookingsCount,
      totalTurns: turns.length,
      urgentTurns: urgentTurns.length,
      completedCount,
      checkoutsThisWeek,
      turnsThisWeek,
    }
  })

  // --- Weekly Bookings Chart Data ---
  const weeklyChartData = computed(() => {
    const now = new Date()
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const colors = [
      '#1976D2', '#1976D2', '#1976D2', '#1976D2', '#1976D2',
      '#FF9800', '#FF9800',
    ]

    // Get Monday of the current week
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))

    return dayNames.map((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dateStr = date.toISOString().split('T')[0]

      const count = allBookingsArray.value.filter(b =>
        b.checkout_date.startsWith(dateStr),
      ).length

      return { day, count, color: colors[index] }
    })
  })

  // --- Top Properties Data ---
  const topPropertiesData = computed(() => {
    const propertyCounts = new Map<string, number>()

    for (const booking of allBookingsArray.value) {
      const current = propertyCounts.get(booking.property_id) || 0
      propertyCounts.set(booking.property_id, current + 1)
    }

    return Array.from(propertyCounts.entries())
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([propertyId, count]) => {
        const property = allPropertiesArray.value.find(p => p.id === propertyId)
        return {
          name: property ? formatPropertyAddress(property, 'short') : 'Unknown',
          color: property?.color || '#1976D2',
          bookingCount: count,
        }
      })
  })

  // --- Upcoming Checkouts Data ---
  const upcomingCheckoutsData = computed(() => {
    const today = new Date().toISOString().split('T')[0]

    return allBookingsArray.value
      .filter(b =>
        b.booking_type !== 'turn'
        && b.checkout_date >= today
        && b.status !== 'completed'
        && b.status !== 'cancelled',
      )
      .toSorted((a, b) => new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime())
      .slice(0, 5)
      .map(b => {
        const property = allPropertiesArray.value.find(p => p.id === b.property_id)
        return {
          property: property ? formatPropertyAddress(property, 'short') : 'Unknown',
          date: new Date(b.checkout_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          status: b.status,
        }
      })
  })

  // --- Urgent Turns Data ---
  const urgentTurnsData = computed(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    return allBookingsArray.value
      .filter(b =>
        b.booking_type === 'turn'
        && b.checkout_date >= today
        && b.checkout_date <= nextWeekStr
        && b.status !== 'completed'
        && b.status !== 'cancelled',
      )
      .toSorted((a, b) => new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime())
      .slice(0, 5)
      .map(b => {
        const property = allPropertiesArray.value.find(p => p.id === b.property_id)
        const priority = calculateBookingPriority(b)
        return {
          property: property ? formatPropertyAddress(property, 'short') : 'Unknown',
          time: new Date(b.checkout_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          priority,
        }
      })
  })

  // --- Cleaner Availability Data ---
  const cleanerAvailabilityData = computed(() => {
    const cleanerGroups = bookingsByCleaner.value
    const cleanerUsers = users.value.filter(u => u.role === 'cleaner')

    if (cleanerUsers.length === 0) return []

    // Total bookings needing cleaning (not completed, not cancelled)
    const activeBookingCount = allBookingsArray.value.filter(
      b => b.status !== 'completed' && b.status !== 'cancelled',
    ).length
    const totalPerCleaner = Math.max(Math.ceil(activeBookingCount / cleanerUsers.length), 1)

    return cleanerUsers.map(cleaner => {
      const assigned = cleanerGroups[cleaner.id]?.length || 0
      return {
        name: cleaner.name || cleaner.email.split('@')[0],
        assigned,
        total: Math.max(totalPerCleaner, assigned),
      }
    })
  })

  // Actions
  async function refreshDashboard () {
    loading.value = true
    try {
      await Promise.all([
        fetchAllBookings(),
        fetchAllProperties(),
        fetchAllUsers(),
      ])
    } catch (error: unknown) {
      console.error('Failed to refresh dashboard:', error)
      uiStore.addNotification('error', 'Error', 'Failed to load dashboard data. Please try again.')
    } finally {
      loading.value = false
    }
  }

  // Initialize
  onMounted(() => {
    refreshDashboard()
  })
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding-top: 8px;
  padding-bottom: 24px;
}
</style>
