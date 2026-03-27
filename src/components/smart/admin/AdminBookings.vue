<template>
  <div class="admin-bookings-page">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between pa-5 pb-3">
      <div>
        <h3 class="text-h5 font-weight-bold">All Bookings</h3>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Manage all bookings across all properties and clients
        </p>
      </div>
      <div class="d-flex align-center ga-2">
        <v-btn
          :icon="showFilters ? 'mdi-filter-off' : 'mdi-filter-variant'"
          size="small"
          variant="text"
          @click="showFilters = !showFilters"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateBookingDialog"
        >
          New Booking
        </v-btn>
      </div>
    </div>

    <!-- Collapsible Filter Bar -->
    <v-expand-transition>
      <div v-if="showFilters" class="px-5 pb-4">
        <v-row align="center" dense>
          <v-col cols="12" md="3" sm="6">
            <v-text-field
              v-model="searchQuery"
              clearable
              density="compact"
              hide-details
              placeholder="Search bookings..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
            />
          </v-col>
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
          <v-col cols="12" md="2" sm="6">
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
          <v-col cols="6" md="1.5" sm="3">
            <v-text-field
              v-model="dateFrom"
              density="compact"
              hide-details
              placeholder="From"
              type="date"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" md="1.5" sm="3">
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
      </div>
    </v-expand-transition>

    <!-- Bookings Data Table -->
    <MaterioDataTable
      expandable
      :headers="tableHeaders"
      :items="tableItems"
      :items-per-page="25"
      :loading="false"
      :search-keys="['propertyName', 'ownerName', 'cleanerName', 'status', 'booking_type']"
      searchable
    >
      <!-- Property Column -->
      <template #[`item.propertyName`]="{ item }">
        <div class="d-flex align-center ga-2">
          <div
            class="property-color-dot"
            :style="{ background: getPropertyColor(item.property_id as string) }"
          />
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.propertyName }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.ownerName }}
            </div>
          </div>
        </div>
      </template>

      <!-- Dates Column -->
      <template #[`item.dates`]="{ item }">
        <div class="text-body-2">
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
          size="small"
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

      <!-- Expanded Row -->
      <template #expand-content="{ item }">
        <v-row class="pa-2" dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-uppercase text-medium-emphasis mb-1">Guest Info</div>
            <div class="text-body-2">
              <v-icon class="mr-1" size="14">mdi-account-group</v-icon>
              {{ item.guest_count || 'N/A' }} guests
            </div>
            <div v-if="item.notes" class="text-body-2 mt-1">
              <v-icon class="mr-1" size="14">mdi-note-text</v-icon>
              {{ item.notes }}
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-uppercase text-medium-emphasis mb-1">Property Details</div>
            <div class="text-body-2">
              <v-icon class="mr-1" size="14">mdi-map-marker</v-icon>
              {{ getPropertyAddress(item.property_id as string) }}
            </div>
            <div class="text-body-2 mt-1">
              <v-icon class="mr-1" size="14">mdi-account</v-icon>
              Owner: {{ item.ownerName }}
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-uppercase text-medium-emphasis mb-1">Timestamps</div>
            <div class="text-body-2">
              Created: {{ formatDateTime(item.created_at as string) }}
            </div>
            <div v-if="item.updated_at" class="text-body-2 mt-1">
              Modified: {{ formatDateTime(item.updated_at as string) }}
            </div>
          </v-col>
        </v-row>
      </template>
    </MaterioDataTable>

    <!-- Create/Edit Booking Dialog -->
    <v-dialog
      v-model="showBookingDialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          {{ editingBooking ? 'Edit Booking' : 'Create New Booking' }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Admin booking form would be implemented here with full property and cleaner selection
          </p>
          <div class="text-center py-4">
            <v-icon
              color="grey-lighten-1"
              size="48"
            >
              mdi-form-select
            </v-icon>
            <p class="text-caption text-medium-emphasis mt-2">
              Integration with AdminBookingForm component needed
            </p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeBookingDialog">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveBooking"
          >
            {{ editingBooking ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  </div>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types/booking'
  import { computed, ref } from 'vue'
  import MaterioDataTable from '@/components/dumb/shared/MaterioDataTable.vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
  import { formatPropertyAddress } from '@/types/property'

  // Composables
  const { allBookings, updateBooking } = useAdminBookings()
  const { allProperties } = useAdminProperties()
  const { availableCleaners } = useCleanerManagement()

  // Reactive state
  const searchQuery = ref('')
  const statusFilter = ref('')
  const typeFilter = ref('')
  const propertyFilter = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const showFilters = ref(false)

  // Dialog state
  const showBookingDialog = ref(false)
  const showCleanerDialog = ref(false)
  const editingBooking = ref<Booking | null>(null)
  const selectedBookingForCleaner = ref<Booking | null>(null)
  const selectedCleaner = ref('')

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

  // Table headers for MaterioDataTable
  const tableHeaders = [
    { title: 'Property', key: 'propertyName', sortable: true },
    { title: 'Dates', key: 'dates', sortable: false, width: '160px' },
    { title: 'Type', key: 'booking_type', sortable: true, width: '110px' },
    { title: 'Status', key: 'status', sortable: true, width: '120px' },
    { title: 'Priority', key: 'priority', sortable: true, width: '100px' },
    { title: 'Cleaner', key: 'cleanerName', sortable: true, width: '140px' },
    { title: 'Actions', key: 'actions', sortable: false, width: '130px', align: 'end' as const },
  ]

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

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      bookings = bookings.filter(booking => {
        const propertyName = getPropertyName(booking.property_id).toLowerCase()
        const cleanerName = booking.assigned_cleaner_id
          ? getCleanerName(booking.assigned_cleaner_id).toLowerCase()
          : ''
        return propertyName.includes(query) || cleanerName.includes(query)
      })
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

  function getPropertyAddress (propertyId: string): string {
    const property = allProperties.value.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property) : 'Unknown Address'
  }

  function getPropertyColor (propertyId: string): string {
    const property = allProperties.value.find(p => p.id === propertyId)
    return property?.color || '#9E9E9E'
  }

  function getStatusColor (status: string): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      scheduled: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
    }
    return colors[status] || 'grey'
  }

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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatDateTime (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  function saveBooking () {
    console.log('Saving booking...')
    closeBookingDialog()
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
      } catch (error) {
        console.error('Failed to assign cleaner:', error)
      }
    }
  }

  async function cancelBooking (booking: Booking) {
    try {
      await updateBooking(booking.id, { status: 'cancelled' })
    } catch (error) {
      console.error('Failed to cancel booking:', error)
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
</style>
