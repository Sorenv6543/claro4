<script setup lang="ts">
  import type { Booking } from '@/types/booking'

  const props = defineProps<{
    bookings: Booking[]
    propertyMap: Map<string, { id: string, name: string, color: string }>
  }>()

  const emit = defineEmits<{
    assign: [booking: Booking]
  }>()

  function formatTime (booking: Booking): string {
    const time = booking.checkout_time || booking.checkin_time || ''
    return time.substring(0, 5)
  }
</script>

<template>
  <v-card border="error" class="mb-3" rounded="lg" variant="outlined">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-2 font-weight-bold text-error">
          <v-icon class="mr-1" icon="mdi-alert-circle" size="18" />
          Unassigned
        </span>
        <v-badge color="error" :content="bookings.length" inline />
      </div>

      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="d-flex align-center justify-space-between rounded-lg pa-2 mb-1"
        style="background: rgb(var(--v-theme-surface-variant), 0.3);"
      >
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ props.propertyMap.get(booking.property_id)?.name || 'Unknown' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatTime(booking) }} · {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
          </div>
        </div>
        <v-btn
          append-icon="mdi-chevron-down"
          color="primary"
          size="small"
          variant="flat"
          @click="emit('assign', booking)"
        >
          Assign
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
