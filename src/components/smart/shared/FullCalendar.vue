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
    EventDropArg,
  } from '@fullcalendar/core'
  import type { EventResizeDoneArg } from '@fullcalendar/interaction'
  import type { Booking, Property } from '@/types'
  import { formatPropertyAddress } from '@/types/property'
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
  import { bookingToCalendarEvent, bookingToTransitionEvents } from '@/utils/calendarHelpers'
  import {
    getMobileCalendarOptions,
    handleViewportResize,
  } from '@/utils/mobileViewport'

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
    eventDidMount: handleEventDidMount,

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
  watch(calendarEvents, (events) => {
    calendarOptions.events = events
  }, { immediate: true })

  // Patch mobile-responsive fields when viewport changes
  watch(mobileOptions, (opts) => {
    calendarOptions.height = opts.height
    calendarOptions.dayMaxEvents = opts.dayMaxEvents
    calendarOptions.eventDisplay = opts.eventDisplay
  })

  // Position labelled badges on the event bar at specific date columns.
  // Events spanning more than one week row are split into segments (one per row). We scope
  // the cell lookup to the same <tr> so the badge only appears on the correct segment.
  // Reads and writes are separated to avoid forced reflows.

  interface BadgeMeasurement {
    eventEl: HTMLElement
    leftPct: number
    widthPct: number
    className: string
    label: string
    harness: HTMLElement | null
  }

  // Phase 1: DOM reads only — no style mutations
  function measureBadge (eventEl: HTMLElement, dateStr: string, className: string, label: string): BadgeMeasurement | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null

    const eventRow = eventEl.closest('tr')
    if (!eventRow) return null
    const cell = eventRow.querySelector(`td.fc-day[data-date="${dateStr}"]`)
    if (!cell) return null

    const eventRect = eventEl.getBoundingClientRect()
    const cellRect = cell.getBoundingClientRect()
    if (eventRect.width === 0) return null

    const leftPct = ((cellRect.left - eventRect.left) / eventRect.width) * 100
    const widthPct = (cellRect.width / eventRect.width) * 100
    const harness = eventEl.closest('.fc-daygrid-event-harness') as HTMLElement | null

    return { eventEl, leftPct, widthPct, className, label, harness }
  }

  // Phase 2: DOM writes only — no layout queries
  function applyBadge (m: BadgeMeasurement) {
    const badge = document.createElement('div')
    badge.className = m.className
    badge.textContent = m.label
    badge.style.left = `${m.leftPct}%`
    badge.style.width = `${m.widthPct}%`

    if (m.harness) {
      m.harness.style.overflow = 'visible'
    }
    m.eventEl.style.position = 'relative'
    m.eventEl.style.overflow = 'visible'
    m.eventEl.appendChild(badge)
  }

  // After an event segment mounts, add TURN and OUT badges at the appropriate day columns.
  function handleEventDidMount (info: { event: { extendedProps: Record<string, unknown> }, el: HTMLElement }) {
    if (props.viewMode === 'events') return
    const booking = info.event.extendedProps?.booking as Booking | undefined
    if (!booking) return

    requestAnimationFrame(() => {
      const eventEl = info.el
      if (!eventEl.isConnected) return

      // Phase 1: all reads
      const measurements: BadgeMeasurement[] = []
      if (booking.turn_date) {
        const m = measureBadge(eventEl, booking.turn_date, 'turn-event-badge', 'TURN')
        if (m) measurements.push(m)
      }
      if (booking.checkout_date && booking.checkout_date !== booking.turn_date) {
        const m = measureBadge(eventEl, booking.checkout_date, 'checkout-event-badge', 'OUT')
        if (m) measurements.push(m)
      }

      // Phase 2: all writes
      measurements.forEach(applyBadge)
    })
  }

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
        relatedEvents.forEach((e: any) => {
          const original = [...e.classNames]
          e.setProp('classNames', [...e.classNames, 'transition-highlight'])
          setTimeout(() => {
            e.setProp('classNames', original)
          }, 2000)
        })
      }
    }
  }

  function handleEventDrop (dropInfo: EventDropArg): void {
    emit('event-drop', dropInfo)
  }

  function handleEventResize (resizeInfo: EventResizeDoneArg): void {
    emit('event-resize', resizeInfo)
  }

  // Custom event rendering with enhanced visual variety
  function renderEventContent (eventInfo: {
    event: {
      extendedProps: {
        booking: Booking
        property: Property
        transitionType?: string
      }
    }
  }) {
    // Events mode: simplified rendering
    if (props.viewMode === 'events') {
      const transitionType = eventInfo.event.extendedProps.transitionType || 'in'
      const label = transitionType.toUpperCase()
      const booking = eventInfo.event.extendedProps.booking as Booking
      const property = eventInfo.event.extendedProps.property as Property
      const propertyLabel = property ? formatPropertyAddress(property, 'short') : 'Property'

      return {
        html: `
        <div class="fc-event-content-wrapper transition-${transitionType}">
          <div class="fc-event-title">${label} · ${propertyLabel}</div>
          <div class="fc-event-subtitle">${booking.status.toUpperCase()}</div>
        </div>
        `,
      }
    }

    // Ranges mode: existing logic below...
    const booking = eventInfo.event.extendedProps.booking as Booking
    const property = eventInfo.event.extendedProps.property as Property

    // Get priority icon
    const getPriorityIcon = (priority: string, type: string) => {
      if (type === 'turn') {
        switch (priority) {
          case 'urgent': {
            return '🚨'
          }
          case 'high': {
            return '🔥'
          }
          case 'normal': {
            return '🏠'
          }
          case 'low': {
            return '🧹'
          }
          default: {
            return '🏠'
          }
        }
      } else {
        switch (priority) {
          case 'urgent': {
            return '⚡'
          }
          case 'high': {
            return '⭐'
          }
          case 'normal': {
            return '🏠'
          }
          case 'low': {
            return '✨'
          }
          default: {
            return '🏠'
          }
        }
      }
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'completed': {
          return '✅'
        }
        case 'pending': {
          return '⏳'
        }
        case 'confirmed': {
          return '📋'
        }
        case 'in_progress': {
          return '🔄'
        }
        default: {
          return '📋'
        }
      }
    }

    const priorityIcon = getPriorityIcon(
      booking.priority || 'normal',
      booking.booking_type,
    )
    const statusBadge = getStatusBadge(booking.status || 'pending')

    return {
      html: `
      <div class="fc-event-content-wrapper booking-${booking.booking_type} priority-${booking.priority}">
        <div class="fc-event-title">
          ${priorityIcon} ${property ? formatPropertyAddress(property, 'short') : 'Property'}
        </div>
        <div class="fc-event-subtitle">
          ${statusBadge} ${booking.status.toUpperCase()}
          ${booking.guest_count ? ` • ${booking.guest_count}👥` : ''}
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
    (newBookings) => {
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
        const hasTransition =
          booking.checkin_date === dateAttr ||
          booking.turn_date === dateAttr ||
          booking.checkout_date === dateAttr
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
}

.custom-calendar {
  --fc-border-color: rgba(100, 140, 180, 0.2);
  --fc-button-bg-color: rgb(var(--v-theme-primary));
  --fc-button-border-color: rgb(var(--v-theme-primary));
  --fc-button-hover-bg-color: rgb(var(--v-theme-primary));
  --fc-button-active-bg-color: rgb(var(--v-theme-primary));
  --fc-today-bg-color: rgb(var(--v-theme-primary), 0.1);
}

/* Turn booking highlighting */
:deep(.fc-event.booking-turn) {
  font-weight: bold;
  border-width: 2px !important;
  position: relative;
}

/* TURN label overlaid on the event bar at the turn day column */
:deep(.turn-event-badge) {
  position: absolute;
  top: 0;
  bottom: 0;
  background: linear-gradient(135deg, #e65100, #bf360c);
  color: #fff;
  font-size: 0.6em;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
  border-left: 2px solid rgba(255, 255, 255, 0.3);
  border-right: 2px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

/* Shimmer sweep across the badge */
:deep(.turn-event-badge)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 25%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.08) 75%,
    transparent 100%
  );
  will-change: transform;
  animation: turn-shimmer 2.5s ease-in-out infinite;
}

@keyframes turn-shimmer {
  0% { transform: translateX(-100%); }
  60% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

/* OUT (checkout) label overlaid on the event bar at the checkout day column */
:deep(.checkout-event-badge) {
  position: absolute;
  top: 0;
  bottom: 0;
  background: linear-gradient(135deg, #546e7a, #455a64);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.6em;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  border-right: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

/* Shimmer sweep across the OUT badge */
:deep(.checkout-event-badge)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 25%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.06) 75%,
    transparent 100%
  );
  will-change: transform;
  animation: turn-shimmer 3s ease-in-out infinite;
}

/* Standard booking styling */
.fc-event.booking-standard {
  border-width: 2px !important;
  position: relative;
}

.fc-event.booking-standard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(45deg, currentColor, transparent, currentColor);
  border-radius: 2px 2px 0 0;
}

/* Add elevation to all booking events */
:deep(.fc-event) {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06) !important;
  transition: all 0.2s ease !important;
  border-radius: 4px !important;
}

:deep(.fc-event:hover) {
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-1px) !important;
  cursor: grab !important;
}

:deep(.fc-event:active) {
  cursor: grabbing !important;
}

/* Drag feedback */
:deep(.fc-event-dragging) {
  opacity: 0.75 !important;
  transform: rotate(2deg) !important;
  z-index: 999 !important;
}

:deep(.fc-event-mirror) {
  opacity: 0.8 !important;
  transform: rotate(-2deg) !important;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-error), 0.7);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(var(--v-theme-error), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-error), 0);
  }
}

/* Status-based styling */
.fc-event.status-pending {
  opacity: 0.8;
}

.fc-event.status-completed {
  opacity: 0.6;
  text-decoration: line-through;
}

/* Custom event content */
.fc-event-content-wrapper {
  padding: 2px;
}

.fc-event-subtitle {
  font-size: 0.75em;
  opacity: 0.9;
  margin-top: 1px;
}

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

/* Mobile viewport specific fixes with proper height calculations */
@media (max-width: 959px) {
  .calendar-container {
    position: relative;
    /* Use calculated height instead of 100% */
    height: calc(
      100vh - 56px - 60px - env(safe-area-inset-top) -
        env(safe-area-inset-bottom) - 20px
    ) !important;
    min-height: 400px;
    /* Minimum height for very small screens */
    max-height: calc(100vh - 100px);
    /* Maximum height to prevent overflow */
  }

  .custom-calendar {
    position: relative;
    height: 100% !important;
    width: 100% !important;
  }

  /* Ensure FullCalendar takes full available space on mobile */
  :deep(.fc) {
    height: 100% !important;
    width: 100% !important;
  }

  :deep(.fc-view-harness) {
    height: 100% !important;
    width: 100% !important;
  }

  :deep(.fc-scroller) {
    height: 100% !important;
    overflow-y: auto !important;
    /* Smooth scrolling on mobile */
    -webkit-overflow-scrolling: touch;
  }

  /* Fix for mobile browser address bar height changes */
  :deep(.fc-daygrid-body) {
    min-height: 300px;
    /* Ensure minimum content height */
  }

  /* Prevent horizontal scrolling on mobile */
  :deep(.fc-daygrid-day-frame) {
    min-height: 40px;
  }

  /* Mobile-optimized event spacing */
  :deep(.fc-event) {
    margin: 1px 0;
    font-size: 0.75rem;
  }
}

/* Desktop-specific booking size optimization */
@media (min-width: 960px) {
  :deep(.fc-event) {
    font-size: 0.75rem !important;
    min-height: 22px !important;
    padding: 2px 4px !important;
    margin: 1px 0 !important;
  }

  :deep(.fc-event-title) {
    font-size: 0.75rem !important;
    line-height: 1.1 !important;
  }

  :deep(.fc-event-subtitle) {
    font-size: 0.65rem !important;
    line-height: 1 !important;
  }

  :deep(.fc-daygrid-day-frame) {
    min-height: 120px !important;
  }
}
</style>
