<template>
  <div class="owner-bookings-page">
    <v-container class="pt-0">
      <!-- Flat page header (no gradient) -->
      <div class="page-header">
        <div class="page-header__main">
          <div class="page-header__title-row">
            <h1 class="text-h5 font-weight-bold page-heading">My Bookings</h1>
            <v-chip color="primary" size="small" variant="tonal">
              {{ ownerBookingsArray.length }}
            </v-chip>
          </div>
          <p class="text-body-2 page-subheading">
            View and manage your upcoming and past bookings
          </p>
        </div>
        <v-btn
          class="flex-shrink-0"
          color="primary"
          icon="mdi-plus"
          size="small"
          @click="handleCreateBooking"
        />
      </div>

      <!-- Data Table -->
      <MaterioDataTable
        :active-filter-count="activeFilterCount"
        expandable
        :headers="tableHeaders"
        :items="bookingItems"
        :loading="loading"
        :search-keys="['property_name', 'status', 'booking_type']"
        searchable
      >
        <!-- Segment tabs -->
        <template #segments>
          <div class="d-flex ga-2 flex-wrap">
            <v-btn
              v-for="seg in segments"
              :key="seg.value"
              :color="selectedSegment === seg.value ? '#4338CA' : undefined"
              density="compact"
              size="small"
              :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
              @click="selectedSegment = seg.value"
            >
              {{ seg.title }}
            </v-btn>
          </div>
        </template>

        <!-- Filters -->
        <template #filters>
          <v-row align="center" density="comfortable">
            <v-col cols="12" sm="4">
              <v-select
                v-model="selectedProperty"
                clearable
                density="compact"
                hide-details
                :items="propertyOptions"
                label="Property"
                prepend-inner-icon="mdi-home-outline"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" sm="4">
              <v-select
                v-model="selectedStatus"
                clearable
                density="compact"
                hide-details
                :items="statusOptions"
                label="Status"
                prepend-inner-icon="mdi-filter-outline"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" sm="4">
              <v-select
                v-model="selectedType"
                clearable
                density="compact"
                hide-details
                :items="typeOptions"
                label="Type"
                prepend-inner-icon="mdi-tag-outline"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </template>

        <!-- Property column with color bar -->
        <template #[`item.property_name`]="{ item }">
          <div class="d-flex align-center ga-2">
            <div
              class="property-color-bar"
              :style="{ backgroundColor: getPropertyColor(item.property_id) }"
            />
            <span class="font-weight-medium text-body-2">{{ item.property_name }}</span>
          </div>
        </template>

        <!-- Dates column -->
        <template #[`item.dates`]="{ item }">
          <span class="text-body-2 dates-mono">{{ formatDateCondensed(item.checkin_date, item.checkout_date) }}</span>
        </template>

        <!-- Type chip -->
        <template #[`item.booking_type`]="{ item }">
          <v-chip
            :color="item.booking_type === 'turn' ? 'info' : 'primary'"
            size="small"
            variant="tonal"
          >
            {{ item.booking_type === 'turn' ? 'Turn' : 'Standard' }}
          </v-chip>
        </template>

        <!-- Status chip -->
        <template #[`item.status`]="{ item }">
          <v-chip
            :color="getBookingStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ formatStatusDisplay(item.status) }}
          </v-chip>
        </template>

        <!-- Guest count -->
        <template #[`item.guest_count`]="{ item }">
          <span class="text-body-2">{{ item.guest_count || '-' }}</span>
        </template>

        <!-- Actions -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              color="primary"
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click.stop="handleEditBooking(item)"
            />
            <v-btn
              color="error"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click.stop="handleDeleteBooking(item)"
            />
          </div>
        </template>

        <!-- Expanded row content -->
        <template #expand-content="{ item }">
          <div class="expanded-content pa-4">
            <v-row density="comfortable">
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Guest Name</div>
                  <div class="text-body-2">{{ item.notes || 'Not specified' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Notes</div>
                  <div class="text-body-2">{{ item.notes || 'None' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Created</div>
                  <div class="text-body-2">{{ item.created_at ? formatDate(String(item.created_at)) : 'N/A' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Priority</div>
                  <v-chip
                    :color="getPriorityColor(String(item.priority))"
                    size="small"
                    variant="tonal"
                  >
                    {{ item.priority }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </div>
        </template>
      </MaterioDataTable>

      <!-- Empty State -->
      <v-card v-if="!loading && ownerBookingsArray.length === 0" class="text-center pa-8 mt-4">
        <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-calendar-blank</v-icon>
        <h3 class="text-h6 mb-2">No Bookings Yet</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">Create your first booking to get started.</p>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="handleCreateBooking">
          Create Booking
        </v-btn>
      </v-card>
      <ConfirmationDialog
        confirm-text="Delete"
        dangerous
        :message="`Are you sure you want to delete this booking for ${bookingToDelete ? getPropertyName(bookingToDelete.property_id) : ''}?`"
        :open="deleteConfirmOpen"
        title="Delete Booking"
        @cancel="deleteConfirmOpen = false"
        @confirm="confirmDeleteBooking"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { Booking, ModalData } from '@/types'
  import { computed, onMounted, ref } from 'vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import MaterioDataTable from '@/components/dumb/shared/MaterioDataTable.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { formatStatus, getBookingStatusColor, mapLegacyPropertyColor } from '@/utils/constants'

  defineOptions({
    name: 'OwnerBookingsComponent',
  })

  // Composables
  const {
    myBookings: ownerBookings,
    fetchMyBookings,
    deleteMyBooking,
  } = useOwnerBookings()

  const {
    myProperties: ownerProperties,
    fetchMyProperties,
  } = useOwnerProperties()

  // Stores
  const uiStore = useUIStore()

  // Reactive state
  const selectedProperty = ref<string | null>(null)
  const selectedStatus = ref<string | null>(null)
  const selectedType = ref<string | null>(null)
  const loading = ref(false)
  const deleteConfirmOpen = ref(false)
  const bookingToDelete = ref<Booking | null>(null)
  const selectedSegment = ref('all')

  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'Done', value: 'completed' },
  ]

  const activeFilterCount = computed(() => {
    let count = 0
    if (selectedProperty.value) count++
    if (selectedStatus.value) count++
    if (selectedType.value) count++
    return count
  })

  // Computed
  const ownerBookingsArray = computed(() => ownerBookings.value)

  const propertyOptions = computed(() =>
    ownerProperties.value.map(p => ({
      title: formatPropertyAddress(p, 'short'),
      value: p.id,
    })),
  )

  const statusOptions = [
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'In Progress', value: 'in_progress' },
    { title: 'Completed', value: 'completed' },
  ]

  const typeOptions = [
    { title: 'Standard', value: 'standard' },
    { title: 'Turn', value: 'turn' },
  ]

  const bookingItems = computed(() => {
    let filtered = ownerBookingsArray.value

    // Segment filter
    if (selectedSegment.value !== 'all') {
      filtered = filtered.filter(b => b.status === selectedSegment.value)
    }

    if (selectedProperty.value) {
      filtered = filtered.filter(b => b.property_id === selectedProperty.value)
    }

    if (selectedStatus.value) {
      filtered = filtered.filter(b => b.status === selectedStatus.value)
    }

    if (selectedType.value) {
      filtered = filtered.filter(b => b.booking_type === selectedType.value)
    }

    return filtered.map(booking => ({
      ...booking,
      property_name: getPropertyName(booking.property_id),
    })).toSorted((a, b) =>
      new Date(b.checkout_date).getTime() - new Date(a.checkout_date).getTime(),
    )
  })

  const tableHeaders = [
    { title: 'Property', key: 'property_name', sortable: true },
    { title: 'Dates', key: 'dates', sortable: false },
    { title: 'Type', key: 'booking_type', sortable: true, mobileHidden: true },
    { title: 'Status', key: 'status', sortable: true, mobileHidden: true },
    { title: 'Guests', key: 'guest_count', sortable: true, width: '90px', mobileHidden: true },
    { title: 'Actions', key: 'actions', sortable: false, width: '100px', align: 'end' as const, mobileHidden: true },
  ]

  // Methods
  function getPropertyName (propertyId: string): string {
    const property = ownerProperties.value.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  }

  function getPropertyColor (propertyId: string): string {
    const property = ownerProperties.value.find(p => p.id === propertyId)
    return mapLegacyPropertyColor(property?.color, '#9E9E9E')
  }

  function formatStatusDisplay (status: string): string {
    return formatStatus(status).replace(/\b\w/g, c => c.toUpperCase())
  }

  function getPriorityColor (priority: string): string {
    const colors: Record<string, string> = {
      low: 'grey',
      normal: 'info',
      high: 'warning',
      urgent: 'error',
    }
    return colors[priority] || 'grey'
  }

  function formatDate (dateString: string): string {
    const [y, m, d] = dateString.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatDateCondensed (checkinDate: string, checkoutDate: string): string {
    const [cy, cm, cd] = checkinDate.split('-').map(Number)
    const [oy, om, od] = checkoutDate.split('-').map(Number)
    const checkin = new Date(cy, cm - 1, cd)
    const checkout = new Date(oy, om - 1, od)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const cMonth = months[checkin.getMonth()]
    const cDay = checkin.getDate()
    const oMonth = months[checkout.getMonth()]
    const oDay = checkout.getDate()

    if (cMonth === oMonth) {
      return `${cMonth} ${cDay}\u2013${oDay}`
    }
    return `${cMonth} ${cDay}\u2013${oMonth} ${oDay}`
  }

  // Event handlers
  function handleCreateBooking (): void {
    uiStore.openModal('eventModal', 'create')
  }

  function handleEditBooking (booking: Booking): void {
    uiStore.openModal('eventModal', 'edit', { booking: booking as unknown as ModalData })
  }

  function handleDeleteBooking (booking: Booking): void {
    bookingToDelete.value = booking
    deleteConfirmOpen.value = true
  }

  async function confirmDeleteBooking (): Promise<void> {
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

  // Initialize data
  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([
        fetchMyBookings(),
        fetchMyProperties(),
      ])
    } catch (error) {
      console.error('Failed to load bookings data:', error)
      uiStore.addNotification('error', 'Load Failed', 'Could not load bookings. Please refresh the page.')
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
.owner-bookings-page {
  min-height: calc(100vh - var(--app-bar-height, 32px));
}

/* Property color bar */
.property-color-bar {
  width: 3px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* Condensed monospace dates */
.dates-mono {
  font-family: 'Geist Mono', 'Roboto Mono', monospace;
  font-size: 12px;
  color: #555;
}
</style>
