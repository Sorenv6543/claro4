<template>
  <div
    class="owner-calendar-container"
    @touchend.passive="onTouchEnd"
    @touchstart.passive="onTouchStart"
  >
    <FullCalendar
      ref="calendarRef"
      :bookings="props.bookings"
      class="owner-calendar"
      :loading="props.loading"
      :properties="props.properties"
      @create-booking="handleCreateBooking"
      @date-select="handleDateSelect"
      @dates-set="handleDatesSet"
      @day-view-open="handleDayViewOpen"
      @event-click="handleEventClick"
      @event-drop="handleEventDrop"
      @event-resize="handleEventResize"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Booking, Property } from '@/types'
  import type { DateSelectArg, DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import type { Ref } from 'vue'
  import { defineAsyncComponent, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import LoadingSpinner from '@/components/dumb/shared/LoadingSpinner.vue'
  import { useCalendarState } from '@/composables/shared/useCalendarState'

  // Lazy-load the FullCalendar wrapper so the heavy @fullcalendar/*
  // packages (~250 kB) only download when a calendar route is visited.
  const FullCalendar = defineAsyncComponent({
    loader: () => import('@/components/smart/shared/FullCalendar.vue'),
    loadingComponent: LoadingSpinner,
    delay: 200,
  })

  interface Props {
    bookings: Booking[]
    properties: Property[]
    loading?: boolean
    currentView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
    currentDate?: Date
  }

  interface Emits {
    (e: 'date-select', selectInfo: DateSelectArg): void
    (e: 'event-click', clickInfo: EventClickArg): void
    (e: 'event-drop', dropInfo: EventDropArg): void
    (e: 'event-resize', resizeInfo: EventResizeDoneArg): void
    (e: 'create-booking', data: { start: string, end: string, propertyId?: string }): void
    (e: 'view-change', view: string): void
    (e: 'date-change', date: Date): void
    (e: 'day-view-open', payload: { date: Date, bookings: Booking[] }): void
    (e: 'dates-set', arg: DatesSetArg): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    currentView: 'timeGridWeek',
    currentDate: () => new Date(),
  })

  const emit = defineEmits<Emits>()

  const { goToDate: calendarStateGoToDate } = useCalendarState()

  // ===== REFS AND REACTIVE DATA =====
  const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

  // Register this component's prev/next with the layout so the app bar can drive navigation
  const calendarNavPrev = inject<Ref<(() => void) | null>>('ownerCalNavPrev')
  const calendarNavNext = inject<Ref<(() => void) | null>>('ownerCalNavNext')
  onMounted(() => {
    if (calendarNavPrev) calendarNavPrev.value = prev
    if (calendarNavNext) calendarNavNext.value = next
  })
  onUnmounted(() => {
    if (calendarNavPrev) calendarNavPrev.value = null
    if (calendarNavNext) calendarNavNext.value = null
  })

  // ===== SWIPE NAVIGATION =====
  let touchStartX = 0

  function onTouchStart (e: TouchEvent): void {
    touchStartX = e.touches[0]?.clientX ?? 0
  }

  function onTouchEnd (e: TouchEvent): void {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX
    if (Math.abs(dx) < 50) return
    if (dx < 0) next()
    else prev()
  }

  // ===== EVENT HANDLERS (SAFE - SIMPLE EMIT PATTERNS) =====

  function handleDateSelect (selectInfo: DateSelectArg): void {
    emit('date-select', selectInfo)
  }

  function handleEventClick (clickInfo: EventClickArg): void {
    emit('event-click', clickInfo)
  }

  function handleEventDrop (dropInfo: EventDropArg): void {
    emit('event-drop', dropInfo)
  }

  function handleEventResize (resizeInfo: EventResizeDoneArg): void {
    emit('event-resize', resizeInfo)
  }

  function handleCreateBooking (data: { start: string, end: string, propertyId?: string }): void {
    emit('create-booking', data)
  }

  function handleDayViewOpen (payload: { date: Date, bookings: Booking[] }): void {
    emit('day-view-open', payload)
  }

  function handleDatesSet (arg: DatesSetArg): void {
    calendarStateGoToDate(arg.view.currentStart)
    emit('dates-set', arg)
  }

  // ===== PROGRAMMATIC CALENDAR METHODS =====

  function goToDate (date: string | Date): void {
    const targetDate = typeof date === 'string' ? new Date(date) : date
    if (calendarRef.value) {
      calendarRef.value.goToDate(targetDate)
    }
    emit('date-change', targetDate)
  }

  function prev (): void {
    const api = calendarRef.value?.getApi()
    if (api) api.prev()
  }

  function next (): void {
    const api = calendarRef.value?.getApi()
    if (api) api.next()
  }

  function changeView (view: string): void {
    if (calendarRef.value) {
      calendarRef.value.changeView(view)
    }
    emit('view-change', view)
  }

  function refreshEvents (): void {
    if (calendarRef.value) {
      calendarRef.value.refreshEvents()
    }
  }

  function getApi () {
    return calendarRef.value?.getApi() || null
  }

  // ===== WATCHERS (SAFE - SIMPLE, NON-CIRCULAR) =====

  // Watch for view changes from parent — sync to FullCalendar without emitting
  // (avoids circular: singleton update → prop change → emit → handler → loop)
  watch(() => props.currentView, newView => {
    nextTick(() => {
      if (newView && calendarRef.value) {
        calendarRef.value.changeView(newView)
      }
    })
  })

  // Watch for date changes from parent — sync to FullCalendar without emitting.
  // Guard: only call goToDate if FullCalendar isn't already on this date,
  // preventing the circular loop (prop change → goToDate → datesSet → singleton update → prop change).
  watch(() => props.currentDate, newDate => {
    nextTick(() => {
      if (newDate && calendarRef.value) {
        const api = calendarRef.value.getApi?.()
        const currentCalDate = api?.getDate?.()
        if (!currentCalDate || currentCalDate.getTime() !== newDate.getTime()) {
          calendarRef.value.goToDate(newDate)
        }
      }
    })
  })

  // ===== EXPOSE METHODS TO PARENT =====
  defineExpose({
    goToDate,
    prev,
    next,
    changeView,
    refreshEvents,
    getApi,
  })
</script>

<style scoped>
.owner-calendar-container {
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ================================================================ */
/* CALENDAR AREA */
/* ================================================================ */

.owner-calendar {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  position: relative;
}

/* ================================================================ */
/* OWNER-SPECIFIC FULLCALENDAR STYLING */
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
}

/* Owner calendar specific adjustments */
:deep(.fc-header-toolbar) {
  margin-bottom: 0.5em;
}

:deep(.fc-daygrid-day-number) {
  font-weight: 500;
}

:deep(.fc-col-header-cell) {
  background: var(--claro-surface-variant);
}

/* ================================================================ */
/* ANIMATIONS FOR OWNER CALENDAR */
/* ================================================================ */

@keyframes pulse-owner-urgent {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--claro-turn-urgent) 80%, transparent);
    transform: scale(1);
  }

  70% {
    box-shadow: 0 0 0 6px transparent;
    transform: scale(1.01);
  }

  100% {
    box-shadow: 0 0 0 0 transparent;
    transform: scale(1);
  }
}

/* ================================================================ */
/* MOBILE OPTIMIZATIONS */
/* ================================================================ */

@media (max-width: 768px) {
  .owner-calendar-container {
    height: 100%;
  }

  :deep(.fc-header-toolbar) {
    flex-direction: column;
    gap: 0.5em;
  }

  :deep(.fc-toolbar-chunk) {
    display: flex;
    justify-content: center;
  }

  :deep(.fc-button) {
    font-size: 0.875rem;
    padding: 0.5em 0.75em;
  }
}

/* ================================================================ */
/* TOUCH GESTURE OPTIMIZATIONS */
/* ================================================================ */

/* Ensure calendar area is touch-friendly */
.owner-calendar {
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

/* Prevent text selection during swipes */
.owner-calendar-container {
  user-select: none;
  -webkit-user-select: none;
}

/* Smooth transitions for swipe gestures */
:deep(.fc-view-harness) {
  transition: transform 0.2s ease-out;
}

/* ================================================================ */
/* ACCESSIBILITY */
/* ================================================================ */

/* High contrast mode support */
@media (prefers-contrast: high) {
  :deep(.fc-event) {
    border-width: 2px !important;
  }

  :deep(.fc-button) {
    border-width: 2px !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  :deep(.fc-view-harness) {
    transition: none;
  }

  :deep(.fc-event.priority-urgent) {
    animation: none;
  }
}
</style>
