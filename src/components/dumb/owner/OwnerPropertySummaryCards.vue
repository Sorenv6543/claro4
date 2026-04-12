<template>
  <DashboardCard icon="mdi-home-group" title="Property Summary">
      <div v-if="properties.length === 0" class="text-center text-medium-emphasis py-6">
        <v-icon class="mb-2" size="48">mdi-home-plus-outline</v-icon>
        <div class="text-body-2">No properties yet</div>
      </div>

      <div v-else class="d-flex flex-column ga-3">
        <div
          v-for="(property, index) in properties"
          :key="index"
          class="property-row d-flex align-center ga-3 pa-3"
        >
          <!-- Color dot -->
          <div
            class="color-dot flex-shrink-0"
            :style="{ background: property.color }"
          />

          <!-- Property info -->
          <div class="flex-grow-1 overflow-hidden">
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ property.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              <span v-if="property.nextBooking">
                Next: {{ formatDate(property.nextBooking) }}
              </span>
              <span v-else>No upcoming bookings</span>
            </div>
          </div>

          <!-- Occupancy bar -->
          <div class="occupancy-section text-right flex-shrink-0" style="width: 80px">
            <div class="text-caption text-medium-emphasis mb-1">{{ property.occupancyRate }}%</div>
            <v-progress-linear
              :color="occupancyColor(property.occupancyRate)"
              height="6"
              :model-value="property.occupancyRate"
              rounded
            />
          </div>
        </div>
      </div>
  </DashboardCard>
</template>

<script setup lang="ts">
  import DashboardCard from '@/components/dumb/shared/DashboardCard.vue'

  interface PropertySummary {
    name: string
    color: string
    nextBooking: string | null
    occupancyRate: number
  }

  defineProps<{
    properties: PropertySummary[]
  }>()

  function formatDate (dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function occupancyColor (rate: number): string {
    if (rate >= 70) return 'success'
    if (rate >= 40) return 'primary'
    return 'warning'
  }
</script>

<style scoped>
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.property-row {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: var(--claro-radius-sm, 2px);
  transition: background-color 0.15s ease;
}

.property-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>
