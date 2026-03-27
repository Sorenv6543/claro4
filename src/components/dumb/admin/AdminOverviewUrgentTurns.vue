<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import type { Booking } from '@/types/booking'

const props = defineProps<{
  turns: Booking[]
  propertyMap: Map<string, { id: string; name: string; color: string }>
  cleanerMap: Map<string, { id: string; name: string }>
}>()

const emit = defineEmits<{
  assign: [booking: Booking]
}>()

const now = ref(new Date())
const interval = setInterval(() => { now.value = new Date() }, 60_000)
onUnmounted(() => clearInterval(interval))

function getTimeRemaining(booking: Booking): string {
  const checkoutTime = booking.checkout_time || '11:00'
  const [hours, minutes] = checkoutTime.split(':').map(Number)
  const checkout = new Date(now.value)
  checkout.setHours(hours, minutes, 0, 0)
  const diffMs = checkout.getTime() - now.value.getTime()
  if (diffMs <= 0) return 'Overdue'
  const h = Math.floor(diffMs / 3_600_000)
  const m = Math.floor((diffMs % 3_600_000) / 60_000)
  return `${h}h ${m}m remaining`
}

function getPriorityColor(booking: Booking): string {
  const checkoutTime = booking.checkout_time || '11:00'
  const [hours, minutes] = checkoutTime.split(':').map(Number)
  const checkout = new Date(now.value)
  checkout.setHours(hours, minutes, 0, 0)
  const hoursUntil = (checkout.getTime() - now.value.getTime()) / 3_600_000
  if (hoursUntil <= 2) return 'error'
  return 'warning'
}

function isUnassigned(booking: Booking): boolean {
  return !booking.assigned_cleaner_id && !booking.assigned_team_id &&
    (!booking.assigned_group_ids || booking.assigned_group_ids.length === 0)
}

function getTimeWindow(booking: Booking): string {
  const out = (booking.checkout_time || '11:00').substring(0, 5)
  const inn = (booking.checkin_time || '15:00').substring(0, 5)
  return `${out} out → ${inn} in`
}
</script>

<template>
  <v-card variant="outlined" rounded="lg" border="warning" class="mb-3">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-2 font-weight-bold" style="color: rgb(var(--v-theme-warning));">
          <v-icon icon="mdi-swap-horizontal" size="18" class="mr-1" />
          Urgent Turns
        </span>
        <v-badge :content="turns.length" color="warning" inline />
      </div>

      <div
        v-for="turn in turns"
        :key="turn.id"
        class="rounded-lg pa-2 mb-1"
        style="background: rgb(var(--v-theme-surface-variant), 0.3);"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ props.propertyMap.get(turn.property_id)?.name || 'Unknown' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ getTimeWindow(turn) }}
            </div>
          </div>
          <v-chip size="x-small" :color="getPriorityColor(turn)" variant="tonal">
            {{ getPriorityColor(turn) === 'error' ? 'Critical' : 'Urgent' }}
          </v-chip>
        </div>
        <div class="d-flex align-center justify-space-between mt-1">
          <span class="text-caption font-weight-medium" :class="getPriorityColor(turn) === 'error' ? 'text-error' : 'text-warning'">
            ⏱ {{ getTimeRemaining(turn) }}
            <template v-if="isUnassigned(turn)"> · Unassigned</template>
          </span>
          <v-btn
            v-if="isUnassigned(turn)"
            size="x-small"
            color="primary"
            variant="tonal"
            @click="emit('assign', turn)"
          >
            Assign
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
