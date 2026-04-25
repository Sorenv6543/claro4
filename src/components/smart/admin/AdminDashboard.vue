<script setup lang="ts">
  import type { CleanerAvailabilityItem } from '@/components/dumb/admin/AdminOverviewCleanerAvailability.vue'
  import type { AssignableCleaner, AssignableTeam } from '@/components/dumb/shared/AssignmentMenu.vue'
  import type { Booking } from '@/types/booking'
  import type { Property } from '@/types/property'
  import type { CleanerTeam } from '@/types/team'
  import { computed, onMounted, ref } from 'vue'
  import { mapLegacyPropertyColor } from '@/utils/constants'
  import AdminAllClearCard from '@/components/dumb/admin/AdminAllClearCard.vue'
  import AdminMetricsStrip from '@/components/dumb/admin/AdminMetricsStrip.vue'
  import AdminOverviewCleanerAvailability from '@/components/dumb/admin/AdminOverviewCleanerAvailability.vue'
  import AdminOverviewUrgentTurns from '@/components/dumb/admin/AdminOverviewUrgentTurns.vue'
  import AdminTimelineCard from '@/components/dumb/admin/AdminTimelineCard.vue'
  import AdminTimelineDivider from '@/components/dumb/admin/AdminTimelineDivider.vue'
  import AdminTomorrowPreview from '@/components/dumb/admin/AdminTomorrowPreview.vue'
  import AdminUnassignedCard from '@/components/dumb/admin/AdminUnassignedCard.vue'
  import AssignmentMenu from '@/components/dumb/shared/AssignmentMenu.vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
  import { useTimeAwareMode } from '@/composables/admin/useTimeAwareMode'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'

  const {
    allProperties,
    todayBookingsByTime,
    tomorrowBookings,
    unassignedToday,
    unassignedTomorrow,
    urgentTurnsToday,
    fetchAllBookings,
    assignCleanerToBooking,
    assignTeamToBooking,
    assignGroupToBooking,
    error,
  } = useAdminBookings()

  const uiStore = useUIStore()

  const { allCleaners, availableCleaners, cleanerWorkloads, allTeams, fetchCleaners, fetchTeams, error: cleanerError } = useCleanerManagement()
  const { fetchAllProperties, error: propertyError } = useAdminProperties()
  const { isEveningMode, modeLabel } = useTimeAwareMode()

  // Assignment menu state
  const assignMenuOpen = ref(false)
  const assigningBooking = ref<Booking | null>(null)

  const dashboardLoading = ref(true)
  const dashboardError = ref<string | null>(null)

  // Property map for quick lookup
  const propertyMap = computed(() => {
    const map = new Map<string, { id: string, name: string, color: string }>()
    for (const p of allProperties.value as Property[]) {
      map.set(p.id, {
        id: p.id,
        name: formatPropertyAddress(p, 'short'),
        color: mapLegacyPropertyColor(p.color),
      })
    }
    return map
  })

  // Cleaner map for quick lookup
  const cleanerMap = computed(() => {
    const map = new Map<string, { id: string, name: string }>()
    for (const c of allCleaners.value) {
      map.set(c.id, { id: c.id, name: c.name })
    }
    return map
  })

  // Active timeline bookings (excludes completed, which get collapsed)
  const activeTimelineBookings = computed(() => {
    const bookings = isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value
    return bookings.filter((b: Booking) => b.status !== 'completed')
  })

  const completedCount = computed(() => {
    const bookings = isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value
    return bookings.filter((b: Booking) => b.status === 'completed').length
  })

  // Group timeline bookings by time of day
  const timelineGroups = computed(() => {
    const groups: Array<{ label: string, bookings: Booking[] }> = [
      { label: 'Morning', bookings: [] },
      { label: 'Afternoon', bookings: [] },
      { label: 'Evening', bookings: [] },
    ]
    for (const booking of activeTimelineBookings.value) {
      const time = booking.checkout_time || booking.checkin_time || '12:00'
      const hour = Number.parseInt(time.split(':')[0], 10)
      if (hour < 12) groups[0].bookings.push(booking)
      else if (hour < 17) groups[1].bookings.push(booking)
      else groups[2].bookings.push(booking)
    }
    return groups.filter(g => g.bookings.length > 0)
  })

  // Metrics
  const currentBookings = computed(() =>
    isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value,
  )
  const currentUnassigned = computed(() =>
    isEveningMode.value ? unassignedTomorrow.value : unassignedToday.value,
  )
  const currentTurns = computed(() =>
    currentBookings.value.filter((b: Booking) => b.booking_type === 'turn'),
  )

  // Cleaner availability for the action panel
  const cleanerAvailabilityItems = computed<CleanerAvailabilityItem[]>(() => {
    const items: CleanerAvailabilityItem[] = cleanerWorkloads.value.map((w: { cleanerId: string, name: string, currentBookings: number, maxBookings: number }) => ({
      id: w.cleanerId,
      name: w.name,
      assigned: w.currentBookings,
      total: w.maxBookings,
      isTeam: false,
      todayBookings: todayBookingsByTime.value
        .filter((b: Booking) => b.assigned_cleaner_id === w.cleanerId)
        .map((b: Booking) => ({
          id: b.id,
          propertyName: propertyMap.value.get(b.property_id)?.name || 'Unknown',
          time: (b.checkout_time || '').substring(0, 5),
        })),
    }))

    // Add teams
    for (const team of allTeams.value) {
      items.push({
        id: team.id,
        name: team.name,
        assigned: todayBookingsByTime.value.filter((b: Booking) => b.assigned_team_id === team.id).length,
        total: team.member_ids.length,
        isTeam: true,
      })
    }

    return items
  })

  // Assignment menu data
  const assignableCleaners = computed<AssignableCleaner[]>(() =>
    cleanerWorkloads.value.map((w: { cleanerId: string, name: string, currentBookings: number, maxBookings: number }) => ({
      id: w.cleanerId,
      name: w.name,
      assigned: w.currentBookings,
      total: w.maxBookings,
    })),
  )

  const assignableTeams = computed<AssignableTeam[]>(() =>
    allTeams.value.map((t: CleanerTeam) => ({
      id: t.id,
      name: t.name,
      member_ids: t.member_ids,
      assigned: todayBookingsByTime.value.filter((b: Booking) => b.assigned_team_id === t.id).length,
      total: t.member_ids.length,
    })),
  )

  // Whether action panel has problems to show
  const hasProblems = computed(() =>
    isEveningMode.value
      ? unassignedTomorrow.value.length > 0
      : unassignedToday.value.length > 0 || urgentTurnsToday.value.length > 0,
  )

  // Tomorrow preview stats
  const tomorrowTurnCount = computed(() =>
    tomorrowBookings.value.filter((b: Booking) => b.booking_type === 'turn').length,
  )

  // Handlers
  function handleAssign (booking: Booking) {
    assigningBooking.value = booking
    assignMenuOpen.value = true
  }

  async function handleAssignCleaner (cleanerId: string) {
    if (!assigningBooking.value) return
    const ok = await assignCleanerToBooking(assigningBooking.value.id, cleanerId)
    if (ok) {
      uiStore.addNotification('success', 'Assigned', 'Cleaner assigned successfully')
      assignMenuOpen.value = false
      assigningBooking.value = null
    } else {
      uiStore.addNotification('error', 'Assignment Failed', error.value || 'Could not assign cleaner')
    }
  }

  async function handleAssignTeam (teamId: string) {
    if (!assigningBooking.value) return
    const ok = await assignTeamToBooking(assigningBooking.value.id, teamId)
    if (ok) {
      uiStore.addNotification('success', 'Assigned', 'Team assigned successfully')
      assignMenuOpen.value = false
      assigningBooking.value = null
    } else {
      uiStore.addNotification('error', 'Assignment Failed', error.value || 'Could not assign team')
    }
  }

  async function handleAssignGroup (cleanerIds: string[]) {
    if (!assigningBooking.value) return
    const ok = await assignGroupToBooking(assigningBooking.value.id, cleanerIds)
    if (ok) {
      uiStore.addNotification('success', 'Assigned', 'Group assigned successfully')
      assignMenuOpen.value = false
      assigningBooking.value = null
    } else {
      uiStore.addNotification('error', 'Assignment Failed', error.value || 'Could not assign group')
    }
  }

  const emit = defineEmits<{
    'view-booking': [booking: Booking]
    'status-change': [booking: Booking]
  }>()

  function getCleaner (booking: Booking) {
    if (booking.assigned_cleaner_id) return cleanerMap.value.get(booking.assigned_cleaner_id) || null
    return null
  }

  function getTeamName (booking: Booking): string | null {
    if (booking.assigned_team_id) {
      const team = allTeams.value.find((t: CleanerTeam) => t.id === booking.assigned_team_id)
      return team ? `${team.name} (${team.member_ids.length})` : null
    }
    return null
  }

  function getGroupNames (booking: Booking): string[] | null {
    if (booking.assigned_group_ids?.length) {
      return booking.assigned_group_ids
        .map(id => cleanerMap.value.get(id)?.name || 'Unknown')
    }
    return null
  }

  onMounted(async () => {
    dashboardLoading.value = true
    dashboardError.value = null
    try {
      const [bookingsOk, propertiesOk, cleanersOk, teamsOk] = await Promise.all([
        fetchAllBookings(),
        fetchAllProperties(),
        fetchCleaners(),
        fetchTeams(),
      ])

      if (!bookingsOk || !propertiesOk || !cleanersOk || !teamsOk) {
        const messages: string[] = []

        if (!bookingsOk) messages.push(error.value || 'Failed to load bookings')
        if (!propertiesOk) messages.push(propertyError.value || 'Failed to load properties')
        if (!cleanersOk) messages.push(cleanerError.value || 'Failed to load cleaners')
        if (!teamsOk) messages.push(cleanerError.value || 'Failed to load teams')

        dashboardError.value = messages.join(' | ')
      }
    } catch (error_) {
      dashboardError.value = error_ instanceof Error ? error_.message : 'Failed to load dashboard data'

      console.error('[AdminDashboard] fetch error:', error_)
    } finally {
      dashboardLoading.value = false
    }
  })
</script>

<template>
  <v-container class="pa-4" fluid>
    <v-progress-linear v-if="dashboardLoading" class="mb-4" color="primary" indeterminate />
    <v-alert
      v-if="dashboardError"
      class="mb-4"
      closable
      type="error"
      variant="tonal"
      @click:close="dashboardError = null"
    >
      {{ dashboardError }}
    </v-alert>

    <!-- Metrics Strip -->
    <AdminMetricsStrip
      :active-cleaners="availableCleaners.length"
      :label="isEveningMode ? 'tomorrow' : 'today'"
      :total-cleanings="currentBookings.length"
      :turn-count="currentTurns.length"
      :unassigned-count="currentUnassigned.length"
    />

    <!-- Mode heading -->
    <div class="text-h6 font-weight-bold mb-3">
      {{ modeLabel }}
    </div>

    <!-- Split Layout -->
    <v-row align="start">
      <!-- LEFT: Timeline -->
      <v-col class="order-2 order-md-1" cols="12" md="7">
        <template v-if="activeTimelineBookings.length > 0">
          <template v-for="group in timelineGroups" :key="group.label">
            <AdminTimelineDivider :label="group.label" />
            <AdminTimelineCard
              v-for="booking in group.bookings"
              :key="booking.id"
              :booking="booking"
              :cleaner="getCleaner(booking)"
              :group-names="getGroupNames(booking)"
              :property="propertyMap.get(booking.property_id) || null"
              :team-name="getTeamName(booking)"
              @assign="handleAssign"
              @status-change="emit('status-change', $event)"
              @view="emit('view-booking', $event)"
            />
          </template>
        </template>

        <v-card v-else class="text-center pa-8 text-medium-emphasis" variant="outlined">
          <v-icon class="mb-2" icon="mdi-calendar-check" size="48" />
          <div>No bookings {{ isEveningMode ? 'tomorrow' : 'today' }}</div>
        </v-card>

        <!-- Completed collapse -->
        <div v-if="completedCount > 0" class="rounded-lg pa-2 mt-2 text-caption text-medium-emphasis" style="background: rgb(var(--v-theme-surface-variant), 0.3);">
          <v-icon class="mr-1" color="success" icon="mdi-check" size="14" />
          {{ completedCount }} completed cleaning{{ completedCount !== 1 ? 's' : '' }} earlier today
        </div>
      </v-col>

      <!-- RIGHT: Action Panel -->
      <v-col class="order-1 order-md-2" cols="12" md="5">
        <!-- Unassigned Card -->
        <AdminUnassignedCard
          v-if="unassignedToday.length > 0"
          :bookings="unassignedToday"
          :property-map="propertyMap"
          @assign="handleAssign"
        />

        <!-- Urgent Turns Card -->
        <AdminOverviewUrgentTurns
          v-if="urgentTurnsToday.length > 0"
          :cleaner-map="cleanerMap"
          :property-map="propertyMap"
          :turns="urgentTurnsToday"
          @assign="handleAssign"
        />

        <!-- All Clear -->
        <AdminAllClearCard v-if="!hasProblems" />

        <!-- Cleaner Availability -->
        <AdminOverviewCleanerAvailability :cleaners="cleanerAvailabilityItems" />

        <!-- Tomorrow Preview -->
        <AdminTomorrowPreview
          :is-evening-mode="isEveningMode"
          :property-map="isEveningMode ? propertyMap : undefined"
          :total-bookings="tomorrowBookings.length"
          :turn-count="tomorrowTurnCount"
          :unassigned-bookings="isEveningMode ? unassignedTomorrow : undefined"
          :unassigned-count="unassignedTomorrow.length"
          @assign="handleAssign"
        />
      </v-col>
    </v-row>

    <!-- Assignment Dialog -->
    <v-dialog v-model="assignMenuOpen" max-width="360">
      <AssignmentMenu
        :cleaners="assignableCleaners"
        :teams="assignableTeams"
        @assign-cleaner="handleAssignCleaner"
        @assign-group="handleAssignGroup"
        @assign-team="handleAssignTeam"
      />
    </v-dialog>
  </v-container>
</template>
