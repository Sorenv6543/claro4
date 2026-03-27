<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" size="20">mdi-broom</v-icon>
      Cleaning Status
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-0">
      <div v-if="cleanings.length === 0" class="text-center text-medium-emphasis py-6">
        <v-icon class="mb-2" size="48">mdi-check-circle-outline</v-icon>
        <div class="text-body-2">No upcoming cleanings this week</div>
      </div>

      <v-table v-else density="comfortable" hover>
        <thead>
          <tr>
            <th class="text-left">Property</th>
            <th class="text-left">Next Cleaning</th>
            <th class="text-left">Cleaner</th>
            <th class="text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cleaning, index) in cleanings" :key="index">
            <td>
              <div class="d-flex align-center ga-2">
                <div
                  class="color-dot flex-shrink-0"
                  :style="{ background: cleaning.propertyColor }"
                />
                <span class="text-body-2">{{ cleaning.property }}</span>
              </div>
            </td>
            <td>
              <span class="text-body-2">{{ formatDate(cleaning.nextDate) }}</span>
            </td>
            <td>
              <span class="text-body-2" :class="{ 'text-medium-emphasis': cleaning.cleanerName === 'Unassigned' }">
                {{ cleaning.cleanerName }}
              </span>
            </td>
            <td>
              <v-chip
                :color="statusColor(cleaning.status)"
                size="small"
                variant="tonal"
              >
                {{ formatStatus(cleaning.status) }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  interface CleaningInfo {
    property: string
    propertyColor: string
    nextDate: string
    cleanerName: string
    status: string
  }

  import { formatStatus, getBookingStatusColor as statusColor } from '@/utils/constants'

  defineProps<{
    cleanings: CleaningInfo[]
  }>()

  function formatDate (dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
</script>

<style scoped>
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
