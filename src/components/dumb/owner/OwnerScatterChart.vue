<template>
  <v-card>
    <v-card-title class="owner-chart__title">
      <span>{{ title }}</span>
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>
    <v-card-text class="owner-chart__body">
      <div :style="{ height: `${height}px` }">
        <Scatter :data="data" :options="mergedOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { ChartData, ChartOptions } from 'chart.js'
  import { computed } from 'vue'
  import { Scatter } from 'vue-chartjs'
  import { CHART_GRID_COLOR } from '@/plugins/chartjs'

  interface Props {
    title: string
    data: ChartData<'scatter'>
    options?: ChartOptions<'scatter'>
    height?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    options: undefined,
    height: 300,
  })

  const mergedOptions = computed<ChartOptions<'scatter'>>(() => ({
    elements: {
      point: { radius: 5, hoverRadius: 7 },
    },
    scales: {
      x: { grid: { color: CHART_GRID_COLOR }, border: { display: false } },
      y: { grid: { color: CHART_GRID_COLOR }, border: { display: false } },
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
