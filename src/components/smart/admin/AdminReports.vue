<template>
  <div class="admin-reports-page">
    <!-- Page Header -->
    <div class="page-header">
      <v-container fluid>
        <v-row align="center">
          <v-col>
            <h1 class="text-h4 font-weight-bold">
              Business Reports
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Analytics and performance metrics across all operations
            </p>
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="primary"
              prepend-icon="mdi-download"
              @click="exportReport"
            >
              Export Report
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Main Content -->
    <div class="page-content">
      <v-container fluid>
        <!-- Key Metrics Cards -->
        <v-row class="mb-6">
          <v-col
            cols="12"
            md="3"
            sm="6"
          >
            <v-card class="metric-card">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ metrics.totalRevenue }}
                    </div>
                    <div class="text-subtitle-2 text-medium-emphasis">
                      Total Revenue
                    </div>
                  </div>
                  <v-icon
                    color="primary"
                    size="40"
                  >
                    mdi-currency-usd
                  </v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            md="3"
            sm="6"
          >
            <v-card class="metric-card">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-h4 font-weight-bold text-success">
                      {{ metrics.completedBookings }}
                    </div>
                    <div class="text-subtitle-2 text-medium-emphasis">
                      Completed Bookings
                    </div>
                  </div>
                  <v-icon
                    color="success"
                    size="40"
                  >
                    mdi-check-circle
                  </v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            md="3"
            sm="6"
          >
            <v-card class="metric-card">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-h4 font-weight-bold text-info">
                      {{ metrics.averageRating }}
                    </div>
                    <div class="text-subtitle-2 text-medium-emphasis">
                      Average Rating
                    </div>
                  </div>
                  <v-icon
                    color="info"
                    size="40"
                  >
                    mdi-star
                  </v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            md="3"
            sm="6"
          >
            <v-card class="metric-card">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-h4 font-weight-bold text-warning">
                      {{ metrics.activeCleaners }}
                    </div>
                    <div class="text-subtitle-2 text-medium-emphasis">
                      Active Cleaners
                    </div>
                  </div>
                  <v-icon
                    color="warning"
                    size="40"
                  >
                    mdi-account-group
                  </v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Charts Placeholder -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card>
              <v-card-title>Business Analytics Dashboard</v-card-title>
              <v-card-text>
                <div class="chart-placeholder">
                  <v-icon
                    color="grey-lighten-2"
                    size="64"
                  >
                    mdi-chart-line
                  </v-icon>
                  <p class="text-body-2 text-medium-emphasis mt-2">
                    Business analytics charts would be displayed here
                  </p>
                  <p class="text-caption text-medium-emphasis">
                    Integration with Chart.js or similar charting library needed
                  </p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Performance Tables -->
        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <v-card>
              <v-card-title>Top Performing Properties</v-card-title>
              <v-card-text>
                <div
                  v-if="topProperties.length === 0"
                  class="text-center py-4"
                >
                  <v-icon
                    color="grey-lighten-1"
                    size="48"
                  >
                    mdi-home-search
                  </v-icon>
                  <p class="text-body-2 text-medium-emphasis mt-2">
                    No property data available
                  </p>
                </div>
                <div v-else>
                  <div
                    v-for="property in topProperties"
                    :key="property.name"
                    class="d-flex justify-space-between align-center py-2 border-b"
                  >
                    <div>
                      <div class="font-weight-medium">
                        {{ property.name }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ property.bookings }} bookings
                      </div>
                    </div>
                    <div class="text-success font-weight-bold">
                      ${{ property.revenue }}
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-card>
              <v-card-title>Cleaner Performance</v-card-title>
              <v-card-text>
                <div
                  v-if="topCleaners.length === 0"
                  class="text-center py-4"
                >
                  <v-icon
                    color="grey-lighten-1"
                    size="48"
                  >
                    mdi-account-search
                  </v-icon>
                  <p class="text-body-2 text-medium-emphasis mt-2">
                    No cleaner data available
                  </p>
                </div>
                <div v-else>
                  <div
                    v-for="cleaner in topCleaners"
                    :key="cleaner.name"
                    class="d-flex justify-space-between align-center py-2 border-b"
                  >
                    <div>
                      <div class="font-weight-medium">
                        {{ cleaner.name }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ cleaner.completed }} completed
                      </div>
                    </div>
                    <div class="text-info font-weight-bold">
                      {{ cleaner.rating }}/5
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
  import { formatPropertyAddress } from '@/types/property'

  // Composables
  const { allBookings } = useAdminBookings()
  const { allProperties } = useAdminProperties()
  const { availableCleaners } = useCleanerManagement()

  // Computed metrics
  const metrics = computed(() => {
    const completedBookings = allBookings.value.filter(b => b.status === 'completed')

    return {
      totalRevenue: '$' + (completedBookings.length * 150).toLocaleString(),
      completedBookings: completedBookings.length,
      averageRating: '4.8',
      activeCleaners: availableCleaners.value.length,
    }
  })

  const topProperties = computed(() => {
    return allProperties.value.slice(0, 5).map(property => {
      const propertyBookings = allBookings.value.filter(b => b.property_id === property.id)
      const completedBookings = propertyBookings.filter(b => b.status === 'completed')

      return {
        name: formatPropertyAddress(property, 'short'),
        revenue: completedBookings.length * 150,
        bookings: completedBookings.length,
      }
    })
  })

  const topCleaners = computed(() => {
    return availableCleaners.value.slice(0, 5).map(cleaner => {
      const cleanerBookings = allBookings.value.filter(b => b.assigned_cleaner_id === cleaner.id)
      const completedBookings = cleanerBookings.filter(b => b.status === 'completed')

      return {
        name: cleaner.name,
        completed: completedBookings.length,
        rating: '4.8',
      }
    })
  })

  // Methods
  function exportReport () {
    console.log('Exporting report...')
  }
</script>

<style scoped>
.admin-reports-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgb(var(--v-theme-surface));
}

.page-content {
  flex: 1;
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
}

.metric-card {
  height: 100%;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  text-align: center;
}

.border-b {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

@media (max-width: 960px) {
  .admin-reports-page {
    height: auto;
  }

  .page-content {
    overflow-y: visible;
  }
}
</style>
