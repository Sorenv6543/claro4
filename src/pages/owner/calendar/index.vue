<template>
  <div class="calendar-page">
    <ErrorAlert v-if="error" class="ma-4" :message="error" />

    <OwnerCalendar
      :bookings="myBookings"
      :loading="loading"
      :properties="myProperties"
      @create-booking="handleCreateBooking"
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
  </div>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types'
  import type { EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import { computed, onMounted, ref } from 'vue'
  import OwnerBookingForm from '@/components/dumb/owner/OwnerBookingForm.vue'
  import ErrorAlert from '@/components/dumb/shared/ErrorAlert.vue'
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'
  import { subtractOneDay } from '@/utils/calendarHelpers'

  defineOptions({ name: 'OwnerCalendarPage' })

  const { myBookings, loading: bookingsLoading, error: bookingsError, fetchMyBookings, createMyBooking, updateMyBooking } = useOwnerBookings()
  const { myProperties, loading: propertiesLoading, error: propertiesError, fetchMyProperties } = useOwnerProperties()
  const uiStore = useUIStore()

  const loading = computed(() => bookingsLoading.value || propertiesLoading.value)
  const error = computed(() => bookingsError.value ?? propertiesError.value ?? null)

  const bookingFormModal = ref({
    show: false,
    loading: false,
    errors: new Map<string, string[]>(),
    initialDates: undefined as { checkinDate: string, checkoutDate: string } | undefined,
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

  async function handleBookingFormSubmit (data: BookingFormData) {
    bookingFormModal.value.loading = true
    try {
      const createdBooking = await createMyBooking(data)
      if (!createdBooking) {
        uiStore.addNotification('error', 'Failed', 'Could not create booking')
        return
      }

      uiStore.addNotification('success', 'Created', 'Booking created successfully')
      bookingFormModal.value.show = false
    } catch (error_) {
      uiStore.addNotification('error', 'Failed', error_ instanceof Error ? error_.message : 'Could not create booking')
    } finally {
      bookingFormModal.value.loading = false
    }
  }

  async function handleEventDrop (dropInfo: EventDropArg) {
    const booking = dropInfo.event.extendedProps?.booking as Booking | undefined
    if (!booking) {
      dropInfo.revert()
      return
    }
    const ok = await updateMyBooking(booking.id, {
      checkin_date: dropInfo.event.startStr.split('T')[0],
      checkout_date: subtractOneDay(dropInfo.event.endStr).split('T')[0],
    })
    if (!ok) {
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
    const ok = await updateMyBooking(booking.id, {
      checkin_date: resizeInfo.event.startStr.split('T')[0],
      checkout_date: subtractOneDay(resizeInfo.event.endStr).split('T')[0],
    })
    if (!ok) {
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
</style>
