<template>
  <v-card>
    <v-card-title class="owner-chart__title">
      <span>{{ title }}</span>
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>
    <v-card-text class="owner-chart__body">
      <div :style="{ height: `${height}px` }">
        <Bar :data="data" :options="mergedOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { ChartData, ChartOptions } from 'chart.js'
  import { computed } from 'vue'
  import { Bar } from 'vue-chartjs'
  import { CHART_GRID_COLOR } from '@/plugins/chartjs'

  interface Props {
    title: string
    data: ChartData<'bar'>
    options?: ChartOptions<'bar'>
    height?: number
    horizontal?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    options: undefined,
    height: 300,
    horizontal: false,
  })

  const mergedOptions = computed<ChartOptions<'bar'>>(() => ({
    indexAxis: props.horizontal ? 'y' as const : 'x' as const,
    elements: {
      bar: { borderRadius: 4 },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
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
