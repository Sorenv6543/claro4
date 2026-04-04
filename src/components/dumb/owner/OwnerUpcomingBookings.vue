<template>
  <DashboardCard icon="mdi-calendar-clock" title="Upcoming Bookings">
    <div v-if="bookings.length === 0" class="text-center text-medium-emphasis py-6">
      <v-icon class="mb-2" size="48">mdi-calendar-blank-outline</v-icon>
      <div class="text-body-2">No upcoming bookings</div>
    </div>

    <v-list v-else class="py-0" density="comfortable">
      <template v-for="(booking, index) in bookings" :key="index">
        <v-divider v-if="index > 0" />
        <v-list-item class="px-4 py-2">
          <template #prepend>
            <div
              class="date-badge d-flex flex-column align-center justify-center mr-3 rounded-lg"
              :style="{ background: `${booking.propertyColor}18` }"
            >
              <div class="text-caption font-weight-bold" :style="{ color: booking.propertyColor }">
                {{ formatMonth(booking.checkinDate) }}
              </div>
              <div class="text-h6 font-weight-bold" :style="{ color: booking.propertyColor }">
                {{ formatDay(booking.checkinDate) }}
              </div>
            </div>
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ booking.property }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ formatDateRange(booking.checkinDate, booking.checkoutDate) }}
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex flex-column align-end ga-1">
              <v-chip
                :color="typeColor(booking.type)"
                size="x-small"
                variant="tonal"
              >
                {{ booking.type }}
              </v-chip>
              <v-chip
                :color="statusColor(booking.status)"
                size="x-small"
                variant="flat"
              >
                {{ formatStatus(booking.status) }}
              </v-chip>
            </div>
          </template>
        </v-list-item>
      </template>
    </v-list>
    <template #actions>
      <v-btn
        block
        color="primary"
        size="small"
        to="/owner/dashboard"
        variant="text"
      >
        <v-icon class="mr-1" size="16">mdi-calendar</v-icon>
        View Calendar
      </v-btn>
    </template>
  </DashboardCard>
</template>

<script setup lang="ts">
  import DashboardCard from '@/components/dumb/shared/DashboardCard.vue'
import type { BookingStatus, BookingType } from '@/types'
import type { PROPERTY_COLORS } from '@/utils/constants'
import { formatStatus, getBookingStatusColor as statusColor } from '@/utils/constants'

  interface UpcomingBooking {
    property: string
    propertyColor: typeof PROPERTY_COLORS[number]
    checkinDate: string
    checkoutDate: string
    type: BookingType
    status: BookingStatus
  }

  defineProps<{
    bookings: UpcomingBooking[]
  }>()

  function formatMonth (dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  }

  function formatDay (dateStr: string): string {
    return new Date(dateStr).getDate().toString()
  }

  function formatDateRange (checkin: string, checkout: string): string {
    const start = new Date(checkin)
    const end = new Date(checkout)
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  function typeColor (type: string): string {
    return type === 'turn' ? 'warning' : 'info'
  }
</script>

<style scoped>
.date-badge {
  width: 48px;
  height: 48px;
  min-width: 48px;
}

:deep(.dashboard-card__content) {
  padding: 0 !important;
}
</style>
