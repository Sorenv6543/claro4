<template>
  <div class="owner-calendar-container">
    <div v-if="legendItems.length > 1" class="owner-cal-legend">
      <div
        v-for="item in legendItems"
        :key="item.id"
        class="owner-cal-legend__item"
      >
        <span class="owner-cal-legend__dot" :style="{ background: item.color }" />
        <span class="owner-cal-legend__label">{{ item.label }}</span>
      </div>
    </div>

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
  import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
  import LoadingSpinner from '@/components/dumb/shared/LoadingSpinner.vue'
  import { useCalendarState } from '@/composables/shared/useCalendarState'
  import { formatPropertyAddress } from '@/types/property'

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

  const legendItems = computed(() =>
    props.properties.map(p => ({
      id: p.id,
      color: p.color,
      label: formatPropertyAddress(p, 'short'),
    })),
  )

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

  // ===== LIFECYCLE =====

  onMounted(async () => {
    await nextTick()
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
/* PROPERTY LEGEND STRIP */
/* ================================================================ */

.owner-cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px var(--claro-space-md);
  padding: 6px var(--claro-space-md);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
}

.owner-cal-legend__item {
  display: flex;
  align-items: center;
  gap: var(--claro-space-xs);
}

.owner-cal-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.owner-cal-legend__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--claro-text-secondary);
  white-space: nowrap;
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
    height: calc(100dvh - var(--claro-app-bar-height));
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
  -moz-user-select: none;
  -ms-user-select: none;
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
