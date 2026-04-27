<template>
  <div class="owner-bookings-page">
    <v-container class="pt-0">

      <!-- Uniform page header -->
      <OwnerPageHeader
        :badge="filteredItems.length"
        subtitle="View and manage your upcoming and past bookings"
        title="My Bookings"
      >
        <template #actions>
          <v-btn
            aria-label="Add booking"
            color="primary"
            icon="mdi-plus"
            size="small"
            @click="handleCreateBooking"
          />
        </template>
      </OwnerPageHeader>

      <!-- Segment tabs + search row -->
      <div class="bookings-toolbar">
        <div class="bookings-segments">
          <button
            v-for="seg in segments"
            :key="seg.value"
            class="seg-btn"
            :class="{ 'seg-btn--active': selectedSegment === seg.value }"
            @click="selectedSegment = seg.value"
          >
            {{ seg.title }}
          </button>
        </div>

        <div class="bookings-filters">
          <v-select
            v-model="selectedProperty"
            clearable
            density="compact"
            hide-details
            :items="propertyOptions"
            label="Property"
            prepend-inner-icon="mdi-home-outline"
            style="max-width: 200px"
            variant="outlined"
          />
          <v-select
            v-model="selectedType"
            clearable
            density="compact"
            hide-details
            :items="typeOptions"
            label="Type"
            prepend-inner-icon="mdi-tag-outline"
            style="max-width: 150px"
            variant="outlined"
          />
        </div>
      </div>

      <!-- Booking accordion list -->
      <OwnerBookingList
        :items="filteredItems"
        :loading="loading"
        @delete="handleDeleteBooking"
        @edit="handleEditBooking"
      />

      <!-- Confirm delete -->
      <ConfirmationDialog
        confirm-text="Delete"
        dangerous
        :message="`Delete this booking at ${bookingToDeleteName}?`"
        :open="deleteConfirmOpen"
        title="Delete Booking"
        @cancel="deleteConfirmOpen = false"
        @confirm="confirmDeleteBooking"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types'
  import type { ModalData } from '@/types'
  import { computed, onMounted, ref } from 'vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import OwnerBookingList from '@/components/dumb/owner/OwnerBookingList.vue'
  import OwnerPageHeader from '@/components/dumb/shared/OwnerPageHeader.vue'
  import type { BookingListItem } from '@/components/dumb/owner/OwnerBookingList.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { mapLegacyPropertyColor } from '@/utils/constants'

  defineOptions({ name: 'OwnerBookingsComponent' })

  const { myBookings, fetchMyBookings, deleteMyBooking } = useOwnerBookings()
  const { myProperties, fetchMyProperties } = useOwnerProperties()
  const uiStore = useUIStore()

  const selectedProperty = ref<string | null>(null)
  const selectedType     = ref<string | null>(null)
  const selectedSegment  = ref('upcoming')
  const loading          = ref(false)
  const deleteConfirmOpen = ref(false)
  const bookingToDelete   = ref<Booking | null>(null)

  const segments = [
    { title: 'Upcoming', value: 'upcoming' },
    { title: 'All',      value: 'all'      },
    { title: 'Turns',    value: 'turns'    },
    { title: 'Past',     value: 'past'     },
  ]

  const typeOptions = [
    { title: 'Standard', value: 'standard' },
    { title: 'Turn',     value: 'turn'     },
  ]

  const propertyOptions = computed(() =>
    myProperties.value.map(p => ({
      title: formatPropertyAddress(p, 'short'),
      value: p.id,
    })),
  )

  const todayStr = new Date().toISOString().split('T')[0]

  const filteredItems = computed((): BookingListItem[] => {
    let bookings = myBookings.value.filter(b => b.status !== 'cancelled')

    // Segment
    if (selectedSegment.value === 'upcoming') {
      bookings = bookings.filter(b => b.checkout_date >= todayStr)
    } else if (selectedSegment.value === 'turns') {
      bookings = bookings.filter(b => b.booking_type === 'turn')
    } else if (selectedSegment.value === 'past') {
      bookings = bookings.filter(b => b.checkout_date < todayStr)
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
          id:            b.id,
          propertyName:  property ? formatPropertyAddress(property, 'short') : 'Unknown',
          propertyColor: mapLegacyPropertyColor(property?.color),
          checkinDate:   b.checkin_date,
          checkoutDate:  b.checkout_date,
          bookingType:   b.booking_type as 'standard' | 'turn',
          status:        b.status,
          guestCount:    b.guest_count ?? undefined,
          checkinTime:   b.checkin_time ?? undefined,
          checkoutTime:  b.checkout_time ?? undefined,
          notes:         b.notes ?? undefined,
          priority:      b.priority ?? undefined,
          createdAt:     b.created_at ?? undefined,
        }
      })
  })

  const bookingToDeleteName = computed(() => {
    if (!bookingToDelete.value) return ''
    const p = myProperties.value.find(p => p.id === bookingToDelete.value!.property_id)
    return p ? formatPropertyAddress(p, 'short') : 'this property'
  })

  function handleCreateBooking(): void {
    uiStore.openModal('eventModal', 'create')
  }

  function handleEditBooking(id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) uiStore.openModal('eventModal', 'edit', { booking: booking as unknown as ModalData })
  }

  function handleDeleteBooking(id: string): void {
    const booking = myBookings.value.find(b => b.id === id)
    if (booking) {
      bookingToDelete.value = booking
      deleteConfirmOpen.value = true
    }
  }

  async function confirmDeleteBooking(): Promise<void> {
    if (!bookingToDelete.value) return
    try {
      await deleteMyBooking(bookingToDelete.value.id)
      uiStore.addNotification('success', 'Deleted', 'Booking deleted successfully')
    } catch (error) {
      console.error('Failed to delete booking:', error)
      uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete booking')
    } finally {
      deleteConfirmOpen.value = false
      bookingToDelete.value = null
    }
  }

  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([fetchMyBookings(), fetchMyProperties()])
    } catch (error) {
      console.error('Failed to load bookings:', error)
      uiStore.addNotification('error', 'Load Failed', 'Could not load bookings. Please refresh.')
    } finally {
      loading.value = false
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
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.bookings-segments {
  display: flex;
  gap: 0;
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  overflow: hidden;
  background: var(--claro-surface);
}

.seg-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--claro-font-family);
  color: var(--claro-fg3);
  background: transparent;
  border: none;
  border-right: 1px solid var(--claro-border);
  cursor: pointer;
  transition: background var(--claro-dur-fast) var(--claro-ease), color var(--claro-dur-fast) var(--claro-ease);
}

.seg-btn:last-child {
  border-right: none;
}

.seg-btn--active {
  background: var(--claro-primary-tint);
  color: var(--claro-primary-dark);
  font-weight: 600;
}

.seg-btn:hover:not(.seg-btn--active) {
  background: rgba(46, 38, 61, 0.04);
  color: var(--claro-fg1);
}

.bookings-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
