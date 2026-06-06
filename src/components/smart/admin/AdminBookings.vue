<template>
  <div class="admin-bookings-page">
    <!-- Bookings Data Table -->
    <AppDataTable
      :active-filter-count="activeFilterCount"
      :headers="tableHeaders"
      :items="tableItems"
      :items-per-page="25"
      :loading="tableLoading"
      :row-props="bookingRowProps"
      :search-keys="['propertyName', 'ownerName', 'cleanerName', 'status', 'booking_type']"
      searchable
      subtitle="Manage all bookings across all properties and clients"
      title="All Bookings"
    >
      <!-- Header actions -->
      <template #header-actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateBookingDialog"
        >
          New Booking
        </v-btn>
      </template>

      <!-- Segment tabs -->
      <template #segments>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn
            v-for="seg in segments"
            :key="seg.value"
            color="primary"
            density="compact"
            size="small"
            :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
            @click="selectedSegment = seg.value"
          >
            {{ seg.title }}
          </v-btn>
        </div>
      </template>

      <!-- Collapsible filters -->
      <template #filters>
        <v-row align="center" density="comfortable">
          <v-col cols="6" md="2" sm="3">
            <v-select
              v-model="statusFilter"
              clearable
              density="compact"
              hide-details
              :items="statusOptions"
              placeholder="Status"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2" sm="3">
            <v-select
              v-model="typeFilter"
              clearable
              density="compact"
              hide-details
              :items="typeOptions"
              placeholder="Type"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="3" sm="6">
            <v-select
              v-model="propertyFilter"
              clearable
              density="compact"
              hide-details
              :items="propertyOptions"
              placeholder="Property"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2.5" sm="3">
            <v-text-field
              v-model="dateFrom"
              density="compact"
              hide-details
              placeholder="From"
              type="date"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2.5" sm="3">
            <v-text-field
              v-model="dateTo"
              density="compact"
              hide-details
              placeholder="To"
              type="date"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </template>
      <!-- Property Column -->
      <template #[`item.propertyName`]="{ item }">
        <div class="d-flex align-center ga-2">
          <div
            class="property-color-dot"
            :style="{ background: getPropertyColor(item.property_id as string) }"
          />

          <div style="min-width:0">
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ item.propertyName }}
            </div>

            <div class="text-caption text-medium-emphasis text-truncate">
              {{ item.ownerName }}
            </div>
          </div>
        </div>
      </template>

      <!-- Dates Column -->
      <template #[`item.dates`]="{ item }">
        <div class="text-body-2 text-no-wrap">
          <div>{{ formatDate(item.checkin_date as string) }}</div>

          <div class="text-caption text-medium-emphasis">
            &rarr; {{ formatDate(item.checkout_date as string) }}
          </div>
        </div>
      </template>

      <!-- Type Column (chip) -->
      <template #[`item.booking_type`]="{ item }">
        <v-chip
          class="text-capitalize"
          :color="item.booking_type === 'turn' ? 'warning' : 'primary'"
          size="small"
          variant="outlined"
        >
          {{ item.booking_type }}
        </v-chip>
      </template>

      <!-- Status Column (chip) -->
      <template #[`item.status`]="{ item }">
        <v-chip
          class="text-capitalize"
          :color="getStatusColor(item.status as string)"
          :size="mobile ? 'x-small' : 'small'"
          variant="flat"
        >
          {{ (item.status as string).replace('_', ' ') }}
        </v-chip>
      </template>

      <!-- Priority Column (badge) -->
      <template #[`item.priority`]="{ item }">
        <v-chip
          v-if="item.priority !== 'normal'"
          class="text-capitalize font-weight-bold"
          :color="getPriorityColor(item.priority as string)"
          size="x-small"
          variant="flat"
        >
          {{ item.priority }}
        </v-chip>

        <span v-else class="text-caption text-medium-emphasis">&mdash;</span>
      </template>

      <!-- Cleaner Column -->
      <template #[`item.cleanerName`]="{ item }">
        <span v-if="item.assigned_cleaner_id" class="text-body-2">
          {{ item.cleanerName }}
        </span>

        <span v-else class="text-caption text-medium-emphasis font-italic">Unassigned</span>
      </template>

      <!-- Actions Column -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-tooltip v-if="!item.assigned_cleaner_id" location="top" text="Assign cleaner">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                color="primary"
                icon="mdi-account-plus"
                size="small"
                variant="text"
                v-bind="tooltipProps"
                @click.stop="assignCleaner(item as unknown as Booking)"
              />
            </template>
          </v-tooltip>

          <v-tooltip location="top" text="Edit">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                v-bind="tooltipProps"
                @click.stop="editBooking(item as unknown as Booking)"
              />
            </template>
          </v-tooltip>

          <v-tooltip location="top" text="Cancel booking">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                color="error"
                icon="mdi-close-circle-outline"
                size="small"
                variant="text"
                v-bind="tooltipProps"
                @click.stop="cancelBooking(item as unknown as Booking)"
              />
            </template>
          </v-tooltip>
        </div>
      </template>

    </AppDataTable>

    <!-- Create/Edit Booking Dialog -->
    <AdminBookingForm
      v-model="showBookingDialog"
      :booking="editingBooking"
      :cleaners="availableCleaners"
      :loading="bookingFormLoading"
      :mode="editingBooking ? 'edit' : 'create'"
      :properties="allProperties"
      @delete="handleDeleteBooking"
      @mark-complete="handleMarkComplete"
      @submit="handleSubmitBooking"
    />

    <!-- Cleaner Assignment Dialog -->
    <v-dialog
      v-model="showCleanerDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Assign Cleaner</v-card-title>

        <v-card-text>
          <v-select
            v-model="selectedCleaner"
            item-title="name"
            item-value="id"
            :items="cleanerOptions"
            label="Select Cleaner"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="closeCleanerDialog">
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            @click="confirmCleanerAssignment"
          >
            Assign
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Cancel Confirmation Dialog -->
    <ConfirmationDialog
      v-model="showCancelConfirm"
      confirm-color="error"
      confirm-text="Cancel Booking"
      message="Are you sure you want to cancel this booking? This action cannot be undone."
      title="Cancel Booking"
      @confirm="confirmCancelBooking"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types/booking'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import AdminBookingForm from '@/components/dumb/admin/AdminBookingForm.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import AppDataTable from '@/components/dumb/shared/AppDataTable.vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { getBookingStatusColor, mapLegacyPropertyColor } from '@/utils/constants'

  // Composables
  const route = useRoute()
  const { mobile } = useDisplay()
  const { allBookings, updateBooking, createBooking, deleteBooking, fetchAllBookings } = useAdminBookings()
  const { allProperties, fetchAllProperties } = useAdminProperties()
  const { availableCleaners } = useCleanerManagement()
  const uiStore = useUIStore()

  const tableLoading = ref(true)

  // Data fetching on mount
  onMounted(async () => {
    try {
      await Promise.all([
        fetchAllBookings(),
        fetchAllProperties(),
      ])
      if (route.query.create === 'true') {
        openCreateBookingDialog()
      }
    } catch (error) {
      console.error('Failed to load bookings data:', error)
      uiStore.addNotification('error', 'Error', 'Failed to load bookings data. Please refresh.')
    } finally {
      tableLoading.value = false
    }
  })

  // Reactive state
  const statusFilter = ref('')
  const typeFilter = ref('')
  const propertyFilter = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const selectedSegment = ref('all')

  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'In Progress', value: 'in_progress' },
    { title: 'Done', value: 'completed' },
  ]

  const activeFilterCount = computed(() => {
    let count = 0
    if (statusFilter.value) count++
    if (typeFilter.value) count++
    if (propertyFilter.value) count++
    if (dateFrom.value) count++
    if (dateTo.value) count++
    return count
  })

  // Dialog state
  const showBookingDialog = ref(false)
  const showCleanerDialog = ref(false)
  const editingBooking = ref<Booking | null>(null)
  const bookingFormLoading = ref(false)
  const selectedBookingForCleaner = ref<Booking | null>(null)
  const selectedCleaner = ref('')

  // Cancel confirmation dialog state
  const showCancelConfirm = ref(false)
  const cancelTarget = ref<Booking | null>(null)

  // Filter options
  const statusOptions = [
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'In Progress', value: 'in_progress' },
    { title: 'Completed', value: 'completed' },
    { title: 'Cancelled', value: 'cancelled' },
  ]

  const typeOptions = [
    { title: 'Standard', value: 'standard' },
    { title: 'Turn', value: 'turn' },
  ]

  // Table headers
  const tableHeaders = computed(() => [
    { title: 'Property', key: 'propertyName', sortable: true },
    { title: 'Dates', key: 'dates', sortable: false, width: '160px' },
    { title: 'Type', key: 'booking_type', sortable: true, width: '110px', mobileHidden: true },
    { title: 'Status', key: 'status', sortable: true, width: '120px', mobileHidden: true },
    { title: 'Priority', key: 'priority', sortable: true, width: '100px', mobileHidden: true },
    { title: 'Cleaner', key: 'cleanerName', sortable: true, width: '140px', mobileHidden: true },
    { title: '', key: 'actions', sortable: false, width: '130px', align: 'end' as const, mobileHidden: true },
  ])

  // Row props: clicking a row opens the edit dialog (action buttons use @click.stop to override)
  function bookingRowProps ({ item }: { item: Record<string, unknown> }) {
    return {
      onClick: () => editBooking(item as unknown as Booking),
      style: 'cursor: pointer',
    }
  }

  // Computed properties
  const propertyOptions = computed(() => {
    return allProperties.value.map(property => ({
      title: formatPropertyAddress(property, 'short'),
      value: property.id,
    }))
  })

  const cleanerOptions = computed(() => {
    return availableCleaners.value.map(cleaner => ({
      id: cleaner.id,
      name: cleaner.name,
    }))
  })

  const filteredBookings = computed(() => {
    let bookings = allBookings.value

    // Segment filter
    if (selectedSegment.value !== 'all') {
      bookings = bookings.filter(b => b.status === selectedSegment.value)
    }

    // Status filter
    if (statusFilter.value) {
      bookings = bookings.filter(booking => booking.status === statusFilter.value)
    }

    // Type filter
    if (typeFilter.value) {
      bookings = bookings.filter(booking => booking.booking_type === typeFilter.value)
    }

    // Property filter
    if (propertyFilter.value) {
      bookings = bookings.filter(booking => booking.property_id === propertyFilter.value)
    }

    // Date range filter
    if (dateFrom.value) {
      bookings = bookings.filter(booking => booking.checkout_date >= dateFrom.value)
    }
    if (dateTo.value) {
      bookings = bookings.filter(booking => booking.checkout_date <= dateTo.value)
    }

    // Sort by date (most recent first)
    return bookings.toSorted((a, b) => {
      const dateA = new Date(a.checkout_date)
      const dateB = new Date(b.checkout_date)
      return dateB.getTime() - dateA.getTime()
    })
  })

  // Transform bookings into table-friendly items with extra display fields
  const tableItems = computed(() => {
    return filteredBookings.value.map(booking => ({
      ...booking,
      propertyName: getPropertyName(booking.property_id),
      ownerName: getOwnerName(booking.owner_id),
      cleanerName: booking.assigned_cleaner_id
        ? getCleanerName(booking.assigned_cleaner_id)
        : '',
    }))
  })

  // Helper methods
  function getPropertyName (propertyId: string): string {
    const property = allProperties.value.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  }

  function getOwnerName (_ownerId: string): string {
    // Owner name lookup would come from a users store; placeholder for now
    return 'Owner'
  }

  function getCleanerName (cleanerId: string): string {
    const cleaner = availableCleaners.value.find(c => c.id === cleanerId)
    return cleaner?.name || 'Unknown Cleaner'
  }

  function getPropertyColor (propertyId: string): string {
    const property = allProperties.value.find(p => p.id === propertyId)
    return mapLegacyPropertyColor(property?.color, '#9E9E9E')
  }

  // Use centralized status color from constants
  const getStatusColor = getBookingStatusColor

  function getPriorityColor (priority: string): string {
    const colors: Record<string, string> = {
      low: 'grey',
      normal: 'primary',
      high: 'orange',
      urgent: 'error',
    }
    return colors[priority] || 'primary'
  }

  function formatDate (dateString: string): string {
    const date = new Date(dateString + 'T00:00:00')
    if (mobile.value) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Dialog methods
  function openCreateBookingDialog () {
    editingBooking.value = null
    showBookingDialog.value = true
  }

  function editBooking (booking: Booking) {
    editingBooking.value = booking
    showBookingDialog.value = true
  }

  function closeBookingDialog () {
    showBookingDialog.value = false
    editingBooking.value = null
  }

  async function handleSubmitBooking (data: BookingFormData) {
    bookingFormLoading.value = true
    try {
      if (editingBooking.value) {
        await updateBooking(editingBooking.value.id, data)
        uiStore.addNotification('success', 'Updated', 'Booking updated successfully')
      } else {
        await createBooking(data)
        uiStore.addNotification('success', 'Created', 'Booking created successfully')
      }
      closeBookingDialog()
    } catch (error) {
      uiStore.addNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to save booking')
    } finally {
      bookingFormLoading.value = false
    }
  }

  async function handleDeleteBooking (id: string) {
    bookingFormLoading.value = true
    try {
      await deleteBooking(id)
      uiStore.addNotification('success', 'Deleted', 'Booking deleted successfully')
      closeBookingDialog()
    } catch (error) {
      uiStore.addNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to delete booking')
    } finally {
      bookingFormLoading.value = false
    }
  }

  async function handleMarkComplete (id: string) {
    bookingFormLoading.value = true
    try {
      await updateBooking(id, { status: 'completed' })
      uiStore.addNotification('success', 'Completed', 'Booking marked as complete')
      closeBookingDialog()
    } catch (error) {
      uiStore.addNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to update booking')
    } finally {
      bookingFormLoading.value = false
    }
  }

  // Cleaner assignment methods
  function assignCleaner (booking: Booking) {
    selectedBookingForCleaner.value = booking
    selectedCleaner.value = ''
    showCleanerDialog.value = true
  }

  function closeCleanerDialog () {
    showCleanerDialog.value = false
    selectedBookingForCleaner.value = null
    selectedCleaner.value = ''
  }

  async function confirmCleanerAssignment () {
    if (selectedBookingForCleaner.value && selectedCleaner.value) {
      try {
        await updateBooking(selectedBookingForCleaner.value.id, {
          assigned_cleaner_id: selectedCleaner.value,
          status: 'scheduled',
        })
        closeCleanerDialog()
        uiStore.addNotification('success', 'Assigned', 'Cleaner assigned successfully')
      } catch (error) {
        console.error('Failed to assign cleaner:', error)
        uiStore.addNotification('error', 'Assignment Failed', error instanceof Error ? error.message : 'Could not assign cleaner. Please try again.')
      }
    }
  }

  function cancelBooking (booking: Booking) {
    cancelTarget.value = booking
    showCancelConfirm.value = true
  }

  async function confirmCancelBooking () {
    if (!cancelTarget.value) return
    try {
      await updateBooking(cancelTarget.value.id, { status: 'cancelled' })
      uiStore.addNotification('success', 'Cancelled', 'Booking has been cancelled')
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      uiStore.addNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to cancel booking')
    } finally {
      showCancelConfirm.value = false
      cancelTarget.value = null
    }
  }
</script>

<style scoped>
.admin-bookings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.property-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Force fixed-layout table so percentage column widths are respected on mobile */
@media (max-width: 599px) {
  :deep(.v-table table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(.v-table td),
  :deep(.v-table th) {
    overflow: hidden;
  }
}
</style>
