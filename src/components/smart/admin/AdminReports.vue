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
        <v-row class="mb-6" density="compact">
          <v-col cols="12" md="3" sm="6">
            <StatCard color="primary" icon="mdi-currency-usd" label="Total Revenue" :value="metrics.totalRevenue" />
          </v-col>
          <v-col cols="12" md="3" sm="6">
            <StatCard color="success" icon="mdi-check-circle" label="Completed Bookings" :value="metrics.completedBookings" />
          </v-col>
          <v-col cols="12" md="3" sm="6">
            <StatCard color="info" icon="mdi-star" label="Average Rating" :value="metrics.averageRating" />
          </v-col>
          <v-col cols="12" md="3" sm="6">
            <StatCard color="warning" icon="mdi-account-group" label="Active Cleaners" :value="metrics.activeCleaners" />
          </v-col>
        </v-row>

        <!-- Charts Placeholder -->
        <v-row class="mb-6">
          <v-col cols="12">
            <DashboardCard icon="mdi-chart-line" title="Business Analytics Dashboard">
              <div class="chart-placeholder">
                <v-icon color="grey-lighten-2" size="64">mdi-chart-line</v-icon>
                <p class="text-body-2 text-medium-emphasis mt-2">
                  Business analytics charts would be displayed here
                </p>
                <p class="text-caption text-medium-emphasis">
                  Integration with Chart.js or similar charting library needed
                </p>
              </div>
            </DashboardCard>
          </v-col>
        </v-row>

        <!-- Performance Tables -->
        <v-row>
          <v-col cols="12" md="6">
            <DashboardCard icon="mdi-home-city" title="Top Performing Properties">
              <div v-if="topProperties.length === 0" class="text-center py-4">
                <v-icon color="grey-lighten-1" size="48">mdi-home-search</v-icon>
                <p class="text-body-2 text-medium-emphasis mt-2">No property data available</p>
              </div>
              <div v-else>
                <div
                  v-for="property in topProperties"
                  :key="property.name"
                  class="d-flex justify-space-between align-center py-2 border-b"
                >
                  <div>
                    <div class="font-weight-medium">{{ property.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ property.bookings }} bookings</div>
                  </div>
                  <div class="text-success font-weight-bold">${{ property.revenue }}</div>
                </div>
              </div>
            </DashboardCard>
          </v-col>

          <v-col cols="12" md="6">
            <DashboardCard icon="mdi-account-group" title="Cleaner Performance">
              <div v-if="topCleaners.length === 0" class="text-center py-4">
                <v-icon color="grey-lighten-1" size="48">mdi-account-search</v-icon>
                <p class="text-body-2 text-medium-emphasis mt-2">No cleaner data available</p>
              </div>
              <div v-else>
                <div
                  v-for="cleaner in topCleaners"
                  :key="cleaner.name"
                  class="d-flex justify-space-between align-center py-2 border-b"
                >
                  <div>
                    <div class="font-weight-medium">{{ cleaner.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ cleaner.completed }} completed</div>
                  </div>
                  <div class="text-info font-weight-bold">{{ cleaner.rating }}/5</div>
                </div>
              </div>
            </DashboardCard>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import DashboardCard from '@/components/dumb/shared/DashboardCard.vue'
  import StatCard from '@/components/dumb/shared/StatCard.vue'
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
