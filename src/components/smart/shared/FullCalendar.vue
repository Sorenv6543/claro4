<template>
  <div class="calendar-container">
    <FullCalendar
      ref="calendarRef"
      class="custom-calendar"
      :options="calendarOptions"
    />
  </div>
</template>

<script setup lang="ts">
  import type {
    CalendarOptions,
    DateSelectArg,
    DatesSetArg,
    EventClickArg,
    EventContentArg,
    EventDropArg,
  } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import type { Booking, Property } from '@/types'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import interactionPlugin from '@fullcalendar/interaction'
  import listPlugin from '@fullcalendar/list'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import FullCalendar from '@fullcalendar/vue3'
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    watch,
  } from 'vue'
  // Import event logger for component communication
  import eventLogger from '@/composables/shared/useComponentEventLogger'
  import { formatPropertyAddress } from '@/types/property'
  import { bookingToCalendarEvent, bookingToTransitionEvents } from '@/utils/calendarHelpers'
  import {
    getMobileCalendarOptions,
    handleViewportResize,
  } from '@/utils/mobileViewport'

  function escapeHtml (str: string): string {
    if (str == null) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  interface Props {
    bookings: Booking[]
    properties: Property[]
    loading?: boolean
    viewMode?: 'ranges' | 'events'
  }
  // fullcalendar emits are all lowercase with dashes for consistency and to avoid issues with Vue's event system
  interface Emits {
    (e: 'date-select', selectInfo: DateSelectArg): void
    (e: 'event-click', clickInfo: EventClickArg): void
    (e: 'event-drop', dropInfo: EventDropArg): void
    (e: 'event-resize', resizeInfo: EventResizeDoneArg): void
    (
      e: 'create-booking',
      data: { start: string, end: string, propertyId?: string | undefined },
    ): void
    (e: 'update-booking', data: { id: string, start: string, end: string }): void
    (e: 'day-view-open', payload: { date: Date, bookings: Booking[] }): void
    (e: 'dates-set', arg: DatesSetArg): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    viewMode: 'ranges',
  })

  const emit = defineEmits<Emits>()

  const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

  // Convert bookings array to FullCalendar events
  const calendarEvents = computed(() => {
    const propertyMap = new Map(props.properties.map(p => [p.id, p]))

    if (props.viewMode === 'events') {
      return props.bookings.flatMap(booking => {
        const property = propertyMap.get(booking.property_id)
        return bookingToTransitionEvents(booking, property).map(event => ({
          ...event,
          editable: false,
          startEditable: false,
          durationEditable: false,
          overlap: true,
        }))
      })
    }

    return props.bookings.map(booking => {
      const property = propertyMap.get(booking.property_id)
      const base = bookingToCalendarEvent(booking, property)

      return {
        ...base,
        editable: true,
        startEditable: true,
        durationEditable: true,
        overlap: true,
        classNames: [
          ...base.classNames,
          `booking-${booking.booking_type}`,
          `status-${booking.status}`,
        ],
      }
    })
  })

  // Mobile viewport height management
  const mobileOptions = ref(getMobileCalendarOptions())
  let cleanupViewportListener: (() => void) | null = null
  let resizeObserver: ResizeObserver | null = null

  // Calendar configuration — reactive so we can patch individual fields
  // without rebuilding the entire options object on every booking change
  const calendarOptions = reactive({
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],

    // View settings
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: '',
      center: '',
      right: '',
    },

    // Event settings - mobile optimized (patched via watch below)
    events: [] as CalendarOptions['events'],
    eventDisplay: mobileOptions.value.eventDisplay,
    eventOverlap: true,
    eventResizableFromStart: true,

    // Interaction settings
    selectable: true,
    selectMirror: true,
    editable: true,
    droppable: true,

    // Date/time settings
    locale: 'en',
    timeZone: 'local',
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '01:00:00',
    snapDuration: '00:30:00',

    // Use mobile-optimized height calculation
    height: mobileOptions.value.height,
    aspectRatio: undefined as number | undefined, // Remove aspect ratio constraints for full height
    expandRows: true, // Make calendar rows expand to fill available height

    // Custom styling based on theme
    themeSystem: 'standard',

    // Event handlers
    select: handleDateSelect,
    eventClick: handleEventClick,

    eventDrop: handleEventDrop as any,
    eventResize: handleEventResize as any,

    // Loading state
    loading: handleLoading,

    // Calendar lifecycle
    datesSet: handleDatesSet,
    viewDidMount: handleViewMount,

    // Custom rendering
    eventContent: renderEventContent,

    // Business hours (optional)
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday - Sunday
      startTime: '08:00',
      endTime: '18:00',
    },

    // Weekend styling
    weekends: true,

    // Month view specific - mobile optimized
    dayMaxEvents: mobileOptions.value.dayMaxEvents,
    moreLinkClick: 'popover', // Show popover for more events

    // Week/day view specific
    allDaySlot: false,
    nowIndicator: true,
    scrollTime: '08:00:00',
  }) as CalendarOptions

  // Patch events slot incrementally — FullCalendar diffs, not full re-render
  watch(calendarEvents, events => {
    calendarOptions.events = events
  }, { immediate: true })

  // Patch mobile-responsive fields when viewport changes
  watch(mobileOptions, opts => {
    calendarOptions.height = opts.height
    calendarOptions.dayMaxEvents = opts.dayMaxEvents
    calendarOptions.eventDisplay = opts.eventDisplay
  })

  // Event handlers
  function handleDateSelect (selectInfo: DateSelectArg): void {
    // Log emitting event to Home
    eventLogger.logEvent(
      'FullCalendar',
      'Home',
      'date-select',
      { start: selectInfo.startStr, end: selectInfo.endStr },
      'emit',
    )

    emit('date-select', selectInfo)

    // Optionally auto-create booking
    emit('create-booking', {
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    })

    // Clear selection
    selectInfo.view.calendar.unselect()
  }

  function handleEventClick (clickInfo: EventClickArg): void {
    // Log emitting event to Home
    eventLogger.logEvent(
      'FullCalendar',
      'Home',
      'event-click',
      { id: clickInfo.event.id },
      'emit',
    )

    emit('event-click', clickInfo)

    // In events mode, highlight related transition events
    if (props.viewMode === 'events') {
      const bookingId = (clickInfo.event.extendedProps?.booking as Booking | undefined)?.id
      if (bookingId && calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        const relatedEvents = calendarApi.getEvents()
          .filter((e: any) => e.extendedProps?.booking?.id === bookingId)
        for (const e of relatedEvents) {
          const original = [...e.classNames]
          e.setProp('classNames', [...e.classNames, 'transition-highlight'])
          setTimeout(() => {
            e.setProp('classNames', original)
          }, 2000)
        }
      }
    }
  }

  function handleEventDrop (dropInfo: EventDropArg): void {
    emit('event-drop', dropInfo)
  }

  function handleEventResize (resizeInfo: EventResizeDoneArg): void {
    emit('event-resize', resizeInfo)
  }

  // Compact 12h label for the event start-time chip. '15:00' → '3p', '09:30' → '9:30a', '00:00' → '12a'
  function formatTimeChip (hhmm: string | null | undefined): string | null {
    if (!hhmm) return null
    const [hStr, mStr] = hhmm.split(':')
    const h = Number.parseInt(hStr, 10)
    const m = Number.parseInt(mStr, 10)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    const period = h < 12 ? 'a' : 'p'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
  }

  function renderEventContent (eventInfo: EventContentArg) {
    // Events mode: single-line "IN · Property" pill
    if (props.viewMode === 'events') {
      const transitionType = (eventInfo.event.extendedProps?.transitionType as string | undefined) || 'in'
      const label = transitionType.toUpperCase()
      const property = eventInfo.event.extendedProps?.property as Property | undefined
      const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Property'

      return {
        html: `
          <div class="fc-event-content-wrapper transition-${escapeHtml(transitionType)}">
            <div class="fc-event-lines">
              <div class="fc-event-title">${escapeHtml(label)} · ${escapeHtml(propertyLabel)}</div>
            </div>
          </div>
        `,
      }
    }

    // Ranges mode: optional time chip + property name
    const booking = eventInfo.event.extendedProps?.booking as Booking | undefined
    const property = eventInfo.event.extendedProps?.property as Property | undefined
    if (!booking) {
      return { html: '' }
    }

    const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Property'
    const timeChip = eventInfo.isStart ? formatTimeChip(booking.checkin_time) : null
    const chipHtml = timeChip ? `<span class="fc-event-time-chip">${escapeHtml(timeChip)}</span>` : ''

    return {
      html: `
        <div class="fc-event-content-wrapper">
          ${chipHtml}
          <div class="fc-event-lines">
            <div class="fc-event-title">${escapeHtml(propertyLabel)}</div>
          </div>
        </div>
      `,
    }
  }

  // Programmatic calendar methods with enhanced safety checks

  function goToDate (date: string | Date): void {
    if (!calendarRef.value) return

    try {
      const calendarApi = calendarRef.value.getApi()
      if (calendarApi && typeof calendarApi.gotoDate === 'function') {
        calendarApi.gotoDate(date)
      }
    } catch (error) {
      console.warn('Error going to date:', error)
    }
  }

  function changeView (viewName: string): void {
    if (!calendarRef.value) return

    try {
      const calendarApi = calendarRef.value.getApi()
      if (calendarApi && typeof calendarApi.changeView === 'function') {
        calendarApi.changeView(viewName)
      }
    } catch (error) {
      console.warn('Error changing view:', error)
    }
  }

  function refreshEvents (): void {
    if (!calendarRef.value) return

    try {
      const calendarApi = calendarRef.value.getApi()
      if (calendarApi && typeof calendarApi.refetchEvents === 'function') {
        calendarApi.refetchEvents()
      }
    } catch (error) {
      console.warn('Error refreshing events:', error)
    }
  }

  // Watch for theme changes and update calendar
  // watch(() => theme.global.current.value.dark, () => {
  //   refreshEvents()
  // })

  // Watch for changes in props from Home
  watch(
    () => props.bookings,
    newBookings => {
      // Log receiving updated bookings from Home
      eventLogger.logEvent(
        'Home',
        'FullCalendar',
        'bookingsUpdate',
        { count: newBookings.length },
        'receive',
      )

      // FullCalendar will automatically update with the new events
      // Reattach more link listeners after events update
      setTimeout(() => {
        attachMoreLinkListeners()
      }, 200)
    },
    { immediate: true },
  ) // Removed deep: true to prevent excessive re-runs

  // Add new handler function after the other event handlers
  function handleLoading (isLoading: boolean): void {
    // Log loading state
    eventLogger.logEvent(
      'FullCalendar',
      'Home',
      'loadingState',
      { isLoading },
      'emit',
    )
  }

  // Calendar datesSet handler — fires whenever the visible date range changes
  function handleDatesSet (arg: DatesSetArg): void {
    emit('dates-set', arg)
    attachMoreLinkListeners()
  }

  function handleViewMount (): void {
    // Reattach listeners when view changes (month/week/day)
    setTimeout(() => {
      attachMoreLinkListeners()
    }, 100)
  }

  // Manually attach click listeners to more links
  function attachMoreLinkListeners (): void {
    if (!calendarRef.value) return

    try {
      const calendarApi = calendarRef.value.getApi()
      if (!calendarApi) return

      const calendarEl = calendarRef.value.$el || calendarApi.el
      if (!calendarEl) return

      // Find all "+N more" links
      const moreLinks = calendarEl.querySelectorAll('.fc-more-link')

      for (const link of moreLinks) {
        // Remove existing listeners to prevent duplicates
        link.removeEventListener('click', handleManualMoreLinkClick)
        link.removeEventListener('mousedown', handleManualMoreLinkClick)
        link.removeEventListener('touchstart', handleManualMoreLinkClick)

        // Add our custom click handlers with high priority (capture phase)
        link.addEventListener('click', handleManualMoreLinkClick, true)
        link.addEventListener('mousedown', handleManualMoreLinkClick, true)
        link.addEventListener('touchstart', handleManualMoreLinkClick, {
          passive: false,
          capture: true,
        })
      }
    } catch (error) {
      console.warn('Error attaching more link listeners:', error)
    }
  }

  // Manual more link click handler
  function handleManualMoreLinkClick (event: Event): void {
    // Aggressively prevent all default behaviors
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    const linkElement = event.currentTarget as HTMLElement

    // Hide any existing popovers immediately
    const existingPopovers = document.querySelectorAll(
      '.fc-popover, .fc-more-popover',
    )
    for (const popover of existingPopovers) {
      (popover as HTMLElement).style.display = 'none'
      popover.remove()
    }

    // Find the day cell that contains this more link
    const dayCell = linkElement.closest('.fc-daygrid-day') as HTMLElement
    if (!dayCell) {
      console.error('Could not find day cell for more link')
      return
    }

    // Get the date from the day cell - try multiple approaches
    let dateAttr = dayCell.dataset.date

    // Fallback: try to get from aria-label or other attributes
    if (!dateAttr) {
      dateAttr = dayCell.getAttribute('aria-label') as string
    }

    // Another fallback: try to get from the day number element
    if (!dateAttr) {
      const dayNumber = dayCell.querySelector('.fc-daygrid-day-number')
      if (dayNumber) {
        const dayText = dayNumber.textContent?.trim()
        if (dayText) {
          // Get current month/year from calendar API
          const calendarApi = calendarRef.value?.getApi()
          if (calendarApi) {
            const currentView = calendarApi.view
            const currentDate = currentView.currentStart
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth()
            const day = Number.parseInt(dayText)

            // Create proper date string
            const date = new Date(year, month, day)
            dateAttr = date.toISOString().split('T')[0]
          }
        }
      }
    }

    if (!dateAttr) {
      console.error('Could not extract date from day cell')
      return
    }

    // Fix timezone issue by parsing date components manually
    const [year, month, day] = dateAttr.split('-').map(Number)
    const clickedDate = new Date(year, month - 1, day) // month is 0-indexed in JS Date

    // Filter bookings for this date
    const clickedDateStr = clickedDate.toDateString()
    const dayBookings: Booking[] = []

    if (props.viewMode === 'events') {
      // Events mode: match bookings with a transition on this exact date
      for (const booking of props.bookings) {
        const hasTransition
          = booking.checkin_date === dateAttr
            || booking.turn_date === dateAttr
            || booking.checkout_date === dateAttr
        if (hasTransition) {
          dayBookings.push(booking)
        }
      }
    } else {
      // Ranges mode: existing range-overlap logic
      for (const booking of props.bookings) {
        const checkoutDate = new Date(booking.checkout_date)
        const checkinDate = new Date(booking.checkin_date)

        // Check if the clicked date falls within the booking period
        const bookingStartsOnDate = checkinDate.toDateString() === clickedDateStr
        const bookingSpansDate
          = clickedDate >= checkinDate && clickedDate <= checkoutDate

        const dateMatches = bookingStartsOnDate || bookingSpansDate

        if (dateMatches) {
          dayBookings.push(booking)
        }
      }
    }

    emit('day-view-open', { date: clickedDate, bookings: dayBookings })
  }

  // Lifecycle hooks for mobile viewport management
  onMounted(() => {
    // Set up viewport resize listener for mobile
    cleanupViewportListener = handleViewportResize(() => {
      mobileOptions.value = getMobileCalendarOptions()
    })

    // Watch for container resize (e.g. sidebar toggle) and tell FullCalendar to recalculate.
    // Debounced to avoid calling updateSize() at 60fps during sidebar animation.
    const containerEl = calendarRef.value?.$el?.parentElement
    if (containerEl) {
      let resizeTimeout: ReturnType<typeof setTimeout> | null = null
      resizeObserver = new ResizeObserver(() => {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          if (!calendarRef.value) return
          calendarRef.value.getApi()?.updateSize()
        }, 150)
      })
      resizeObserver.observe(containerEl)
    }
  })

  onBeforeUnmount(() => {
    // Clean up calendar instance before component unmounts
    if (calendarRef.value) {
      try {
        const calendarApi = calendarRef.value.getApi()
        if (calendarApi && typeof calendarApi.destroy === 'function') {
          calendarApi.destroy()
        }
      } catch (error) {
        console.warn('Calendar cleanup error in beforeUnmount:', error)
      } finally {
        // Clear the ref to prevent further access
        calendarRef.value = null
      }
    }

    // Clean up viewport listener early
    if (cleanupViewportListener) {
      cleanupViewportListener()
      cleanupViewportListener = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  onUnmounted(() => {
    // Ensure everything is cleaned up
    if (calendarRef.value) {
      calendarRef.value = null
    }
    if (cleanupViewportListener) {
      cleanupViewportListener()
      cleanupViewportListener = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  // Expose methods to parent
  defineExpose({
    goToDate,
    changeView,
    refreshEvents,
    getApi: () => {
      if (!calendarRef.value) return null

      try {
        return calendarRef.value.getApi() || null
      } catch (error) {
        console.warn('Error getting calendar API:', error)
        return null
      }
    },
  })
</script>

<style scoped>
.calendar-container {
  height: 100%;
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.custom-calendar {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 1;
  min-height: 0;

  /* Bridge calendar-tokens.css into FullCalendar's CSS variable system */
  --fc-border-color:     var(--cal-border);
  --fc-page-bg-color:    var(--cal-bg);
  --fc-today-bg-color:   var(--cal-today-bg);
  --fc-button-bg-color:         rgb(var(--v-theme-primary));
  --fc-button-border-color:     rgb(var(--v-theme-primary));
  --fc-button-hover-bg-color:   rgb(var(--v-theme-primary));
  --fc-button-active-bg-color:  rgb(var(--v-theme-primary));
}

/* Hide empty FullCalendar toolbar — controls are in the app bar */
:deep(.fc-header-toolbar) {
  display: none !important;
}

/* Day-of-week header row — filled gray bar with white text */
:deep(.fc-col-header-cell) {
  background: var(--cal-header-bg) !important;
  border-color: var(--cal-header-bg) !important;
}
:deep(.fc-col-header-cell-cushion) {
  color: var(--cal-header-text) !important;
  font-weight: 500;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  padding: 8px 4px;
}

/* Day numbers — current month vs prev/next month */
:deep(.fc-daygrid-day-number) {
  color: var(--cal-day-num);
  font-weight: 500;
  text-decoration: none;
}
:deep(.fc-day-other .fc-daygrid-day-number) {
  color: var(--cal-day-num-muted);
}

/* Grid lines — explicit borders on cells so FullCalendar's default --fc-border-color wins over any overrides */
:deep(.fc-daygrid-day),
:deep(.fc-col-header-cell),
:deep(.fc-scrollgrid),
:deep(.fc-scrollgrid-section > td),
:deep(.fc-scrollgrid-section > th) {
  border: 1px solid var(--cal-border) !important;
}

/* Event pill — flat colored bar, tokenised. Horizontal inset narrows the
   pill ~4px so it doesn't collide with cell borders. */
:deep(.fc-event) {
  border-radius: var(--cal-event-radius) !important;
  padding:       var(--cal-event-padding);
  font-weight:   var(--cal-event-font-weight);
  color:         var(--cal-event-text);
  margin-left:   2px !important;
  margin-right:  2px !important;
  box-shadow:    none !important;
  transition:    filter 0.15s ease, opacity 0.15s ease;
}
:deep(.fc-event:hover)    { filter: brightness(1.05); cursor: grab; }
:deep(.fc-event:active)   { cursor: grabbing; }
:deep(.fc-event-dragging) { opacity: 0.75 !important; }
:deep(.fc-event-mirror)   { opacity: 0.6 !important; }

/* Completed bookings: dim + neutral gray (overrides inline property.color) */
:deep(.fc-event.status-completed) {
  background-color: var(--cal-event-completed-bg) !important;
  border-color:     var(--cal-event-completed-bg) !important;
  opacity:          var(--cal-event-completed-opacity);
  text-decoration:  none;
}

/* Event content layout — wrapped in :deep() because FullCalendar renders these into non-Vue DOM */
:deep(.fc-event-content-wrapper) {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
:deep(.fc-event-time-chip) {
  background:     var(--cal-time-chip-bg);
  color:          var(--cal-time-chip-text);
  border-radius:  var(--cal-time-chip-radius);
  padding:        0 4px;
  font-size:      0.65em;
  font-weight:    700;
  line-height:    1.4;
  flex:           0 0 auto;
}
:deep(.fc-event-lines)    { min-width: 0; flex: 1 1 auto; }
:deep(.fc-event-title)    { font-size: 0.8rem; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.fc-event-subtitle) { font-size: 0.7rem; line-height: 1.1; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Month-view pills are single-line — hide the subtitle; timegrid (week/day) keeps it */
:deep(.fc-daygrid-event .fc-event-subtitle)  { display: none; }
:deep(.fc-timegrid-event .fc-event-subtitle) { display: block; }

/* Force hide any FullCalendar popovers/tooltips */
:deep(.fc-popover),
:deep(.fc-more-popover),
:deep(.fc-popover-header),
:deep(.fc-popover-body),
:deep(.fc-popover-close) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Mobile viewport fixes — unchanged from prior version */
@media (max-width: 959px) {
  .calendar-container {
    position: relative;
    height: calc(
      100vh - 56px - 60px - env(safe-area-inset-top) -
        env(safe-area-inset-bottom) - 20px
    ) !important;
    min-height: 400px;
    max-height: calc(100vh - 100px);
  }
  .custom-calendar {
    position: relative;
    height: 100% !important;
    width: 100% !important;
  }
  :deep(.fc)              { height: 100% !important; width: 100% !important; }
  :deep(.fc-view-harness) { height: 100% !important; width: 100% !important; }
  :deep(.fc-scroller) {
    height: 100% !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.fc-daygrid-body)      { min-height: 300px; }
  :deep(.fc-daygrid-day-frame) { min-height: 40px; }
  :deep(.fc-event) {
    margin: 1px 0;
    font-size: 0.75rem;
  }
}

@media (min-width: 960px) {
  :deep(.fc-event) {
    font-size: 0.75rem !important;
    min-height: 22px !important;
    margin: 1px 0 !important;
  }
  :deep(.fc-event-title)    { font-size: 0.75rem !important; line-height: 1.1 !important; }
  :deep(.fc-event-subtitle) { font-size: 0.65rem !important; line-height: 1 !important; }
  :deep(.fc-daygrid-day-frame) { min-height: 120px !important; }
}
</style>

<!-- Unscoped: FullCalendar renders its own DOM outside Vue's scoping -->
<style>
/* Unscoped: FullCalendar renders event DOM outside Vue's scoping.
   viewMode === 'events' events (IN / TURN / OUT) use theme-mapped colors. */
.fc-event.transition-event {
  border-radius: var(--cal-event-radius, 2px) !important;
  font-weight: 600;
  border: none !important;
  color: #fff !important;
}

.fc-event.transition-in {
  background-color: rgb(var(--v-theme-success)) !important;
  border-color:     rgb(var(--v-theme-success)) !important;
}

.fc-event.transition-turn {
  background-color: rgb(var(--v-theme-error)) !important;
  border-color:     rgb(var(--v-theme-error)) !important;
}

.fc-event.transition-out {
  background-color: rgb(var(--v-theme-info)) !important;
  border-color:     rgb(var(--v-theme-info)) !important;
}

.fc-event.transition-highlight {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.6) !important;
  transition: box-shadow 0.3s ease;
}
</style>
