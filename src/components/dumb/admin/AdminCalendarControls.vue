<template>
  <v-card
    class="admin-calendar-controls"
    variant="outlined"
  >
    <v-card-title class="text-subtitle-1 py-2 d-flex align-center">
      <v-icon class="mr-2">
        mdi-calendar-clock
      </v-icon>
      Calendar Controls
      <v-spacer />
      <v-btn
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        variant="text"
        @click="expanded = !expanded"
      />
    </v-card-title>

    <v-divider />

    <v-expand-transition>
      <v-card-text
        v-show="expanded"
        class="pa-0"
      >
        <v-container>
          <!-- View Controls -->
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <div class="text-body-2 text-medium-emphasis mb-2">
                Calendar View
              </div>
              <v-btn-toggle
                v-model="selectedView"
                divided
                mandatory
                variant="outlined"
                @update:model-value="handleViewChange"
              >
                <v-btn
                  size="small"
                  value="dayGridMonth"
                >
                  <v-icon start>
                    mdi-calendar-month
                  </v-icon>
                  Month
                </v-btn>
                <v-btn
                  size="small"
                  value="timeGridWeek"
                >
                  <v-icon start>
                    mdi-calendar-week
                  </v-icon>
                  Week
                </v-btn>
                <v-btn
                  size="small"
                  value="timeGridDay"
                >
                  <v-icon start>
                    mdi-calendar-today
                  </v-icon>
                  Day
                </v-btn>
                <v-btn
                  size="small"
                  value="listWeek"
                >
                  <v-icon start>
                    mdi-format-list-bulleted
                  </v-icon>
                  Agenda
                </v-btn>
              </v-btn-toggle>
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <div class="text-body-2 text-medium-emphasis mb-2">
                Date Navigation
              </div>
              <div class="d-flex gap-2 align-center">
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="handlePrevious"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>

                <v-btn
                  size="small"
                  variant="outlined"
                  @click="handleToday"
                >
                  Today
                </v-btn>

                <v-btn
                  size="small"
                  variant="outlined"
                  @click="handleNext"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>

                <v-spacer />

                <v-text-field
                  v-model="selectedDate"
                  density="compact"
                  hide-details
                  style="max-width: 150px;"
                  type="date"
                  variant="outlined"
                  @update:model-value="handleDateChange"
                />
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Filters -->
          <v-row>
            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="filters.status"
                chips
                clearable
                density="compact"
                :items="statusOptions"
                label="Status Filter"
                multiple
                variant="outlined"
                @update:model-value="handleFilterChange"
              >
                <template #chip="{ props: slotProps, item }">
                  <v-chip
                    v-bind="slotProps"
                    :color="getStatusColor(item.value)"
                    size="small"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>

            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="filters.cleaner"
                chips
                clearable
                density="compact"
                :items="cleanerOptions"
                label="Cleaner Filter"
                multiple
                variant="outlined"
                @update:model-value="handleFilterChange"
              >
                <template #item="{ props: slotProps, item }">
                  <v-list-item v-bind="slotProps">
                    <template #prepend>
                      <v-avatar
                        :color="getCleanerColor(item.value)"
                        size="small"
                      >
                        <v-icon>mdi-account</v-icon>
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="filters.bookingType"
                chips
                clearable
                density="compact"
                :items="bookingTypeOptions"
                label="Booking Type"
                multiple
                variant="outlined"
                @update:model-value="handleFilterChange"
              >
                <template #chip="{ props: slotProps, item }">
                  <v-chip
                    v-bind="slotProps"
                    :color="item.value === 'turn' ? 'error' : 'primary'"
                    size="small"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>

            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="filters.propertyOwner"
                chips
                clearable
                density="compact"
                :items="propertyOwnerOptions"
                label="Property Owner"
                multiple
                variant="outlined"
                @update:model-value="handleFilterChange"
              />
            </v-col>
          </v-row>

          <!-- Advanced Filters -->
          <v-row v-if="showAdvancedFilters">
            <v-col
              cols="12"
              md="4"
            >
              <v-select
                v-model="filters.priority"
                chips
                clearable
                density="compact"
                :items="priorityOptions"
                label="Priority Level"
                multiple
                variant="outlined"
                @update:model-value="handleFilterChange"
              >
                <template #chip="{ props: slotProps, item }">
                  <v-chip
                    v-bind="slotProps"
                    :color="getPriorityColor(item.value)"
                    size="small"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="filters.dateRange.start"
                density="compact"
                label="Start Date"
                type="date"
                variant="outlined"
                @update:model-value="handleFilterChange"
              />
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="filters.dateRange.end"
                density="compact"
                label="End Date"
                type="date"
                variant="outlined"
                @update:model-value="handleFilterChange"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Action Controls -->
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <div class="text-body-2 text-medium-emphasis mb-2">
                Quick Actions
              </div>
              <div class="d-flex flex-wrap gap-2">
                <v-btn
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="handleRefresh"
                >
                  <v-icon start>
                    mdi-refresh
                  </v-icon>
                  Refresh
                </v-btn>

                <v-btn
                  color="success"
                  size="small"
                  variant="outlined"
                  @click="handleExport"
                >
                  <v-icon start>
                    mdi-download
                  </v-icon>
                  Export
                </v-btn>

                <v-btn
                  color="info"
                  size="small"
                  variant="outlined"
                  @click="handlePrint"
                >
                  <v-icon start>
                    mdi-printer
                  </v-icon>
                  Print
                </v-btn>

                <v-btn
                  size="small"
                  variant="text"
                  @click="showAdvancedFilters = !showAdvancedFilters"
                >
                  <v-icon start>
                    {{ showAdvancedFilters ? 'mdi-filter-minus' : 'mdi-filter-plus' }}
                  </v-icon>
                  {{ showAdvancedFilters ? 'Less' : 'More' }} Filters
                </v-btn>
              </div>
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <div class="text-body-2 text-medium-emphasis mb-2">
                Bulk Operations
              </div>
              <div class="d-flex flex-wrap gap-2">
                <v-btn
                  color="warning"
                  :disabled="!hasSelectedBookings"
                  size="small"
                  variant="outlined"
                  @click="handleBulkAssign"
                >
                  <v-icon start>
                    mdi-account-multiple
                  </v-icon>
                  Bulk Assign
                </v-btn>

                <v-btn
                  color="info"
                  :disabled="!hasSelectedBookings"
                  size="small"
                  variant="outlined"
                  @click="handleBulkStatusUpdate"
                >
                  <v-icon start>
                    mdi-clipboard-list
                  </v-icon>
                  Update Status
                </v-btn>

                <v-btn
                  color="error"
                  :disabled="!hasSelectedBookings"
                  size="small"
                  variant="outlined"
                  @click="handleBulkDelete"
                >
                  <v-icon start>
                    mdi-delete-multiple
                  </v-icon>
                  Bulk Delete
                </v-btn>
              </div>
            </v-col>
          </v-row>

          <!-- Real-time Updates -->
          <v-row>
            <v-col cols="12">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-switch
                    v-model="realTimeUpdates"
                    color="primary"
                    density="compact"
                    hide-details
                    @update:model-value="handleRealTimeToggle"
                  />
                  <span class="text-body-2 ml-2">Real-time Updates</span>
                </div>

                <div class="text-caption text-medium-emphasis">
                  Last updated: {{ lastUpdated }}
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Filter Summary -->
          <v-row v-if="hasActiveFilters">
            <v-col cols="12">
              <v-card
                color="info"
                variant="tonal"
              >
                <v-card-text class="py-2">
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">
                      mdi-filter
                    </v-icon>
                    <span class="text-body-2">Active Filters:</span>
                    <div class="d-flex flex-wrap gap-1 ml-2">
                      <v-chip
                        v-for="filter in activeFilterSummary"
                        :key="filter.key"
                        closable
                        size="x-small"
                        variant="outlined"
                        @click:close="clearFilter(filter.key)"
                      >
                        {{ filter.label }}
                      </v-chip>
                    </div>
                    <v-spacer />
                    <v-btn
                      size="small"
                      variant="text"
                      @click="clearAllFilters"
                    >
                      Clear All
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
  import type { Cleaner } from '@/types/user'
import { computed, ref, watch } from 'vue'

  // Props
  interface Props {
    currentView: string
    currentDate: string
    selectedBookings: string[]
    cleaners: Cleaner[]
    propertyOwners: Array<{ id: string, name: string }>
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
  })

  // Emits
  interface Emits {
    'view-change': [view: string]
    'date-change': [date: string]
    'navigate': [direction: 'prev' | 'next' | 'today']
    'filter-change': [filters: CalendarFilters]
    'refresh': []
    'export': [format: string]
    'print': []
    'bulk-assign': []
    'bulk-status-update': []
    'bulk-delete': []
    'real-time-toggle': [enabled: boolean | null]
  }

  const emit = defineEmits<Emits>()

  // Types
  interface CalendarFilters {
    status: string[]
    cleaner: string[]
    bookingType: string[]
    propertyOwner: string[]
    priority: string[]
    dateRange: {
      start: string
      end: string
    }
  }

  // State
  const expanded = ref(true)
  const showAdvancedFilters = ref(false)
  const realTimeUpdates = ref(true)
  const selectedView = ref(props.currentView)
  const selectedDate = ref(props.currentDate)

  const filters = ref<CalendarFilters>({
    status: [],
    cleaner: [],
    bookingType: [],
    propertyOwner: [],
    priority: [],
    dateRange: {
      start: '',
      end: '',
    },
  })

  // Computed properties
  const hasSelectedBookings = computed(() => {
    return props.selectedBookings.length > 0
  })

  const hasActiveFilters = computed(() => {
    return filters.value.status.length > 0
      || filters.value.cleaner.length > 0
      || filters.value.bookingType.length > 0
      || filters.value.propertyOwner.length > 0
      || filters.value.priority.length > 0
      || filters.value.dateRange.start
      || filters.value.dateRange.end
  })

  const activeFilterSummary = computed(() => {
    const summary = []

    if (filters.value.status.length > 0) {
      summary.push({ key: 'status', label: `Status: ${filters.value.status.length} selected` })
    }
    if (filters.value.cleaner.length > 0) {
      summary.push({ key: 'cleaner', label: `Cleaners: ${filters.value.cleaner.length} selected` })
    }
    if (filters.value.bookingType.length > 0) {
      summary.push({ key: 'bookingType', label: `Types: ${filters.value.bookingType.length} selected` })
    }
    if (filters.value.propertyOwner.length > 0) {
      summary.push({ key: 'propertyOwner', label: `Owners: ${filters.value.propertyOwner.length} selected` })
    }
    if (filters.value.priority.length > 0) {
      summary.push({ key: 'priority', label: `Priority: ${filters.value.priority.length} selected` })
    }
    if (filters.value.dateRange.start || filters.value.dateRange.end) {
      summary.push({ key: 'dateRange', label: 'Date Range Set' })
    }

    return summary
  })

  const lastUpdated = computed(() => {
    return new Date().toLocaleTimeString()
  })

  // Options
  const statusOptions = [
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'In Progress', value: 'in_progress' },
    { title: 'Completed', value: 'completed' },
    { title: 'Cancelled', value: 'cancelled' },
  ]

  const bookingTypeOptions = [
    { title: 'Standard Cleaning', value: 'standard' },
    { title: 'Turn Cleaning', value: 'turn' },
  ]

  const priorityOptions = [
    { title: 'Standard', value: 'standard' },
    { title: 'High', value: 'high' },
    { title: 'Urgent', value: 'urgent' },
  ]

  const cleanerOptions = computed(() => {
    return props.cleaners.map(cleaner => {
      return ({
        title: cleaner.name,
        value: cleaner.id,
      })
    })
  })

  const propertyOwnerOptions = computed(() => {
    return props.propertyOwners.map(owner => {
      return ({
        title: owner.name,
        value: owner.id,
      })
    })
  })

  // Methods
  function handleViewChange (view: string) {
    emit('view-change', view)
  }

  function handleDateChange (date: string) {
    emit('date-change', date)
  }

  function handlePrevious () {
    emit('navigate', 'prev')
  }

  function handleNext () {
    emit('navigate', 'next')
  }

  function handleToday () {
    emit('navigate', 'today')
  }

  function handleFilterChange () {
    emit('filter-change', { ...filters.value })
  }

  function handleRefresh () {
    emit('refresh')
  }

  function handleExport () {
    emit('export', 'csv')
  }

  function handlePrint () {
    emit('print')
  }

  function handleBulkAssign () {
    emit('bulk-assign')
  }

  function handleBulkStatusUpdate () {
    emit('bulk-status-update')
  }

  function handleBulkDelete () {
    emit('bulk-delete')
  }

  function handleRealTimeToggle (enabled: boolean | null) {
    emit('real-time-toggle', enabled)
  }

  function clearFilter (filterKey: string) {
    switch (filterKey) {
      case 'status': {
        filters.value.status = []
        break
      }
      case 'cleaner': {
        filters.value.cleaner = []
        break
      }
      case 'bookingType': {
        filters.value.bookingType = []
        break
      }
      case 'propertyOwner': {
        filters.value.propertyOwner = []
        break
      }
      case 'priority': {
        filters.value.priority = []
        break
      }
      case 'dateRange': {
        filters.value.dateRange = { start: '', end: '' }
        break
      }
    }
    handleFilterChange()
  }

  function clearAllFilters () {
    filters.value = {
      status: [],
      cleaner: [],
      bookingType: [],
      propertyOwner: [],
      priority: [],
      dateRange: { start: '', end: '' },
    }
    handleFilterChange()
  }

  function getStatusColor (status: string) {
    const colors = {
      pending: 'orange',
      scheduled: 'blue',
      in_progress: 'purple',
      completed: 'green',
      cancelled: 'red',
    }
    return colors[status as keyof typeof colors] || 'grey'
  }

  function getPriorityColor (priority: string) {
    const colors = {
      standard: 'grey',
      high: 'orange',
      urgent: 'red',
    }
    return colors[priority as keyof typeof colors] || 'grey'
  }

  function getCleanerColor (cleanerId: string) {
    // Generate consistent color based on cleaner ID
    const colors = ['primary', 'secondary', 'success', 'info', 'warning']
    const index = cleanerId.length % colors.length
    return colors[index]
  }

  // Watch for prop changes
  watch(() => props.currentView, newView => {
    selectedView.value = newView
  })

  watch(() => props.currentDate, newDate => {
    selectedDate.value = newDate
  })
</script>

<style scoped>
.admin-calendar-controls {
  position: sticky;
  top: 0;
  z-index: 10;
}

.v-card-title {
  background-color: rgb(var(--v-theme-surface-variant));
}

.v-btn-toggle {
  width: 100%;
}

.v-btn-toggle .v-btn {
  flex: 1;
}
</style>
