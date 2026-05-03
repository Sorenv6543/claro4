<template>
  <div class="owner-calendar-page">
    <ErrorAlert v-if="error" class="ma-4" :message="error" />

    <LoadingSpinner
      v-if="initialLoading"
      message="Loading your schedule..."
      min-height="100%"
      variant="page"
    />

    <div v-else class="calendar-layout">
      <div class="calendar-content">
        <OwnerCalendar
          :bookings="ownerFilteredBookings"
          :current-date="currentDate"
          :current-view="currentView"
          :loading="loading"
          :properties="myProperties"
          :view-mode="viewMode"
          @create-booking="handleCreateBookingFromCalendar"
          @date-select="handleDateSelect"
          @day-view-open="handleDayViewOpen"
          @event-click="handleEventClick"
          @event-drop="handleEventDrop"
          @event-resize="handleEventResize"
          @view-change="handleCalendarViewChange"
        />
      </div>
    </div>

    <Teleport to="body">
      <CalendarNavPill
        v-if="mobile && !initialLoading"
        :label="pillMonthLabel"
        @next="calendarNext()"
        @prev="calendarPrev()"
      />
    </Teleport>

    <OwnerDayViewBottomSheet
      v-model:visible="dayViewVisible"
      :bookings="selectedDayBookings"
      :date="selectedDate"
      :properties="myProperties"
      @add-booking="handleDayViewAddBooking"
      @complete-booking="handleDayViewCompleteBooking"
      @edit-booking="handleDayViewEditBooking"
      @view-booking="handleDayViewViewBooking"
    />

    <BookingForm
      :booking="eventModalMode === 'edit' ? eventModalData : undefined"
      :initial-data="eventModalMode === 'create' ? eventModalData : undefined"
      :mode="eventModalMode"
      :open="eventModalOpen"
      :properties="myProperties"
      @close="handleEventModalClose"
      @delete="handleEventModalDelete"
      @save="handleEventModalSave"
    />

    <ConfirmationDialog
      :cancel-text="confirmDialogCancelText"
      :confirm-text="confirmDialogConfirmText"
      :dangerous="confirmDialogDangerous"
      :message="confirmDialogMessage"
      :open="confirmDialogOpen"
      :title="confirmDialogTitle"
      @cancel="handleConfirmDialogCancel"
      @close="handleConfirmDialogClose"
      @confirm="handleConfirmDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types'
  import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import CalendarNavPill from '@/components/dumb/owner/CalendarNavPill.vue'
  import OwnerDayViewBottomSheet from '@/components/dumb/owner/OwnerDayViewBottomSheet.vue'
  import BookingForm from '@/components/dumb/shared/BookingForm.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import ErrorAlert from '@/components/dumb/shared/ErrorAlert.vue'
  import LoadingSpinner from '@/components/dumb/shared/LoadingSpinner.vue'
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerCalendarState } from '@/composables/owner/useOwnerCalendarState'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { subtractOneDay } from '@/utils/calendarHelpers'

  defineOptions({ name: 'OwnerCalendarPage' })

  const uiStore = useUIStore()
  const authStore = useAuthStore()

  const {
    myBookings,
    loading: bookingsLoading,
    error: bookingsError,
    fetchMyBookings,
    createMyBooking,
    updateMyBooking,
    deleteMyBooking,
  } = useOwnerBookings()

  const {
    myProperties,
    loading: propertiesLoading,
    error: propertiesError,
    fetchMyProperties,
  } = useOwnerProperties()

  const {
    currentView,
    currentDate,
    filterBookings,
    setCalendarView,
    viewMode,
    prev: calendarPrev,
    next: calendarNext,
  } = useOwnerCalendarState()

  const { mobile } = useDisplay()

  const initialLoading = ref(true)
  const dayViewVisible = ref(false)
  const selectedDate = ref<Date | null>(null)
  const selectedDayBookings = ref<Booking[]>([])

  const currentOwnerId = computed(() => authStore.user?.id)

  const loading = computed(() =>
    bookingsLoading.value
    || propertiesLoading.value
    || uiStore.isLoading('bookings')
    || uiStore.isLoading('properties'),
  )

  const error = computed(() => bookingsError.value ?? propertiesError.value ?? null)

  const pillMonthLabel = computed(() =>
    currentDate.value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  )

  const ownerFilteredBookings = computed(() => {
    try {
      return filterBookings(myBookings.value)
    } catch (err) {
      console.error('[OwnerCalendarPage] Error filtering bookings:', err)
      return []
    }
  })

  // Modals
  const eventModalOpen = computed(() => uiStore.isModalOpen('eventModal'))
  const eventModalMode = computed(() => {
    const modal = uiStore.getModalState('eventModal')
    return (modal?.mode as 'create' | 'edit') || 'create'
  })
  const eventModalData = computed(() => {
    const modal = uiStore.getModalState('eventModal')
    return modal?.data as Booking | undefined
  })

  const confirmDialogOpen = computed(() => uiStore.isConfirmDialogOpen('confirmDialog'))
  const confirmDialogTitle = computed(() => uiStore.getConfirmDialogState('confirmDialog')?.title || 'Confirm')
  const confirmDialogMessage = computed(() => uiStore.getConfirmDialogState('confirmDialog')?.message || 'Are you sure?')
  const confirmDialogConfirmText = computed(() => uiStore.getConfirmDialogState('confirmDialog')?.confirmText || 'Confirm')
  const confirmDialogCancelText = computed(() => uiStore.getConfirmDialogState('confirmDialog')?.cancelText || 'Cancel')
  const confirmDialogDangerous = computed(() => uiStore.getConfirmDialogState('confirmDialog')?.dangerous || false)
  const confirmDialogData = computed(() => uiStore.getConfirmDialogState('confirmDialog')?.data)

  // Calendar handlers
  function handleDateSelect (selectInfo: DateSelectArg): void {
    uiStore.openModal('eventModal', 'create', {
      checkin_date: selectInfo.startStr,
      checkout_date: subtractOneDay(selectInfo.endStr),
      owner_id: currentOwnerId.value,
    })
  }

  function handleEventClick (clickInfo: EventClickArg): void {
    const extendedProps = clickInfo.event.extendedProps
    if (extendedProps?.isEdit && extendedProps.booking) {
      const booking = extendedProps.booking as Booking
      uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
      return
    }

    const booking = extendedProps?.booking as Booking | undefined
    if (booking && myBookings.value.some(b => b.id === booking.id)) {
      uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
    } else {
      console.warn('[OwnerCalendarPage] Cannot edit booking not owned by current user')
    }
  }

  async function handleEventDrop (dropInfo: EventDropArg): Promise<void> {
    const booking = dropInfo.event.extendedProps.booking as Booking

    if (!myBookings.value.some(b => b.id === booking.id)) {
      dropInfo.revert()
      return
    }

    if (bookingsLoading.value) {
      dropInfo.revert()
      return
    }

    try {
      await nextTick()
      const result = await updateMyBooking(booking.id, {
        checkin_date: dropInfo.event.startStr,
        checkout_date: subtractOneDay(dropInfo.event.endStr || dropInfo.event.startStr),
        owner_id: booking.owner_id,
      })
      if (!result) throw new Error('Update failed')
      await nextTick()
    } catch (err) {
      console.error('[OwnerCalendarPage] Failed to update booking:', err)
      dropInfo.revert()
    }
  }

  async function handleEventResize (resizeInfo: EventResizeDoneArg): Promise<void> {
    const booking = resizeInfo.event.extendedProps.booking as Booking

    if (!myBookings.value.some(b => b.id === booking.id)) {
      resizeInfo.revert()
      return
    }

    if (bookingsLoading.value) {
      resizeInfo.revert()
      return
    }

    try {
      await nextTick()
      const result = await updateMyBooking(booking.id, {
        checkin_date: resizeInfo.event.startStr,
        checkout_date: subtractOneDay(resizeInfo.event.endStr || resizeInfo.event.startStr),
        owner_id: booking.owner_id,
      })
      if (!result) throw new Error('Resize update failed')
      await nextTick()
    } catch (err) {
      console.error('[OwnerCalendarPage] Failed to resize booking:', err)
      resizeInfo.revert()
    }
  }

  function handleCalendarViewChange (view: string): void {
    const viewMap: Record<string, 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'> = {
      week: 'timeGridWeek',
      day: 'timeGridDay',
      list: 'listWeek',
      month: 'dayGridMonth',
    }
    setCalendarView(viewMap[view] ?? 'dayGridMonth')
  }

  function handleCreateBookingFromCalendar (data: { start: string, end: string, propertyId?: string | undefined }): void {
    uiStore.openModal('eventModal', 'create', {
      ...data,
      owner_id: currentOwnerId.value,
    })
  }

  // Day view handlers
  function handleDayViewOpen (payload: { date: Date, bookings: Booking[] }): void {
    selectedDate.value = payload.date
    selectedDayBookings.value = payload.bookings
    dayViewVisible.value = true
  }

  function handleDayViewViewBooking (booking: Booking): void {
    dayViewVisible.value = false
    uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
  }

  function handleDayViewEditBooking (booking: Booking): void {
    dayViewVisible.value = false
    uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
  }

  async function handleDayViewCompleteBooking (booking: Booking): Promise<void> {
    try {
      const result = await updateMyBooking(booking.id, {
        status: 'completed',
        checkin_date: booking.checkin_date,
        checkout_date: booking.checkout_date,
        owner_id: booking.owner_id,
      })
      if (!result) throw new Error('Failed to complete booking')
      dayViewVisible.value = false
    } catch (err) {
      console.error('[OwnerCalendarPage] Failed to complete booking:', err)
    }
  }

  function handleDayViewAddBooking (date: Date): void {
    dayViewVisible.value = false
    const startStr = date.toISOString().split('T')[0]
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)
    const endStr = endDate.toISOString().split('T')[0]
    uiStore.openModal('eventModal', 'create', {
      checkin_date: startStr,
      checkout_date: endStr,
      owner_id: currentOwnerId.value,
    })
  }

  // Modal handlers
  function handleEventModalClose (): void {
    uiStore.closeModal('eventModal')
  }

  async function handleEventModalSave (data: BookingFormData): Promise<void> {
    try {
      const bookingData = { ...data, owner_id: currentOwnerId.value }

      if (eventModalMode.value === 'create') {
        await createMyBooking(bookingData as BookingFormData)
      } else if (eventModalData.value) {
        const booking = eventModalData.value
        if (!booking?.id || !myBookings.value.some(b => b.id === booking.id)) {
          throw new Error('Cannot update booking not owned by current user')
        }
        await updateMyBooking(booking.id, bookingData as Partial<BookingFormData>)
      }
      uiStore.closeModal('eventModal')
    } catch (err) {
      console.error('[OwnerCalendarPage] Failed to save booking:', err)
    }
  }

  function handleEventModalDelete (bookingId: string): void {
    if (!myBookings.value.some(b => b.id === bookingId)) return

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'booking', id: bookingId },
    })
  }

  async function handleConfirmDialogConfirm (): Promise<void> {
    const data = confirmDialogData.value
    if (data?.type === 'booking' && data?.id) {
      try {
        await deleteMyBooking(data.id as string)
        uiStore.closeModal('eventModal')
      } catch (err) {
        console.error('[OwnerCalendarPage] Failed to delete booking:', err)
      }
    }
    uiStore.closeConfirmDialog('confirmDialog')
  }

  function handleConfirmDialogCancel (): void {
    uiStore.closeConfirmDialog('confirmDialog')
  }

  function handleConfirmDialogClose (): void {
    uiStore.closeConfirmDialog('confirmDialog')
  }

  onMounted(async () => {
    try {
      await Promise.allSettled([fetchMyBookings(), fetchMyProperties()])
    } finally {
      initialLoading.value = false
    }
  })
</script>

<style scoped>
.owner-calendar-page {
  height: calc(100vh - var(--app-bar-height, 64px));
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.calendar-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

@media (max-width: 599px) {
  .calendar-content {
    padding-bottom: 88px;
  }
}
</style>
