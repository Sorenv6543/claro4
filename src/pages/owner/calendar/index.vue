<template>
  <div class="calendar-page">
    <ErrorAlert v-if="error" class="ma-4" :message="error" />

    <div class="view-switcher-container">
      <div class="view-switcher glass-card">
        <v-btn-toggle
          v-model="currentView"
          color="primary"
          density="compact"
          mandatory
          rounded="pill"
          variant="text"
        >
          <v-btn class="switcher-btn" value="dayGridMonth">Month</v-btn>
          <v-btn class="switcher-btn" value="timeGridWeek">Week</v-btn>
          <v-btn class="switcher-btn" value="timeGridDay">Day</v-btn>
          <v-btn class="switcher-btn" value="listWeek">List</v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <OwnerCalendar
      ref="ownerCalendarRef"
      :bookings="myBookings"
      :current-view="currentView"
      :loading="loading"
      :properties="myProperties"
      @create-booking="handleCreateBooking"
      @event-click="handleEventClick"
      @event-drop="handleEventDrop"
      @event-resize="handleEventResize"
    />

    <OwnerBookingForm
      v-model="bookingFormModal.show"
      :errors="bookingFormModal.errors"
      :initial-dates="bookingFormModal.initialDates"
      :loading="bookingFormModal.loading"
      mode="create"
      :properties="myProperties"
      @close="bookingFormModal.show = false"
      @submit="handleBookingFormSubmit"
    />

    <OwnerBookingForm
      v-model="editModal.show"
      :booking="editModal.booking"
      :errors="editModal.errors"
      :loading="editModal.loading"
      mode="edit"
      :properties="myProperties"
      @close="editModal.show = false"
      @submit="handleBookingEditSubmit"
    />

    <PropertyModal
      :existing-property-count="myProperties.length"
      :mode="propertyModal.mode"
      :open="propertyModal.show"
      :owner-id="authStore.user?.id || ''"
      :property="propertyModal.property"
      :stepper="propertyModal.mode === 'create'"
      @close="handlePropertyModalClose"
      @delete="handlePropertyModalDelete"
      @save="handlePropertyModalSave"
      @skip="handlePropertyModalClose"
    />

    <Teleport to="body">
      <button
        aria-label="Add booking"
        class="fab-add-booking"
        type="button"
        @click="openNewBookingForm"
      >
        <v-icon color="white" size="26">mdi-plus</v-icon>
      </button>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData, Property, PropertyFormData } from '@/types'
  import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import { computed, onMounted, ref } from 'vue'
  import OwnerBookingForm from '@/components/dumb/owner/OwnerBookingForm.vue'
  import ErrorAlert from '@/components/dumb/shared/ErrorAlert.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { calculateBookingPriority } from '@/utils/businessLogic'
  import { subtractOneDay } from '@/utils/calendarHelpers'

  defineOptions({ name: 'OwnerCalendarPage' })

  const { myBookings, loading: bookingsLoading, error: bookingsError, fetchMyBookings, createMyBooking, updateMyBooking } = useOwnerBookings()
  const { myProperties, loading: propertiesLoading, error: propertiesError, fetchMyProperties, createMyProperty, updateMyProperty, deleteMyProperty } = useOwnerProperties()
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  const loading = computed(() => bookingsLoading.value || propertiesLoading.value)
  const error = computed(() => bookingsError.value ?? propertiesError.value ?? null)

  const currentView = ref<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')

  const bookingFormModal = ref({
    show: false,
    loading: false,
    errors: new Map<string, string[]>(),
    initialDates: undefined as { checkinDate: string, checkoutDate: string } | undefined,
  })

  const editModal = ref({
    show: false,
    loading: false,
    errors: new Map<string, string[]>(),
    booking: null as Booking | null,
  })

  const propertyModal = ref({
    show: false,
    mode: 'create' as 'create' | 'edit',
    property: undefined as Property | undefined,
  })

  function handleCreateBooking (data: { start: string, end: string }) {
    bookingFormModal.value = {
      show: true,
      loading: false,
      errors: new Map(),
      initialDates: {
        checkinDate: data.start.split('T')[0],
        checkoutDate: subtractOneDay(data.end).split('T')[0],
      },
    }
  }

  async function handleBookingFormSubmit (data: BookingFormData, turnCheckinTime?: string) {
    bookingFormModal.value.loading = true
    try {
      const id = await createMyBooking(data)
      if (!id) {
        uiStore.addNotification('error', 'Failed', 'Could not create booking')
        return
      }

      if (turnCheckinTime) {
        try {
          await createMyBooking({
            property_id: data.property_id,
            owner_id: authStore.user?.id || '',
            checkin_date: data.checkout_date,
            checkout_date: data.checkout_date,
            checkin_time: turnCheckinTime,
            checkout_time: data.checkout_time,
            booking_type: 'turn',
            status: 'pending',
            priority: calculateBookingPriority({
              booking_type: 'turn',
              checkout_date: data.checkout_date,
              checkin_date: data.checkout_date,
            } as Booking),
            guest_count: null,
            notes: null,
          })
          uiStore.addNotification('success', 'Created', 'Booking and turn scheduled successfully')
        } catch {
          uiStore.addNotification('warning', 'Partial', 'Booking created but turn scheduling failed')
        }
      } else {
        uiStore.addNotification('success', 'Created', 'Booking created successfully')
      }

      bookingFormModal.value.show = false
    } catch (error_) {
      uiStore.addNotification('error', 'Failed', error_ instanceof Error ? error_.message : 'Could not create booking')
    } finally {
      bookingFormModal.value.loading = false
    }
  }

  function handleEventClick (clickInfo: EventClickArg): void {
    const booking = clickInfo.event.extendedProps?.booking as Booking | undefined
    if (!booking || !myBookings.value.some(b => b.id === booking.id)) {
      return
    }
    editModal.value = {
      show: true,
      loading: false,
      errors: new Map(),
      booking,
    }
  }

  async function handleBookingEditSubmit (data: BookingFormData, _turnCheckinTime?: string) {
    const bookingId = editModal.value.booking?.id
    if (!bookingId) {
      return
    }
    editModal.value.loading = true
    try {
      const ok = await updateMyBooking(bookingId, data)
      if (!ok) {
        uiStore.addNotification('error', 'Failed', 'Could not update booking')
        return
      }
      uiStore.addNotification('success', 'Updated', 'Booking updated successfully')
      editModal.value.show = false
    } catch (error_) {
      uiStore.addNotification('error', 'Failed', error_ instanceof Error ? error_.message : 'Could not update booking')
    } finally {
      editModal.value.loading = false
    }
  }

  function openNewBookingForm (): void {
    bookingFormModal.value = { show: true, loading: false, errors: new Map(), initialDates: undefined }
  }

  function handlePropertyModalClose (): void {
    propertyModal.value.show = false
  }

  async function handlePropertyModalSave (data: PropertyFormData): Promise<void> {
    try {
      if (propertyModal.value.mode === 'create') {
        const id = await createMyProperty(data)
        if (!id) {
          uiStore.addNotification('error', 'Failed', 'Could not create property')
          return
        }
        uiStore.addNotification('success', 'Created', 'Property added successfully')
      } else if (propertyModal.value.property) {
        const success = await updateMyProperty(propertyModal.value.property.id, data)
        if (!success) {
          uiStore.addNotification('error', 'Failed', 'Could not update property')
          return
        }
        uiStore.addNotification('success', 'Updated', 'Property updated successfully')
      }
      propertyModal.value.show = false
    } catch (error_) {
      uiStore.addNotification('error', 'Failed', error_ instanceof Error ? error_.message : 'Could not save property')
    }
  }

  async function handlePropertyModalDelete (propertyId: string): Promise<void> {
    try {
      const success = await deleteMyProperty(propertyId)
      if (!success) {
        uiStore.addNotification('error', 'Failed', 'Could not delete property')
        return
      }
      uiStore.addNotification('success', 'Deleted', 'Property deleted successfully')
      propertyModal.value.show = false
    } catch (error_) {
      uiStore.addNotification('error', 'Failed', error_ instanceof Error ? error_.message : 'Could not delete property')
    }
  }

  async function handleEventDrop (dropInfo: EventDropArg) {
    const booking = dropInfo.event.extendedProps?.booking as Booking | undefined
    if (!booking) {
      dropInfo.revert()
      return
    }
    try {
      const ok = await updateMyBooking(booking.id, {
        checkin_date: dropInfo.event.startStr.split('T')[0],
        checkout_date: subtractOneDay(dropInfo.event.endStr ?? dropInfo.event.startStr).split('T')[0],
      })
      if (!ok) {
        dropInfo.revert()
        uiStore.addNotification('error', 'Failed', 'Could not update booking dates')
      }
    } catch (error) {
      console.error('[OwnerCalendar] Failed to drop booking:', error)
      dropInfo.revert()
      uiStore.addNotification('error', 'Failed', 'Could not update booking dates')
    }
  }

  async function handleEventResize (resizeInfo: EventResizeDoneArg) {
    const booking = resizeInfo.event.extendedProps?.booking as Booking | undefined
    if (!booking) {
      resizeInfo.revert()
      return
    }
    try {
      const ok = await updateMyBooking(booking.id, {
        checkin_date: resizeInfo.event.startStr.split('T')[0],
        checkout_date: subtractOneDay(resizeInfo.event.endStr ?? resizeInfo.event.startStr).split('T')[0],
      })
      if (!ok) {
        resizeInfo.revert()
        uiStore.addNotification('error', 'Failed', 'Could not update booking dates')
      }
    } catch (error) {
      console.error('[OwnerCalendar] Failed to resize booking:', error)
      resizeInfo.revert()
      uiStore.addNotification('error', 'Failed', 'Could not update booking dates')
    }
  }

  onMounted(async () => {
    await Promise.allSettled([fetchMyBookings(), fetchMyProperties()])
  })
</script>

<style scoped>
.calendar-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.view-switcher-container {
  padding: 12px 16px 0;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.view-switcher {
  padding: 4px;
  border-radius: 9999px !important;
  background: var(--claro-glass-bg);
  backdrop-filter: var(--claro-glass-blur);
  border: 1px solid var(--claro-glass-border) !important;
}

.switcher-btn {
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 0.7;
  height: 36px !important;
  min-width: 80px !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.switcher-btn.v-btn--active {
  opacity: 1;
  background: rgb(var(--v-theme-primary)) !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3) !important;
}

.fab-add-booking {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 200;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgb(var(--v-theme-secondary));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.2),
    0 1px 0 rgba(255, 255, 255, 0.18) inset;
  touch-action: manipulation;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fab-add-booking:hover {
  transform: translateY(-2px) scale(1.06);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.28),
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.fab-add-booking:active {
  transform: translateY(0) scale(0.95);
}

.fab-add-booking:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: 3px;
}

@media (max-width: 599px) {
  .fab-add-booking {
    bottom: 72px;
    width: 52px;
    height: 52px;
  }
}
</style>
