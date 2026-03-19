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
    <!-- Calendar -->
    <div class="calendar-layout">
      <!-- Calendar Header - Fixed height -->
      <v-card
        class="calendar-header-card shrink-0 prominent-header"
        density="compact"
        elevation="3"
        flat
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <!-- Left Navigation Arrow -->
            <v-btn
              class="nav-arrow-prominent"
              color="primary"
              density="comfortable"
              icon="mdi-chevron-left"
              size="default"
              variant="elevated"
              @click="handlePrevious"
            />

            <!-- Centered Month Display -->
            <div class="month-display-prominent">
              <div class="month-title">
                {{ formattedMonthYear }}
              </div>
            </div>

            <!-- Right Navigation Arrow -->
            <v-btn
              class="nav-arrow-prominent"
              color="primary"
              density="comfortable"
              icon="mdi-chevron-right"
              size="default"
              variant="elevated"
              @click="handleNext"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Calendar Content - Flexible height -->
      <div class="calendar-content grow">
        <OwnerCalendar
          ref="calendarRef"
          :bookings="ownerFilteredBookings"
          :current-date="currentDate"
          :current-view="currentView"
          :loading="loading"
          :properties="myProperties"
          @create-booking="handleCreateBookingFromCalendar"
          @date-change="handleCalendarDateChange"
          @date-select="handleDateSelect"
          @event-click="handleEventClick"
          @event-drop="handleEventDrop"
          @event-resize="handleEventResize"
          @update-booking="handleUpdateBooking"
          @view-change="handleCalendarViewChange"
        />
      </div>
    </div>

    <!-- Owner-focused Modals -->
    <BookingForm
      :booking="eventModalMode === 'edit' ? eventModalData : undefined"
      :initial-data="eventModalMode === 'create' ? eventModalData : undefined"
      :mode="eventModalMode"
      :open="eventModalOpen"
      @close="handleEventModalClose"
      @delete="handleEventModalDelete"
      @save="handleEventModalSave"
    />

    <PropertyModal
      :mode="propertyModalMode"
      :open="propertyModalOpen"
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
  import BookingForm from '@/components/dumb/shared/BookingForm.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'

  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  // Owner-specific components
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'

  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useCalendarState } from '@/composables/shared/useCalendarState'
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
    goToDate,
    next,
    prev,
  } = useCalendarState()

  // ============================================================================
  // LOCAL STATE
  // ============================================================================
  const calendarRef = ref<InstanceType<typeof OwnerCalendar> | null>(null)
  const selectedPropertyFilter = ref<string | null>(null)

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

  const formattedMonthYear = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    }
    return currentDate.value.toLocaleDateString('en-US', options)
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
      checkout_date: selectInfo.endStr,
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

    // Fallback: Only allow editing owner's bookings
    const booking = myBookings.value.find(b => b.id === clickInfo.event.id)
    if (booking) {
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

  function handlePrevious (): void {
    prev()
    const calendarApi = calendarRef.value?.getApi?.()
    if (calendarApi) {
      calendarApi.prev()
    }
  }

  function handleNext (): void {
    next()
    const calendarApi = calendarRef.value?.getApi?.()
    if (calendarApi) {
      calendarApi.next()
    }
  }

  function handleCalendarViewChange (view: string): void {
    // Map CalendarView to FullCalendar view type
    const calendarView = view === 'week'
      ? 'timeGridWeek'
      : (view === 'day'
        ? 'timeGridDay'
        : 'dayGridMonth')
    setCalendarView(calendarView)
  }

  function handleCalendarDateChange (date: Date): void {
    goToDate(date)
    const calendarApi = calendarRef.value?.getApi?.()
    if (calendarApi) {
      calendarApi.gotoDate(date)
    }
  }

  function handleCreateBookingFromCalendar (data: { start: string, end: string, propertyId?: string | undefined }): void {
    const bookingData = {
      ...data,
      owner_id: currentOwnerId.value,
    }
    uiStore.openModal('eventModal', 'create', bookingData)
  }

  function handleUpdateBooking (data: { id: string, start: string, end: string }): void {
    // Verify owner can update this booking
    if (!myBookings.value.some(b => b.id === data.id)) {
      console.warn('Cannot update booking not owned by current user')
      return
    }

    updateMyBooking(data.id, {
      checkin_date: data.start,
      checkout_date: data.end,
      owner_id: currentOwnerId.value,
    })
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

  console.log('🔄 [HomeOwner] Script setup running...')

  // Watch for template rendering (proper debugging)
  watch(isOwnerAuthenticated, newValue => {
    console.log('🎨 [HomeOwner] Template will render, isOwnerAuthenticated:', newValue)
  }, { immediate: true })

  onMounted(async () => {
    console.log('🚀 [HomeOwner] Component mounted successfully!')
    // Wait for auth to be properly initialized
    if (authStore.loading) {
      console.log('⏳ [HomeOwner] Auth store still loading, waiting...')
      const maxWait = 5000 // 5 seconds max
      const startTime = Date.now()
      while (authStore.loading && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    console.log('🔍 [HomeOwner] Auth state after waiting:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      loading: authStore.loading,
      isOwnerAuthenticated: isOwnerAuthenticated.value,
    })
    if (isOwnerAuthenticated.value) {
      console.log('✅ [HomeOwner] User is authenticated as owner, loading data...')
      try {
        // Fetch data using composable methods
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
        console.log('✅ [HomeOwner] Owner data loaded successfully')

        // Debug data after loading
        console.log('🔍 [HomeOwner] Data state after loading:', {
          ownerProperties: myProperties.value.length,
          ownerBookings: myBookings.value.length,
          filteredBookings: ownerFilteredBookings.value.length,
        })
      } catch (error) {
        console.error('❌ [HomeOwner] Failed to load your data:', error)
      }
    } else {
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
    console.log('🔄 [HomeOwner] isOwnerAuthenticated changed:', {
      from: oldValue,
      to: newValue,
      user: authStore.user,
    })
    if (newValue && !oldValue) {
      // User became authenticated - load data
      console.log('✅ [HomeOwner] User became authenticated, loading data...')
      try {
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
        console.log('✅ [HomeOwner] Data loaded after auth change')
      } catch (error) {
        console.error('❌ [HomeOwner] Failed to load data after auth change:', error)
      }
    } else if (!newValue && oldValue) {
      // User became unauthenticated - could clear data if needed
      console.log('⚠️ [HomeOwner] User became unauthenticated')
    }
  })
</script>

<style scoped>
/* ================================================================ */
/* MOBILE-FIRST CALENDAR VIEWPORT LAYOUT */
/* ================================================================ */

.home-owner-page {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header-card {
  flex-shrink: 0;
  border-bottom: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  /* Fixed height for consistent layout calculations */
  height: 48px;
  min-height: 48px;
  max-height: 48px;
}

.prominent-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.9) 100%) !important;
  border-bottom: 3px solid rgba(var(--v-theme-secondary), 0.8) !important;
  height: 70px !important;
  min-height: 70px !important;
  max-height: 70px !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.25) !important;
}

.calendar-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  /* Height is managed by flexbox within .calendar-layout */
}

/* Clean Calendar Header Layout */

/* Simple Navigation Arrows */
.nav-arrow-simple {
  border-radius: 8px !important;
  color: #666 !important;
  border: 1px solid #e0e0e0 !important;
  background: #ffffff !important;
}

.nav-arrow-simple:hover {
  background: #f5f5f5 !important;
  color: #333 !important;
  border-color: #ccc !important;
}

/* Prominent Navigation Arrows */
.nav-arrow-prominent {
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  color: rgb(var(--v-theme-primary)) !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s ease !important;
}

.nav-arrow-prominent:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

/* Centered Month Pill Display */
.month-pill-display {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 24px;
  border-radius: 20px;
  text-align: center;
  min-width: 140px;
  border: 1px solid #bbdefb;
}

/* Prominent Month Display */
.month-display-prominent {
  background: rgba(255, 255, 255, 0.95);
  color: rgb(var(--v-theme-primary));
  padding: 8px 24px;
  border-radius: 16px;
  text-align: center;
  min-width: 200px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.month-title {
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.2;
  color: rgb(var(--v-theme-primary));
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.month-subtitle {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--v-theme-primary), 0.8);
  line-height: 1;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ================================================================ */
/* RESPONSIVE MOBILE-FIRST ENHANCEMENTS */
/* ================================================================ */

/* Mobile viewport stretching with safe area support */
@media (max-width: 959px) {
  .home-owner-page {

    /* Support for devices with notches/safe areas */
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
  }

  .calendar-header-card .v-card-text {
    padding: 4px 8px !important;
  }

  .prominent-header {
    height: 60px !important;
    min-height: 60px !important;
    max-height: 60px !important;
  }

  .calendar-content {
    height: calc(100% - 60px) !important;
  }

  /* Compact navigation on mobile */
  .month-pill-display {
    font-size: 0.9rem !important;
    padding: 6px 14px;
    min-width: 120px;
  }

  .month-display-prominent {
    min-width: 160px !important;
    padding: 6px 16px !important;
  }

  .month-title {
    font-size: 1rem !important;
  }

  .month-subtitle {
    font-size: 0.7rem !important;
  }

  .nav-arrow-simple {
    min-width: 32px !important;
    width: 32px !important;
    height: 32px !important;
  }

  .nav-arrow-prominent {
    min-width: 40px !important;
    width: 40px !important;
    height: 40px !important;
  }

  /* More compact buttons on mobile */
  .calendar-header-card .v-btn {
    min-width: auto !important;
  }
}

/* Tablet optimizations */
@media (min-width: 600px) and (max-width: 959px) {
  .calendar-header-card .v-card-text {
    padding: 12px 16px !important;
  }

  /* Medium navigation on tablet */
  .month-pill-display {
    font-size: 1rem !important;
    padding: 10px 20px;
    min-width: 130px;
  }
}

/* Desktop optimizations */
@media (min-width: 960px) {
  /* Full size navigation on desktop */
  .month-pill-display {
    font-size: 1.1rem !important;
    padding: 12px 24px;
    min-width: 140px;
  }
}

/* ================================================================ */
/* CALENDAR ENHANCEMENTS */
/* ================================================================ */

/* Enhanced turn booking styling for owners */
:deep(.fc-event.booking-turn) {
  font-weight: 600;
  border-width: 3px !important;
  position: relative;
}

/* Urgent priority styling with owner branding */
:deep(.fc-event.priority-urgent) {
  animation: pulse-owner-urgent 2s infinite;
  border-color: #d32f2f !important;
}

/* High priority styling */
:deep(.fc-event.priority-high) {
  border-left: 4px solid #ff9800 !important;
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

/* ================================================================ */
</style>
