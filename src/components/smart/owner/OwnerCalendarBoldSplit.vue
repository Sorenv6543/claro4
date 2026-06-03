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
