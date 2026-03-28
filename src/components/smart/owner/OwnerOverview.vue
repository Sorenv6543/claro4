<template>
  <v-container class="owner-overview pa-4" fluid>
    <v-progress-linear v-if="loading" color="primary" indeterminate class="mb-4" />

    <!-- Welcome Banner -->
    <v-row>
      <v-col cols="12">
        <OwnerWelcomeBanner
          :active-bookings="activeBookingCount"
          :booking-count="bookingStats.total"
          :property-count="myProperties.length"
          :total-bookings="bookingStats.total"
          :turn-count="bookingStats.turns"
          :user-name="userName"
        />
      </v-col>
    </v-row>

    <!-- Urgent Turns Banner (conditional) -->
    <v-row v-if="urgentTurns.length > 0">
      <v-col cols="12">
        <OwnerUrgentTurnsBanner :turns="urgentTurns" />
      </v-col>
    </v-row>

    <!-- Property Summary | Upcoming Bookings -->
    <v-row>
      <v-col cols="12" md="6">
        <OwnerPropertySummaryCards :properties="propertySummaries" />
      </v-col>
      <v-col cols="12" md="6">
        <OwnerUpcomingBookings :bookings="upcomingBookingsList" />
      </v-col>
    </v-row>

    <!-- Mini Calendar | Recent Activity -->
    <v-row>
      <v-col cols="12" md="6">
        <OwnerMiniCalendar :booking-dates="bookingDates" :current-month="currentMonth" />
      </v-col>
      <v-col cols="12" md="6">
        <OwnerRecentActivity :activities="recentActivities" />
      </v-col>
    </v-row>

    <!-- Cleaning Status -->
    <v-row>
      <v-col cols="12">
        <OwnerCleaningStatus :cleanings="cleaningStatusList" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types'
  import type { Property } from '@/types/property'
  import { computed, onMounted, ref } from 'vue'
  import OwnerCleaningStatus from '@/components/dumb/owner/OwnerCleaningStatus.vue'
  import OwnerMiniCalendar from '@/components/dumb/owner/OwnerMiniCalendar.vue'
  import OwnerPropertySummaryCards from '@/components/dumb/owner/OwnerPropertySummaryCards.vue'
  import OwnerRecentActivity from '@/components/dumb/owner/OwnerRecentActivity.vue'
  import OwnerUpcomingBookings from '@/components/dumb/owner/OwnerUpcomingBookings.vue'
  import OwnerUrgentTurnsBanner from '@/components/dumb/owner/OwnerUrgentTurnsBanner.vue'
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { calculateBookingPriority } from '@/utils/businessLogic'

  defineOptions({ name: 'OwnerOverview' })

  // ── Data sources ────────────────────────────────────────────────
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const {
    myBookings,
    myBookingStats: bookingStats,
    myTodayTurns,
    myUpcomingCleanings,
    fetchMyBookings,
  } = useOwnerBookings()

  const loading = ref(false)

  // Property map for O(1) lookups
  const propertyMap = computed(() => {
    const map = new Map<string, Property>()
    for (const p of myProperties.value) map.set(p.id, p)
    return map
  })

  function getProperty (propertyId: string): Property | undefined {
    return propertyMap.value.get(propertyId)
  }

  onMounted(async () => {
    if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
      loading.value = true
      try {
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
      } catch (error: unknown) {
        console.error('Failed to load overview data:', error)
        uiStore.addNotification('error', 'Error', 'Failed to load dashboard data. Please refresh.')
      } finally {
        loading.value = false
      }
    }
  })

  // ── User name ───────────────────────────────────────────────────
  const userName = computed(() => {
    return authStore.user?.name
      || authStore.user?.email?.split('@')[0]
      || 'Owner'
  })

  // ── Active bookings count (non-completed, non-cancelled) ───────
  const activeBookingCount = computed(() => {
    return myBookings.value.filter(
      b => b.status !== 'completed' && b.status !== 'cancelled',
    ).length
  })

  // ── Urgent turns ────────────────────────────────────────────────
  const urgentTurns = computed(() => {
    return myTodayTurns.value.map(turn => {
      const property = getProperty(turn.property_id)
      return {
        property: property ? formatPropertyAddress(property, 'short') : 'Unknown property',
        time: turn.checkout_time || '11:00',
        priority: calculateBookingPriority(turn),
      }
    })
  })

  // ── Property summaries ──────────────────────────────────────────
  const propertySummaries = computed(() => {
    return myProperties.value.map((property: Property) => {
      const propertyBookings = myBookings.value.filter(b => b.property_id === property.id)
      const now = new Date()

      // Next upcoming booking for this property
      const nextBooking = propertyBookings
        .filter(b => new Date(b.checkin_date) > now && b.status !== 'cancelled')
        .toSorted((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime())[0]

      // Simple occupancy: booked days in last 30 days / 30
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const bookedDays = new Set<string>()
      for (const booking of propertyBookings) {
        if (booking.status === 'cancelled') continue
        const start = new Date(booking.checkin_date)
        const end = new Date(booking.checkout_date)
        const current = new Date(Math.max(start.getTime(), thirtyDaysAgo.getTime()))
        while (current <= end && current <= now) {
          bookedDays.add(current.toISOString().split('T')[0])
          current.setDate(current.getDate() + 1)
        }
      }
      const occupancyRate = Math.min(Math.round((bookedDays.size / 30) * 100), 100)

      return {
        name: formatPropertyAddress(property, 'short'),
        color: property.color,
        nextBooking: nextBooking ? nextBooking.checkin_date : null,
        occupancyRate,
      }
    })
  })

  // ── Upcoming bookings list ──────────────────────────────────────
  const upcomingBookingsList = computed(() => {
    const now = new Date()
    return myBookings.value
      .filter(b => new Date(b.checkin_date) >= now && b.status !== 'cancelled')
      .toSorted((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime())
      .slice(0, 8)
      .map((booking: Booking) => {
        const property = getProperty(booking.property_id)
        return {
          property: property ? formatPropertyAddress(property, 'short') : 'Unknown property',
          propertyColor: property?.color || '#5c6bc0',
          checkinDate: booking.checkin_date,
          checkoutDate: booking.checkout_date,
          type: booking.booking_type,
          status: booking.status,
        }
      })
  })

  // ── Current month for mini calendar ─────────────────────────────
  const currentMonth = new Date()

  // ── Booking dates for mini calendar ─────────────────────────────
  const bookingDates = computed(() => {
    const dates: Array<{ date: string, color: string, type: string }> = []
    for (const booking of myBookings.value) {
      if (booking.status === 'cancelled') continue
      const property = getProperty(booking.property_id)
      const color = property?.color || '#5c6bc0'
      const start = new Date(booking.checkin_date)
      const end = new Date(booking.checkout_date)
      const current = new Date(start)
      while (current <= end) {
        dates.push({
          date: current.toISOString().split('T')[0],
          color,
          type: booking.booking_type,
        })
        current.setDate(current.getDate() + 1)
      }
    }
    return dates
  })

  // ── Recent activity ─────────────────────────────────────────────
  const recentActivities = computed(() => {
    const activities: Array<{
      type: 'created' | 'modified' | 'cancelled'
      description: string
      timestamp: string
      property: string
    }> = []

    // Build activity list from bookings with timestamps
    for (const booking of myBookings.value) {
      const property = getProperty(booking.property_id)
      const propertyName = property ? formatPropertyAddress(property, 'short') : 'Unknown property'

      if (booking.status === 'cancelled' && booking.updated_at) {
        activities.push({
          type: 'cancelled',
          description: `Booking cancelled at ${propertyName}`,
          timestamp: booking.updated_at,
          property: propertyName,
        })
      } else if (booking.updated_at && booking.created_at && booking.updated_at !== booking.created_at) {
        activities.push({
          type: 'modified',
          description: `Booking updated at ${propertyName}`,
          timestamp: booking.updated_at,
          property: propertyName,
        })
      } else if (booking.created_at) {
        activities.push({
          type: 'created',
          description: `New booking at ${propertyName}`,
          timestamp: booking.created_at,
          property: propertyName,
        })
      }
    }

    // Sort by timestamp descending, take most recent 10
    return activities
      .toSorted((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  })

  // ── Cleaning status list ────────────────────────────────────────
  const cleaningStatusList = computed(() => {
    return myUpcomingCleanings.value.map((booking: Booking) => {
      const property = getProperty(booking.property_id)
      return {
        property: property ? formatPropertyAddress(property, 'short') : 'Unknown property',
        propertyColor: property?.color || '#5c6bc0',
        nextDate: booking.checkout_date,
        cleanerName: booking.assigned_cleaner_id ? 'Assigned' : 'Unassigned',
        status: booking.status,
      }
    })
  })
</script>

<style scoped>
.owner-overview {
  max-width: 1400px;
}
</style>
