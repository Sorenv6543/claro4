<template>
  <v-card>
    <v-card-title class="owner-chart__title">
      <span>{{ title }}</span>
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>
    <v-card-text class="owner-chart__body">
      <div :style="{ height: `${height}px` }">
        <Radar :data="data" :options="mergedOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Radar } from 'vue-chartjs'
  import type { ChartData, ChartOptions } from 'chart.js'
  import { CHART_GRID_COLOR } from '@/plugins/chartjs'

  interface Props {
    title: string
    data: ChartData<'radar'>
    options?: ChartOptions<'radar'>
    height?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    options: undefined,
    height: 300,
  })

  const mergedOptions = computed<ChartOptions<'radar'>>(() => ({
    scales: {
      r: {
        angleLines: { color: CHART_GRID_COLOR },
        grid: { color: CHART_GRID_COLOR },
        pointLabels: { font: { size: 12 } },
        ticks: { display: false },
      },
    },
    ...props.options,
  }))
</script>

<style scoped>
.owner-chart__title {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: var(--claro-font-weight-semibold);
}

.owner-chart__body {
  padding-top: 0 !important;
}
</style>
