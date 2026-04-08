<template>
  <v-card
    class="turn-alerts glass-card fade-in"
    :class="{ 'pulse-animation': hasUrgentTurns }"
    :color="hasUrgentTurns ? 'error-lighten-5' : 'warning-lighten-5'"
    :elevation="3"
  >
    <v-card-title class="d-flex align-center pa-3">
      <v-icon
        class="mr-2"
        :color="hasUrgentTurns ? 'error' : 'warning'"
        :icon="hasUrgentTurns ? 'mdi-alert-circle' : 'mdi-clock-alert'"
      />
      <span class="text-h6">Turn Alerts</span>
      <v-badge
        class="ml-2"
        :color="hasUrgentTurns ? 'error' : 'warning'"
        :content="bookings.length.toString()"
      />
      <v-spacer />
      <v-btn
        :color="hasUrgentTurns ? 'error' : 'warning'"
        density="comfortable"
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="text"
        @click="toggleExpanded"
      />
    </v-card-title>

    <v-expand-transition>
      <div v-if="expanded">
        <v-divider />
        <v-card-text class="pa-3">
          <v-list
            v-if="bookings.length > 0"
            class="turn-list pa-0"
          >
            <v-list-item
              v-for="booking in limitedBookings"
              :key="booking.id"
              class="mb-3 turn-list-item hover-elevate"
              :class="booking.priority === 'urgent' ? 'urgent-priority' : 'high-priority'"
              elevation="1"
                           :value="booking.id"
            >
              <template #prepend>
                <v-avatar
                  class="mr-2"
                  :color="getPriorityColor(booking.priority)"
                  size="36"
                >
                  <v-icon
                    color="white"
                    :icon="booking.priority === 'urgent' ? 'mdi-alert' : 'mdi-clock-fast'"
                    size="small"
                  />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">
                {{ getPropertyName(booking) }}
              </v-list-item-title>

              <v-list-item-subtitle>
                <div class="d-flex flex-column mt-1">
                  <div class="d-flex align-center">
                    <v-icon
                      class="mr-1"
                      icon="mdi-logout"
                      size="x-small"
                    />
                    <span class="text-caption">{{ formatTime(booking.checkout_date) }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon
                      class="mr-1"
                      icon="mdi-login"
                      size="x-small"
                    />
                    <span class="text-caption">{{ formatTime(booking.checkin_date) }}</span>
                  </div>
                  <div
                    v-if="booking.cleaning_window"
                    class="d-flex align-center text-caption mt-1"
                  >
                    <v-icon
                      class="mr-1"
                      icon="mdi-timer-outline"
                      size="x-small"
                    />
                    <v-chip
                      class="text-caption"
                      :color="getPriorityColor(booking.priority)"
                      label
                      size="x-small"
                    >
                      Window: {{ getCleaningWindowText(booking) }}
                    </v-chip>
                  </div>
                </div>
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex flex-column">
                  <v-btn
                    class="mb-2"
                    color="primary"
                    rounded
                    size="small"
                    variant="flat"
                    @click.stop="emit('view', booking.id)"
                  >
                    <v-icon
                      class="mr-1"
                      size="small"
                    >
                      mdi-eye
                    </v-icon>
                    View
                  </v-btn>
                  <v-btn
                    color="success"
                    rounded
                    size="small"
                    variant="flat"
                    @click.stop="emit('assign', booking.id)"
                  >
                    <v-icon
                      class="mr-1"
                      size="small"
                    >
                      mdi-account-check
                    </v-icon>
                    Assign
                  </v-btn>
                </div>
              </template>
            </v-list-item>

            <div
              v-if="props.bookings.length > props.limit"
              class="text-center mt-3"
            >
              <v-btn
                color="primary"
                prepend-icon="mdi-format-list-bulleted"
                rounded
                size="small"
                variant="tonal"
                @click="emit('view-all')"
              >
                View all {{ props.bookings.length }} turns
              </v-btn>
            </div>
          </v-list>
          <div
            v-else
            class="text-center py-3"
          >
            <v-icon
              class="mb-2"
              color="success"
              icon="mdi-check-circle"
              size="large"
            />
            <div>No urgent turn bookings at this time.</div>
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
  import type { BookingWithMetadata } from '@/types'
  import { computed, ref } from 'vue'

  interface Props {
    bookings: BookingWithMetadata[]
    initialExpanded?: boolean
    limit?: number
  }

  interface Emits {
    (e: 'view' | 'assign', id: string): void
    (e: 'toggle-expanded', expanded: boolean): void
    (e: 'view-all'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    initialExpanded: true,
    limit: 5,
  })

  const emit = defineEmits<Emits>()

  const expanded = ref(props.initialExpanded)

  function toggleExpanded () {
    expanded.value = !expanded.value
    emit('toggle-expanded', expanded.value)
  }

  const hasUrgentTurns = computed((): boolean => {
    return props.bookings.some(booking => booking.priority === 'urgent')
  })

  const limitedBookings = computed((): BookingWithMetadata[] => {
    // Sort by priority (urgent first) then by checkout date
    const sorted = [...props.bookings].toSorted((a, b) => {
      // Priority sort (urgent > high)
      if (a.priority !== b.priority) {
        return a.priority === 'urgent' ? -1 : 1
      }

      // Then by checkout date (earlier first)
      return new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime()
    })

    return sorted.slice(0, props.limit)
  })

  function getPriorityColor (priority: string): string {
    return priority === 'urgent' ? 'error' : 'warning'
  }

  function getPropertyName (booking: BookingWithMetadata): string {
    return booking.property_name || `Property #${booking.property_id.substring(0, 8)}`
  }

  function formatTime (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function getCleaningWindowText (booking: BookingWithMetadata): string {
    if (!booking.cleaning_window) return 'Not calculated'

    const duration = booking.cleaning_window.duration
    if (duration < 60) {
      return `${duration} min`
    }

    const hours = Math.floor(duration / 60)
    const minutes = duration % 60

    if (minutes === 0) {
      return `${hours}h`
    }

    return `${hours}h ${minutes}m`
  }
</script>

<style scoped>
/* Main card theming */
.turn-alerts {
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* List theming */
.turn-list {
  background: transparent !important;
}

.turn-list-item {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
}

.turn-list-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-on-surface), 0.15);
  transform: translateY(-1px);
}

/* Card title theming */
:deep(.v-card-title) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

/* Button theming */
:deep(.v-btn) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.v-btn--variant-elevated),
:deep(.v-btn--variant-flat) {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

:deep(.v-btn--variant-tonal) {
  background: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

/* Icon theming */
:deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-btn .v-icon) {
  color: inherit !important;
}

/* List item text theming */
:deep(.v-list-item-title) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-list-item-subtitle) {
  color: rgba(var(--v-theme-on-surface), 0.8) !important;
}

/* Chip theming */
:deep(.v-chip) {
  background: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-chip.bg-error) {
  background: rgba(var(--v-theme-error), 0.12) !important;
  color: rgb(var(--v-theme-error)) !important;
}

:deep(.v-chip.bg-warning) {
  background: rgba(var(--v-theme-warning), 0.12) !important;
  color: rgb(var(--v-theme-warning)) !important;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .turn-list-item .v-list-item-title {
    font-size: 0.9rem;
  }

  .turn-list-item .v-list-item-subtitle {
    font-size: 0.8rem;
  }
}
</style>
