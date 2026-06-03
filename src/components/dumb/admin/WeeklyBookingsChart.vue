<template>
  <v-card class="h-100">
    <v-card-text class="pa-5">
      <h3 class="text-h6 font-weight-bold mb-4">
        Bookings This Week
      </h3>

      <div
        v-if="dailyCounts.length === 0"
        class="text-center text-medium-emphasis py-8"
      >
        No booking data available
      </div>

      <div
        v-else
        class="chart-container"
      >
        <div
          v-for="item in dailyCounts"
          :key="item.day"
          class="chart-row"
        >
          <div class="chart-label text-caption text-medium-emphasis">
            {{ item.day }}
          </div>

          <div class="chart-bar-track">
            <div
              class="chart-bar"
              :style="{
                width: barWidth(item.count),
                backgroundColor: item.color,
              }"
            />
          </div>

          <div class="chart-value text-body-2 font-weight-bold">
            {{ item.count }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    dailyCounts: Array<{ day: string, count: number, color: string }>
  }>()

  const maxCount = computed(() => {
    if (props.dailyCounts.length === 0) return 1
    return Math.max(...props.dailyCounts.map(d => d.count), 1)
  })

  function barWidth (count: number): string {
    return `${(count / maxCount.value) * 100}%`
  }
</script>
