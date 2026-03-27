<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Booking } from '@/types/booking'
import type { Property } from '@/types/property'
import type { CleanerTeam } from '@/types/team'
import { useAdminBookings } from '@/composables/admin/useAdminBookings'
import { useAdminProperties } from '@/composables/admin/useAdminProperties'
import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
import { useTimeAwareMode } from '@/composables/admin/useTimeAwareMode'
import { formatPropertyAddress } from '@/types/property'
import AdminMetricsStrip from '@/components/dumb/admin/AdminMetricsStrip.vue'
import AdminTimelineCard from '@/components/dumb/admin/AdminTimelineCard.vue'
import AdminTimelineDivider from '@/components/dumb/admin/AdminTimelineDivider.vue'
import AdminAllClearCard from '@/components/dumb/admin/AdminAllClearCard.vue'
import AdminUnassignedCard from '@/components/dumb/admin/AdminUnassignedCard.vue'
import AdminOverviewUrgentTurns from '@/components/dumb/admin/AdminOverviewUrgentTurns.vue'
import AdminOverviewCleanerAvailability from '@/components/dumb/admin/AdminOverviewCleanerAvailability.vue'
import AdminTomorrowPreview from '@/components/dumb/admin/AdminTomorrowPreview.vue'
import AssignmentMenu from '@/components/dumb/shared/AssignmentMenu.vue'
import type { CleanerAvailabilityItem } from '@/components/dumb/admin/AdminOverviewCleanerAvailability.vue'
import type { AssignableCleaner, AssignableTeam } from '@/components/dumb/shared/AssignmentMenu.vue'

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
} = useAdminBookings()

const { allCleaners, availableCleaners, cleanerWorkloads, allTeams, fetchCleaners, fetchTeams } = useCleanerManagement()
const { fetchAllProperties } = useAdminProperties()
const { isEveningMode, modeLabel } = useTimeAwareMode()

// Assignment menu state
const assignMenuOpen = ref(false)
const assigningBooking = ref<Booking | null>(null)

// Property map for quick lookup
const propertyMap = computed(() => {
  const map = new Map<string, { id: string; name: string; color: string }>()
  for (const p of allProperties.value as Property[]) {
    map.set(p.id, {
      id: p.id,
      name: formatPropertyAddress(p, 'short'),
      color: p.color || '#5c6bc0',
    })
  }
  return map
})

// Cleaner map for quick lookup
const cleanerMap = computed(() => {
  const map = new Map<string, { id: string; name: string }>()
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
  const groups: Array<{ label: string; bookings: Booking[] }> = [
    { label: 'Morning', bookings: [] },
    { label: 'Afternoon', bookings: [] },
    { label: 'Evening', bookings: [] },
  ]
  for (const booking of activeTimelineBookings.value) {
    const time = booking.checkout_time || booking.checkin_time || '12:00'
    const hour = parseInt(time.split(':')[0], 10)
    if (hour < 12) groups[0].bookings.push(booking)
    else if (hour < 17) groups[1].bookings.push(booking)
    else groups[2].bookings.push(booking)
  }
  return groups.filter(g => g.bookings.length > 0)
})

// Metrics
const currentBookings = computed(() =>
  isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value
)
const currentUnassigned = computed(() =>
  isEveningMode.value ? unassignedTomorrow.value : unassignedToday.value
)
const currentTurns = computed(() =>
  currentBookings.value.filter((b: Booking) => b.booking_type === 'turn')
)

// Cleaner availability for the action panel
const cleanerAvailabilityItems = computed<CleanerAvailabilityItem[]>(() => {
  const items: CleanerAvailabilityItem[] = cleanerWorkloads.value.map((w: { cleanerId: string; name: string; currentBookings: number; maxBookings: number }) => ({
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
  cleanerWorkloads.value.map((w: { cleanerId: string; name: string; currentBookings: number; maxBookings: number }) => ({
    id: w.cleanerId,
    name: w.name,
    assigned: w.currentBookings,
    total: w.maxBookings,
  }))
)

const assignableTeams = computed<AssignableTeam[]>(() =>
  allTeams.value.map((t: CleanerTeam) => ({
    id: t.id,
    name: t.name,
    member_ids: t.member_ids,
    assigned: todayBookingsByTime.value.filter((b: Booking) => b.assigned_team_id === t.id).length,
    total: t.member_ids.length,
  }))
)

// Whether action panel has problems to show
const hasProblems = computed(() =>
  unassignedToday.value.length > 0 || urgentTurnsToday.value.length > 0
)

// Tomorrow preview stats
const tomorrowTurnCount = computed(() =>
  tomorrowBookings.value.filter((b: Booking) => b.booking_type === 'turn').length
)

// Handlers
function handleAssign(booking: Booking) {
  assigningBooking.value = booking
  assignMenuOpen.value = true
}

async function handleAssignCleaner(cleanerId: string) {
  if (!assigningBooking.value) return
  await assignCleanerToBooking(assigningBooking.value.id, cleanerId)
  assignMenuOpen.value = false
  assigningBooking.value = null
}

async function handleAssignTeam(teamId: string) {
  if (!assigningBooking.value) return
  await assignTeamToBooking(assigningBooking.value.id, teamId)
  assignMenuOpen.value = false
  assigningBooking.value = null
}

async function handleAssignGroup(cleanerIds: string[]) {
  if (!assigningBooking.value) return
  await assignGroupToBooking(assigningBooking.value.id, cleanerIds)
  assignMenuOpen.value = false
  assigningBooking.value = null
}

const emit = defineEmits<{
  viewBooking: [booking: Booking]
  statusChange: [booking: Booking]
}>()

function getCleaner(booking: Booking) {
  if (booking.assigned_cleaner_id) return cleanerMap.value.get(booking.assigned_cleaner_id) || null
  return null
}

function getTeamName(booking: Booking): string | null {
  if (booking.assigned_team_id) {
    const team = allTeams.value.find((t: CleanerTeam) => t.id === booking.assigned_team_id)
    return team ? `${team.name} (${team.member_ids.length})` : null
  }
  return null
}

function getGroupNames(booking: Booking): string[] | null {
  if (booking.assigned_group_ids?.length) {
    return booking.assigned_group_ids
      .map(id => cleanerMap.value.get(id)?.name || 'Unknown')
  }
  return null
}

onMounted(async () => {
  await Promise.all([fetchAllBookings(), fetchAllProperties(), fetchCleaners(), fetchTeams()])
})
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Metrics Strip -->
    <AdminMetricsStrip
      :total-cleanings="currentBookings.length"
      :unassigned-count="currentUnassigned.length"
      :turn-count="currentTurns.length"
      :active-cleaners="availableCleaners.length"
      :label="isEveningMode ? 'tomorrow' : 'today'"
    />

    <!-- Mode heading -->
    <div class="text-h6 font-weight-bold mb-3">
      {{ modeLabel }}
    </div>

    <!-- Split Layout -->
    <v-row>
      <!-- LEFT: Timeline -->
      <v-col cols="12" md="7" class="order-2 order-md-1">
        <template v-if="activeTimelineBookings.length > 0">
          <template v-for="group in timelineGroups" :key="group.label">
            <AdminTimelineDivider :label="group.label" />
            <AdminTimelineCard
              v-for="booking in group.bookings"
              :key="booking.id"
              :booking="booking"
              :property="propertyMap.get(booking.property_id) || null"
              :cleaner="getCleaner(booking)"
              :team-name="getTeamName(booking)"
              :group-names="getGroupNames(booking)"
              @assign="handleAssign"
              @view="emit('viewBooking', $event)"
              @status-change="emit('statusChange', $event)"
            />
          </template>
        </template>

        <v-card v-else variant="outlined" rounded="lg" class="text-center pa-8 text-medium-emphasis">
          <v-icon icon="mdi-calendar-check" size="48" class="mb-2" />
          <div>No bookings {{ isEveningMode ? 'tomorrow' : 'today' }}</div>
        </v-card>

        <!-- Completed collapse -->
        <div v-if="completedCount > 0" class="rounded-lg pa-2 mt-2 text-caption text-medium-emphasis" style="background: rgb(var(--v-theme-surface-variant), 0.3);">
          <v-icon icon="mdi-check" size="14" color="success" class="mr-1" />
          {{ completedCount }} completed cleaning{{ completedCount !== 1 ? 's' : '' }} earlier today
        </div>
      </v-col>

      <!-- RIGHT: Action Panel -->
      <v-col cols="12" md="5" class="order-1 order-md-2">
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
          :turns="urgentTurnsToday"
          :property-map="propertyMap"
          :cleaner-map="cleanerMap"
          @assign="handleAssign"
        />

        <!-- All Clear -->
        <AdminAllClearCard v-if="!hasProblems" />

        <!-- Cleaner Availability -->
        <AdminOverviewCleanerAvailability :cleaners="cleanerAvailabilityItems" />

        <!-- Tomorrow Preview -->
        <AdminTomorrowPreview
          :total-bookings="tomorrowBookings.length"
          :turn-count="tomorrowTurnCount"
          :unassigned-count="unassignedTomorrow.length"
          :is-evening-mode="isEveningMode"
          :unassigned-bookings="isEveningMode ? unassignedTomorrow : undefined"
          :property-map="isEveningMode ? propertyMap : undefined"
          @assign="handleAssign"
        />
      </v-col>
    </v-row>

    <!-- Assignment Menu (floating) -->
    <v-menu v-model="assignMenuOpen" :close-on-content-click="false" location="bottom end">
      <AssignmentMenu
        :cleaners="assignableCleaners"
        :teams="assignableTeams"
        @assign-cleaner="handleAssignCleaner"
        @assign-team="handleAssignTeam"
        @assign-group="handleAssignGroup"
      />
    </v-menu>
  </v-container>
</template>
