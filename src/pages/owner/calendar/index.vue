<template>
  <div class="calendar-page">
    <ErrorAlert v-if="error" class="ma-4" :message="error" />

    <OwnerCalendar
      :bookings="myBookings"
      :loading="loading"
      :properties="myProperties"
      @create-booking="handleCreateBooking"
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
  import type { BookingFormData } from '@/types'
  import { computed, onMounted, ref } from 'vue'
  import OwnerBookingForm from '@/components/dumb/owner/OwnerBookingForm.vue'
  import ErrorAlert from '@/components/dumb/shared/ErrorAlert.vue'
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'

  defineOptions({ name: 'OwnerCalendarPage' })

  const { myBookings, loading: bookingsLoading, error: bookingsError, fetchMyBookings, createMyBooking } = useOwnerBookings()
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
        checkoutDate: data.end.split('T')[0],
      },
    }
  }

  async function handleBookingFormSubmit (data: BookingFormData) {
    bookingFormModal.value.loading = true
    try {
      await createMyBooking(data)
      uiStore.addNotification('success', 'Created', 'Booking created successfully')
      bookingFormModal.value.show = false
    } catch (error_) {
      uiStore.addNotification('error', 'Failed', error_ instanceof Error ? error_.message : 'Could not create booking')
    } finally {
      bookingFormModal.value.loading = false
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
