<template>
  <div class="owner-bookings-page">
    <v-container fluid>
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-5">
        <div>
          <h1 class="text-h4 font-weight-bold">My Bookings</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">Manage your property bookings and cleaning schedules</p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="handleCreateBooking"
        >
          New Booking
        </v-btn>
      </div>

      <!-- Stat Pills Row -->
      <v-row class="mb-5" dense>
        <v-col cols="6" sm="3">
          <div class="stat-pill d-flex align-center ga-3 pa-4">
            <div class="stat-pill__icon stat-pill__icon--primary">
              <v-icon color="primary" size="24">mdi-calendar-check</v-icon>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Total</div>
              <div class="text-h5 font-weight-bold text-primary">{{ ownerBookingsArray.length }}</div>
            </div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-pill d-flex align-center ga-3 pa-4">
            <div class="stat-pill__icon stat-pill__icon--warning">
              <v-icon color="warning" size="24">mdi-swap-horizontal</v-icon>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Turns</div>
              <div class="text-h5 font-weight-bold text-warning">{{ turnBookings.length }}</div>
            </div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-pill d-flex align-center ga-3 pa-4">
            <div class="stat-pill__icon stat-pill__icon--success">
              <v-icon color="success" size="24">mdi-calendar-today</v-icon>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Today</div>
              <div class="text-h5 font-weight-bold text-success">{{ todayBookings.length }}</div>
            </div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="stat-pill d-flex align-center ga-3 pa-4">
            <div class="stat-pill__icon stat-pill__icon--info">
              <v-icon color="info" size="24">mdi-calendar-week</v-icon>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">This Week</div>
              <div class="text-h5 font-weight-bold text-info">{{ upcomingBookings.length }}</div>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Data Table -->
      <MaterioDataTable
        expandable
        :headers="tableHeaders"
        :items="bookingItems"
        :loading="loading"
        :search-keys="['property_name', 'status', 'booking_type']"
        searchable
      >
        <!-- Filters -->
        <template #filters>
          <v-row align="center" dense>
            <v-col cols="12" sm="4">
              <v-select
                v-model="selectedProperty"
                clearable
                density="compact"
                hide-details
                :items="propertyOptions"
                label="Property"
                prepend-inner-icon="mdi-home-outline"
                rounded="lg"
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
                rounded="lg"
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
                rounded="lg"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </template>

        <!-- Property column with color dot -->
        <template #[`item.property_name`]="{ item }">
          <div class="d-flex align-center ga-2">
            <div
              class="property-color-dot"
              :style="{ backgroundColor: getPropertyColor(item.property_id) }"
            />
            <span class="font-weight-medium">{{ item.property_name }}</span>
          </div>
        </template>

        <!-- Dates column -->
        <template #[`item.dates`]="{ item }">
          <div class="text-body-2">
            <span>{{ formatDate(item.checkin_date) }}</span>
            <v-icon class="mx-1" size="14">mdi-arrow-right</v-icon>
            <span>{{ formatDate(item.checkout_date) }}</span>
          </div>
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
            <v-row dense>
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
      <v-card v-if="!loading && ownerBookingsArray.length === 0" class="text-center pa-8 mt-4" variant="flat">
        <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-calendar-blank</v-icon>
        <h3 class="text-h6 mb-2">No Bookings Yet</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">Create your first booking to get started.</p>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="handleCreateBooking">
          Create Booking
        </v-btn>
      </v-card>
      <ConfirmationDialog
        :open="deleteConfirmOpen"
        title="Delete Booking"
        :message="`Are you sure you want to delete this booking for ${bookingToDelete ? getPropertyName(bookingToDelete.property_id) : ''}?`"
        confirm-text="Delete"
        dangerous
        @confirm="confirmDeleteBooking"
        @cancel="deleteConfirmOpen = false"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { Booking, ModalData } from '@/types'
  import { computed, onMounted, ref } from 'vue'
  import MaterioDataTable from '@/components/dumb/shared/MaterioDataTable.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'
  import { getBookingStatusColor, formatStatus } from '@utils/constants'

  defineOptions({
    name: 'OwnerBookingsComponent',
  })

  // Composables
  const {
    myBookings: ownerBookings,
    myTodayTurns: todayBookings,
    myUpcomingCleanings: upcomingBookings,
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

  // Computed
  const ownerBookingsArray = computed(() => ownerBookings.value)

  const turnBookings = computed(() =>
    ownerBookingsArray.value.filter(b => b.booking_type === 'turn'),
  )

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
    { title: 'Type', key: 'booking_type', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Guests', key: 'guest_count', sortable: true, width: '90px' },
    { title: 'Actions', key: 'actions', sortable: false, width: '100px', align: 'end' as const },
  ]

  // Methods
  function getPropertyName (propertyId: string): string {
    const property = ownerProperties.value.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  }

  function getPropertyColor (propertyId: string): string {
    const property = ownerProperties.value.find(p => p.id === propertyId)
    return property?.color || '#9E9E9E'
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
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
    } catch (err) {
      console.error('Failed to delete booking:', err)
      uiStore.addNotification('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete booking')
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
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
.owner-bookings-page {
  padding: 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* Stat Pills - Materio Academy Style */
.stat-pill {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: thin solid rgba(var(--v-theme-on-surface), 0.08);
}

.stat-pill__icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-pill__icon--primary {
  background: rgba(var(--v-theme-primary), 0.12);
}

.stat-pill__icon--warning {
  background: rgba(var(--v-theme-warning), 0.12);
}

.stat-pill__icon--success {
  background: rgba(var(--v-theme-success), 0.12);
}

.stat-pill__icon--info {
  background: rgba(var(--v-theme-info), 0.12);
}

/* Property color dot */
.property-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Expanded content */
.expanded-content {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.expanded-field {
  padding: 8px 0;
}
</style>
