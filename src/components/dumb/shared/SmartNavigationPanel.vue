<template>
  <v-card
    v-if="visible"
    class="smart-navigation-panel"
    elevation="2"
  >
    <v-card-title class="pb-2">
      <v-icon class="mr-2">
        mdi-navigation
      </v-icon>
      Quick Navigation
      <v-spacer />

      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="$emit('close')"
      />
    </v-card-title>

    <v-card-text>
      <!-- Primary Navigation Options -->
      <div class="navigation-section mb-4">
        <span class="text-subtitle-2 mb-3 d-block">Primary:</span>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="option in primaryOptions"
            :key="option.key"
            :color="option.available ? 'primary' : 'default'"
            :disabled="!option.available"
            :prepend-icon="option.icon"
            size="small"
            :variant="option.available ? 'elevated' : 'outlined'"
            @click="handleNavigation(option.key)"
          >
            {{ option.label }}
            <v-badge
              v-if="option.count && option.count > 0"
              class="ml-1"
              color="error"
              :content="option.count"
              inline
            />
          </v-btn>
        </div>
      </div>

      <!-- Time-Based Navigation -->
      <div class="navigation-section mb-4">
        <span class="text-subtitle-2 mb-3 d-block">Time-Based:</span>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="option in timeBasedOptions"
            :key="option.key"
            :prepend-icon="option.icon"
            size="small"
            variant="outlined"
            @click="handleNavigation(option.key)"
          >
            {{ option.label }}
          </v-btn>
        </div>
      </div>

      <!-- Property Owner Navigation (Admin Only) -->
      <div
        v-if="showOwnerNavigation && topOwners.length > 0"
        class="navigation-section mb-4"
      >
        <span class="text-subtitle-2 mb-3 d-block">Top Property Owners:</span>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="owner in topOwners"
            :key="owner.id"
            :prepend-icon="'mdi-account'"
            size="small"
            variant="outlined"
            @click="handleOwnerNavigation(owner.id)"
          >
            {{ owner.name }}
            <v-badge
              v-if="owner.upcomingBookings > 0"
              class="ml-1"
              color="info"
              :content="owner.upcomingBookings"
              inline
            />
          </v-btn>
        </div>
      </div>

      <!-- Status-Based Navigation (Admin Only) -->
      <div
        v-if="showStatusNavigation"
        class="navigation-section"
      >
        <span class="text-subtitle-2 mb-3 d-block">By Status:</span>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="status in statusOptions"
            :key="status.key"
            :color="status.color"
            :disabled="status.count === 0"
            :prepend-icon="status.icon"
            size="small"
            variant="outlined"
            @click="handleStatusNavigation(status.key)"
          >
            {{ status.label }}
            <v-badge
              v-if="status.count > 0"
              class="ml-1"
              :color="status.color"
              :content="status.count"
              inline
            />
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { Booking, User } from '@/types'
  import { computed } from 'vue'

  interface Props {
    visible: boolean
    smartNavigationCounts: {
      nextTurn: number
      nextUrgent: number
      busiest: number
    }
    users?: Map<string, User>
    bookings?: Booking[]
    showOwnerNavigation?: boolean
    showStatusNavigation?: boolean
  }

  interface Emits {
    (e: 'navigate' | 'navigate-to-owner' | 'navigate-to-status', option: string): void
    (e: 'close'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    users: () => new Map<string, User>(),
    bookings: () => [],
    showOwnerNavigation: false,
    showStatusNavigation: false,
  })

  const emit = defineEmits<Emits>()

  // Primary navigation options
  const primaryOptions = computed(() => [
    {
      key: 'today',
      label: 'Today',
      icon: 'mdi-calendar-today',
      available: true,
      count: 0,
    },
    {
      key: 'nextTurn',
      label: 'Next Turn',
      icon: 'mdi-fire',
      available: props.smartNavigationCounts.nextTurn > 0,
      count: props.smartNavigationCounts.nextTurn,
    },
    {
      key: 'nextUrgent',
      label: 'Next Urgent',
      icon: 'mdi-alert',
      available: props.smartNavigationCounts.nextUrgent > 0,
      count: props.smartNavigationCounts.nextUrgent,
    },
    {
      key: 'busiest',
      label: 'Busiest Day',
      icon: 'mdi-calendar-clock',
      available: props.smartNavigationCounts.busiest > 0,
      count: props.smartNavigationCounts.busiest,
    },
  ])

  // Time-based navigation options
  const timeBasedOptions = [
    {
      key: 'thisWeek',
      label: 'This Week',
      icon: 'mdi-calendar-week',
    },
    {
      key: 'nextWeek',
      label: 'Next Week',
      icon: 'mdi-calendar-arrow-right',
    },
    {
      key: 'thisMonth',
      label: 'This Month',
      icon: 'mdi-calendar-month',
    },
    {
      key: 'nextMonth',
      label: 'Next Month',
      icon: 'mdi-calendar-plus',
    },
  ]

  // Top property owners with upcoming bookings
  const topOwners = computed(() => {
    if (!props.showOwnerNavigation) return []

    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Count upcoming bookings per owner
    const ownerBookingCounts = new Map<string, number>()

    for (const booking of props.bookings.filter(booking => {
      const checkoutDate = new Date(booking.checkout_date)
      return checkoutDate >= now
        && checkoutDate <= nextMonth
        && booking.status !== 'completed'
        && booking.status !== 'cancelled'
    })) {
      const count = ownerBookingCounts.get(booking.owner_id) || 0
      ownerBookingCounts.set(booking.owner_id, count + 1)
    }

    // Get top 5 owners by booking count
    return Array.from(ownerBookingCounts.entries())
      .map(([ownerId, bookingCount]) => {
        const user = props.users.get(ownerId)
        return {
          id: ownerId,
          name: user?.name || 'Unknown Owner',
          upcomingBookings: bookingCount,
        }
      })
      .toSorted((a, b) => b.upcomingBookings - a.upcomingBookings)
      .slice(0, 5)
  })

  // Status-based navigation options
  const statusOptions = computed(() => {
    if (!props.showStatusNavigation) return []

    const now = new Date()
    const statusCounts = {
      pending: 0,
      scheduled: 0,
      in_progress: 0,
      unassigned: 0,
    }

    for (const booking of props.bookings.filter(booking => {
      const checkoutDate = new Date(booking.checkout_date)
      return checkoutDate >= now
    })) {
      if (booking.status === 'pending') statusCounts.pending++
      if (booking.status === 'scheduled') statusCounts.scheduled++
      if (booking.status === 'in_progress') statusCounts.in_progress++
      if (!booking.assigned_cleaner_id) statusCounts.unassigned++
    }

    return [
      {
        key: 'pending',
        label: 'Pending',
        icon: 'mdi-clock-outline',
        color: 'warning',
        count: statusCounts.pending,
      },
      {
        key: 'scheduled',
        label: 'Scheduled',
        icon: 'mdi-calendar-check',
        color: 'info',
        count: statusCounts.scheduled,
      },
      {
        key: 'in_progress',
        label: 'In Progress',
        icon: 'mdi-play',
        color: 'primary',
        count: statusCounts.in_progress,
      },
      {
        key: 'unassigned',
        label: 'Unassigned',
        icon: 'mdi-account-off',
        color: 'error',
        count: statusCounts.unassigned,
      },
    ]
  })

  // Event handlers
  function handleNavigation (option: string): void {
    emit('navigate', option)
  }

  function handleOwnerNavigation (ownerId: string): void {
    emit('navigate-to-owner', ownerId)
  }

  function handleStatusNavigation (status: string): void {
    emit('navigate-to-status', status)
  }
</script>
