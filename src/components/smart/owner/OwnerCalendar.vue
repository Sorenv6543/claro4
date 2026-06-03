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
  import type { Ref } from 'vue'
  import { computed, defineAsyncComponent, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
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
