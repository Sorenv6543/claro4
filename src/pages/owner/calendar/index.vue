<template>
  <div class="calendar-page">
    <ErrorAlert v-if="error" class="ma-4" :message="error" />

    <div class="cal-page-header">
      <div class="cal-page-header__left">
        <h1 class="cal-page-header__title">My Calendar</h1>
        <p class="cal-page-header__subtitle">Bookings across all properties</p>
      </div>

      <div class="cal-page-header__controls">
        <v-btn-toggle
          v-model="currentView"
          class="cal-view-toggle"
          density="compact"
          mandatory
          rounded="pill"
          variant="outlined"
          @update:model-value="switchView"
        >
          <v-btn size="small" value="dayGridMonth">Month</v-btn>
          <v-btn size="small" value="timeGridWeek">Week</v-btn>
          <v-btn size="small" value="timeGridDay">Day</v-btn>
        </v-btn-toggle>

        <div class="cal-page-header__nav">
          <v-btn
            density="compact"
            icon="mdi-chevron-left"
            variant="text"
            @click="goPrev"
          />

          <span class="cal-page-header__month-label">{{ currentMonthLabel }}</span>

          <v-btn
            density="compact"
            icon="mdi-chevron-right"
            variant="text"
            @click="goNext"
          />
        </div>

        <v-btn
          class="cal-page-header__today"
          density="compact"
          rounded="pill"
          variant="outlined"
          @click="goToday"
        >
          Today
        </v-btn>

        <v-btn
          color="primary"
          density="compact"
          prepend-icon="mdi-plus"
          rounded="pill"
          @click="openBookingForm"
        >
          New Booking
        </v-btn>
      </div>
    </div>

    <OwnerCalendar
      ref="ownerCalendarRef"
      :bookings="myBookings"
      :current-view="currentView"
      :loading="loading"
      :properties="myProperties"
      @create-booking="handleCreateBooking"
      @dates-set="handlePageDatesSet"
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
  import type { DatesSetArg, EventDropArg } from '@fullcalendar/core'
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

  const ownerCalendarRef = ref<InstanceType<typeof OwnerCalendar> | null>(null)
  const currentView = ref<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const currentMonthLabel = ref('')

  const bookingFormModal = ref({
    show: false,
    loading: false,
    errors: new Map<string, string[]>(),
    initialDates: undefined as { checkinDate: string, checkoutDate: string } | undefined,
  })

  function handlePageDatesSet (arg: DatesSetArg): void {
    currentMonthLabel.value = arg.view.currentStart.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    })
  }

  function goPrev (): void {
    ownerCalendarRef.value?.getApi()?.prev()
  }

  function goNext (): void {
    ownerCalendarRef.value?.getApi()?.next()
  }

  function goToday (): void {
    ownerCalendarRef.value?.getApi()?.today()
  }

  function switchView (view: string): void {
    ownerCalendarRef.value?.changeView(view)
  }

  function openBookingForm (): void {
    bookingFormModal.value = {
      show: true,
      loading: false,
      errors: new Map(),
      initialDates: undefined,
    }
  }

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

/* ================================================================ */
/* PAGE HEADER */
/* ================================================================ */

.cal-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--claro-space-md) var(--claro-space-lg);
  flex-shrink: 0;
  gap: var(--claro-space-md);
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.cal-page-header__title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.cal-page-header__subtitle {
  font-size: 0.8125rem;
  color: var(--claro-text-secondary);
  margin: 2px 0 0;
}

.cal-page-header__controls {
  display: flex;
  align-items: center;
  gap: var(--claro-space-sm);
  flex-wrap: wrap;
}

.cal-view-toggle {
  border-radius: 9999px;
}

.cal-page-header__nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

.cal-page-header__month-label {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 768px) {
  .cal-page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--claro-space-sm) var(--claro-space-md);
  }

  .cal-page-header__controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
