<template>
  <div class="owner-bookings-page">
    <v-container class="pt-0">

      <!-- Hero banner replaces OwnerPageHeader -->
      <OwnerWelcomeBanner
        class="mb-6"
        page-title="My Bookings"
        :stats="[
          { icon: 'mdi-calendar-check', label: 'Total', value: myBookings.length },
          { icon: 'mdi-calendar-week', label: 'This Week', value: weekCheckinCount },
        ]"
        subtitle="View and manage your upcoming and past bookings"
      />

      <!-- Segment tabs + search row -->
      <div class="bookings-toolbar">
        <div class="bookings-segments glass-card">
          <v-btn-toggle
            v-model="selectedSegment"
            color="primary"
            density="compact"
            mandatory
            rounded="pill"
            variant="text"
          >
            <v-btn
              v-for="seg in segments"
              :key="seg.value"
              class="seg-btn"
              :value="seg.value"
            >
              {{ seg.title }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <div class="bookings-filters">
          <v-select
            v-model="selectedProperty"
            class="filter-select"
            clearable
            density="comfortable"
            hide-details
            :items="propertyOptions"
            label="Property"
            prepend-inner-icon="mdi-home-outline"
            variant="outlined"
          />

          <v-select
            v-model="selectedType"
            class="filter-select"
            clearable
            density="comfortable"
            hide-details
            :items="typeOptions"
            label="Type"
            prepend-inner-icon="mdi-tag-outline"
            variant="outlined"
          />
        </div>
      </div>

      <!-- Booking accordion list -->
      <OwnerBookingList
        :items="filteredItems"
        :loading="loading"
        @cancel="handleCancelBooking"
        @contact-admin="showContactSnackbar"
        @edit="handleEditBooking"
      />

      <!-- Confirm cancel -->
      <ConfirmationDialog
        confirm-text="Cancel Booking"
        :message="`Cancel this booking at ${bookingToCancelName}? Your cleaning company will be notified.`"
        :open="cancelConfirmOpen"
        title="Cancel Booking"
        @cancel="cancelConfirmOpen = false"
        @confirm="confirmCancelBooking"
      />

      <!-- Contact Admin snackbar -->
      <v-snackbar v-model="contactSnackbarOpen" color="surface-variant" location="bottom" :timeout="3500">
        <v-icon class="mr-2" size="18">mdi-message-outline</v-icon>
        Direct messaging with your cleaning team is coming soon.
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { BookingListItem } from '@/components/dumb/owner/OwnerBookingList.vue'
  import type { Booking, ModalData } from '@/types'

  import { computed, onMounted, ref } from 'vue'
  import OwnerBookingList from '@/components/dumb/owner/OwnerBookingList.vue'
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { mapLegacyPropertyColor } from '@/utils/constants'

  defineOptions({ name: 'OwnerBookingsComponent' })

  const { myBookings, fetchMyBookings, changeMyBookingStatus } = useOwnerBookings()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const uiStore = useUIStore()

  const selectedProperty = ref<string | null>(null)
  const selectedType = ref<string | null>(null)
  const selectedSegment = ref('upcoming')
  const loading = ref(false)
  const cancelConfirmOpen = ref(false)
  const bookingToCancel = ref<Booking | null>(null)
  const contactSnackbarOpen = ref(false)

  const segments = [
    { title: 'Upcoming', value: 'upcoming' },
    { title: 'All', value: 'all' },
    { title: 'Same-day stays', value: 'turns' },
    { title: 'Past', value: 'past' },
  ]

  const typeOptions = [
    { title: 'Standard', value: 'standard' },
    { title: 'Same-day stay', value: 'turn' },
  ]

  const propertyOptions = computed(() =>
    myProperties.value.map(p => ({
      title: formatPropertyAddress(p, 'short'),
      value: p.id,
    })),
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const weekAhead = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })()

  const weekCheckinCount = computed(() =>
    myBookings.value.filter(b =>
      b.checkin_date >= todayStr && b.checkin_date <= weekAhead
      && b.status !== 'cancelled',
    ).length,
  )

  const filteredItems = computed((): BookingListItem[] => {
    let bookings = myBookings.value.filter(b => b.status !== 'cancelled')

    // Segment
    switch (selectedSegment.value) {
      case 'upcoming': {
        bookings = bookings.filter(b => b.checkout_date >= todayStr)

        break
      }
      case 'turns': {
        bookings = bookings.filter(b => b.booking_type === 'turn')

        break
      }
      case 'past': {
        bookings = bookings.filter(b => b.checkout_date < todayStr)

        break
      }
    // No default
    }

    // Filters
    if (selectedProperty.value) {
      bookings = bookings.filter(b => b.property_id === selectedProperty.value)
    }
    if (selectedType.value) {
      bookings = bookings.filter(b => b.booking_type === selectedType.value)
    }

    return bookings
      .toSorted((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      .map(b => {
        const property = myProperties.value.find(p => p.id === b.property_id)
        return {
          id: b.id,
          propertyName: property ? formatPropertyAddress(property, 'short') : 'Unknown',
          propertyColor: mapLegacyPropertyColor(property?.color),
          checkinDate: b.checkin_date,
          checkoutDate: b.checkout_date,
          bookingType: b.booking_type as 'standard' | 'turn',
          status: b.status,
          guestCount: b.guest_count ?? undefined,
          checkinTime: b.checkin_time ?? undefined,
          checkoutTime: b.checkout_time ?? undefined,
          notes: b.notes ?? undefined,
          priority: b.priority ?? undefined,
          createdAt: b.created_at ?? undefined,
        }
      })
  })

  const bookingToCancelName = computed(() => {
    if (!bookingToCancel.value) return ''
    const p = myProperties.value.find(p => p.id === bookingToCancel.value!.property_id)
    return p ? formatPropertyAddress(p, 'short') : 'this property'
  })

  function handleEditBooking (id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) uiStore.openModal('eventModal', 'edit', { booking: booking as unknown as ModalData })
  }

  function handleCancelBooking (id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) {
      bookingToCancel.value = booking
      cancelConfirmOpen.value = true
    }
  }

  async function confirmCancelBooking (): Promise<void> {
    if (!bookingToCancel.value) return
    try {
      await changeMyBookingStatus(bookingToCancel.value.id, 'cancelled')
      uiStore.addNotification('success', 'Cancelled', 'Booking cancelled successfully')
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      uiStore.addNotification('error', 'Cancel Failed', error instanceof Error ? error.message : 'Could not cancel booking')
    } finally {
      cancelConfirmOpen.value = false
      bookingToCancel.value = null
    }
  }

  function showContactSnackbar (): void {
    contactSnackbarOpen.value = true
  }

  onMounted(async () => {
    loading.value = true
    const [bookResult, propResult] = await Promise.allSettled([
      fetchMyBookings(),
      fetchMyProperties(),
    ])
    loading.value = false
    if (bookResult.status === 'rejected' || propResult.status === 'rejected') {
      const failed = [
        bookResult.status === 'rejected' ? 'bookings' : null,
        propResult.status === 'rejected' ? 'properties' : null,
      ].filter(Boolean).join(' and ')
      const reason = bookResult.status === 'rejected' ? bookResult.reason : (propResult as PromiseRejectedResult).reason
      console.error('Failed to load bookings data:', reason)
      uiStore.addNotification('error', 'Load Error', `Failed to load ${failed}. Please refresh.`)
    }
  })
</script>

<style scoped>
.owner-bookings-page {
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* ── Toolbar ── */
.bookings-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.bookings-segments {
  padding: 4px;
  border-radius: 9999px !important;
  background: var(--claro-glass-bg);
  backdrop-filter: var(--claro-glass-blur);
  border: 1px solid var(--claro-glass-border) !important;
}

.seg-btn {
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 0.7;
  height: 36px !important;
  min-width: 90px !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.seg-btn.v-btn--active {
  opacity: 1;
  background: rgb(var(--v-theme-primary)) !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3) !important;
}

.bookings-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
}

.filter-select {
  min-width: 180px;
  max-width: 240px;
}

/* ── Page header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: var(--claro-space-xl, 32px) 0 var(--claro-space-lg, 24px);
}

.page-header__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.page-heading {
  color: var(--claro-fg1);
  letter-spacing: -0.01em;
}

.page-subheading {
  color: var(--claro-fg3);
}
</style>
