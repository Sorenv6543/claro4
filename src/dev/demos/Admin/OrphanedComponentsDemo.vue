<template>
  <v-container fluid>
    <h1 class="text-h4 mb-2">
      Orphaned Admin Components
    </h1>
    <p class="text-body-1 text-medium-emphasis mb-6">
      These dumb components exist in <code>src/components/dumb/admin/</code> but aren't wired
      into any smart component yet. This demo shows what they look like and what props they expect,
      so you can decide where to integrate them.
    </p>

    <!-- 1. AdminCalendarControls -->
    <v-card class="mb-6">
      <v-card-title class="bg-primary text-white">
        1. AdminCalendarControls
      </v-card-title>
      <v-card-subtitle class="pt-2">
        <code>src/components/dumb/admin/AdminCalendarControls.vue</code>
        — Calendar view switching, date navigation, filters, bulk operations.
        Likely intended for <strong>AdminCalendar.vue</strong>.
      </v-card-subtitle>
      <v-card-text>
        <AdminCalendarControls
          current-view="dayGridMonth"
          :current-date="today"
          :selected-bookings="mockSelectedBookings"
          :cleaners="mockCleaners"
          :property-owners="mockPropertyOwners"
          @view-change="log('view-change', $event)"
          @date-change="log('date-change', $event)"
          @navigate="log('navigate', $event)"
          @filter-change="log('filter-change', $event)"
          @refresh="log('refresh')"
          @export="log('export', $event)"
          @print="log('print')"
          @bulk-assign="log('bulk-assign')"
          @bulk-status-update="log('bulk-status-update')"
          @bulk-delete="log('bulk-delete')"
          @real-time-toggle="log('real-time-toggle', $event)"
        />
      </v-card-text>
    </v-card>

    <!-- 2. BookingDetailsModal -->
    <v-card class="mb-6">
      <v-card-title class="bg-primary text-white">
        2. BookingDetailsModal
      </v-card-title>
      <v-card-subtitle class="pt-2">
        <code>src/components/dumb/admin/BookingDetailsModal.vue</code>
        — Read-only booking detail view in a dialog.
        Likely intended for <strong>AdminBookings.vue</strong> or <strong>AdminCalendar.vue</strong>.
      </v-card-subtitle>
      <v-card-text>
        <v-btn
          color="primary"
          @click="showBookingModal = true"
        >
          Open BookingDetailsModal
        </v-btn>
        <BookingDetailsModal
          v-model="showBookingModal"
          :booking="mockBooking"
          :property="mockProperty"
          :cleaner="null"
          @close="showBookingModal = false"
        />
      </v-card-text>
    </v-card>

    <!-- 3. TurnPriorityPanel -->
    <v-card class="mb-6">
      <v-card-title class="bg-primary text-white">
        3. TurnPriorityPanel
      </v-card-title>
      <v-card-subtitle class="pt-2">
        <code>src/components/dumb/admin/TurnPriorityPanel.vue</code>
        — Urgent turn queue with urgency levels, bulk assign, escalation.
        Likely intended for <strong>AdminCalendar.vue</strong> or the admin dashboard.
      </v-card-subtitle>
      <v-card-text>
        <TurnPriorityPanel
          :turns="mockTurns"
          :properties="mockProperties"
          :cleaners="mockCleaners"
          :property-owners="mockPropertyOwners"
          @assign-cleaner="log('assign-cleaner', $event)"
          @view-details="log('view-details', $event)"
          @escalate="log('escalate', $event)"
          @bulk-assign="log('bulk-assign', $event)"
          @escalate-all="log('escalate-all', $event)"
          @refresh="log('refresh')"
        />
      </v-card-text>
    </v-card>

    <!-- 4. PerformanceMetricsDashboard -->
    <v-card class="mb-6">
      <v-card-title class="bg-primary text-white">
        4. PerformanceMetricsDashboard
      </v-card-title>
      <v-card-subtitle class="pt-2">
        <code>src/components/dumb/admin/PerformanceMetricsDashboard.vue</code>
        — System performance monitoring (subscriptions, memory, bundle load).
        Uses <code>usePerformanceMonitor</code> composable internally.
        Could live in <strong>AdminReports.vue</strong> or a dedicated admin settings/debug page.
      </v-card-subtitle>
      <v-card-text>
        <PerformanceMetricsDashboard />
      </v-card-text>
    </v-card>

    <!-- Event Log -->
    <v-card>
      <v-card-title>Event Log</v-card-title>
      <v-card-text>
        <div
          v-if="eventLog.length === 0"
          class="text-medium-emphasis"
        >
          Interact with the components above to see emitted events here.
        </div>
        <div
          v-for="(entry, i) in eventLog"
          :key="i"
          class="text-body-2 font-weight-mono"
        >
          <span class="text-primary">{{ entry.event }}</span>
          <span v-if="entry.payload"> → {{ JSON.stringify(entry.payload) }}</span>
        </div>
      </v-card-text>
      <v-card-actions v-if="eventLog.length > 0">
        <v-btn
          size="small"
          @click="eventLog = []"
        >
          Clear
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminCalendarControls from '@/components/dumb/admin/AdminCalendarControls.vue'
import BookingDetailsModal from '@/components/dumb/admin/BookingDetailsModal.vue'
import TurnPriorityPanel from '@/components/dumb/admin/TurnPriorityPanel.vue'
import PerformanceMetricsDashboard from '@/components/dumb/admin/PerformanceMetricsDashboard.vue'
import type { Booking } from '@/types/booking'
import type { Property } from '@/types/property'
import type { Cleaner } from '@/types/user'

const today = new Date().toISOString().slice(0, 10)
const showBookingModal = ref(false)
const eventLog = ref<Array<{ event: string; payload?: unknown }>>([])

const log = (event: string, payload?: unknown) => {
  eventLog.value.unshift({ event, payload })
  if (eventLog.value.length > 50) eventLog.value.pop()
}

// Mock data
const mockSelectedBookings = ['b1', 'b2']

const mockCleaners: Cleaner[] = [
  { id: 'c1', name: 'Maria Santos', email: 'maria@example.com', role: 'cleaner', skills: ['Standard Cleaning', 'Deep Cleaning'], max_daily_bookings: 4 },
  { id: 'c2', name: 'James Wilson', email: 'james@example.com', role: 'cleaner', skills: ['Standard Cleaning'], max_daily_bookings: 3 },
] as Cleaner[]

const mockPropertyOwners = [
  { id: 'o1', name: 'Alice Johnson' },
  { id: 'o2', name: 'Bob Smith' },
]

const mockProperty: Property = {
  id: 'p1',
  owner_id: 'o1',
  name: 'Sunset Villa',
  address: '123 Beach Rd',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1800,
  cleaning_duration: 120,
  pricing_tier: 'premium',
  active: true,
} as Property

const mockProperties: Property[] = [
  mockProperty,
  { ...mockProperty, id: 'p2', name: 'Mountain Retreat', address: '456 Hill St', owner_id: 'o2' },
]

const now = new Date()
const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString()
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

const mockBooking: Booking = {
  id: 'b1',
  property_id: 'p1',
  owner_id: 'o1',
  checkout_date: today,
  checkin_date: tomorrow.slice(0, 10),
  booking_type: 'turn',
  status: 'pending',
  guest_count: 4,
  notes: 'Early checkout requested',
  assigned_cleaner_id: null,
  priority: 'high',
} as Booking

const mockTurns: Booking[] = [
  { ...mockBooking, id: 't1', checkout_date: twoHoursFromNow, checkin_date: fiveHoursFromNow },
  { ...mockBooking, id: 't2', checkout_date: fiveHoursFromNow, checkin_date: tomorrow, property_id: 'p2', assigned_cleaner_id: 'c1', priority: 'normal' },
  { ...mockBooking, id: 't3', checkout_date: tomorrow, checkin_date: tomorrow, property_id: 'p1', priority: 'low' },
] as Booking[]
</script>
