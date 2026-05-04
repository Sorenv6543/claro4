<template>
  <div
    class="owner-calendar-container"
    @touchend.passive="onTouchEnd"
    @touchstart.passive="onTouchStart"
  >
    <!-- Month nav strip — sits flush above the weekday header row -->
    <div class="cal-nav-strip">

      <!-- Left spacer — mirrors the cog width so the center group is truly centered -->
      <div class="cal-nav-side" />

      <!-- Center: arrows + label + dropdown chevron -->
      <div class="cal-nav-center">
        <button
          aria-label="Previous period"
          class="cal-nav-btn"
          type="button"
          @click="prev"
        >
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>

        <span class="cal-nav-label">{{ calendarNavLabel }}</span>

        <button
          aria-label="Next period"
          class="cal-nav-btn"
          type="button"
          @click="next"
        >
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>

        <!-- Dropdown chevron — opens mini month picker -->
        <v-menu
          v-model="miniCalOpen"
          :close-on-content-click="false"
          location="bottom center"
          offset="4"
        >
          <template #activator="{ props: menuProps }">
            <button
              aria-label="Open month picker"
              class="cal-nav-btn cal-nav-chevron"
              type="button"
              v-bind="menuProps"
            >
              <v-icon size="16">{{ miniCalOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </button>
          </template>

          <!-- Mini calendar card -->
          <v-card class="mini-cal" elevation="4" rounded="sm" width="280">
            <!-- Mini cal header -->
            <div class="mini-cal-header">
              <button aria-label="Previous month" class="mini-cal-nav" type="button" @click="miniPrev">
                <v-icon size="18">mdi-chevron-left</v-icon>
              </button>

              <span class="mini-cal-title">{{ miniCalLabel }}</span>

              <button aria-label="Next month" class="mini-cal-nav" type="button" @click="miniNext">
                <v-icon size="18">mdi-chevron-right</v-icon>
              </button>
            </div>

            <!-- Day-of-week headers -->
            <div class="mini-cal-grid">
              <span v-for="d in MINI_DOW" :key="d" class="mini-cal-dow">{{ d }}</span>

              <!-- Date cells -->
              <button
                v-for="(day, i) in miniCalDays"
                :key="i"
                class="mini-cal-day"
                :class="{
                  'mini-cal-day--other': !day.isCurrentMonth,
                  'mini-cal-day--today': day.isToday,
                }"
                type="button"
                @click="selectMiniDay(day)"
              >
                {{ day.day }}
              </button>
            </div>
          </v-card>
        </v-menu>
      </div>

      <!-- Right: Today -->
      <div class="cal-nav-side cal-nav-side--right">
        <button
          aria-label="Go to today"
          class="cal-nav-btn cal-nav-today"
          type="button"
          @click="goToDate(new Date())"
        >
          Today
        </button>
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
  import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
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
  const calendarNavLabel = ref(
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  )

  // ===== MINI CALENDAR =====
  const MINI_DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

  interface MiniCalDay { date: Date, day: number, isCurrentMonth: boolean, isToday: boolean }

  const miniCalOpen = ref(false)
  const miniCalDate = ref(new Date())

  const miniCalLabel = computed(() =>
    miniCalDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  )

  const miniCalDays = computed((): MiniCalDay[] => {
    const year = miniCalDate.value.getFullYear()
    const month = miniCalDate.value.getMonth()
    const startDate = new Date(year, month, 1)
    startDate.setDate(1 - startDate.getDay()) // back up to Sunday
    const todayMs = new Date(new Date().toDateString()).getTime()
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      return {
        date: new Date(d),
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: d.getTime() === todayMs,
      }
    })
  })

  function miniPrev (): void {
    const d = new Date(miniCalDate.value)
    d.setMonth(d.getMonth() - 1)
    miniCalDate.value = d
  }

  function miniNext (): void {
    const d = new Date(miniCalDate.value)
    d.setMonth(d.getMonth() + 1)
    miniCalDate.value = d
  }

  function selectMiniDay (day: MiniCalDay): void {
    goToDate(day.date)
    miniCalOpen.value = false
  }

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
    calendarNavLabel.value = arg.view.currentStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    miniCalDate.value = new Date(arg.view.currentStart)
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
/* MONTH NAV STRIP */
/* ================================================================ */

/* ── Nav strip ─────────────────────────────────────── */

.cal-nav-strip {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 4px 8px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-primary));
  border-bottom: none;
}

.cal-nav-center {
  display: flex;
  align-items: center;
  gap: 0;
}

.cal-nav-side {
  display: flex;
  align-items: center;
}

.cal-nav-side--right {
  justify-content: flex-end;
}

.cal-nav-btn {
  /* 44×44 touch target */
  min-width: 44px;
  min-height: 44px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.88);
  touch-action: manipulation;
  transition: background 120ms ease;
}

.cal-nav-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.cal-nav-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.cal-nav-btn:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

.cal-nav-chevron {
  min-width: 36px;
  opacity: 0.6;
}

.cal-nav-today {
  min-width: unset;
  padding: 0 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.cal-nav-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.01em;
  user-select: none;
  white-space: nowrap;
  padding: 0 2px;
}

/* ── Mini calendar ─────────────────────────────────── */

.mini-cal {
  padding: 8px;
}

.mini-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 8px;
}

.mini-cal-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.mini-cal-nav {
  /* 44×44 touch target */
  min-width: 44px;
  min-height: 44px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface));
  touch-action: manipulation;
  transition: background 100ms ease;
}

.mini-cal-nav:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.mini-cal-nav:active {
  background: rgba(var(--v-theme-on-surface), 0.14);
}

.mini-cal-nav:focus-visible {
  outline: 2px solid var(--claro-primary, #7367F0);
  outline-offset: 2px;
}

.mini-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px 0;
}

.mini-cal-dow {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
  user-select: none;
}

.mini-cal-day {
  /* 36px visual circle; ::before extends tap area to 44px */
  height: 36px;
  width: 100%;
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: rgb(var(--v-theme-on-surface));
  background: transparent;
  border: none;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 100ms ease, transform 80ms ease;
}

.mini-cal-day::before {
  content: '';
  position: absolute;
  inset: -4px;
}

.mini-cal-day:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.mini-cal-day:active {
  transform: scale(0.88);
}

.mini-cal-day:focus-visible {
  outline: 2px solid var(--claro-primary, #7367F0);
  outline-offset: 2px;
}

.mini-cal-day--other {
  color: rgba(var(--v-theme-on-surface), 0.35);
}

.mini-cal-day--today {
  background: rgba(var(--claro-primary-rgb, 115, 103, 240), 0.15);
  color: var(--claro-primary, #7367F0);
  font-weight: 700;
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
  .cal-nav-btn,
  .mini-cal-nav,
  .mini-cal-day {
    transition: none;
  }

  .mini-cal-day:active {
    transform: none;
  }

  :deep(.fc-view-harness) {
    transition: none;
  }

  :deep(.fc-event.priority-urgent) {
    animation: none;
  }
}
</style>
