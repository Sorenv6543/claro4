<script setup lang="ts">
  import type { Booking } from '@/types/booking'
  import { fmt12 } from '@/utils/timelineMath'
  import { computed, onUnmounted, ref } from 'vue'

  const props = defineProps<{
    turns: Booking[]
    propertyMap: Map<string, { id: string, name: string, color: string }>
    cleanerMap: Map<string, { id: string, name: string }>
  }>()

  const emit = defineEmits<{
    assign: [booking: Booking]
  }>()

  const now = ref(new Date())
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60_000)
  onUnmounted(() => clearInterval(interval))

  function getTurnUrgency (booking: Booking): { color: string, label: string, textClass: string, timeRemaining: string } {
    const checkoutTime = booking.checkout_time || '11:00'
    const [hours, minutes] = checkoutTime.split(':').map(Number)
    const checkout = new Date(now.value)
    checkout.setHours(hours, minutes, 0, 0)
    const diffMs = checkout.getTime() - now.value.getTime()
    const hoursUntil = diffMs / 3_600_000
    const isCritical = hoursUntil <= 2
    const color = isCritical ? 'error' : 'warning'

    let timeRemaining: string
    if (diffMs <= 0) {
      timeRemaining = 'Overdue'
    } else {
      const h = Math.floor(diffMs / 3_600_000)
      const m = Math.floor((diffMs % 3_600_000) / 60_000)
      timeRemaining = `${h}h ${m}m remaining`
    }

    return {
      color,
      label: isCritical ? 'Critical' : 'Urgent',
      textClass: isCritical ? 'text-error' : 'text-warning',
      timeRemaining,
    }
  }

  const turnUrgencyMap = computed(() =>
    new Map(props.turns.map(t => [t.id, getTurnUrgency(t)])),
  )

  function isUnassigned (booking: Booking): boolean {
    return !booking.assigned_cleaner_id && !booking.assigned_team_id
      && (!booking.assigned_group_ids || booking.assigned_group_ids.length === 0)
  }

  function getTimeWindow (booking: Booking): string {
    const out = fmt12(booking.checkout_time || '11:00')
    const inn = fmt12(booking.checkin_time || '15:00')
    return `${out} out → ${inn} in`
  }
</script>

<template>
  <v-card border="warning" class="mb-3" variant="outlined">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-2 font-weight-bold" style="color: rgb(var(--v-theme-warning));">
          <v-icon class="mr-1" icon="mdi-swap-horizontal" size="18" />
          Urgent Turns
        </span>

        <v-badge color="warning" :content="turns.length" inline />
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

          <v-chip :color="turnUrgencyMap.get(turn.id)?.color" size="x-small" variant="tonal">
            {{ turnUrgencyMap.get(turn.id)?.label }}
          </v-chip>
        </div>

        <div class="d-flex align-center justify-space-between mt-1">
          <span class="text-caption font-weight-medium" :class="turnUrgencyMap.get(turn.id)?.textClass">
            ⏱ {{ turnUrgencyMap.get(turn.id)?.timeRemaining }}
            <template v-if="isUnassigned(turn)"> · Unassigned</template>
          </span>

          <v-btn
            v-if="isUnassigned(turn)"
            color="primary"
            size="x-small"
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
