<template>
  <v-bottom-sheet
    v-model="internalVisible"
    class="owner-day-view-sheet"
    :inset="useDisplay().mdAndUp.value"
    max-width="600px"
    :persistent="false"
  >
    <v-card class="day-view-card">
      <!-- Header -->
      <v-card-title class="day-view-header">
        <div class="header-content">
          <div class="date-info">
            <h3 class="date-title">
              {{ formattedDate }}
            </h3>

            <p class="booking-count">
              {{ bookings.length }} booking{{ bookings.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <v-btn
            class="close-button"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="closeSheet"
          />
        </div>
      </v-card-title>

      <!-- Swipe indicator -->
      <div class="swipe-indicator" />

      <!-- Bookings List -->
      <v-card-text class="bookings-container">
        <div
          ref="bookingsListRef"
          class="bookings-list"
          @touchend="handleTouchEnd"
          @touchmove="handleTouchMove"
          @touchstart="handleTouchStart"
        >
          <div
            v-for="(booking, index) in bookings"
            :key="booking.id"
            class="booking-item"
            :class="{
              'booking-turn': booking.booking_type === 'turn',
              'booking-urgent': booking.priority === 'urgent',
              'booking-high': booking.priority === 'high'
            }"
          >
            <!-- Booking Header -->
            <div class="booking-header">
              <div class="property-info">
                <h4 class="property-name">
                  <v-icon
                    class="property-icon"
                    size="small"
                  >
                    mdi-home
                  </v-icon>
                  {{ getPropertyName(booking.property_id || '') }}
                  <v-chip
                    v-if="booking.booking_type === 'turn'"
                    class="turn-chip"
                    color="error"
                    size="x-small"
                    variant="elevated"
                  >
                    TURN
                  </v-chip>
                </h4>

                <p class="booking-times">
                  {{ formatBookingTime(booking.checkout_date || '') }} → {{ formatBookingTime(booking.checkin_date || '') }}
                </p>
              </div>

              <div class="priority-indicator">
                <v-chip
                  :color="getPriorityColor(booking.priority || 'normal')"
                  size="small"
                  variant="elevated"
                >
                  {{ (booking.priority || 'normal').toUpperCase() }}
                </v-chip>
              </div>
            </div>

            <!-- Booking Details -->
            <div class="booking-details">
              <div
                v-if="booking.guest_count"
                class="detail-row"
              >
                <v-icon
                  class="detail-icon"
                  size="small"
                >
                  mdi-account-multiple
                </v-icon>

                <span>{{ booking.guest_count }} guest{{ booking.guest_count !== 1 ? 's' : '' }}</span>
              </div>

              <div class="detail-row">
                <v-icon
                  class="detail-icon"
                  size="small"
                >
                  mdi-circle-medium
                </v-icon>

                <span class="status-text">{{ (booking.status || 'pending').replace('_', ' ').toUpperCase() }}</span>
              </div>

              <div
                v-if="booking.notes"
                class="detail-row notes-row"
              >
                <v-icon
                  class="detail-icon"
                  size="small"
                >
                  mdi-note-text
                </v-icon>

                <span class="notes-text">{{ booking.notes }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="booking-actions">
              <v-btn
                class="action-btn"
                prepend-icon="mdi-eye"
                size="small"
                variant="text"
                @click="viewBooking(booking)"
              >
                View
              </v-btn>

              <v-btn
                class="action-btn"
                prepend-icon="mdi-pencil"
                size="small"
                variant="text"
                @click="editBooking(booking)"
              >
                Edit
              </v-btn>

              <v-btn
                v-if="booking.status !== 'completed'"
                class="action-btn"
                color="success"
                prepend-icon="mdi-check"
                size="small"
                variant="text"
                @click="markComplete(booking)"
              >
                Complete
              </v-btn>
            </div>

            <!-- Divider -->
            <v-divider
              v-if="index < bookings.length - 1"
              class="booking-divider"
            />
          </div>

          <!-- Empty State -->
          <div
            v-if="bookings.length === 0"
            class="empty-state"
          >
            <v-icon
              color="grey-lighten-1"
              size="64"
            >
              mdi-calendar-blank
            </v-icon>

            <h4 class="empty-title">
              No bookings for this day
            </h4>

            <p class="empty-subtitle">
              Get started by adding your first booking
            </p>

            <v-btn
              class="empty-state-btn"
              color="primary"
              prepend-icon="mdi-plus"
              size="large"
              variant="elevated"
              @click="addBooking"
            >
              Add Booking for {{ formattedDate }}
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <!-- Footer Actions - Only show when there are existing bookings -->
      <v-card-actions
        v-if="bookings.length > 0"
        class="day-view-footer"
      >
        <v-btn
          block
          class="add-booking-btn"
          color="primary"
          prepend-icon="mdi-plus"
          variant="elevated"
          @click="addBooking"
        >
          Add Another Booking
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
  import type { Booking, Property } from '@/types'
  import { computed, nextTick, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { formatPropertyAddress } from '@/types/property'

  interface Props {
    visible: boolean
    date: Date | null
    bookings: Booking[]
    properties: Property[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'view-booking' | 'edit-booking' | 'complete-booking', booking: Booking): void
    (e: 'add-booking', date: Date): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Reactive state
  const internalVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
  })

  const bookingsListRef = ref<HTMLElement>()

  // Touch gesture handling
  const touchStartY = ref(0)
  const touchStartX = ref(0)
  const isDragging = ref(false)

  // Computed properties
  const formattedDate = computed(() => {
    if (!props.date) return ''
    return props.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  // Helper functions
  function getPropertyName (propertyId: string): string {
    if (!propertyId) return 'Unknown Property'
    const property = props.properties.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  }

  function formatBookingTime (dateString: string): string {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'Invalid Date'

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  function getPriorityColor (priority: string): string {
    switch (priority) {
      case 'urgent': { return 'error'
      }
      case 'high': { return 'warning'
      }
      case 'normal': { return 'primary'
      }
      case 'low': { return 'success'
      }
      default: { return 'grey'
      }
    }
  }

  // Event handlers
  function closeSheet (): void {
    internalVisible.value = false
  }

  function viewBooking (booking: Booking): void {
    emit('view-booking', booking)
  }

  function editBooking (booking: Booking): void {
    emit('edit-booking', booking)
  }

  function markComplete (booking: Booking): void {
    emit('complete-booking', booking)
  }

  function addBooking (): void {
    if (props.date) {
      emit('add-booking', props.date)
    }
  }

  // Touch gesture handlers for swipe navigation
  function handleTouchStart (event: TouchEvent): void {
    if (event.touches.length === 1) {
      touchStartY.value = event.touches[0].clientY
      touchStartX.value = event.touches[0].clientX
      isDragging.value = false
    }
  }

  function handleTouchMove (event: TouchEvent): void {
    if (event.touches.length === 1) {
      const deltaY = Math.abs(event.touches[0].clientY - touchStartY.value)
      const deltaX = Math.abs(event.touches[0].clientX - touchStartX.value)

      // Determine if this is a vertical or horizontal swipe
      if (deltaY > 10 || deltaX > 10) {
        isDragging.value = true
      }
    }
  }

  function handleTouchEnd (event: TouchEvent): void {
    if (isDragging.value && event.changedTouches.length === 1) {
      const endY = event.changedTouches[0].clientY
      const endX = event.changedTouches[0].clientX
      const deltaY = endY - touchStartY.value
      const deltaX = endX - touchStartX.value

      // Check for swipe down to close (only if swiping down significantly)
      if (deltaY > 100 && Math.abs(deltaX) < 50) {
        closeSheet()
      }
    }

    isDragging.value = false
  }

  // Watch for visibility changes to handle focus
  watch(internalVisible, async newVisible => {
    if (newVisible) {
      await nextTick()
      // Auto-focus on the sheet for accessibility
      if (bookingsListRef.value) {
        bookingsListRef.value.focus()
      }
    }
  })
</script>
