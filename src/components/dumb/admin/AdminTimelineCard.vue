<script setup lang="ts">
  import type { Booking } from '@/types/booking'
  import { computed } from 'vue'
  import { getBookingStatusColor } from '@/utils/constants'

  const props = defineProps<{
    booking: Booking
    property: { id: string, name: string, color: string } | null
    cleaner: { id: string, name: string } | null
    teamName?: string | null
    groupNames?: string[] | null
  }>()

  const emit = defineEmits<{
    'assign': [booking: Booking]
    'view': [booking: Booking]
    'status-change': [booking: Booking]
  }>()

  const displayTime = computed(() => {
    const time = props.booking.checkout_time || props.booking.checkin_time || ''
    return time.substring(0, 5)
  })

  const typeLabel = computed(() => {
    if (props.booking.booking_type === 'turn') {
      const checkinTime = props.booking.checkin_time?.substring(0, 5) || ''
      return `Turn (checkin ${checkinTime})`
    }
    return 'Standard clean'
  })

  const isUnassigned = computed(() =>
    !props.booking.assigned_cleaner_id
    && !props.booking.assigned_team_id
    && (!props.booking.assigned_group_ids || props.booking.assigned_group_ids.length === 0),
  )

  const isInProgress = computed(() => props.booking.status === 'in_progress')

  const assigneeDisplay = computed(() => {
    if (props.teamName) return props.teamName
    if (props.groupNames?.length) return props.groupNames.join(', ')
    if (props.cleaner) return props.cleaner.name
    return null
  })

  const cleanerInitials = computed(() => {
    const name = assigneeDisplay.value
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  })

  const borderStyle = computed(() => {
    if (isUnassigned.value) return { borderLeft: '3px solid rgb(var(--v-theme-error))' }
    if (isInProgress.value) return { borderLeft: '3px solid rgb(var(--v-theme-warning))' }
    return {}
  })

  const cardClass = computed(() => isUnassigned.value ? 'bg-error-lighten-5' : '')

  const statusColor = computed(() => getBookingStatusColor(props.booking.status))
</script>

<template>
  <v-card
    class="mb-2"
    :class="cardClass"
    rounded="lg"
    :style="borderStyle"
    variant="outlined"
  >
    <v-card-text class="d-flex align-center ga-3 py-2 px-3">
      <div class="text-subtitle-2 font-weight-bold text-medium-emphasis" style="min-width: 48px;">
        {{ displayTime }}
      </div>

      <div
        v-if="property"
        class="rounded-circle flex-shrink-0"
        :style="{ width: '10px', height: '10px', backgroundColor: property.color }"
      />

      <div class="flex-grow-1" style="min-width: 0;">
        <div class="text-body-2 font-weight-medium text-truncate">
          {{ property?.name || 'Unknown Property' }}
        </div>
        <div class="text-caption text-medium-emphasis">
          Checkout → {{ typeLabel }}
        </div>
      </div>

      <v-chip
        v-if="booking.booking_type === 'turn'"
        color="warning"
        size="x-small"
        variant="tonal"
      >
        Turn
      </v-chip>

      <v-chip :color="statusColor" size="x-small" variant="tonal">
        {{ booking.status.replace('_', ' ') }}
      </v-chip>

      <template v-if="isUnassigned">
        <v-chip color="error" size="x-small" variant="flat">
          Unassigned
        </v-chip>
        <v-btn
          color="primary"
          data-testid="assign-btn"
          size="x-small"
          variant="tonal"
          @click.stop="emit('assign', booking)"
        >
          Assign
        </v-btn>
      </template>
      <template v-else>
        <div class="d-flex align-center ga-1">
          <v-avatar color="primary" size="22">
            <span class="text-caption">{{ cleanerInitials }}</span>
          </v-avatar>
          <span class="text-caption text-truncate" style="max-width: 80px;">
            {{ assigneeDisplay }}
          </span>
        </div>
      </template>

      <v-btn
        class="d-none d-md-flex"
        icon="mdi-dots-vertical"
        size="x-small"
        variant="text"
        @click.stop
      >
        <v-icon size="16">mdi-dots-vertical</v-icon>
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-item
              v-if="isUnassigned"
              prepend-icon="mdi-account-plus"
              title="Assign"
              @click="emit('assign', booking)"
            />
            <v-list-item
              prepend-icon="mdi-eye"
              title="View Details"
              @click="emit('view', booking)"
            />
            <v-list-item
              prepend-icon="mdi-swap-horizontal"
              title="Change Status"
              @click="emit('status-change', booking)"
            />
          </v-list>
        </v-menu>
      </v-btn>
    </v-card-text>
  </v-card>
</template>
