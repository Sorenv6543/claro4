<!--
🏠 ROLE-SPECIFIC INTERFACES
👤 OWNER INTERFACE
src/components/smart/owner/HomeOwner.vue -

✅ FILTERED VIEW - Owner sees only their data
✅ Filters properties by owner_id
✅ Filters bookings by owner_id
✅ Prevents access to other owners' data
 -->

<template>
  <div class="home-owner-page">
    <!-- Loading state while initial data loads -->
    <LoadingSpinner
      v-if="initialLoading"
      message="Loading your schedule..."
      min-height="100%"
      variant="page"
    />

    <!-- Calendar -->
    <div v-else class="calendar-layout">
      <!-- Calendar Content -->
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
          @update-booking="handleUpdateBooking"
          @view-change="handleCalendarViewChange"
        />
      </div>
    </div>

    <!-- Floating calendar navigation pill — mobile only. Teleported to body so
         position:fixed escapes any transformed/overflow-hidden parent. -->
    <Teleport to="body">
      <CalendarNavPill
        v-if="mobile"
        :label="pillMonthLabel"
        @next="calendarNext()"
        @prev="calendarPrev()"
      />
    </Teleport>

    <!-- Day View Bottom Sheet -->
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

    <!-- Owner-focused Modals -->
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

    <PropertyModal
      :mode="propertyModalMode"
      :open="propertyModalOpen"
      :owner-id="authStore.user?.id || ''"
      :property="propertyModalData"
      @close="handlePropertyModalClose"
      @delete="handlePropertyModalDelete"
      @save="handlePropertyModalSave"
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
// import { useRealtimeSync } from '@/composables/supabase/useRealtimeSync';

  import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  // Types
  import type { Booking, BookingFormData, Property, PropertyFormData } from '@/types'
  // Real-time sync will auto-initialize when user is authenticated
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import CalendarNavPill from '@/components/dumb/owner/CalendarNavPill.vue'
  import OwnerDayViewBottomSheet from '@/components/dumb/owner/OwnerDayViewBottomSheet.vue'
  import BookingForm from '@/components/dumb/shared/BookingForm.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import LoadingSpinner from '@/components/dumb/shared/LoadingSpinner.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  // Owner-specific components
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'

  import { useOwnerCalendarState } from '@/composables/owner/useOwnerCalendarState'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  // Business logic composables

  // Import event logger for component communication
  import eventLogger from '@/composables/shared/useComponentEventLogger'
  import { useAuthStore } from '@/stores/auth'

  import { useUIStore } from '@/stores/ui'
  import { subtractOneDay } from '@/utils/calendarHelpers'

  // ============================================================================
  // STORE CONNECTIONS & STATE
  // ============================================================================

  // useRealtimeSync(); // Just call it for side effects
  const uiStore = useUIStore()
  const authStore = useAuthStore()

  // ============================================================================
  // COMPOSABLES - BUSINESS LOGIC
  // ============================================================================
  const {
    myBookings,
    loading: bookingsLoading,
    fetchMyBookings,
    createMyBooking,
    updateMyBooking,
    deleteMyBooking,
  } = useOwnerBookings()

  const {
    myProperties,
    loading: propertiesLoading,
    fetchMyProperties,
    createMyProperty,
    updateMyProperty,
    deleteMyProperty,
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

  // Short label for the floating pill (e.g. "Apr 2026")
  const pillMonthLabel = computed(() =>
    currentDate.value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  )

  // ============================================================================
  // LOCAL STATE
  // ============================================================================
  const initialLoading = ref(true)
  const selectedPropertyFilter = ref<string | null>(null)

  // Day view bottom sheet state
  const dayViewVisible = ref(false)
  const selectedDate = ref<Date | null>(null)
  const selectedDayBookings = ref<Booking[]>([])

  // ============================================================================
  // OWNER-SPECIFIC DATA ACCESS
  // ============================================================================

  // Get current owner's user ID with debugging
  const currentOwnerId = computed(() => {
    const userId = authStore.user?.id
    return userId
  })

  // Check if user is authenticated and is an owner
  const isOwnerAuthenticated = computed(() => {
    const authenticated = !!(authStore.isAuthenticated
      && authStore.user?.role === 'owner'
      && currentOwnerId.value)

    return authenticated
  })

  // ============================================================================
  // COMPUTED STATE - OWNER-FILTERED DATA
  // ============================================================================

  // Fix the infinite loop by using a more stable loading computed
  const loading = computed(() => {
    // Use a simple OR operation without excessive call counting
    // The call counting was useful for debugging but caused performance issues
    return bookingsLoading.value
      || propertiesLoading.value
      || uiStore.isLoading('bookings')
      || uiStore.isLoading('properties')
  })

  // Owner's filtered bookings using composable data
  const ownerFilteredBookings = computed(() => {
    try {
      let bookings = myBookings.value

      // Apply property filter if selected (within owner's properties)
      if (selectedPropertyFilter.value) {
        bookings = bookings.filter(booking =>
          booking.property_id === selectedPropertyFilter.value
          && myProperties.value.some(p => p.id === booking.property_id),
        )
      }

      // Apply calendar state filters
      return filterBookings(bookings)
    } catch (error) {
      console.error('❌ [HomeOwner] Error filtering bookings:', error)
      return []
    }
  })

  // ============================================================================
  // UI STATE - MODAL MANAGEMENT
  // ============================================================================

  // Event Modal
  const eventModalOpen = computed(() => uiStore.isModalOpen('eventModal'))
  const eventModalMode = computed(() => {
    const modal = uiStore.getModalState('eventModal')
    return (modal?.mode as 'create' | 'edit') || 'create'
  })
  const eventModalData = computed(() => {
    const modal = uiStore.getModalState('eventModal')
    return modal?.data as Booking | undefined
  })

  // Property Modal
  const propertyModalOpen = computed(() => uiStore.isModalOpen('propertyModal'))
  const propertyModalMode = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return (modal?.mode as 'create' | 'edit') || 'create'
  })
  const propertyModalData = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return modal?.data as Property | undefined
  })

  // Confirmation Dialog
  const confirmDialogOpen = computed(() => uiStore.isConfirmDialogOpen('confirmDialog'))
  const confirmDialogTitle = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.title || 'Confirm'
  })
  const confirmDialogMessage = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.message || 'Are you sure you want to proceed?'
  })
  const confirmDialogConfirmText = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.confirmText || 'Confirm'
  })
  const confirmDialogCancelText = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.cancelText || 'Cancel'
  })
  const confirmDialogDangerous = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.dangerous || false
  })
  const confirmDialogData = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.data
  })

  // ============================================================================
  // CALENDAR EVENT HANDLERS
  // ============================================================================

  function handleDateSelect (selectInfo: DateSelectArg): void {
    eventLogger.logEvent(
      'FullCalendar',
      'HomeOwner',
      'dateSelect',
      { start: selectInfo.startStr, end: selectInfo.endStr },
      'receive',
    )

    const bookingData: Partial<BookingFormData> = {
      checkin_date: selectInfo.startStr,
      checkout_date: subtractOneDay(selectInfo.endStr),
      owner_id: currentOwnerId.value,
    }

    uiStore.openModal('eventModal', 'create', bookingData)
  }

  function handleEventClick (clickInfo: EventClickArg): void {
    eventLogger.logEvent(
      'FullCalendar',
      'HomeOwner',
      'eventClick',
      { id: clickInfo.event.id },
      'receive',
    )

    // Check if this is an edit event from the bottom sheet
    const extendedProps = clickInfo.event.extendedProps
    if (extendedProps && extendedProps.isEdit && extendedProps.booking) {
      // Use the booking data directly from the bottom sheet
      const booking = extendedProps.booking as Booking
      uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
      return
    }

    // Use extendedProps.booking (works for both ranges and events mode)
    const booking = extendedProps?.booking as Booking | undefined
    if (booking && myBookings.value.some(b => b.id === booking.id)) {
      uiStore.openModal('eventModal', 'edit', booking as unknown as Record<string, unknown>)
    } else {
      console.warn('Cannot edit booking not owned by current user')
    }
  }

  async function handleEventDrop (dropInfo: EventDropArg): Promise<void> {
    const booking = dropInfo.event.extendedProps.booking as Booking

    // Verify owner can modify this booking
    if (!myBookings.value.some(b => b.id === booking.id)) {
      console.warn('Cannot modify booking not owned by current user')
      dropInfo.revert()
      return
    }

    // Prevent multiple simultaneous updates
    if (bookingsLoading.value) {
      console.warn('Update already in progress')
      dropInfo.revert()
      return
    }

    try {
      // Use nextTick to batch reactive updates
      await nextTick()

      const result = await updateMyBooking(booking.id, {
        checkin_date: dropInfo.event.startStr,
        checkout_date: subtractOneDay(dropInfo.event.endStr || dropInfo.event.startStr),
        owner_id: booking.owner_id,
      })

      if (!result) {
        throw new Error('Update failed')
      }

      // Additional nextTick to ensure DOM updates complete
      await nextTick()
    } catch (error) {
      console.error('Failed to update your booking:', error)
      dropInfo.revert()
    }
  }

  async function handleEventResize (resizeInfo: EventResizeDoneArg): Promise<void> {
    const booking = resizeInfo.event.extendedProps.booking as Booking

    // Verify owner can modify this booking
    if (!myBookings.value.some(b => b.id === booking.id)) {
      console.warn('Cannot modify booking not owned by current user')
      resizeInfo.revert()
      return
    }

    // Prevent multiple simultaneous updates
    if (bookingsLoading.value) {
      console.warn('Resize update already in progress')
      resizeInfo.revert()
      return
    }

    try {
      // Use nextTick to batch reactive updates
      await nextTick()

      const result = await updateMyBooking(booking.id, {
        checkin_date: resizeInfo.event.startStr,
        checkout_date: subtractOneDay(resizeInfo.event.endStr || resizeInfo.event.startStr),
        owner_id: booking.owner_id,
      })

      if (!result) {
        throw new Error('Resize update failed')
      }

      // Additional nextTick to ensure DOM updates complete
      await nextTick()
    } catch (error) {
      console.error('Failed to update your booking:', error)
      resizeInfo.revert()
    }
  }

  // ============================================================================
  // CALENDAR CONTROL HANDLERS
  // ============================================================================

  function handleCalendarViewChange (view: string): void {
    // Map CalendarView to FullCalendar view type
    const viewMap: Record<string, 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'> = {
      week: 'timeGridWeek',
      day: 'timeGridDay',
      list: 'listWeek',
      month: 'dayGridMonth',
    }
    setCalendarView(viewMap[view] ?? 'dayGridMonth')
  }

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
      if (!result) {
        throw new Error('Failed to complete booking')
      }
      dayViewVisible.value = false
    } catch (error) {
      console.error('Failed to complete your booking:', error)
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

  function handleCreateBookingFromCalendar (data: { start: string, end: string, propertyId?: string | undefined }): void {
    const bookingData = {
      ...data,
      owner_id: currentOwnerId.value,
    }
    uiStore.openModal('eventModal', 'create', bookingData)
  }

  async function handleUpdateBooking (data: { id: string, start: string, end: string }): Promise<void> {
    if (!myBookings.value.some(b => b.id === data.id)) {
      console.warn('Cannot update booking not owned by current user')
      return
    }

    try {
      const result = await updateMyBooking(data.id, {
        checkin_date: data.start,
        checkout_date: data.end,
        owner_id: currentOwnerId.value,
      })
      if (!result) {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Failed to update your booking:', error)
    }
  }

  // ============================================================================
  // MODAL EVENT HANDLERS
  // ============================================================================

  function handleEventModalClose (): void {
    uiStore.closeModal('eventModal')
  }

  async function handleEventModalSave (data: BookingFormData): Promise<void> {
    try {
      // Ensure owner_id is set
      const bookingData = {
        ...data,
        owner_id: currentOwnerId.value,
      }

      if (eventModalMode.value === 'create') {
        await createMyBooking(bookingData as BookingFormData)
      } else if (eventModalData.value) {
        // eventModalData.value should be the booking directly
        const booking = eventModalData.value

        // Verify owner can update this booking
        if (!booking?.id || !myBookings.value.some(b => b.id === booking.id)) {
          console.error('🚨 [HomeOwner] Booking ownership check failed - booking not found in owner bookings')
          throw new Error('Cannot update booking not owned by current user')
        }
        await updateMyBooking(booking.id, bookingData as Partial<BookingFormData>)
      }
      uiStore.closeModal('eventModal')
    } catch (error) {
      console.error('Failed to save your booking:', error)
    }
  }

  async function handleEventModalDelete (bookingId: string): Promise<void> {
    // Verify owner can delete this booking
    if (!myBookings.value.some(b => b.id === bookingId)) {
      console.warn('Cannot delete booking not owned by current user')
      return
    }

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'booking', id: bookingId },
    })
  }

  function handlePropertyModalClose (): void {
    uiStore.closeModal('propertyModal')
  }

  async function handlePropertyModalSave (data: PropertyFormData): Promise<void> {
    try {
      // Ensure owner_id is set
      const propertyData = {
        ...data,
        owner_id: currentOwnerId.value,
      }

      if (propertyModalMode.value === 'create') {
        await createMyProperty(propertyData as PropertyFormData)
      } else if (propertyModalData.value) {
        // Verify owner can update this property
        if (!myProperties.value.some(p => p.id === propertyModalData.value!.id)) {
          throw new Error('Cannot update property not owned by current user')
        }
        await updateMyProperty(propertyModalData.value.id, propertyData as Partial<PropertyFormData>)
      }
      uiStore.closeModal('propertyModal')
    } catch (error) {
      console.error('Failed to save your property:', error)
    }
  }

  async function handlePropertyModalDelete (propertyId: string): Promise<void> {
    // Verify owner can delete this property
    if (!myProperties.value.some(p => p.id === propertyId)) {
      console.warn('Cannot delete property not owned by current user')
      return
    }

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Property',
      message: 'Are you sure you want to delete this property? This will also delete all associated bookings. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'property', id: propertyId },
    })
  }

  // ============================================================================
  // CONFIRMATION DIALOG HANDLERS
  // ============================================================================

  async function handleConfirmDialogConfirm (): Promise<void> {
    const data = confirmDialogData.value

    if (data?.type === 'booking' && data?.id) {
      try {
        await deleteMyBooking(data.id as string)
        uiStore.closeModal('eventModal')
      } catch (error) {
        console.error('Failed to delete your booking:', error)
      }
    } else if (data?.type === 'property' && data?.id) {
      try {
        await deleteMyProperty(data.id as string)
        uiStore.closeModal('propertyModal')
      } catch (error) {
        console.error('Failed to delete your property:', error)
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

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  onMounted(async () => {
    // Wait for auth to be properly initialized
    if (authStore.loading) {
      const maxWait = 5000 // 5 seconds max
      const startTime = Date.now()
      while (authStore.loading && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    if (isOwnerAuthenticated.value) {
      try {
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
      } catch (error) {
        console.error('❌ [HomeOwner] Failed to load your data:', error)
      } finally {
        initialLoading.value = false
      }
    } else {
      initialLoading.value = false
      console.warn('⚠️ [HomeOwner] User is not authenticated as owner, skipping data load')
    }
  })

  onUnmounted(() => {
  // Cleanup if needed
  })

  // ============================================================================
  // RESPONSIVE BEHAVIOR
  // ============================================================================

  // Watch for authentication changes
  watch(isOwnerAuthenticated, async (newValue, oldValue) => {
    if (newValue && !oldValue) {
      try {
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
      } catch (error) {
        console.error('❌ [HomeOwner] Failed to load data after auth change:', error)
      }
    }
  })
</script>

<style scoped>
/* ================================================================ */
/* MOBILE-FIRST CALENDAR VIEWPORT LAYOUT */
/* ================================================================ */

.home-owner-page {
  /* Use viewport-based height: 100vh minus the app bar.
     --app-bar-height is defined in responsive.scss (64px desktop, 56px mobile).
     This gives the calendar a definite height regardless of the
     flex chain through v-main (which varies by Vuetify version). */
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


/* Leave room below the calendar grid for the floating pill on mobile */
@media (max-width: 599px) {
  .calendar-content {
    padding-bottom: 88px;
  }
}

.calendar-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* CALENDAR ENHANCEMENTS */

/* Enhanced turn booking styling for owners */
:deep(.fc-event.booking-turn) {
  font-weight: 600;
  border-width: 3px !important;
  position: relative;
}

/* Urgent priority styling with owner branding */
:deep(.fc-event.priority-urgent) {
  animation: pulse-owner-urgent 2s infinite;
}

/* ================================================================ */
/* ANIMATIONS */
/* ================================================================ */

@keyframes pulse-owner-urgent {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.8);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(244, 67, 54, 0);
    transform: scale(1.01);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
    transform: scale(1);
  }
}
</style>
