<script setup lang="ts">
  import type { Booking } from '@/types/booking'

  const props = defineProps<{
    totalBookings: number
    turnCount: number
    unassignedCount: number
    isEveningMode: boolean
    unassignedBookings?: Booking[]
    propertyMap?: Map<string, { id: string, name: string, color: string }>
  }>()

  const emit = defineEmits<{
    assign: [booking: Booking]
  }>()

  function formatTime (booking: Booking): string {
    return (booking.checkout_time || booking.checkin_time || '').substring(0, 5)
  }
</script>

<template>
  <v-card
    :border="isEveningMode ? 'info' : undefined"
    class="mb-3"
    :style="isEveningMode ? {} : { opacity: 0.7 }"
  >
    <v-card-text>
      <div class="text-subtitle-2 font-weight-bold mb-2" :class="isEveningMode ? 'text-info' : 'text-medium-emphasis'">
        <v-icon class="mr-1" icon="mdi-calendar-arrow-right" size="18" />
        Tomorrow Preview
      </div>

      <div class="text-body-2" :class="isEveningMode ? '' : 'text-medium-emphasis'">
        {{ totalBookings }} cleanings · {{ turnCount }} turns ·
        <span v-if="unassignedCount === 0" class="text-success">All assigned ✓</span>
        <span v-else class="text-error">{{ unassignedCount }} unassigned</span>
      </div>

      <template v-if="isEveningMode && unassignedBookings?.length">
        <v-divider class="my-2" />

        <div
          v-for="booking in unassignedBookings"
          :key="booking.id"
          class="d-flex align-center justify-space-between rounded-sm pa-2 mb-1"
          style="background: rgb(var(--v-theme-surface-variant), 0.3);"
        >
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ props.propertyMap?.get(booking.property_id)?.name || 'Unknown' }}
            </div>

            <div class="text-caption text-medium-emphasis">
              {{ formatTime(booking) }} · {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
            </div>
          </div>

          <v-btn
            append-icon="mdi-chevron-down"
            color="primary"
            size="small"
            variant="tonal"
            @click="emit('assign', booking)"
          >
            Assign
          </v-btn>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
