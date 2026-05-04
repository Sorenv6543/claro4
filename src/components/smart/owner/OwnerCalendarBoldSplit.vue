<template>
  <div class="vb-cal">

    <!-- ─── Zigzag Bold Split Header ────────────────────────────────── -->
    <header class="vb-header">
      <div class="vb-header__inner">

        <div class="vb-header__text">
          <span class="vb-header__eyebrow">MY SCHEDULE</span>
          <h1 class="vb-header__title">Calendar</h1>
          <p class="vb-header__month">{{ currentMonthYear }}</p>
        </div>

        <!-- Frame 3: Candid Lifestyle Photography -->
        <figure aria-hidden="true" class="frame-3">
          <div
            class="frame-3__photo"
            :style="props.imageSrc ? { backgroundImage: `url('${props.imageSrc}')` } : {}"
          />
        </figure>

      </div>

      <!-- Zigzag cut: SVG polygon filled with page bg masks the header bottom -->
      <svg aria-hidden="true" class="vb-header__zigzag" preserveAspectRatio="none" viewBox="0 0 200 16">
        <polygon class="vb-header__zigzag-fill" points="0,16 10,4 20,16 30,4 40,16 50,4 60,16 70,4 80,16 90,4 100,16 110,4 120,16 130,4 140,16 150,4 160,16 170,4 180,16 190,4 200,16 200,16 0,16" />
      </svg>
    </header>

    <!-- ─── Calendar Body ────────────────────────────────────────────── -->
    <div class="vb-cal__body">
      <FullCalendar
        ref="calendarRef"
        :bookings="props.bookings"
        class="vb-fc"
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

  </div>
</template>

<script setup lang="ts">
  import type { Booking, Property } from '@/types'
  import type { DateSelectArg, DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
  import LoadingSpinner from '@/components/dumb/shared/LoadingSpinner.vue'
  import { useCalendarState } from '@/composables/shared/useCalendarState'

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
    imageSrc?: string
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
    imageSrc: '',
  })

  const emit = defineEmits<Emits>()

  const { goToDate: calendarStateGoToDate } = useCalendarState()

  const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

  const currentMonthYear = computed(() => {
    return (props.currentDate ?? new Date()).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  })

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

  watch(() => props.currentView, newView => {
    nextTick(() => {
      if (newView && calendarRef.value) {
        calendarRef.value.changeView(newView)
      }
    })
  })

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

  onMounted(async () => {
    await nextTick()
  })

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
/* Violet Bloom + Anton + Geist loaded here — scoped to this variant only */
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Geist:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap');

/* ─── Violet Bloom Palette ──────────────────────────────────────────── */
.vb-cal {
  --vb-primary:      #7C3AED;
  --vb-primary-deep: #4C1D95;
  --vb-primary-mid:  #8B5CF6;
  --vb-primary-soft: #A78BFA;
  --vb-lavender:     #DDD6FE;
  --vb-tint:         #EDE9FE;
  --vb-bloom:        #C084FC;
  --vb-bg:           var(--claro-background);
  --vb-surface:      var(--claro-surface);

  /* Soft Lift — slight purple-tinted shadow (intentional variant override) */
  --vb-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 16px color-mix(in srgb, var(--vb-primary) 12%, transparent);

  /* Basic Roundness — 4px (one step above Claro4's 2px global default) */
  --vb-radius: 4px;

  /* Typography */
  --vb-font-heading: 'Anton', sans-serif;
  --vb-font-body:    'Geist', 'Inter', sans-serif;
  --vb-font-caption: 'Inter', sans-serif;

  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--vb-bg);
  font-family: var(--vb-font-body);
}

/* ─── Header ────────────────────────────────────────────────────────── */
.vb-header {
  position: relative;
  background: linear-gradient(135deg, var(--vb-primary-deep) 0%, var(--vb-primary) 55%, var(--vb-bloom) 100%);
  padding: 20px 20px 28px;
  flex-shrink: 0;
}

.vb-header__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.vb-header__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vb-header__eyebrow {
  font-family: var(--vb-font-caption);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--vb-lavender) 80%, white);
}

.vb-header__title {
  font-family: var(--vb-font-heading);
  font-size: 36px;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #ffffff;
  margin: 0;
}

.vb-header__month {
  font-family: var(--vb-font-body);
  font-size: 13px;
  font-weight: 400;
  color: color-mix(in srgb, white 70%, var(--vb-lavender));
  margin: 0;
  margin-top: 4px;
}

/* ─── Frame 3: Candid Lifestyle Photo ───────────────────────────────── */
.frame-3 {
  flex-shrink: 0;
  width: 72px;
  height: 96px;   /* 3:4 portrait ratio */
  border-radius: var(--vb-radius);
  border: 3px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 4px 14px rgba(0, 0, 0, 0.28);
  overflow: hidden;
  margin: 0;
}

.frame-3__photo {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  /* Gradient placeholder shown when no imageSrc prop is provided */
  background-image: linear-gradient(
    160deg,
    color-mix(in srgb, var(--vb-bloom) 60%, white) 0%,
    var(--vb-primary-mid) 50%,
    var(--vb-primary-deep) 100%
  );
}

/* ─── Zigzag cut ────────────────────────────────────────────────────── */
.vb-header__zigzag {
  position: absolute;
  bottom: -1px;   /* 1px overlap prevents sub-pixel gap */
  left: 0;
  width: 100%;
  height: 16px;
  display: block;
}

.vb-header__zigzag-fill {
  fill: var(--vb-bg);
}

/* ─── Calendar body ─────────────────────────────────────────────────── */
.vb-cal__body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: var(--vb-surface);
  border-radius: 0 0 var(--vb-radius) var(--vb-radius);
  box-shadow: var(--vb-shadow);
}

.vb-fc {
  height: 100%;
  width: 100%;
}

/* ─── FullCalendar overrides — Violet Bloom chrome ──────────────────── */

/* Toolbar title: Anton font */
:deep(.fc-toolbar-title) {
  font-family: var(--vb-font-heading) !important;
  font-size: 20px !important;
  letter-spacing: 0.02em;
  color: var(--vb-primary-deep);
}

/* Day column headers: lavender tint bg + deep violet text */
:deep(.fc-col-header-cell) {
  background: var(--vb-tint);
}

:deep(.fc-col-header-cell-cushion) {
  font-family: var(--vb-font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--vb-primary-deep);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Day number: Geist */
:deep(.fc-daygrid-day-number) {
  font-family: var(--vb-font-body);
  font-weight: 500;
}

/* Today highlight: lavender */
:deep(.fc-day-today) {
  background: color-mix(in srgb, var(--vb-lavender) 30%, transparent) !important;
}

:deep(.fc-day-today .fc-daygrid-day-number) {
  color: var(--vb-primary);
  font-weight: 700;
}

/* Nav buttons: violet */
:deep(.fc-button-primary) {
  background-color: var(--vb-primary) !important;
  border-color: var(--vb-primary) !important;
  border-radius: var(--vb-radius) !important;
  font-family: var(--vb-font-body) !important;
  font-size: 13px !important;
}

:deep(.fc-button-primary:hover) {
  background-color: var(--vb-primary-deep) !important;
  border-color: var(--vb-primary-deep) !important;
}

:deep(.fc-button-primary:not(:disabled):active),
:deep(.fc-button-primary.fc-button-active) {
  background-color: var(--vb-primary-deep) !important;
  border-color: var(--vb-primary-deep) !important;
}

/* Event pill: soft violet shadow on hover */
:deep(.fc-event:hover) {
  box-shadow: 0 2px 8px color-mix(in srgb, var(--vb-primary) 30%, transparent);
}

/* Turn booking: bold border */
:deep(.fc-event.booking-turn) {
  font-weight: 600;
  border-width: 3px !important;
}

/* Urgent pulse: uses --vb-primary-mid for Violet Bloom brand  */
:deep(.fc-event.priority-urgent) {
  animation: pulse-vb-urgent 2s infinite;
}

/* Time axis labels: caption font */
:deep(.fc-timegrid-slot-label) {
  font-family: var(--vb-font-caption);
  font-size: 11px;
  color: color-mix(in srgb, var(--vb-primary-deep) 55%, transparent);
}

/* ─── Animations ────────────────────────────────────────────────────── */

@keyframes pulse-vb-urgent {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--vb-primary) 80%, transparent);
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

/* ─── Mobile ────────────────────────────────────────────────────────── */

@media (max-width: 599px) {
  .vb-header {
    padding: 16px 16px 28px;
  }

  .vb-header__title {
    font-size: 28px;
  }

  .frame-3 {
    width: 56px;
    height: 75px;
  }

  .vb-cal__body {
    height: calc(100dvh - var(--claro-app-bar-height) - 88px);
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

/* ─── Accessibility ─────────────────────────────────────────────────── */

@media (prefers-contrast: high) {
  :deep(.fc-event) {
    border-width: 2px !important;
  }

  :deep(.fc-button-primary) {
    border-width: 2px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.fc-event.priority-urgent) {
    animation: none;
  }
}
</style>
