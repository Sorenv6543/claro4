<template>
  <v-container
    class="pa-4"
    fluid
  >
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >
              mdi-calendar-clock
            </v-icon>
            useAdminCalendarState Demo
            <v-spacer />
            <v-chip
              color="success"
              variant="outlined"
            >
              Admin Interface
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-alert
              class="mb-4"
              type="info"
            >
              <strong>Admin Calendar State Composable Demo</strong><br>
              This demo showcases the admin-specific calendar state management with system-wide data access,
              advanced filtering, cleaner management, and business analytics.
            </v-alert>

            <!-- Status Messages -->
            <v-alert
              v-if="error"
              class="mb-4"
              dismissible
              type="error"
              @click:close="error = null"
            >
              {{ error }}
            </v-alert>

            <v-alert
              v-if="success"
              class="mb-4"
              dismissible
              type="success"
              @click:close="success = null"
            >
              {{ success }}
            </v-alert>

            <!-- Admin Calendar Controls -->
            <v-row class="mb-4">
              <v-col
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    Calendar View Mode
                  </v-card-title>
                  <v-card-text>
                    <v-btn-toggle
                      v-model="calendarViewMode"
                      class="mb-3"
                      mandatory
                    >
                      <v-btn
                        size="small"
                        value="standard"
                      >
                        Standard
                      </v-btn>
                      <v-btn
                        size="small"
                        value="cleaner"
                      >
                        Cleaner
                      </v-btn>
                      <v-btn
                        size="small"
                        value="owner"
                      >
                        Owner
                      </v-btn>
                      <v-btn
                        size="small"
                        value="priority"
                      >
                        Priority
                      </v-btn>
                    </v-btn-toggle>

                    <div class="d-flex flex-wrap gap-2">
                      <v-switch
                        v-model="showUnassignedOnly"
                        color="warning"
                        density="compact"
                        hide-details
                        label="Unassigned Only"
                      />
                      <v-switch
                        v-model="showOverdueOnly"
                        color="error"
                        density="compact"
                        hide-details
                        label="Overdue Only"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    System Metrics
                  </v-card-title>
                  <v-card-text>
                    <v-row density="comfortable">
                      <v-col cols="6">
                        <v-chip
                          class="mb-1"
                          color="primary"
                          variant="outlined"
                        >
                          Total Bookings: {{ allBookings.length }}
                        </v-chip>
                      </v-col>
                      <v-col cols="6">
                        <v-chip
                          class="mb-1"
                          color="warning"
                          variant="outlined"
                        >
                          Turn Alerts: {{ systemTurnAlerts.length }}
                        </v-chip>
                      </v-col>
                      <v-col cols="6">
                        <v-chip
                          class="mb-1"
                          color="info"
                          variant="outlined"
                        >
                          Properties: {{ allProperties.length }}
                        </v-chip>
                      </v-col>
                      <v-col cols="6">
                        <v-chip
                          class="mb-1"
                          color="success"
                          variant="outlined"
                        >
                          Cleaners: {{ Object.keys(cleanerSchedules).length - 1 }}
                        </v-chip>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- System Turn Alerts -->
            <v-card
              v-if="systemTurnAlerts.length > 0"
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 d-flex align-center">
                <v-icon
                  class="mr-2"
                  color="error"
                >
                  mdi-fire
                </v-icon>
                System Turn Alerts ({{ systemTurnAlerts.length }})
              </v-card-title>
              <v-card-text>
                <v-row density="comfortable">
                  <v-col
                    v-for="alert in systemTurnAlerts.slice(0, 6)"
                    :key="alert.id"
                    cols="12"
                    md="4"
                    sm="6"
                  >
                    <v-card
                      class="mb-2"
                      :color="alert.priority === 'urgent' ? 'error' : 'warning'"
                      variant="outlined"
                    >
                      <v-card-text class="pa-3">
                        <div class="text-subtitle2 font-weight-bold">
                          {{ alert.property_name }}
                        </div>
                        <div class="text-caption">
                          {{ alert.property_address }}
                        </div>
                        <v-chip
                          class="mt-1"
                          :color="alert.priority === 'urgent' ? 'error' : 'warning'"
                          size="small"
                        >
                          {{ alert.alert_message }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Cleaner Schedules -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                Cleaner Schedules
              </v-card-title>
              <v-card-text>
                <v-row density="comfortable">
                  <v-col
                    v-for="(bookings, cleanerId) in cleanerSchedules"
                    :key="cleanerId"
                    cols="12"
                    md="4"
                    sm="6"
                  >
                    <v-card
                      class="mb-2"
                      variant="outlined"
                    >
                      <v-card-text class="pa-3">
                        <div class="text-subtitle2 font-weight-bold">
                          {{ cleanerId === 'unassigned' ? 'Unassigned' : `Cleaner ${cleanerId.slice(0, 8)}` }}
                        </div>
                        <div class="text-caption">
                          {{ bookings.length }} bookings
                        </div>
                        <v-btn
                          class="mt-2"
                          size="small"
                          variant="outlined"
                          @click="testGetCleanerSchedule(cleanerId)"
                        >
                          View Schedule
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Calendar Events Preview -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                Admin Calendar Events ({{ adminCalendarEvents.length }})
              </v-card-title>
              <v-card-text>
                <v-row density="comfortable">
                  <v-col
                    v-for="event in adminCalendarEvents.slice(0, 8)"
                    :key="event.id"
                    cols="12"
                    md="3"
                    sm="6"
                  >
                    <v-card
                      class="mb-2"
                      :style="{ borderLeft: `4px solid ${event.backgroundColor}` }"
                      variant="outlined"
                    >
                      <v-card-text class="pa-3">
                        <div class="text-subtitle2 font-weight-bold">
                          {{ event.title }}
                        </div>
                        <div class="text-caption">
                          {{ formatDate(event.start) }} - {{ formatDate(event.end) }}
                        </div>
                        <div class="text-caption">
                          Status: {{ event.extendedProps.status }}
                        </div>
                        <v-btn
                          class="mt-2"
                          size="small"
                          variant="outlined"
                          @click="testHandleAdminEventClick(event)"
                        >
                          Manage
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Advanced Filtering Test -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                Advanced Filtering Test
              </v-card-title>
              <v-card-text>
                <v-row density="comfortable">
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <v-select
                      v-model="filterCriteria.status"
                      chips
                      clearable
                      density="compact"
                      :items="statusOptions"
                      label="Filter by Status"
                      multiple
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <v-select
                      v-model="filterCriteria.bookingType"
                      chips
                      clearable
                      density="compact"
                      :items="typeOptions"
                      label="Filter by Type"
                      multiple
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <v-btn
                      color="primary"
                      :loading="loading"
                      @click="testAdvancedFiltering"
                    >
                      Apply Filters
                    </v-btn>
                  </v-col>
                </v-row>

                <v-alert
                  v-if="filteredResults.length > 0"
                  class="mt-3"
                  type="success"
                >
                  Found {{ filteredResults.length }} bookings matching criteria
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Function Testing -->
            <v-card variant="outlined">
              <v-card-title class="text-h6">
                Function Testing
              </v-card-title>
              <v-card-text>
                <div class="d-flex flex-wrap gap-2">
                  <v-btn
                    color="primary"
                    :loading="loading"
                    variant="outlined"
                    @click="testGetAdminCalendarEvents"
                  >
                    Test Calendar Events
                  </v-btn>

                  <v-btn
                    color="secondary"
                    :loading="loading"
                    variant="outlined"
                    @click="testSystemTurnAlerts"
                  >
                    Test Turn Alerts
                  </v-btn>

                  <v-btn
                    color="info"
                    :loading="loading"
                    variant="outlined"
                    @click="testCleanerSchedules"
                  >
                    Test Cleaner Schedules
                  </v-btn>

                  <v-btn
                    color="warning"
                    :loading="loading"
                    variant="outlined"
                    @click="testFilterByMultipleCriteria"
                  >
                    Test Multi-Criteria Filter
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { BookingStatus, BookingType } from '@/types'
  import { onMounted, ref } from 'vue'
  import { useAdminCalendarState } from '@/composables/admin/useAdminCalendarState'
  import { useBookingStore } from '@/stores/booking'
  import { usePropertyStore } from '@/stores/property'

  // Get the admin calendar state composable
  const {
    // State
    loading,
    error,
    success,
    selectedCleanerIds: _selectedCleanerIds,
    selectedOwnerIds: _selectedOwnerIds,
    showUnassignedOnly,
    showOverdueOnly,
    calendarViewMode,

    // Computed properties
    allBookings,
    allProperties,
    systemTurnAlerts,
    cleanerSchedules,
    adminCalendarEvents,

    // Functions
    getAdminCalendarEvents,
    handleAdminEventClick,
    getCleanerSchedule,
    filterByMultipleCriteria,
  } = useAdminCalendarState()

  // Get stores for demo data
  const bookingStore = useBookingStore()
  const _propertyStore = usePropertyStore()

  // Demo state
  const filteredResults = ref<any[]>([])
  const filterCriteria = ref<{
    status: BookingStatus[]
    bookingType: BookingType[]
  }>({
    status: [],
    bookingType: [],
  })

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

  // Helper functions
  function formatDate (dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Test functions
  function testGetAdminCalendarEvents () {
    loading.value = true
    try {
      const events = getAdminCalendarEvents()
      success.value = `Generated ${events.length} admin calendar events with enhanced formatting`
      console.log('Admin Calendar Events:', events)
    } catch (error_) {
      error.value = 'Failed to generate admin calendar events'
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  function testSystemTurnAlerts () {
    loading.value = true
    try {
      const alerts = systemTurnAlerts.value
      success.value = `Found ${alerts.length} system turn alerts across all properties`
      console.log('System Turn Alerts:', alerts)
    } catch (error_) {
      error.value = 'Failed to get system turn alerts'
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  function testCleanerSchedules () {
    loading.value = true
    try {
      const schedules = cleanerSchedules.value
      const cleanerCount = Object.keys(schedules).length - 1 // Exclude 'unassigned'
      success.value = `Retrieved schedules for ${cleanerCount} cleaners and ${schedules.unassigned?.length || 0} unassigned bookings`
      console.log('Cleaner Schedules:', schedules)
    } catch (error_) {
      error.value = 'Failed to get cleaner schedules'
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  function testGetCleanerSchedule (cleanerId: string) {
    loading.value = true
    try {
      const schedule = getCleanerSchedule(cleanerId)
      success.value = `Retrieved schedule for ${cleanerId}: ${schedule.bookings.length} bookings, ${schedule.metrics.totalHours}h total`
      console.log(`Schedule for ${cleanerId}:`, schedule)
    } catch (error_) {
      error.value = `Failed to get schedule for ${cleanerId}`
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  function testHandleAdminEventClick (event: any) {
    loading.value = true
    try {
      // Simulate event info object
      const eventInfo = { event }
      handleAdminEventClick(eventInfo)
      console.log('Admin Event Click:', event)
    } catch (error_) {
      error.value = 'Failed to handle admin event click'
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  function testAdvancedFiltering () {
    loading.value = true
    try {
      const results = filterByMultipleCriteria({
        status: filterCriteria.value.status,
        bookingType: filterCriteria.value.bookingType,
        unassignedOnly: showUnassignedOnly.value,
        overdueOnly: showOverdueOnly.value,
      })

      filteredResults.value = results
      success.value = `Advanced filtering returned ${results.length} bookings`
      console.log('Filtered Results:', results)
    } catch (error_) {
      error.value = 'Failed to apply advanced filtering'
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  function testFilterByMultipleCriteria () {
    loading.value = true
    try {
      // Test with various criteria
      const testCriteria = {
        status: ['pending', 'scheduled'] as BookingStatus[],
        bookingType: ['turn'] as BookingType[],
        unassignedOnly: true,
        priorityOnly: true,
      }

      const results = filterByMultipleCriteria(testCriteria)
      success.value = `Multi-criteria filter test: ${results.length} urgent unassigned turn bookings found`
      console.log('Multi-criteria Filter Results:', results)
    } catch (error_) {
      error.value = 'Failed to test multi-criteria filtering'
      console.error('Error:', error_)
    } finally {
      loading.value = false
    }
  }

  // Generate demo data on mount
  onMounted(async () => {
    // Generate sample bookings and properties if stores are empty
    if (bookingStore.bookings.size === 0) {
      console.log('Generating demo data for admin calendar state testing...')

      // This would typically be done by the stores themselves
      // For demo purposes, we'll just log that data should be available
      success.value = 'Demo initialized - Admin calendar state ready for testing'
    }
  })
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
