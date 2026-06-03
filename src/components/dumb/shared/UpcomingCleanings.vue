<template>
  <v-card
    class="upcoming-cleanings glass-card fade-in"
    :class="{ 'has-urgent': hasUrgentCleanings }"
    :elevation="3"
  >
    <v-card-title class="d-flex align-center">
      <v-icon
        class="mr-2"
        color="primary"
        icon="mdi-broom"
      />
      Upcoming Cleanings
      <v-badge
        class="ml-2"
        color="primary"
        :content="bookings.length.toString()"
      />

      <v-spacer />

      <v-btn
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="text"
        @click="toggleExpanded"
      />
    </v-card-title>

    <v-expand-transition>
      <div v-if="expanded">
        <v-card-text class="pt-0">
          <!-- Time period expansion panels -->
          <v-expansion-panels
            v-model="openPanels"
            multiple
          >
            <!-- Today's cleanings -->
            <v-expansion-panel v-if="todayCleanings.length > 0">
              <v-expansion-panel-title>
                Today ({{ todayCleanings.length }})
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <!-- List of today's cleanings -->
                <v-list class="cleaning-list">
                  <v-list-item
                    v-for="booking in limitedTodayCleanings"
                    :key="booking.id"
                    :border="true"
                    class="mb-2 rounded cleaning-list-item"
                    :class="booking.booking_type === 'turn' ? 'turn-booking' : 'standard-booking'"
                    :value="booking.id"
                  >
                    <template #prepend>
                      <v-icon
                        :color="getPriorityColor(booking.priority)"
                        :icon="booking.booking_type === 'turn' ? 'mdi-swap-horizontal' : 'mdi-broom'"
                      />
                    </template>

                    <v-list-item-title class="font-weight-bold">
                      {{ getPropertyName(booking) }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      <div class="d-flex flex-column">
                        <span>Checkout: {{ formatTime(booking.checkout_date) }}</span>
                        <span>Checkin: {{ formatTime(booking.checkin_date) }}</span>

                        <span
                          v-if="booking.cleaning_window"
                          class="text-caption"
                        >
                          <v-icon
                            icon="mdi-timer-outline"
                            size="small"
                          />
                          Window: {{ getCleaningWindowText(booking) }}
                        </span>
                      </div>
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="d-flex flex-column">
                        <v-btn
                          class="mb-1"
                          color="primary"
                          size="small"
                          @click.stop="emit('view', booking.id)"
                        >
                          <v-icon
                            class="mr-1"
                            icon="mdi-eye"
                            size="small"
                          />
                          View
                        </v-btn>

                        <v-btn
                          color="success"
                          size="small"
                          @click.stop="emit('assign', booking.id)"
                        >
                          <v-icon
                            class="mr-1"
                            icon="mdi-account-check"
                            size="small"
                          />
                          Assign
                        </v-btn>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>

                <div
                  v-if="todayCleanings.length > limit"
                  class="text-center mt-2"
                >
                  <v-btn
                    color="primary"
                    size="small"
                    variant="text"
                    @click="emit('view-all', 'today')"
                  >
                    View all {{ todayCleanings.length }} cleanings
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Tomorrow's cleanings -->
            <v-expansion-panel v-if="tomorrowCleanings.length > 0">
              <v-expansion-panel-title>
                Tomorrow ({{ tomorrowCleanings.length }})
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <!-- List of tomorrow's cleanings -->
                <v-list class="cleaning-list">
                  <v-list-item
                    v-for="booking in limitedTomorrowCleanings"
                    :key="booking.id"
                    :border="true"
                    class="mb-2 rounded cleaning-list-item"
                    :class="booking.booking_type === 'turn' ? 'turn-booking' : 'standard-booking'"
                    :value="booking.id"
                  >
                    <template #prepend>
                      <v-icon
                        :color="getPriorityColor(booking.priority)"
                        :icon="booking.booking_type === 'turn' ? 'mdi-swap-horizontal' : 'mdi-broom'"
                      />
                    </template>

                    <v-list-item-title class="font-weight-bold">
                      {{ getPropertyName(booking) }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      <div class="d-flex flex-column">
                        <span>Checkout: {{ formatTime(booking.checkout_date) }}</span>
                        <span>Checkin: {{ formatTime(booking.checkin_date) }}</span>

                        <span
                          v-if="booking.cleaning_window"
                          class="text-caption"
                        >
                          <v-icon
                            icon="mdi-timer-outline"
                            size="small"
                          />
                          Window: {{ getCleaningWindowText(booking) }}
                        </span>
                      </div>
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="d-flex flex-column">
                        <v-btn
                          class="mb-1"
                          color="primary"
                          size="small"
                          @click.stop="emit('view', booking.id)"
                        >
                          <v-icon
                            class="mr-1"
                            icon="mdi-eye"
                            size="small"
                          />
                          View
                        </v-btn>

                        <v-btn
                          color="success"
                          size="small"
                          @click.stop="emit('assign', booking.id)"
                        >
                          <v-icon
                            class="mr-1"
                            icon="mdi-account-check"
                            size="small"
                          />
                          Assign
                        </v-btn>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>

                <div
                  v-if="tomorrowCleanings.length > limit"
                  class="text-center mt-2"
                >
                  <v-btn
                    color="primary"
                    size="small"
                    variant="text"
                    @click="emit('view-all', 'tomorrow')"
                  >
                    View all {{ tomorrowCleanings.length }} cleanings
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Upcoming cleanings -->
            <v-expansion-panel v-if="upcomingCleanings.length > 0">
              <v-expansion-panel-title>
                Upcoming ({{ upcomingCleanings.length }})
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <!-- List of upcoming cleanings grouped by date -->
                <template
                  v-for="(group, date) in groupedUpcomingCleanings"
                  :key="date"
                >
                  <div class="date-heading mb-2">
                    {{ formatDate(date) }}
                  </div>

                  <v-list class="cleaning-list">
                    <v-list-item
                      v-for="booking in group.slice(0, limit)"
                      :key="booking.id"
                      :border="true"
                      class="mb-2 rounded cleaning-list-item"
                      :class="booking.booking_type === 'turn' ? 'turn-booking' : 'standard-booking'"
                      :value="booking.id"
                    >
                      <template #prepend>
                        <v-icon
                          :color="getPriorityColor(booking.priority)"
                          :icon="booking.booking_type === 'turn' ? 'mdi-swap-horizontal' : 'mdi-broom'"
                        />
                      </template>

                      <v-list-item-title class="font-weight-bold">
                        {{ getPropertyName(booking) }}
                      </v-list-item-title>

                      <v-list-item-subtitle>
                        <div class="d-flex flex-column">
                          <span>Checkout: {{ formatTime(booking.checkout_date) }}</span>
                          <span>Checkin: {{ formatTime(booking.checkin_date) }}</span>

                          <span
                            v-if="booking.cleaning_window"
                            class="text-caption"
                          >
                            <v-icon
                              icon="mdi-timer-outline"
                              size="small"
                            />
                            Window: {{ getCleaningWindowText(booking) }}
                          </span>
                        </div>
                      </v-list-item-subtitle>

                      <template #append>
                        <div class="d-flex flex-column">
                          <v-btn
                            class="mb-1"
                            color="primary"
                            size="small"
                            @click.stop="emit('view', booking.id)"
                          >
                            <v-icon
                              class="mr-1"
                              icon="mdi-eye"
                              size="small"
                            />
                            View
                          </v-btn>

                          <v-btn
                            color="success"
                            size="small"
                            @click.stop="emit('assign', booking.id)"
                          >
                            <v-icon
                              class="mr-1"
                              icon="mdi-account-check"
                              size="small"
                            />
                            Assign
                          </v-btn>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>

                  <div
                    v-if="group.length > limit"
                    class="text-center mt-2 mb-4"
                  >
                    <v-btn
                      color="primary"
                      size="small"
                      variant="text"
                      @click="emit('view-all', date)"
                    >
                      View all {{ group.length }} cleanings for {{ formatDate(date) }}
                    </v-btn>
                  </div>
                </template>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div
            v-if="bookings.length === 0"
            class="text-center py-2"
          >
            No upcoming cleanings scheduled.
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
    daysAhead?: number
  }

  interface Emits {
    (e: 'view' | 'assign' | 'view-all', id: string): void
    (e: 'toggle-expanded', expanded: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    initialExpanded: true,
    limit: 5,
    daysAhead: 7,
  })

  const emit = defineEmits<Emits>()

  const expanded = ref(props.initialExpanded)
  const openPanels = ref([0]) // Default open today's panel

  function toggleExpanded () {
    expanded.value = !expanded.value
    emit('toggle-expanded', expanded.value)
  }

  // Helper functions
  function isToday (date: string): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    return today.getTime() === checkDate.getTime()
  }

  function isTomorrow (date: string): boolean {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    return tomorrow.getTime() === checkDate.getTime()
  }

  function isWithinDays (date: string, days: number): boolean {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + days)
    maxDate.setHours(23, 59, 59, 999)

    const checkDate = new Date(date)

    return checkDate <= maxDate
  }

  function getDateString (date: string): string {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  // Check if any cleanings are urgent
  const hasUrgentCleanings = computed((): boolean => {
    return props.bookings.some(booking => booking.priority === 'urgent')
  })

  // Computed properties for grouped cleanings
  const todayCleanings = computed((): BookingWithMetadata[] => {
    return props.bookings
      .filter(booking => isToday(booking.checkout_date))
      .toSorted((a, b) => new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime())
  })

  const tomorrowCleanings = computed((): BookingWithMetadata[] => {
    return props.bookings
      .filter(booking => isTomorrow(booking.checkout_date))
      .toSorted((a, b) => new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime())
  })

  const upcomingCleanings = computed((): BookingWithMetadata[] => {
    return props.bookings
      .filter(booking => !isToday(booking.checkout_date)
        && !isTomorrow(booking.checkout_date)
        && isWithinDays(booking.checkout_date, props.daysAhead))
      .toSorted((a, b) => new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime())
  })

  // Group upcoming cleanings by date
  const groupedUpcomingCleanings = computed(() => {
    const groups: Record<string, BookingWithMetadata[]> = {}

    for (const booking of upcomingCleanings.value) {
      const dateKey = getDateString(booking.checkout_date)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(booking)
    }

    return groups
  })

  // Limited cleanings for display
  const limitedTodayCleanings = computed((): BookingWithMetadata[] => {
    return todayCleanings.value.slice(0, props.limit)
  })

  const limitedTomorrowCleanings = computed((): BookingWithMetadata[] => {
    return tomorrowCleanings.value.slice(0, props.limit)
  })

  // Formatting functions
  function formatTime (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
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

  function getPropertyName (booking: BookingWithMetadata): string {
    return booking.property_name || `Property #${booking.property_id.substring(0, 8)}`
  }

  function getPriorityColor (priority: string): string {
    switch (priority) {
      case 'urgent': { return 'error'
      }
      case 'high': { return 'warning'
      }
      case 'normal': { return 'primary'
      }
      default: { return 'success'
      }
    }
  }
</script>
