<!-- eslint-disable vue/no-template-shadow -->
<template>
  <div class="admin-calendar-container">
    <!-- Page Header -->
    <div class="page-header" />

    <!-- Calendar Navigation -->
    <div class="calendar-navigation">
      <v-container
        class="pa-0"
        fluid
      >
        <div class="d-flex align-center justify-center">
          <!-- Today Button -->
          <v-btn
            class="text-none mr-2"
            size="small"
            variant="outlined"
            @click="goToToday"
          >
            Today
          </v-btn>

          <!-- Previous Month Button -->
          <v-btn
            color="primary"
            icon="mdi-chevron-left"
            size="x-small"
            variant="elevated"
            @click="navigateToPreviousMonth"
          />

          <!-- Month and Year Display -->
          <div class="calendar-month-year mx-5">
            <h2 class="text-h5 font-weight-bold text-primary">
              {{ getCurrentMonthYear() }}
            </h2>
          </div>

          <!-- Next Month Button -->
          <v-btn
            color="primary"
            icon="mdi-chevron-right"
            size="x-small"
            variant="elevated"
            @click="navigateToNextMonth"
          />

          <v-divider
            class="mx-3"
            vertical
          />

          <!-- Range / Event View Toggle -->
          <v-btn-toggle
            v-model="viewMode"
            class="mr-2"
            color="primary"
            density="compact"
            mandatory
            rounded="pill"
            selected-class="bg-primary text-white"
          >
            <v-btn
              class="text-none"
              size="small"
              value="ranges"
            >
              Range
            </v-btn>

            <v-btn
              class="text-none"
              size="small"
              value="events"
            >
              Event
            </v-btn>
          </v-btn-toggle>

          <!-- View Switcher (Month/Week/Day/List) -->
          <v-select
            v-model="selectViewKey"
            density="compact"
            hide-details
            :items="viewSelectItems"
            style="max-width: 130px;"
            variant="outlined"
          />
        </div>
      </v-container>
    </div>

    <!-- Admin Calendar: Shows all bookings across all properties -->
    <!-- Main Content -->
    <div class="page-content">
      <v-row
        class="fill-height"
        density="compact"
      >
        <!-- Calendar (Full Width) -->
        <v-col
          class="calendar-col"
          cols="12"
          md="12"
        >
          <FullCalendar
            ref="AdminCalendarRef"
            :bookings="calendarBookings"
            class="admin-calendar"
            :loading="loading"
            :properties="calendarProperties"
            :view-mode="viewMode"
            @date-select="handleDateSelect"
            @event-click="handleEventClick"
            @event-drop="handleEventDrop"
            @event-resize="handleEventResize"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Context Menu -->
    <v-menu
      v-model="contextMenu.show"
      absolute
      offset-y
      :position-x="contextMenu.x"
      :position-y="contextMenu.y"
    >
      <v-list density="compact">
        <v-list-item
          v-for="action in contextMenuActions"
          :key="action.key"
          :prepend-icon="action.icon"
          :title="action.title"
          @click="handleContextAction(action.key)"
        />
      </v-list>
    </v-menu>

    <!-- Cleaner Assignment Modal -->
    <CleanerAssignmentModal
      v-model="cleanerAssignmentModal.show"
      :booking="cleanerAssignmentModal.booking"
      :cleaners="cleanerAssignmentModal.cleaners"
      :loading="cleanerAssignmentModal.loading"
      :properties="Array.from(allProperties.values())"
      @assign="handleCleanerAssignment"
      @close="closeCleanerAssignmentModal"
    />

    <!-- Admin Booking Form Modal -->
    <AdminBookingForm
      v-model="adminBookingFormModal.show"
      :booking="adminBookingFormModal.booking"
      :cleaners="allUsers.filter(isCleaner)"
      :errors="adminBookingFormModal.errors"
      :loading="adminBookingFormModal.loading"
      :mode="adminBookingFormModal.mode"
      :properties="Array.from(allProperties.values())"
      @assign-cleaner="handleAdminBookingFormAssignCleaner"
      @delete="handleAdminBookingFormDelete"
      @mark-complete="handleAdminBookingFormMarkComplete"
      @open-cleaner-modal="handleAdminBookingFormOpenCleanerModal"
      @submit="handleAdminBookingFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types/booking.ts'
  import type { Cleaner } from '@/types/user.ts'
  import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'

  import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
  import AdminBookingForm from '@/components/dumb/admin/AdminBookingForm.vue'
  import CleanerAssignmentModal from '@/components/dumb/admin/CleanerAssignmentModal.vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings.ts'
  import { useAdminCalendarState } from '@/composables/admin/useAdminCalendarState.ts'
  import { useAdminUserManagement } from '@/composables/admin/useAdminUserManagement.ts'
  import { useUIStore } from '@/stores/ui'
  import { isCleaner } from '@/types/user'
  import { subtractOneDay } from '@/utils/calendarHelpers'

  // Lazy-load the FullCalendar wrapper so the heavy @fullcalendar/*
  // packages (~250 kB) only download when the schedule route is visited.
  const FullCalendar = defineAsyncComponent(() =>
    import('@/components/smart/shared/FullCalendar.vue'),
  )

  // Use the admin calendar state composable for centralized state management
  const {
    // State
    loading,

    currentView,
    currentDate,

    // Computed properties (Maps from store)
    allBookings,
    allProperties,

    // Functions
    setCalendarView,
    goToDate,
  } = useAdminCalendarState()

  // Convert Maps to arrays for FullCalendar props (which expect Booking[]/Property[])
  const calendarBookings = computed(() => Array.from(allBookings.value.values()))
  const calendarProperties = computed(() => Array.from(allProperties.value.values()))

  // Shared calendar state (singleton) — gives us viewMode
  const { viewMode } = useAdminCalendarState()

  // Additional composables for admin functionality
  const { updateBooking, deleteBooking, createBooking, assignCleanerToBooking } = useAdminBookings()
  const { users: allUsers } = useAdminUserManagement()

  // UI store for notifications
  const uiStore = useUIStore()

  // Calendar reference
  const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

  // View switcher options (matching owner layout)
  const viewOptions = [
    { value: 'month', label: 'Month', icon: 'mdi-calendar-month-outline' },
    { value: 'week', label: 'Week', icon: 'mdi-calendar-week-outline' },
    { value: 'day', label: 'Day', icon: 'mdi-calendar-today-outline' },
    { value: 'list', label: 'List', icon: 'mdi-format-list-bulleted' },
  ] as const

  const activeViewKey = computed(() => {
    const v = currentView.value
    if (v === 'timeGridWeek') return 'week'
    if (v === 'timeGridDay') return 'day'
    if (v === 'listWeek') return 'list'
    return 'month'
  })

  const viewSelectItems = viewOptions.map(option => ({
    title: option.label,
    value: option.value,
  }))

  const selectViewKey = computed({
    get: () => activeViewKey.value,
    set: (key: string) => switchView(key),
  })

  function switchView (key: string) {
    const viewMap: Record<string, 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'> = {
      week: 'timeGridWeek',
      day: 'timeGridDay',
      list: 'listWeek',
      month: 'dayGridMonth',
    }
    const newView = viewMap[key] ?? 'dayGridMonth'
    setCalendarView(newView)
    if (calendarRef.value) {
      calendarRef.value.changeView(newView)
    }
  }

  function goToToday () {
    currentViewingDate.value = new Date()
    goToDateInCalendar(new Date())
  }

  // Component state
  const currentViewingDate = ref(new Date())

  // Context menu state
  const contextMenu = ref({
    show: false,
    x: 0,
    y: 0,
    booking: null as Booking | null,
  })

  // Cleaner assignment modal state
  const cleanerAssignmentModal = ref({
    show: false,
    booking: null as Booking | null,
    cleaners: [] as Cleaner[],
    loading: false,
  })

  // Admin booking form modal state
  const adminBookingFormModal = ref({
    show: false,
    mode: 'edit' as 'create' | 'edit',
    booking: null as Booking | null,
    loading: false,
    errors: new Map<string, string[]>(),
  })

  // Context menu actions
  const contextMenuActions = computed(() => {
    if (!contextMenu.value.booking) return []

    const booking = contextMenu.value.booking
    const actions = [
      {
        key: 'view',
        title: 'View Details',
        icon: 'mdi-eye',
      },
      {
        key: 'edit',
        title: 'Edit Booking',
        icon: 'mdi-pencil',
      },
    ]

    // Add cleaner assignment action if no cleaner assigned
    if (!booking.assigned_cleaner_id) {
      actions.push({
        key: 'assign',
        title: 'Assign Cleaner',
        icon: 'mdi-account-plus',
      })
    }

    // Add status change actions
    if (booking.status !== 'completed') {
      actions.push({
        key: 'complete',
        title: 'Mark Complete',
        icon: 'mdi-check-circle',
      })
    }

    if (booking.status !== 'cancelled') {
      actions.push({
        key: 'cancel',
        title: 'Cancel Booking',
        icon: 'mdi-close-circle',
      })
    }

    return actions
  })

  // Event handlers - simplified using composable
  function handleDateSelect (selectInfo: DateSelectArg): void {
    console.log('🗓️ [AdminCalendar] Date selected:', selectInfo.startStr, 'to', selectInfo.endStr)
  // Handle date selection - could open booking creation modal
  }

  function handleEventClick (clickInfo: EventClickArg): void {
    console.log('👆 [AdminCalendar] Event clicked:', clickInfo.event.id)

    // Extract booking data from the event
    const booking = clickInfo.event.extendedProps.booking as Booking
    if (booking) {
      // Open the AdminBookingForm modal in edit mode
      openAdminBookingFormModal(booking, 'edit')
    }
  }

  async function handleEventDrop (dropInfo: EventDropArg): Promise<void> {
    console.log('🎯 [AdminCalendar] Event dropped:', dropInfo.event.id)
    const booking = dropInfo.event.extendedProps.booking as Booking

    try {
      await updateBooking(booking.id, {
        checkin_date: dropInfo.event.startStr,
        checkout_date: subtractOneDay(dropInfo.event.endStr || dropInfo.event.startStr),
      })
    } catch (error) {
      console.error('Failed to update booking:', error)
      dropInfo.revert()
    }
  }

  async function handleEventResize (resizeInfo: EventResizeDoneArg): Promise<void> {
    console.log('🔄 [AdminCalendar] Event resized:', resizeInfo.event.id)
    const booking = resizeInfo.event.extendedProps.booking as Booking

    try {
      await updateBooking(booking.id, {
        checkin_date: resizeInfo.event.startStr,
        checkout_date: subtractOneDay(resizeInfo.event.endStr),
      })
    } catch (error) {
      console.error('Failed to update booking:', error)
      resizeInfo.revert()
    }
  }

  // Programmatic calendar methods
  function goToDateInCalendar (date: string | Date): void {
    console.log('🗓️ [AdminCalendar] goToDate called:', date)
    const targetDate = typeof date === 'string' ? new Date(date) : date

    if (calendarRef.value) {
      calendarRef.value.goToDate(targetDate)
    }
  }

  function changeView (view: string): void {
    console.log('👁️ [AdminCalendar] changeView called:', view)

    if (calendarRef.value) {
      calendarRef.value.changeView(view)
    }
    setCalendarView(view as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay')
  }

  function refreshEvents (): void {
    console.log('🔄 [AdminCalendar] refreshEvents called')
    if (calendarRef.value) {
      calendarRef.value.refreshEvents()
    }
  }

  function getApi () {
    return calendarRef.value?.getApi() || null
  }

  // Calendar navigation functions
  function getCurrentMonthYear () {
    return currentViewingDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  function navigateToPreviousMonth () {
    const newDate = new Date(currentViewingDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentViewingDate.value = newDate
    goToDateInCalendar(newDate)
  }

  function navigateToNextMonth () {
    const newDate = new Date(currentViewingDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentViewingDate.value = newDate
    goToDateInCalendar(newDate)
  }

  // Context menu handlers
  async function handleContextAction (action: string): Promise<void> {
    const booking = contextMenu.value.booking
    if (!booking) return

    switch (action) {
      case 'view': {
        openAdminBookingFormModal(booking, 'edit')
        break
      }
      case 'edit': {
        openAdminBookingFormModal(booking, 'edit')
        break
      }
      case 'assign': {
        openCleanerAssignmentModal(booking)
        break
      }
      case 'complete': {
        try {
          await updateBooking(booking.id, { status: 'completed' })
          uiStore.addNotification('success', 'Updated', 'Booking marked as completed')
        } catch (error) {
          console.error('Failed to complete booking:', error)
          uiStore.addNotification('error', 'Update Failed', error instanceof Error ? error.message : 'Could not complete booking')
        }
        break
      }
      case 'cancel': {
        try {
          await updateBooking(booking.id, { status: 'cancelled' })
          uiStore.addNotification('success', 'Updated', 'Booking cancelled')
        } catch (error) {
          console.error('Failed to cancel booking:', error)
          uiStore.addNotification('error', 'Update Failed', error instanceof Error ? error.message : 'Could not cancel booking')
        }
        break
      }
    }

    contextMenu.value.show = false
  }

  // Admin booking form modal handlers
  function openAdminBookingFormModal (booking: Booking, mode: 'create' | 'edit' = 'edit'): void {
    adminBookingFormModal.value = {
      show: true,
      mode,
      booking: mode === 'edit' ? booking : null,
      loading: false,
      errors: new Map<string, string[]>(),
    }
  }

  function closeAdminBookingFormModal (): void {
    adminBookingFormModal.value.show = false
    adminBookingFormModal.value.booking = null
    adminBookingFormModal.value.loading = false
    adminBookingFormModal.value.errors = new Map<string, string[]>()
  }

  function openCleanerAssignmentModal (booking: Booking): void {
    const cleaners = allUsers.value.filter(u => isCleaner(u))

    cleanerAssignmentModal.value = {
      show: true,
      booking,
      cleaners,
      loading: false,
    }
  }

  function closeCleanerAssignmentModal (): void {
    cleanerAssignmentModal.value.show = false
    cleanerAssignmentModal.value.booking = null
    cleanerAssignmentModal.value.cleaners = []
    cleanerAssignmentModal.value.loading = false
  }

  async function handleCleanerAssignment (cleanerId: string): Promise<void> {
    cleanerAssignmentModal.value.loading = true

    try {
      const booking = cleanerAssignmentModal.value.booking
      if (booking) {
        await assignCleanerToBooking(booking.id, cleanerId)
        uiStore.addNotification('success', 'Assigned', 'Cleaner assigned successfully')
      }
      closeCleanerAssignmentModal()
    } catch (error) {
      console.error('Failed to assign cleaner:', error)
      uiStore.addNotification('error', 'Assignment Failed', error instanceof Error ? error.message : 'Could not assign cleaner')
    } finally {
      cleanerAssignmentModal.value.loading = false
    }
  }

  // Admin booking form event handlers
  async function handleAdminBookingFormSubmit (data: BookingFormData): Promise<void> {
    adminBookingFormModal.value.loading = true
    try {
      if (adminBookingFormModal.value.mode === 'create') {
        await createBooking(data)
        uiStore.addNotification('success', 'Created', 'Booking created successfully')
      } else if (adminBookingFormModal.value.booking) {
        await updateBooking(adminBookingFormModal.value.booking.id, data)
        uiStore.addNotification('success', 'Updated', 'Booking updated successfully')
      }
      closeAdminBookingFormModal()
    } catch (error) {
      console.error('Failed to save booking:', error)
      uiStore.addNotification('error', 'Save Failed', error instanceof Error ? error.message : 'Could not save booking')
    } finally {
      adminBookingFormModal.value.loading = false
    }
  }

  async function handleAdminBookingFormDelete (bookingId: string): Promise<void> {
    adminBookingFormModal.value.loading = true
    try {
      await deleteBooking(bookingId)
      uiStore.addNotification('success', 'Deleted', 'Booking deleted successfully')
      closeAdminBookingFormModal()
    } catch (error) {
      console.error('Failed to delete booking:', error)
      uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete booking')
    } finally {
      adminBookingFormModal.value.loading = false
    }
  }

  async function handleAdminBookingFormMarkComplete (bookingId: string): Promise<void> {
    adminBookingFormModal.value.loading = true
    try {
      await updateBooking(bookingId, { status: 'completed' })
      uiStore.addNotification('success', 'Completed', 'Booking marked as completed')
      closeAdminBookingFormModal()
    } catch (error) {
      console.error('Failed to mark booking complete:', error)
      uiStore.addNotification('error', 'Update Failed', error instanceof Error ? error.message : 'Could not complete booking')
    } finally {
      adminBookingFormModal.value.loading = false
    }
  }

  async function handleAdminBookingFormAssignCleaner (bookingId: string, cleanerId: string): Promise<void> {
    try {
      await updateBooking(bookingId, { assigned_cleaner_id: cleanerId })
      uiStore.addNotification('success', 'Assigned', 'Cleaner assigned successfully')
    } catch (error) {
      console.error('Failed to assign cleaner:', error)
      uiStore.addNotification('error', 'Assignment Failed', error instanceof Error ? error.message : 'Could not assign cleaner')
    }
  }

  function handleAdminBookingFormOpenCleanerModal (booking: Partial<Record<string, unknown>>): void {
    console.log('Open cleaner modal for booking:', booking)
  // Could implement cleaner modal logic here
  }

  // Watchers
  watch(() => currentView.value, newView => {
    console.log('🎯 [AdminCalendar] Current view changed from parent:', newView)

    nextTick(() => {
      if (newView && calendarRef.value) {
        changeView(newView)
      }
    })
  })

  watch(() => currentDate.value, newDate => {
    console.log('📅 [AdminCalendar] Current date changed from parent:', newDate)

    nextTick(() => {
      if (newDate && calendarRef.value) {
        goToDate(newDate)
      }
    })
  })

  onMounted(async () => {
    console.log('🎬 [AdminCalendar] Component mounted')
    await nextTick()
    console.log('🔗 [AdminCalendar] Component ready')
  })

  // Expose methods to parent
  defineExpose({
    goToDate,
    changeView,
    refreshEvents,
    getApi,
  })
</script>

<style scoped>
.admin-calendar-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
}

.calendar-navigation {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 0px 0;
}

.calendar-month-year {
  min-width: 250px;
  text-align: center;
}

.calendar-month-year h2 {
  margin: 0;
  color: rgb(var(--v-theme-primary));
}

.page-content {
  flex-grow: 1;
  overflow: hidden;
}

.sidebar-col {
  border-right: 1px solid rgb(var(--v-theme-surface-variant));
  height: 100%;
  overflow-y: auto;
}

.calendar-col {
  height: 100%;
  overflow: hidden;
}

@media (max-width: 960px) {
  .sidebar-col {
    border-right: none;
    border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  }

  .calendar-navigation {
    padding: 0px 0;
  }

  .calendar-month-year {
    min-width: 200px;
  }

  .calendar-month-year h2 {
    font-size: 1.3rem;
  }
}
.admin-calendar-container{
  margin-top: 0px;
}
.v-btn{
  margin-top: 0px;
}
/* Mobile optimizations */
@media (max-width: 768px) {
  .admin-calendar {
    min-height: 100vh;
  }
}
</style>
