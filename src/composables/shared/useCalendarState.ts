import { ref, computed } from 'vue';
import { getActivePinia } from 'pinia';
import { useUIStore } from '@/stores/ui';
import { useBookingStore } from '@/stores/booking';
import type { Booking } from '@/types';

const __DEV__ = import.meta.env.DEV;

// ============================================================================
// SINGLETON STATE — shared across all consumers (layout, pages, components)
// ============================================================================

const currentView = ref<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
const currentDate = ref<Date>(new Date());
const dateRange = ref<{ start: Date; end: Date }>({
  start: new Date(),
  end: new Date(new Date().setDate(new Date().getDate() + 7))
});

const showPendingBookings = ref<boolean>(true);
const showScheduledBookings = ref<boolean>(true);
const showInProgressBookings = ref<boolean>(true);
const showCompletedBookings = ref<boolean>(false);
const showCancelledBookings = ref<boolean>(false);
const showTurnBookings = ref<boolean>(true);
const showStandardBookings = ref<boolean>(true);

const selectedPropertyIds = ref<Set<string>>(new Set());

const viewMode = ref<'ranges' | 'events'>('ranges');

// ============================================================================

/**
 * Composable for calendar view state management
 * Controls calendar display options, date ranges, and filtering
 *
 * State is module-scoped (singleton) so layout + page + components share
 * the same currentDate / currentView.
 */
export function useCalendarState() {
  if (!getActivePinia()) {
    throw new Error('[useCalendarState] Pinia is not installed. This composable must be called within a Vue setup() context with Pinia active.');
  }

  const uiStore = useUIStore();
  const bookingStore = useBookingStore();

  /**
   * Change calendar view
   */
  function setCalendarView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek') {
    currentView.value = view;
    uiStore.setFilter('calendarView', view);
  }

  function setViewMode(mode: 'ranges' | 'events') {
    viewMode.value = mode;
  }

  /**
   * Navigate to specific date
   */
  function goToDate(date: Date) {
    currentDate.value = date;
    updateDateRange();
  }

  /**
   * Navigate to today
   */
  function goToToday() {
    currentDate.value = new Date();
    updateDateRange();
  }

  /**
   * Navigate to next period (day/week/month)
   */
  function next() {
    const date = new Date(currentDate.value);

    if (currentView.value === 'dayGridMonth') {
      date.setMonth(date.getMonth() + 1);
    } else if (currentView.value === 'timeGridWeek') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setDate(date.getDate() + 1);
    }

    currentDate.value = date;
    updateDateRange();
  }

  /**
   * Navigate to previous period (day/week/month)
   */
  function prev() {
    const date = new Date(currentDate.value);

    if (currentView.value === 'dayGridMonth') {
      date.setMonth(date.getMonth() - 1);
    } else if (currentView.value === 'timeGridWeek') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setDate(date.getDate() - 1);
    }

    currentDate.value = date;
    updateDateRange();
  }

  /**
   * Update date range based on current view and date
   */
  function updateDateRange() {
    let date: Date;
    if (currentDate.value instanceof Date && !isNaN(currentDate.value.getTime())) {
      date = new Date(currentDate.value);
    } else {
      console.warn('[useCalendarState] currentDate.value is invalid, using current date');
      date = new Date();
      currentDate.value = date;
    }

    let start: Date;
    let end: Date;

    if (currentView.value === 'dayGridMonth') {
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    } else if (currentView.value === 'timeGridWeek') {
      const day = date.getDay();
      start = new Date(date);
      start.setDate(date.getDate() - day);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else {
      start = new Date(date);
      end = new Date(date);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    dateRange.value = { start, end };
  }

  function toggleStatusFilter(status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
    switch (status) {
      case 'pending':
        showPendingBookings.value = !showPendingBookings.value;
        break;
      case 'scheduled':
        showScheduledBookings.value = !showScheduledBookings.value;
        break;
      case 'in_progress':
        showInProgressBookings.value = !showInProgressBookings.value;
        break;
      case 'completed':
        showCompletedBookings.value = !showCompletedBookings.value;
        break;
      case 'cancelled':
        showCancelledBookings.value = !showCancelledBookings.value;
        break;
    }

    uiStore.setFilter(`show${status.charAt(0).toUpperCase() + status.slice(1)}`,
      status === 'pending' ? showPendingBookings.value :
      status === 'scheduled' ? showScheduledBookings.value :
      status === 'in_progress' ? showInProgressBookings.value :
      status === 'completed' ? showCompletedBookings.value :
      showCancelledBookings.value
    );
  }

  function toggleTypeFilter(type: 'turn' | 'standard') {
    if (type === 'turn') {
      showTurnBookings.value = !showTurnBookings.value;
      uiStore.setFilter('showTurnBookings', showTurnBookings.value);
    } else {
      showStandardBookings.value = !showStandardBookings.value;
      uiStore.setFilter('showStandardBookings', showStandardBookings.value);
    }
  }

  function togglePropertyFilter(propertyId: string) {
    if (selectedPropertyIds.value.has(propertyId)) {
      selectedPropertyIds.value.delete(propertyId);
    } else {
      selectedPropertyIds.value.add(propertyId);
    }
    uiStore.setFilter('selectedProperties', Array.from(selectedPropertyIds.value));
  }

  function clearPropertyFilters() {
    selectedPropertyIds.value.clear();
    uiStore.setFilter('selectedProperties', []);
  }

  function filterBookings(bookings: Booking[]): Booking[] {
    try {
    const filtered = bookings.filter(booking => {
      if (
        (booking.status === 'pending' && !showPendingBookings.value) ||
        (booking.status === 'scheduled' && !showScheduledBookings.value) ||
        (booking.status === 'in_progress' && !showInProgressBookings.value) ||
        (booking.status === 'completed' && !showCompletedBookings.value) ||
        (booking.status === 'cancelled' && !showCancelledBookings.value)
      ) {
        return false;
      }

      if (
        (booking.booking_type === 'turn' && !showTurnBookings.value) ||
        (booking.booking_type === 'standard' && !showStandardBookings.value)
      ) {
        return false;
      }

      if (selectedPropertyIds.value.size > 0 && !selectedPropertyIds.value.has(booking.property_id)) {
        return false;
      }

      return true;
    });

    if (__DEV__) console.log(`[useCalendarState] Filtered ${bookings.length} bookings down to ${filtered.length}`);

    return filtered;
    } catch (error) {
      console.error('[useCalendarState] Error in filterBookings:', error);
      return [];
    }
  }

  function getFormattedDateRange(): string {
    const start = dateRange.value.start;
    const end = dateRange.value.end;
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };

    if (
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return start.toLocaleDateString('en-US', options);
    } else if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.getDate()} - ${end.toLocaleDateString('en-US', options)}`;
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    } else {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
  }

  // Initialize date range on creation
  updateDateRange();

  return {
    // State
    currentView,
    currentDate,
    showPendingBookings,
    showScheduledBookings,
    showInProgressBookings,
    showCompletedBookings,
    showCancelledBookings,
    showTurnBookings,
    showStandardBookings,
    selectedPropertyIds,
    viewMode,

    // Calendar navigation
    setCalendarView,
    setViewMode,
    goToDate,
    goToToday,
    next,
    prev,

    // Filtering
    toggleStatusFilter,
    toggleTypeFilter,
    togglePropertyFilter,
    clearPropertyFilters,
    filterBookings,

    // Formatting and conversion
    getFormattedDateRange,

    // Computed properties
    formattedDateRange: computed(() => getFormattedDateRange()),
    filteredBookings: computed(() => filterBookings(bookingStore.bookingsArray)),
  };
}
