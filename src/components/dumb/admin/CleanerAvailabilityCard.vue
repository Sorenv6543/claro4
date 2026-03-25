<template>
  <v-card class="h-100">
    <v-card-text class="pa-5">
      <h3 class="text-h6 font-weight-bold mb-4">
        Cleaner Availability
      </h3>

      <div
        v-if="cleaners.length === 0"
        class="text-center text-medium-emphasis py-8"
      >
        <v-icon
          color="grey-lighten-1"
          size="40"
        >
          mdi-account-hard-hat
        </v-icon>
        <p class="text-body-2 mt-2">
          No cleaner data available
        </p>
      </div>

      <div
        v-else
        class="cleaners-grid"
      >
        <div
          v-for="(cleaner, index) in cleaners"
          :key="index"
          class="cleaner-item d-flex flex-column align-center"
        >
          <v-progress-circular
            :color="utilizationColor(cleaner)"
            :model-value="utilizationPercent(cleaner)"
            :size="64"
            :width="6"
          >
            <span class="text-caption font-weight-bold">
              {{ cleaner.assigned }}
            </span>
          </v-progress-circular>
          <div class="text-caption font-weight-medium mt-2 text-center text-truncate cleaner-name">
            {{ cleaner.name }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ cleaner.assigned }}/{{ cleaner.total }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  defineProps<{
    cleaners: Array<{ name: string, assigned: number, total: number }>
  }>()

  function utilizationPercent (cleaner: { assigned: number, total: number }): number {
    if (cleaner.total === 0) return 0
    return Math.round((cleaner.assigned / cleaner.total) * 100)
  }

  function utilizationColor (cleaner: { assigned: number, total: number }): string {
    const pct = utilizationPercent(cleaner)
    if (pct >= 80) return 'error'
    if (pct >= 50) return 'warning'
    return 'success'
  }
</script>

<style scoped>
.cleaners-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.cleaner-item {
  min-width: 80px;
}

.cleaner-name {
  max-width: 80px;
}
</style>
